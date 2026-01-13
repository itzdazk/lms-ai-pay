import { Loader2, Bot, BookOpen } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { ConversationCard } from './ConversationCard'
import type { Conversation } from './types'

interface ConversationsListProps {
    conversations: Conversation[]
    advisorConversations: Conversation[]
    tutorConversations: Conversation[]
    selectedMode: 'all' | 'advisor' | 'general'
    selectedConversation: Conversation | null
    loading: boolean
    page: number
    total: number
    limit: number
    onSelect: (conv: Conversation) => void
    onPageChange: (page: number) => void
    getModeLabel: (mode: string) => string
    getModeBadgeColor: (mode: string) => string
    formatDate: (date: string) => string
}

export function ConversationsList({
    conversations,
    advisorConversations,
    tutorConversations,
    selectedMode,
    selectedConversation,
    loading,
    page,
    total,
    limit,
    onSelect,
    onPageChange,
    getModeLabel,
    getModeBadgeColor,
    formatDate,
}: ConversationsListProps) {
    return (
        <div className='w-80 border-r border-[#2D2D2D] overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0 min-h-[680px] max-h-[calc(100vh-280px)]'>
            <div className='px-4 py-2 border-b border-[#2D2D2D] bg-[#1A1A1A] flex-shrink-0'>
                <h2 className='text-base font-semibold text-white'>Danh sách đoạn chat</h2>
            </div>
            <div className='p-3 flex-1'>
                {loading ? (
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className='text-center py-8 text-gray-400'>
                        Không có cuộc trò chuyện nào
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {/* Trợ lý AI Section */}
                        {(selectedMode === 'all' || selectedMode === 'advisor') &&
                            advisorConversations.length > 0 && (
                                <div>
                                    <div className='flex items-center gap-2 mb-3 px-2'>
                                        <Bot className='h-4 w-4 text-purple-400' />
                                        <h3 className='text-sm font-semibold text-purple-400'>
                                            Trợ lý AI ({advisorConversations.length})
                                        </h3>
                                    </div>
                                    <div className='space-y-1.5'>
                                        {advisorConversations.map((conv) => (
                                            <ConversationCard
                                                key={conv.id}
                                                conv={conv}
                                                selectedConversation={selectedConversation}
                                                onSelect={onSelect}
                                                getModeLabel={getModeLabel}
                                                getModeBadgeColor={getModeBadgeColor}
                                                formatDate={formatDate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                        {/* Gia sư AI Section */}
                        {(selectedMode === 'all' || selectedMode === 'general') &&
                            tutorConversations.length > 0 && (
                                <div>
                                    <div className='flex items-center gap-2 mb-3 px-2'>
                                        <BookOpen className='h-4 w-4 text-blue-400' />
                                        <h3 className='text-sm font-semibold text-blue-400'>
                                            Gia sư AI ({tutorConversations.length})
                                        </h3>
                                    </div>
                                    <div className='space-y-1.5'>
                                        {tutorConversations.map((conv) => (
                                            <ConversationCard
                                                key={conv.id}
                                                conv={conv}
                                                selectedConversation={selectedConversation}
                                                onSelect={onSelect}
                                                getModeLabel={getModeLabel}
                                                getModeBadgeColor={getModeBadgeColor}
                                                formatDate={formatDate}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className='flex items-center justify-between mt-3 pt-3 border-t border-[#2D2D2D]'>
                        <span className='text-sm text-gray-400'>
                            Trang {page} / {Math.ceil(total / limit)}
                        </span>
                        <div className='flex gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => onPageChange(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className='text-white'
                            >
                                Trước
                            </Button>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => onPageChange(Math.min(Math.ceil(total / limit), page + 1))}
                                disabled={page >= Math.ceil(total / limit)}
                                className='text-white'
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
