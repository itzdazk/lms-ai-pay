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

export type OrderFilters = {
    page?: number
    limit?: number
    paymentStatus?: string
    paymentGateway?: string
    startDate?: string
    endDate?: string
    sort?: string
    search?: string
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
    { value: 'PENDING', label: 'Đang chờ', color: 'yellow' },
    { value: 'FAILED', label: 'Thất bại', color: 'red' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'purple' },
    {
        value: 'PARTIALLY_REFUNDED',
        label: 'Hoàn tiền một phần',
        color: 'purple',
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

    const hasActiveFilters =
        filters.paymentStatus ||
        filters.paymentGateway ||
        filters.startDate ||
        filters.endDate ||
        filters.search ||
        (filters.sort && filters.sort !== 'newest')

    const activeFilterCount = [
        filters.paymentStatus,
        filters.paymentGateway,
        filters.startDate,
        filters.endDate,
        filters.search,
        filters.sort && filters.sort !== 'newest' ? filters.sort : null,
    ].filter(Boolean).length

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
                return 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-600/20 dark:text-green-300 dark:border-green-500/40'
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-300 dark:border-yellow-500/40'
            case 'FAILED':
                return 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-600/20 dark:text-red-300 dark:border-red-500/40'
            case 'REFUNDED':
                return 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40'
            case 'PARTIALLY_REFUNDED':
                return 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-600/20 dark:text-orange-300 dark:border-orange-500/40'
            default:
                return ''
        }
    }

    return (
        <Card className='mb-6 overflow-hidden border-2 shadow-sm'>
            <CardContent className='p-6 space-y-6'>
                {/* Search Bar & Quick Actions */}
                <div className='flex flex-col lg:flex-row gap-4'>
                    {/* Search */}
                    <div className='flex-1 relative'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                            placeholder='Tìm kiếm theo mã đơn, tên khóa học...'
                            value={filters.search || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'search',
                                    e.target.value || undefined
                                )
                            }
                            className='pl-10 pr-10 h-11'
                        />
                        {filters.search && (
                            <button
                                onClick={() =>
                                    onFilterChange('search', undefined)
                                }
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
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
                            className='h-11'
                        >
                            <SlidersHorizontal className='h-4 w-4 mr-2' />
                            Bộ lọc nâng cao
                            {activeFilterCount > 0 && (
                                <Badge className='ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full'>
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={onClearFilters}
                                className='h-11 text-muted-foreground hover:text-foreground'
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
                        <span className='text-sm font-medium text-muted-foreground'>
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
                                        statusClassName || ''
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
                    <div className='space-y-4 pt-4 border-t'>
                        {/* Payment Gateway */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <span className='text-sm font-medium text-muted-foreground'>
                                    Phương thức thanh toán:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {paymentGateways.map((gateway) => (
                                    <Badge
                                        key={gateway.value}
                                        variant={
                                            (filters.paymentGateway ||
                                                'all') === gateway.value
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className='cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105'
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
                                        {(filters.paymentGateway || 'all') ===
                                            gateway.value && (
                                            <span className='ml-1.5'>✓</span>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Date Range */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <CalendarIcon className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm font-medium text-muted-foreground'>
                                    Khoảng thời gian:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-3'>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='justify-start text-left font-normal'
                                        >
                                            <CalendarIcon className='mr-2 h-4 w-4' />
                                            {startDate ? (
                                                format(
                                                    startDate,
                                                    'dd/MM/yyyy',
                                                    { locale: vi }
                                                )
                                            ) : (
                                                <span className='text-muted-foreground'>
                                                    Từ ngày
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-auto p-0'
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

                                <span className='flex items-center text-muted-foreground'>
                                    →
                                </span>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='justify-start text-left font-normal'
                                        >
                                            <CalendarIcon className='mr-2 h-4 w-4' />
                                            {endDate ? (
                                                format(endDate, 'dd/MM/yyyy', {
                                                    locale: vi,
                                                })
                                            ) : (
                                                <span className='text-muted-foreground'>
                                                    Đến ngày
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-auto p-0'
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
                                    >
                                        <X className='h-4 w-4 mr-1' />
                                        Xóa
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <div className='flex items-center gap-2 mb-3'>
                                <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
                                <span className='text-sm font-medium text-muted-foreground'>
                                    Sắp xếp:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {sortOptions.map((option) => (
                                    <Badge
                                        key={option.value}
                                        variant={
                                            (filters.sort || 'newest') ===
                                            option.value
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className='cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105'
                                        onClick={() =>
                                            onFilterChange('sort', option.value)
                                        }
                                    >
                                        <span className='mr-1.5'>
                                            {option.icon}
                                        </span>
                                        {option.label}
                                        {(filters.sort || 'newest') ===
                                            option.value && (
                                            <span className='ml-1.5'>✓</span>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className='flex items-center justify-between pt-3 border-t text-sm text-muted-foreground'>
                    <span>
                        Tìm thấy{' '}
                        <span className='font-semibold text-foreground'>
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
