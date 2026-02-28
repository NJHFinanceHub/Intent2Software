import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Message, MessageRole } from '@intent-platform/shared';
import { conversationsApi } from '../api/client';
import { useStore } from '../store';

interface ChatPanelProps {
  projectId: string;
}

export default function ChatPanel({ projectId }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentConversation,
    setCurrentConversation,
    addMessage,
    isChatLoading,
    setIsChatLoading
  } = useStore();

  useEffect(() => {
    loadConversation();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages.length]);

  const loadConversation = async () => {
    try {
      const conversation = await conversationsApi.getByProjectId(projectId);
      setCurrentConversation(conversation);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: input,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInput('');
    setIsChatLoading(true);

    try {
      const response = await conversationsApi.sendMessage({
        projectId,
        message: input
      });

      addMessage(response.message);

      // Check if ready to generate
      if (response.readyToGenerate) {
        // Show generate button or auto-trigger generation
        console.log('Ready to generate project');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: MessageRole.ASSISTANT,
        content: 'Sorry, something went wrong processing your message. Please check that the AI provider is configured correctly and try again.',
        timestamp: new Date()
      };
      addMessage(errorMessage);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-200 border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation?.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-accent-light" />
            </div>
            <p className="text-sm text-slate-400">
              Describe your project idea and I'll help you build it.
            </p>
          </div>
        )}
        {currentConversation?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 animate-fade-in ${
              message.role === MessageRole.USER ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              message.role === MessageRole.USER
                ? 'bg-accent/20'
                : 'bg-white/5'
            }`}>
              {message.role === MessageRole.USER ? (
                <User className="w-3.5 h-3.5 text-accent-light" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                message.role === MessageRole.USER
                  ? 'bg-accent text-white'
                  : 'bg-white/5 text-slate-200 border border-border'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <span className={`text-[10px] mt-1.5 block ${
                message.role === MessageRole.USER ? 'text-white/50' : 'text-slate-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="bg-white/5 border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Describe your software project..."
            className="flex-1 resize-none bg-surface-300 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
            rows={2}
            disabled={isChatLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            aria-label="Send message"
            className="self-end bg-accent hover:bg-accent-dark text-white p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent/20 disabled:shadow-none transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
