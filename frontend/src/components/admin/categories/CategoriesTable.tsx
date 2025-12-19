import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import {
    DarkOutlineTable,
    DarkOutlineTableHeader,
    DarkOutlineTableBody,
} from '../../../components/ui/dark-outline-table'
import { Loader2, Search, X, Plus } from 'lucide-react'
import type { Category } from '../../../lib/api/types'
import { CategoryRow } from '../../../pages/admin/CategoriesPage'

interface CategoriesTableProps {
    categories: Category[]
    loading: boolean
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    searchInput: string
    selectedRowId: number | null
    onSearchChange: (value: string) => void
    onSearchExecute: () => void
    onSearchKeyPress: (e: React.KeyboardEvent) => void
    onClearSearch: () => void
    onCreate: () => void
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
    onChangeStatus: (category: Category) => void
    onRowSelect: (id: number | null) => void
    renderPagination: () => JSX.Element
}

export function CategoriesTable({
    categories,
    loading,
    pagination,
    searchInput,
    selectedRowId,
    onSearchChange,
    onSearchExecute,
    onSearchKeyPress,
    onClearSearch,
    onCreate,
    onEdit,
    onDelete,
    onChangeStatus,
    onRowSelect,
    renderPagination,
}: CategoriesTableProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='text-white'>
                            Danh sách danh mục ({pagination.total})
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Trang {pagination.page} / {pagination.totalPages}
                        </CardDescription>
                    </div>
                    <Button
                        onClick={onCreate}
                        className='bg-blue-600 hover:bg-blue-700 text-white'
                    >
                        <Plus className='h-4 w-4 mr-2' />
                        Tạo danh mục
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
                {/* Search Bar */}
                <div className='flex gap-2 mb-4'>
                    <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <DarkOutlineInput
                            type='text'
                            placeholder='Tìm kiếm theo tên danh mục...'
                            value={searchInput}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyPress={onSearchKeyPress}
                            className='pl-10 pr-10'
                        />
                        {searchInput && (
                            <button
                                type='button'
                                onClick={onClearSearch}
                                className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={onSearchExecute}
                        className='px-6 bg-blue-600 hover:bg-blue-700 text-white'
                        disabled={!searchInput.trim()}
                    >
                        Tìm Kiếm
                    </Button>
                </div>

                {loading ? (
                    <div className='flex items-center justify-center py-12'>
                        <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                        <span className='ml-2 text-gray-400'>
                            Đang tải...
                        </span>
                    </div>
                ) : categories.length === 0 ? (
                    <div className='text-center py-12'>
                        <div className='text-gray-400 mb-2'>Không tìm thấy danh mục nào</div>
                        <Button
                            onClick={onCreate}
                            variant='outline'
                            className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F]'
                        >
                            <Plus className='h-4 w-4 mr-2' />
                            Tạo danh mục đầu tiên
                        </Button>
                    </div>
                ) : (
                    <>
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <tr>
                                    <th className='text-left'>Danh mục</th>
                                    <th className='text-left'>Slug</th>
                                    <th className='text-left'>Trạng thái</th>
                                    <th className='text-left'>Số khóa học</th>
                                    <th className='text-left'>Thứ tự</th>
                                    <th className='text-left'>Ngày tạo</th>
                                    <th className='text-left'>Cập nhật</th>
                                    <th className='text-right'>Thao tác</th>
                                </tr>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {categories.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onChangeStatus={onChangeStatus}
                                        isSelected={
                                            selectedRowId ===
                                            category.id
                                        }
                                        onSelect={onRowSelect}
                                    />
                                ))}
                            </DarkOutlineTableBody>
                        </DarkOutlineTable>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className='flex justify-center mt-6'>
                                {renderPagination()}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
