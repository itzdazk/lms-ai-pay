import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/button'
import { DarkOutlineButton } from '../../components/ui/buttons'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import {
    Plus,
    Search,
    Loader2,
    Edit,
    Trash2,
    Tag,
    TrendingUp,
    Calendar,
    Users,
    Percent,
} from 'lucide-react'
import { adminCouponsApi } from '../../lib/api/admin-coupons'
import type { Coupon, CouponFilters } from '../../lib/api/types'
import { toast } from 'sonner'
import { CouponForm } from '../../components/admin/CouponForm'
import { CouponUsageHistory } from '../../components/admin/CouponUsageHistory'
import { formatPrice } from '../../lib/courseUtils'

export function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [filters, setFilters] = useState<CouponFilters>({
        page: 1,
        limit: 10,
        search: '',
        active: undefined,
        type: undefined,
        sort: 'newest',
    })

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
    const [isUsageHistoryOpen, setIsUsageHistoryOpen] = useState(false)
    const [selectedCouponId, setSelectedCouponId] = useState<number | null>(
        null,
    )
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    useEffect(() => {
        fetchCoupons()
    }, [filters])

    const fetchCoupons = async () => {
        try {
            setLoading(true)
            const result = await adminCouponsApi.getCoupons(filters)
            setCoupons(result.coupons)
            setTotal(result.pagination.total)
        } catch (error) {
            console.error('Error fetching coupons:', error)
            toast.error('Không thể tải danh sách mã giảm giá')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (couponId: number) => {
        setDeleteId(couponId)
        setIsDeleteOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return

        try {
            const result = await adminCouponsApi.deleteCoupon(deleteId)
            toast.success(result.message)
            fetchCoupons()
        } catch (error) {
            console.error('Error deleting coupon:', error)
            toast.error('Không thể xóa mã giảm giá')
        } finally {
            setIsDeleteOpen(false)
            setDeleteId(null)
        }
    }

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon)
        setIsFormOpen(true)
    }

    const handleFormClose = () => {
        setIsFormOpen(false)
        setEditingCoupon(null)
    }

    const handleFormSuccess = () => {
        fetchCoupons()
        handleFormClose()
    }

    const handleViewUsageHistory = (couponId: number) => {
        setSelectedCouponId(couponId)
        setIsUsageHistoryOpen(true)
    }

    const getCouponTypeBadge = (type: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            PERCENT: {
                label: 'Phần trăm',
                className: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
            },
            FIXED: {
                label: 'Cố định',
                className: 'bg-green-600/20 text-green-400 border-green-500/30',
            },
            NEW_USER: {
                label: 'Người dùng mới',
                className:
                    'bg-purple-600/20 text-purple-400 border-purple-500/30',
            },
        }
        const variant = variants[type] || variants.FIXED
        return (
            <Badge className={`${variant.className} border`}>
                {variant.label}
            </Badge>
        )
    }

    const totalPages = Math.ceil(total / (filters.limit || 10))

    return (
        <div className='space-y-6'>
            <div className='mb-6'>
                <div className='flex items-start justify-between gap-4 mb-2'>
                    <div>
                        <h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
                            <Percent className='h-6 w-6' />
                            Quản lý Mã giảm giá
                        </h1>
                        <p className='text-sm text-muted-foreground mt-1'>
                            Xem và quản lý các mã giảm giá
                        </p>
                    </div>
                </div>
            </div>
            {/* Stats Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardContent className='pt-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-gray-400'>Tổng mã</p>
                                <p className='text-2xl font-bold text-white'>
                                    {total}
                                </p>
                            </div>
                            <Tag className='h-8 w-8 text-blue-400' />
                        </div>
                    </CardContent>
                </Card>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardContent className='pt-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-gray-400'>
                                    Đang hoạt động
                                </p>
                                <p className='text-2xl font-bold text-green-400'>
                                    {coupons.filter((c) => c.active).length}
                                </p>
                            </div>
                            <TrendingUp className='h-8 w-8 text-green-400' />
                        </div>
                    </CardContent>
                </Card>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardContent className='pt-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-gray-400'>
                                    Tổng lượt dùng
                                </p>
                                <p className='text-2xl font-bold text-purple-400'>
                                    {coupons.reduce(
                                        (sum, c) => sum + c.usesCount,
                                        0,
                                    )}
                                </p>
                            </div>
                            <Users className='h-8 w-8 text-purple-400' />
                        </div>
                    </CardContent>
                </Card>
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardContent className='pt-6'>
                        <div className='flex items-center justify-between'>
                            <div>
                                <p className='text-sm text-gray-400'>
                                    Tổng giảm giá
                                </p>
                                <p className='text-2xl font-bold text-yellow-400'>
                                    {formatPrice(
                                        coupons.reduce(
                                            (sum, c) =>
                                                sum +
                                                (c.totalDiscountGiven || 0),
                                            0,
                                        ),
                                    )}
                                </p>
                            </div>
                            <Calendar className='h-8 w-8 text-yellow-400' />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Card */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>
                                Quản lý mã giảm giá
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Tạo và quản lý các mã giảm giá cho khóa học
                            </CardDescription>
                        </div>
                        <DarkOutlineButton
                            onClick={() => setIsFormOpen(true)}
                            className='flex items-center gap-2'
                        >
                            <Plus className='h-4 w-4' />
                            Tạo mã mới
                        </DarkOutlineButton>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {/* Filters */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <Input
                                placeholder='Tìm kiếm mã...'
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        search: e.target.value,
                                        page: 1,
                                    }))
                                }
                                className='pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white'
                            />
                        </div>
                        <Select
                            value={
                                filters.active === undefined
                                    ? 'all'
                                    : filters.active.toString()
                            }
                            onValueChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    active:
                                        value === 'all'
                                            ? undefined
                                            : value === 'true',
                                    page: 1,
                                }))
                            }
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Trạng thái' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Tất cả</SelectItem>
                                <SelectItem value='true'>Hoạt động</SelectItem>
                                <SelectItem value='false'>
                                    Không hoạt động
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.type || 'all'}
                            onValueChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    type:
                                        value === 'all'
                                            ? undefined
                                            : (value as any),
                                    page: 1,
                                }))
                            }
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Loại mã' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Tất cả</SelectItem>
                                <SelectItem value='PERCENT'>
                                    Phần trăm
                                </SelectItem>
                                <SelectItem value='FIXED'>Cố định</SelectItem>
                                <SelectItem value='NEW_USER'>
                                    Người dùng mới
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.sort}
                            onValueChange={(value) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    sort: value as any,
                                }))
                            }
                        >
                            <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                <SelectValue placeholder='Sắp xếp' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='newest'>Mới nhất</SelectItem>
                                <SelectItem value='oldest'>Cũ nhất</SelectItem>
                                <SelectItem value='most_used'>
                                    Nhiều lượt dùng nhất
                                </SelectItem>
                                <SelectItem value='least_used'>
                                    Ít lượt dùng nhất
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className='flex items-center justify-center py-12'>
                            <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className='text-center py-12'>
                            <Tag className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                            <p className='text-gray-400'>
                                Không tìm thấy mã giảm giá nào
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className='rounded-lg border border-[#2D2D2D] overflow-hidden'>
                                <Table>
                                    <TableHeader>
                                        <TableRow className='border-[#2D2D2D] hover:bg-[#1F1F1F]'>
                                            <TableHead className='text-gray-400'>
                                                Mã
                                            </TableHead>
                                            <TableHead className='text-gray-400'>
                                                Loại
                                            </TableHead>
                                            <TableHead className='text-gray-400'>
                                                Giá trị
                                            </TableHead>
                                            <TableHead className='text-gray-400'>
                                                Lượt dùng
                                            </TableHead>
                                            <TableHead className='text-gray-400'>
                                                Tổng giảm
                                            </TableHead>
                                            <TableHead className='text-gray-400'>
                                                Trạng thái
                                            </TableHead>
                                            <TableHead className='text-gray-400'>
                                                Thời hạn
                                            </TableHead>
                                            <TableHead className='text-gray-400 text-right'>
                                                Hành động
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {coupons.map((coupon) => (
                                            <TableRow
                                                key={coupon.id}
                                                className='border-[#2D2D2D] hover:bg-[#1F1F1F]'
                                            >
                                                <TableCell className='font-mono text-white'>
                                                    {coupon.code}
                                                </TableCell>
                                                <TableCell>
                                                    {getCouponTypeBadge(
                                                        coupon.type,
                                                    )}
                                                </TableCell>
                                                <TableCell className='text-white'>
                                                    {coupon.type === 'PERCENT'
                                                        ? `${coupon.value}%`
                                                        : formatPrice(
                                                              coupon.value,
                                                          )}
                                                </TableCell>
                                                <TableCell className='text-white'>
                                                    <button
                                                        onClick={() =>
                                                            handleViewUsageHistory(
                                                                coupon.id,
                                                            )
                                                        }
                                                        className='text-blue-400 hover:underline'
                                                    >
                                                        {coupon.usesCount}
                                                        {coupon.maxUses
                                                            ? `/${coupon.maxUses}`
                                                            : ''}
                                                    </button>
                                                </TableCell>
                                                <TableCell className='text-green-400'>
                                                    {formatPrice(
                                                        coupon.totalDiscountGiven ||
                                                            0,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.active ? (
                                                        <Badge className='bg-green-600/20 text-green-400 border-green-500/30 border'>
                                                            Hoạt động
                                                        </Badge>
                                                    ) : (
                                                        <Badge className='bg-gray-600/20 text-gray-400 border-gray-500/30 border'>
                                                            Không hoạt động
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className='text-gray-400 text-sm'>
                                                    {new Date(
                                                        coupon.startDate,
                                                    ).toLocaleDateString(
                                                        'vi-VN',
                                                    )}{' '}
                                                    -{' '}
                                                    {new Date(
                                                        coupon.endDate,
                                                    ).toLocaleDateString(
                                                        'vi-VN',
                                                    )}
                                                </TableCell>
                                                <TableCell className='text-right'>
                                                    <div className='flex items-center justify-end gap-2'>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() =>
                                                                handleEdit(
                                                                    coupon,
                                                                )
                                                            }
                                                            className='h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20'
                                                        >
                                                            <Edit className='h-4 w-4' />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            onClick={() =>
                                                                handleDelete(
                                                                    coupon.id,
                                                                )
                                                            }
                                                            className='h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-600/20'
                                                        >
                                                            <Trash2 className='h-4 w-4' />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className='flex items-center justify-between'>
                                    <p className='text-sm text-gray-400'>
                                        Hiển thị{' '}
                                        {(filters.page! - 1) * filters.limit! +
                                            1}{' '}
                                        -{' '}
                                        {Math.min(
                                            filters.page! * filters.limit!,
                                            total,
                                        )}{' '}
                                        trong tổng số {total} mã
                                    </p>
                                    <div className='flex gap-2'>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    page: Math.max(
                                                        1,
                                                        prev.page! - 1,
                                                    ),
                                                }))
                                            }
                                            disabled={filters.page === 1}
                                            className='border-[#2D2D2D] text-white hover:bg-[#1F1F1F]'
                                        >
                                            Trước
                                        </Button>
                                        <Button
                                            variant='outline'
                                            size='sm'
                                            onClick={() =>
                                                setFilters((prev) => ({
                                                    ...prev,
                                                    page: Math.min(
                                                        totalPages,
                                                        prev.page! + 1,
                                                    ),
                                                }))
                                            }
                                            disabled={
                                                filters.page === totalPages
                                            }
                                            className='border-[#2D2D2D] text-white hover:bg-[#1F1F1F]'
                                        >
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Coupon Form Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh] overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCoupon ? 'Chỉnh sửa mã' : 'Tạo mã mới'}
                        </DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            {editingCoupon
                                ? 'Cập nhật thông tin mã giảm giá'
                                : 'Tạo mã giảm giá mới cho khóa học'}
                        </DialogDescription>
                    </DialogHeader>
                    <CouponForm
                        coupon={editingCoupon}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormClose}
                    />
                </DialogContent>
            </Dialog>

            {/* Usage History Dialog */}
            {selectedCouponId && (
                <Dialog
                    open={isUsageHistoryOpen}
                    onOpenChange={setIsUsageHistoryOpen}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle>Lịch sử sử dụng mã</DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Xem chi tiết các lần sử dụng mã giảm giá
                            </DialogDescription>
                        </DialogHeader>
                        <CouponUsageHistory couponId={selectedCouponId} />
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa mã giảm giá</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Bạn có chắc chắn muốn xóa mã giảm giá này? Nếu mã đã
                            được sử dụng, nó sẽ chỉ bị vô hiệu hóa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='gap-2 sm:gap-2'>
                        <Button
                            variant='outline'
                            onClick={() => setIsDeleteOpen(false)}
                            className='border-[#2D2D2D] text-white bg-black hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]'
                        >
                            Hủy
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={confirmDelete}
                            className='border-[#2D2D2D] bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700'
                        >
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
