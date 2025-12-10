// ============================================
// FILE: src/lib/courseUtils.ts (TẠO MỚI)
// Utility functions for course formatting
// ============================================

/**
 * Format price to VND currency
 * @param price - Price in VND
 * @returns Formatted string like "999.000₫"
 */
export function formatPrice(price: number): string {
    if (price === 0) return 'Miễn phí'

    return (
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        })
            .format(price) // ✅ GỌI format()
            .replace('₫', '') // ✅ replace chạy trên string
            .trim() + '₫'
    )
}

/**
 * Format duration from hours to human-readable string
 * @param hours - Duration in hours
 * @returns Formatted string like "5 giờ 30 phút" or "45 phút"
 */
export function formatDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)} phút`
    }

    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)

    if (m === 0) {
        return `${h} giờ`
    }

    return `${h} giờ ${m} phút`
}

/**
 * Calculate discount percentage
 * @param originalPrice - Original price
 * @param discountPrice - Discounted price
 * @returns Discount percentage rounded to integer
 */
export function calculateDiscount(
    originalPrice: number,
    discountPrice: number
): number {
    if (originalPrice <= 0 || discountPrice >= originalPrice) return 0
    return Math.round((1 - discountPrice / originalPrice) * 100)
}

/**
 * Get badge variant for course level
 * @param level - Course level
 * @returns Object with color classes for badge
 */
export function getCourseLevelBadge(level?: string): {
    label: string
    className: string
} {
    switch (level?.toLowerCase()) {
        case 'beginner':
            return {
                label: 'Cơ bản',
                className: 'bg-green-600 text-white hover:bg-green-700',
            }
        case 'intermediate':
            return {
                label: 'Trung cấp',
                className: 'bg-blue-600 text-white hover:bg-blue-700',
            }
        case 'advanced':
            return {
                label: 'Nâng cao',
                className: 'bg-purple-600 text-white hover:bg-purple-700',
            }
        default:
            return {
                label: 'Tất cả',
                className: 'bg-gray-600 text-white hover:bg-gray-700',
            }
    }
}

/**
 * Get star rating display
 * @param rating - Rating value (0-5)
 * @returns Array of 5 booleans indicating filled/unfilled stars
 */
export function getStarRating(rating: number): boolean[] {
    const stars: boolean[] = []
    const roundedRating = Math.round(rating * 2) / 2 // Round to nearest 0.5

    for (let i = 1; i <= 5; i++) {
        stars.push(i <= roundedRating)
    }

    return stars
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
}

/**
 * Format large numbers (1000 -> 1K, 1000000 -> 1M)
 * @param num - Number to format
 * @returns Formatted string
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.0', '') + 'M'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'K'
    }
    return num.toString()
}

/**
 * Get course price display
 * @param course - Course object
 * @returns Object with price info
 * 
 * Logic:
 * - If price = 0 → Free course
 * - If discountPrice exists and > 0 and < price → Use discountPrice (has discount)
 * - If discountPrice is null/undefined/0 or >= price → Use price (no discount)
 */
export function getCoursePrice(course: {
    price: number
    discountPrice?: number | null
    originalPrice?: number
}): {
    isFree: boolean
    currentPrice: number
    originalPrice: number
    hasDiscount: boolean
    discountPercentage: number
    displayPrice: string
} {
    // Use originalPrice if available, otherwise use price
    const originalPrice = course.originalPrice ?? course.price
    const discountPrice = course.discountPrice
    
    // Course is free if original price is 0
    const isFree = originalPrice === 0
    
    // Has discount if discountPrice exists, is > 0, and is less than original price
    const hasDiscount = 
        discountPrice != null && 
        discountPrice > 0 && 
        discountPrice < originalPrice
    
    // Current price: use discountPrice if has discount, otherwise use originalPrice
    const currentPrice = hasDiscount ? discountPrice : originalPrice

    return {
        isFree,
        currentPrice,
        originalPrice,
        hasDiscount,
        discountPercentage: hasDiscount
            ? calculateDiscount(originalPrice, discountPrice)
            : 0,
        displayPrice: isFree ? 'Miễn phí' : formatPrice(currentPrice),
    }
}
