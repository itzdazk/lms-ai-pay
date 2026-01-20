// frontend/src/hooks/usePageTitle.ts
import { useEffect } from 'react'
import { getPublicSystemConfig } from '../lib/api/system-config'

/**
 * Hook to set page title from system config
 * Falls back to default title if config is not available
 */
export function usePageTitle() {
    useEffect(() => {
        const setTitle = async () => {
            try {
                const config = await getPublicSystemConfig()
                // Backend ensures defaultTitle always exists, pageTitle may be null
                const title = config.seo?.pageTitle ?? config.seo?.defaultTitle
                if (title) {
                    document.title = title
                }
            } catch (error) {
                console.error('Failed to load page title from config:', error)
                // Fallback to default title only on API error
                document.title = 'LMS AI Pay - Hệ thống quản lý học tập trực tuyến'
            }
        }
        setTitle()
    }, [])
}
