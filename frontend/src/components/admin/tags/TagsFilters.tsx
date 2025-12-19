import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { DarkOutlineButton } from '../../../components/ui/buttons'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../../../components/ui/dark-outline-select-trigger'
import { Select, SelectValue } from '../../../components/ui/select'
import type { AdminTagFilters } from '../../../lib/api/admin-tags'

interface TagsFiltersProps {
    filters: AdminTagFilters
    onFilterChange: (key: keyof AdminTagFilters, value: any) => void
    onClearFilters: () => void
}

export function TagsFilters({ filters, onFilterChange, onClearFilters }: TagsFiltersProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] mb-6'>
            <CardHeader>
                <CardTitle className='text-white'>Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Sắp xếp
                        </Label>
                        <Select
                            value={`${filters.sort || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                            onValueChange={(value) => {
                                const [sort, sortOrder] = value.split('-')
                                onFilterChange('sort', sort)
                                onFilterChange('sortOrder', sortOrder)
                            }}
                        >
                            <DarkOutlineSelectTrigger>
                                <SelectValue placeholder='Sắp xếp' />
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent>
                                <DarkOutlineSelectItem value='createdAt-desc'>
                                    Mới nhất
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='createdAt-asc'>
                                    Cũ nhất
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='name-asc'>
                                    Tên: A-Z
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='name-desc'>
                                    Tên: Z-A
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='slug-asc'>
                                    Slug: A-Z
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='slug-desc'>
                                    Slug: Z-A
                                </DarkOutlineSelectItem>
                            </DarkOutlineSelectContent>
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Số lượng / trang
                        </Label>
                        <Select
                            value={filters.limit?.toString() || '10'}
                            onValueChange={(value) => {
                                onFilterChange('limit', parseInt(value))
                            }}
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
                            </DarkOutlineSelectContent>
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm opacity-0'>
                            Xóa bộ lọc
                        </Label>
                        <DarkOutlineButton
                            onClick={onClearFilters}
                            variant='blue'
                            className='w-full'
                        >
                            Xóa bộ lọc
                        </DarkOutlineButton>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
