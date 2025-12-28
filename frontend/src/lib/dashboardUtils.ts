/**
 * Dashboard utility functions
 */

export interface Activity {
    type: 'ENROLLMENT' | 'LESSON_COMPLETED' | 'QUIZ_SUBMITTED'
    timestamp: string
    course: {
        id: number
        title: string
        slug: string
        thumbnailUrl?: string
    }
    lesson?: {
        id: number
        title: string
        slug: string
    }
    quiz?: {
        id: number
        title: string
        score: number
        isPassed: boolean
    }
    data?: {
        watchDuration?: number
        completedAt?: string
    }
}

/**
 * Format study time from seconds to "Xh Ym" format
 */
export function formatStudyTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

/**
 * Get activity icon based on type
 */
export function getActivityIcon(type: Activity['type']) {
    switch (type) {
        case 'ENROLLMENT':
            return '📚'
        case 'LESSON_COMPLETED':
            return '✅'
        case 'QUIZ_SUBMITTED':
            return '📝'
        default:
            return '📌'
    }
}

/**
 * Format activity message
 */
export function formatActivityMessage(activity: Activity): string {
    switch (activity.type) {
        case 'ENROLLMENT':
            return `Đã đăng ký khóa học "${activity.course.title}"`
        case 'LESSON_COMPLETED':
            return `Đã hoàn thành bài học "${activity.lesson?.title}" trong "${activity.course.title}"`
        case 'QUIZ_SUBMITTED':
            return `Đã nộp bài quiz "${activity.quiz?.title}" với điểm ${activity.quiz?.score}%`
        default:
            return 'Hoạt động mới'
    }
}

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export function formatRelativeTime(date: string | Date): string {
    const now = new Date()
    const then = typeof date === 'string' ? new Date(date) : date
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
        return 'Vừa xong'
    } else if (diffMins < 60) {
        return `${diffMins} phút trước`
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`
    } else {
        return then.toLocaleDateString('vi-VN')
    }
}
