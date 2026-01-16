import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select'
import { Calendar } from 'lucide-react'
import apiClient from '../../../lib/api/client'

interface RevenueStatsFiltersProps {
    selectedYear: number | null
    selectedMonth: number | null
    onYearChange: (year: number | null) => void
    onMonthChange: (month: number | null) => void
}

const MONTHS = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
]

export function RevenueStatsFilters({
    selectedYear,
    selectedMonth,
    onYearChange,
    onMonthChange,
}: RevenueStatsFiltersProps) {
    const [years, setYears] = useState<number[]>([])
    const [loadingYears, setLoadingYears] = useState(true)

    useEffect(() => {
        const fetchAvailableYears = async () => {
            try {
                setLoadingYears(true)
                const response = await apiClient.get('/admin/revenue/years')
                const availableYears = response.data?.data || []
                // Sort descending (newest first)
                setYears(availableYears.sort((a: number, b: number) => b - a))
            } catch (error) {
                console.error('Error fetching available years:', error)
                // Fallback to current year if API fails
                const currentYear = new Date().getFullYear()
                setYears([currentYear])
            } finally {
                setLoadingYears(false)
            }
        }

        fetchAvailableYears()
    }, [])

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardContent className='p-4'>
                <div className='flex items-center gap-4 flex-wrap'>
                    <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-gray-400' />
                        <span className='text-sm text-gray-400 font-medium'>Bộ lọc:</span>
                    </div>

                    {/* Year Filter - Dropdown */}
                    <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-300'>Năm:</span>
                        <Select
                            value={selectedYear === null ? 'all' : selectedYear.toString()}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    onYearChange(null)
                                } else {
                                    onYearChange(parseInt(value))
                                }
                            }}
                        >
                            <SelectTrigger className='w-[120px] h-8 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2A2A2A]'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1F1F1F] border-[#2D2D2D] max-h-[200px]'>
                                <SelectItem
                                    value='all'
                                    className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                >
                                    Tất cả
                                </SelectItem>
                                {loadingYears ? (
                                    <div className='p-2 text-sm text-gray-400'>Đang tải...</div>
                                ) : years.length === 0 ? (
                                    <div className='p-2 text-sm text-gray-400'>Chưa có dữ liệu</div>
                                ) : (
                                    years.map((year) => (
                                        <SelectItem
                                            key={year}
                                            value={year.toString()}
                                            className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                        >
                                            {year}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Month Filter */}
                    <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-300'>Tháng:</span>
                        <div className='flex gap-1 flex-wrap'>
                            <Button
                                variant={selectedMonth === null ? 'default' : 'outline'}
                                size='sm'
                                onClick={() => onMonthChange(null)}
                                className={`h-8 px-3 text-xs ${
                                    selectedMonth === null
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D]'
                                }`}
                            >
                                Tất cả
                            </Button>
                            {MONTHS.map((month) => (
                                <Button
                                    key={month.value}
                                    variant={selectedMonth === month.value ? 'default' : 'outline'}
                                    size='sm'
                                    onClick={() => onMonthChange(month.value)}
                                    className={`h-8 px-3 text-xs ${
                                        selectedMonth === month.value
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D]'
                                    }`}
                                >
                                    {month.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
