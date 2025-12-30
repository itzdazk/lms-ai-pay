import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card'

interface ChartContainerProps {
    title?: string
    description?: string
    children: ReactNode
    className?: string
}

export function ChartContainer({
    title,
    description,
    children,
    className = '',
}: ChartContainerProps) {
    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            {title && (
                <CardHeader>
                    <CardTitle className='text-white'>{title}</CardTitle>
                    {description && (
                        <p className='text-sm text-gray-400 mt-1'>
                            {description}
                        </p>
                    )}
                </CardHeader>
            )}
            <CardContent className={title ? '' : 'p-6'}>
                {children}
            </CardContent>
        </Card>
    )
}


