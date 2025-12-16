import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, GraduationCap, Sparkles } from 'lucide-react'

interface EnrollmentEmptyStateProps {
    hasFilters?: boolean
    status?: string
}

export function EnrollmentEmptyState({
    hasFilters,
    status,
}: EnrollmentEmptyStateProps) {
    const navigate = useNavigate()

    const getEmptyStateContent = () => {
        if (hasFilters) {
            return {
                icon: Search,
                title: 'Không tìm thấy khóa học',
                description:
                    'Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc để tìm những gì bạn đang tìm kiếm.',
                showButton: false,
            }
        }

        if (status === 'COMPLETED') {
            return {
                icon: GraduationCap,
                title: 'Chưa có khóa học hoàn thành',
                description:
                    'Tiếp tục học tập và hoàn thành các khóa học đang học để xem chúng ở đây.',
                showButton: false,
            }
        }

        return {
            icon: BookOpen,
            title: 'Bắt đầu hành trình học tập',
            description:
                'Khám phá các khóa học tuyệt vời và mở khóa tiềm năng của bạn. Duyệt danh mục và tìm khóa học phù hợp với bạn.',
            showButton: true,
        }
    }

    const content = getEmptyStateContent()
    const Icon = content.icon

    return (
        <div className='flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in-up'>
            <div className='relative mb-8'>
                <div className='relative bg-muted border border-border p-6 rounded-3xl'>
                    <Icon className='h-16 w-16 text-foreground' />
                </div>
            </div>

            <div
                className='animate-fade-in-up'
                style={{ animationDelay: '200ms' }}
            >
                <h2 className='mb-3 text-2xl font-bold text-foreground'>
                    {content.title}
                </h2>
                <p className='text-muted-foreground max-w-md mb-8'>
                    {content.description}
                </p>
            </div>

            {content.showButton && (
                <div
                    className='animate-fade-in-up'
                    style={{ animationDelay: '400ms' }}
                >
                    <Button
                        onClick={() => navigate('/courses')}
                        size='lg'
                        className='bg-foreground text-background hover:bg-foreground/90 shadow-sm hover:shadow-md transition-all duration-300'
                    >
                        <Sparkles className='mr-2 h-5 w-5' />
                        Khám phá khóa học
                    </Button>
                </div>
            )}
        </div>
    )
}
