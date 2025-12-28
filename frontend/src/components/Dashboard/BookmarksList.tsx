import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DarkOutlineButton } from '../ui/buttons'
import { Badge } from '../ui/badge'
import { Loader2, Bookmark, X } from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'
import { toast } from 'sonner'

export function BookmarksList() {
    const [bookmarks, setBookmarks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchBookmarks()
    }, [])

    const fetchBookmarks = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await dashboardApi.getBookmarks()
            setBookmarks(data)
        } catch (err: any) {
            setError(err.message || 'Failed to load bookmarks')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            await dashboardApi.deleteBookmark(id)
            toast.success('Đã xóa bookmark')
            fetchBookmarks()
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete bookmark')
        }
    }

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Bookmarks</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Bookmarks</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (bookmarks.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Bookmark className='h-5 w-5 text-blue-400' />
                        Bookmarks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-gray-400 text-sm'>
                        Chưa có bookmark nào. Hãy bookmark các khóa học hoặc bài
                        học bạn muốn xem lại!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <Bookmark className='h-5 w-5 text-blue-400' />
                    Bookmarks ({bookmarks.length})
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
                {bookmarks.slice(0, 5).map((bookmark) => (
                    <div
                        key={bookmark.id}
                        className='flex items-start justify-between p-3 rounded-lg border border-[#2D2D2D] bg-black/40 hover:bg-black/60 transition-colors'
                    >
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                                <Badge
                                    className={
                                        bookmark.type === 'COURSE'
                                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                            : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                    }
                                >
                                    {bookmark.type === 'COURSE'
                                        ? 'Khóa học'
                                        : 'Bài học'}
                                </Badge>
                            </div>
                            {bookmark.type === 'COURSE' && bookmark.course && (
                                <Link
                                    to={`/courses/${bookmark.course.slug}`}
                                    className='text-sm text-white font-medium hover:text-blue-400 transition-colors block'
                                >
                                    {bookmark.course.title}
                                </Link>
                            )}
                            {bookmark.type === 'LESSON' && bookmark.lesson && (
                                <div>
                                    <Link
                                        to={`/courses/${bookmark.lesson.course.slug}/lessons/${bookmark.lesson.slug}`}
                                        className='text-sm text-white font-medium hover:text-blue-400 transition-colors block'
                                    >
                                        {bookmark.lesson.title}
                                    </Link>
                                    <p className='text-xs text-gray-400'>
                                        {bookmark.lesson.course.title}
                                    </p>
                                </div>
                            )}
                            {bookmark.note && (
                                <p className='text-xs text-gray-400 mt-1 line-clamp-1'>
                                    {bookmark.note}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(bookmark.id)}
                            className='ml-3 p-1 text-gray-400 hover:text-red-400 transition-colors'
                        >
                            <X className='h-4 w-4' />
                        </button>
                    </div>
                ))}
                {bookmarks.length > 5 && (
                    <p className='text-xs text-gray-400 text-center'>
                        Và {bookmarks.length - 5} bookmark khác...
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
