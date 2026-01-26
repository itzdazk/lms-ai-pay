import { useState, useEffect, useRef } from 'react'
import {
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../ui/dark-outline-table'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Switch } from '../../ui/switch'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { formatPrice } from '../../../lib/courseUtils'
import type { Coupon } from '../../../lib/api/types'

interface CouponRowProps {
    coupon: Coupon
    isSelected: boolean
    togglingId: number | null
    onRowSelect: (id: number | null) => void
    onEdit: (coupon: Coupon) => void
    onDelete: (couponId: number) => void
    onToggleActive: (id: number, currentStatus: boolean) => void
    onViewUsageHistory: (couponId: number) => void
}

export function CouponRow({
    coupon,
    isSelected,
    togglingId,
    onRowSelect,
    onEdit,
    onDelete,
    onToggleActive,
    onViewUsageHistory,
}: CouponRowProps) {
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
        e: React.MouseEvent<HTMLTableRowElement>,
    ) => {
        // Don't select row if clicking on switch or interactive elements
        if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('[role="switch"]')
        ) {
            return
        }

        e.preventDefault()
        if (isCurrentlySelected) {
            onRowSelect(null)
        } else {
            onRowSelect(coupon.id)
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

    const getCouponTypeBadge = (type: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            PERCENT: {
                label: 'Phần trăm',
                className: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
            },
            FIXED: {
                label: 'Cố định',
                className: 'bg-green-600/20 text-green-400 border-green-500/30',
            },
            NEW_USER: {
                label: 'Người dùng mới',
                className:
                    'bg-purple-600/20 text-purple-400 border-purple-500/30',
            },
        }
        const variant = variants[type] || variants.FIXED
        return (
            <Badge className={`${variant.className} border`}>
                {variant.label}
            </Badge>
        )
    }

    return (
        <>
            <DarkOutlineTableRow
                className={isSelected ? 'bg-[#252525]' : ''}
                selected={isSelected}
                onRowToggle={handleToggle}
            >
                <DarkOutlineTableCell className='font-mono'>
                    {coupon.code}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>
                    {getCouponTypeBadge(coupon.type)}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>
                    {coupon.type === 'PERCENT'
                        ? `${coupon.value}%`
                        : formatPrice(coupon.value)}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onViewUsageHistory(coupon.id)
                        }}
                        className='text-blue-400 hover:underline'
                    >
                        {coupon.usesCount}
                        {coupon.maxUses ? `/${coupon.maxUses}` : ''}
                    </button>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='text-green-400'>
                    {formatPrice(coupon.totalDiscountGiven || 0)}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                            checked={coupon.active}
                            onCheckedChange={() =>
                                onToggleActive(coupon.id, coupon.active)
                            }
                            disabled={togglingId === coupon.id}
                        />
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='text-sm'>
                    {new Date(coupon.startDate).toLocaleDateString('vi-VN')} -{' '}
                    {new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='text-right'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!isSelected) {
                                onRowSelect(coupon.id)
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
                            onEdit(coupon)
                            setMenuOpen(false)
                        }}
                    >
                        <Edit className='h-4 w-4' />
                        Chỉnh sửa
                    </div>
                    <div
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer'
                        onClick={() => {
                            onDelete(coupon.id)
                            setMenuOpen(false)
                        }}
                    >
                        <Trash2 className='h-4 w-4' />
                        Xóa
                    </div>
                </div>
            )}
        </>
    )
}
