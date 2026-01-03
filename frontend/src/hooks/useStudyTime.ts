import { useState, useEffect } from 'react'
import { dashboardApi } from '../lib/api/dashboard'
import { formatStudyTime } from '../lib/dashboardUtils'

interface StudyTimeAnalytics {
    totals: {
        today: number
        thisWeek: number
        thisMonth: number
        allTime: number
    }
    formatted: {
        today: string
        thisWeek: string
        thisMonth: string
        allTime: string
    }
    dailyAverage: number
    byCourse: Array<{
        courseId: number
        courseTitle: string
        studyTime: number
        formatted: string
        percentage: number
    }>
    trend: Array<{
        date: string
        studyTime: number
        formatted: string
    }>
}

// Set to true to use mock data for testing
const USE_MOCK_DATA = false

// Generate mock data for testing
function generateMockData(): StudyTimeAnalytics {
    const now = new Date()
    const trend: Array<{ date: string; studyTime: number; formatted: string }> =
        []

    // Generate data for last 90 days
    for (let i = 89; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)

        // Random study time between 0 and 4 hours (in seconds)
        // Add some variation: weekends have less study time
        const dayOfWeek = date.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const baseTime = isWeekend ? 3600 : 7200 // 1h weekend, 2h weekday
        const randomVariation = Math.random() * 7200 // 0-2h variation
        const studyTime = Math.floor(baseTime + randomVariation)

        trend.push({
            date: date.toISOString().split('T')[0],
            studyTime,
            formatted: formatStudyTime(studyTime),
        })
    }

    // Calculate totals
    const today = trend[trend.length - 1]?.studyTime || 0
    const thisWeek = trend
        .slice(-7)
        .reduce((sum, item) => sum + item.studyTime, 0)
    const thisMonth = trend
        .slice(-30)
        .reduce((sum, item) => sum + item.studyTime, 0)
    const allTime = trend.reduce((sum, item) => sum + item.studyTime, 0)
    const dailyAverage = allTime / trend.length

    // Mock course breakdown
    const byCourse = [
        {
            courseId: 1,
            courseTitle: 'JavaScript Cơ bản',
            studyTime: Math.floor(allTime * 0.35),
            formatted: formatStudyTime(Math.floor(allTime * 0.35)),
            percentage: 35,
        },
        {
            courseId: 2,
            courseTitle: 'React Advanced',
            studyTime: Math.floor(allTime * 0.28),
            formatted: formatStudyTime(Math.floor(allTime * 0.28)),
            percentage: 28,
        },
        {
            courseId: 3,
            courseTitle: 'Node.js Backend',
            studyTime: Math.floor(allTime * 0.22),
            formatted: formatStudyTime(Math.floor(allTime * 0.22)),
            percentage: 22,
        },
        {
            courseId: 4,
            courseTitle: 'TypeScript Mastery',
            studyTime: Math.floor(allTime * 0.15),
            formatted: formatStudyTime(Math.floor(allTime * 0.15)),
            percentage: 15,
        },
    ]

    return {
        totals: {
            today,
            thisWeek,
            thisMonth,
            allTime,
        },
        formatted: {
            today: formatStudyTime(today),
            thisWeek: formatStudyTime(thisWeek),
            thisMonth: formatStudyTime(thisMonth),
            allTime: formatStudyTime(allTime),
        },
        dailyAverage,
        byCourse,
        trend,
    }
}

export function useStudyTime() {
    const [analytics, setAnalytics] = useState<StudyTimeAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true)
                setError(null)

                if (USE_MOCK_DATA) {
                    // Simulate API delay
                    await new Promise((resolve) => setTimeout(resolve, 500))
                    const mockData = generateMockData()
                    setAnalytics(mockData)
                } else {
                    const data = await dashboardApi.getStudyTimeAnalytics()
                    setAnalytics(data)
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load study time analytics')
                // Fallback to mock data on error if needed
                // Uncomment the line below to use mock data on error
                // setAnalytics(generateMockData())
            } finally {
                setLoading(false)
            }
        }

        fetchAnalytics()
    }, [])

    return {
        analytics,
        loading,
        error,
    }
}
