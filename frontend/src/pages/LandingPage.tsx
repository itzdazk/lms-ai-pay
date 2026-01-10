import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
    Star,
    Users,
    BookOpen,
    Clock,
    Bot,
    Award,
    GraduationCap,
    CreditCard,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import Slider from 'react-slick'
import { mockCourses, formatPrice, formatDuration } from '../lib/mockData'
import { categoriesApi } from '../lib/api/categories'
import type { Category } from '../lib/api/types'
import { useTheme } from '../contexts/ThemeContext'
import { AdvisorCard } from '../components/AI/AdvisorCard'
import { CONTACT_INFO } from '../lib/constants'
import { Mail } from 'lucide-react'

// Custom Arrow Components
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

export function LandingPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoadingCategories(true)
                const response = await categoriesApi.getCategories({
                    isActive: true,
                    limit: 20,
                })
                // Filter chỉ lấy parent categories (không có parent) để hiển thị
                const parentCategories = response.data.filter(
                    (cat) => !cat.parentId
                )
                setCategories(parentCategories)
            } catch (error) {
                console.error('Failed to fetch categories:', error)
                setCategories([])
            } finally {
                setIsLoadingCategories(false)
            }
        }

        fetchCategories()
    }, [])
    return (
        <div className='flex flex-col bg-background text-foreground'>
            {/* Hero Section */}
            <section className='relative bg-background text-foreground'>
                {/* Background Image */}
                <div
                    className='absolute inset-0 bg-cover bg-center bg-no-repeat'
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80')",
                    }}
                ></div>
                <div className='absolute inset-0 bg-background/50 backdrop-blur-sm'></div>

                <div className='container mx-auto px-4 py-20 md:py-32 relative z-10'>
                    <div className='max-w-3xl'>
                        <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground drop-shadow-lg'>
                            Học tập thông minh với AI
                        </h1>
                        <p className='text-lg md:text-xl text-muted-foreground mb-8 drop-shadow-md'>
                            Nền tảng học tập trực tuyến tích hợp AI, giúp bạn
                            phát triển kỹ năng và sự nghiệp với hơn 1000+ khóa
                            học chất lượng cao.
                        </p>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col sm:flex-row gap-4 items-center'>
                                <Button
                                    size='lg'
                                    className='bg-black text-white hover:bg-gray-900'
                                    asChild
                                >
                                    <Link to='/courses'>Khám phá khóa học</Link>
                                </Button>
                                <Button
                                    size='lg'
                                    variant='outline'
                                    className='border-border text-foreground hover:!bg-gray-300'
                                    asChild
                                >
                                    <Link to='/register'>Đăng ký miễn phí</Link>
                                </Button>
                            </div>
                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <Mail className='h-4 w-4' />
                                <span>Cần hỗ trợ? Liên hệ:</span>
                                <a
                                    href={`mailto:${CONTACT_INFO.email}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        window.location.href = `mailto:${CONTACT_INFO.email}`
                                    }}
                                    className='text-blue-500 hover:text-blue-400 underline font-medium'
                                >
                                    {CONTACT_INFO.email}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className='py-12 bg-background'>
                <div className='container mx-auto px-4'>
                    <div className='text-center mb-12'>
                        <h2 className='text-3xl md:text-4xl mb-4 text-foreground'>
                            Tính năng nổi bật
                        </h2>
                        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                            EduLearn cung cấp trải nghiệm học tập toàn diện với
                            công nghệ AI tiên tiến
                        </p>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='pt-6'>
                                <Bot className='h-12 w-12 text-blue-500 mb-4' />
                                <h3 className='text-xl font-semibold mb-2 text-white'>
                                    AI Tutor Chatbox
                                </h3>
                                <p className='text-gray-400'>
                                    Chat trực tiếp với AI để được hỗ trợ học tập
                                    24/7
                                </p>
                            </CardContent>
                        </Card>
                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='pt-6'>
                                <Award className='h-12 w-12 text-green-500 mb-4' />
                                <h3 className='text-xl font-semibold mb-2 text-white'>
                                    Auto-grading Quiz
                                </h3>
                                <p className='text-gray-400'>
                                    Tự động chấm điểm và hiển thị kết quả ngay
                                    lập tức
                                </p>
                            </CardContent>
                        </Card>
                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='pt-6'>
                                <GraduationCap className='h-12 w-12 text-purple-500 mb-4' />
                                <h3 className='text-xl font-semibold mb-2 text-white'>
                                    Progress Tracking
                                </h3>
                                <p className='text-gray-400'>
                                    Theo dõi tiến độ học tập chi tiết và tự động
                                </p>
                            </CardContent>
                        </Card>
                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='pt-6'>
                                <CreditCard className='h-12 w-12 text-orange-500 mb-4' />
                                <h3 className='text-xl font-semibold mb-2 text-white'>
                                    Payment Integration
                                </h3>
                                <p className='text-gray-400'>
                                    Thanh toán dễ dàng với VNPay và MoMo
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <section className='py-12 bg-background'>
                <div className='container mx-auto px-4'>
                    <div className='flex items-center justify-between mb-12'>
                        <div>
                            <h2 className='text-3xl md:text-4xl mb-4 text-foreground'>
                                Khóa học nổi bật
                            </h2>
                            <p className='text-lg text-muted-foreground'>
                                Những khóa học được yêu thích nhất
                            </p>
                        </div>
                        <Button
                            variant='outline'
                            asChild
                            className='border-border text-foreground hover:bg-accent'
                        >
                            <Link to='/courses'>Xem tất cả</Link>
                        </Button>
                    </div>
                    <div className='grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                        {mockCourses
                            .filter((course) => course.featured)
                            .slice(0, 4)
                            .map((course) => (
                                <Card
                                    key={course.id}
                                    className='overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-[#1A1A1A] border-[#2D2D2D]'
                                >
                                    <Link to={`/courses/${course.id}`}>
                                        <div className='relative aspect-video overflow-hidden rounded-t-lg'>
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                                            />
                                            <Badge className='absolute top-3 left-3 bg-blue-600'>
                                                {course.level === 'beginner' &&
                                                    'Cơ bản'}
                                                {course.level ===
                                                    'intermediate' &&
                                                    'Trung cấp'}
                                                {course.level === 'advanced' &&
                                                    'Nâng cao'}
                                            </Badge>
                                            {course.featured && (
                                                <Badge className='absolute top-3 right-3 bg-yellow-500'>
                                                    ⭐ Nổi bật
                                                </Badge>
                                            )}
                                        </div>
                                    </Link>

                                    <CardHeader className='flex-1'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Avatar className='h-8 w-8'>
                                                <AvatarImage
                                                    src={
                                                        course.instructor_avatar
                                                    }
                                                />
                                                <AvatarFallback>
                                                    {course.instructor_name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className='text-sm text-gray-400'>
                                                {course.instructor_name}
                                            </span>
                                        </div>
                                        <CardTitle className='line-clamp-2 hover:text-primary transition-colors text-white'>
                                            <Link to={`/courses/${course.id}`}>
                                                {course.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className='line-clamp-2 text-gray-400'>
                                            {course.description}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <div className='flex items-center gap-4 text-sm text-gray-400 mb-3'>
                                            <div className='flex items-center gap-1'>
                                                <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                                                <span>{course.rating_avg}</span>
                                                <span className='text-gray-400'>
                                                    ({course.rating_count})
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <Users className='h-4 w-4 text-gray-400' />
                                                <span>
                                                    {course.enrolled_count.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className='flex items-center justify-between text-sm text-gray-400'>
                                            <div className='flex items-center gap-1'>
                                                <BookOpen className='h-4 w-4 text-gray-400' />
                                                <span>
                                                    {course.lessons_count} bài
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <Clock className='h-4 w-4 text-gray-400' />
                                                <span>
                                                    {formatDuration(
                                                        course.duration_minutes
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className='border-t border-[#2D2D2D] pt-4'>
                                        <div className='flex items-center justify-between w-full'>
                                            {course.is_free ? (
                                                <span className='text-2xl text-green-500'>
                                                    Miễn phí
                                                </span>
                                            ) : (
                                                <div>
                                                    {course.discount_price ? (
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-2xl text-blue-500'>
                                                                {formatPrice(
                                                                    course.discount_price
                                                                )}
                                                            </span>
                                                            <span className='text-sm text-gray-500 line-through'>
                                                                {formatPrice(
                                                                    course.original_price
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className='text-2xl text-blue-500'>
                                                            {formatPrice(
                                                                course.original_price
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className='py-12 bg-background'>
                <div className='container mx-auto px-4'>
                    <div className='flex items-center justify-between mb-12'>
                        <div className='text-center flex-1'>
                            <h2 className='text-3xl md:text-4xl mb-4 text-foreground'>
                                Khám phá theo danh mục
                            </h2>
                            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                                Tìm khóa học phù hợp với sở thích và mục tiêu
                                của bạn
                            </p>
                            <Button
                                variant='outline'
                                asChild
                                className='border-border text-foreground hover:bg-accent mt-2'
                            >
                                <Link to='/categories'>Xem tất cả</Link>
                            </Button>
                        </div>
                    </div>
                    {isLoadingCategories ? (
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'>
                            {[...Array(6)].map((_, index) => (
                                <Card
                                    key={index}
                                    className='bg-[#1A1A1A] border-[#2D2D2D] h-full animate-pulse'
                                >
                                    <CardContent className='pt-6 text-center'>
                                        <div className='flex justify-center mb-4'>
                                            <div className='p-4 rounded-full bg-gray-700 w-16 h-16'></div>
                                        </div>
                                        <div className='h-4 bg-gray-700 rounded w-3/4 mx-auto'></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : categories.length > 0 ? (
                        <div className='relative px-2 md:px-4'>
                            <Slider
                                dots={false}
                                infinite={false}
                                speed={500}
                                slidesToShow={5}
                                slidesToScroll={1}
                                nextArrow={<NextArrow />}
                                prevArrow={<PrevArrow />}
                                responsive={[
                                    {
                                        breakpoint: 1024, // Tablet
                                        settings: {
                                            slidesToShow: 3,
                                            slidesToScroll: 1,
                                        },
                                    },
                                    {
                                        breakpoint: 768, // Mobile
                                        settings: {
                                            slidesToShow: 1,
                                            slidesToScroll: 1,
                                        },
                                    },
                                ]}
                            >
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className='px-3 min-w-0'
                                    >
                                        <Link
                                            to={`/categories/${category.id}`}
                                            className='group block h-full'
                                        >
                                            <Card className='bg-[#1A1A1A] border-[#2D2D2D] hover:border-primary transition-all duration-300 cursor-pointer h-full overflow-hidden hover:shadow-lg hover:shadow-primary/20 flex flex-col'>
                                                <CardContent className='p-0 flex flex-col h-full min-w-0'>
                                                    {/* Image Container */}
                                                    <div className='relative overflow-hidden h-30 shrink-0'>
                                                        <img
                                                            src={
                                                                category.imageUrl ||
                                                                'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'
                                                            }
                                                            alt={category.name}
                                                            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                                                        />
                                                        {/* Gradient Overlay */}
                                                        <div className='absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300'></div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className='p-6 text-center flex-1 flex flex-col justify-center min-h-[100px] overflow-hidden min-w-0'>
                                                        {/* Category Name */}
                                                        <h3 className='text-white group-hover:text-primary transition-colors duration-300 mb-2 line-clamp-1'>
                                                            {category.name}
                                                        </h3>

                                                        {/* Description */}
                                                        <p className='text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]'>
                                                            {
                                                                category.description
                                                            }
                                                        </p>
                                                        {category.coursesCount !==
                                                            undefined && (
                                                            <p className='text-sm text-muted-foreground break-words overflow-hidden line-clamp-1'>
                                                                {
                                                                    category.coursesCount
                                                                }{' '}
                                                                khóa học
                                                            </p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </div>
                                ))}
                            </Slider>
                        </div>
                    ) : (
                        <div className='text-center py-8 text-muted-foreground'>
                            Không có danh mục nào
                        </div>
                    )}
                </div>
            </section>

            {/* AI Advisor - Floating Button */}
            <AdvisorCard />
        </div>
    )
}
