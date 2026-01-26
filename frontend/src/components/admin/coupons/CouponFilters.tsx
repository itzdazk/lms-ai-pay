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
import { Filter } from 'lucide-react'
import type { CouponFilters as CouponFiltersType } from '../../../lib/api/types'

interface CouponFiltersProps {
    filters: CouponFiltersType
    onFilterChange: (key: keyof CouponFiltersType, value: any) => void
    onClearFilters: () => void
}

export function CouponFilters({
    filters,
    onFilterChange,
    onClearFilters,
}: CouponFiltersProps) {
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
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Trạng thái
                            </Label>
                            <Select
                                value={
                                    filters.active === undefined
                                        ? 'all'
                                        : filters.active.toString()
                                }
                                onValueChange={(value) =>
                                    onFilterChange(
                                        'active',
                                        value === 'all'
                                            ? undefined
                                            : value === 'true',
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
                                    <DarkOutlineSelectItem value='true'>
                                        Hoạt động
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='false'>
                                        Không hoạt động
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

                        <div className='space-y-2'>
                            <Label className='text-sm font-medium text-gray-400'>
                                Loại mã
                            </Label>
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) =>
                                    onFilterChange(
                                        'type',
                                        value === 'all'
                                            ? undefined
                                            : (value as any),
                                    )
                                }
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue placeholder='Tất cả loại' />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='all'>
                                        Tất cả loại
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='PERCENT'>
                                        Phần trăm
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='FIXED'>
                                        Cố định
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='NEW_USER'>
                                        Người dùng mới
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
                                    <DarkOutlineSelectItem value='most_used'>
                                        Nhiều lượt dùng nhất
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='least_used'>
                                        Ít lượt dùng nhất
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
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
                </div>
            </CardContent>
        </Card>
    )
}
