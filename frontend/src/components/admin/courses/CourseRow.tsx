import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '@/components/ui/dark-outline-table'
import {
    BookOpen,
    Users,
    Star,
    MoreVertical,
    Eye,
    Star as StarIcon,
    BarChart3,
    Edit,
    RefreshCw,
    Trash2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatDuration } from '@/components/instructor/courses/courseFormatters'
import type { AdminCourse } from '@/lib/api/admin-courses'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

interface CourseRowProps {
    course: AdminCourse
    onToggleFeatured: (course: AdminCourse) => void
    onViewCourse: (course: AdminCourse) => void
    onEditCourse: (course: AdminCourse) => void
    onViewAnalytics: (course: AdminCourse) => void
    onViewStudents: (course: AdminCourse) => void
    onChangeStatus: (course: AdminCourse) => void
    onDeleteCourse: (course: AdminCourse) => void
    isSelected: boolean
    onSelect: (courseId: number | null) => void
}

export function CourseRow({
    course,
    onToggleFeatured,
    onViewCourse,
    onEditCourse,
    onViewAnalytics,
    onViewStudents,
    onChangeStatus,
    onDeleteCourse,
    isSelected,
    onSelect,
}: CourseRowProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [adjustedPosition, setAdjustedPosition] = useState({
        x: 0,
        y: 0,
        transform: 'translate(-100%, 0)',
    })
    const menuRef = useRef<HTMLDivElement>(null)

    const handleToggle = (
        isCurrentlySelected: boolean,
        e: React.MouseEvent<HTMLTableRowElement>
    ) => {
        e.preventDefault()
        if (isCurrentlySelected) {
            onSelect(null)
        } else {
            onSelect(course.id)
            setMenuPosition({ x: e.clientX, y: e.clientY })
            setMenuOpen(true)
        }
    }

    // Adjust menu position to stay within viewport
    useEffect(() => {
        if (!menuOpen || !menuRef.current) return

        const menu = menuRef.current
        const menuRect = menu.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let left = menuPosition.x
        let top = menuPosition.y
        let transform = 'translate(-100%, 0)'

        if (left - menuRect.width < 0) {
            transform = 'translate(0, 0)'
            left = menuPosition.x
        }

        if (left + menuRect.width > viewportWidth) {
            transform = 'translate(-100%, 0)'
            left = menuPosition.x
            if (left - menuRect.width < 0) {
                left = viewportWidth - menuRect.width - 8
            }
        }

        if (top + menuRect.height > viewportHeight) {
            top = menuPosition.y - menuRect.height
            if (top < 0) {
                top = viewportHeight - menuRect.height - 8
            }
        }

        if (top < 0) {
            top = 8
        }

        setAdjustedPosition({ x: left, y: top, transform })
    }, [menuOpen, menuPosition])

    // Close menu when clicking outside and disable scroll when menu is open
    useEffect(() => {
        if (!menuOpen) return

        const scrollContainer = document.querySelector('main') || window
        const savedScrollPosition =
            scrollContainer === window
                ? window.scrollY || document.documentElement.scrollTop
                : (scrollContainer as HTMLElement).scrollTop

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false)
            }
        }

        const handleScroll = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            if (scrollContainer === window) {
                window.scrollTo(0, savedScrollPosition)
            } else {
                ;(scrollContainer as HTMLElement).scrollTop =
                    savedScrollPosition
            }
        }

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault()
            e.stopPropagation()
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown' ||
                e.key === 'PageUp' ||
                e.key === 'PageDown' ||
                e.key === 'Home' ||
                e.key === 'End' ||
                e.key === ' '
            ) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('wheel', handleWheel, { passive: false })
        document.addEventListener('touchmove', handleTouchMove, {
            passive: false,
        })
        document.addEventListener('scroll', handleScroll, {
            passive: false,
            capture: true,
        })
        document.addEventListener('keydown', handleKeyDown, { passive: false })

        if (scrollContainer !== window) {
            ;(scrollContainer as HTMLElement).addEventListener(
                'scroll',
                handleScroll,
                { passive: false, capture: true }
            )
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('wheel', handleWheel)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('scroll', handleScroll, {
                capture: true,
            })
            document.removeEventListener('keydown', handleKeyDown)
            if (scrollContainer !== window) {
                ;(scrollContainer as HTMLElement).removeEventListener(
                    'scroll',
                    handleScroll,
                    { capture: true }
                )
            }
        }
    }, [menuOpen])

    return (
        <>
            <DarkOutlineTableRow
                className='cursor-pointer'
                selected={isSelected}
                onRowToggle={handleToggle}
            >
                <DarkOutlineTableCell className='min-w-[250px] max-w-[400px]'>
                    <div className='flex items-center gap-3 min-w-0'>
                        {course.thumbnailUrl ? (
                            <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className='w-16 h-10 object-cover rounded flex-shrink-0'
                            />
                        ) : (
                            <div className='w-16 h-10 bg-[#2D2D2D] rounded flex items-center justify-center flex-shrink-0'>
                                <BookOpen className='h-5 w-5 text-gray-400' />
                            </div>
                        )}
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-start gap-2 min-w-0'>
                                <p className='font-medium text-white break-words whitespace-normal'>
                                    {course.title}
                                </p>
                                {course.isFeatured && (
                                    <StarIcon className='h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5' />
                                )}
                            </div>
                            <p className='text-sm text-gray-400 break-words whitespace-normal'>
                                {course.totalLessons} bài •{' '}
                                {formatDuration(
                                    typeof course.durationHours === 'number'
                                        ? course.durationHours
                                        : Number(course.durationHours) || 0
                                )}
                            </p>
                        </div>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[120px]'>
                    {course.status === 'PUBLISHED' ? (
                        <Badge className='bg-green-600'>Đã xuất bản</Badge>
                    ) : course.status === 'DRAFT' ? (
                        <Badge
                            variant='outline'
                            className='border-[#2D2D2D] text-gray-300'
                        >
                            Bản nháp
                        </Badge>
                    ) : (
                        <Badge
                            variant='secondary'
                            className='bg-gray-600 text-white'
                        >
                            Đã lưu trữ
                        </Badge>
                    )}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[150px]'>
                    <span
                        className='text-gray-300 truncate block'
                        title={course.instructor.fullName}
                    >
                        {course.instructor.fullName}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[130px]'>
                    <span
                        className='text-gray-300 truncate block'
                        title={course.category.name}
                    >
                        {course.category.name}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <div className='flex items-center gap-1'>
                        <Users className='h-4 w-4 text-gray-400 flex-shrink-0' />
                        <span className='text-gray-300'>
                            {(course.enrolledCount || 0).toLocaleString()}
                        </span>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <div className='flex items-center gap-1'>
                        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0' />
                        <span className='text-gray-300'>
                            {course.ratingCount > 0 && course.ratingAvg
                                ? (typeof course.ratingAvg === 'number'
                                      ? course.ratingAvg
                                      : parseFloat(String(course.ratingAvg)) ||
                                        0
                                  ).toFixed(1)
                                : '-'}{' '}
                            ({course.ratingCount || 0})
                        </span>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[120px]'>
                    {(() => {
                        // Convert to number if needed (handle Decimal from Prisma)
                        const priceNum =
                            typeof course.price === 'string'
                                ? parseFloat(course.price)
                                : course.price
                        const discountPriceNum =
                            course.discountPrice !== null &&
                            course.discountPrice !== undefined
                                ? typeof course.discountPrice === 'string'
                                    ? parseFloat(course.discountPrice)
                                    : course.discountPrice
                                : null

                        const finalPrice =
                            discountPriceNum !== null
                                ? discountPriceNum
                                : priceNum

                        // Check if final price is 0
                        if (
                            finalPrice === 0 ||
                            finalPrice === null ||
                            finalPrice === undefined ||
                            isNaN(finalPrice)
                        ) {
                            return (
                                <span className='text-green-400 font-semibold'>
                                    Miễn phí
                                </span>
                            )
                        }

                        return (
                            <div className='flex flex-col'>
                                {discountPriceNum !== null &&
                                discountPriceNum !== priceNum ? (
                                    <>
                                        <span className='text-blue-400 font-semibold'>
                                            {formatPrice(discountPriceNum)}
                                        </span>
                                        <span className='text-gray-500 text-xs line-through'>
                                            {formatPrice(priceNum)}
                                        </span>
                                    </>
                                ) : (
                                    <span className='text-blue-400 font-semibold'>
                                        {formatPrice(priceNum)}
                                    </span>
                                )}
                            </div>
                        )
                    })()}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
                    <span className='text-gray-300'>
                        {formatDate(course.createdAt)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
                    <span className='text-gray-300'>
                        {formatDate(course.updatedAt)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='text-right w-[100px]'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!isSelected) {
                                onSelect(course.id)
                            }
                            setMenuPosition({ x: e.clientX, y: e.clientY })
                            setMenuOpen(true)
                        }}
                    >
                        <MoreVertical className='h-4 w-4' />
                    </Button>
                </DarkOutlineTableCell>
            </DarkOutlineTableRow>

            {menuOpen &&
                createPortal(
                    <div
                        ref={menuRef}
                        className='fixed z-50 min-w-[12rem] rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md'
                        style={{
                            left: `${adjustedPosition.x}px`,
                            top: `${adjustedPosition.y}px`,
                            transform: adjustedPosition.transform,
                        }}
                    >
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onViewCourse(course)
                                setMenuOpen(false)
                            }}
                        >
                            <Eye className='h-4 w-4' />
                            Xem
                        </div>
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onToggleFeatured(course)
                                setMenuOpen(false)
                            }}
                        >
                            <StarIcon className='h-4 w-4' />
                            {course.isFeatured
                                ? 'Bỏ đánh dấu nổi bật'
                                : 'Đánh dấu nổi bật'}
                        </div>
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onViewAnalytics(course)
                                setMenuOpen(false)
                            }}
                        >
                            <BarChart3 className='h-4 w-4' />
                            Phân tích
                        </div>
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onEditCourse(course)
                                setMenuOpen(false)
                            }}
                        >
                            <Edit className='h-4 w-4' />
                            Chỉnh sửa
                        </div>
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onChangeStatus(course)
                                setMenuOpen(false)
                            }}
                        >
                            <RefreshCw className='h-4 w-4' />
                            Đổi trạng thái
                        </div>
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onViewStudents(course)
                                setMenuOpen(false)
                            }}
                        >
                            <Users className='h-4 w-4' />
                            Xem danh sách học viên
                        </div>
                        <div className='h-px bg-[#2D2D2D] my-1' />
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-[#1F1F1F] cursor-pointer'
                            onClick={() => {
                                onDeleteCourse(course)
                                setMenuOpen(false)
                            }}
                        >
                            <Trash2 className='h-4 w-4' />
                            Xóa
                        </div>
                    </div>,
                    document.body
                )}
        </>
    )
}
