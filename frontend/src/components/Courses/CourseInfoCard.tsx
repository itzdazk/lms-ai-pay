import { Badge } from '../ui/badge'
import { BookOpen, Globe, Users } from 'lucide-react'

interface CourseInfoCardProps {
    level: string
    levelLabel: string
    categoryName: string
    language?: string
    tags?: Array<{ id?: number; name: string } | string>
}

export function CourseInfoCard({
    level,
    levelLabel,
    categoryName,
    language,
    tags = [],
}: CourseInfoCardProps) {
    // Normalize tags - handle both string[] and Tag[] formats
    const normalizedTags = tags.map((tag) =>
        typeof tag === 'string' ? { name: tag } : tag
    )

    return (
        <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-xl p-5 space-y-3 shadow-lg'>
            <div className='flex items-center gap-2 mb-3'>
                <div className='h-1 w-1 rounded-full bg-blue-500'></div>
                <p className='text-sm font-semibold text-white'>
                    Thông tin khóa học
                </p>
            </div>
            <div className='space-y-3 text-sm'>
                <div className='flex items-center gap-3 text-gray-300 hover:text-white transition-colors'>
                    <BookOpen className='h-4 w-4 text-blue-500' />
                    <span>
                        Cấp độ:{' '}
                        <span className='font-medium text-white'>
                            {levelLabel}
                        </span>
                    </span>
                </div>
                {language && (
                    <div className='flex items-center gap-3 text-gray-300 hover:text-white transition-colors'>
                        <Globe className='h-4 w-4 text-blue-500' />
                        <span>
                            Ngôn ngữ:{' '}
                            <span className='font-medium text-white'>
                                {language === 'vi' ? 'Tiếng Việt' : language}
                            </span>
                        </span>
                    </div>
                )}
                <div className='flex items-center gap-3 text-gray-300 hover:text-white transition-colors'>
                    <Users className='h-4 w-4 text-blue-500' />
                    <span>
                        Danh mục:{' '}
                        <span className='font-medium text-white'>
                            {categoryName}
                        </span>
                    </span>
                </div>
                {normalizedTags.length > 0 && (
                    <div className='pt-3 border-t border-[#2D2D2D]'>
                        <p className='text-xs font-semibold text-gray-400 mb-2'>
                            Tags:
                        </p>
                        <div className='flex flex-wrap gap-2'>
                            {normalizedTags.map((tag, index) => (
                                <Badge
                                    key={tag.id || index}
                                    variant='outline'
                                    className='text-xs text-gray-400 border-[#2D2D2D] hover:border-gray-500 hover:text-gray-300 transition-colors'
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

