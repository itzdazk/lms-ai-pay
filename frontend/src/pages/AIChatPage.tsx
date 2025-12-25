import { useState, useEffect, useRef } from 'react';
import apiClient from '../lib/api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
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
  MoreVertical,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { AI_CONVERSATIONS_CHANGED, AI_MESSAGES_CHANGED, notifyConversationsChanged, notifyMessagesChanged } from '../lib/events/aiChatEvents';

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
  const { user } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'general' | 'course'>('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là Gia sư AI của EduLearn. Tôi có thể giúp bạn giải đáp thắc mắc về các khóa học, hỗ trợ học tập, và tư vấn lộ trình. Bạn cần hỗ trợ gì không?',
      timestamp: new Date()
    }
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [newConvTitle, setNewConvTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Resolve user avatar URL and initials
  const getAvatarUrl = (avatarUrl?: string | null, avatar?: string | null) => {
    const url = avatarUrl || avatar;
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const userAvatarUrl = getAvatarUrl((user as any)?.avatarUrl, (user as any)?.avatar);
  const userInitials = (user as any)?.fullName
    ? (user as any).fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  // Load user's conversations
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get('/ai/conversations');
        const convs = resp?.data?.data ?? [];
        const mapped = convs.map((c: any) => ({
          id: String(c.id),
          title: c.title,
          lastMessage: c.lastMessage || '',
          timestamp: c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(),
          courseId: c.courseId ?? c.course?.id,
          courseName: c.course?.title ?? c.course?.title,
        }));
        setConversations(mapped);
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    })();
  }, []);

  // Select an existing conversation and load its messages
  const handleSelectConversation = async (convId: string) => {
    try {
      setSelectedConversationId(convId);
      // Fetch messages
      const msgsResp = await apiClient.get(`/ai/conversations/${convId}/messages`);
      const msgs = msgsResp?.data?.data ?? [];
      const mapped: Message[] = msgs.map((m: any) => ({
        id: String(m.id),
        role: m.senderType === 'ai' ? 'assistant' : 'user',
        content: m.message,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped.length > 0 ? mapped : []);
      // On selecting an existing conversation, show the latest message at the bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      }, 50);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error('Failed to load messages for conversation', convId, err);
    }
  };

  // Create new conversation (persisted) and load its initial messages
  const handleNewConversation = async () => {
    try {
      const createResp = await apiClient.post('/ai/conversations', {
        title: 'Trò chuyện chung',
      });
      const convId = String(createResp?.data?.data?.id);
      if (!convId) throw new Error('Không thể tạo conversation');
      setSelectedConversationId(convId);
      notifyConversationsChanged(convId);

      // Load messages for the new conversation (will include AI greeting from backend)
      const msgsResp = await apiClient.get(`/ai/conversations/${convId}/messages`);
      const msgs = msgsResp?.data?.data ?? [];
      const mapped: Message[] = msgs.map((m: any) => ({
        id: String(m.id),
        role: m.senderType === 'ai' ? 'assistant' : 'user',
        content: m.message,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped);

      // Refresh conversations list so the new one appears
      await reloadConversations();
    } catch (err) {
      console.error('Failed to create and load new conversation', err);
    }
  };

  // Reload conversations list
  const reloadConversations = async () => {
    try {
      const resp = await apiClient.get('/ai/conversations');
      const convs = resp?.data?.data ?? [];
      const mapped = convs.map((c: any) => ({
        id: String(c.id),
        title: c.title,
        lastMessage: c.lastMessage || '',
        timestamp: c.lastMessageAt ? new Date(c.lastMessageAt) : new Date(),
        courseId: c.courseId ?? c.course?.id,
        courseName: c.course?.title ?? c.course?.title,
      }));
      setConversations(mapped);
    } catch (err) {
      console.error('Failed to reload conversations', err);
    }
  };

  // Rename conversation
  const handleRenameConversation = async (convId: string) => {
    const currentConv = conversations.find(c => c.id === convId);
    if (!currentConv) return;

    setRenamingConvId(convId);
    setNewConvTitle(currentConv.title);
    setIsRenameDialogOpen(true);
  };

  const submitRename = async () => {
    if (!renamingConvId || !newConvTitle.trim()) return;

    try {
      await apiClient.patch(`/ai/conversations/${renamingConvId}`, {
        title: newConvTitle.trim()
      });

      // Reload conversations list
      await reloadConversations();
      
      // Notify other components
      notifyConversationsChanged(renamingConvId);
      
      // Close dialog
      setIsRenameDialogOpen(false);
      setRenamingConvId(null);
      setNewConvTitle('');
    } catch (err) {
      console.error('Failed to rename conversation', err);
      alert('Không thể đổi tên cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string) => {
    setDeletingConvId(convId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingConvId) return;

    try {
      await apiClient.delete(`/ai/conversations/${deletingConvId}`);
      
      // If deleted conversation is currently selected, reset to greeting
      if (String(selectedConversationId) === String(deletingConvId)) {
        setSelectedConversationId(null);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Xin chào! Tôi là Gia sư AI của EduLearn. Tôi có thể giúp bạn giải đáp thắc mắc về các khóa học, hỗ trợ học tập, và tư vấn lộ trình. Bạn cần hỗ trợ gì không?',
          timestamp: new Date()
        }]);
      }

      // Reload conversations list
      await reloadConversations();
      
      // Notify other components
      notifyConversationsChanged();
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setDeletingConvId(null);
    } catch (err) {
      console.error('Failed to delete conversation', err);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  const suggestedQuestions = [
    'React Hooks là gì và cách sử dụng?',
    'Giải thích về async/await trong JavaScript',
    'Tôi nên học gì tiếp theo?',
    'Làm sao để debug hiệu quả?'
  ];

  const handleSendMessage = async () => {
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

    try {
      let convId = selectedConversationId;

      // Create new conversation if none is selected
      if (!convId) {
        const createResp = await apiClient.post('/ai/conversations', {
          title: currentInput.slice(0, 120),
        });
        convId = createResp?.data?.data?.id;
        if (!convId) throw new Error('Không thể tạo conversation');
        setSelectedConversationId(String(convId));
      }

      const resp = await apiClient.post(`/ai/conversations/${convId}/messages`, {
        message: currentInput,
        mode: selectedMode,
      });

      const payload = resp?.data?.data;
      const aiMsg = payload?.aiMessage ?? payload?.ai_message ?? null;
      const aiText = aiMsg?.message ?? aiMsg?.text ?? null;

      if (aiText) {
        const aiMessage: Message = {
          id: aiMsg.id?.toString() ?? (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        notifyMessagesChanged(String(convId));
        notifyConversationsChanged(String(convId));
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Không nhận được phản hồi từ server.',
          timestamp: new Date(),
        }]);
      }

      // Reload conversations to update lastMessageAt
      await reloadConversations();
    } catch (error) {
      console.error('AI chat error', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại sau.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  // Auto-scroll to newest message (user or AI)
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Listen to external conversation/message changes
  useEffect(() => {
    const onConversationsChanged = async (e: any) => {
      await reloadConversations();
      const convId = e?.detail?.convId;
      if (convId && String(selectedConversationId) === String(convId)) {
        // Refresh messages of current conversation
        await handleSelectConversation(String(convId));
      }
    };
    const onMessagesChanged = onConversationsChanged;
    window.addEventListener(AI_CONVERSATIONS_CHANGED, onConversationsChanged as any);
    window.addEventListener(AI_MESSAGES_CHANGED, onMessagesChanged as any);
    return () => {
      window.removeEventListener(AI_CONVERSATIONS_CHANGED, onConversationsChanged as any);
      window.removeEventListener(AI_MESSAGES_CHANGED, onMessagesChanged as any);
    };
  }, [selectedConversationId]);

  const conversationListContent = (
    <div className="space-y-2 w-full max-w-full overflow-hidden" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      {conversations.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Chưa có cuộc trò chuyện nào</p>
      ) : (
        conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => {
              handleSelectConversation(conv.id);
              setIsHistoryOpen(false);
            }}
            className={`flex items-center gap-2 p-3 cursor-pointer transition-colors rounded-none w-full overflow-hidden ${selectedConversationId === conv.id ? 'bg-blue-600/20 border border-blue-600' : 'border border-transparent hover:bg-[#1F1F1F]'}`}
          >
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-md flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                {conv.courseName ? <BookOpen className="h-4 w-4 text-white" /> : <MessageCircle className="h-4 w-4 text-white" />}
              </div>
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm text-white truncate flex-1">{conv.title}</p>
                <p className="text-xs text-gray-500 flex-shrink-0">{conv.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div className="mt-1 overflow-hidden">
                {conv.courseName && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 mb-1 border-[#2D2D2D] text-gray-300 max-w-full truncate block">{conv.courseName}</Badge>
                )}
                <p className="text-xs text-gray-500 line-clamp-1">{conv.lastMessage || '—'}</p>
              </div>
            </div>

            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-gray-400 hover:text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameConversation(conv.id);
                    }}
                    className="text-white hover:bg-[#2D2D2D] cursor-pointer"
                  >
                    Đổi tên
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}
      </div>
  );

  // Auto-scroll removed intentionally

  // Copy message to clipboard
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  };

  // Submit feedback for AI message
  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    try {
      await apiClient.post(`/ai/messages/${messageId}/feedback`, {
        isHelpful,
      });
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-1 min-h-0">
        <div className="lg:hidden mb-3">
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full bg-[#1A1A1A] border-[#2D2D2D] text-white hover:bg-[#1F1F1F]"
                title="Mở lịch sử chat"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Lịch sử chat
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[360px] bg-[#1A1A1A] border-[#2D2D2D] p-0">
              <SheetHeader className="px-4 pt-4 pb-2 pr-12 border-b border-[#2D2D2D]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-white" />
                    <SheetTitle className="text-base text-white">Lịch sử chat</SheetTitle>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-[#1F1F1F]"
                    onClick={() => handleNewConversation().then(() => setIsHistoryOpen(false))}
                    title="Tạo cuộc trò chuyện mới"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </SheetHeader>
              <div className="p-4 pt-3 h-[calc(100vh-5rem)]">
                <ScrollArea className="h-full pr-2">
                  {conversationListContent}
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="grid lg:grid-cols-4 gap-6 h-full">
        {/* Sidebar - Conversations History */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="h-full flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="h-5 w-5" />
                  Lịch sử chat
                </CardTitle>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-white hover:bg-[#1F1F1F]"
                  onClick={handleNewConversation}
                  title="Tạo cuộc trò chuyện mới"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-4 pt-0 max-w-full">
                <ScrollArea className="pr-4 h-[calc(100vh-13rem)] w-full">
                  <div className="w-full overflow-hidden" style={{ minWidth: 'auto', display: 'block' }}>
                    {conversationListContent}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
            {/* Chat Header */}
            <CardHeader className="border-b border-[#2D2D2D] py-2 px-3 !pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-[#1A1A1A]" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-white">Gia sư AI</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs text-gray-400">
                      <Sparkles className="h-2 w-2" />
                      Luôn sẵn sàng hỗ trợ
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
              <ScrollArea viewportRef={scrollViewportRef} className="h-[calc(100vh-18rem)]">
                <div className="px-6 py-6 space-y-6 overflow-y-auto h-full">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="relative h-6 w-6">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                                <Bot className="h-3 w-3 text-white" />
                              </div>
                              <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-[#1A1A1A]" />
                            </div>
                            <span className="text-[11px] text-gray-400">Gia sư AI</span>
                          </div>
                        )}
                        <div
                          className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-[#1F1F1F] text-gray-200 border border-[#2D2D2D]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-snug">{message.content}</p>
                          <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        {/* Message Actions (only for AI messages) */}
                        {message.role === 'assistant' && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                              onClick={() => handleFeedback(message.id, true)}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Hữu ích
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                              onClick={() => handleFeedback(message.id, false)}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Không hữu ích
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
                              onClick={() => handleCopyMessage(message.content)}
                              title="Sao chép"
                            >
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

                {/* Suggested Questions (shown when no messages) */}
                {messages.length === 1 && (
                  <div className="mt-8">
                    <p className="text-sm text-gray-400 mb-4">Câu hỏi gợi ý:</p>
                    <div className="grid grid-cols-2 gap-3">
                        {suggestedQuestions.map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="h-auto py-3 px-4 text-left justify-start whitespace-normal !bg-black border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F] hover:text-white"
                            onClick={() => handleSuggestedQuestion(question)}
                          >
                            <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                            <span className="text-sm">{question}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-[#2D2D2D] p-4">
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Nhập câu hỏi của bạn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
              <div className="mb-2 flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 px-3 text-xs justify-between w-[140px] cursor-pointer flex items-center rounded-md border transition-colors border-[#2D2D2D] text-white bg-black hover:bg-[#1F1F1F]"
                    >
                      <span className="flex items-center">
                        {selectedMode === 'general' ? (
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
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="bg-[#1F1F1F] border-[#2D2D2D]"
                  >
                    <DropdownMenuItem
                      onClick={() => setSelectedMode('general')}
                      className={`text-xs text-gray-300 hover:bg-[#2D2D2D] hover:text-white ${selectedMode === 'general' ? 'bg-[#2D2D2D]' : ''}`}
                    >
                      <MessageCircle className="h-3 w-3 mr-2" />
                      Tổng quát
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSelectedMode('course')}
                      className={`text-xs text-gray-300 hover:bg-[#2D2D2D] hover:text-white ${selectedMode === 'course' ? 'bg-[#2D2D2D]' : ''}`}
                    >
                      <BookOpen className="h-3 w-3 mr-2" />
                      Khóa học
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-xs text-gray-500">
                Gia sư AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
              </p>
            </div>
          </Card>
        </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Đổi tên cuộc trò chuyện</DialogTitle>
            <DialogDescription className="text-gray-400">
              Nhập tên mới cho cuộc trò chuyện của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="conv-title" className="text-white">
                Tên cuộc trò chuyện
              </Label>
              <Input
                id="conv-title"
                value={newConvTitle}
                onChange={(e) => setNewConvTitle(e.target.value)}
                className="bg-[#0F0F0F] border-[#2D2D2D] text-white"
                placeholder="Nhập tên..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitRename();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              onClick={submitRename}
              disabled={!newConvTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingConvId(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
