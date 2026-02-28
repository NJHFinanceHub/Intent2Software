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
  }, [currentConversation?.messages]);

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
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation?.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-sm text-zinc-400">
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
                ? 'bg-cyan-500/20'
                : 'bg-zinc-800'
            }`}>
              {message.role === MessageRole.USER ? (
                <User className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                message.role === MessageRole.USER
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <span className={`text-[10px] mt-1.5 block ${
                message.role === MessageRole.USER ? 'text-black/50' : 'text-zinc-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your software project..."
            className="flex-1 resize-none bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all"
            rows={2}
            disabled={isChatLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="self-end bg-cyan-500 hover:bg-cyan-400 text-black p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25 disabled:shadow-none transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
