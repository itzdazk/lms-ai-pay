// frontend/src/lib/api/system-config.ts
import apiClient from './client'

export interface SystemSettings {
    system: {
        name: string
        logo: string | null
        email: string
    }
    registration: {
        enabled: boolean
    }
    contact: {
        hotline: string
        hotlineDisplay: string
        email: string
        zalo: string
        facebook: string
        workingHours: string
    }
    legal: {
        termsOfService: string | null
        privacyPolicy: string | null
        refundPolicy: string | null
    }
    landing: {
        heroTitle: string
        heroDescription: string
        heroBackgroundImage: string
        categoriesTitle: string
        categoriesDescription: string
    }
    about: {
        heroTitle: string
        heroDescription: string
        heroBackgroundImage: string
        stats: {
            courses: string
            students: string
            instructors: string
            certificates: string
        }
        story: {
            title: string
            paragraph1: string
            paragraph2: string
        }
        values: Array<{
            title: string
            description: string
        }>
        team: Array<{
            name: string
            role: string
            avatar: string
            bio: string
        }>
        timeline: Array<{
            year: string
            title: string
            description: string
        }>
    }
    footer: {
        brandName: string
        description: string
        socialMedia: {
            facebook: string | null
            twitter: string | null
            instagram: string | null
            youtube: string | null
            linkedin: string | null
        }
        copyright: string
        quickLinks: Array<{
            label: string
            url: string
        }>
        footerCategories: Array<{
            label: string
            url: string
        }>
    }
    seo: {
        siteName: string
        defaultTitle: string
        defaultDescription: string
        defaultKeywords: string
        ogImage: string | null
        favicon: string
    }
    metadata?: {
        updatedBy?: number
        lastUpdated?: string
    }
}

export interface PublicSystemSettings {
    system: {
        name: string
        logo: string | null
    }
    contact: {
        hotline: string
        hotlineDisplay: string
        email: string
        zalo: string
        facebook: string
        workingHours: string
    }
    landing: {
        heroTitle: string
        heroDescription: string
        heroBackgroundImage: string
        categoriesTitle: string
        categoriesDescription: string
    }
    about: {
        heroTitle: string
        heroDescription: string
        heroBackgroundImage: string
        stats: {
            courses: string
            students: string
            instructors: string
            certificates: string
        }
        story: {
            title: string
            paragraph1: string
            paragraph2: string
        }
        values: Array<{
            title: string
            description: string
        }>
        team: Array<{
            name: string
            role: string
            avatar: string
            bio: string
        }>
        timeline: Array<{
            year: string
            title: string
            description: string
        }>
    }
    footer: {
        brandName: string
        description: string
        socialMedia: {
            facebook: string | null
            twitter: string | null
            instagram: string | null
            youtube: string | null
            linkedin: string | null
        }
        copyright: string
        quickLinks: Array<{
            label: string
            url: string
        }>
        footerCategories: Array<{
            label: string
            url: string
        }>
    }
    seo: {
        siteName: string
        defaultTitle: string
        defaultDescription: string
        defaultKeywords: string
        ogImage: string | null
        favicon: string
    }
}

export interface RegistrationStatus {
    enabled: boolean
}

/**
 * Get all system settings (Admin only)
 */
export async function getSystemConfig(): Promise<SystemSettings> {
    const response = await apiClient.get<{ data: SystemSettings }>(
        '/admin/system-config'
    )
    return response.data.data
}

/**
 * Update system settings (Admin only)
 */
export async function updateSystemConfig(
    settings: Partial<SystemSettings>
): Promise<SystemSettings> {
    const response = await apiClient.put<{ data: SystemSettings }>(
        '/admin/system-config',
        { settings }
    )
    return response.data.data
}

/**
 * Get public system settings (Contact info, system name, logo)
 * Public endpoint - no auth required
 */
export async function getPublicSystemConfig(): Promise<PublicSystemSettings> {
    const response = await apiClient.get<{ data: PublicSystemSettings }>(
        '/system-config/public'
    )
    return response.data.data
}

/**
 * Check if user registration is enabled
 * Public endpoint - no auth required
 */
export async function isRegistrationEnabled(): Promise<boolean> {
    const response = await apiClient.get<{ data: RegistrationStatus }>(
        '/system-config/registration-enabled'
    )
    return response.data.data.enabled
}
