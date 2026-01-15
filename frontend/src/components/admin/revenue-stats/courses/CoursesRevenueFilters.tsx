import { Button } from '../../../../components/ui/button'
import { Card, CardContent } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select'
import { Calendar, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import apiClient from '../../../../lib/api/client'

interface Instructor {
    id: number
    fullName: string
    email: string
}

interface CoursesRevenueFiltersProps {
    selectedYear: number | null
    selectedMonth: number | null
    selectedInstructorId: number | null
    searchQuery: string
    sortBy: 'revenue' | 'orderCount'
    onYearChange: (year: number | null) => void
    onMonthChange: (month: number | null) => void
    onInstructorChange: (instructorId: number | null) => void
    onSearchChange: (query: string) => void
    onSearch: () => void
    onSortChange: (sortBy: 'revenue' | 'orderCount') => void
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

export function CoursesRevenueFilters({
    selectedYear,
    selectedMonth,
    selectedInstructorId,
    searchQuery,
    sortBy,
    onYearChange,
    onMonthChange,
    onInstructorChange,
    onSearchChange,
    onSearch,
    onSortChange,
}: CoursesRevenueFiltersProps) {
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [instructorSearch, setInstructorSearch] = useState('')
    const [loadingInstructors, setLoadingInstructors] = useState(false)

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 20 }, (_, i) => currentYear - i)

    useEffect(() => {
        const loadInstructors = async () => {
            try {
                setLoadingInstructors(true)
                const response = await apiClient.get('/admin/courses/instructors?limit=1000')
                setInstructors(response.data?.data || [])
            } catch (error) {
                console.error('Error loading instructors:', error)
                setInstructors([])
            } finally {
                setLoadingInstructors(false)
            }
        }
        loadInstructors()
    }, [])

    const filteredInstructors = instructors.filter((inst) => {
        const searchLower = instructorSearch.toLowerCase()
        return (
            inst.fullName.toLowerCase().includes(searchLower) ||
            inst.email.toLowerCase().includes(searchLower)
        )
    })

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch()
        }
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
            <CardContent className='p-4'>
                <div className='flex items-center gap-4 flex-wrap'>
                    <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-gray-400' />
                        <span className='text-sm text-gray-400 font-medium'>Bộ lọc:</span>
                    </div>

                    {/* Year Filter */}
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
                            <SelectTrigger className='w-[120px] h-8 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2A2A2A] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1F1F1F] border-[#2D2D2D] max-h-[200px] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'>
                                <SelectItem
                                    value='all'
                                    className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                >
                                    Tất cả
                                </SelectItem>
                                {years.map((year) => (
                                    <SelectItem
                                        key={year}
                                        value={year.toString()}
                                        className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                    >
                                        {year}
                                    </SelectItem>
                                ))}
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
                                        : 'bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'
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
                                            : 'bg-[#1F1F1F] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'
                                    }`}
                                >
                                    {month.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Instructor Filter */}
                    <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-300'>Giảng viên:</span>
                        <Select
                            value={selectedInstructorId === null ? 'all' : selectedInstructorId.toString()}
                            onValueChange={(value) => {
                                if (value === 'all') {
                                    onInstructorChange(null)
                                } else {
                                    onInstructorChange(parseInt(value))
                                }
                            }}
                        >
                            <SelectTrigger className='w-[200px] h-8 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2A2A2A] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'>
                                <SelectValue placeholder='Tất cả giảng viên' />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1F1F1F] border-[#2D2D2D] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'>
                                <div className='p-2 border-b border-[#2D2D2D]'>
                                    <Input
                                        type='text'
                                        placeholder='Tìm giảng viên...'
                                        value={instructorSearch}
                                        onChange={(e) => setInstructorSearch(e.target.value)}
                                        className='h-8 bg-[#1A1A1A] border-[#2D2D2D] text-gray-300'
                                    />
                                </div>
                                <SelectItem
                                    value='all'
                                    className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                >
                                    Tất cả
                                </SelectItem>
                                {loadingInstructors ? (
                                    <div className='p-2 text-sm text-gray-400'>Đang tải...</div>
                                ) : filteredInstructors.length === 0 ? (
                                    <div className='p-2 text-sm text-gray-400'>Không tìm thấy</div>
                                ) : (
                                    filteredInstructors.slice(0, 100).map((instructor) => (
                                        <SelectItem
                                            key={instructor.id}
                                            value={instructor.id.toString()}
                                            className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                        >
                                            {instructor.fullName}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className='flex items-center gap-2 flex-1 min-w-[200px]'>
                        <Input
                            type='text'
                            placeholder='Tìm kiếm tiêu đề khóa học...'
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className='h-8 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'
                        />
                        <Button
                            onClick={onSearch}
                            size='sm'
                            className='h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white'
                        >
                            <Search className='h-4 w-4 mr-1' />
                            Tìm kiếm
                        </Button>
                    </div>

                    {/* Sort */}
                    <div className='flex items-center gap-2'>
                        <span className='text-sm text-gray-300'>Sắp xếp:</span>
                        <Select
                            value={sortBy}
                            onValueChange={(value) =>
                                onSortChange(value as 'revenue' | 'orderCount')
                            }
                        >
                            <SelectTrigger className='w-[180px] h-8 bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2A2A2A] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='bg-[#1F1F1F] border-[#2D2D2D] dark:bg-[#1F1F1F] dark:border-[#2D2D2D]'>
                                <SelectItem
                                    value='revenue'
                                    className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                >
                                    Doanh thu giảm dần
                                </SelectItem>
                                <SelectItem
                                    value='orderCount'
                                    className='text-gray-300 hover:bg-[#2A2A2A] focus:bg-[#2A2A2A]'
                                >
                                    Số lượng mua
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
