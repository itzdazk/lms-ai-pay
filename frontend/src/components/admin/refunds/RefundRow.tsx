import { useState, useEffect, useRef } from 'react'
import {
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { MoreVertical, Eye, RotateCcw } from 'lucide-react'
import { formatDateTime } from '../../../lib/utils'
import type { RefundRequest } from '../../../lib/api/refund-requests'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

interface RefundRowProps {
    refundRequest: RefundRequest
    isSelected: boolean
    onRowSelect: (id: number | null) => void
    onViewDetail: (refundRequest: RefundRequest) => void
    onRefund: (refundRequest: RefundRequest) => void
}

export function RefundRow({
    refundRequest,
    isSelected,
    onRowSelect,
    onViewDetail,
    onRefund,
}: RefundRowProps) {
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
            onRowSelect(refundRequest.id)
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

    const getStatusBadge = (status: RefundRequest['status']) => {
        const statusMap = {
            PENDING: {
                label: 'Đang chờ xử lý',
                className:
                    'bg-yellow-600/20 text-yellow-300 border border-yellow-500/40',
            },
            APPROVED: {
                label: 'Đã hoàn tiền',
                className:
                    'bg-green-600/20 text-green-300 border border-green-500/40',
            },
            REJECTED: {
                label: 'Đã từ chối',
                className:
                    'bg-red-600/20 text-red-300 border border-red-500/40',
            },
        }
        const statusInfo = statusMap[status]
        if (!statusInfo) return null
        return (
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        )
    }

    const order = refundRequest.order
    if (!order) return null

    const refundAmount = (order as any).refundAmount || 0
    const maxRefundAmount = order.finalPrice - refundAmount
    const canRefund = maxRefundAmount > 0 && refundRequest.status === 'PENDING'

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
                        {refundRequest.student && (
                            <span className='text-xs text-gray-400'>
                                {refundRequest.student.fullName}
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
                        </div>
                    ) : (
                        <span className='text-gray-400'>N/A</span>
                    )}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[140px]'>
                    {getStatusBadge(refundRequest.status)}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[130px]'>
                    <span className='text-white font-medium'>
                        {formatPrice(order.finalPrice)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[130px]'>
                    <span className='text-orange-400 font-medium'>
                        {formatPrice(refundAmount)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[130px]'>
                    <span className='text-green-400 font-medium'>
                        {formatPrice(
                            refundRequest.suggestedRefundAmount ||
                                maxRefundAmount
                        )}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[150px]'>
                    <span className='text-gray-300'>
                        {formatDateTime(refundRequest.createdAt)}
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
                                onRowSelect(refundRequest.id)
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
                            onViewDetail(refundRequest)
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
                                onRefund(refundRequest)
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
