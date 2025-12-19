import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import {
    DarkOutlineTable,
    DarkOutlineTableHeader,
    DarkOutlineTableBody,
    DarkOutlineTableRow,
    DarkOutlineTableHead,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
import { Loader2, Search, X, Plus } from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import { formatDate } from '../../../lib/utils'
import type { Tag } from '../../../lib/api/types'

interface TagsTableProps {
    tags: Tag[]
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
    onEdit: (tag: Tag) => void
    onDelete: (tag: Tag) => void
    onRowSelect: (id: number | null) => void
    renderPagination: () => React.ReactElement
}

export function TagsTable({
    tags,
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
    onRowSelect,
    renderPagination,
}: TagsTableProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='text-white'>
                            Danh sách Tags ({pagination.total})
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
                        Tạo Tag
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
                            placeholder='Tìm kiếm theo tên tag, slug...'
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
                ) : tags.length === 0 ? (
                    <div className='text-center py-12'>
                        <div className='text-gray-400 mb-2'>Không tìm thấy tag nào</div>
                        <Button
                            onClick={onCreate}
                            variant='outline'
                            className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F]'
                        >
                            <Plus className='h-4 w-4 mr-2' />
                            Tạo tag đầu tiên
                        </Button>
                    </div>
                ) : (
                    <>
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableHead>Tên Tag</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Slug</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Mô tả</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Số khóa học</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-right'>Thao tác</DarkOutlineTableHead>
                                </DarkOutlineTableRow>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {tags.map((tag) => (
                                    <DarkOutlineTableRow
                                        key={tag.id}
                                        className='cursor-pointer'
                                        selected={selectedRowId === tag.id}
                                        onRowToggle={(isSelected) => {
                                            onRowSelect(isSelected ? tag.id : null)
                                        }}
                                    >
                                        <DarkOutlineTableCell className='min-w-[150px] max-w-[200px]'>
                                            <div className='flex items-center gap-3 min-w-0'>
                                                <div className='min-w-0 flex-1'>
                                                    <p className='font-medium text-gray-900 dark:text-white break-words whitespace-normal'>
                                                        {tag.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='w-[150px]'>
                                            <span
                                                className='text-gray-900 dark:text-gray-300 truncate block'
                                                title={tag.slug}
                                            >
                                                {tag.slug}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='min-w-[200px] max-w-[300px]'>
                                            <span className='text-gray-900 dark:text-gray-300 break-words whitespace-normal line-clamp-2'>
                                                {tag.description || 'Không có mô tả'}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='w-[100px]'>
                                            <Badge className='bg-green-600'>Hoạt động</Badge>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='w-[100px]'>
                                            <span className='text-gray-900 dark:text-gray-300'>
                                                {tag.coursesCount || 0}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='w-[110px]'>
                                            <span className='text-gray-900 dark:text-gray-300'>
                                                {formatDate(tag.createdAt)}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell className='text-right w-[100px]'>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (selectedRowId !== tag.id) {
                                                        onRowSelect(tag.id)
                                                    }
                                                }}
                                            >
                                                <div className='h-1 w-1 bg-current rounded-full' />
                                            </Button>
                                        </DarkOutlineTableCell>
                                    </DarkOutlineTableRow>
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
