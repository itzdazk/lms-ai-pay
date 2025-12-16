import { useState, useEffect, useRef } from 'react'
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
import { DarkOutlineInput } from '../../components/ui/dark-outline-input'
import { Label } from '../../components/ui/label'
import { Select, SelectValue } from '../../components/ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../../components/ui/dark-outline-select-trigger'
import {
    DarkOutlineTable,
    DarkOutlineTableHeader,
    DarkOutlineTableBody,
    DarkOutlineTableRow,
    DarkOutlineTableHead,
    DarkOutlineTableCell,
} from '../../components/ui/dark-outline-table'
import {
    FolderTree,
    MoreVertical,
    Loader2,
    Search,
    X,
    Edit,
    Trash2,
    Plus,
} from 'lucide-react'
import {
    adminCategoriesApi,
    type AdminCategoryFilters,
    type CreateCategoryRequest,
    type UpdateCategoryRequest,
} from '../../lib/api/admin-categories'
import { categoriesApi } from '../../lib/api/categories'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import { toast } from 'sonner'
import { formatDate } from '../../lib/utils'
import type { Category } from '../../lib/api/types'
import { Badge } from '../../components/ui/badge'

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

// Component for each category row with dropdown menu
function CategoryRow({
    category,
    onEdit,
    onDelete,
    isSelected,
    onSelect,
}: {
    category: Category
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
    isSelected: boolean
    onSelect: (categoryId: number | null) => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [adjustedPosition, setAdjustedPosition] = useState({
        x: 0,
        y: 0,
        transform: 'translate(-100%, 0)',
    })
    const menuRef = useRef<HTMLDivElement>(null)

    const handleToggle = (
        isCurrentlySelected: boolean,
        e: React.MouseEvent<HTMLTableRowElement>
    ) => {
        e.preventDefault()
        if (isCurrentlySelected) {
            onSelect(null)
        } else {
            onSelect(category.id)
            setMenuPosition({ x: e.clientX, y: e.clientY })
            setMenuOpen(true)
        }
    }

    // Adjust menu position to stay within viewport
    useEffect(() => {
        if (!menuOpen || !menuRef.current) return

        const menu = menuRef.current
        const menuRect = menu.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let left = menuPosition.x
        let top = menuPosition.y
        let transform = 'translate(-100%, 0)'

        if (left - menuRect.width < 0) {
            transform = 'translate(0, 0)'
            left = menuPosition.x
        }

        if (left + menuRect.width > viewportWidth) {
            transform = 'translate(-100%, 0)'
            left = menuPosition.x
            if (left - menuRect.width < 0) {
                left = viewportWidth - menuRect.width - 8
            }
        }

        if (top + menuRect.height > viewportHeight) {
            top = menuPosition.y - menuRect.height
            if (top < 0) {
                top = viewportHeight - menuRect.height - 8
            }
        }

        if (top < 0) {
            top = 8
        }

        setAdjustedPosition({ x: left, y: top, transform })
    }, [menuOpen, menuPosition])

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen) return

        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    return (
        <>
            <DarkOutlineTableRow
                className='cursor-pointer'
                selected={isSelected}
                onRowToggle={handleToggle}
            >
                <DarkOutlineTableCell className='min-w-[200px] max-w-[400px]'>
                    <div className='flex items-center gap-3 min-w-0'>
                        {category.imageUrl ? (
                            <img
                                src={category.imageUrl}
                                alt={category.name}
                                className='w-12 h-12 object-cover rounded flex-shrink-0'
                            />
                        ) : (
                            <div className='w-12 h-12 bg-gray-200 dark:bg-[#2D2D2D] rounded flex items-center justify-center flex-shrink-0'>
                                <FolderTree className='h-6 w-6 text-gray-500 dark:text-gray-400' />
                            </div>
                        )}
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-start gap-2 min-w-0'>
                                <p className='font-medium text-gray-900 dark:text-white break-words whitespace-normal'>
                                    {category.name}
                                </p>
                            </div>
                            {category.description && (
                                <p className='text-sm text-gray-500 dark:text-gray-400 break-words whitespace-normal line-clamp-1'>
                                    {category.description}
                                </p>
                            )}
                            {category.parent && (
                                <div className='flex items-center gap-1.5 mt-2'>
                                    <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>
                                        Danh mục cha:
                                    </span>
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'>
                                        {category.parent.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[120px]'>
                    <span
                        className='text-gray-900 dark:text-gray-300 truncate block'
                        title={category.slug}
                    >
                        {category.slug}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    {category.isActive ? (
                        <Badge className='bg-green-600'>Hoạt động</Badge>
                    ) : (
                        <Badge
                            variant='outline'
                            className='border-gray-300 dark:border-[#2D2D2D] text-gray-700 dark:text-gray-300'
                        >
                            Không hoạt động
                        </Badge>
                    )}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {category.coursesCount || 0}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {category.sortOrder}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {formatDate(category.createdAt)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {formatDate(category.updatedAt)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='text-right w-[100px]'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
                        onClick={(e) => {
                            e.stopPropagation()
                            if (!isSelected) {
                                onSelect(category.id)
                            }
                            setMenuPosition({ x: e.clientX, y: e.clientY })
                            setMenuOpen(true)
                        }}
                    >
                        <MoreVertical className='h-4 w-4' />
                    </Button>
                </DarkOutlineTableCell>
            </DarkOutlineTableRow>

            {menuOpen && (
                <div
                    ref={menuRef}
                    className='fixed z-50 min-w-[8rem] rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md'
                    style={{
                        left: `${adjustedPosition.x}px`,
                        top: `${adjustedPosition.y}px`,
                        transform: adjustedPosition.transform,
                    }}
                >
                    <div
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                        onClick={() => {
                            onEdit(category)
                            setMenuOpen(false)
                        }}
                    >
                        <Edit className='h-4 w-4' />
                        Chỉnh sửa
                    </div>
                    <div
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                        onClick={() => {
                            onDelete(category)
                            setMenuOpen(false)
                        }}
                    >
                        <Trash2 className='h-4 w-4' />
                        Xóa
                    </div>
                </div>
            )}
        </>
    )
}

export function CategoriesPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [categories, setCategories] = useState<Category[]>([])
    const [allCategories, setAllCategories] = useState<Category[]>([])
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
    const [formData, setFormData] = useState<CreateCategoryRequest>({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        parentId: null,
        sortOrder: 0,
        isActive: true,
    })
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

    // Load all categories for dropdown
    useEffect(() => {
        if (currentUser) {
            loadAllCategories()
        }
    }, [currentUser])

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            const mainContainer = document.querySelector('main')
            if (mainContainer) {
                scrollPositionRef.current = (
                    mainContainer as HTMLElement
                ).scrollTop
            } else {
                scrollPositionRef.current =
                    window.scrollY || document.documentElement.scrollTop
            }
            isPageChangingRef.current = true
            setFilters((prevFilters) => ({
                ...prevFilters,
                search: searchInput,
                page: 1,
            }))
        }, 500)

        return () => clearTimeout(timer)
    }, [searchInput])

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

    const loadAllCategories = async () => {
        try {
            // Load all categories for dropdown filter (without parentId filter to get all)
            // Backend MAX_LIMIT is 100, so we use 100
            const result = await categoriesApi.getCategories({ limit: 100 })
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

    const handleSearch = (value: string) => {
        setSearchInput(value)
    }

    const handleFilterChange = (
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
        setFilters({
            ...filters,
            [key]: value === 'all' ? undefined : value,
            page: 1,
        })
    }

    const handlePageChange = (newPage: number) => {
        const mainContainer = document.querySelector('main')
        if (mainContainer) {
            scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
        } else {
            scrollPositionRef.current =
                window.scrollY || document.documentElement.scrollTop
        }
        isPageChangingRef.current = true
        setFilters({ ...filters, page: newPage })
    }

    const handleCreate = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            imageUrl: '',
            parentId: null,
            sortOrder: 0,
            isActive: true,
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
                isActive: true,
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
                imageUrl: imageFile
                    ? undefined
                    : formData.imageUrl?.trim() || undefined,
                sortOrder:
                    formData.sortOrder !== undefined && formData.sortOrder >= 0
                        ? formData.sortOrder
                        : 0,
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

    const renderPagination = () => {
        const pages: (number | string)[] = []
        const totalPages = pagination.totalPages
        const currentPage = pagination.page

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            if (currentPage > 3) {
                pages.push('...')
            }
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            ) {
                pages.push(i)
            }
            if (currentPage < totalPages - 2) {
                pages.push('...')
            }
            pages.push(totalPages)
        }

        return (
            <div className='flex items-center gap-2 flex-wrap'>
                <DarkOutlineButton
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    size='sm'
                >
                    &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    size='sm'
                >
                    &lt;
                </DarkOutlineButton>
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-gray-500'
                            >
                                ...
                            </span>
                        )
                    }
                    const pageNum = page as number
                    return (
                        <DarkOutlineButton
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            size='sm'
                            className={
                                currentPage === pageNum
                                    ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                    : ''
                            }
                        >
                            {pageNum}
                        </DarkOutlineButton>
                    )
                })}
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    size='sm'
                >
                    &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    size='sm'
                >
                    &gt;&gt;
                </DarkOutlineButton>
            </div>
        )
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

                {/* Filters */}
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] mb-6'>
                    <CardHeader>
                        <CardTitle className='text-white'>Bộ lọc</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                            <div className='space-y-2'>
                                <Label className='text-gray-400 text-sm'>
                                    Danh mục
                                </Label>
                                <Select
                                    value={
                                        filters.categoryId
                                            ? String(filters.categoryId)
                                            : 'all'
                                    }
                                    onValueChange={(value) => {
                                        handleFilterChange(
                                            'categoryId',
                                            value === 'all'
                                                ? undefined
                                                : parseInt(value)
                                        )
                                        setCategorySearch('') // Reset search when selecting
                                    }}
                                >
                                    <DarkOutlineSelectTrigger>
                                        <SelectValue placeholder='Tất cả danh mục' />
                                    </DarkOutlineSelectTrigger>
                                    <DarkOutlineSelectContent>
                                        <div className='p-2 border-b border-[#2D2D2D]'>
                                            <DarkOutlineInput
                                                placeholder='Tìm kiếm danh mục...'
                                                value={categorySearch}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    setCategorySearch(e.target.value)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                                className='w-full'
                                            />
                                        </div>
                                        <div className='max-h-[200px] overflow-y-auto'>
                                            <DarkOutlineSelectItem
                                                value='all'
                                                onSelect={() => setCategorySearch('')}
                                            >
                                                Tất cả danh mục
                                            </DarkOutlineSelectItem>
                                            {(() => {
                                                const searchLower = categorySearch.toLowerCase()
                                                
                                                // Separate parent and child categories
                                                const parentCategories = allCategories.filter((cat) => !cat.parentId)
                                                const childCategories = allCategories.filter((cat) => cat.parentId)
                                                
                                                // Build display list maintaining hierarchical order
                                                const displayList: Category[] = []
                                                
                                                // Process parent categories first
                                                parentCategories.forEach((parent) => {
                                                    const parentMatches = !categorySearch || 
                                                        parent.name.toLowerCase().includes(searchLower)
                                                    
                                                    // Get all children of this parent
                                                    const children = childCategories.filter(
                                                        (child) => child.parentId === parent.id
                                                    )
                                                    
                                                    // Check if any child matches search
                                                    const hasMatchingChild = !categorySearch || 
                                                        children.some((child) => 
                                                            child.name.toLowerCase().includes(searchLower)
                                                        )
                                                    
                                                    // Include parent if it matches or has matching children or no search
                                                    if (parentMatches || hasMatchingChild || !categorySearch) {
                                                        displayList.push(parent)
                                                        
                                                        // Add all children of this parent
                                                        children.forEach((child) => {
                                                            const childMatches = !categorySearch ||
                                                                child.name.toLowerCase().includes(searchLower) ||
                                                                parentMatches
                                                            
                                                            if (childMatches) {
                                                                displayList.push(child)
                                                            }
                                                        })
                                                    }
                                                })
                                                
                                                return displayList.map((category) => {
                                                    const isChild = !!category.parentId
                                                    const parentCategory = allCategories.find(
                                                        (cat) => cat.id === category.parentId
                                                    )
                                                    // If searching and child's parent doesn't match, show parent name
                                                    const shouldShowParent =
                                                        categorySearch &&
                                                        isChild &&
                                                        parentCategory &&
                                                        !parentCategory.name
                                                            .toLowerCase()
                                                            .includes(searchLower)

                                                    return (
                                                        <DarkOutlineSelectItem
                                                            key={category.id}
                                                            value={String(category.id)}
                                                            onSelect={() =>
                                                                setCategorySearch('')
                                                            }
                                                        >
                                                            <div
                                                                className={`flex items-center ${
                                                                    isChild ? 'pl-4' : ''
                                                                }`}
                                                            >
                                                                {isChild && (
                                                                    <span className='text-gray-500 mr-1'>
                                                                        └
                                                                    </span>
                                                                )}
                                                                <span>
                                                                    {shouldShowParent
                                                                        ? `${parentCategory.name} > ${category.name}`
                                                                        : category.name}
                                                                </span>
                                                            </div>
                                                        </DarkOutlineSelectItem>
                                                    )
                                                })
                                            })()}
                                            {allCategories.length === 0 && (
                                                <div className='px-2 py-1.5 text-sm text-gray-400 text-center'>
                                                    Không có danh mục
                                                </div>
                                            )}
                                        </div>
                                    </DarkOutlineSelectContent>
                                </Select>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-gray-400 text-sm'>
                                    Trạng thái
                                </Label>
                                <Select
                                    value={
                                        filters.isActive === undefined
                                            ? 'all'
                                            : filters.isActive
                                            ? 'true'
                                            : 'false'
                                    }
                                    onValueChange={(value) => {
                                        handleFilterChange(
                                            'isActive',
                                            value === 'all'
                                                ? undefined
                                                : value === 'true'
                                        )
                                    }}
                                >
                                    <DarkOutlineSelectTrigger>
                                        <SelectValue placeholder='Tất cả' />
                                    </DarkOutlineSelectTrigger>
                                    <DarkOutlineSelectContent>
                                        <DarkOutlineSelectItem value='all'>
                                            Tất cả
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='true'>
                                            Hoạt động
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='false'>
                                            Không hoạt động
                                        </DarkOutlineSelectItem>
                                    </DarkOutlineSelectContent>
                                </Select>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-gray-400 text-sm'>
                                    Sắp xếp
                                </Label>
                                <Select
                                    value={
                                        filters.sort === 'createdAt' && filters.sortOrder === 'desc'
                                            ? 'newest'
                                            : filters.sort === 'createdAt' && filters.sortOrder === 'asc'
                                              ? 'oldest'
                                              : filters.sort === 'updatedAt' && filters.sortOrder === 'desc'
                                                ? 'updated'
                                                : filters.sort === 'updatedAt' && filters.sortOrder === 'asc'
                                                  ? 'updated-oldest'
                                                  : filters.sort === 'sortOrder' && filters.sortOrder === 'asc'
                                                    ? 'sortOrder-asc'
                                                    : filters.sort === 'sortOrder' && filters.sortOrder === 'desc'
                                                      ? 'sortOrder-desc'
                                                      : 'newest'
                                    }
                                    onValueChange={(value) => {
                                        const mainContainer = document.querySelector('main')
                                        if (mainContainer) {
                                            scrollPositionRef.current = (
                                                mainContainer as HTMLElement
                                            ).scrollTop
                                        } else {
                                            scrollPositionRef.current =
                                                window.scrollY ||
                                                document.documentElement.scrollTop
                                        }
                                        isPageChangingRef.current = true

                                        let newSort: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder' = 'sortOrder'
                                        let newSortOrder: 'asc' | 'desc' = 'asc'

                                        if (value === 'newest') {
                                            newSort = 'createdAt'
                                            newSortOrder = 'desc'
                                        } else if (value === 'oldest') {
                                            newSort = 'createdAt'
                                            newSortOrder = 'asc'
                                        } else if (value === 'updated') {
                                            newSort = 'updatedAt'
                                            newSortOrder = 'desc'
                                        } else if (value === 'updated-oldest') {
                                            newSort = 'updatedAt'
                                            newSortOrder = 'asc'
                                        } else if (value === 'sortOrder-asc') {
                                            newSort = 'sortOrder'
                                            newSortOrder = 'asc'
                                        } else if (value === 'sortOrder-desc') {
                                            newSort = 'sortOrder'
                                            newSortOrder = 'desc'
                                        }

                                        setFilters({
                                            ...filters,
                                            sort: newSort,
                                            sortOrder: newSortOrder,
                                            page: 1,
                                        })
                                    }}
                                >
                                    <DarkOutlineSelectTrigger>
                                        <SelectValue placeholder='Sắp xếp' />
                                    </DarkOutlineSelectTrigger>
                                    <DarkOutlineSelectContent>
                                        <DarkOutlineSelectItem value='newest'>
                                            Mới nhất
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='oldest'>
                                            Cũ nhất
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='updated'>
                                            Cập nhật: Mới nhất
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='updated-oldest'>
                                            Cập nhật: Cũ nhất
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='sortOrder-asc'>
                                            Thứ tự: Tăng dần
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='sortOrder-desc'>
                                            Thứ tự: Giảm dần
                                        </DarkOutlineSelectItem>
                                    </DarkOutlineSelectContent>
                                </Select>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-gray-400 text-sm'>
                                    Số lượng / trang
                                </Label>
                                <Select
                                    value={filters.limit?.toString() || '10'}
                                    onValueChange={(value) => {
                                        handleFilterChange(
                                            'limit',
                                            parseInt(value)
                                        )
                                    }}
                                >
                                    <DarkOutlineSelectTrigger>
                                        <SelectValue placeholder='10 / trang' />
                                    </DarkOutlineSelectTrigger>
                                    <DarkOutlineSelectContent>
                                        <DarkOutlineSelectItem value='5'>
                                            5 / trang
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='10'>
                                            10 / trang
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='20'>
                                            20 / trang
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='50'>
                                            50 / trang
                                        </DarkOutlineSelectItem>
                                    </DarkOutlineSelectContent>
                                </Select>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-gray-400 text-sm opacity-0'>
                                    Xóa bộ lọc
                                </Label>
                                <Button
                                    onClick={() => {
                                        setSearchInput('')
                                        const mainContainer =
                                            document.querySelector('main')
                                        if (mainContainer) {
                                            scrollPositionRef.current = (
                                                mainContainer as HTMLElement
                                            ).scrollTop
                                        } else {
                                            scrollPositionRef.current =
                                                window.scrollY ||
                                                document.documentElement.scrollTop
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
                                    variant='blue'
                                    className='w-full'
                                >
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Table */}
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <div>
                                <CardTitle className='text-white'>
                                    Danh sách danh mục ({pagination.total})
                                </CardTitle>
                                <CardDescription className='text-gray-400'>
                                    Trang {pagination.page} / {pagination.totalPages}
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleCreate}
                                className='bg-blue-600 hover:bg-blue-700 text-white'
                            >
                                <Plus className='h-4 w-4 mr-2' />
                                Tạo danh mục
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='overflow-x-auto'>
                        {/* Search Bar */}
                        <div className='relative mb-4'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <DarkOutlineInput
                                type='text'
                                placeholder='Tìm kiếm theo tên danh mục...'
                                value={searchInput}
                                onChange={(e) => handleSearch(e.target.value)}
                                className='pl-10 pr-10'
                            />
                            {searchInput && (
                                <button
                                    type='button'
                                    onClick={() => handleSearch('')}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10'
                                >
                                    <X className='h-4 w-4' />
                                </button>
                            )}
                        </div>
                        {loading ? (
                            <div className='flex items-center justify-center py-12'>
                                <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
                                <span className='ml-2 text-gray-400'>
                                    Đang tải...
                                </span>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className='text-center py-12'>
                                <FolderTree className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                                <p className='text-gray-400'>
                                    Không tìm thấy danh mục nào
                                </p>
                            </div>
                        ) : (
                            <>
                                <DarkOutlineTable>
                                    <DarkOutlineTableHeader>
                                        <DarkOutlineTableRow>
                                            <DarkOutlineTableHead>
                                                Danh mục
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Slug
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Trạng thái
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Số khóa học
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Thứ tự
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Ngày tạo
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Cập nhật
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead className='text-right'>
                                                Thao tác
                                            </DarkOutlineTableHead>
                                        </DarkOutlineTableRow>
                                    </DarkOutlineTableHeader>
                                    <DarkOutlineTableBody>
                                        {categories.map((category) => (
                                            <CategoryRow
                                                key={category.id}
                                                category={category}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                isSelected={
                                                    selectedRowId ===
                                                    category.id
                                                }
                                                onSelect={setSelectedRowId}
                                            />
                                        ))}
                                    </DarkOutlineTableBody>
                                </DarkOutlineTable>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className='flex justify-center mt-6'>
                                        {renderPagination()}
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog
                    open={isCreateDialogOpen || isEditDialogOpen}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsCreateDialogOpen(false)
                            setIsEditDialogOpen(false)
                            setSelectedCategory(null)
                        }
                    }}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh] overflow-y-auto'>
                        <DialogHeader>
                            <DialogTitle>
                                {isCreateDialogOpen
                                    ? 'Tạo danh mục mới'
                                    : 'Chỉnh sửa danh mục'}
                            </DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                {isCreateDialogOpen
                                    ? 'Điền thông tin để tạo danh mục mới'
                                    : `Chỉnh sửa thông tin danh mục "${selectedCategory?.name}"`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-4 py-4'>
                            <div className='space-y-2'>
                                <Label className='text-white'>
                                    Tên danh mục *
                                </Label>
                                <DarkOutlineInput
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder='Nhập tên danh mục'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label className='text-white'>Slug</Label>
                                <DarkOutlineInput
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            slug: e.target.value,
                                        })
                                    }
                                    placeholder='Tự động tạo từ tên nếu để trống'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label className='text-white'>Mô tả</Label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder='Nhập mô tả danh mục'
                                    className='w-full min-h-[100px] px-3 py-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label className='text-white'>
                                    Ảnh danh mục
                                </Label>
                                <div className='flex items-center gap-3'>
                                    <DarkOutlineInput
                                        type='file'
                                        accept='image/*'
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            setImageFile(file || null)
                                            setImageRemoved(false)
                                        }}
                                    />
                                    <Button
                                        type='button'
                                        variant='secondary'
                                        onClick={() => {
                                            setImageFile(null)
                                            setFormData({
                                                ...formData,
                                                imageUrl: '',
                                            })
                                            setImageRemoved(true)
                                        }}
                                    >
                                        Xóa ảnh
                                    </Button>
                                </div>
                                <p className='text-xs text-gray-400'>
                                    Chọn ảnh từ máy tính (tối ưu &lt; 2MB). Nếu
                                    không chọn, danh mục sẽ dùng ảnh có sẵn hoặc
                                    để trống.
                                </p>
                                {(imageFile || formData.imageUrl) && (
                                    <div className='mt-2'>
                                        <p className='text-xs text-gray-400 mb-1'>
                                            Ảnh xem trước:
                                        </p>
                                        <div className='h-24 w-40 rounded overflow-hidden border border-[#2D2D2D] bg-[#0f0f0f] flex items-center justify-center'>
                                            <img
                                                src={
                                                    imageFile
                                                        ? URL.createObjectURL(
                                                              imageFile
                                                          )
                                                        : formData.imageUrl
                                                }
                                                alt='Preview'
                                                className='h-full w-full object-cover'
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <Label className='text-white'>
                                        Danh mục cha
                                    </Label>
                                    <Select
                                        value={
                                            formData.parentId
                                                ? String(formData.parentId)
                                                : 'null'
                                        }
                                        onValueChange={(value) => {
                                            setFormData({
                                                ...formData,
                                                parentId:
                                                    value === 'null'
                                                        ? null
                                                        : parseInt(value),
                                            })
                                        }}
                                    >
                                        <DarkOutlineSelectTrigger>
                                            <SelectValue placeholder='Không có' />
                                        </DarkOutlineSelectTrigger>
                                        <DarkOutlineSelectContent>
                                            <DarkOutlineSelectItem value='null'>
                                                Không có
                                            </DarkOutlineSelectItem>
                                            {allCategories
                                                .filter(
                                                    (cat) =>
                                                        !selectedCategory ||
                                                        cat.id !==
                                                            selectedCategory.id
                                                )
                                                .map((cat) => (
                                                    <DarkOutlineSelectItem
                                                        key={cat.id}
                                                        value={String(cat.id)}
                                                    >
                                                        {cat.name}
                                                    </DarkOutlineSelectItem>
                                                ))}
                                        </DarkOutlineSelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-white'>Thứ tự</Label>
                                    <DarkOutlineInput
                                        type='number'
                                        min={0}
                                        value={formData.sortOrder}
                                        onChange={(e) => {
                                            const value = parseInt(
                                                e.target.value
                                            )

                                            // Không cho phép số âm
                                            if (value < 0) return

                                            setFormData({
                                                ...formData,
                                                sortOrder: value || 0,
                                            })
                                        }}
                                        placeholder='0'
                                    />
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <Label className='text-white'>Trạng thái</Label>
                                <Select
                                    value={formData.isActive ? 'true' : 'false'}
                                    onValueChange={(value) => {
                                        setFormData({
                                            ...formData,
                                            isActive: value === 'true',
                                        })
                                    }}
                                >
                                    <DarkOutlineSelectTrigger>
                                        <SelectValue />
                                    </DarkOutlineSelectTrigger>
                                    <DarkOutlineSelectContent>
                                        <DarkOutlineSelectItem value='true'>
                                            Hoạt động
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='false'>
                                            Không hoạt động
                                        </DarkOutlineSelectItem>
                                    </DarkOutlineSelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DarkOutlineButton
                                onClick={() => {
                                    setIsCreateDialogOpen(false)
                                    setIsEditDialogOpen(false)
                                    setSelectedCategory(null)
                                }}
                                disabled={actionLoading}
                            >
                                Hủy
                            </DarkOutlineButton>
                            <Button
                                onClick={
                                    isCreateDialogOpen
                                        ? confirmCreate
                                        : confirmUpdate
                                }
                                disabled={
                                    actionLoading || !formData.name.trim()
                                }
                                className='bg-blue-600 hover:bg-blue-700 text-white'
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang xử lý...
                                    </>
                                ) : isCreateDialogOpen ? (
                                    'Tạo'
                                ) : (
                                    'Cập nhật'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Bạn có chắc chắn muốn xóa danh mục{' '}
                                <strong className='text-white'>
                                    {selectedCategory?.name}
                                </strong>
                                ?
                            </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-3 py-4'>
                            <div className='p-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg'>
                                <p className='text-sm text-yellow-300'>
                                    <strong className='text-yellow-400'>
                                        Lưu ý:
                                    </strong>{' '}
                                    Không thể xóa danh mục nếu:
                                </p>
                                <ul className='list-disc list-inside text-yellow-300/90 mt-2 space-y-1 text-sm'>
                                    <li>Danh mục có khóa học</li>
                                    <li>Danh mục có danh mục con</li>
                                </ul>
                            </div>
                            <p className='text-sm text-red-400'>
                                Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <DialogFooter>
                            <DarkOutlineButton
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={actionLoading}
                            >
                                Hủy
                            </DarkOutlineButton>
                            <Button
                                onClick={confirmDelete}
                                disabled={actionLoading}
                                className='bg-red-600 hover:bg-red-700 text-white'
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang xóa...
                                    </>
                                ) : (
                                    'Xóa'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
