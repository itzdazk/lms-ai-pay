import React from 'react'
import { DarkOutlineButton } from '../../ui/buttons'

interface RefundsPaginationProps {
    pagination: {
        page: number
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
    const pages: (number | string)[] = []
    const totalPages = pagination.totalPages
    const currentPage = pagination.page

    // Calculate range: show 5 pages around current page (2 before, current, 2 after)
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)

    // Adjust if we're near the start
    if (currentPage <= 3) {
        startPage = 1
        endPage = Math.min(5, totalPages)
    }

    // Adjust if we're near the end
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4)
        endPage = totalPages
    }

    // Always show first page if not in range
    if (startPage > 1) {
        pages.push(1)
        if (startPage > 2) {
            pages.push('...')
        }
    }

    // Add pages in range
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
    }

    // Always show last page if not in range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push('...')
        }
        pages.push(totalPages)
    }

    return (
        <div className='flex items-center justify-center gap-1'>
            <DarkOutlineButton
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || loading}
                size='sm'
                className='min-w-[40px] h-9'
            >
                &lt;&lt;
            </DarkOutlineButton>
            <DarkOutlineButton
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                size='sm'
                className='min-w-[40px] h-9'
            >
                &lt;
            </DarkOutlineButton>

            {/* Page Numbers */}
            <div className='flex items-center gap-1'>
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-gray-500'
                            >
                                ...
                            </span>
                        )
                    }
                    const pageNum = page as number
                    return (
                        <DarkOutlineButton
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            disabled={loading}
                            size='sm'
                            className={
                                currentPage === pageNum
                                    ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                    : ''
                            }
                        >
                            {pageNum}
                        </DarkOutlineButton>
                    )
                })}
            </div>

            <DarkOutlineButton
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                size='sm'
                className='min-w-[40px] h-9'
            >
                &gt;
            </DarkOutlineButton>
            <DarkOutlineButton
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                size='sm'
                className='min-w-[40px] h-9'
            >
                &gt;&gt;
            </DarkOutlineButton>
        </div>
    )
}
