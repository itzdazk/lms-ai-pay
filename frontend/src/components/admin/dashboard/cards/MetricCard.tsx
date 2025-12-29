import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card'

interface MetricCardProps {
    title: string
    value: string | number
    description?: string
    className?: string
}

export function MetricCard({
    title,
    value,
    description,
    className = '',
}: MetricCardProps) {
    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <CardTitle className='text-sm font-medium text-gray-400'>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='text-2xl font-bold text-white'>{value}</div>
                {description && (
                    <p className='text-xs text-gray-500 mt-1'>{description}</p>
                )}
            </CardContent>
        </Card>
    )
}


