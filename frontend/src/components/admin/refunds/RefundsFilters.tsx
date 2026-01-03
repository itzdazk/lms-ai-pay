import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'
import { Select, SelectValue } from '../../ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../../ui/dark-outline-select-trigger'
import { DarkOutlineInput } from '../../ui/dark-outline-input'
import { Filter } from 'lucide-react'

export interface RefundFilters {
    page?: number
    limit?: number
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
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
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] mb-6'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <Filter className='h-5 w-5' />
                    Bộ lọc
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='space-y-4'>
                    {/* First Row: 5 columns */}
                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                        {/* Refund Request Status Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Trạng thái yêu cầu
                            </Label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    onFilterChange(
                                        'status',
                                        value === 'all' ? undefined : value
                                    )
                                }
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue placeholder='Tất cả trạng thái' />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='all'>
                                        Tất cả trạng thái
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='PENDING'>
                                        Đang chờ xử lý
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='APPROVED'>
                                        Đã hoàn tiền
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='REJECTED'>
                                        Đã từ chối
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

                        {/* Sort Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Sắp xếp
                            </Label>
                            <Select
                                value={filters.sort || 'oldest'}
                                onValueChange={(value) =>
                                    onFilterChange('sort', value)
                                }
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue placeholder='Sắp xếp' />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='newest'>
                                        Mới nhất
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='oldest'>
                                        Cũ nhất
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='amount_desc'>
                                        Giá: Cao → Thấp
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='amount_asc'>
                                        Giá: Thấp → Cao
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

                        {/* Start Date Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Từ ngày
                            </Label>
                            <DarkOutlineInput
                                type='date'
                                value={filters.startDate || ''}
                                onChange={(e) =>
                                    onFilterChange(
                                        'startDate',
                                        e.target.value || undefined
                                    )
                                }
                            />
                        </div>

                        {/* End Date Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Đến ngày
                            </Label>
                            <DarkOutlineInput
                                type='date'
                                value={filters.endDate || ''}
                                onChange={(e) =>
                                    onFilterChange(
                                        'endDate',
                                        e.target.value || undefined
                                    )
                                }
                            />
                        </div>

                        {/* Clear Filters Button */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Thao tác
                            </Label>
                            <Button
                                onClick={onClearFilters}
                                variant='blue'
                                className='w-full'
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>

                    {/* Second Row: 3 columns */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {/* Min Amount Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Giá trị tối thiểu (VND)
                            </Label>
                            <DarkOutlineInput
                                type='number'
                                min='0'
                                step='1'
                                placeholder='0'
                                value={filters.minAmount || ''}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '') {
                                        onFilterChange('minAmount', undefined)
                                    } else {
                                        const numValue = parseFloat(value)
                                        if (!isNaN(numValue) && numValue >= 0) {
                                            onFilterChange(
                                                'minAmount',
                                                numValue
                                            )
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* Max Amount Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Giá trị tối đa (VND)
                            </Label>
                            <DarkOutlineInput
                                type='number'
                                min='0'
                                step='1'
                                placeholder='Không giới hạn'
                                value={filters.maxAmount || ''}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '') {
                                        onFilterChange('maxAmount', undefined)
                                    } else {
                                        const numValue = parseFloat(value)
                                        if (!isNaN(numValue) && numValue >= 0) {
                                            onFilterChange(
                                                'maxAmount',
                                                numValue
                                            )
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* Limit Filter */}
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Số lượng / trang
                            </Label>
                            <Select
                                value={filters.limit?.toString() || '10'}
                                onValueChange={(value) =>
                                    onFilterChange('limit', parseInt(value))
                                }
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue placeholder='10 / trang' />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='5'>
                                        5 / trang
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='10'>
                                        10 / trang
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='20'>
                                        20 / trang
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='50'>
                                        50 / trang
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='100'>
                                        100 / trang
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
