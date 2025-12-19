import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { DarkOutlineButton } from '../../components/ui/buttons'
import {
    FolderTree,
    Loader2,
    Plus,
} from 'lucide-react'
import {
    adminCategoriesApi,
    type AdminCategoryFilters,
    type CreateCategoryRequest,
    type UpdateCategoryRequest,
} from '../../lib/api/admin-categories'
import { categoriesApi, type CategoryStats } from '../../lib/api/categories'
import { toast } from 'sonner'
import type { Category } from '../../lib/api/types'

// Import refactored components
import { CategoriesStats } from '../../components/admin/categories/CategoriesStats'
import { CategoriesFilters } from '../../components/admin/categories/CategoriesFilters'
import { CategoriesTable } from '../../components/admin/categories/CategoriesTable'
import { CategoriesPagination } from '../../components/admin/categories/CategoriesPagination'
import { CategoryDialogs } from '../../components/admin/categories/CategoryDialogs'

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

function validateCategoryPayload({
    name,
    slug,
}: {
    name: string
    slug: string
}) {
    const errors: string[] = []
    if (!name || !name.trim()) {
        errors.push('Tên danh mục không được để trống')
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

export function CategoriesPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [allCategories, setAllCategories] = useState<Category[]>([])
    const [stats, setStats] = useState<CategoryStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(true)
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters, setFilters] = useState<AdminCategoryFilters>({
        page: 1,
        limit: 10,
        search: '',
        categoryId: undefined,
        isActive: undefined,
        sort: 'createdAt',
        sortOrder: 'desc',
    })

    // Memoize filters to prevent unnecessary re-renders
    const memoizedFilters = useMemo(() => filters, [
        filters.page,
        filters.limit,
        filters.search,
        filters.categoryId,
        filters.isActive,
        filters.sort,
        filters.sortOrder,
    ])
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null
    )
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
    const [searchInput, setSearchInput] = useState<string>(filters.search || '')
    const [categorySearch, setCategorySearch] = useState<string>('')
    const [parentCategorySearch, setParentCategorySearch] = useState<string>('')
    const [formData, setFormData] = useState<CreateCategoryRequest>({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        parentId: null,
        sortOrder: 0,
        isActive: false,
    })
    const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false)
    const [newlyCreatedCategory, setNewlyCreatedCategory] = useState<Category | null>(null)
    const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageRemoved, setImageRemoved] = useState(false)
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

    // Load all categories for dropdown and stats
    useEffect(() => {
        if (currentUser) {
            loadAllCategories()
            loadStats()
        }
    }, [currentUser])


    // Load categories when filters change
    useEffect(() => {
        if (currentUser) {
            loadCategories()
        }
    }, [
        filters.page,
        filters.limit,
        filters.search,
        filters.categoryId,
        filters.isActive,
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

    const loadCategories = async () => {
        try {
            setLoading(true)
            const result = await adminCategoriesApi.getAllCategories(filters)
            setCategories(result.data)
            setPagination(result.pagination)
        } catch (error: any) {
            console.error('Error loading categories:', error)
            setCategories([])
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            setLoadingStats(true)
            const statsData = await categoriesApi.getCategoryStats()
            setStats(statsData)
        } catch (error: any) {
            console.error('Error loading category stats:', error)
        } finally {
            setLoadingStats(false)
        }
    }

    const loadAllCategories = async () => {
        try {
            // Load all categories for dropdown filter (using admin API to get all, including inactive)
            // Backend MAX_LIMIT is 100, so we use 100
            const result = await adminCategoriesApi.getAllCategories({ limit: 100 })
            const categories = result.data || []

            // Flatten categories including children from nested structure
            const allCategoriesFlat: Category[] = []
            const processedIds = new Set<number>()

            // First, add all categories from main array
            categories.forEach((category) => {
                if (!processedIds.has(category.id)) {
                    allCategoriesFlat.push(category)
                    processedIds.add(category.id)
                }
            })

            // Then, add children from nested children arrays
            categories.forEach((category) => {
                if (category.children && Array.isArray(category.children)) {
                    category.children.forEach((child: any) => {
                        // Backend only returns: id, name, slug, isActive for children
                        // Check if child already exists in main array
                        const existingChild = allCategoriesFlat.find((cat) => cat.id === child.id)

                        if (existingChild) {
                            // Child already exists in main array, ensure parentId is set correctly
                            if (!existingChild.parentId || existingChild.parentId !== category.id) {
                                existingChild.parentId = category.id
                            }
                        } else if (!processedIds.has(child.id)) {
                            // Child doesn't exist, create a minimal category object
                            // Use defaults for missing required fields
                            const childCategory: Category = {
                                id: child.id,
                                name: child.name,
                                slug: child.slug,
                                description: undefined,
                                imageUrl: undefined,
                                parentId: category.id,
                                sortOrder: 0, // Default sortOrder
                                isActive: child.isActive ?? true,
                                coursesCount: 0, // Will be calculated if needed
                                createdAt: new Date().toISOString(), // Default timestamp
                                updatedAt: new Date().toISOString(), // Default timestamp
                            }
                            allCategoriesFlat.push(childCategory)
                            processedIds.add(child.id)
                        }
                    })
                }
            })

            // Build hierarchical structure: parent categories first, then their children
            const parentCategories = allCategoriesFlat.filter((cat) => !cat.parentId)
            const childCategories = allCategoriesFlat.filter((cat) => cat.parentId)

            const hierarchicalCategories: Category[] = []
            parentCategories.forEach((parent) => {
                hierarchicalCategories.push(parent)
                // Add all children of this parent
                const children = childCategories.filter(
                    (child) => child.parentId === parent.id
                )
                // Sort children by sortOrder or name
                children.sort((a, b) => {
                    if (a.sortOrder !== b.sortOrder) {
                        return (a.sortOrder || 0) - (b.sortOrder || 0)
                    }
                    return a.name.localeCompare(b.name)
                })
                hierarchicalCategories.push(...children)
            })

            // Add any remaining categories that might not have been included (orphaned children)
            const includedIds = new Set(hierarchicalCategories.map((cat) => cat.id))
            const remaining = allCategoriesFlat.filter((cat) => !includedIds.has(cat.id))
            hierarchicalCategories.push(...remaining)

            setAllCategories(hierarchicalCategories)
        } catch (error: any) {
            console.error('Error loading categories:', error)
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
        key: keyof AdminCategoryFilters,
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
            [key]: value === 'all' ? undefined : value,
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
            imageUrl: '',
            parentId: null,
            sortOrder: 0,
            isActive: false,
        })
        setImageFile(null)
        setImageRemoved(false)
        setSelectedCategory(null)
        setIsCreateDialogOpen(true)
    }

    const handleEdit = (category: Category) => {
        setSelectedCategory(category)
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            imageUrl: category.imageUrl || '',
            parentId: category.parentId || null,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
        })
        setImageFile(null)
        setImageRemoved(false)
        setIsEditDialogOpen(true)
    }

    const handleDelete = (category: Category) => {
        setSelectedCategory(category)
        setIsDeleteDialogOpen(true)
    }

    const handleChangeStatus = (category: Category) => {
        setSelectedCategory(category)
        setIsChangeStatusDialogOpen(true)
    }

    const confirmCreate = async () => {
        try {
            setActionLoading(true)

            console.log('📦 FormData trước khi gửi:', formData)

            // Xử lý và validate data trước khi gửi
            const payload: CreateCategoryRequest = {
                name: formData.name?.trim(),
                slug: formData.slug?.trim() || generateSlug(formData.name),
                description: formData.description?.trim() || undefined,
                // Nếu người dùng chọn file, không gửi imageUrl để tránh validator URL
                imageUrl: imageFile
                    ? undefined
                    : formData.imageUrl?.trim() || undefined,
                parentId: formData.parentId || undefined,
                sortOrder: formData.sortOrder || 0,
                isActive: formData.isActive !== false,
            }

            const validationErrors = validateCategoryPayload({
                name: payload.name || '',
                slug: payload.slug || '',
            })
            if (validationErrors.length) {
                validationErrors.forEach((msg) => toast.error(msg))
                setActionLoading(false)
                return
            }

            // ===== FIX: Xóa các field undefined =====
            const cleanPayload: any = {}
            Object.keys(payload).forEach((key) => {
                const value = payload[key as keyof typeof payload]
                // Chỉ thêm field nếu không phải undefined
                if (value !== undefined) {
                    cleanPayload[key] = value
                }
            })

            console.log('📤 Payload sau khi xử lý:', cleanPayload)

            // ===== Gửi cleanPayload thay vì payload =====
            const createdCategory = await adminCategoriesApi.createCategory(
                cleanPayload
            )

            // Nếu có file, upload ngay sau khi tạo
            if (imageFile && createdCategory?.id) {
                await adminCategoriesApi.uploadCategoryImage(
                    createdCategory.id,
                    imageFile
                )
            }

            toast.success('Tạo danh mục thành công!')
            setIsCreateDialogOpen(false)
            setFormData({
                name: '',
                slug: '',
                description: '',
                imageUrl: '',
                parentId: null,
                sortOrder: 0,
                isActive: false,
            })
            setImageFile(null)
            setImageRemoved(false)
            loadCategories()
            loadAllCategories()
        } catch (error: any) {
            console.error('❌ Error creating category:', error)
            showApiError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const confirmUpdate = async () => {
        if (!selectedCategory) return

        try {
            setActionLoading(true)
            const computedSlug =
                formData.slug?.trim() || generateSlug(formData.name)

            const payload: UpdateCategoryRequest = {
                name: formData.name?.trim(),
                slug: computedSlug,
                description: formData.description?.trim() || undefined,
                // imageUrl will be handled separately via upload API after update
                sortOrder:
                    formData.sortOrder !== undefined && formData.sortOrder >= 0
                        ? Number(formData.sortOrder)
                        : 0,
                isActive: Boolean(formData.isActive),
            }

            const validationErrors = validateCategoryPayload({
                name: payload.name || '',
                slug: payload.slug || '',
            })
            if (validationErrors.length) {
                validationErrors.forEach((msg) => toast.error(msg))
                setActionLoading(false)
                return
            }

            if (formData.parentId === null) {
                payload.parentId = null
            } else if (formData.parentId && formData.parentId > 0) {
                payload.parentId = formData.parentId
            } else {
                payload.parentId = undefined
            }

            // Làm sạch payload để không gửi undefined
            const cleanPayload: any = {}
            Object.keys(payload).forEach((key) => {
                const value = payload[key as keyof typeof payload]
                if (value !== undefined) {
                    cleanPayload[key] = value
                }
            })

            const updatedCategory = await adminCategoriesApi.updateCategory(
                selectedCategory.id,
                cleanPayload
            )

            // Xóa ảnh nếu người dùng chọn xóa và không chọn ảnh mới
            if (imageRemoved && !imageFile && selectedCategory?.imageUrl) {
                try {
                    await adminCategoriesApi.deleteCategoryImage(
                        selectedCategory.id
                    )
                } catch (err) {
                    console.error('Error deleting category image:', err)
                }
            }

            // Upload file nếu có chọn mới
            if (imageFile && updatedCategory?.id) {
                await adminCategoriesApi.uploadCategoryImage(
                    updatedCategory.id,
                    imageFile
                )
            }

            toast.success('Cập nhật danh mục thành công!')
            setIsEditDialogOpen(false)
            setSelectedCategory(null)
            setImageFile(null)
            setImageRemoved(false)
            loadCategories()
            loadAllCategories()
        } catch (error: any) {
            console.error('Error updating category:', error)
            showApiError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const confirmDelete = async () => {
        if (!selectedCategory) return

        try {
            setActionLoading(true)
            await adminCategoriesApi.deleteCategory(selectedCategory.id)
            toast.success('Xóa danh mục thành công!')
            await loadCategories()
            loadAllCategories()
            setIsDeleteDialogOpen(false)
            setSelectedCategory(null)
        } catch (error: any) {
            console.error('Error deleting category:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const confirmChangeStatus = async () => {
        if (!selectedCategory) return

        try {
            setActionLoading(true)
            await adminCategoriesApi.updateCategory(
                selectedCategory.id,
                {
                    isActive: selectedCategory.isActive,
                }
            )
            toast.success(
                `Danh mục đã được ${selectedCategory.isActive ? 'kích hoạt' : 'tắt'} thành công!`
            )
            await loadCategories()
            loadAllCategories()
            loadStats()
            setIsChangeStatusDialogOpen(false)
            setIsStatusUpdateDialogOpen(false)
            setSelectedCategory(null)
            setNewlyCreatedCategory(null)
        } catch (error: any) {
            console.error('Error updating category status:', error)
            showApiError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const renderPagination = () => {
        return <CategoriesPagination
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
                        <FolderTree className='h-8 w-8' />
                        Quản lý Danh mục
                    </h1>
                    <p className='text-muted-foreground'>
                        Quản lý và theo dõi tất cả danh mục khóa học
                    </p>
                </div>

                {/* Stats */}
                <CategoriesStats loading={loadingStats} stats={stats} />

                {/* Filters */}
                <CategoriesFilters
                    filters={memoizedFilters}
                    allCategories={allCategories}
                    categorySearch={categorySearch}
                    onCategorySearchChange={setCategorySearch}
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
                        setCategorySearch('')
                        setFilters({
                            page: 1,
                            limit: 10,
                            search: '',
                            categoryId: undefined,
                            isActive: undefined,
                            sort: 'createdAt',
                            sortOrder: 'desc',
                        })
                    }}
                />

                {/* Categories Table */}
                <CategoriesTable
                    categories={categories}
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
                    onChangeStatus={handleChangeStatus}
                    onRowSelect={setSelectedRowId}
                    renderPagination={renderPagination}
                />

                {/* Dialogs */}
                <CategoryDialogs
                    isCreateDialogOpen={isCreateDialogOpen}
                    isEditDialogOpen={isEditDialogOpen}
                    isDeleteDialogOpen={isDeleteDialogOpen}
                    isStatusUpdateDialogOpen={isStatusUpdateDialogOpen}
                    isChangeStatusDialogOpen={isChangeStatusDialogOpen}
                    setIsCreateDialogOpen={setIsCreateDialogOpen}
                    setIsEditDialogOpen={setIsEditDialogOpen}
                    setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                    setIsStatusUpdateDialogOpen={setIsStatusUpdateDialogOpen}
                    setIsChangeStatusDialogOpen={setIsChangeStatusDialogOpen}
                    selectedCategory={selectedCategory}
                    newlyCreatedCategory={newlyCreatedCategory}
                    allCategories={allCategories}
                    formData={formData}
                    parentCategorySearch={parentCategorySearch}
                    imageFile={imageFile}
                    imageRemoved={imageRemoved}
                    actionLoading={actionLoading}
                    setSelectedCategory={setSelectedCategory}
                    setFormData={setFormData}
                    setParentCategorySearch={setParentCategorySearch}
                    setImageFile={setImageFile}
                    setImageRemoved={setImageRemoved}
                    setNewlyCreatedCategory={setNewlyCreatedCategory}
                    onConfirmCreate={confirmCreate}
                    onConfirmUpdate={confirmUpdate}
                    onConfirmDelete={confirmDelete}
                    onConfirmChangeStatus={confirmChangeStatus}
                    generateSlug={generateSlug}
                />
            </div>
        </div>
    )
}
