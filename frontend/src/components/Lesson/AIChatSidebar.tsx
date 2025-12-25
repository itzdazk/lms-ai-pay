import { useEffect, useState, useRef } from 'react';
import apiClient from '../../lib/api/client';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { X, Send, Bot, User, ThumbsUp, ThumbsDown, Copy, MessageCircle, BookOpen, ChevronDown, Plus, MoreVertical, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { notifyConversationsChanged, notifyMessagesChanged, AI_CONVERSATIONS_CHANGED, AI_MESSAGES_CHANGED } from '../../lib/events/aiChatEvents';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

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
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [renamingConvId, setRenamingConvId] = useState<string | null>(null);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [newConvTitle, setNewConvTitle] = useState('');
  const [conversations, setConversations] = useState<Array<{
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    courseId?: string;
    courseName?: string;
  }>>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! Tôi là Gia sư AI. Tôi có thể giúp bạn giải đáp thắc mắc về bài học này, hỗ trợ học tập, và tư vấn lộ trình. Bạn cần hỗ trợ gì không?',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
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
    const viewport = scrollViewportRef.current;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Load conversations when history opens
  useEffect(() => {
    if (!isHistoryOpen) return;
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
        console.error('Failed to load conversations for sidebar history', err);
      }
    })();
  }, [isHistoryOpen]);

  // Load existing conversation and messages for this course/lesson when sidebar opens
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const convResp = await apiClient.get('/ai/conversations');
        const convs = convResp?.data?.data ?? [];

        let existing: any = null;
        if (lessonId) {
          existing = convs.find((c: any) => c.lessonId === lessonId || c.lesson?.id === lessonId);
        }
        if (!existing && courseId) {
          existing = convs.find((c: any) => c.courseId === courseId || c.course?.id === courseId);
        }

        if (existing) {
          setConversationId(existing.id);

          const msgsResp = await apiClient.get(`/ai/conversations/${existing.id}/messages`);
          const msgs = msgsResp?.data?.data ?? [];
          const mapped: Message[] = msgs.map((m: any) => ({
            id: String(m.id),
            role: m.senderType === 'ai' ? 'assistant' : 'user',
            content: m.message,
            timestamp: new Date(m.createdAt),
          }));

          if (mapped.length > 0) setMessages(mapped);
        }
      } catch (err) {
        console.error('Failed to load conversation/messages', err);
      }
    })();
  }, [isOpen, courseId, lessonId]);

  // Listen for external updates to conversations/messages to keep in sync
  useEffect(() => {
    const onConversationsChanged = (e: any) => {
      const convId = e?.detail?.convId;
      if (convId && String(conversationId) === String(convId)) {
        // Reload messages of current conversation
        (async () => {
          try {
            const msgsResp = await apiClient.get(`/ai/conversations/${convId}/messages`);
            const msgs = msgsResp?.data?.data ?? [];
            const mapped: Message[] = msgs.map((m: any) => ({
              id: String(m.id),
              role: m.senderType === 'ai' ? 'assistant' : 'user',
              content: m.message,
              timestamp: new Date(m.createdAt),
            }));
            if (mapped.length > 0) setMessages(mapped);
          } catch (err) {
            console.error('Failed to refresh messages after external change', err);
          }
        })();
      }
    };
    const onMessagesChanged = onConversationsChanged;
    window.addEventListener(AI_CONVERSATIONS_CHANGED, onConversationsChanged as any);
    window.addEventListener(AI_MESSAGES_CHANGED, onMessagesChanged as any);
    return () => {
      window.removeEventListener(AI_CONVERSATIONS_CHANGED, onConversationsChanged as any);
      window.removeEventListener(AI_MESSAGES_CHANGED, onMessagesChanged as any);
    };
  }, [conversationId]);

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

    (async () => {
      try {
        let convId = conversationId;

        // If no conversation exists yet, create one
        if (!convId) {
          const createResp = await apiClient.post('/ai/conversations', {
            courseId,
            lessonId,
            title: currentInput.slice(0, 120),
          });
          // createResp.data.data is the created conversation
          convId = createResp?.data?.data?.id ?? null;
          if (convId) setConversationId(convId);
          if (convId) notifyConversationsChanged(convId);
        }

        if (!convId) {
          throw new Error('Không thể tạo conversation');
        }

        // Send message with mode
        const resp = await apiClient.post(`/ai/conversations/${convId}/messages`, {
          message: currentInput,
          mode: chatMode,
        });

        const payload = resp?.data?.data;
        const aiMsg = payload?.aiMessage ?? payload?.ai_message ?? null;
        const aiText = aiMsg?.message ?? aiMsg?.text ?? (payload?.aiMessage?.text) ?? null;

        if (aiText) {
          const aiMessageObj: Message = {
            id: aiMsg.id?.toString() ?? Date.now().toString(),
            role: 'assistant',
            content: aiText,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, aiMessageObj]);
          notifyMessagesChanged(convId);
          notifyConversationsChanged(convId);
        } else if (payload?.aiMessage?.message) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: payload.aiMessage.message,
            timestamp: new Date()
          }]);
          notifyMessagesChanged(convId);
          notifyConversationsChanged(convId);
        } else {
          // Fallback text
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Xin lỗi, không nhận được phản hồi từ server.',
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        console.error('AI chat error', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Đã xảy ra lỗi khi gọi AI. Vui lòng thử lại sau.',
          timestamp: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // Sidebar history actions
  const handleSelectConversation = async (convId: string) => {
    try {
      setConversationId(Number(convId));
      const msgsResp = await apiClient.get(`/ai/conversations/${convId}/messages`);
      const msgs = msgsResp?.data?.data ?? [];
      const mapped: Message[] = msgs.map((m: any) => ({
        id: String(m.id),
        role: m.senderType === 'ai' ? 'assistant' : 'user',
        content: m.message,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped.length > 0 ? mapped : []);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error('Failed to load messages for selected conversation (sidebar)', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const createResp = await apiClient.post('/ai/conversations', {
        title: 'Trò chuyện chung',
        courseId,
        lessonId,
      });
      const convId = createResp?.data?.data?.id;
      if (!convId) throw new Error('Không thể tạo conversation');
      setConversationId(Number(convId));
      notifyConversationsChanged(convId);

      const msgsResp = await apiClient.get(`/ai/conversations/${convId}/messages`);
      const msgs = msgsResp?.data?.data ?? [];
      const mapped: Message[] = msgs.map((m: any) => ({
        id: String(m.id),
        role: m.senderType === 'ai' ? 'assistant' : 'user',
        content: m.message,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(mapped);
      setIsHistoryOpen(false);
    } catch (err) {
      console.error('Failed to create and load new conversation (sidebar)', err);
    }
  };

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

      // Refresh conversation list
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

  const handleDeleteConversation = async (convId: string) => {
    setDeletingConvId(convId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingConvId) return;

    try {
      await apiClient.delete(`/ai/conversations/${deletingConvId}`);
      
      // If deleting current conversation, clear messages and reset
      if (String(conversationId) === String(deletingConvId)) {
        setConversationId(null);
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Xin chào! Tôi là Gia sư AI. Tôi có thể giúp bạn giải đáp thắc mắc về bài học này, hỗ trợ học tập, và tư vấn lộ trình. Bạn cần hỗ trợ gì không?',
          timestamp: new Date()
        }]);
      }
      
      // Refresh conversation list
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
      notifyConversationsChanged();
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      setDeletingConvId(null);
    } catch (err) {
      console.error('Failed to delete conversation', err);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  return (
    <div
      className={`fixed top-0 right-0 z-[70] h-full transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        width: '385px',
        maxWidth: '90vw',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
        <div
          className={`h-full flex flex-col ${
            isDark ? 'bg-[#1A1A1A] border-l border-[#2D2D2D]' : 'bg-white border-l border-gray-200'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${
              isDark ? 'border-[#2D2D2D]' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative h-8 w-8 flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-[#1A1A1A]" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gia sư AI
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsHistoryOpen(true)}
                title="Lịch sử chat"
                className={isDark ? 'text-white hover:bg-[#1F1F1F]' : 'text-gray-700 hover:bg-gray-100'}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <DarkOutlineButton
                size="icon"
                onClick={onClose}
                title="Đóng"
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </DarkOutlineButton>
            </div>
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
            <ScrollArea className="h-full" viewportRef={scrollViewportRef}>
              <div className="px-4 py-4 space-y-4">
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
                          <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gia sư AI</span>
                        </div>
                      )}
                      <div
                        className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : isDark
                            ? 'bg-[#1F1F1F] text-gray-200 border border-[#2D2D2D]'
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-xs leading-snug">{message.content}</p>
                        <p
                          className={`text-[10px] mt-1 text-right ${
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

        {/* History Sheet */}
        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetContent hideClose side="right" className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white'} w-[385px] p-0`}>
            <SheetHeader className={`pl-4 pr-2 pt-4 pb-2 border-b ${isDark ? 'border-[#2D2D2D]' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className={`h-5 w-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  <SheetTitle className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>Lịch sử chat</SheetTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={isDark ? 'text-white hover:bg-[#1F1F1F]' : 'text-gray-700 hover:bg-gray-100'}
                    onClick={handleNewConversation}
                    title="Tạo cuộc trò chuyện mới"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <DarkOutlineButton
                    size="icon"
                    onClick={() => setIsHistoryOpen(false)}
                    title="Đóng"
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </DarkOutlineButton>
                </div>
              </div>
            </SheetHeader>
            <div className="p-4 pt-3 h-[calc(100vh-5rem)]">
              <ScrollArea className="h-full pr-2">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <p className={`text-sm text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Chưa có cuộc trò chuyện nào</p>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={`flex items-center gap-2 p-3 cursor-pointer transition-colors rounded-none w-full overflow-hidden ${
                          String(conversationId) === String(conv.id)
                            ? 'bg-blue-600/20 border border-blue-600'
                            : isDark
                              ? 'border border-transparent hover:bg-[#1F1F1F]'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className={`h-9 w-9 rounded-md flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gray-100'}`}>
                            {conv.courseName ? (
                              <BookOpen className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            ) : (
                              <MessageCircle className={`h-4 w-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`font-medium text-sm truncate flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{conv.title}</p>
                            <p className={`text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                              {conv.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="mt-1 overflow-hidden">
                            {conv.courseName && (
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 mb-1 max-w-full truncate block ${isDark ? 'border-[#2D2D2D] text-gray-300' : 'border-gray-200 text-gray-700'}`}>{conv.courseName}</Badge>
                            )}
                            <p className={`text-xs line-clamp-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{conv.lastMessage || '—'}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-7 w-7 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className={isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'}>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameConversation(conv.id);
                                }}
                                className={isDark ? 'text-white hover:bg-[#2D2D2D] cursor-pointer' : 'text-gray-900 hover:bg-gray-100 cursor-pointer'}
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
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className={isDark ? 'bg-[#1A1A1A] border-[#2D2D2D] text-white' : 'bg-white border-gray-200 text-gray-900'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Đổi tên cuộc trò chuyện</DialogTitle>
              <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Nhập tên mới cho cuộc trò chuyện của bạn
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="conv-title" className={isDark ? 'text-white' : 'text-gray-900'}>
                  Tên cuộc trò chuyện
                </Label>
                <Input
                  id="conv-title"
                  value={newConvTitle}
                  onChange={(e) => setNewConvTitle(e.target.value)}
                  className={isDark ? 'bg-[#0F0F0F] border-[#2D2D2D] text-white' : 'bg-white border-gray-300 text-gray-900'}
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
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              >
                Hủy
              </Button>
              <Button
                onClick={submitRename}
                disabled={!newConvTitle.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className={isDark ? 'bg-[#1A1A1A] border-[#2D2D2D] text-white' : 'bg-white border-gray-200 text-gray-900'}>
            <DialogHeader>
              <DialogTitle className={isDark ? 'text-white' : 'text-gray-900'}>Xác nhận xóa</DialogTitle>
              <DialogDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
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
                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
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
