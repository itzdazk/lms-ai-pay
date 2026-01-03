import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
    Search,
    X,
    Calendar as CalendarIcon,
    SlidersHorizontal,
    ArrowUpDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

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

export type OrderFilters = {
    page?: number
    limit?: number
    paymentStatus?: string
    paymentGateway?: string
    startDate?: string
    endDate?: string
    sort?: string
    search?: string
    minAmount?: number
    maxAmount?: number
}

type OrderFiltersProps = {
    filters: OrderFilters
    onFilterChange: (key: keyof OrderFilters, value: any) => void
    onClearFilters: () => void
    totalResults: number
}

const paymentStatuses = [
    { value: 'all', label: 'Tất cả', color: 'default' },
    { value: 'PAID', label: 'Đã thanh toán', color: 'green' },
    { value: 'PENDING', label: 'Đang chờ thanh toán', color: 'yellow' },
    { value: 'FAILED', label: 'Thanh toán thất bại', color: 'red' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'purple' },
    {
        value: 'PARTIALLY_REFUNDED',
        label: 'Hoàn tiền một phần',
        color: 'purple',
    },
    {
        value: 'REFUND_PENDING',
        label: 'Đang chờ hoàn tiền',
        color: 'yellow',
    },
    {
        value: 'REFUND_FAILED',
        label: 'Hoàn tiền thất bại',
        color: 'red',
    },
]

const paymentGateways = [
    { value: 'all', label: 'Tất cả' },
    { value: 'VNPay', label: 'VNPay' },
    { value: 'MoMo', label: 'MoMo' },
]

const sortOptions = [
    { value: 'newest', label: 'Mới nhất', icon: '↓' },
    { value: 'oldest', label: 'Cũ nhất', icon: '↑' },
    { value: 'amount_desc', label: 'Giá cao', icon: '💰↓' },
    { value: 'amount_asc', label: 'Giá thấp', icon: '💰↑' },
]

export function OrderFilters({
    filters,
    onFilterChange,
    onClearFilters,
    totalResults,
}: OrderFiltersProps) {
    const [startDate, setStartDate] = useState<Date>()
    const [endDate, setEndDate] = useState<Date>()
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Local state for formatted display values
    const [minAmountDisplay, setMinAmountDisplay] = useState<string>(
        filters.minAmount ? formatPriceInput(filters.minAmount) : ''
    )
    const [maxAmountDisplay, setMaxAmountDisplay] = useState<string>(
        filters.maxAmount ? formatPriceInput(filters.maxAmount) : ''
    )

    // Initialize dates from filters
    useEffect(() => {
        if (filters.startDate) {
            setStartDate(new Date(filters.startDate))
        } else {
            setStartDate(undefined)
        }
        if (filters.endDate) {
            setEndDate(new Date(filters.endDate))
        } else {
            setEndDate(undefined)
        }
    }, [filters.startDate, filters.endDate])

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

    const hasActiveFilters =
        filters.paymentStatus ||
        filters.paymentGateway ||
        filters.startDate ||
        filters.endDate ||
        filters.search ||
        filters.minAmount !== undefined ||
        filters.maxAmount !== undefined ||
        (filters.sort && filters.sort !== 'newest')

    const activeFilterCount = [
        filters.paymentStatus,
        filters.paymentGateway,
        filters.startDate,
        filters.endDate,
        filters.search,
        filters.minAmount,
        filters.maxAmount,
        filters.sort && filters.sort !== 'newest' ? filters.sort : null,
    ].filter(Boolean).length

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

    const handleDateSelect = (
        type: 'start' | 'end',
        date: Date | undefined
    ) => {
        if (type === 'start') {
            setStartDate(date)
            onFilterChange(
                'startDate',
                date ? format(date, 'yyyy-MM-dd') : undefined
            )
        } else {
            setEndDate(date)
            onFilterChange(
                'endDate',
                date ? format(date, 'yyyy-MM-dd') : undefined
            )
        }
    }

    const getStatusBadgeClassName = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-600/20 text-green-300 border border-green-500/40'
            case 'PENDING':
                return 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/40'
            case 'FAILED':
                return 'bg-red-600/20 text-red-300 border border-red-500/40'
            case 'REFUNDED':
                return 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
            case 'PARTIALLY_REFUNDED':
                return 'bg-orange-600/20 text-orange-300 border border-orange-500/40'
            case 'REFUND_PENDING':
                return 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/40'
            case 'REFUND_FAILED':
                return 'bg-red-600/20 text-red-300 border border-red-500/40'
            default:
                return ''
        }
    }

    return (
        <Card className='mb-6 overflow-hidden border-2 border-[#2d2d2d] shadow-sm bg-[#1a1a1a]'>
            <CardContent className='p-6 space-y-6'>
                {/* Search Bar & Quick Actions */}
                <div className='flex flex-col lg:flex-row gap-4'>
                    {/* Search */}
                    <div className='flex-1 relative'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            placeholder='Tìm kiếm theo mã đơn, tên khóa học...'
                            value={filters.search || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'search',
                                    e.target.value || undefined
                                )
                            }
                            className='pl-10 pr-10 h-11 bg-[#1f1f1f] border-[#2d2d2d] text-white placeholder:text-gray-500'
                        />
                        {filters.search && (
                            <button
                                onClick={() =>
                                    onFilterChange('search', undefined)
                                }
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className='h-11 border-[#2d2d2d] text-gray-800 dark:text-gray-300 hover:bg-gray-400 hover:text-gray-800 dark:hover:bg-gray-800 cursor-pointer'
                        >
                            <SlidersHorizontal className='h-4 w-4 mr-2' />
                            Bộ lọc nâng cao
                            {activeFilterCount > 0 && (
                                <Badge className='ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-white text-gray-900'>
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={onClearFilters}
                                className='h-11 text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
                            >
                                <X className='h-4 w-4 mr-2' />
                                Xóa
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status Chips */}
                <div>
                    <div className='flex items-center gap-2 mb-3'>
                        <span className='text-sm font-medium text-gray-400'>
                            Trạng thái:
                        </span>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                        {paymentStatuses.map((status) => {
                            const isSelected =
                                (filters.paymentStatus || 'all') ===
                                status.value
                            const statusClassName =
                                isSelected && status.value !== 'all'
                                    ? getStatusBadgeClassName(status.value)
                                    : ''
                            return (
                                <Badge
                                    key={status.value}
                                    variant={isSelected ? undefined : 'outline'}
                                    className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                                        statusClassName ||
                                        (isSelected && status.value === 'all'
                                            ? 'bg-white text-gray-900 border-0'
                                            : 'border-[#2d2d2d] text-gray-300')
                                    }`}
                                    onClick={() =>
                                        onFilterChange(
                                            'paymentStatus',
                                            status.value === 'all'
                                                ? undefined
                                                : status.value
                                        )
                                    }
                                >
                                    {status.label}
                                    {isSelected && (
                                        <span className='ml-1.5'>✓</span>
                                    )}
                                </Badge>
                            )
                        })}
                    </div>
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className='space-y-4 pt-4 border-t border-[#2d2d2d]'>
                        {/* Payment Gateway */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <span className='text-sm font-medium text-gray-400'>
                                    Phương thức thanh toán:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {paymentGateways.map((gateway) => {
                                    const isSelected =
                                        (filters.paymentGateway || 'all') ===
                                        gateway.value
                                    return (
                                        <Badge
                                            key={gateway.value}
                                            variant={
                                                isSelected
                                                    ? undefined
                                                    : 'outline'
                                            }
                                            className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                                                isSelected
                                                    ? 'bg-white text-gray-900 border-0'
                                                    : 'border-[#2d2d2d] text-gray-300'
                                            }`}
                                            onClick={() =>
                                                onFilterChange(
                                                    'paymentGateway',
                                                    gateway.value === 'all'
                                                        ? undefined
                                                        : gateway.value
                                                )
                                            }
                                        >
                                            {gateway.label}
                                            {isSelected && (
                                                <span className='ml-1.5'>
                                                    ✓
                                                </span>
                                            )}
                                        </Badge>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <CalendarIcon className='h-4 w-4 text-gray-400 dark:text-gray-400' />
                                <span className='text-sm font-medium text-gray-400 dark:text-gray-400'>
                                    Khoảng thời gian:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-3'>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='justify-start text-left font-normal border-[#2d2d2d] text-gray-300 hover:bg-[#1f1f1f] dark:border-[#2d2d2d] dark:text-gray-300 dark:hover:bg-[#1f1f1f]'
                                        >
                                            <CalendarIcon className='mr-2 h-4 w-4 text-gray-600 dark:text-gray-300' />
                                            {startDate ? (
                                                format(
                                                    startDate,
                                                    'dd/MM/yyyy',
                                                    { locale: vi }
                                                )
                                            ) : (
                                                <span className='text-gray-500'>
                                                    Từ ngày
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-auto p-0 bg-[#1a1a1a] border-[#2d2d2d] text-white [&_*]:text-white [&_button]:text-gray-300 [&_button:hover]:bg-[#1f1f1f] [&_button:hover]:text-white [&_.bg-primary]:!bg-blue-600 [&_.bg-accent]:!bg-[#1f1f1f] [&_.text-muted-foreground]:!text-gray-400'
                                        align='start'
                                    >
                                        <Calendar
                                            mode='single'
                                            selected={startDate}
                                            onSelect={(date) =>
                                                handleDateSelect('start', date)
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <span className='flex items-center text-gray-400'>
                                    →
                                </span>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='justify-start text-left font-normal border-[#2d2d2d] text-gray-300 hover:bg-[#1f1f1f] dark:border-[#2d2d2d] dark:text-gray-300 dark:hover:bg-[#1f1f1f]'
                                        >
                                            <CalendarIcon className='mr-2 h-4 w-4 text-gray-600 dark:text-gray-300' />
                                            {endDate ? (
                                                format(endDate, 'dd/MM/yyyy', {
                                                    locale: vi,
                                                })
                                            ) : (
                                                <span className='text-gray-500'>
                                                    Đến ngày
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-auto p-0 bg-[#1a1a1a] border-[#2d2d2d] text-white [&_*]:text-white [&_button]:text-gray-300 [&_button:hover]:bg-[#1f1f1f] [&_button:hover]:text-white [&_.bg-primary]:!bg-blue-600 [&_.bg-accent]:!bg-[#1f1f1f] [&_.text-muted-foreground]:!text-gray-400'
                                        align='start'
                                    >
                                        <Calendar
                                            mode='single'
                                            selected={endDate}
                                            onSelect={(date) =>
                                                handleDateSelect('end', date)
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                {(startDate || endDate) && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => {
                                            setStartDate(undefined)
                                            setEndDate(undefined)
                                            onFilterChange(
                                                'startDate',
                                                undefined
                                            )
                                            onFilterChange('endDate', undefined)
                                        }}
                                        className='text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
                                    >
                                        <X className='h-4 w-4 mr-1' />
                                        Xóa
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Amount Range */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <span className='text-sm font-medium text-gray-400'>
                                    Khoảng giá trị (VND):
                                </span>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <label className='text-xs text-gray-500'>
                                        Giá trị tối thiểu
                                    </label>
                                    <Input
                                        type='text'
                                        inputMode='numeric'
                                        placeholder='0'
                                        value={minAmountDisplay}
                                        onChange={(e) => {
                                            handleMinAmountChange(
                                                e.target.value
                                            )
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
                                        className='bg-[#1f1f1f] border-[#2d2d2d] text-white placeholder:text-gray-500'
                                        spellCheck={false}
                                        autoCorrect='off'
                                        autoCapitalize='off'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <label className='text-xs text-gray-500'>
                                        Giá trị tối đa
                                    </label>
                                    <Input
                                        type='text'
                                        inputMode='numeric'
                                        placeholder='Không giới hạn'
                                        value={maxAmountDisplay}
                                        onChange={(e) => {
                                            handleMaxAmountChange(
                                                e.target.value
                                            )
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
                                        className='bg-[#1f1f1f] border-[#2d2d2d] text-white placeholder:text-gray-500'
                                        spellCheck={false}
                                        autoCorrect='off'
                                        autoCapitalize='off'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <ArrowUpDown className='h-4 w-4 text-gray-400' />
                                <span className='text-sm font-medium text-gray-400'>
                                    Sắp xếp:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {sortOptions.map((option) => {
                                    const isSelected =
                                        (filters.sort || 'newest') ===
                                        option.value
                                    return (
                                        <Badge
                                            key={option.value}
                                            variant={
                                                isSelected
                                                    ? undefined
                                                    : 'outline'
                                            }
                                            className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                                                isSelected
                                                    ? 'bg-white text-gray-900 border-0'
                                                    : 'border-[#2d2d2d] text-gray-300'
                                            }`}
                                            onClick={() =>
                                                onFilterChange(
                                                    'sort',
                                                    option.value
                                                )
                                            }
                                        >
                                            <span className='mr-1.5'>
                                                {option.icon}
                                            </span>
                                            {option.label}
                                            {isSelected && (
                                                <span className='ml-1.5'>
                                                    ✓
                                                </span>
                                            )}
                                        </Badge>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className='flex items-center justify-between pt-3 border-t border-[#2d2d2d] text-sm text-gray-400'>
                    <span>
                        Tìm thấy{' '}
                        <span className='font-semibold text-white'>
                            {totalResults}
                        </span>{' '}
                        kết quả
                    </span>
                    {hasActiveFilters && (
                        <span>{activeFilterCount} bộ lọc đang hoạt động</span>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
