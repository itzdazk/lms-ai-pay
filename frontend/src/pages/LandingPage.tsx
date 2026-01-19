import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import {
    Card,
    CardContent,
} from '../components/ui/card'
import {
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import Slider from 'react-slick'
import { categoriesApi } from '../lib/api/categories'
import type { Category } from '../lib/api/types'
import { useTheme } from '../contexts/ThemeContext'
import { AdvisorCard } from '../components/AI/AdvisorCard'
import { FeaturedCoursesSection } from '../components/Courses'
import { CONTACT_INFO } from '../lib/constants'
import { getPublicSystemConfig } from '../lib/api/system-config'
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
    const [landingConfig, setLandingConfig] = useState<{
        heroTitle: string
        heroDescription: string
        heroBackgroundImage: string
        categoriesTitle: string
        categoriesDescription: string
    } | null>(null)
    const [contactInfo, setContactInfo] = useState(CONTACT_INFO)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load landing config and contact info
                const publicConfig = await getPublicSystemConfig()
                console.log('📥 Public config received:', publicConfig)
                console.log('📥 Landing config:', publicConfig.landing)
                if (publicConfig.landing) {
                    console.log('✅ Setting landing config:', publicConfig.landing)
                    setLandingConfig(publicConfig.landing)
                } else {
                    console.warn('⚠️ No landing config in response')
                }
                if (publicConfig.contact) {
                    setContactInfo(publicConfig.contact as any)
                }
            } catch (error) {
                console.error('❌ Failed to load system config:', error)
                // Use defaults from constants
            }

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

        fetchData()
    }, [])
    return (
        <div className='flex flex-col bg-background text-foreground'>
            {/* Hero Section */}
            <section className='relative bg-background text-foreground'>
                {/* Background Image */}
                <div
                    className='absolute inset-0 bg-cover bg-center bg-no-repeat'
                    style={{
                        backgroundImage: landingConfig?.heroBackgroundImage
                            ? `url('${landingConfig.heroBackgroundImage}')`
                            : "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80')",
                    }}
                ></div>
                <div className='absolute inset-0 bg-background/50 backdrop-blur-sm'></div>

                <div className='container mx-auto px-4 py-12 sm:py-16 md:py-24 lg:py-32 relative z-10'>
                    <div className='max-w-3xl'>
                        <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-foreground drop-shadow-lg leading-tight'>
                            {landingConfig?.heroTitle || 'Học tập thông minh với AI'}
                        </h1>
                        <p className='text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 drop-shadow-md'>
                            {landingConfig?.heroDescription || 'Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp với hơn 1000+ khóa học chất lượng cao.'}
                        </p>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center'>
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
                            <div className='flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground'>
                                <Mail className='h-4 w-4' />
                                <span>Cần hỗ trợ? Liên hệ:</span>
                                <a
                                    href={`mailto:${contactInfo.email}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        window.location.href = `mailto:${contactInfo.email}`
                                    }}
                                    className='text-blue-500 hover:text-blue-400 underline font-medium'
                                >
                                    {contactInfo.email}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <FeaturedCoursesSection />

            {/* Categories Section */}
            <section className='py-8 sm:py-12 bg-background'>
                <div className='container mx-auto px-4'>
                    <div className='flex flex-col items-center justify-center mb-8 sm:mb-12 text-center'>
                        <h2 className='text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 text-foreground'>
                            {landingConfig?.categoriesTitle || 'Khám phá theo danh mục'}
                        </h2>
                        <p className='text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6'>
                            {landingConfig?.categoriesDescription || 'Tìm khóa học phù hợp với sở thích và mục tiêu của bạn'}
                        </p>
                        <Button
                            variant='outline'
                            asChild
                            className='border-border text-foreground hover:bg-accent'
                        >
                            <Link to='/courses'>Xem tất cả</Link>
                        </Button>
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
                        <div className='relative px-1 sm:px-2 md:px-4'>
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
                                        breakpoint: 1280, // xl
                                        settings: {
                                            slidesToShow: 5,
                                            slidesToScroll: 1,
                                        },
                                    },
                                    {
                                        breakpoint: 1024, // lg
                                        settings: {
                                            slidesToShow: 4,
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
                                {categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className='px-2 sm:px-3 min-w-0'
                                    >
                                        <Link
                                            to={`/courses?categoryId=${category.id}`}
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
                                                    <div className='p-4 sm:p-6 text-center flex-1 flex flex-col justify-center min-h-[100px] overflow-hidden min-w-0'>
                                                        {/* Category Name */}
                                                        <h3 className='text-sm sm:text-base text-white group-hover:text-primary transition-colors duration-300 mb-2 line-clamp-1'>
                                                            {category.name}
                                                        </h3>

                                                        {/* Description */}
                                                        <p className='text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]'>
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
