import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { DarkOutlineButton } from '../../../components/ui/buttons'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectValue } from '../../../components/ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../../../components/ui/dark-outline-select-trigger'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog'
import {
    FolderTree,
    FileText,
    Hash,
    ToggleLeft,
    ToggleRight,
    Sparkles,
    Upload,
    FileImage,
    Loader2,
    Edit,
    Plus,
    Trash2,
} from 'lucide-react'
import { Badge } from '../../../components/ui/badge'
import type { Category } from '../../../lib/api/types'
import type { CreateCategoryRequest } from '../../../lib/api/admin-categories'

interface CategoryDialogsProps {
    // Dialog states
    isCreateDialogOpen: boolean
    isEditDialogOpen: boolean
    isDeleteDialogOpen: boolean
    isStatusUpdateDialogOpen: boolean
    isChangeStatusDialogOpen: boolean

    // Dialog handlers
    setIsCreateDialogOpen: (open: boolean) => void
    setIsEditDialogOpen: (open: boolean) => void
    setIsDeleteDialogOpen: (open: boolean) => void
    setIsStatusUpdateDialogOpen: (open: boolean) => void
    setIsChangeStatusDialogOpen: (open: boolean) => void

    // Data
    selectedCategory: Category | null
    newlyCreatedCategory: Category | null
    allCategories: Category[]
    formData: CreateCategoryRequest
    parentCategorySearch: string
    imageFile: File | null
    imageRemoved: boolean
    actionLoading: boolean

    // Handlers
    setSelectedCategory: (category: Category | null) => void
    setFormData: (data: CreateCategoryRequest) => void
    setParentCategorySearch: (value: string) => void
    setImageFile: (file: File | null) => void
    setImageRemoved: (removed: boolean) => void
    setNewlyCreatedCategory: (category: Category | null) => void

    // Actions
    onConfirmCreate: () => void
    onConfirmUpdate: () => void
    onConfirmDelete: () => void
    onConfirmChangeStatus: () => void

    // Utils
    generateSlug: (text: string) => string
}

export function CategoryDialogs({
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    isStatusUpdateDialogOpen,
    isChangeStatusDialogOpen,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setIsStatusUpdateDialogOpen,
    setIsChangeStatusDialogOpen,
    selectedCategory,
    newlyCreatedCategory,
    allCategories,
    formData,
    parentCategorySearch,
    imageFile,
    imageRemoved,
    actionLoading,
    setSelectedCategory,
    setFormData,
    setParentCategorySearch,
    setImageFile,
    setImageRemoved,
    setNewlyCreatedCategory,
    onConfirmCreate,
    onConfirmUpdate,
    onConfirmDelete,
    onConfirmChangeStatus,
    generateSlug,
}: CategoryDialogsProps) {
    return (
        <>
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
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D] px-6 pt-6 flex-shrink-0'>
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-blue-600/20 rounded-lg'>
                                <FolderTree className='h-5 w-5 text-blue-400' />
                            </div>
                            <div className='flex-1'>
                                <DialogTitle className='text-xl'>
                                    {isCreateDialogOpen
                                        ? 'Tạo danh mục mới'
                                        : 'Chỉnh sửa danh mục'}
                                </DialogTitle>
                                <DialogDescription className='text-gray-400 mt-1'>
                                    {isCreateDialogOpen
                                        ? 'Điền thông tin để tạo danh mục mới'
                                        : `Chỉnh sửa thông tin danh mục "${selectedCategory?.name}"`}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className='space-y-6 py-6 px-6 overflow-y-auto custom-scrollbar flex-1 min-h-0'>
                        {/* Basic Information Section */}
                        <div className='space-y-4'>
                            <div className='flex items-center gap-2 pb-2 border-b border-[#2D2D2D]'>
                                <FileText className='h-4 w-4 text-blue-400' />
                                <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wide'>
                                    Thông tin cơ bản
                                </h3>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-white flex items-center gap-2'>
                                    <FolderTree className='h-4 w-4 text-gray-400' />
                                    Tên danh mục <span className='text-red-500'>*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => {
                                        const newName = e.target.value
                                        setFormData({
                                            ...formData,
                                            name: newName,
                                            // Auto-generate slug if slug is empty or was auto-generated
                                            slug: formData.slug === generateSlug(formData.name) || !formData.slug
                                                ? generateSlug(newName)
                                                : formData.slug,
                                        })
                                    }}
                                    placeholder='Nhập tên danh mục'
                                    className='text-base bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0'
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-white flex items-center gap-2'>
                                    <Hash className='h-4 w-4 text-gray-400' />
                                    Slug
                                </Label>
                                <div className='flex items-center gap-2'>
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                slug: e.target.value,
                                            })
                                        }
                                        placeholder='Tự động tạo từ tên nếu để trống'
                                        className='flex-1 text-base bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0'
                                    />
                                    <Button
                                        type='button'
                                        variant='outline'
                                        size='sm'
                                        onClick={() => {
                                            const autoSlug = generateSlug(formData.name)
                                            setFormData({
                                                ...formData,
                                                slug: autoSlug,
                                            })
                                        }}
                                        className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F] hover:text-white'
                                        disabled={!formData.name.trim()}
                                    >
                                        <Sparkles className='h-4 w-4 mr-1' />
                                        Tự động
                                    </Button>
                                </div>
                                <p className='text-xs text-gray-500'>
                                    Slug sẽ được tự động tạo từ tên danh mục
                                </p>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-white flex items-center gap-2'>
                                    <FileText className='h-4 w-4 text-gray-400' />
                                    Mô tả
                                </Label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder='Nhập mô tả danh mục (tùy chọn)'
                                    className='w-full min-h-[140px] px-3 py-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                                />
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
                                <div className='space-y-2'>
                                    <Label className='text-white flex items-center gap-2'>
                                        <FolderTree className='h-4 w-4 text-gray-400' />
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
                                            setParentCategorySearch('') // Reset search when selecting
                                        }}
                                    >
                                        <DarkOutlineSelectTrigger>
                                            <SelectValue placeholder='Không có' />
                                        </DarkOutlineSelectTrigger>
                                        <DarkOutlineSelectContent>
                                            <div className='p-2 border-b border-[#2D2D2D]'>
                                                <Input
                                                    placeholder='Tìm kiếm danh mục...'
                                                    value={parentCategorySearch}
                                                    onChange={(e) => {
                                                        e.stopPropagation()
                                                        setParentCategorySearch(e.target.value)
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    className='w-full bg-[#1F1F1F] border-[#2D2D2D] text-white'
                                                />
                                            </div>
                                            <div className='max-h-[200px] overflow-y-auto'>
                                                <DarkOutlineSelectItem
                                                    value='null'
                                                    onSelect={() => setParentCategorySearch('')}
                                                >
                                                    Không có
                                                </DarkOutlineSelectItem>
                                                {(() => {
                                                    const searchLower = parentCategorySearch.toLowerCase()

                                                    // Separate parent and child categories
                                                    const parentCategories = allCategories.filter((cat) => !cat.parentId)
                                                    const childCategories = allCategories.filter((cat) => cat.parentId)

                                                    // Build display list maintaining hierarchical order
                                                    const displayList: Category[] = []

                                                    // Process parent categories first
                                                    parentCategories.forEach((parent) => {
                                                        // Filter out the category being edited (if editing)
                                                        if (selectedCategory && parent.id === selectedCategory.id) {
                                                            return
                                                        }

                                                        const parentMatches = !parentCategorySearch ||
                                                            parent.name.toLowerCase().includes(searchLower)

                                                        // Get all children of this parent
                                                        const children = childCategories.filter(
                                                            (child) => child.parentId === parent.id &&
                                                                (!selectedCategory || child.id !== selectedCategory.id)
                                                        )

                                                        // Check if any child matches search
                                                        const hasMatchingChild = !parentCategorySearch ||
                                                            children.some((child) =>
                                                                child.name.toLowerCase().includes(searchLower)
                                                            )

                                                        // Include parent if it matches or has matching children or no search
                                                        if (parentMatches || hasMatchingChild || !parentCategorySearch) {
                                                            displayList.push(parent)

                                                            // Add all children of this parent
                                                            children.forEach((child) => {
                                                                const childMatches = !parentCategorySearch ||
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
                                                            parentCategorySearch &&
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
                                                                    setParentCategorySearch('')
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
                                    <Label className='text-white flex items-center gap-2'>
                                        <Hash className='h-4 w-4 text-gray-400' />
                                        Thứ tự
                                    </Label>
                                    <Input
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
                                        className='text-base bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Section */}
                        <div className='space-y-4'>
                            <div className='flex items-center gap-2 pb-2 border-b border-[#2D2D2D]'>
                                <FileImage className='h-4 w-4 text-blue-400' />
                                <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wide'>
                                    Ảnh danh mục
                                </h3>
                            </div>

                            {(imageFile || formData.imageUrl) ? (
                                <div className='space-y-3'>
                                    <div className='relative group'>
                                        <div className='h-48 w-full rounded-lg overflow-hidden border-2 border-[#2D2D2D] bg-[#0f0f0f] flex items-center justify-center'>
                                            <img
                                                src={
                                                    imageFile
                                                        ? URL.createObjectURL(imageFile)
                                                        : formData.imageUrl
                                                }
                                                alt='Preview'
                                                className='h-full w-full object-cover'
                                            />
                                        </div>
                                        <Button
                                            type='button'
                                            variant='destructive'
                                            size='sm'
                                            onClick={() => {
                                                setImageFile(null)
                                                setFormData({
                                                    ...formData,
                                                    imageUrl: '',
                                                })
                                                setImageRemoved(true)
                                            }}
                                            className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
                                        >
                                            <FileImage className='h-4 w-4' />
                                        </Button>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <label className='flex-1 cursor-pointer'>
                                            <input
                                                type='file'
                                                accept='image/*'
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    setImageFile(file || null)
                                                    setImageRemoved(false)
                                                }}
                                                className='hidden'
                                            />
                                            <div className='w-full'>
                                                <Button
                                                    type='button'
                                                    variant='outline'
                                                    className='w-full border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F] hover:text-white'
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
                                                        input?.click()
                                                    }}
                                                >
                                                    <Upload className='h-4 w-4 mr-2' />
                                                    Thay đổi ảnh
                                                </Button>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className='block'>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            setImageFile(file || null)
                                            setImageRemoved(false)
                                        }}
                                        className='hidden'
                                    />
                                    <div className='border-2 border-dashed border-[#2D2D2D] rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer bg-[#1F1F1F]/50'>
                                        <div className='flex flex-col items-center gap-3'>
                                            <div className='p-3 bg-blue-600/20 rounded-full'>
                                                <FileImage className='h-6 w-6 text-blue-400' />
                                            </div>
                                            <div>
                                                <p className='text-sm font-medium text-gray-300'>
                                                    Nhấp để tải ảnh lên
                                                </p>
                                                <p className='text-xs text-gray-500 mt-1'>
                                                    PNG, JPG hoặc GIF (tối ưu &lt; 2MB)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            )}
                        </div>
                    </div>
                    <DialogFooter className='pt-4 border-t border-[#2D2D2D] px-6 pb-6 flex-shrink-0 bg-[#1A1A1A]'>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsCreateDialogOpen(false)
                                setIsEditDialogOpen(false)
                                setSelectedCategory(null)
                            }}
                            disabled={actionLoading}
                            className='min-w-[100px]'
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={
                                isCreateDialogOpen
                                    ? onConfirmCreate
                                    : onConfirmUpdate
                            }
                            disabled={
                                actionLoading || !formData.name.trim()
                            }
                            className='bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang xử lý...
                                </>
                            ) : isCreateDialogOpen ? (
                                <>
                                    <Plus className='h-4 w-4 mr-2' />
                                    Tạo danh mục
                                </>
                            ) : (
                                <>
                                    <Edit className='h-4 w-4 mr-2' />
                                    Cập nhật
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog
                open={isStatusUpdateDialogOpen}
                onOpenChange={setIsStatusUpdateDialogOpen}
            >
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Cập nhật trạng thái danh mục</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Danh mục{' '}
                            <strong className='text-white'>
                                {newlyCreatedCategory?.name}
                            </strong>{' '}
                            đã được tạo thành công. Bạn có muốn kích hoạt danh mục này ngay bây giờ không?
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div className='p-4 bg-blue-600/20 border border-blue-600/50 rounded-lg'>
                            <p className='text-sm text-blue-300'>
                                <strong className='text-blue-400'>
                                    Lưu ý:
                                </strong>{' '}
                                Danh mục đang ở trạng thái "Không hoạt động". Chỉ các danh mục "Hoạt động" mới hiển thị trên trang công khai.
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <Label className='text-white flex items-center gap-2'>
                                {newlyCreatedCategory?.isActive ? (
                                    <ToggleRight className='h-4 w-4 text-green-400' />
                                ) : (
                                    <ToggleLeft className='h-4 w-4 text-gray-400' />
                                )}
                                Trạng thái
                            </Label>
                            <Select
                                value={newlyCreatedCategory?.isActive ? 'true' : 'false'}
                                onValueChange={(value) => {
                                    if (newlyCreatedCategory) {
                                        setNewlyCreatedCategory({
                                            ...newlyCreatedCategory,
                                            isActive: value === 'true',
                                        })
                                    }
                                }}
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='true'>
                                        <div className='flex items-center gap-2'>
                                            <ToggleRight className='h-4 w-4 text-green-400' />
                                            Hoạt động
                                        </div>
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='false'>
                                        <div className='flex items-center gap-2'>
                                            <ToggleLeft className='h-4 w-4 text-gray-400' />
                                            Không hoạt động
                                        </div>
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsStatusUpdateDialogOpen(false)
                                setNewlyCreatedCategory(null)
                            }}
                            disabled={actionLoading}
                        >
                            Bỏ qua
                        </DarkOutlineButton>
                        <Button
                            onClick={onConfirmChangeStatus}
                            disabled={actionLoading}
                            className='bg-blue-600 hover:bg-blue-700 text-white'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang cập nhật...
                                </>
                            ) : (
                                'Cập nhật'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Status Dialog */}
            <Dialog
                open={isChangeStatusDialogOpen}
                onOpenChange={setIsChangeStatusDialogOpen}
            >
                <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle>Đổi trạng thái danh mục</DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            Thay đổi trạng thái của danh mục{' '}
                            <strong className='text-white'>
                                {selectedCategory?.name}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <div className='p-4 bg-blue-600/20 border border-blue-600/50 rounded-lg'>
                            <p className='text-sm text-blue-300'>
                                <strong className='text-blue-400'>
                                    Lưu ý:
                                </strong>{' '}
                                Chỉ các danh mục "Hoạt động" mới hiển thị trên trang công khai.
                            </p>
                        </div>
                        <div className='space-y-2'>
                            <Label className='text-white flex items-center gap-2'>
                                {selectedCategory?.isActive ? (
                                    <ToggleRight className='h-4 w-4 text-green-400' />
                                ) : (
                                    <ToggleLeft className='h-4 w-4 text-gray-400' />
                                )}
                                Trạng thái
                            </Label>
                            <Select
                                value={selectedCategory?.isActive ? 'true' : 'false'}
                                onValueChange={(value) => {
                                    if (selectedCategory) {
                                        setSelectedCategory({
                                            ...selectedCategory,
                                            isActive: value === 'true',
                                        })
                                    }
                                }}
                            >
                                <DarkOutlineSelectTrigger>
                                    <SelectValue />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value='true'>
                                        <div className='flex items-center gap-2'>
                                            <ToggleRight className='h-4 w-4 text-green-400' />
                                            Hoạt động
                                        </div>
                                    </DarkOutlineSelectItem>
                                    <DarkOutlineSelectItem value='false'>
                                        <div className='flex items-center gap-2'>
                                            <ToggleLeft className='h-4 w-4 text-gray-400' />
                                            Không hoạt động
                                        </div>
                                    </DarkOutlineSelectItem>
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsChangeStatusDialogOpen(false)
                                setSelectedCategory(null)
                            }}
                            disabled={actionLoading}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={onConfirmChangeStatus}
                            disabled={actionLoading}
                            className='bg-blue-600 hover:bg-blue-700 text-white'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang cập nhật...
                                </>
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
                            onClick={onConfirmDelete}
                            disabled={actionLoading}
                            className='bg-red-600 hover:bg-red-700 text-white'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    Đang xóa...
                                </>
                            ) : (
                                <>
                                    <Trash2 className='h-4 w-4 mr-2 text-red-200' />
                                    Xóa
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
