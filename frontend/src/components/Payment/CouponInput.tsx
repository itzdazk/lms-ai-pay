import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Loader2, Tag, X } from 'lucide-react'
import { couponsApi } from '../../lib/api/coupons'
import { toast } from 'sonner'
import type { ApplyCouponResponse } from '../../lib/api/types'

interface CouponInputProps {
    orderTotal: number
    courseIds?: number[]
    onCouponApplied?: (couponData: ApplyCouponResponse) => void
    onCouponRemoved?: () => void
    className?: string
}

export function CouponInput({
    orderTotal,
    courseIds,
    onCouponApplied,
    onCouponRemoved,
    className,
}: CouponInputProps) {
    const [couponCode, setCouponCode] = useState('')
    const [isApplying, setIsApplying] = useState(false)
    const [appliedCoupon, setAppliedCoupon] =
        useState<ApplyCouponResponse | null>(null)

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Vui lòng nhập mã giảm giá')
            return
        }

        setIsApplying(true)
        try {
            const result = await couponsApi.applyCoupon({
                code: couponCode.trim().toUpperCase(),
                orderTotal,
                courseIds,
            })

            setAppliedCoupon(result)
            toast.success('Áp dụng mã giảm giá thành công!')

            // Notify parent component
            if (onCouponApplied) {
                onCouponApplied(result)
            }
        } catch (error: any) {
            console.error('Error applying coupon:', error)
            // Error toast is handled by API client interceptor
        } finally {
            setIsApplying(false)
        }
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode('')
        toast.info('Đã xóa mã giảm giá')

        // Notify parent component
        if (onCouponRemoved) {
            onCouponRemoved()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !appliedCoupon) {
            handleApplyCoupon()
        }
    }

    if (appliedCoupon) {
        return (
            <div className={`space-y-2 ${className || ''}`}>
                <div className='flex items-center justify-between p-3 bg-green-600/20 border border-green-600/50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                        <Tag className='h-4 w-4 text-green-400' />
                        <div>
                            <p className='text-sm font-semibold text-green-400'>
                                {appliedCoupon.couponCode}
                            </p>
                            <p className='text-xs text-green-300'>
                                Giảm{' '}
                                {appliedCoupon.couponDetails.type === 'PERCENT'
                                    ? `${appliedCoupon.couponDetails.value}%`
                                    : `${appliedCoupon.discountAmount.toLocaleString('vi-VN')}đ`}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={handleRemoveCoupon}
                        className='h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-600/30'
                    >
                        <X className='h-4 w-4' />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className || ''}`}>
            <div className='flex gap-2'>
                <Input
                    placeholder='Nhập mã giảm giá'
                    value={couponCode}
                    onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                    }
                    onKeyPress={handleKeyPress}
                    disabled={isApplying}
                    className='bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                />
                <Button
                    variant='outline'
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponCode.trim()}
                    className='border-[#2D2D2D] bg-white  dark:text-black dark:text-white dark:hover:bg-black] min-w-[100px]'
                >
                    {isApplying ? (
                        <>
                            <Loader2 className='h-4 w-4 animate-spin mr-2' />
                            Đang xử lý
                        </>
                    ) : (
                        'Áp dụng'
                    )}
                </Button>
            </div>
        </div>
    )
}
