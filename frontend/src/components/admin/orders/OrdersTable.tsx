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
import { Search, X, Plus } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { OrderRow } from './OrderRow'
import type { Order } from '../../../lib/api/types'

interface OrdersTableProps {
    orders: Order[]
    loading?: boolean
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    searchInput: string
    selectedRowId?: number | null
    onSearchChange: (value: string) => void
    onSearchExecute: () => void
    onSearchKeyPress: (e: React.KeyboardEvent) => void
    onClearSearch: () => void
    onViewDetail: (order: Order) => void
    onRefund: (order: Order) => void
    onRowSelect?: (id: number | null) => void
    renderPagination: () => React.ReactNode
}

export function OrdersTable({
    orders,
    loading = false,
    pagination,
    searchInput,
    selectedRowId,
    onSearchChange,
    onSearchExecute,
    onSearchKeyPress,
    onClearSearch,
    onViewDetail,
    onRefund,
    onRowSelect,
    renderPagination,
}: OrdersTableProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white'>
                    Danh sách đơn hàng ({pagination.total})
                </CardTitle>
                <CardDescription className='text-gray-400'>
                    Trang {pagination.page} / {pagination.totalPages}
                </CardDescription>
            </CardHeader>
            <CardContent className='overflow-x-auto'>
                {/* Search Bar */}
                <div className='flex gap-2 mb-4'>
                    <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <DarkOutlineInput
                            type='text'
                            placeholder='Tìm kiếm theo mã đơn, tên khách hàng, khóa học...'
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
                ) : orders.length === 0 ? (
                    <div className='text-center py-12'>
                        <p className='text-gray-400'>Không có đơn hàng nào</p>
                    </div>
                ) : (
                    <>
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableHead className='text-left'>
                                        Mã đơn hàng
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Khóa học
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Trạng thái
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Cổng thanh toán
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Giá trị
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-left'>
                                        Ngày tạo
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead className='text-right'>
                                        Thao tác
                                    </DarkOutlineTableHead>
                                </DarkOutlineTableRow>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {orders.map((order) => (
                                    <OrderRow
                                        key={order.id}
                                        order={order}
                                        isSelected={selectedRowId === order.id}
                                        onRowSelect={onRowSelect || (() => {})}
                                        onViewDetail={onViewDetail}
                                        onRefund={onRefund}
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
