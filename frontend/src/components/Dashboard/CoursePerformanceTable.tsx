import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    DarkOutlineTable,
    DarkOutlineTableHeader,
    DarkOutlineTableBody,
    DarkOutlineTableRow,
    DarkOutlineTableHead,
    DarkOutlineTableCell,
} from '../ui/dark-outline-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { useInstructorAnalytics } from '../../hooks/useInstructorAnalytics'
import type { CoursePerformance } from '../../lib/api/instructor-dashboard'

type SortField = 'title' | 'totalEnrollments' | 'completionRate' | 'ratingAvg'
type SortDirection = 'asc' | 'desc'

interface CoursePerformanceTableProps {
    className?: string
}

export function CoursePerformanceTable({ className }: CoursePerformanceTableProps) {
    const navigate = useNavigate()
    const { analytics, isLoading, isError } = useInstructorAnalytics()
    const [sortField, setSortField] = useState<SortField>('totalEnrollments')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const courseAnalytics = analytics?.courseAnalytics || []

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('desc')
        }
    }

    const sortedCourses = [...courseAnalytics].sort((a, b) => {
        let aValue: number | string
        let bValue: number | string

        switch (sortField) {
            case 'title':
                aValue = a.title.toLowerCase()
                bValue = b.title.toLowerCase()
                break
            case 'totalEnrollments':
                aValue = a.totalEnrollments
                bValue = b.totalEnrollments
                break
            case 'completionRate':
                aValue = a.completionRate
                bValue = b.completionRate
                break
            case 'ratingAvg':
                aValue = a.ratingAvg
                bValue = b.ratingAvg
                break
            default:
                return 0
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue)
        }

        return sortDirection === 'asc'
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number)
    })

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            DRAFT: { label: 'Bản nháp', className: 'bg-gray-500/20 text-gray-400' },
            PUBLISHED: { label: 'Đã xuất bản', className: 'bg-green-500/20 text-green-400' },
            ARCHIVED: { label: 'Đã lưu trữ', className: 'bg-yellow-500/20 text-yellow-400' },
        }
        const statusInfo = statusMap[status.toUpperCase()] || statusMap.DRAFT
        return (
            <span className={`px-2 py-1 rounded text-xs ${statusInfo.className}`}>
                {statusInfo.label}
            </span>
        )
    }

    const getCompletionRateColor = (rate: number) => {
        if (rate >= 70) return 'text-green-500'
        if (rate >= 40) return 'text-yellow-500'
        return 'text-red-500'
    }

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => {
        const isActive = sortField === field
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort(field)}
                className="h-auto p-0 hover:bg-transparent text-gray-400 hover:text-white"
            >
                <span className="flex items-center gap-1">
                    {children}
                    {isActive ? (
                        sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                        ) : (
                            <ArrowDown className="h-3 w-3" />
                        )
                    ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                    )}
                </span>
            </Button>
        )
    }

    if (isError) {
        return (
            <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-gray-400">Không thể tải dữ liệu hiệu suất khóa học</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <CardTitle className="text-white">Hiệu suất khóa học</CardTitle>
                <CardDescription className="text-gray-400">
                    Phân tích chi tiết từng khóa học
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : sortedCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-gray-400">Chưa có khóa học</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <DarkOutlineTable>
                            <DarkOutlineTableHeader>
                                <DarkOutlineTableRow>
                                    <DarkOutlineTableHead>
                                        <SortButton field="title">Khóa học</SortButton>
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Bài học</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>
                                        <SortButton field="totalEnrollments">Tổng đăng ký</SortButton>
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Đang học</DarkOutlineTableHead>
                                    <DarkOutlineTableHead>
                                        <SortButton field="completionRate">Tỷ lệ hoàn thành</SortButton>
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead>
                                        <SortButton field="ratingAvg">Đánh giá</SortButton>
                                    </DarkOutlineTableHead>
                                    <DarkOutlineTableHead>Thao tác</DarkOutlineTableHead>
                                </DarkOutlineTableRow>
                            </DarkOutlineTableHeader>
                            <DarkOutlineTableBody>
                                {sortedCourses.map((course) => (
                                    <DarkOutlineTableRow key={course.courseId}>
                                        <DarkOutlineTableCell>
                                            <p className="font-medium text-white line-clamp-1 max-w-[200px]">
                                                {course.title}
                                            </p>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            {getStatusBadge(course.status)}
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <span className="text-gray-300">
                                                {course.publishedLessons}/{course.totalLessons}
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <span className="text-gray-300">{course.totalEnrollments}</span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <span className="text-gray-300">{course.activeEnrollments}</span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <span className={getCompletionRateColor(course.completionRate)}>
                                                {course.completionRate.toFixed(1)}%
                                            </span>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <div className="flex items-center gap-1">
                                                {course.ratingCount > 0 ? (
                                                    <>
                                                        <span className="text-yellow-500">
                                                            {course.ratingAvg.toFixed(1)}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">
                                                            ({course.ratingCount})
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-500">-</span>
                                                )}
                                            </div>
                                        </DarkOutlineTableCell>
                                        <DarkOutlineTableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    navigate(`/instructor/courses/${course.courseId}/edit`)
                                                }
                                                className="text-blue-500 hover:text-blue-400"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-1" />
                                                Xem
                                            </Button>
                                        </DarkOutlineTableCell>
                                    </DarkOutlineTableRow>
                                ))}
                            </DarkOutlineTableBody>
                        </DarkOutlineTable>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

