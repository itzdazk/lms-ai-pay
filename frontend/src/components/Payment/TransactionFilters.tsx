import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import {
    X,
    Calendar as CalendarIcon,
    SlidersHorizontal,
    Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { TransactionFilters as TransactionFiltersType } from '../../lib/api/transactions'

type TransactionFiltersProps = {
    filters: TransactionFiltersType
    onFilterChange: (key: keyof TransactionFiltersType, value: any) => void
    onClearFilters: () => void
    totalResults: number
}

const transactionStatuses = [
    { value: 'all', label: 'Tất cả', color: 'default' },
    { value: 'SUCCESS', label: 'Thành công', color: 'green' },
    { value: 'PENDING', label: 'Đang chờ', color: 'yellow' },
    { value: 'FAILED', label: 'Thất bại', color: 'red' },
    { value: 'REFUNDED', label: 'Đã hoàn tiền', color: 'purple' },
]

const paymentGateways = [
    { value: 'all', label: 'Tất cả' },
    { value: 'VNPay', label: 'VNPay' },
    { value: 'MoMo', label: 'MoMo' },
]

export function TransactionFilters({
    filters,
    onFilterChange,
    onClearFilters,
    totalResults,
}: TransactionFiltersProps) {
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
        filters.status ||
        filters.paymentGateway ||
        filters.startDate ||
        filters.endDate ||
        filters.transactionId

    const activeFilterCount = [
        filters.status,
        filters.paymentGateway,
        filters.startDate,
        filters.endDate,
        filters.transactionId,
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
            case 'SUCCESS':
                return 'bg-green-600/20 text-green-300 border border-green-500/40'
            case 'PENDING':
                return 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/40'
            case 'FAILED':
                return 'bg-red-600/20 text-red-300 border border-red-500/40'
            case 'REFUNDED':
                return 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
            default:
                return ''
        }
    }

    return (
        <Card className='mb-6 overflow-hidden border-2 border-[#2d2d2d] shadow-sm bg-[#1a1a1a]'>
            <CardContent className='p-6 space-y-6'>
                {/* Search by Transaction ID */}
                <div>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            type='text'
                            placeholder='Tìm kiếm theo mã giao dịch...'
                            value={filters.transactionId || ''}
                            onChange={(e) =>
                                onFilterChange(
                                    'transactionId',
                                    e.target.value || undefined
                                )
                            }
                            className='pl-10 h-11 bg-[#1f1f1f] border-[#2d2d2d] text-white placeholder:text-gray-500'
                        />
                        {filters.transactionId && (
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                    onFilterChange('transactionId', undefined)
                                }
                                className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
                            >
                                <X className='h-4 w-4' />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className='h-11 border-[#2d2d2d] text-gray-300 hover:text-white hover:bg-[#1f1f1f]'
                        >
                            <SlidersHorizontal className='h-4 w-4 mr-2' />
                            Bộ lọc nâng cao
                            {activeFilterCount > 0 && (
                                <Badge className='ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-blue-600 text-white'>
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
                        {transactionStatuses.map((status) => {
                            const isSelected =
                                (filters.status || 'all') === status.value
                            const statusClassName =
                                isSelected && status.value !== 'all'
                                    ? getStatusBadgeClassName(status.value)
                                    : ''
                            return (
                                <Badge
                                    key={status.value}
                                    variant={isSelected ? undefined : 'outline'}
                                    className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                                        isSelected && status.value === 'all'
                                            ? 'bg-white text-gray-900 border-0'
                                            : isSelected
                                            ? statusClassName
                                            : 'border-[#2d2d2d] text-gray-300'
                                    }`}
                                    onClick={() =>
                                        onFilterChange(
                                            'status',
                                            status.value === 'all'
                                                ? undefined
                                                : (status.value as any)
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
                                                    ? 'default'
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
                                                        : (gateway.value as any)
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
                                <CalendarIcon className='h-4 w-4 text-gray-400' />
                                <span className='text-sm font-medium text-gray-400'>
                                    Khoảng thời gian:
                                </span>
                            </div>
                            <div className='flex flex-wrap gap-3'>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant='outline'
                                            className='justify-start text-left font-normal border-[#2d2d2d] text-gray-300 hover:bg-[#1f1f1f]'
                                        >
                                            <CalendarIcon className='mr-2 h-4 w-4' />
                                            {startDate ? (
                                                format(
                                                    startDate,
                                                    'dd/MM/yyyy',
                                                    { locale: vi }
                                                )
                                            ) : (
                                                <span className='text-gray-600'>
                                                    Từ ngày
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-auto p-0 bg-[#1a1a1a] border-[#2d2d2d] text-white [&_*]:text-white [&_button]:text-gray-300 [&_button:hover]:bg-[#1f1f1f] [&_.bg-primary]:!bg-blue-600 [&_.bg-accent]:!bg-[#1f1f1f] [&_.text-muted-foreground]:!text-gray-400'
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
                                            className='justify-start text-left font-normal border-[#2d2d2d] text-gray-300 hover:bg-[#1f1f1f]'
                                        >
                                            <CalendarIcon className='mr-2 h-4 w-4' />
                                            {endDate ? (
                                                format(endDate, 'dd/MM/yyyy', {
                                                    locale: vi,
                                                })
                                            ) : (
                                                <span className='text-gray-600'>
                                                    Đến ngày
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className='w-auto p-0 bg-[#1a1a1a] border-[#2d2d2d] text-white [&_*]:text-white [&_button]:text-gray-300 [&_button:hover]:bg-[#1f1f1f] [&_.bg-primary]:!bg-blue-600 [&_.bg-accent]:!bg-[#1f1f1f] [&_.text-muted-foreground]:!text-gray-400'
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
