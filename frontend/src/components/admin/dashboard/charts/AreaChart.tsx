import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { ChartContainer } from './ChartContainer'

interface AreaChartProps {
    data: Array<Record<string, any>>
    dataKey: string
    xAxisKey: string
    strokeColor?: string
    fillColor?: string
    title?: string
    description?: string
    height?: number
    showLegend?: boolean
    formatXAxis?: (value: any) => string
    formatYAxis?: (value: any) => string
    formatTooltip?: (value: any, name: string) => [string, string]
}

export function AreaChart({
    data,
    dataKey,
    xAxisKey,
    strokeColor = '#3b82f6',
    fillColor = '#3b82f6',
    title,
    description,
    height = 300,
    showLegend = false,
    formatXAxis,
    formatYAxis,
    formatTooltip,
}: AreaChartProps) {
    const chartContent = (
        <ResponsiveContainer width='100%' height={height}>
            <RechartsAreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <defs>
                    <linearGradient id={`gradient-${dataKey}`} x1='0' y1='0' x2='0' y2='1'>
                        <stop
                            offset='5%'
                            stopColor={fillColor}
                            stopOpacity={0.8}
                        />
                        <stop
                            offset='95%'
                            stopColor={fillColor}
                            stopOpacity={0.1}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='#2D2D2D'
                    opacity={0.3}
                />
                <XAxis
                    dataKey={xAxisKey}
                    stroke='#888'
                    fontSize={12}
                    tickFormatter={formatXAxis}
                />
                <YAxis
                    stroke='#888'
                    fontSize={12}
                    tickFormatter={formatYAxis}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #2D2D2D',
                        borderRadius: '8px',
                        color: '#fff',
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={formatTooltip}
                />
                {showLegend && (
                    <Legend
                        wrapperStyle={{ color: '#888', fontSize: '12px' }}
                    />
                )}
                <Area
                    type='monotone'
                    dataKey={dataKey}
                    stroke={strokeColor}
                    fill={`url(#gradient-${dataKey})`}
                    strokeWidth={2}
                />
            </RechartsAreaChart>
        </ResponsiveContainer>
    )

    if (title) {
        return (
            <ChartContainer title={title} description={description}>
                {chartContent}
            </ChartContainer>
        )
    }

    return chartContent
}


