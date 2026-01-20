import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { CourseCard } from './CourseCard'
import { coursesApi } from '../../lib/api/courses'
import type { PublicCourse } from '../../lib/api/types'
import Slider from 'react-slick'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

// Custom Arrow Components for Slider
function NextArrow(props: any) {
    const { onClick, className } = props
    const { theme } = useTheme()
    const disabled = className?.includes('slick-disabled')

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`absolute top-1/2 -translate-y-1/2 z-20
                w-10 h-10 md:w-12 md:h-12 
                -right-2 md:-right-6
                rounded-full 
                flex items-center justify-center
                transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:scale-110
                shadow-lg hover:shadow-2xl
                ${
                    theme === 'dark'
                        ? 'bg-gray-800/90 backdrop-blur-md border-2 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500'
                        : 'bg-white/95 backdrop-blur-md border-2 border-gray-300 text-gray-800 hover:bg-white hover:border-gray-400 shadow-md'
                }
            `}
            aria-label='Next'
        >
            <ChevronRight className='w-5 h-5 md:w-6 md:h-6' />
        </button>
    )
}

function PrevArrow(props: any) {
    const { onClick, className } = props
    const { theme } = useTheme()
    const disabled = className?.includes('slick-disabled')

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`absolute top-1/2 -translate-y-1/2 z-20
                w-10 h-10 md:w-12 md:h-12 
                -left-2 md:-left-6
                rounded-full
                flex items-center justify-center
                transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:scale-110
                shadow-lg hover:shadow-2xl
                ${
                    theme === 'dark'
                        ? 'bg-gray-800/90 backdrop-blur-md border-2 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500'
                        : 'bg-white/95 backdrop-blur-md border-2 border-gray-300 text-gray-800 hover:bg-white hover:border-gray-400 shadow-md'
                }
            `}
            aria-label='Previous'
        >
            <ChevronLeft className='w-5 h-5 md:w-6 md:h-6' />
        </button>
    )
}

export function FeaturedCoursesSection() {
    const [courses, setCourses] = useState<PublicCourse[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchFeaturedCourses = async () => {
            try {
                setIsLoading(true)
                // Lấy tối đa 8 khóa học nổi bật
                const data = await coursesApi.getFeaturedCourses(8)
                setCourses(data || [])
            } catch (error) {
                console.error('Failed to fetch featured courses:', error)
                setCourses([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchFeaturedCourses()
    }, [])

    // Nếu số lượng khóa học ≤ 4, hiển thị grid
    // Nếu > 4, hiển thị carousel với 4 courses per slide
    const shouldUseCarousel = courses.length > 4

    if (isLoading) {
        return (
            <section className='py-8 sm:py-12 bg-background'>
                <div className='container mx-auto px-4'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-8 sm:mb-12'>
                        <div className='flex-1'>
                            <h2 className='text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-4 text-foreground'>
                                Khóa học nổi bật
                            </h2>
                            <p className='text-sm sm:text-base md:text-lg text-muted-foreground'>
                                Những khóa học được yêu thích nhất
                            </p>
                        </div>
                        <Button
                            variant='outline'
                            asChild
                            className='border-border text-foreground hover:bg-accent w-full sm:w-auto'
                        >
                            <Link to='/courses'>Xem tất cả</Link>
                        </Button>
                    </div>
                    <div className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                        {[...Array(4)].map((_, index) => (
                            <div
                                key={index}
                                className='h-96 bg-[#1A1A1A] border-[#2D2D2D] rounded-lg animate-pulse'
                            />
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (courses.length === 0) {
        return null
    }

    return (
        <section className='py-8 sm:py-12 bg-background'>
            <div className='container mx-auto px-4'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-8 sm:mb-12'>
                    <div className='flex-1'>
                        <h2 className='text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-4 text-foreground'>
                            Khóa học nổi bật
                        </h2>
                        <p className='text-sm sm:text-base md:text-lg text-muted-foreground'>
                            Những khóa học được yêu thích nhất
                        </p>
                    </div>
                    <Button
                        variant='outline'
                        asChild
                        className='border-border text-foreground hover:bg-accent w-full sm:w-auto'
                    >
                        <Link to='/courses'>Xem tất cả</Link>
                    </Button>
                </div>

                {shouldUseCarousel ? (
                    // Carousel: Mỗi slide hiển thị 4 khóa học
                    <div className='relative px-1 sm:px-2 md:px-4'>
                        <Slider
                            dots={false}
                            infinite={courses.length > 4}
                            speed={500}
                            slidesToShow={4}
                            slidesToScroll={1}
                            nextArrow={<NextArrow />}
                            prevArrow={<PrevArrow />}
                            responsive={[
                                {
                                    breakpoint: 1280, // xl
                                    settings: {
                                        slidesToShow: 4,
                                        slidesToScroll: 1,
                                    },
                                },
                                {
                                    breakpoint: 1024, // lg
                                    settings: {
                                        slidesToShow: 3,
                                        slidesToScroll: 1,
                                    },
                                },
                                {
                                    breakpoint: 768, // md
                                    settings: {
                                        slidesToShow: 2,
                                        slidesToScroll: 1,
                                    },
                                },
                                {
                                    breakpoint: 640, // sm
                                    settings: {
                                        slidesToShow: 1,
                                        slidesToScroll: 1,
                                    },
                                },
                            ]}
                        >
                            {courses.map((course) => (
                                <div key={course.id} className='px-2 sm:px-3 min-w-0'>
                                    <CourseCard course={course} />
                                </div>
                            ))}
                        </Slider>
                    </div>
                ) : (
                    // Grid: Hiển thị tất cả khóa học (≤ 4) dạng grid, căn giữa nếu < 4
                    <div className={courses.length < 4 
                        ? 'flex flex-wrap justify-center gap-6' 
                        : 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    }>
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} className={courses.length < 4 ? 'max-w-sm' : ''} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
