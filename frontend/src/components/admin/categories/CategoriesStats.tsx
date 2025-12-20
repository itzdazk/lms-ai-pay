import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Loader2, FolderTree, TrendingUp, Archive, FileText, Star } from 'lucide-react'
import type { CategoryStats } from '../../../lib/api/categories'

interface CategoriesStatsProps {
    loading: boolean
    stats: CategoryStats | null
}

export function CategoriesStats({ loading, stats }: CategoriesStatsProps) {
    if (!stats && !loading) return null

    return (
        <>
            {!loading && stats && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6'>
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between mb-2'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Tổng danh mục
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.total.toLocaleString()}
                                    </p>
                                </div>
                                <FolderTree className='h-8 w-8 text-blue-500' />
                            </div>
                            <div className='mt-3 pt-3 border-t border-[#2D2D2D]'>
                                <div className='flex items-center justify-between text-xs'>
                                    <span className='text-gray-400'>Danh mục cha:</span>
                                    <span className='text-blue-400 font-semibold'>
                                        {stats.parent.toLocaleString()}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between text-xs mt-1'>
                                    <span className='text-gray-400'>Danh mục con:</span>
                                    <span className='text-green-400 font-semibold'>
                                        {stats.child.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Đang hoạt động
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.active.toLocaleString()}
                                    </p>
                                </div>
                                <TrendingUp className='h-8 w-8 text-green-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Không hoạt động
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.inactive.toLocaleString()}
                                    </p>
                                </div>
                                <Archive className='h-8 w-8 text-gray-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Danh mục cha
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.parent.toLocaleString()}
                                    </p>
                                </div>
                                <FileText className='h-8 w-8 text-yellow-500' />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm font-medium text-gray-400 mb-1'>
                                        Danh mục con
                                    </p>
                                    <p className='text-2xl font-bold text-white'>
                                        {stats.child.toLocaleString()}
                                    </p>
                                </div>
                                <Star className='h-8 w-8 text-purple-500' />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {loading && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6'>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i} className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='p-6'>
                                <div className='flex items-center justify-center h-24'>
                                    <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    )
}
