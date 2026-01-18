// src/components/AI/CourseAdvisor.tsx
import { useState, useEffect, useRef } from 'react';
import { Send, Star, Users, Clock, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import apiClient from '../../lib/api/client';
import { formatDuration } from '../../lib/courseUtils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: any[];
}

interface Course {
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  level?: string;
  price?: number;
  discountPrice?: number;
  rating?: number;
  ratingCount?: number;
  enrolledCount?: number;
  duration?: number;
  lessons?: number;
  description?: string;
  thumbnail?: string;
  instructor?: any;
}

interface CourseAdvisorProps {
  onClose?: () => void;
}

export function CourseAdvisor({ onClose: _onClose }: CourseAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle start conversation
  const handleStartConversation = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/ai/advisor/conversations', {
        title: `Tư vấn khóa học - ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
        mode: 'advisor',
      });

      const convId = response.data?.data?.id;
      if (convId) {
        setConversationId(convId);
        setHasStarted(true);

        // Add welcome message from AI
        setMessages([
          {
            id: Date.now(),
            role: 'assistant',
            content: '👋 Xin chào! Tôi là Trợ lý AI, sẵn sàng giúp bạn tìm khóa học phù hợp nhất.\n\n🎯 Hãy cho tôi biết:\n- Bạn muốn học về lĩnh vực gì?\n- Level hiện tại của bạn ra sao?\n- Bạn có bao nhiêu thời gian để học?',
            timestamp: new Date(),
            sources: [],
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const sources = aiMessageData?.metadata?.sources || [];

      if (aiText) {
        const aiMessage: Message = {
          id: aiMessageData.id || Date.now() + 1,
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
          sources: sources,
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

  // Course recommendation card component
  const CourseCard = ({ course }: { course: Course }) => {
    const finalPrice = course.discountPrice ? course.discountPrice : (course.price || 0);
    const priceDisplay = finalPrice > 0 ? `${Number(finalPrice).toLocaleString('vi-VN')}đ` : 'Miễn phí';
    const courseLink = course.courseSlug ? `/courses/${course.courseSlug}` : `/courses/${course.courseId}`;
    const instructorName = typeof course.instructor === 'string'
      ? course.instructor
      : (course.instructor?.fullName || course.instructor?.name || '');
    
    return (
      <a 
        href={courseLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-3 cursor-pointer"
      >
        <div className="flex gap-3">
          {course.thumbnail && (
            <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-700">
              <img 
                src={course.thumbnail} 
                alt={course.courseTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white truncate">{course.courseTitle}</h4>
              {course.level && (
                <p className="text-xs text-gray-400 mt-1">{course.level}</p>
              )}
              {course.description && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">{course.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {course.rating && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    <span>{course.rating}/5</span>
                  </div>
                )}
                {course.ratingCount && (
                  <span className="text-[10px] text-gray-500">({course.ratingCount} đánh giá)</span>
                )}
                {course.enrolledCount && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3 w-3" />
                    <span>{course.enrolledCount}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(course.duration / 60)}</span>
                  </div>
                )}
                {course.lessons && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <BookOpen className="h-3 w-3" />
                    <span>{course.lessons} bài học</span>
                  </div>
                )}
              </div>
              {instructorName && (
                <p className="text-[11px] text-gray-500 mt-1 truncate">Giảng viên: {instructorName}</p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-400">{priceDisplay}</span>
              <span className="text-xs text-blue-400 font-medium">Xem chi tiết →</span>
            </div>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="w-full h-full flex flex-col ">
      {/* Start Screen */}
      {!hasStarted ? (
        <div className="flex-1 flex items-center justify-center bg-[#1A1A1A]">
          <div className="text-center space-y-6 px-6">
            <div className="relative inline-block">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto">
                <span className="text-4xl">🤖</span>
              </div>
              <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-[#1A1A1A]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Trợ lý AI tư vấn khóa học</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Tôi sẽ giúp bạn tìm khóa học phù hợp với nhu cầu và mục tiêu học tập của bạn
              </p>
            </div>

            <Button
              onClick={handleStartConversation}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-2.5 rounded-full font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang khởi tạo...</span>
                </div>
              ) : (
                'Bắt đầu'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-hidden bg-[#1A1A1A]">
            <ScrollArea className="h-full">
              <div className="px-4 py-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="relative h-6 w-6">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
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

                    {/* Course Recommendations */}
                      {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                        <div className="mt-3 space-y-2">
                        {message.sources.map((source, idx) => (
                          <CourseCard key={idx} course={source} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="relative h-6 w-6">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
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
        </>
      )}
    </div>
  );
}