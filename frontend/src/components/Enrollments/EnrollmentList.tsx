import { EnrollmentCard } from './EnrollmentCard'
import { EnrollmentEmptyState } from './EnrollmentEmptyState'
import { Skeleton } from '../ui/skeleton'
import type { EnrollmentWithCourse } from '../../lib/api/enrollments'

interface EnrollmentListProps {
    enrollments: EnrollmentWithCourse[]
    isLoading?: boolean
    hasFilters?: boolean
    status?: string
}

export function EnrollmentList({
    enrollments,
    isLoading,
    hasFilters,
    status,
}: EnrollmentListProps) {
    if (isLoading) {
        return (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className='rounded-2xl overflow-hidden border border-gray-200 bg-white'
                    >
                        <Skeleton className='w-full h-48' />
                        <div className='p-6 space-y-4'>
                            <Skeleton className='h-6 w-3/4' />
                            <Skeleton className='h-4 w-1/2' />
                            <Skeleton className='h-2 w-full' />
                            <div className='grid grid-cols-2 gap-3'>
                                <Skeleton className='h-16 w-full' />
                                <Skeleton className='h-16 w-full' />
                            </div>
                            <Skeleton className='h-10 w-full' />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (enrollments.length === 0) {
        return <EnrollmentEmptyState hasFilters={hasFilters} status={status} />
    }

    return (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {enrollments.map((enrollment) => (
                <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
        </div>
    )
}
