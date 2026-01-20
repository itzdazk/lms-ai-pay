// frontend/src/hooks/useFavicon.ts
import { useEffect } from 'react'
import { getPublicSystemConfig } from '../lib/api/system-config'
import { getAbsoluteUrl } from '../lib/api/client'

/**
 * Function to update favicon (can be called from anywhere)
 */
export async function updateFavicon() {
    try {
        const config = await getPublicSystemConfig()
        const faviconUrl = config.seo?.favicon
        
        if (!faviconUrl || faviconUrl.trim() === '') {
            console.log('⚠️ No favicon URL in config, keeping default')
            return
        }
        
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll("link[rel*='icon']")
        existingLinks.forEach(link => link.remove())
        
        // Create new favicon link
        const link = document.createElement('link')
        link.rel = 'icon'
        
        // Detect file type from extension
        const urlLower = faviconUrl.toLowerCase()
        if (urlLower.endsWith('.svg')) {
            link.type = 'image/svg+xml'
        } else if (urlLower.endsWith('.png')) {
            link.type = 'image/png'
        } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
            link.type = 'image/jpeg'
        } else if (urlLower.endsWith('.ico')) {
            link.type = 'image/x-icon'
        } else {
            // Default to ico if extension unknown
            link.type = 'image/x-icon'
        }
        
        const absoluteUrl = getAbsoluteUrl(faviconUrl)
        link.href = absoluteUrl
        
        // Add error handler
        link.onerror = () => {
            console.error('❌ Failed to load favicon:', absoluteUrl)
        }
        
        document.head.appendChild(link)
        console.log('✅ Favicon updated:', absoluteUrl)
    } catch (error) {
        console.error('Failed to load favicon from config:', error)
        // Keep default favicon if API fails
    }
}

/**
 * Hook to set favicon from system config
 * Updates the favicon link in the document head
 * Also listens for custom event to refresh favicon when config is updated
 */
export function useFavicon() {
    useEffect(() => {
        // Initial load
        updateFavicon()
        
        // Listen for config update events
        const handleConfigUpdate = () => {
            console.log('🔄 Config updated, refreshing favicon...')
            updateFavicon()
        }
        
        window.addEventListener('system-config-updated', handleConfigUpdate)
        
        return () => {
            window.removeEventListener('system-config-updated', handleConfigUpdate)
        }
    }, [])
}
