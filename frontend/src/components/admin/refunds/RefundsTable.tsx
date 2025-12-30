import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import {
    DarkOutlineTable,
    DarkOutlineTableHeader,
    DarkOutlineTableHead,
    DarkOutlineTableBody,
} from '../../ui/dark-outline-table'
import { DarkOutlineInput } from '../../ui/dark-outline-input'
import { DarkOutlineButton } from '../../ui/buttons'
import { Search, X, Loader2 } from 'lucide-react'
import { RefundRow } from './RefundRow'
import type { Order } from '../../../lib/api/types'

interface RefundsTableProps {
    orders: Order[]
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
    onViewDetail: (order: Order) => void
    onRefund: (order: Order) => void
    onRowSelect: (id: number | null) => void
    renderPagination: () => React.ReactNode
}

export function RefundsTable({
    orders,
    loading,
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
}: RefundsTableProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                    <CardTitle className='text-white'>
                        Danh sách đơn hàng có thể hoàn tiền
                    </CardTitle>
                    <div className='flex items-center gap-2 w-full sm:w-auto'>
                        <div className='relative flex-1 sm:flex-initial sm:w-[300px]'>
                            <DarkOutlineInput
                                type='text'
                                placeholder='Tìm kiếm theo mã đơn, khóa học, khách hàng...'
                                value={searchInput}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onKeyPress={onSearchKeyPress}
                                className='pr-20'
                            />
                            {searchInput && (
                                <button
                                    onClick={onClearSearch}
                                    className='absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors'
                                    title='Xóa tìm kiếm'
                                >
                                    <X className='h-4 w-4' />
                                </button>
                            )}
                            <DarkOutlineButton
                                size='sm'
                                onClick={onSearchExecute}
                                className='absolute right-1 top-1/2 -translate-y-1/2 h-8'
                                title='Tìm kiếm'
                            >
                                <Search className='h-4 w-4' />
                            </DarkOutlineButton>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Table */}
                <div className='rounded-lg border border-[#2D2D2D] overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableHead className='min-w-[120px]'>
                                    Mã đơn hàng
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='min-w-[200px]'>
                                    Khóa học
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='w-[140px]'>
                                    Trạng thái
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='w-[130px]'>
                                    Giá trị đơn
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='w-[130px]'>
                                    Đã hoàn
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='w-[130px]'>
                                    Có thể hoàn
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='w-[150px]'>
                                    Ngày tạo
                                </DarkOutlineTableHead>
                                <DarkOutlineTableHead className='text-right w-[100px]'>
                                    Thao tác
                                </DarkOutlineTableHead>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className='text-center py-12'
                                        >
                                            <div className='flex flex-col items-center gap-3'>
                                                <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
                                                <p className='text-gray-400'>
                                                    Đang tải dữ liệu...
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className='text-center py-12'
                                        >
                                            <p className='text-gray-400'>
                                                Không tìm thấy đơn hàng nào
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <RefundRow
                                            key={order.id}
                                            order={order}
                                            isSelected={
                                                selectedRowId === order.id
                                            }
                                            onRowSelect={onRowSelect}
                                            onViewDetail={onViewDetail}
                                            onRefund={onRefund}
                                        />
                                    ))
                                )}
                            </DarkOutlineTableBody>
                        </DarkOutlineTable>
                    </div>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className='flex items-center justify-center mt-6'>
                        {renderPagination()}
                    </div>
                )}

                {/* Results Summary */}
                <div className='mt-4 text-sm text-gray-400 text-center'>
                    Hiển thị {orders.length} trong tổng số {pagination.total}{' '}
                    đơn hàng
                </div>
            </CardContent>
        </Card>
    )
}
