import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, StickyNote } from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'

export function NotesSummaryCard() {
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getNotesSummary()
                setSummary(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load notes summary')
            } finally {
                setLoading(false)
            }
        }

        fetchSummary()
    }, [])

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Ghi chú</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !summary) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Ghi chú</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>
                        {error || 'Không có dữ liệu'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <StickyNote className='h-5 w-5 text-blue-400' />
                    Ghi chú ({summary.totalNotes})
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {summary.recentNotes.length > 0 ? (
                    <>
                        <div className='space-y-2'>
                            {summary.recentNotes
                                .slice(0, 3)
                                .map((note: any) => (
                                    <Link
                                        key={note.id}
                                        to={`/courses/${note.courseId}/lessons/${note.lessonId}`}
                                        className='block p-3 rounded-lg border border-[#2D2D2D] bg-black/40 hover:bg-black/60 transition-colors'
                                    >
                                        <p className='text-sm text-white font-medium line-clamp-1'>
                                            {note.lessonTitle}
                                        </p>
                                        <p className='text-xs text-gray-400 mt-1 line-clamp-2'>
                                            {note.contentPreview}
                                        </p>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            {note.courseTitle}
                                        </p>
                                    </Link>
                                ))}
                        </div>
                        {summary.byCourse.length > 0 && (
                            <div className='pt-3 border-t border-[#2D2D2D]'>
                                <p className='text-xs text-gray-400 mb-2'>
                                    Ghi chú theo khóa học:
                                </p>
                                <div className='flex flex-wrap gap-2'>
                                    {summary.byCourse.map((course: any) => (
                                        <Badge
                                            key={course.courseId}
                                            className='bg-blue-500/20 text-blue-400 border-blue-500/30'
                                        >
                                            {course.courseTitle} (
                                            {course.noteCount})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className='text-gray-400 text-sm'>
                        Chưa có ghi chú nào. Hãy tạo ghi chú khi học bài!
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
