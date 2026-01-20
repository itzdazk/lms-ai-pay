import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import { Loader2 } from 'lucide-react'
import { adminCouponsApi } from '../../lib/api/admin-coupons'
import type { Coupon, CreateCouponRequest } from '../../lib/api/types'
import { toast } from 'sonner'

interface CouponFormProps {
    coupon?: Coupon | null
    onSuccess: () => void
    onCancel: () => void
}

export function CouponForm({ coupon, onSuccess, onCancel }: CouponFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<CreateCouponRequest>({
        code: '',
        type: 'PERCENT',
        value: 0,
        maxDiscount: undefined,
        minOrderValue: undefined,
        applicableCourseIds: [],
        applicableCategoryIds: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        maxUses: undefined,
        maxUsesPerUser: undefined,
    })

    useEffect(() => {
        if (coupon) {
            setFormData({
                code: coupon.code,
                type:
                    ((coupon.type as string)?.toUpperCase() as any) ||
                    'PERCENT',
                value: coupon.value,
                maxDiscount: coupon.maxDiscount,
                minOrderValue: coupon.minOrderValue,
                applicableCourseIds: coupon.applicableCourseIds || [],
                applicableCategoryIds: coupon.applicableCategoryIds || [],
                startDate: new Date(coupon.startDate)
                    .toISOString()
                    .split('T')[0],
                endDate: new Date(coupon.endDate).toISOString().split('T')[0],
                maxUses: coupon.maxUses,
                maxUsesPerUser: coupon.maxUsesPerUser,
            })
        }
    }, [coupon])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.code.trim()) {
            toast.error('Vui lòng nhập mã giảm giá')
            return
        }

        if (formData.value <= 0) {
            toast.error('Giá trị giảm giá phải lớn hơn 0')
            return
        }

        if (formData.type === 'PERCENT' && formData.value > 100) {
            toast.error('Giá trị phần trăm không được vượt quá 100')
            return
        }

        if (new Date(formData.endDate) < new Date(formData.startDate)) {
            toast.error('Ngày kết thúc phải sau ngày bắt đầu')
            return
        }

        setIsSubmitting(true)
        try {
            const endDate = new Date(formData.endDate)
            endDate.setHours(23, 59, 59, 999)

            const payload = {
                ...formData,
                code: formData.code.toUpperCase().trim(),
                type: coupon ? formData.type || coupon.type : formData.type,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: endDate.toISOString(),
            }

            if (coupon) {
                await adminCouponsApi.updateCoupon(coupon.id, payload)
                toast.success('Cập nhật mã giảm giá thành công')
            } else {
                await adminCouponsApi.createCoupon(payload)
                toast.success('Tạo mã giảm giá thành công')
            }

            onSuccess()
        } catch (error: any) {
            console.error('Error saving coupon:', error)
            // Error toast is handled by API client interceptor
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
                {/* Coupon Code */}
                <div className='space-y-2'>
                    <Label htmlFor='code' className='text-white'>
                        Mã giảm giá <span className='text-red-400'>*</span>
                    </Label>
                    <Input
                        id='code'
                        value={formData.code}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                code: e.target.value.toUpperCase(),
                            }))
                        }
                        placeholder='VD: SUMMER2024'
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                        required
                    />
                </div>

                {/* Type */}
                <div className='space-y-2'>
                    <Label htmlFor='type' className='text-white'>
                        Loại mã <span className='text-red-400'>*</span>
                    </Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                type: value as any,
                                maxDiscount:
                                    value !== 'PERCENT'
                                        ? (null as any)
                                        : prev.maxDiscount,
                            }))
                        }
                    >
                        <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='PERCENT'>
                                Phần trăm (%)
                            </SelectItem>
                            <SelectItem value='FIXED'>Cố định (VNĐ)</SelectItem>
                            <SelectItem value='NEW_USER'>
                                Người dùng mới
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                {/* Value */}
                <div className='space-y-2'>
                    <Label htmlFor='value' className='text-white'>
                        Giá trị {formData.type === 'PERCENT' ? '(%)' : '(VNĐ)'}{' '}
                        <span className='text-red-400'>*</span>
                    </Label>
                    <Input
                        id='value'
                        type='number'
                        min='0'
                        max={formData.type === 'PERCENT' ? 100 : undefined}
                        value={formData.value}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                value: parseFloat(e.target.value) || 0,
                            }))
                        }
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                        required
                    />
                </div>

                {/* Max Discount (for PERCENT type) */}
                {formData.type === 'PERCENT' && (
                    <div className='space-y-2'>
                        <Label htmlFor='maxDiscount' className='text-white'>
                            Giảm tối đa (VNĐ)
                        </Label>
                        <Input
                            id='maxDiscount'
                            type='number'
                            min='0'
                            value={formData.maxDiscount || ''}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    maxDiscount: e.target.value
                                        ? parseFloat(e.target.value)
                                        : (null as any),
                                }))
                            }
                            placeholder='Không giới hạn'
                            className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                        />
                    </div>
                )}

                {/* Min Order Value */}
                <div className='space-y-2'>
                    <Label htmlFor='minOrderValue' className='text-white'>
                        Giá trị đơn tối thiểu (VNĐ)
                    </Label>
                    <Input
                        id='minOrderValue'
                        type='number'
                        min='0'
                        value={formData.minOrderValue || ''}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                minOrderValue: e.target.value
                                    ? parseFloat(e.target.value)
                                    : (null as any),
                            }))
                        }
                        placeholder='Không giới hạn'
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                    />
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                {/* Start Date */}
                <div className='space-y-2'>
                    <Label htmlFor='startDate' className='text-white'>
                        Ngày bắt đầu <span className='text-red-400'>*</span>
                    </Label>
                    <Input
                        id='startDate'
                        type='date'
                        value={formData.startDate}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                            }))
                        }
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                        required
                    />
                </div>

                {/* End Date */}
                <div className='space-y-2'>
                    <Label htmlFor='endDate' className='text-white'>
                        Ngày kết thúc <span className='text-red-400'>*</span>
                    </Label>
                    <Input
                        id='endDate'
                        type='date'
                        value={formData.endDate}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                endDate: e.target.value,
                            }))
                        }
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                        required
                    />
                </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
                {/* Max Uses */}
                <div className='space-y-2'>
                    <Label htmlFor='maxUses' className='text-white'>
                        Số lần sử dụng tối đa
                    </Label>
                    <Input
                        id='maxUses'
                        type='number'
                        min='1'
                        value={formData.maxUses || ''}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                maxUses: e.target.value
                                    ? parseInt(e.target.value)
                                    : (null as any),
                            }))
                        }
                        placeholder='Không giới hạn'
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                    />
                </div>

                {/* Max Uses Per User */}
                <div className='space-y-2'>
                    <Label htmlFor='maxUsesPerUser' className='text-white'>
                        Số lần dùng/người
                    </Label>
                    <Input
                        id='maxUsesPerUser'
                        type='number'
                        min='1'
                        value={formData.maxUsesPerUser || ''}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                maxUsesPerUser: e.target.value
                                    ? parseInt(e.target.value)
                                    : (null as any),
                            }))
                        }
                        placeholder='Không giới hạn'
                        className='bg-[#1F1F1F] border-[#2D2D2D] text-white'
                    />
                </div>
            </div>

            {/* Form Actions */}
            <div className='flex items-center justify-end gap-3 pt-4'>
                <Button
                    type='button'
                    variant='outline'
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className='border-[#2D2D2D] text-white hover:bg-[#1F1F1F]'
                >
                    Hủy
                </Button>
                <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className='h-4 w-4 animate-spin mr-2' />
                            Đang xử lý...
                        </>
                    ) : coupon ? (
                        'Cập nhật'
                    ) : (
                        'Tạo mã'
                    )}
                </Button>
            </div>
        </form>
    )
}
