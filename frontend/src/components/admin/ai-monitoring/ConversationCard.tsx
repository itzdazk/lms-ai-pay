import { Card, CardContent } from '../../../components/ui/card'
import { MessageSquare, Clock, BookOpen, User, ChevronRight } from 'lucide-react'
import type { Conversation } from './types'

interface ConversationCardProps {
    conv: Conversation
    selectedConversation: Conversation | null
    onSelect: (conv: Conversation) => void
    getModeLabel: (mode: string) => string
    getModeBadgeColor: (mode: string) => string
    formatDate: (date: string) => string
}

export function ConversationCard({
    conv,
    selectedConversation,
    onSelect,
    getModeLabel,
    getModeBadgeColor,
    formatDate,
}: ConversationCardProps) {
    return (
        <Card
            className={`cursor-pointer transition-all ${
                selectedConversation?.id === conv.id
                    ? 'bg-[#2D2D2D] border-blue-500'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#3D3D3D]'
            }`}
            onClick={() => onSelect(conv)}
        >
            <CardContent className='p-3'>
                <div className='flex items-start justify-between mb-1.5'>
                    <div className='flex-1 min-w-0'>
                        <h3 className='text-sm font-semibold text-white truncate'>
                            {conv.title}
                        </h3>
                        <div className='flex items-center gap-2 mt-0.5'>
                            <span
                                className={`text-xs px-2 py-0.5 rounded ${getModeBadgeColor(
                                    conv.mode
                                )} text-white`}
                            >
                                {getModeLabel(conv.mode)}
                            </span>
                        </div>
                    </div>
                    <ChevronRight className='h-4 w-4 text-gray-400 flex-shrink-0' />
                </div>

                {conv.user && (
                    <div className='flex items-center gap-2 mt-1.5 text-xs text-gray-400'>
                        <User className='h-3 w-3' />
                        <span className='truncate'>
                            {conv.user.fullName || conv.user.email}
                        </span>
                    </div>
                )}

                {conv.course && (
                    <div className='flex items-center gap-2 mt-0.5 text-xs text-gray-400'>
                        <BookOpen className='h-3 w-3' />
                        <span className='truncate'>{conv.course.title}</span>
                    </div>
                )}

                {conv.lastMessage && (
                    <p className='text-xs text-gray-500 mt-1.5 line-clamp-2'>
                        {conv.lastMessage}
                    </p>
                )}

                <div className='flex items-center justify-between mt-1.5 text-xs text-gray-500'>
                    <span className='flex items-center gap-1'>
                        <MessageSquare className='h-3 w-3' />
                        {conv.messageCount || 0} tin nhắn
                    </span>
                    {conv.lastMessageAt && (
                        <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {formatDate(conv.lastMessageAt)}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
