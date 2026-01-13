import { Bot, AlertCircle } from 'lucide-react'
import { CourseRecommendationCard } from './CourseRecommendationCard'
import type { Message } from './types'

interface MessageBubbleProps {
    msg: Message
    formatTime: (ms: number) => string
    formatMessageTime: (date: string) => string
}

export function MessageBubble({
    msg,
    formatTime,
    formatMessageTime,
}: MessageBubbleProps) {
    const metadata = msg.metadata

    return (
        <div
            className={`flex ${
                msg.senderType === 'user' ? 'justify-end' : 'justify-start'
            }`}
        >
            <div
                className={`max-w-[85%] rounded-lg p-4 break-words ${
                    msg.senderType === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2D2D2D] text-gray-200'
                }`}
            >
                <div className='flex items-center gap-2 mb-1'>
                    {msg.senderType === 'ai' && (
                        <Bot className='h-4 w-4 text-purple-400' />
                    )}
                    <span className='text-xs font-semibold'>
                        {msg.senderType === 'user' ? 'Người dùng' : 'AI'}
                    </span>
                    {metadata && (
                        <div className='flex items-center gap-1 ml-auto'>
                            {metadata.responseTime && (
                                <span className='text-[10px] text-gray-400'>
                                    {formatTime(metadata.responseTime)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <p className='text-sm whitespace-pre-wrap break-words leading-relaxed'>{msg.message}</p>

                {/* Course Recommendations */}
                {metadata && msg.senderType === 'ai' && metadata.sources && metadata.sources.length > 0 && (
                    <div className='mt-3 space-y-2'>
                        {metadata.sources.map((course, idx) => (
                            <CourseRecommendationCard key={idx} course={course} />
                        ))}
                    </div>
                )}

                {/* Metadata Display */}
                {metadata && msg.senderType === 'ai' && (
                    <div className='mt-2 pt-2 border-t border-gray-600/50 space-y-1'>
                        {metadata.sources && metadata.sources.length > 0 && (
                            <div className='text-xs text-gray-400'>
                                <span className='font-semibold'>Nguồn:</span>{' '}
                                {metadata.sources.length} khóa học được đề xuất
                            </div>
                        )}
                        {metadata.fallbackReason && (
                            <div className='text-xs text-orange-400 flex items-center gap-1'>
                                <AlertCircle className='h-3 w-3' />
                                <span>Fallback: {metadata.fallbackReason}</span>
                            </div>
                        )}
                        {msg.isHelpful !== null && (
                            <div className='text-xs text-gray-400'>
                                Đánh giá:{' '}
                                {msg.isHelpful ? (
                                    <span className='text-green-400'>Hữu ích</span>
                                ) : (
                                    <span className='text-red-400'>Không hữu ích</span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <p className='text-xs opacity-70 mt-1'>{formatMessageTime(msg.createdAt)}</p>
            </div>
        </div>
    )
}
