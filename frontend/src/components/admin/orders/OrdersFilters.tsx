import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Select, SelectValue } from '../../../components/ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../../../components/ui/dark-outline-select-trigger'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import { Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { AdminOrderFilters } from '../../../lib/api/admin-orders'

// Format number to currency string without VNĐ suffix (for input display)
function formatPriceInput(price: number | undefined | string): string {
    if (!price) return ''
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return ''
    return new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numPrice)
}

// Parse currency string to number (remove dots and spaces)
function parsePriceInput(value: string): number | undefined {
    if (!value || value.trim() === '') return undefined
    // Remove all dots, spaces, and non-numeric characters except digits
    const cleaned = value.replace(/[^\d]/g, '')
    if (cleaned === '') return undefined
    const parsed = parseFloat(cleaned)
    // Return the parsed number (including 0) if valid, undefined if NaN
    return isNaN(parsed) ? undefined : parsed
}

interface OrdersFiltersProps {
    filters: AdminOrderFilters
    onFilterChange: (key: keyof AdminOrderFilters, value: any) => void
    onClearFilters: () => void
}

export function OrdersFilters({
    filters,
    onFilterChange,
    onClearFilters,
}: OrdersFiltersProps) {
    // Local state for formatted display values
    const [minAmountDisplay, setMinAmountDisplay] = useState<string>(
        filters.minAmount ? formatPriceInput(filters.minAmount) : ''
    )
    const [maxAmountDisplay, setMaxAmountDisplay] = useState<string>(
        filters.maxAmount ? formatPriceInput(filters.maxAmount) : ''
    )

    // Sync display values when filters change externally (e.g., clear filters)
    useEffect(() => {
        setMinAmountDisplay(
            filters.minAmount ? formatPriceInput(filters.minAmount) : ''
        )
    }, [filters.minAmount])

    useEffect(() => {
        setMaxAmountDisplay(
            filters.maxAmount ? formatPriceInput(filters.maxAmount) : ''
        )
    }, [filters.maxAmount])

    const handleMinAmountChange = (value: string) => {
        setMinAmountDisplay(value)
        const parsedValue = parsePriceInput(value)

        if (parsedValue === undefined) {
            onFilterChange('minAmount', undefined)
            return
        }

        // Validation: >= 0
        if (parsedValue < 0) {
            return
        }

        // Validation: minAmount <= maxAmount (if maxAmount exists)
        if (
            filters.maxAmount !== undefined &&
            parsedValue > filters.maxAmount
        ) {
            return
        }

        // Update display with formatted value
        setMinAmountDisplay(formatPriceInput(parsedValue))
        // Save numeric value to state
        onFilterChange('minAmount', parsedValue)
    }

    const handleMaxAmountChange = (value: string) => {
        setMaxAmountDisplay(value)
        const parsedValue = parsePriceInput(value)

        if (parsedValue === undefined) {
            onFilterChange('maxAmount', undefined)
            return
        }

        // Validation: >= 0
        if (parsedValue < 0) {
            return
        }

        // Validation: maxAmount >= minAmount (if minAmount exists)
        if (
            filters.minAmount !== undefined &&
            parsedValue < filters.minAmount
        ) {
            return
        }

        // Update display with formatted value
        setMaxAmountDisplay(formatPriceInput(parsedValue))
        // Save numeric value to state
        onFilterChange('maxAmount', parsedValue)
    }

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
                    <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Trạng thái thanh toán
                            </Label>
                            <Select
                                value={filters.paymentStatus || 'all'}
                                onValueChange={(value) =>
                                    onFilterChange(
                                        'paymentStatus',
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
                                        Đang chờ
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='PAID'>
                                        Đã thanh toán
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='FAILED'>
                                        Thất bại
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='REFUNDED'>
                                        Đã hoàn tiền
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='PARTIALLY_REFUNDED'>
                                        Hoàn tiền một phần
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Sắp xếp
                            </Label>
                            <Select
                                value={filters.sort || 'newest'}
                                onValueChange={(value) =>
                                    onFilterChange('sort', value)
                                }
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue placeholder='Mới nhất' />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='newest'>
                                        Mới nhất
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='oldest'>
                                        Cũ nhất
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='amount_asc'>
                                        Giá: Thấp → Cao
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='amount_desc'>
                                        Giá: Cao → Thấp
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

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

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Giá tối thiểu (VND)
                            </Label>
                            <DarkOutlineInput
                                type='text'
                                inputMode='numeric'
                                placeholder='0'
                                value={minAmountDisplay}
                                onChange={(e) => {
                                    handleMinAmountChange(e.target.value)
                                }}
                                onBlur={(e) => {
                                    // Format on blur to ensure proper display
                                    const parsed = parsePriceInput(
                                        e.target.value
                                    )
                                    if (parsed !== undefined) {
                                        setMinAmountDisplay(
                                            formatPriceInput(parsed)
                                        )
                                    } else {
                                        setMinAmountDisplay('')
                                    }
                                }}
                                spellCheck={false}
                                autoCorrect='off'
                                autoCapitalize='off'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Giá tối đa (VND)
                            </Label>
                            <DarkOutlineInput
                                type='text'
                                inputMode='numeric'
                                placeholder='Không giới hạn'
                                value={maxAmountDisplay}
                                onChange={(e) => {
                                    handleMaxAmountChange(e.target.value)
                                }}
                                onBlur={(e) => {
                                    // Format on blur to ensure proper display
                                    const parsed = parsePriceInput(
                                        e.target.value
                                    )
                                    if (parsed !== undefined) {
                                        setMaxAmountDisplay(
                                            formatPriceInput(parsed)
                                        )
                                    } else {
                                        setMaxAmountDisplay('')
                                    }
                                }}
                                spellCheck={false}
                                autoCorrect='off'
                                autoCapitalize='off'
                            />
                        </div>

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
