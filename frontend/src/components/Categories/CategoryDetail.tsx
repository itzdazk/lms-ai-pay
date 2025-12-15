import { ArrowRight, BookOpen, Folder, Layers } from 'lucide-react'
import type { Category, PublicCourse } from '../../lib/api/types'
import { Card } from '../ui/card'
import { CategoryCard } from './CategoryCard'
import { CourseList } from '../Courses'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { cn } from '../ui/utils'
import { ReactNode } from 'react'

interface CategoryDetailProps {
    category: Category
    childrenCategories?: Category[]
    courses: PublicCourse[]
    isLoadingCourses?: boolean
    currentPage: number
    totalPages: number
    totalCourses: number
    limit: number
    onPageChange: (page: number) => void
    onChildClick?: (child: Category) => void
    filtersSlot?: ReactNode
}

export function CategoryDetail({
    category,
    childrenCategories = [],
    courses,
    isLoadingCourses = false,
    currentPage,
    totalPages,
    totalCourses,
    limit = 12,
    onPageChange,
    onChildClick,
    filtersSlot,
}: CategoryDetailProps) {
    const stats = [
        {
            icon: BookOpen,
            label: 'Khóa học',
            value: category.coursesCount ?? totalCourses,
        },
        {
            icon: Folder,
            label: 'Danh mục con',
            value: childrenCategories.length,
        },
        {
            icon: Layers,
            label: 'Thứ tự',
            value: category.sortOrder,
        },
    ]

    return (
        <div className='space-y-10'>
            {/* Overview */}
            <Card className='p-6 lg:p-8 border border-gray-200 dark:border-[#2D2D2D] shadow-sm bg-white dark:bg-gradient-to-br dark:from-[#1A1A1A] dark:to-[#151515]'>
                <div className='flex flex-col gap-6 lg:gap-8'>
                    <div>
                        <p className='text-sm text-muted-foreground mb-2'>
                            Danh mục
                        </p>
                        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
                            {category.name}
                        </h2>
                        {category.description && (
                            <p className='mt-2 text-gray-600 dark:text-gray-300'>
                                {category.description}
                            </p>
                        )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {stats.map((item) => (
                            <div
                                key={item.label}
                                className='rounded-xl border border-gray-200 dark:border-[#2D2D2D]/50 bg-gray-50 dark:bg-gradient-to-br dark:from-[#1F1F1F] dark:to-[#1A1A1A] px-4 py-3 flex items-center gap-3 transition-colors hover:border-gray-300 dark:hover:border-[#3D3D3D]'
                            >
                                <div className='h-10 w-10 rounded-lg bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#2D2D2D] flex items-center justify-center shadow-sm dark:shadow-none'>
                                    <item.icon className='h-5 w-5 text-primary' />
                                </div>
                                <div>
                                    <p className='text-sm text-muted-foreground'>
                                        {item.label}
                                    </p>
                                    <p className='text-lg font-semibold text-gray-900 dark:text-white'>
                                        {item.value ?? 0}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Children categories */}
            <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                    <div>
                        <p className='text-sm text-muted-foreground'>
                            Khám phá thêm
                        </p>
                        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                            Danh mục con
                        </h3>
                    </div>
                    <Badge
                        variant='secondary'
                        className='bg-gray-100 dark:bg-[#2D2D2D] text-gray-800 dark:text-gray-200 border-gray-200 dark:border-[#3D3D3D]'
                    >
                        {childrenCategories.length} danh mục
                    </Badge>
                </div>

                {childrenCategories.length === 0 ? (
                    <Card className='p-6 border-dashed border-gray-200 dark:border-[#2D2D2D] bg-gray-50/50 dark:bg-[#1F1F1F]/50 text-center text-muted-foreground'>
                        Danh mục này chưa có danh mục con.
                    </Card>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
                        {childrenCategories.map((child) => (
                            <CategoryCard
                                key={child.id}
                                category={child}
                                onClick={onChildClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Separator className='bg-gray-200 dark:bg-[#2D2D2D]' />

            {/* Courses */}
            <div className='space-y-4'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <p className='text-sm text-muted-foreground'>
                            Khóa học trong danh mục
                        </p>
                        <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                            {category.name}
                        </h3>
                    </div>
                    <div className='flex flex-wrap gap-3'>{filtersSlot}</div>
                </div>

                <Card
                    className={cn(
                        'p-4 lg:p-6 border border-gray-200 dark:border-[#2D2D2D] shadow-sm bg-white dark:bg-gradient-to-br dark:from-[#1A1A1A] dark:to-[#151515]'
                    )}
                >
                    <CourseList
                        courses={courses}
                        isLoading={isLoadingCourses}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCourses={totalCourses}
                        limit={limit}
                        onPageChange={onPageChange}
                    />
                </Card>
            </div>

            {/* Helpful info */}
            <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-800/40 p-6 lg:p-8 shadow-sm dark:shadow-blue-900/10'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <p className='text-sm text-blue-700 dark:text-blue-400 font-medium'>
                            Bắt đầu học tập
                        </p>
                        <h4 className='text-lg font-semibold text-blue-900 dark:text-blue-200 mt-1'>
                            Chọn khóa học phù hợp để nâng cao kỹ năng của bạn
                        </h4>
                        <p className='text-sm text-blue-800 dark:text-blue-300/90 mt-2'>
                            Các khóa học được cập nhật liên tục bởi đội ngũ
                            giảng viên giàu kinh nghiệm.
                        </p>
                    </div>
                    <div className='flex items-center gap-2 text-blue-800 dark:text-blue-300 font-medium hover:gap-3 transition-all cursor-default'>
                        Khám phá ngay
                        <ArrowRight className='h-4 w-4' />
                    </div>
                </div>
            </Card>
        </div>
    )
}
