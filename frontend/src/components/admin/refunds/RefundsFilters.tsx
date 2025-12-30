import { Card, CardContent } from '../../ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select'
import { DarkOutlineButton } from '../../ui/buttons'
import { DarkOutlineInput } from '../../ui/dark-outline-input'
import { Label } from '../../ui/label'
import { FilterX } from 'lucide-react'

export interface RefundFilters {
    page?: number
    limit?: number
    paymentStatus?: 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED'
    search?: string
    sort?: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc'
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
}

interface RefundsFiltersProps {
    filters: RefundFilters
    onFilterChange: (key: keyof RefundFilters, value: any) => void
    onClearFilters: () => void
}

export function RefundsFilters({
    filters,
    onFilterChange,
    onClearFilters,
}: RefundsFiltersProps) {
    const hasActiveFilters =
        filters.paymentStatus ||
        filters.sort !== 'newest' ||
        filters.startDate ||
        filters.endDate ||
        filters.minAmount ||
        filters.maxAmount

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] mb-6'>
            <CardContent className='pt-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                    {/* Payment Status Filter */}
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Trạng thái hoàn tiền
                        </Label>
                        <Select
                            value={filters.paymentStatus || 'all'}
                            onValueChange={(value) =>
                                onFilterChange('paymentStatus', value)
                            }
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Tất cả trạng thái' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                <SelectItem value='all'>
                                    Tất cả trạng thái
                                </SelectItem>
                                <SelectItem value='PAID'>
                                    Đã thanh toán (Chưa hoàn)
                                </SelectItem>
                                <SelectItem value='PARTIALLY_REFUNDED'>
                                    Hoàn tiền một phần
                                </SelectItem>
                                <SelectItem value='REFUNDED'>
                                    Đã hoàn tiền
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort Filter */}
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>Sắp xếp</Label>
                        <Select
                            value={filters.sort || 'newest'}
                            onValueChange={(value) =>
                                onFilterChange('sort', value)
                            }
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Sắp xếp' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                <SelectItem value='newest'>Mới nhất</SelectItem>
                                <SelectItem value='oldest'>Cũ nhất</SelectItem>
                                <SelectItem value='amount_desc'>
                                    Giá trị cao nhất
                                </SelectItem>
                                <SelectItem value='amount_asc'>
                                    Giá trị thấp nhất
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start Date Filter */}
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>Từ ngày</Label>
                        <DarkOutlineInput
                            type='date'
                            value={filters.startDate || ''}
                            onChange={(e) =>
                                onFilterChange('startDate', e.target.value)
                            }
                        />
                    </div>

                    {/* End Date Filter */}
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Đến ngày
                        </Label>
                        <DarkOutlineInput
                            type='date'
                            value={filters.endDate || ''}
                            onChange={(e) =>
                                onFilterChange('endDate', e.target.value)
                            }
                        />
                    </div>

                    {/* Min Amount Filter */}
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Giá trị tối thiểu (VND)
                        </Label>
                        <DarkOutlineInput
                            type='number'
                            placeholder='0'
                            value={filters.minAmount || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'minAmount',
                                    e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                )
                            }
                        />
                    </div>

                    {/* Max Amount Filter */}
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Giá trị tối đa (VND)
                        </Label>
                        <DarkOutlineInput
                            type='number'
                            placeholder='0'
                            value={filters.maxAmount || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'maxAmount',
                                    e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined
                                )
                            }
                        />
                    </div>

                    {/* Clear Filters Button */}
                    <div className='space-y-2 flex items-end'>
                        <DarkOutlineButton
                            onClick={onClearFilters}
                            disabled={!hasActiveFilters}
                            className='w-full'
                        >
                            <FilterX className='h-4 w-4 mr-2' />
                            Xóa bộ lọc
                        </DarkOutlineButton>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
