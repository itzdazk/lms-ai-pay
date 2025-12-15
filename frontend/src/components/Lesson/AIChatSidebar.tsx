import { useEffect, useState, useRef } from 'react';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { X, Send, Bot, User, ThumbsUp, ThumbsDown, Copy, MessageCircle, BookOpen, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: number;
  courseTitle?: string;
  lessonId?: number;
  lessonTitle?: string;
  isVideoFullscreen?: boolean; // Whether video is in fullscreen mode
}

export function AIChatSidebar({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  isVideoFullscreen = false,
}: AIChatSidebarProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === 'dark';
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'general' | 'course'>('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Tutor. Tôi có thể giúp bạn giải đáp thắc mắc về bài học này, hỗ trợ học tập, và tư vấn lộ trình. Bạn cần hỗ trợ gì không?',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to get avatar URL
  const getAvatarUrl = (avatarUrl?: string | null, avatar?: string | null) => {
    const url = avatarUrl || avatar;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  };

  // Get user avatar URL
  const userAvatarUrl = getAvatarUrl(user?.avatarUrl, user?.avatar);
  
  // Get user initials for fallback
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  // Don't prevent body scroll - allow interaction with other elements

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Đây là câu trả lời mẫu cho câu hỏi: "${currentInput}". Trong môi trường thực tế, đây sẽ là response từ OpenAI API.\n\nCâu trả lời sẽ chi tiết, có cấu trúc rõ ràng và bao gồm ví dụ cụ thể. AI sẽ phân tích ngữ cảnh của khóa học và bài học bạn đang học để đưa ra câu trả lời phù hợp nhất.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };


  const sidebarContent = (
    <div
      className={`fixed top-0 right-0 h-full transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        width: '385px',
        maxWidth: isVideoFullscreen ? '385px' : '90vw',
        pointerEvents: isOpen ? 'auto' : 'none',
        zIndex: isVideoFullscreen ? 80 : 80,
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
      }}
    >
      <div
        className={`h-full flex flex-col ${
          isDark ? 'bg-[#1A1A1A] border-l border-[#2D2D2D]' : 'bg-white border-l border-gray-200'
        }`}
        style={{
          zIndex: isVideoFullscreen ? 2147483647 : 'inherit',
        }}
      >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${
              isDark ? 'border-[#2D2D2D]' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Tutor
              </h3>
            </div>
            <DarkOutlineButton
              size="icon"
              onClick={onClose}
              title="Đóng"
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </DarkOutlineButton>
          </div>


          {/* Course/Lesson Info */}
          {(courseTitle || lessonTitle) && (
            <div
              className={`px-4 py-2 border-b ${
                isDark ? 'border-[#2D2D2D] bg-[#1F1F1F]' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {courseTitle && (
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="font-medium">Khóa học:</span> {courseTitle}
                </p>
              )}
              {lessonTitle && (
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="font-medium">Bài học:</span> {lessonTitle}
                </p>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-4 py-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="flex-shrink-0 h-6 w-6">
                      {message.role === 'assistant' ? (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                          <Bot className="h-3 w-3 text-white" />
                        </AvatarFallback>
                      ) : (
                        <>
                          {userAvatarUrl && (
                            <AvatarImage 
                              src={userAvatarUrl} 
                              alt={user?.fullName || user?.email || 'User'} 
                            />
                          )}
                          <AvatarFallback className={isDark ? 'bg-blue-600' : 'bg-blue-500'}>
                            {userInitials ? (
                              <span className="text-[10px] text-white">
                                {userInitials}
                              </span>
                            ) : (
                              <User className="h-3 w-3 text-white" />
                            )}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div
                        className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : isDark
                            ? 'bg-[#1F1F1F] text-gray-200 border border-[#2D2D2D]'
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-base">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Message Actions (only for AI messages) */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-5 px-1.5 text-xs ${
                              isDark
                                ? 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <ThumbsUp className="h-2.5 w-2.5 mr-0.5" />
                            <span className="text-[10px]">Hữu ích</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-5 px-1.5 text-xs ${
                              isDark
                                ? 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <ThumbsDown className="h-2.5 w-2.5 mr-0.5" />
                            <span className="text-[10px]">Không hữu ích</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-5 px-1.5 ${
                              isDark
                                ? 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="flex-shrink-0 h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                        <Bot className="h-3 w-3 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-2xl px-3 py-2 border ${
                        isDark ? 'bg-[#1F1F1F] border-[#2D2D2D]' : 'bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex gap-1">
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            isDark ? 'bg-gray-500' : 'bg-gray-400'
                          }`}
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            isDark ? 'bg-gray-500' : 'bg-gray-400'
                          }`}
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            isDark ? 'bg-gray-500' : 'bg-gray-400'
                          }`}
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div
            className={`border-t p-3 ${
              isDark ? 'border-[#2D2D2D] bg-[#1F1F1F]' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex gap-2 items-end mb-2">
              <Textarea
                ref={textareaRef}
                placeholder="Nhập câu hỏi của bạn..."
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  // Auto-resize textarea to fit content
                  const textarea = e.target;
                  textarea.style.height = 'auto';
                  textarea.style.height = `${textarea.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                spellCheck={false}
                rows={1}
                className={`flex-1 resize-none min-h-[36px] overflow-hidden ${
                  isDark
                    ? 'bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                }`}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 h-[36px] w-[36px] p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`h-7 px-2 text-xs justify-between w-[120px] cursor-pointer flex items-center rounded-md border transition-colors ${
                      isDark
                        ? 'border-[#2D2D2D] text-white bg-black hover:bg-[#1F1F1F]'
                        : 'border-gray-300 text-black bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center">
                      {chatMode === 'general' ? (
                        <>
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Tổng quát
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-3 w-3 mr-1" />
                          Khóa học
                        </>
                      )}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className={isDark ? 'bg-[#1F1F1F] border-[#2D2D2D]' : 'bg-white border-gray-200'}
                >
                  <DropdownMenuItem
                    onClick={() => setChatMode('general')}
                    className={`text-xs ${
                      isDark
                        ? 'text-gray-300 hover:bg-[#2D2D2D] hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    } ${chatMode === 'general' ? 'bg-[#2D2D2D]' : ''}`}
                  >
                    <MessageCircle className="h-3 w-3 mr-2" />
                    Tổng quát
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setChatMode('course')}
                    className={`text-xs ${
                      isDark
                        ? 'text-gray-300 hover:bg-[#2D2D2D] hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    } ${chatMode === 'course' ? 'bg-[#2D2D2D]' : ''}`}
                  >
                    <BookOpen className="h-3 w-3 mr-2" />
                    Khóa học
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
      </div>
    </div>
  );

  // When fullscreen with sidebar open, VideoPlayer uses custom fullscreen (CSS-based)
  // so we don't need portal - sidebar can render normally
  // Normal rendering
  if (!isOpen) return null;
  return sidebarContent;
}

