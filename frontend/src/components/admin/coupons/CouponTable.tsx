import React from 'react'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '../../../components/ui/dark-outline-table'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import { Button } from '../../../components/ui/button'
import { DarkOutlineButton } from '../../../components/ui/buttons'
import { Search, Loader2, Plus, X } from 'lucide-react'
import { CouponRow } from './CouponRow'
import type { Coupon } from '../../../lib/api/types'

interface CouponTableProps {
    coupons: Coupon[]
    loading?: boolean
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    searchInput: string
    togglingId: number | null
    selectedRowId?: number | null
    onSearchChange: (value: string) => void
    onSearchExecute: () => void
    onSearchKeyPress: (e: React.KeyboardEvent) => void
    onClearSearch: () => void
    onCreateNew: () => void
    onEdit: (coupon: Coupon) => void
    onDelete: (couponId: number) => void
    onToggleActive: (id: number, currentStatus: boolean) => void
    onViewUsageHistory: (couponId: number) => void
    onRowSelect?: (id: number | null) => void
    renderPagination: () => React.ReactNode
}

export function CouponTable({
    coupons,
    loading = false,
    pagination,
    searchInput,
    togglingId,
    selectedRowId,
    onSearchChange,
    onSearchExecute,
    onSearchKeyPress,
    onClearSearch,
    onCreateNew,
    onEdit,
    onDelete,
    onToggleActive,
    onViewUsageHistory,
    onRowSelect,
    renderPagination,
}: CouponTableProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='text-white'>
                            Danh sách mã giảm giá ({pagination.total})
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Trang {pagination.page} / {pagination.totalPages}
                        </CardDescription>
                    </div>
                    <DarkOutlineButton
                        onClick={onCreateNew}
                        className='flex items-center gap-2'
                    >
                        <Plus className='h-4 w-4' />
                        Tạo mã mới
                    </DarkOutlineButton>
                </div>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
                {/* Search Bar */}
                <div className='flex gap-2 mb-4'>
                    <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <DarkOutlineInput
                            type='text'
                            placeholder='Tìm kiếm theo mã, loại...'
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
                        <span className='ml-2 text-gray-400'>Đang tải...</span>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className='text-center py-12'>
                        <p className='text-gray-400'>
                            Không có mã giảm giá nào
                        </p>
                    </div>
                ) : (
                    <>
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableHead className='text-left'>
                                        Mã
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Loại
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Giá trị
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Lượt dùng
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Tổng giảm
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Trạng thái
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Thời hạn
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-right'>
                                        Thao tác
                                    </DarkOutlineTableHead>
                                </DarkOutlineTableRow>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {coupons.map((coupon) => (
                                    <CouponRow
                                        key={coupon.id}
                                        coupon={coupon}
                                        isSelected={selectedRowId === coupon.id}
                                        togglingId={togglingId}
                                        onRowSelect={onRowSelect || (() => {})}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleActive={onToggleActive}
                                        onViewUsageHistory={onViewUsageHistory}
                                    />
                                ))}
                            </DarkOutlineTableBody>
                        </DarkOutlineTable>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className='flex items-center justify-center mt-6'>
                                {renderPagination()}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
