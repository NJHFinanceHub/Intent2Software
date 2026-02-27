import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  Conversation,
  AIProvider,
  AIConfig,
  ConversationContext,
  PlatformError,
  ErrorCode
} from '@intent-platform/shared';
import { logger } from '../utils/logger';
import { extractKeywords } from '@intent-platform/shared';

interface AIResponse {
  content: string;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  readyToGenerate: boolean;
  context: Partial<ConversationContext>;
}

export class AIProviderService {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize providers if API keys are available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async processConversation(conversation: Conversation, aiConfig?: AIConfig): Promise<AIResponse> {
    const provider = aiConfig?.provider || (process.env.AI_PROVIDER as AIProvider) || AIProvider.ANTHROPIC;

    logger.info(`Processing conversation with ${provider}`);

    try {
      switch (provider) {
        case AIProvider.ANTHROPIC:
          return await this.processWithAnthropic(conversation, aiConfig);
        case AIProvider.OPENAI:
          return await this.processWithOpenAI(conversation, aiConfig);
        case AIProvider.MOCK:
          return this.processWithMock(conversation);
        default:
          throw new PlatformError(
            `Unsupported AI provider: ${provider}`,
            ErrorCode.AI_PROVIDER_ERROR,
            400
          );
      }
    } catch (error: any) {
      logger.error('AI processing error:', error);
      throw new PlatformError(
        `AI provider error: ${error.message}`,
        ErrorCode.AI_PROVIDER_ERROR,
        500,
        error
      );
    }
  }

  private async processWithAnthropic(conversation: Conversation, aiConfig?: AIConfig): Promise<AIResponse> {
    if (!this.anthropic && !aiConfig?.apiKey) {
      throw new PlatformError(
        'Anthropic API key not configured',
        ErrorCode.AI_PROVIDER_ERROR,
        400
      );
    }

    const client = aiConfig?.apiKey
      ? new Anthropic({ apiKey: aiConfig.apiKey })
      : this.anthropic!;

    const systemPrompt = this.buildSystemPrompt(conversation.context);
    const messages = conversation.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const response = await client.messages.create({
      model: aiConfig?.model || 'claude-3-5-sonnet-20241022',
      max_tokens: aiConfig?.maxTokens || 4096,
      temperature: aiConfig?.temperature || 0.7,
      system: systemPrompt,
      messages
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    return this.parseAIResponse(content, conversation.context);
  }

  private async processWithOpenAI(conversation: Conversation, aiConfig?: AIConfig): Promise<AIResponse> {
    if (!this.openai && !aiConfig?.apiKey) {
      throw new PlatformError(
        'OpenAI API key not configured',
        ErrorCode.AI_PROVIDER_ERROR,
        400
      );
    }

    const client = aiConfig?.apiKey
      ? new OpenAI({ apiKey: aiConfig.apiKey })
      : this.openai!;

    const systemPrompt = this.buildSystemPrompt(conversation.context);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
    ];

    const response = await client.chat.completions.create({
      model: aiConfig?.model || 'gpt-4-turbo-preview',
      messages,
      max_tokens: aiConfig?.maxTokens || 4096,
      temperature: aiConfig?.temperature || 0.7
    });

    const content = response.choices[0]?.message?.content || '';

    return this.parseAIResponse(content, conversation.context);
  }

  private processWithMock(conversation: Conversation): AIResponse {
    const lastMessage = conversation.messages[conversation.messages.length - 1];

    // Simple mock logic for testing
    if (conversation.context.stage === 'initial') {
      return {
        content: "Thank you for describing your project! To help me create the best solution, I have a few clarifying questions:\n\n1. What is your preferred tech stack?\n2. Do you need user authentication?\n3. What's the expected scale (users per day)?\n\nPlease answer these questions so I can design the perfect solution for you.",
        requiresClarification: true,
        clarificationQuestions: [
          'What is your preferred tech stack?',
          'Do you need user authentication?',
          'What is the expected scale?'
        ],
        readyToGenerate: false,
        context: {
          stage: 'clarifying',
          extractedRequirements: extractKeywords(lastMessage.content),
          clarificationNeeded: ['tech_stack', 'auth', 'scale']
        }
      };
    }

    if (conversation.context.stage === 'clarifying') {
      return {
        content: "Perfect! I now have all the information I need. I'll create:\n\n" +
                 "- A React frontend with modern UI\n" +
                 "- A Node.js/Express backend with REST API\n" +
                 "- PostgreSQL database\n" +
                 "- User authentication with JWT\n" +
                 "- Docker deployment configuration\n\n" +
                 "Ready to generate your project?",
        requiresClarification: false,
        readyToGenerate: true,
        context: {
          stage: 'planning'
        }
      };
    }

    return {
      content: "I'm ready to generate your project. Please confirm to proceed.",
      requiresClarification: false,
      readyToGenerate: true,
      context: {}
    };
  }

  private buildSystemPrompt(context: ConversationContext): string {
    return `You are an expert software architect and developer assistant. Your role is to help users define their software project requirements and guide them through the planning process.

Current conversation stage: ${context.stage}
Extracted requirements so far: ${context.extractedRequirements.join(', ') || 'none'}

Your responsibilities:
1. Understand the user's intent by asking clarifying questions
2. Extract specific requirements from their descriptions
3. Identify technical constraints and preferences
4. Suggest appropriate technology stacks
5. Ensure all critical decisions are made before code generation

Guidelines:
- Ask focused, specific questions
- Avoid technical jargon unless the user demonstrates technical knowledge
- Suggest best practices and industry standards
- Be concise but thorough
- When you have enough information, summarize the plan and ask for confirmation

Important: Your responses should include clear indicators:
- If you need more information, explicitly state what clarification is needed
- When ready to generate code, clearly state "READY_TO_GENERATE" in your response
- Extract and list key requirements in your responses`;
  }

  private parseAIResponse(content: string, currentContext: ConversationContext): AIResponse {
    const requiresClarification = content.toLowerCase().includes('question') ||
                                  content.toLowerCase().includes('clarify') ||
                                  content.toLowerCase().includes('need to know');

    const readyToGenerate = content.includes('READY_TO_GENERATE') ||
                           (content.toLowerCase().includes('ready') &&
                            content.toLowerCase().includes('generate'));

    // Extract questions (simple heuristic)
    const questionMatches = content.match(/\d+\.\s+([^?]+\?)/g);
    const clarificationQuestions = questionMatches || [];

    // Extract requirements from the response
    const keywords = extractKeywords(content);
    const newRequirements = [
      ...currentContext.extractedRequirements,
      ...keywords
    ].filter((item, index, self) => self.indexOf(item) === index);

    const newStage = readyToGenerate ? 'planning' :
                    requiresClarification ? 'clarifying' :
                    currentContext.stage;

    return {
      content,
      requiresClarification,
      clarificationQuestions: clarificationQuestions.length > 0 ? clarificationQuestions : undefined,
      readyToGenerate,
      context: {
        stage: newStage,
        extractedRequirements: newRequirements
      }
    };
  }
}
