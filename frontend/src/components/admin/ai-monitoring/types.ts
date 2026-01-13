export interface Conversation {
    id: number
    title: string
    mode: 'advisor' | 'general' | 'course'
    userId?: number
    user?: {
        id: number
        fullName: string
        email: string
    }
    courseId?: number
    course?: {
        id: number
        title: string
        slug: string
    }
    lessonId?: number
    lesson?: {
        id: number
        title: string
    }
    lastMessage?: string
    lastMessageAt?: string
    createdAt: string
    updatedAt: string
    messageCount?: number
}

export interface Course {
    courseId?: number
    courseTitle?: string
    courseSlug?: string
    title?: string
    slug?: string
    level?: string
    price?: number
    discountPrice?: number
    rating?: number
    ratingCount?: number
    enrolledCount?: number
    duration?: number
    durationHours?: number
    lessons?: number
    description?: string
    thumbnail?: string
    thumbnailUrl?: string
    instructor?: any
}

export interface Message {
    id: number
    message: string
    senderType: 'user' | 'ai'
    messageType?: string
    metadata?: {
        sources?: Course[]
        suggestedActions?: any[]
        usedOllama?: boolean
        fallbackReason?: string | null
        responseTime?: number
        mode?: string
        tokens?: number
    }
    isHelpful?: boolean | null
    feedbackText?: string | null
    createdAt: string
}

export interface AIStats {
    totalConversations: number
    totalMessages: number
    uniqueUsers: number
    recentConversations: number
    avgResponseTime: number
    ollamaUsageRate: number
    fallbackCount: number
    totalSources: number
    byMode: {
        advisor?: number
        general?: number
        course?: number
    }
}

export interface ConversationStats {
    conversationId: number
    totalMessages: number
    userMessages: number
    aiMessages: number
    avgResponseTime: number
    ollamaUsageRate: number
    fallbackCount: number
    totalSources: number
    helpfulCount: number
    notHelpfulCount: number
    feedbackRate: number
    duration: number
    messagesByHour?: { [key: string]: number }
    firstMessageAt: string | null
    lastMessageAt: string | null
}
