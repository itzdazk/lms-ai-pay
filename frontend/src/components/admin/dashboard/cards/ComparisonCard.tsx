import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ComparisonCardProps {
    title: string
    current: number
    previous: number
    formatValue?: (value: number) => string
    className?: string
}

export function ComparisonCard({
    title,
    current,
    previous,
    formatValue = (v) => v.toLocaleString('vi-VN'),
    className = '',
}: ComparisonCardProps) {
    const growth = previous > 0 ? ((current - previous) / previous) * 100 : 0
    const isPositive = growth >= 0

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <CardTitle className='text-sm font-medium text-gray-400'>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-400'>Tháng này</span>
                        <span className='text-xl font-bold text-white'>
                            {formatValue(current)}
                        </span>
                    </div>
                    <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-400'>Tháng trước</span>
                        <span className='text-lg text-gray-300'>
                            {formatValue(previous)}
                        </span>
                    </div>
                    <div
                        className={`flex items-center gap-2 mt-3 px-3 py-2 rounded ${
                            isPositive
                                ? 'text-green-500 bg-green-500/20'
                                : 'text-red-500 bg-red-500/20'
                        }`}
                    >
                        {isPositive ? (
                            <TrendingUp className='h-4 w-4' />
                        ) : (
                            <TrendingDown className='h-4 w-4' />
                        )}
                        <span className='text-sm font-medium'>
                            {isPositive ? '+' : ''}
                            {growth.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


