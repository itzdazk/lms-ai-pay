import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    Loader2,
    Tag as TagIcon,
} from 'lucide-react'
import {
    adminTagsApi,
    type AdminTagFilters,
    type TagFormState,
} from '../../lib/api/admin-tags'
import { toast } from 'sonner'
import type { Tag } from '../../lib/api/types'

// Import refactored components
import { TagsFilters } from '../../components/admin/tags/TagsFilters'
import { TagsTable } from '../../components/admin/tags/TagsTable'
import { TagsPagination } from '../../components/admin/tags/TagsPagination'
import { TagDialogs } from '../../components/admin/tags/TagDialogs'

const generateSlug = (text: string): string => {
    if (!text) return ''

    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, space, gạch ngang
        .trim()
        .replace(/\s+/g, '-') // Thay space bằng gạch ngang
        .replace(/-+/g, '-') // Xóa gạch ngang thừa
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validateTagPayload({
    name,
    slug,
}: {
    name: string
    slug: string
}) {
    const errors: string[] = []
    if (!name || !name.trim()) {
        errors.push('Tên tag không được để trống')
    }
    if (!slug || !slug.trim()) {
        errors.push('Slug không được để trống')
    } else if (slug.length < 2 || slug.length > 100) {
        errors.push('Slug phải từ 2 đến 100 ký tự')
    } else if (!slugRegex.test(slug)) {
        errors.push(
            'Slug chỉ được chứa chữ thường, số, và dấu gạch ngang (a-z, 0-9, -)'
        )
    }
    return errors
}

function showApiError(error: any) {
    const apiErrors =
        error?.response?.data?.errors ||
        error?.response?.data?.message ||
        error?.message

    if (Array.isArray(apiErrors)) {
        apiErrors.forEach((e) => {
            if (e?.msg) {
                toast.error(e.msg)
            } else if (typeof e === 'string') {
                toast.error(e)
            }
        })
    } else if (typeof apiErrors === 'string') {
        toast.error(apiErrors)
    } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại')
    }
}

export function TagsPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [tags, setTags] = useState<Tag[]>([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters, setFilters] = useState<AdminTagFilters>({
        page: 1,
        limit: 10,
        search: '',
        sort: 'createdAt',
        sortOrder: 'desc',
    })

    // Memoize filters to prevent unnecessary re-renders
    const memoizedFilters = useMemo(() => filters, [
        filters.page,
        filters.limit,
        filters.search,
        filters.sort,
        filters.sortOrder,
    ])
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
    const [searchInput, setSearchInput] = useState<string>(filters.search || '')
    const [formData, setFormData] = useState<TagFormState>({
        name: '',
        slug: '',
        description: '',
    })
    const scrollPositionRef = useRef<number>(0)
    const isPageChangingRef = useRef<boolean>(false)

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

    // Load tags when filters change
    useEffect(() => {
        if (currentUser) {
            loadTags()
        }
    }, [
        filters.page,
        filters.limit,
        filters.search,
        filters.sort,
        filters.sortOrder,
        currentUser,
    ])

    // Restore scroll position
    useEffect(() => {
        if (isPageChangingRef.current && scrollPositionRef.current > 0) {
            const restoreScroll = () => {
                const scrollContainer = document.querySelector('main') || window
                if (scrollContainer === window) {
                    window.scrollTo({
                        top: scrollPositionRef.current,
                        behavior: 'auto',
                    })
                } else {
                    ;(scrollContainer as HTMLElement).scrollTop =
                        scrollPositionRef.current
                }
            }

            restoreScroll()
            setTimeout(restoreScroll, 0)
            requestAnimationFrame(() => {
                restoreScroll()
                isPageChangingRef.current = false
            })
        }
    }, [pagination.page])

    const loadTags = async () => {
        try {
            setLoading(true)
            const result = await adminTagsApi.getAllTags(filters)
            setTags(result.data)
            setPagination(result.pagination)
        } catch (error: any) {
            console.error('Error loading tags:', error)
            setTags([])
        } finally {
            setLoading(false)
        }
    }

    // Handle search input change (no auto-search)
    const handleSearchInputChange = (value: string) => {
        setSearchInput(value)
    }

    // Handle clear search (reset both input and filters)
    const handleClearSearch = () => {
        setSearchInput('')
        setFilters(prev => ({
            ...prev,
            search: '',
            page: 1,
        }))
    }

    // Handle search execution (manual search)
    const handleSearch = () => {
        setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }))
    }

    // Handle search on Enter key
    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleFilterChange = useCallback((
        key: keyof AdminTagFilters,
        value: any
    ) => {
        const mainContainer = document.querySelector('main')
        if (mainContainer) {
            scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
        } else {
            scrollPositionRef.current =
                window.scrollY || document.documentElement.scrollTop
        }
        isPageChangingRef.current = true
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1,
        }))
    }, [])

    const handlePageChange = useCallback((newPage: number) => {
        // Use requestAnimationFrame to avoid blocking input
        requestAnimationFrame(() => {
            const mainContainer = document.querySelector('main')
            if (mainContainer) {
                scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
            } else {
                scrollPositionRef.current =
                    window.scrollY || document.documentElement.scrollTop
            }
            isPageChangingRef.current = true
        })

        setFilters(prev => ({ ...prev, page: newPage }))
    }, [])

    const handleCreate = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
        })
        setSelectedTag(null)
        setIsCreateDialogOpen(true)
    }

    const handleEdit = (tag: Tag) => {
        setSelectedTag(tag)
        setFormData({
            name: tag.name,
            slug: tag.slug,
            description: tag.description || '',
        })
        setIsEditDialogOpen(true)
    }

    const handleDelete = (tag: Tag) => {
        setSelectedTag(tag)
        setIsDeleteDialogOpen(true)
    }

    const confirmCreate = async () => {
        try {
            setActionLoading(true)

            const payload: TagFormState = {
                name: formData.name?.trim(),
                slug: formData.slug?.trim() || generateSlug(formData.name || ''),
                description: formData.description?.trim() || undefined,
            }

            const validationErrors = validateTagPayload({
                name: payload.name || '',
                slug: payload.slug || '',
            })
            if (validationErrors.length) {
                validationErrors.forEach((msg) => toast.error(msg))
                setActionLoading(false)
                return
            }

            // Clean payload to remove undefined values
            const cleanPayload: any = {}
            Object.keys(payload).forEach((key) => {
                const value = payload[key as keyof typeof payload]
                if (value !== undefined) {
                    cleanPayload[key] = value
                }
            })

            await adminTagsApi.createTag(cleanPayload)

            toast.success('Tạo tag thành công!')
            setIsCreateDialogOpen(false)
            setFormData({
                name: '',
                slug: '',
                description: '',
            })
            loadTags()
        } catch (error: any) {
            console.error('❌ Error creating tag:', error)
            showApiError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const confirmUpdate = async () => {
        if (!selectedTag) return

        try {
            setActionLoading(true)
            const computedSlug =
                formData.slug?.trim() || generateSlug(formData.name || '')

            const payload: TagFormState = {
                name: formData.name?.trim(),
                slug: computedSlug,
                description: formData.description?.trim() || undefined,
            }

            const validationErrors = validateTagPayload({
                name: payload.name || '',
                slug: payload.slug || '',
            })
            if (validationErrors.length) {
                validationErrors.forEach((msg) => toast.error(msg))
                setActionLoading(false)
                return
            }

            // Clean payload to remove undefined values
            const cleanPayload: any = {}
            Object.keys(payload).forEach((key) => {
                const value = payload[key as keyof typeof payload]
                if (value !== undefined) {
                    cleanPayload[key] = value
                }
            })

            await adminTagsApi.updateTag(
                selectedTag.id,
                cleanPayload
            )

            toast.success('Cập nhật tag thành công!')
            setIsEditDialogOpen(false)
            setSelectedTag(null)
            loadTags()
        } catch (error: any) {
            console.error('Error updating tag:', error)
            showApiError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!selectedTag) return

        try {
            setActionLoading(true)
            await adminTagsApi.deleteTag(selectedTag.id)
            toast.success('Xóa tag thành công!')
            await loadTags()
            setIsDeleteDialogOpen(false)
            setSelectedTag(null)
        } catch (error: any) {
            console.error('Error deleting tag:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const renderPagination = () => {
        return <TagsPagination
            pagination={pagination}
            loading={loading}
            onPageChange={handlePageChange}
        />
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className='container mx-auto px-4 py-4 bg-background text-foreground min-h-screen flex items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
        )
    }

    // Redirect if not admin (handled by useEffect, but show nothing while redirecting)
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return null
    }

    return (
        <div className='w-full px-4 py-4 bg-background text-foreground min-h-screen'>
            <div className='w-full'>
                <div className='mb-6'>
                    <h1 className='text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3'>
                        <TagIcon className='h-8 w-8' />
                        Quản lý Tags
                    </h1>
                    <p className='text-muted-foreground'>
                        Quản lý và theo dõi tất cả tags của khóa học
                    </p>
                </div>

                {/* Filters */}
                <TagsFilters
                    filters={memoizedFilters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={() => {
                        setSearchInput('')
                        const mainContainer = document.querySelector('main')
                        if (mainContainer) {
                            scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
                        } else {
                            scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
                        }
                        isPageChangingRef.current = true
                        setFilters({
                            page: 1,
                            limit: 10,
                            search: '',
                            sort: 'createdAt',
                            sortOrder: 'desc',
                        })
                    }}
                />

                {/* Tags Table */}
                <TagsTable
                    tags={tags}
                    loading={loading}
                    pagination={pagination}
                    searchInput={searchInput}
                    selectedRowId={selectedRowId}
                    onSearchChange={handleSearchInputChange}
                    onSearchExecute={handleSearch}
                    onSearchKeyPress={handleSearchKeyPress}
                    onClearSearch={handleClearSearch}
                    onCreate={handleCreate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onRowSelect={setSelectedRowId}
                    renderPagination={renderPagination}
                />

                {/* Dialogs */}
                <TagDialogs
                    isCreateDialogOpen={isCreateDialogOpen}
                    isEditDialogOpen={isEditDialogOpen}
                    isDeleteDialogOpen={isDeleteDialogOpen}
                    setIsCreateDialogOpen={setIsCreateDialogOpen}
                    setIsEditDialogOpen={setIsEditDialogOpen}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                    selectedTag={selectedTag}
                    formData={formData}
                    actionLoading={actionLoading}
                    setSelectedTag={setSelectedTag}
                    setFormData={setFormData}
                    onConfirmCreate={confirmCreate}
                    onConfirmUpdate={confirmUpdate}
                    onConfirmDelete={confirmDelete}
                    generateSlug={generateSlug}
                />
            </div>
        </div>
    )
}
