// src/components/AI/CourseAdvisor.tsx
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import apiClient from '../../lib/api/client';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CourseAdvisorProps {
  onClose?: () => void;
}

export function CourseAdvisor({ onClose: _onClose }: CourseAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      try {
        // Always create a NEW advisor conversation
        // It will be saved and can be queried later via mode='advisor'
        const response = await apiClient.post('/ai/advisor/conversations', {
          title: `Tư vấn khóa học - ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
          mode: 'advisor', // Important: advisor mode
        });

        const convId = response.data?.data?.id;
        if (convId) {
          setConversationId(convId);

          // Add welcome message from AI
          setMessages([
            {
              id: Date.now(),
              role: 'assistant',
              content: '👋 Xin chào! Tôi là Trợ lý AI, sẵn sàng giúp bạn tìm khóa học phù hợp nhất.\n\n🎯 Hãy cho tôi biết:\n- Bạn muốn học về lĩnh vực gì?\n- Level hiện tại của bạn ra sao?\n- Bạn có bao nhiêu thời gian để học?',
              timestamp: new Date(),
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    };

    initConversation();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to advisor conversation
      const response = await apiClient.post(`/ai/advisor/conversations/${conversationId}/messages`, {
        message: currentInput,
        mode: 'advisor', // Important: advisor mode
      });

      const aiMessageData = response.data?.data?.aiMessage || response.data?.data?.ai_message;
      const aiText = aiMessageData?.message || aiMessageData?.text;

      if (aiText) {
        const aiMessage: Message = {
          id: aiMessageData.id || Date.now() + 1,
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: '😅 Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col ">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden bg-[#1A1A1A]">
        <ScrollArea className="h-full">
          <div className="px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative h-6 w-6">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                          <span className="text-xs">🤖</span>
                        </div>
                        <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border-2 border-black" />
                      </div>
                      <span className="text-[11px] text-gray-400">Trợ lý AI</span>
                    </div>
                  )}
                  
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1F1F1F] text-gray-200 border border-[#2D2D2D]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-xs leading-snug">{message.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="relative h-6 w-6">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                        <span className="text-xs">🤖</span>
                      </div>
                      <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border-2 border-black" />
                    </div>
                    <span className="text-[11px] text-gray-400">Trợ lý AI</span>
                  </div>
                  
                  <div className="inline-block bg-[#1F1F1F] border border-[#2D2D2D] rounded-2xl px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-[#2D2D2D] bg-[#1F1F1F] p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Nhập tin nhắn..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/50"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>  );
}