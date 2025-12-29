import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts'
import { ChartContainer } from './ChartContainer'

interface BarChartProps {
    data: Array<Record<string, any>>
    dataKey: string
    xAxisKey: string
    fillColor?: string
    title?: string
    description?: string
    height?: number
    showLegend?: boolean
    formatXAxis?: (value: any) => string
    formatYAxis?: (value: any) => string
    formatTooltip?: (value: any, name: string) => [string, string]
    formatLabel?: (label: any, payload?: any) => string
    colors?: string[]
}

export function BarChart({
    data,
    dataKey,
    xAxisKey,
    fillColor = '#3b82f6',
    title,
    description,
    height = 300,
    showLegend = false,
    formatXAxis,
    formatYAxis,
    formatTooltip,
    formatLabel,
    colors,
}: BarChartProps) {
    const chartContent = (
        <ResponsiveContainer width='100%' height={height}>
            <RechartsBarChart
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
                    labelFormatter={formatLabel}
                />
                {showLegend && (
                    <Legend
                        wrapperStyle={{ color: '#888', fontSize: '12px' }}
                    />
                )}
                <Bar dataKey={dataKey} fill={fillColor} radius={[4, 4, 0, 0]}>
                    {colors &&
                        data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                            />
                        ))}
                </Bar>
            </RechartsBarChart>
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
