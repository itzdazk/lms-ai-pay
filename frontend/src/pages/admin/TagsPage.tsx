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
    Tag as TagIcon,
    MoreVertical,
    Loader2,
    Search,
    X,
    Edit,
    Trash2,
    Plus,
} from 'lucide-react'
import { coursesApi } from '../../lib/api/courses'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'
import { toast } from 'sonner'
import type { Tag } from '../../lib/api/types'
import { formatDate } from '../../lib/utils'

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
    } else if (name.trim().length < 2 || name.trim().length > 50) {
        errors.push('Tên tag phải từ 2 đến 50 ký tự')
    }

    if (!slug || !slug.trim()) {
        errors.push('Slug không được để trống')
    } else if (slug.length < 2 || slug.length > 50) {
        errors.push('Slug phải từ 2 đến 50 ký tự')
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

type AdminTagFilters = {
    page: number
    limit: number
    search: string
    sort?: string
    sortOrder?: string
}

type TagFormState = {
    name: string
    slug: string
    description: string
}

// Component for each tag row with dropdown menu
function TagRow({
    tag,
    onEdit,
    onDelete,
    isSelected,
    onSelect,
}: {
    tag: Tag
    onEdit: (tag: Tag) => void
    onDelete: (tag: Tag) => void
    isSelected: boolean
    onSelect: (tagId: number | null) => void
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
            onSelect(tag.id)
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

    const coursesCount = tag._count?.courses ?? 0

    return (
        <>
            <DarkOutlineTableRow
                className='cursor-pointer'
                selected={isSelected}
                onRowToggle={handleToggle}
            >
                <DarkOutlineTableCell className='min-w-[200px] max-w-[400px]'>
                    <div className='flex items-center gap-3 min-w-0'>
                        <div className='w-10 h-10 bg-gray-200 dark:bg-[#2D2D2D] rounded-full flex items-center justify-center flex-shrink-0'>
                            <TagIcon className='h-5 w-5 text-gray-600 dark:text-gray-300' />
                        </div>
                        <div className='min-w-0 flex-1'>
                            <p className='font-medium text-gray-900 dark:text-white break-words whitespace-normal'>
                                {tag.name}
                            </p>
                            {tag.description && (
                                <p className='text-sm text-gray-500 dark:text-gray-400 break-words whitespace-normal line-clamp-1'>
                                    {tag.description}
                                </p>
                            )}
                        </div>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[140px]'>
                    <span
                        className='text-gray-900 dark:text-gray-300 truncate block'
                        title={tag.slug}
                    >
                        {tag.slug}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[120px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {coursesCount}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[140px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {formatDate(tag.createdAt)}
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
                                onSelect(tag.id)
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
                            onEdit(tag)
                            setMenuOpen(false)
                        }}
                    >
                        <Edit className='h-4 w-4' />
                        Chỉnh sửa
                    </div>
                    <div
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer'
                        onClick={() => {
                            onDelete(tag)
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
    const [searchInput, setSearchInput] = useState<string>(filters.search || '')
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
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

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            const mainContainer = document.querySelector('main')
            if (mainContainer) {
                scrollPositionRef.current = (mainContainer as HTMLElement)
                    .scrollTop
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

    // Load tags when filters change
    useEffect(() => {
        if (currentUser) {
            loadTags()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.page, filters.limit, filters.search, filters.sort, filters.sortOrder, currentUser])

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
            const result = await coursesApi.getCourseTags({
                page: filters.page,
                limit: filters.limit,
                search: filters.search || undefined,
                sort: filters.sort,
                sortOrder: filters.sortOrder,
            })
            setTags(result.tags)
            setPagination(result.pagination)
        } catch (error: any) {
            console.error('Error loading tags:', error)
            setTags([])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (value: string) => {
        setSearchInput(value)
    }

    const handleFilterChange = (
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

    const handleLimitChange = (newLimit: number) => {
        const mainContainer = document.querySelector('main')
        if (mainContainer) {
            scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
        } else {
            scrollPositionRef.current =
                window.scrollY || document.documentElement.scrollTop
        }
        isPageChangingRef.current = true
        setFilters({ ...filters, page: 1, limit: newLimit })
    }

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

            const name = formData.name?.trim()
            const slug = formData.slug?.trim() || generateSlug(formData.name)
            const description = formData.description?.trim() || undefined

            const validationErrors = validateTagPayload({
                name: name || '',
                slug: slug || '',
            })
            if (validationErrors.length) {
                validationErrors.forEach((msg) => toast.error(msg))
                setActionLoading(false)
                return
            }

            await coursesApi.createTag(name!, description)

            toast.success('Tạo tag thành công!')
            setIsCreateDialogOpen(false)
            setFormData({
                name: '',
                slug: '',
                description: '',
            })
            loadTags()
        } catch (error: any) {
            console.error('Error creating tag:', error)
            showApiError(error)
        } finally {
            setActionLoading(false)
        }
    }

    const confirmUpdate = async () => {
        if (!selectedTag) return

        try {
            setActionLoading(true)

            const name = formData.name?.trim()
            const slug = formData.slug?.trim() || generateSlug(formData.name)
            const description = formData.description?.trim() || undefined

            const validationErrors = validateTagPayload({
                name: name || '',
                slug: slug || '',
            })
            if (validationErrors.length) {
                validationErrors.forEach((msg) => toast.error(msg))
                setActionLoading(false)
                return
            }

            await coursesApi.updateTag(selectedTag.id, {
                name,
                slug,
                description,
            })

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
            await coursesApi.deleteTag(selectedTag.id.toString())
            toast.success('Xóa tag thành công!')
            await loadTags()
            setIsDeleteDialogOpen(false)
            setSelectedTag(null)
        } catch (error: any) {
            console.error('Error deleting tag:', error)
            showApiError(error)
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
                    <div>
                        <h1 className='text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3'>
                            <TagIcon className='h-8 w-8' />
                            Quản lý Tags
                        </h1>
                        <p className='text-muted-foreground'>
                            Quản lý và theo dõi tất cả tags của khóa học
                        </p>
                    </div>
                </div>

                {/* Filters (search & per-page) */}
                <Card className='bg-[#1A1A1A] border-[#2D2D2D] mb-6'>
                    <CardHeader>
                        <CardTitle className='text-white'>Bộ lọc</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='space-y-2'>
                                <Label className='text-gray-400 text-sm'>
                                    Sắp xếp
                                </Label>
                                <Select
                                    value={`${filters.sort || 'createdAt'}-${
                                        filters.sortOrder || 'desc'
                                    }`}
                                    onValueChange={(value) => {
                                        const [sort, sortOrder] =
                                            value.split('-')
                                        setFilters({
                                            ...filters,
                                            sort,
                                            sortOrder,
                                            page: 1,
                                        })
                                    }}
                                >
                                    <DarkOutlineSelectTrigger>
                                        <SelectValue placeholder='Sắp xếp' />
                                    </DarkOutlineSelectTrigger>
                                    <DarkOutlineSelectContent>
                                        <DarkOutlineSelectItem value='createdAt-desc'>
                                            Mới nhất
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='createdAt-asc'>
                                            Cũ nhất
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='name-asc'>
                                            Tên: A-Z
                                        </DarkOutlineSelectItem>
                                        <DarkOutlineSelectItem value='name-desc'>
                                            Tên: Z-A
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
                                        handleLimitChange(parseInt(value, 10))
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
                                        const mainContainer = document.querySelector('main')
                                        if (mainContainer) {
                                            scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop
                                        } else {
                                            scrollPositionRef.current =
                                                window.scrollY || document.documentElement.scrollTop
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
                                    variant='blue'
                                    className='w-full'
                                >
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tags Table */}
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <div className='flex items-center justify-between'>
                            <div>
                                <CardTitle className='text-white'>
                                    Danh sách tags ({pagination.total})
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
                                Tạo tag
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='overflow-x-auto'>
                        {/* Search Bar */}
                        <div className='relative mb-4'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <DarkOutlineInput
                                type='text'
                                placeholder='Tìm kiếm theo tên hoặc slug...'
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
                        ) : tags.length === 0 ? (
                            <div className='text-center py-12'>
                                <TagIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                                <p className='text-gray-400'>
                                    Không tìm thấy tag nào
                                </p>
                            </div>
                        ) : (
                            <>
                                <DarkOutlineTable>
                                    <DarkOutlineTableHeader>
                                        <DarkOutlineTableRow>
                                            <DarkOutlineTableHead>
                                                Tag
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Slug
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Số khóa học
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead>
                                                Ngày tạo
                                            </DarkOutlineTableHead>
                                            <DarkOutlineTableHead className='text-right'>
                                                Thao tác
                                            </DarkOutlineTableHead>
                                        </DarkOutlineTableRow>
                                    </DarkOutlineTableHeader>
                                    <DarkOutlineTableBody>
                                        {tags.map((tag) => (
                                            <TagRow
                                                key={tag.id}
                                                tag={tag}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                isSelected={
                                                    selectedRowId === tag.id
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
                            setSelectedTag(null)
                        }
                    }}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-md'>
                        <DialogHeader>
                            <DialogTitle>
                                {isCreateDialogOpen
                                    ? 'Tạo tag mới'
                                    : 'Chỉnh sửa tag'}
                            </DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                {isCreateDialogOpen
                                    ? 'Điền thông tin để tạo tag mới'
                                    : `Chỉnh sửa thông tin tag "${selectedTag?.name}"`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-4 py-4'>
                            <div className='space-y-2'>
                                <Label className='text-white'>Tên tag *</Label>
                                <DarkOutlineInput
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder='Nhập tên tag'
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
                                    placeholder='Nhập mô tả tag (tối đa 500 ký tự)'
                                    className='w-full min-h-[80px] px-3 py-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DarkOutlineButton
                                onClick={() => {
                                    setIsCreateDialogOpen(false)
                                    setIsEditDialogOpen(false)
                                    setSelectedTag(null)
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
                                disabled={actionLoading || !formData.name.trim()}
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
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-md'>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa tag</DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Bạn có chắc chắn muốn xóa tag{' '}
                                <strong className='text-white'>
                                    {selectedTag?.name}
                                </strong>
                                ?
                            </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-3 py-4'>
                            <p className='text-sm text-red-400'>
                                Hành động này không thể hoàn tác. Quan hệ giữa
                                tag và khóa học sẽ được xử lý tự động.
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


