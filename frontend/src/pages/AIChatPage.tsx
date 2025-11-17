import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Send,
  Bot,
  User,
  Plus,
  MessageCircle,
  BookOpen,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  MoreVertical
} from 'lucide-react';
import { currentUser } from '../lib/mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  courseId?: string;
  courseName?: string;
}

export function AIChatPage() {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Tutor của EduLearn. Tôi có thể giúp bạn giải đáp thắc mắc về các khóa học, hỗ trợ học tập, và tư vấn lộ trình. Bạn cần hỗ trợ gì không?',
      timestamp: new Date()
    }
  ]);

  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'React Hooks là gì?',
      lastMessage: 'React Hooks cho phép bạn sử dụng state và các tính năng React khác mà không cần viết class...',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      courseId: '1',
      courseName: 'Lập trình Web Full-Stack'
    },
    {
      id: '2',
      title: 'Cách thiết kế UI/UX tốt',
      lastMessage: 'Để thiết kế UI/UX tốt, bạn cần chú ý đến user research, wireframing...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      courseId: '2',
      courseName: 'Thiết kế UI/UX với Figma'
    },
    {
      id: '3',
      title: 'Machine Learning cơ bản',
      lastMessage: 'Machine Learning là một nhánh của AI, cho phép máy tính học từ dữ liệu...',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }
  ]);

  const suggestedQuestions = [
    'React Hooks là gì và cách sử dụng?',
    'Giải thích về async/await trong JavaScript',
    'Tôi nên học gì tiếp theo?',
    'Làm sao để debug hiệu quả?'
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

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
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Đây là câu trả lời mẫu cho câu hỏi: "${currentInput}". Trong môi trường thực tế, đây sẽ là response từ OpenAI API.\n\nCâu trả lời sẽ chi tiết, có cấu trúc rõ ràng và bao gồm ví dụ cụ thể. AI sẽ phân tích ngữ cảnh của khóa học bạn đang học để đưa ra câu trả lời phù hợp nhất.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-2 bg-background min-h-screen">
      <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-6rem)]">
        {/* Sidebar - Conversations History */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="h-full flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-5 w-5" />
                  Lịch sử chat
                </CardTitle>
                <Button size="icon" variant="ghost" className="text-white hover:bg-[#1F1F1F]">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className="p-3 rounded-lg hover:bg-[#1F1F1F] cursor-pointer border border-transparent hover:border-[#2D2D2D] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-sm line-clamp-1 text-white">{conv.title}</p>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-white">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                      {conv.courseName && (
                        <Badge variant="outline" className="text-xs mb-1 border-[#2D2D2D] text-gray-300">
                          {conv.courseName}
                        </Badge>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-2">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {conv.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
            {/* Chat Header */}
            <CardHeader className="border-b border-[#2D2D2D]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">AI Tutor</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-gray-400">
                      <Sparkles className="h-3 w-3" />
                      Powered by GPT-4
                    </CardDescription>
                  </div>
                </div>
                <Tabs defaultValue="general" className="w-auto">
                  <TabsList className="bg-[#1A1A1A] border border-[#2D2D2D]">
                    <TabsTrigger value="general" className="text-xs !text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]">Tổng quát</TabsTrigger>
                    <TabsTrigger value="course" className="text-xs !text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]">
                      <BookOpen className="h-3 w-3 mr-1" />
                      Khóa học
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 py-6">
                <div className="space-y-6">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className="flex-shrink-0">
                        {message.role === 'assistant' ? (
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                            <Bot className="h-5 w-5 text-white" />
                          </AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={currentUser.avatar} />
                            <AvatarFallback className="bg-blue-600">
                              <User className="h-5 w-5 text-white" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>

                      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                        <div
                          className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-[#1F1F1F] text-gray-200 border border-[#2D2D2D]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Message Actions (only for AI messages) */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F]">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Hữu ích
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F]">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Không hữu ích
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F]">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <Avatar className="flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600">
                          <Bot className="h-5 w-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-[#1F1F1F] rounded-2xl px-4 py-3 border border-[#2D2D2D]">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Questions (shown when no messages) */}
                {messages.length === 1 && (
                  <div className="mt-8">
                    <p className="text-sm text-gray-400 mb-4">Câu hỏi gợi ý:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-auto py-3 px-4 text-left justify-start whitespace-normal border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F] hover:text-white"
                          onClick={() => handleSuggestedQuestion(question)}
                        >
                          <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                          <span className="text-sm">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="border-t border-[#2D2D2D] p-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập câu hỏi của bạn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AI Tutor có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
