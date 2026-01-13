import { Loader2, MessageSquare } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { MessageBubble } from './MessageBubble'
import { ConversationStatsPanel } from './ConversationStatsPanel'
import type { Conversation, Message, ConversationStats } from './types'

interface MessagesViewProps {
    selectedConversation: Conversation | null
    messages: Message[]
    conversationStats: ConversationStats | null
    loadingMessages: boolean
    loadingConversationStats: boolean
    showStatsPanel: boolean
    onToggleStatsPanel: () => void
    formatDate: (date: string) => string
    formatTime: (ms: number) => string
    formatMessageTime: (date: string) => string
}

export function MessagesView({
    selectedConversation,
    messages,
    conversationStats,
    loadingMessages,
    loadingConversationStats,
    showStatsPanel,
    onToggleStatsPanel,
    formatDate,
    formatTime,
    formatMessageTime,
}: MessagesViewProps) {
    if (!selectedConversation) {
        return (
            <div className='flex-1 flex items-center justify-center text-gray-400'>
                <div className='text-center'>
                    <MessageSquare className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>Chọn một cuộc trò chuyện để xem chi tiết</p>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col min-h-0 transition-all flex-1'>
            <div className='px-4 py-2 border-b border-[#2D2D2D] bg-[#1A1A1A] flex-shrink-0'>
                <div className='flex items-center justify-between'>
                    <div>
                        <h2 className='text-base font-semibold text-white'>
                            {selectedConversation.title}
                        </h2>
                        <div className='flex items-center gap-3 mt-0.5 text-xs text-gray-400'>
                            {selectedConversation.user && (
                                <span>
                                    Người dùng: {selectedConversation.user.fullName || selectedConversation.user.email}
                                </span>
                            )}
                            {selectedConversation.course && (
                                <span>Khóa học: {selectedConversation.course.title}</span>
                            )}
                            <span>
                                Tạo: {formatDate(selectedConversation.createdAt)}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={onToggleStatsPanel}
                        className='text-white h-8 px-3 text-xs'
                    >
                        {showStatsPanel ? 'Ẩn' : 'Hiện'} Thống kê
                    </Button>
                </div>
            </div>

            <div className='flex-1 flex min-h-0'>
                {/* Messages */}
                <div className={`overflow-y-auto custom-scrollbar flex-1 px-3 py-2 min-h-[600px] max-h-[calc(100vh-280px)]`}>
                    {loadingMessages ? (
                        <div className='flex items-center justify-center py-8'>
                            <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className='text-center py-8 text-gray-400'>
                            Không có tin nhắn nào
                        </div>
                    ) : (
                        <div className='max-w-5xl mx-auto space-y-2'>
                            {messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    formatTime={formatTime}
                                    formatMessageTime={formatMessageTime}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Statistics Panel */}
                {showStatsPanel && (
                    <div className='w-96 border-l border-[#2D2D2D] bg-[#1A1A1A] overflow-y-auto custom-scrollbar flex-shrink-0 min-h-[600px] max-h-[calc(100vh-280px)]'>
                        <ConversationStatsPanel
                            stats={conversationStats}
                            loading={loadingConversationStats}
                            formatTime={formatTime}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
