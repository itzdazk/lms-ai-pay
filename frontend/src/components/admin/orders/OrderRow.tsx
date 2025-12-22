import { useState, useEffect, useRef } from 'react'
import {
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { MoreVertical, Eye, RotateCcw } from 'lucide-react'
import { formatDate, formatDateTime } from '../../../lib/utils'
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
    onRefund: (order: Order) => void
}

export function OrderRow({
    order,
    isSelected,
    onRowSelect,
    onViewDetail,
    onRefund,
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
        const statusMap = {
            PENDING: {
                label: 'Đang chờ',
                className:
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            },
            PAID: {
                label: 'Đã thanh toán',
                className: 'bg-green-500/20 text-green-400 border-green-500/30',
            },
            FAILED: {
                label: 'Thất bại',
                className: 'bg-red-500/20 text-red-400 border-red-500/30',
            },
            REFUNDED: {
                label: 'Đã hoàn tiền',
                className:
                    'bg-purple-500/20 text-purple-400 border-purple-500/30',
            },
            PARTIALLY_REFUNDED: {
                label: 'Hoàn tiền một phần',
                className:
                    'bg-orange-500/20 text-orange-400 border-orange-500/30',
            },
        }
        const statusInfo = statusMap[status] || statusMap.PENDING
        return (
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        )
    }

    const canRefund =
        order.paymentStatus === 'PAID' ||
        order.paymentStatus === 'PARTIALLY_REFUNDED'

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
                        <div className='flex flex-col gap-1'>
                            <span className='text-white font-medium'>
                                {order.course.title}
                            </span>
                            {order.course.instructor && (
                                <span className='text-xs text-gray-400'>
                                    {order.course.instructor.fullName}
                                </span>
                            )}
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
                    className='fixed z-50 min-w-[8rem] rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md'
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
                    {canRefund && (
                        <div
                            className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 cursor-pointer'
                            onClick={() => {
                                onRefund(order)
                                setMenuOpen(false)
                            }}
                        >
                            <RotateCcw className='h-4 w-4' />
                            Hoàn tiền
                        </div>
                    )}
                </div>
            )}
        </>
    )
}
