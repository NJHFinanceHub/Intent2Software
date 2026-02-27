import { useState, useEffect, useRef } from 'react';
import { Send, Loader } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === MessageRole.USER ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === MessageRole.USER
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <Loader className="w-5 h-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your software project..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isChatLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isChatLoading}
            className="self-end bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
