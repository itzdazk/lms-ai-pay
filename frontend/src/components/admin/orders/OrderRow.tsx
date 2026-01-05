import { useState, useEffect, useRef } from 'react'
import {
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { MoreVertical, Eye, BookOpen } from 'lucide-react'
import { formatDateTime } from '../../../lib/utils'
import type { Order } from '../../../lib/api/types'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

interface OrderRowProps {
    order: Order
    isSelected: boolean
    onRowSelect: (id: number | null) => void
    onViewDetail: (order: Order) => void
}

export function OrderRow({
    order,
    isSelected,
    onRowSelect,
    onViewDetail,
}: OrderRowProps) {
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
            onRowSelect(null)
        } else {
            onRowSelect(order.id)
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
                top = 8
            }
        }

        setAdjustedPosition({ x: left, y: top, transform })
    }, [menuOpen, menuPosition])

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false)
            }
        }

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    const getStatusBadge = (status: Order['paymentStatus']) => {
        const statusMap: Record<
            Order['paymentStatus'],
            { label: string; className: string }
        > = {
            PENDING: {
                label: 'Đang chờ',
                className:
                    'bg-yellow-600/20 text-yellow-300 border border-yellow-500/40',
            },
            PAID: {
                label: 'Đã thanh toán',
                className:
                    'bg-green-600/20 text-green-300 border border-green-500/40',
            },
            FAILED: {
                label: 'Thất bại',
                className:
                    'bg-red-600/20 text-red-300 border border-red-500/40',
            },
            REFUNDED: {
                label: 'Đã hoàn tiền',
                className:
                    'bg-purple-600/20 text-purple-300 border border-purple-500/40',
            },
            PARTIALLY_REFUNDED: {
                label: 'Hoàn tiền một phần',
                className:
                    'bg-orange-600/20 text-orange-300 border border-orange-500/40',
            },
            REFUND_PENDING: {
                label: 'Đang chờ hoàn tiền',
                className:
                    'bg-yellow-600/20 text-yellow-300 border border-yellow-500/40',
            },
            REFUND_FAILED: {
                label: 'Hoàn tiền thất bại',
                className:
                    'bg-red-600/20 text-red-300 border border-red-500/40',
            },
        }
        const statusInfo = statusMap[status] || statusMap.PENDING
        return (
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        )
    }

    return (
        <>
            <DarkOutlineTableRow
                className='cursor-pointer'
                selected={isSelected}
                onRowToggle={handleToggle}
            >
                <DarkOutlineTableCell className='min-w-[120px]'>
                    <div className='flex flex-col gap-1'>
                        <span className='font-medium text-white'>
                            {order.orderCode}
                        </span>
                        {order.user && (
                            <span className='text-xs text-gray-400'>
                                {order.user.fullName}
                            </span>
                        )}
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='min-w-[200px]'>
                    {order.course ? (
                        <div className='flex items-start gap-3'>
                            {order.course.thumbnailUrl ? (
                                <img
                                    src={order.course.thumbnailUrl}
                                    alt={
                                        order.course.title || 'Course thumbnail'
                                    }
                                    className='w-16 h-10 object-cover rounded shrink-0'
                                />
                            ) : (
                                <div className='w-16 h-10 bg-[#2D2D2D] rounded flex items-center justify-center shrink-0'>
                                    <BookOpen className='h-5 w-5 text-gray-400' />
                                </div>
                            )}
                            <div className='min-w-0 flex-1'>
                                <span className='text-white font-medium line-clamp-1 block'>
                                    {order.course.title}
                                </span>
                                <span className='text-xs text-gray-400'>
                                    {order.course.instructor?.fullName}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className='text-gray-400'>N/A</span>
                    )}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[120px]'>
                    {getStatusBadge(order.paymentStatus)}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <span className='text-white'>{order.paymentGateway}</span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[130px]'>
                    <div className='flex flex-col gap-1'>
                        <span className='text-white font-medium'>
                            {formatPrice(order.finalPrice)}
                        </span>
                        {order.discountAmount > 0 && (
                            <span className='text-xs text-gray-400 line-through'>
                                {formatPrice(order.originalPrice)}
                            </span>
                        )}
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[150px]'>
                    <span className='text-gray-300'>
                        {formatDateTime(order.createdAt)}
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
                                onRowSelect(order.id)
                            }
                            setMenuPosition({ x: e.clientX, y: e.clientY })
                            setMenuOpen(true)
                        }}
                    >
                        <MoreVertical className='h-4 w-4' />
                    </Button>
                </DarkOutlineTableCell>
            </DarkOutlineTableRow>

            {menuOpen && (
                <div
                    ref={menuRef}
                    className='fixed z-50 min-w-32 rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md'
                    style={{
                        left: `${adjustedPosition.x}px`,
                        top: `${adjustedPosition.y}px`,
                        transform: adjustedPosition.transform,
                    }}
                >
                    <div
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                        onClick={() => {
                            onViewDetail(order)
                            setMenuOpen(false)
                        }}
                    >
                        <Eye className='h-4 w-4' />
                        Xem chi tiết
                    </div>
                </div>
            )}
        </>
    )
}
