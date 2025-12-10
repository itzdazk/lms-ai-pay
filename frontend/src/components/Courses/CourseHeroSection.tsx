import { Link } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { CourseInfoCard } from './CourseInfoCard'
import { InstructorInfo } from './InstructorInfo'
import { CourseStatsGrid } from './CourseStatsGrid'
import type { Instructor } from '../../lib/api/types'
import { getCourseLevelBadge } from '../../lib/courseUtils'

interface CourseHeroSectionProps {
    // Breadcrumb
    categoryName: string
    categoryId?: number
    showPreviewWarning?: boolean

    // Title & Badges
    title: string
    shortDescription?: string
    description?: string
    level: string
    isFeatured?: boolean
    categoryNameForBadge?: string
    tags?: Array<{ id?: number; name: string } | string>

    // Course Info
    language?: string

    // Instructor
    instructor?: Instructor | null

    // Stats
    ratingAvg?: number
    ratingCount?: number
    enrolledCount?: number
    totalLessons?: number
    durationHours?: number
}

export function CourseHeroSection({
    categoryName,
    categoryId,
    showPreviewWarning = false,
    title,
    shortDescription,
    description,
    level,
    isFeatured = false,
    categoryNameForBadge,
    tags = [],
    language,
    instructor,
    ratingAvg = 0,
    ratingCount = 0,
    enrolledCount = 0,
    totalLessons = 0,
    durationHours = 0,
}: CourseHeroSectionProps) {
    const levelBadge = getCourseLevelBadge(level)
    const displayCategoryName = categoryNameForBadge || categoryName

    return (
        <div className='lg:col-span-2 bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50 rounded-2xl p-8 overflow-hidden shadow-2xl hover:border-[#3D3D3D]/50 transition-all duration-300'>
            {/* Breadcrumb */}
            <div className='flex items-center justify-between gap-4 mb-6'>
                <div className='flex items-center gap-2 text-sm text-gray-400'>
                    {categoryId ? (
                        <>
                            <Link
                                to='/courses'
                                className='hover:text-white transition-colors cursor-default'
                            >
                                Khóa học
                            </Link>
                            <span className='text-gray-600'>/</span>
                            <Link
                                to={`/courses?categoryId=${categoryId}`}
                                className='text-gray-300 font-medium hover:text-white transition-colors'
                            >
                                {categoryName}
                            </Link>
                        </>
                    ) : (
                        <>
                            <span className='hover:text-white transition-colors cursor-default'>
                                Xem trước
                            </span>
                            <span className='text-gray-600'>/</span>
                            <span className='text-gray-300 font-medium'>
                                {categoryName}
                            </span>
                        </>
                    )}
                </div>
                {showPreviewWarning && (
                    <div className='bg-gradient-to-r from-yellow-500/20 via-yellow-500/15 to-yellow-500/20 border border-yellow-500/40 rounded-lg px-4 py-1.5 shadow-md'>
                        <p className='text-xs text-yellow-400 leading-relaxed whitespace-nowrap'>
                            ⚠️ Đây là bản xem trước. Khóa học chưa được lưu.
                        </p>
                    </div>
                )}
            </div>

            {/* Title & Badges */}
            <div className='mb-8'>
                <div className='flex flex-wrap gap-2 mb-4'>
                    <Badge
                        className={`${levelBadge.className} shadow-lg transition-transform hover:scale-105`}
                    >
                        {levelBadge.label}
                    </Badge>
                    {isFeatured && (
                        <Badge className='bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg transition-transform hover:scale-105'>
                            Nổi bật
                        </Badge>
                    )}
                    <Badge className='bg-orange-600 text-white hover:bg-orange-700 shadow-lg transition-transform hover:scale-105'>
                        {displayCategoryName}
                    </Badge>
                    {tags.length > 0 &&
                        tags.map((tag, index) => {
                            const tagName =
                                typeof tag === 'string' ? tag : tag.name
                            const tagId = typeof tag === 'string' ? index : tag.id
                            return (
                                <Badge
                                    key={tagId || index}
                                    className='bg-gray-600 text-white hover:bg-gray-700 shadow-lg transition-transform hover:scale-105'
                                >
                                    {tagName}
                                </Badge>
                            )
                        })}
                </div>
                <h1 className='text-4xl md:text-5xl mb-4 text-white font-bold leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                    {title}
                </h1>
                <p className='text-lg text-gray-300 leading-relaxed mb-6'>
                    {shortDescription || description}
                </p>

                {/* Course Info */}
                <CourseInfoCard
                    level={level}
                    levelLabel={levelBadge.label}
                    categoryName={displayCategoryName}
                    language={language}
                    tags={tags}
                />
            </div>

            {/* Instructor Info */}
            {instructor && (
                <div className='mb-8'>
                    <InstructorInfo
                        instructor={instructor}
                        showOtherCourses={false}
                    />
                </div>
            )}

            {/* Stats Grid */}
            <CourseStatsGrid
                ratingAvg={ratingAvg}
                ratingCount={ratingCount}
                enrolledCount={enrolledCount}
                totalLessons={totalLessons}
                durationHours={durationHours}
            />
        </div>
    )
}

