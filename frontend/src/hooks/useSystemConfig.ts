// frontend/src/hooks/useSystemConfig.ts
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
    getSystemConfig,
    updateSystemConfig,
    type SystemSettings,
} from '../lib/api/system-config'
import { toast } from 'sonner'

export function useSystemConfig() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [settings, setSettings] = useState<SystemSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<SystemSettings>>({})

    // Check if user is admin
    useEffect(() => {
        if (authLoading) return

        if (!currentUser) {
            navigate('/login')
            return
        }

        if (currentUser.role !== 'ADMIN') {
            navigate('/dashboard')
            return
        }
    }, [currentUser, authLoading, navigate])

    // Load settings
    useEffect(() => {
        if (currentUser) {
            loadSettings()
        }
    }, [currentUser])

    const loadSettings = async () => {
        try {
            setLoading(true)
            const data = await getSystemConfig()
            setSettings(data)
            setFormData(data || {})
        } catch (error: any) {
            console.error('Error loading settings:', error)
            toast.error('Không thể tải cài đặt hệ thống')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // Ensure we have all required fields by merging with current settings
            const dataToSend = {
                ...settings,
                ...formData,
                // Ensure nested objects are properly merged
                system: { ...settings?.system, ...formData?.system },
                registration: {
                    ...settings?.registration,
                    ...formData?.registration,
                },
                contact: { ...settings?.contact, ...formData?.contact },
                legal: { ...settings?.legal, ...formData?.legal },
                landing: { ...settings?.landing, ...formData?.landing },
                about: { ...settings?.about, ...formData?.about },
                footer: { ...settings?.footer, ...formData?.footer },
                seo: { ...settings?.seo, ...formData?.seo },
            }

            const updated = await updateSystemConfig(dataToSend)

            setSettings(updated)
            setFormData(updated)
            toast.success('Cập nhật cài đặt hệ thống thành công')
        } catch (error: any) {
            console.error('❌ Error saving settings:', error)
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Không thể cập nhật cài đặt hệ thống'
            toast.error(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    // Helper functions for updating nested fields
    const updateNestedField = (path: string[], value: any) => {
        setFormData((prev) => {
            const newData = { ...prev }
            let current: any = newData
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {}
                }
                current = current[path[i]]
            }
            current[path[path.length - 1]] = value
            return newData
        })
    }

    const updateArrayField = (path: string[], index: number, value: any) => {
        setFormData((prev) => {
            const newData = { ...prev }
            let current: any = newData
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {}
                }
                current = current[path[i]]
            }
            const array = [...(current[path[path.length - 1]] || [])]
            array[index] = { ...array[index], ...value }
            current[path[path.length - 1]] = array
            return newData
        })
    }

    const addArrayItem = (path: string[], defaultItem: any) => {
        setFormData((prev) => {
            const newData = { ...prev }
            let current: any = newData
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) {
                    current[path[i]] = {}
                }
                current = current[path[i]]
            }
            const array = [...(current[path[path.length - 1]] || [])]
            array.push(defaultItem)
            current[path[path.length - 1]] = array
            return newData
        })
    }

    const removeArrayItem = (path: string[], index: number) => {
        setFormData((prev) => {
            const newData = { ...prev }
            let current: any = newData
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]]
            }
            const array = [...(current[path[path.length - 1]] || [])]
            array.splice(index, 1)
            current[path[path.length - 1]] = array
            return newData
        })
    }

    return {
        settings,
        formData,
        loading,
        saving,
        handleSave,
        updateNestedField,
        updateArrayField,
        addArrayItem,
        removeArrayItem,
    }
}
