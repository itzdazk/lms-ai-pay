import React from 'react'
import { DarkOutlineButton } from '../../../components/ui/buttons'

interface TagsPaginationProps {
    pagination: {
        page: number
        totalPages: number
    }
    loading: boolean
    onPageChange: (page: number) => void
}

export function TagsPagination({ pagination, loading, onPageChange }: TagsPaginationProps) {
    const pages: (number | string)[] = []
    const totalPages = pagination.totalPages
    const currentPage = pagination.page

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i)
        }
    } else {
        pages.push(1)
        if (currentPage > 3) {
            pages.push('...')
        }
        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            pages.push(i)
        }
        if (currentPage < totalPages - 2) {
            pages.push('...')
        }
        pages.push(totalPages)
    }

    return (
        <div className='flex items-center gap-2 flex-wrap'>
            <DarkOutlineButton
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || loading}
                size='sm'
            >
                &lt;&lt;
            </DarkOutlineButton>
            <DarkOutlineButton
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                size='sm'
            >
                &lt;
            </DarkOutlineButton>
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
            <DarkOutlineButton
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                size='sm'
            >
                &gt;
            </DarkOutlineButton>
            <DarkOutlineButton
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || loading}
                size='sm'
            >
                &gt;&gt;
            </DarkOutlineButton>
        </div>
    )
}
