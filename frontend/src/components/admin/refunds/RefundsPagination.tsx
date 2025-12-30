import { Button } from '../../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RefundsPaginationProps {
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    loading: boolean
    onPageChange: (page: number) => void
}

export function RefundsPagination({
    pagination,
    loading,
    onPageChange,
}: RefundsPaginationProps) {
    const { page, totalPages } = pagination

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxPagesToShow = 5

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)

            if (page > 3) {
                pages.push('...')
            }

            // Show pages around current page
            const start = Math.max(2, page - 1)
            const end = Math.min(totalPages - 1, page + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (page < totalPages - 2) {
                pages.push('...')
            }

            // Always show last page
            pages.push(totalPages)
        }

        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <div className='flex items-center justify-between gap-4'>
            <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || loading}
                className='bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#252525] disabled:opacity-50'
            >
                <ChevronLeft className='h-4 w-4 mr-1' />
                Trước
            </Button>

            <div className='flex items-center gap-1'>
                {pageNumbers.map((pageNum, index) => {
                    if (pageNum === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-3 py-1 text-gray-400'
                            >
                                ...
                            </span>
                        )
                    }

                    return (
                        <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size='sm'
                            onClick={() => onPageChange(pageNum as number)}
                            disabled={loading}
                            className={
                                page === pageNum
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#252525]'
                            }
                        >
                            {pageNum}
                        </Button>
                    )
                })}
            </div>

            <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || loading}
                className='bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#252525] disabled:opacity-50'
            >
                Sau
                <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
        </div>
    )
}

