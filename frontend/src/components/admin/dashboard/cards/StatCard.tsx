import { Card, CardContent, CardHeader } from '../../../ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ReactNode } from 'react'

interface StatCardProps {
    title: string
    value: string | number
    icon: ReactNode
    growth?: number
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    className?: string
}

export function StatCard({
    title,
    value,
    icon,
    growth,
    subtitle,
    trend,
    className = '',
}: StatCardProps) {
    const getTrendColor = () => {
        if (trend === 'up' || (growth !== undefined && growth > 0)) {
            return 'text-green-500 bg-green-500/20'
        }
        if (trend === 'down' || (growth !== undefined && growth < 0)) {
            return 'text-red-500 bg-red-500/20'
        }
        return 'text-gray-500 bg-gray-500/20'
    }

    const getTrendIcon = () => {
        if (trend === 'up' || (growth !== undefined && growth > 0)) {
            return <TrendingUp className='h-4 w-4' />
        }
        if (trend === 'down' || (growth !== undefined && growth < 0)) {
            return <TrendingDown className='h-4 w-4' />
        }
        return <Minus className='h-4 w-4' />
    }

    const formatGrowth = () => {
        if (growth === undefined) return null
        const sign = growth >= 0 ? '+' : ''
        return `${sign}${growth.toFixed(1)}%`
    }

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='text-sm font-medium text-gray-400'>{title}</div>
                <div className='text-gray-400'>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className='text-2xl font-bold text-white'>{value}</div>
                {subtitle && (
                    <p className='text-xs text-gray-500 mt-1'>{subtitle}</p>
                )}
                {growth !== undefined && (
                    <div
                        className={`flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded ${getTrendColor()}`}
                    >
                        {getTrendIcon()}
                        <span>{formatGrowth()}</span>
                        <span className='text-gray-400 ml-1'>vs tháng trước</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


