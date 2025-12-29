import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts'
import { ChartContainer } from './ChartContainer'

interface PieChartProps {
    data: Array<{ name: string; value: number }>
    colors?: string[]
    title?: string
    description?: string
    height?: number
    showLegend?: boolean
    formatTooltip?: (value: any, name: string) => [string, string]
}

const DEFAULT_COLORS = [
    '#3b82f6',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#84cc16',
]

export function PieChart({
    data,
    colors = DEFAULT_COLORS,
    title,
    description,
    height = 300,
    showLegend = true,
    formatTooltip,
}: PieChartProps) {
    const chartContent = (
        <ResponsiveContainer width='100%' height={height}>
            <RechartsPieChart>
                <Pie
                    data={data}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #2D2D2D',
                        borderRadius: '8px',
                        color: '#fff',
                    }}
                    formatter={formatTooltip}
                />
                {showLegend && (
                    <Legend
                        wrapperStyle={{ color: '#888', fontSize: '12px' }}
                    />
                )}
            </RechartsPieChart>
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
