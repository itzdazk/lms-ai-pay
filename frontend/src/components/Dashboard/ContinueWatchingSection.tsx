import { Link } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { DarkOutlineButton } from '../ui/buttons'
import { Progress } from '../ui/progress'
import { PlayCircle } from 'lucide-react'
import { formatStudyTime } from '../../lib/dashboardUtils'

interface Lesson {
    id: number
    title: string
    slug: string
    watchDuration: number
    videoDuration?: number
    course: {
        slug: string
        title: string
        thumbnailUrl?: string
    }
}

interface ContinueWatchingSectionProps {
    lessons: Lesson[]
}

export function ContinueWatchingSection({
    lessons,
}: ContinueWatchingSectionProps) {
    if (lessons.length === 0) return null

    return (
        <div className='mb-8'>
            <h2 className='text-2xl font-bold mb-4 text-black dark:text-white'>
                Tiếp tục học
            </h2>
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {lessons.slice(0, 3).map((lesson) => (
                    <Card
                        key={lesson.id}
                        className='bg-[#1A1A1A] border-[#2D2D2D] hover:border-white/30 transition-colors overflow-hidden'
                    >
                        <Link
                            to={`/courses/${lesson.course.slug}/lessons/${lesson.slug}`}
                        >
                            <div className='relative aspect-video overflow-hidden rounded-t-lg'>
                                {lesson.course.thumbnailUrl ? (
                                    <img
                                        src={lesson.course.thumbnailUrl}
                                        alt={lesson.course.title}
                                        className='w-full h-full object-cover'
                                    />
                                ) : (
                                    <div className='w-full h-full bg-[#2D2D2D] flex items-center justify-center'>
                                        <PlayCircle className='h-12 w-12 text-gray-500' />
                                    </div>
                                )}
                                <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity'>
                                    <PlayCircle className='h-12 w-12 text-white' />
                                </div>
                            </div>
                        </Link>
                        <CardHeader>
                            <CardTitle className='text-white line-clamp-2'>
                                {lesson.title}
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                {lesson.course.title}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className='mb-4'>
                                <div className='flex items-center justify-between text-xs text-gray-400 mb-1'>
                                    <span>
                                        Đã xem:{' '}
                                        {formatStudyTime(lesson.watchDuration)}
                                    </span>
                                    {lesson.videoDuration && (
                                        <span>
                                            Tổng:{' '}
                                            {formatStudyTime(lesson.videoDuration)}
                                        </span>
                                    )}
                                </div>
                                <Progress
                                    value={
                                        lesson.videoDuration
                                            ? Math.min(
                                                  (lesson.watchDuration /
                                                      lesson.videoDuration) *
                                                      100,
                                                  100
                                              )
                                            : 0
                                    }
                                />
                            </div>
                            <DarkOutlineButton asChild className='w-full'>
                                <Link
                                    to={`/courses/${lesson.course.slug}/lessons/${lesson.slug}`}
                                >
                                    Tiếp tục học
                                </Link>
                            </DarkOutlineButton>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

