import {
    LineChart as RechartsLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'
import { ChartContainer } from './ChartContainer'

interface LineChartProps {
    data: Array<Record<string, any>>
    dataKey: string
    xAxisKey: string
    strokeColor?: string
    title?: string
    description?: string
    height?: number
    showLegend?: boolean
    formatXAxis?: (value: any) => string
    formatYAxis?: (value: any) => string
    formatTooltip?: (value: any, name: string) => [string, string]
}

export function LineChart({
    data,
    dataKey,
    xAxisKey,
    strokeColor = '#3b82f6',
    title,
    description,
    height = 300,
    showLegend = false,
    formatXAxis,
    formatYAxis,
    formatTooltip,
}: LineChartProps) {
    const chartContent = (
        <ResponsiveContainer width='100%' height={height}>
            <RechartsLineChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
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
                <Line
                    type='monotone'
                    dataKey={dataKey}
                    stroke={strokeColor}
                    strokeWidth={2}
                    dot={{ fill: strokeColor, r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </RechartsLineChart>
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


