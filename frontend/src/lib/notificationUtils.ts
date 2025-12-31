import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { Notification } from './api'
import {
    CheckCircle,
    CreditCard,
    BookCheck,
    Trophy,
    FileCheck,
    Bell,
    XCircle,
    AlertCircle,
    UserPlus,
    UserCheck,
    UserX,
    Shield,
    BookOpen,
    Star,
    MessageSquare,
    DollarSign,
    TrendingUp,
    Download,
    Video,
    FileText,
    type LucideIcon,
} from 'lucide-react'

export interface NotificationTypeConfig {
    icon: LucideIcon
    iconColor: string
    bgColor: string
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
    ENROLLMENT_SUCCESS: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bgColor: 'bg-green-950/20',
    },
    PAYMENT_SUCCESS: {
        icon: CreditCard,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-950/20',
    },
    LESSON_COMPLETED: {
        icon: BookCheck,
        iconColor: 'text-purple-500',
        bgColor: 'bg-purple-950/20',
    },
    COURSE_COMPLETED: {
        icon: Trophy,
        iconColor: 'text-yellow-500',
        bgColor: 'bg-yellow-950/20',
    },
    QUIZ_GRADED: {
        icon: FileCheck,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-950/20',
    },
    PAYMENT_FAILED: {
        icon: XCircle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-950/20',
    },
    ORDER_CANCELLED: {
        icon: AlertCircle,
        iconColor: 'text-gray-500',
        bgColor: 'bg-gray-950/20',
    },
    // Admin notifications
    USER_REGISTERED: {
        icon: UserPlus,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-950/20',
    },
    USER_STATUS_CHANGED: {
        icon: UserCheck,
        iconColor: 'text-indigo-600',
        bgColor: 'bg-indigo-950/20',
    },
    USER_ROLE_CHANGED: {
        icon: Shield,
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-950/20',
    },
    COURSE_PENDING_APPROVAL: {
        icon: AlertCircle,
        iconColor: 'text-amber-600',
        bgColor: 'bg-amber-950/20',
    },
    COURSE_APPROVED: {
        icon: CheckCircle,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-950/20',
    },
    COURSE_REJECTED: {
        icon: XCircle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-950/20',
    },
    COURSE_PUBLISHED: {
        icon: BookOpen,
        iconColor: 'text-emerald-600',
        bgColor: 'bg-emerald-950/20',
    },
    LARGE_ORDER: {
        icon: DollarSign,
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-950/20',
    },
    REFUND_REQUEST: {
        icon: AlertCircle,
        iconColor: 'text-orange-600',
        bgColor: 'bg-orange-950/20',
    },
    SYSTEM_ALERT: {
        icon: AlertCircle,
        iconColor: 'text-red-600',
        bgColor: 'bg-red-950/20',
    },
    DAILY_REPORT: {
        icon: FileText,
        iconColor: 'text-gray-600',
        bgColor: 'bg-gray-950/20',
    },
    // Instructor notifications
    NEW_ENROLLMENT: {
        icon: UserPlus,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-950/20',
    },
    COURSE_APPROVAL_STATUS: {
        icon: CheckCircle,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-950/20',
    },
    NEW_REVIEW: {
        icon: Star,
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-950/20',
    },
    STUDENT_COMPLETED_COURSE: {
        icon: Trophy,
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-950/20',
    },
    NEW_QUESTION: {
        icon: MessageSquare,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-950/20',
    },
    QUIZ_SUBMISSION: {
        icon: FileCheck,
        iconColor: 'text-indigo-600',
        bgColor: 'bg-indigo-950/20',
    },
    PAYMENT_RECEIVED: {
        icon: DollarSign,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-950/20',
    },
    REVENUE_REPORT: {
        icon: TrendingUp,
        iconColor: 'text-emerald-600',
        bgColor: 'bg-emerald-950/20',
    },
    PAYOUT_PROCESSED: {
        icon: Download,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-950/20',
    },
    TRANSCRIPT_COMPLETED: {
        icon: FileText,
        iconColor: 'text-teal-600',
        bgColor: 'bg-teal-950/20',
    },
    VIDEO_UPLOADED: {
        icon: Video,
        iconColor: 'text-pink-600',
        bgColor: 'bg-pink-950/20',
    },
    DEFAULT: {
        icon: Bell,
        iconColor: 'text-gray-500',
        bgColor: 'bg-gray-950/20',
    },
}

export function getNotificationTypeConfig(
    type: string
): NotificationTypeConfig {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.DEFAULT
}

/**
 * Format notification timestamp in Vietnamese
 * - < 1 phút: "Vừa xong"
 * - < 60 phút: "X phút trước"
 * - < 24 giờ: "X giờ trước"
 * - Hôm qua: "Hôm qua lúc HH:mm"
 * - < 7 ngày: "Thứ X lúc HH:mm"
 * - Khác: "DD/MM/YYYY HH:mm"
 */
export function formatNotificationTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Less than 1 minute
    if (diffInSeconds < 60) {
        return 'Vừa xong'
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} phút trước`
    }

    // Today
    if (isToday(date)) {
        return formatDistanceToNow(date, {
            addSuffix: true,
            locale: vi,
        })
    }

    // Yesterday
    if (isYesterday(date)) {
        return `Hôm qua lúc ${format(date, 'HH:mm')}`
    }

    // Within 7 days
    const diffInDays = Math.floor(diffInSeconds / 86400)
    if (diffInDays < 7) {
        return format(date, "EEEE 'lúc' HH:mm", { locale: vi })
    }

    // Older than 7 days
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
}

/**
 * Get navigation route for notification based on relatedType
 */
export function getNotificationRoute(
    notification: Notification
): string | null {
    if (!notification.relatedId || !notification.relatedType) {
        return null
    }

    switch (notification.relatedType) {
        case 'COURSE':
            return `/courses/${notification.relatedId}`
        case 'LESSON':
            // We need course slug, but we don't have it in notification
            // For now, return course detail page
            return `/courses/${notification.relatedId}`
        case 'ORDER':
            return `/orders/${notification.relatedId}`
        case 'QUIZ':
            return `/quiz/${notification.relatedId}`
        default:
            return null
    }
}

