import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { DarkOutlineButton } from '../ui/buttons'
import { Progress } from '../ui/progress'
import { BookmarkCheck, BookOpen } from 'lucide-react'

interface AchievementsSectionProps {
    completedCourses: Array<{ course: { title: string } }>
    totalProgress: number
    enrolledCoursesCount: number
}

export function AchievementsSection({
    completedCourses,
    totalProgress,
    enrolledCoursesCount,
}: AchievementsSectionProps) {
    return (
        <div className='space-y-6'>
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <BookmarkCheck className='h-4 w-4 text-blue-400' />
                        Thành tích nổi bật
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                        Kỷ niệm các cột mốc quan trọng của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='rounded-xl border border-[#2D2D2D] p-4 bg-black/40'>
                        <p className='text-white font-semibold'>
                            Chứng chỉ mới
                        </p>
                        <p className='text-sm text-gray-400'>
                            {completedCourses.length > 0
                                ? `${completedCourses[0].course.title}`
                                : 'Hãy hoàn thành khóa học để nhận chứng chỉ đầu tiên.'}
                        </p>
                        <DarkOutlineButton className='mt-3 w-full'>
                            Xem chứng chỉ
                        </DarkOutlineButton>
                    </div>
                    <div className='rounded-xl border border-[#2D2D2D] p-4 bg-black/40'>
                        <p className='text-white font-semibold'>
                            Tiến độ tổng quan
                        </p>
                        <p className='text-sm text-gray-400'>
                            Bạn đã hoàn thành {Math.round(totalProgress)}% mục
                            tiêu đã đăng ký
                        </p>
                        <Progress value={totalProgress} className='mt-3' />
                    </div>
                </CardContent>
            </Card>

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <BookOpen className='h-4 w-4 text-blue-400' />
                        Gợi ý tiếp theo
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                        Những nội dung phù hợp với mục tiêu của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {enrolledCoursesCount === 0 && (
                        <p className='text-gray-400 text-sm text-center py-4'>
                            Chưa có khóa học nào. Hãy khám phá các khóa học mới!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

