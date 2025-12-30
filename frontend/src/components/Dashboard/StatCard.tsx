import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    iconColor?: string
    bgColor?: string
    borderColor?: string
    description?: string
    progress?: number
}

export function StatCard({
    title,
    value,
    icon: Icon,
    iconColor = 'text-blue-400',
    bgColor = 'bg-blue-950/50',
    borderColor = 'border-blue-900',
    description,
    progress,
}: StatCardProps) {
    return (
        <Card
            className={`overflow-hidden border-l-4 ${borderColor} bg-[#1A1A1A] hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
        >
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-gray-300 dark:text-gray-300'>
                    {title}
                </CardTitle>
                <div className={`p-2.5 rounded-lg ${bgColor}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className='space-y-1'>
                    <div className='text-2xl font-bold text-gray-300 dark:text-gray-300'>
                        {value}
                    </div>
                    {description && (
                        <p className='text-xs text-gray-500 mt-1'>
                            {description}
                        </p>
                    )}
                </div>
                {progress !== undefined && (
                    <div className='mt-2'>
                        {/* Progress will be handled by parent if needed */}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
