import { Badge } from '../ui/badge'
import {
    DarkOutlineTable,
    DarkOutlineTableBody,
    DarkOutlineTableCell,
    DarkOutlineTableHead,
    DarkOutlineTableHeader,
    DarkOutlineTableRow,
} from '../ui/dark-outline-table'
import { Skeleton } from '../ui/skeleton'
import type { PaymentTransaction } from '../../lib/api/types'
import { formatPrice } from '../../lib/courseUtils'
import { formatDateTime } from '../../lib/utils'
import { CreditCard, Wallet } from 'lucide-react'

type TransactionListProps = {
    transactions: PaymentTransaction[]
    loading?: boolean
}

function getStatusBadge(status?: PaymentTransaction['status']) {
    switch (status) {
        case 'SUCCESS':
            return (
                <Badge className='bg-green-100 text-green-700 border border-green-300 dark:bg-green-600/20 dark:text-green-300 dark:border-green-500/40'>
                    Thành công
                </Badge>
            )
        case 'PENDING':
            return (
                <Badge className='bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-600/20 dark:text-yellow-300 dark:border-yellow-500/40'>
                    Đang chờ
                </Badge>
            )
        case 'FAILED':
            return (
                <Badge className='bg-red-100 text-red-700 border border-red-300 dark:bg-red-600/20 dark:text-red-300 dark:border-red-500/40'>
                    Thất bại
                </Badge>
            )
        case 'REFUNDED':
            return (
                <Badge className='bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-600/20 dark:text-purple-300 dark:border-purple-500/40'>
                    Đã hoàn tiền
                </Badge>
            )
        default:
            return (
                <Badge className='bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-600/20 dark:text-gray-300 dark:border-gray-500/40'>
                    {status || 'N/A'}
                </Badge>
            )
    }
}

function getGatewayIcon(gateway: PaymentTransaction['paymentGateway']) {
    switch (gateway) {
        case 'VNPay':
            return <CreditCard className='h-4 w-4' />
        case 'MoMo':
            return <Wallet className='h-4 w-4' />
        default:
            return <CreditCard className='h-4 w-4' />
    }
}

function getGatewayBadge(gateway: PaymentTransaction['paymentGateway']) {
    return (
        <Badge
            variant='outline'
            className='border-gray-300 text-gray-700 dark:border-[#2D2D2D] dark:text-gray-300 text-xs flex items-center gap-1.5'
        >
            {getGatewayIcon(gateway)}
            {gateway}
        </Badge>
    )
}

export function TransactionList({
    transactions,
    loading,
}: TransactionListProps) {
    if (loading) {
        return (
            <div className='rounded-lg border border-gray-300 dark:border-[#2D2D2D] overflow-hidden'>
                <DarkOutlineTable>
                    <DarkOutlineTableHeader>
                        <DarkOutlineTableRow>
                            <DarkOutlineTableHead>ID</DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Mã giao dịch
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Phương thức
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>Số tiền</DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Trạng thái
                            </DarkOutlineTableHead>
                            <DarkOutlineTableHead>
                                Ngày tạo
                            </DarkOutlineTableHead>
                        </DarkOutlineTableRow>
                    </DarkOutlineTableHeader>
                    <DarkOutlineTableBody>
                        {[1, 2, 3].map((i) => (
                            <DarkOutlineTableRow key={i}>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-12' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-32' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-6 w-16' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-6 w-20' />
                                </DarkOutlineTableCell>
                                <DarkOutlineTableCell>
                                    <Skeleton className='h-4 w-28' />
                                </DarkOutlineTableCell>
                            </DarkOutlineTableRow>
                        ))}
                    </DarkOutlineTableBody>
                </DarkOutlineTable>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className='rounded-lg border border-gray-300 dark:border-[#2D2D2D] bg-white dark:bg-[#1A1A1A] p-12 text-center'>
                <p className='text-gray-600 dark:text-gray-400 text-lg'>
                    Chưa có giao dịch nào
                </p>
                <p className='text-gray-500 dark:text-gray-500 text-sm mt-2'>
                    Các giao dịch thanh toán sẽ hiển thị ở đây
                </p>
            </div>
        )
    }

    return (
        <div className='rounded-lg border border-gray-300 dark:border-[#2D2D2D] overflow-hidden'>
            <DarkOutlineTable>
                <DarkOutlineTableHeader>
                    <DarkOutlineTableRow>
                        <DarkOutlineTableHead>ID</DarkOutlineTableHead>
                        <DarkOutlineTableHead>
                            Mã giao dịch
                        </DarkOutlineTableHead>
                        <DarkOutlineTableHead>Phương thức</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Số tiền</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
                    </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                    {transactions.map((transaction) => (
                        <DarkOutlineTableRow key={transaction.id}>
                            <DarkOutlineTableCell className='font-mono text-sm text-gray-600 dark:text-gray-400'>
                                #{transaction.id}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='font-mono text-sm'>
                                {transaction.transactionId || 'N/A'}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                {getGatewayBadge(transaction.paymentGateway)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='font-semibold text-gray-900 dark:text-white'>
                                {formatPrice(
                                    typeof transaction.amount === 'string'
                                        ? parseFloat(transaction.amount)
                                        : transaction.amount
                                )}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                                {getStatusBadge(transaction.status)}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className='text-sm text-gray-600 dark:text-gray-400'>
                                {formatDateTime(transaction.createdAt)}
                            </DarkOutlineTableCell>
                        </DarkOutlineTableRow>
                    ))}
                </DarkOutlineTableBody>
            </DarkOutlineTable>
        </div>
    )
}
