import React, { useState, useEffect } from 'react'
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Pencil,
    Trash2,
    Calendar,
    Users,
    Tag,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminCouponsApi } from '@/lib/api/admin-coupons'
import { CouponFilters } from '@/lib/api/types'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const CouponsPage: React.FC = () => {
    const [coupons, setCoupons] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<CouponFilters>({
        page: 1,
        limit: 10,
        search: '',
        active: '',
        type: undefined,
        sort: 'newest',
    })
    const [total, setTotal] = useState(0)
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    useEffect(() => {
        fetchCoupons()
    }, [filters])

    const fetchCoupons = async () => {
        try {
            setLoading(true)
            const response = await adminCouponsApi.getCoupons(filters)
            setCoupons(response.data.data)
            setTotal(response.data.pagination.total)
        } catch (error) {
            toast.error('Không thể tải danh sách mã giảm giá')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
    }

    const handleFilterChange = (key: keyof CouponFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
    }

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            setTogglingId(id)
            await adminCouponsApi.toggleCouponActive(id)

            // Update local state to reflect change immediately
            setCoupons((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, active: !c.active } : c,
                ),
            )

            toast.success(
                `Đã ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'} mã giảm giá`,
            )
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái hoạt động')
            // Revert on error if needed, but for now just show error
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return

        try {
            await adminCouponsApi.deleteCoupon(deleteId)
            toast.success('Đã xóa mã giảm giá')
            fetchCoupons()
        } catch (error) {
            toast.error('Không thể xóa mã giảm giá')
        } finally {
            setDeleteId(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN')
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'PERCENT':
                return 'Phần trăm'
            case 'FIXED':
                return 'Số tiền cố định'
            case 'NEW_USER':
                return 'Người dùng mới'
            default:
                return type
        }
    }

    return (
        <div className='p-6 space-y-6'>
            <div className='flex justify-between items-center'>
                <div>
                    <h1 className='text-2xl font-bold tracking-tight'>
                        Quản lý mã giảm giá
                    </h1>
                    <p className='text-muted-foreground'>
                        Tạo và quản lý các chương trình khuyến mãi
                    </p>
                </div>
                <Button asChild>
                    <Link to='/admin/coupons/create'>
                        <Plus className='mr-2 h-4 w-4' /> Tạo mã mới
                    </Link>
                </Button>
            </div>

            <div className='flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm'>
                <div className='relative flex-1 max-w-sm'>
                    <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        placeholder='Tìm theo mã...'
                        className='pl-8'
                        value={filters.search}
                        onChange={handleSearch}
                    />
                </div>
                <Select
                    value={filters.type as string}
                    onValueChange={(v) =>
                        handleFilterChange('type', v === 'ALL' ? undefined : v)
                    }
                >
                    <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Loại mã' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='ALL'>Tất cả loại</SelectItem>
                        <SelectItem value='PERCENT'>Phần trăm</SelectItem>
                        <SelectItem value='FIXED'>Số tiền cố định</SelectItem>
                        <SelectItem value='NEW_USER'>Người dùng mới</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={String(filters.active)}
                    onValueChange={(v) =>
                        handleFilterChange(
                            'active',
                            v === 'ALL' ? '' : v === 'true',
                        )
                    }
                >
                    <SelectTrigger className='w-[180px]'>
                        <SelectValue placeholder='Trạng thái' />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='ALL'>Tất cả trạng thái</SelectItem>
                        <SelectItem value='true'>Đang hoạt động</SelectItem>
                        <SelectItem value='false'>Vô hiệu hóa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className='bg-white rounded-md border shadow-sm'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-[100px]'>Mã</TableHead>
                            <TableHead>Thông tin giảm giá</TableHead>
                            <TableHead>Điều kiện</TableHead>
                            <TableHead>Lượt dùng</TableHead>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className='text-right'>
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className='h-24 text-center'
                                >
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : coupons.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className='h-24 text-center'
                                >
                                    Không tìm thấy mã giảm giá nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell className='font-medium'>
                                        <div className='flex items-center gap-2'>
                                            <Tag className='w-4 h-4 text-blue-500' />
                                            <span className='font-bold text-blue-700'>
                                                {coupon.code}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col'>
                                            <span className='font-medium'>
                                                {getTypeLabel(coupon.type)}
                                            </span>
                                            <span className='text-sm text-gray-500'>
                                                {coupon.type === 'PERCENT'
                                                    ? `Giảm ${coupon.value}% (Tối đa ${formatCurrency(coupon.maxDiscount || 0)})`
                                                    : `Giảm ${formatCurrency(coupon.value)}`}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col text-sm'>
                                            <span>
                                                Đơn tối thiểu:{' '}
                                                {formatCurrency(
                                                    coupon.minOrderValue || 0,
                                                )}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col text-sm'>
                                            <span className='font-medium'>
                                                {coupon.usesCount} /{' '}
                                                {coupon.maxUses || '∞'}
                                            </span>
                                            <span className='text-xs text-gray-400'>
                                                Tổng giảm:{' '}
                                                {formatCurrency(
                                                    coupon.totalDiscountGiven ||
                                                        0,
                                                )}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex flex-col text-sm'>
                                            <span>
                                                {formatDate(coupon.startDate)}
                                            </span>
                                            <span className='text-gray-400'>
                                                đến
                                            </span>
                                            <span>
                                                {formatDate(coupon.endDate)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={coupon.active}
                                            onCheckedChange={() =>
                                                handleToggleActive(
                                                    coupon.id,
                                                    coupon.active,
                                                )
                                            }
                                            disabled={togglingId === coupon.id}
                                        />
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant='ghost'
                                                    className='h-8 w-8 p-0'
                                                >
                                                    <span className='sr-only'>
                                                        Open menu
                                                    </span>
                                                    <MoreHorizontal className='h-4 w-4' />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align='end'>
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        to={`/admin/coupons/${coupon.id}/edit`}
                                                    >
                                                        <Pencil className='mr-2 h-4 w-4' />
                                                        Chỉnh sửa
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link
                                                        to={`/admin/coupons/${coupon.id}/history`}
                                                    >
                                                        <Calendar className='mr-2 h-4 w-4' />
                                                        Lịch sử sử dụng
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setDeleteId(coupon.id)
                                                    }
                                                    className='text-red-600 focus:text-red-600'
                                                >
                                                    <Trash2 className='mr-2 h-4 w-4' />
                                                    Xóa mã
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className='flex items-center justify-end space-x-2 py-4 px-4'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                            handleFilterChange('page', (filters.page || 1) - 1)
                        }
                        disabled={filters.page === 1}
                    >
                        Trước
                    </Button>
                    <div className='text-sm text-gray-500'>
                        Trang {filters.page} /{' '}
                        {Math.ceil(total / (filters.limit || 10))}
                    </div>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                            handleFilterChange('page', (filters.page || 1) + 1)
                        }
                        disabled={
                            (filters.page || 1) >=
                            Math.ceil(total / (filters.limit || 10))
                        }
                    >
                        Sau
                    </Button>
                </div>
            </div>

            <Dialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa mã giảm giá</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa mã giảm giá này? Hành động
                            này không thể hoàn tác. Nếu mã đã được sử dụng, nó
                            sẽ chỉ bị vô hiệu hóa thay vì xóa vĩnh viễn.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant='outline'
                            onClick={() => setDeleteId(null)}
                        >
                            Hủy
                        </Button>
                        <Button variant='destructive' onClick={handleDelete}>
                            Xóa ngay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CouponsPage
