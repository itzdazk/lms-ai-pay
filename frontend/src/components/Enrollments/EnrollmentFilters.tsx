import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import {
    Search,
    Filter,
    BookOpen,
    TrendingUp,
    CheckCircle2,
} from 'lucide-react'
import type { EnrollmentStatus } from '../../lib/api/types'

interface EnrollmentFiltersProps {
    status?: EnrollmentStatus
    search?: string
    sort?: 'newest' | 'oldest' | 'progress'
    onStatusChange: (status?: EnrollmentStatus) => void
    onSearchChange: (search: string) => void
    onSortChange: (sort: 'newest' | 'oldest' | 'progress') => void
}

export function EnrollmentFilters({
    status,
    search = '',
    sort = 'newest',
    onStatusChange,
    onSearchChange,
    onSortChange,
}: EnrollmentFiltersProps) {
    const filterButtons = [
        { value: undefined, label: 'Tất cả', icon: BookOpen },
        { value: 'ACTIVE', label: 'Đang học', icon: TrendingUp },
        { value: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2 },
    ]

    return (
        <div className='space-y-4'>
            {/* Status Filter Buttons */}
            <div className='flex flex-wrap gap-3'>
                {filterButtons.map((filter) => {
                    const Icon = filter.icon
                    const isActive = status === filter.value

                    return (
                        <Button
                            key={filter.label}
                            onClick={() =>
                                onStatusChange(
                                    filter.value as EnrollmentStatus | undefined
                                )
                            }
                            variant={isActive ? 'default' : 'outline'}
                            className={`
                gap-2 transition-all duration-300
                ${
                    isActive
                        ? 'bg-foreground text-background shadow-sm hover:bg-foreground/90'
                        : 'hover:bg-black border-border dark:hover:bg-white dark:hover:text-gray-800'
                }
              `}
                        >
                            <Icon className='h-4 w-4' />
                            {filter.label}
                        </Button>
                    )
                })}
            </div>

            {/* Search and Sort */}
            <div className='flex flex-col sm:flex-row gap-4'>
                {/* Search */}
                <div className='relative flex-1'>
                    <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none' />
                    <Input
                        placeholder='Tìm kiếm khóa học...'
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className='pl-10 h-11 border-border bg-background focus:border-foreground focus:ring-foreground rounded-xl'
                    />
                </div>

                {/* Sort */}
                <div className='flex items-center gap-2'>
                    <Filter className='h-4 w-4 text-muted-foreground' />
                    <Select
                        value={sort}
                        onValueChange={(value) =>
                            onSortChange(
                                value as 'newest' | 'oldest' | 'progress'
                            )
                        }
                    >
                        <SelectTrigger className='w-full sm:w-48 h-11 rounded-xl border-border bg-background'>
                            <SelectValue placeholder='Sắp xếp theo' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='newest'>Mới nhất</SelectItem>
                            <SelectItem value='oldest'>Cũ nhất</SelectItem>
                            <SelectItem value='progress'>
                                Theo tiến độ
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
