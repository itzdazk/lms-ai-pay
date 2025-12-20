import { Button } from '../../../components/ui/button'
import { DarkOutlineButton } from '../../../components/ui/buttons'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../components/ui/dialog'
import {
    Plus,
    Edit,
    Trash2,
    Loader2,
    Tag as TagIcon,
} from 'lucide-react'
import type { Tag } from '../../../lib/api/types'
import type { TagFormState } from '../../../lib/api/admin-tags'

interface TagDialogsProps {
    // Dialog states
    isCreateDialogOpen: boolean
    isEditDialogOpen: boolean
    isDeleteDialogOpen: boolean

    // Dialog handlers
    setIsCreateDialogOpen: (open: boolean) => void
    setIsEditDialogOpen: (open: boolean) => void
    setIsDeleteDialogOpen: (open: boolean) => void

    // Data
    selectedTag: Tag | null
    formData: TagFormState
    actionLoading: boolean

    // Handlers
    setSelectedTag: (tag: Tag | null) => void
    setFormData: (data: TagFormState) => void
    onConfirmCreate: () => void
    onConfirmUpdate: () => void
    onConfirmDelete: () => void

    // Utils
    generateSlug: (text: string) => string
}


export function TagDialogs({
    isCreateDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    setIsCreateDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    selectedTag,
    formData,
    actionLoading,
    setSelectedTag,
    setFormData,
    onConfirmCreate,
    onConfirmUpdate,
    onConfirmDelete,
    generateSlug,
}: TagDialogsProps) {
    return (
        <>
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
                <DialogContent className='flex flex-col p-0 overflow-hidden bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh]'>
                    <DialogHeader className='pb-4 border-b border-[#2D2D2D] px-6 pt-6 flex-shrink-0'>
                        <div className='flex items-center gap-3'>
                            <div className='p-2 bg-blue-600/20 rounded-lg'>
                                <TagIcon className='h-5 w-5 text-blue-400' />
                            </div>
                            <div className='flex-1'>
                                <DialogTitle className='text-xl'>
                                    {isCreateDialogOpen
                                        ? 'Tạo tag mới'
                                        : 'Chỉnh sửa tag'}
                                </DialogTitle>
                                <DialogDescription className='text-gray-400 mt-1'>
                                    {isCreateDialogOpen
                                        ? 'Điền thông tin để tạo tag mới'
                                        : `Chỉnh sửa thông tin tag "${selectedTag?.name}"`}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className='space-y-6 py-6 px-6 overflow-y-auto custom-scrollbar flex-1 min-h-0'>
                        {/* Basic Information Section */}
                        <div className='space-y-4'>
                            <div className='flex items-center gap-2 pb-2 border-b border-[#2D2D2D]'>
                                <TagIcon className='h-4 w-4 text-blue-400' />
                                <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-wide'>
                                    Thông tin cơ bản
                                </h3>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-white flex items-center gap-2'>
                                    <TagIcon className='h-4 w-4 text-gray-400' />
                                    Tên tag <span className='text-red-500'>*</span>
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => {
                                        const newName = e.target.value
                                        setFormData({
                                            ...formData,
                                            name: newName,
                                            // Auto-generate slug if slug is empty or was auto-generated
                                            slug: formData.slug === generateSlug(formData.name || '') || !formData.slug
                                                ? generateSlug(newName)
                                                : formData.slug,
                                        })
                                    }}
                                    placeholder='Nhập tên tag'
                                    className='text-base bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0'
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-white flex items-center gap-2'>
                                    <div className='h-4 w-4' />
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
                                            const autoSlug = generateSlug(formData.name || '')
                                            setFormData({
                                                ...formData,
                                                slug: autoSlug,
                                            })
                                        }}
                                        className='border-[#2D2D2D] text-gray-300 hover:bg-[#1F1F1F] hover:text-white'
                                            disabled={!formData.name?.trim()}
                                    >
                                        <div className='h-4 w-4' />
                                        Tự động
                                    </Button>
                                </div>
                                <p className='text-xs text-gray-500'>
                                    Slug sẽ được tự động tạo từ tên tag
                                </p>
                            </div>

                            <div className='space-y-2'>
                                <Label className='text-white flex items-center gap-2'>
                                    <div className='h-4 w-4' />
                                    Mô tả
                                </Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder='Nhập mô tả tag (tùy chọn)'
                                    className='min-h-[120px] bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus-visible:ring-blue-500 focus-visible:ring-offset-0 resize-none'
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className='pt-4 border-t border-[#2D2D2D] px-6 pb-6 flex-shrink-0 bg-[#1A1A1A]'>
                        <DarkOutlineButton
                            onClick={() => {
                                setIsCreateDialogOpen(false)
                                setIsEditDialogOpen(false)
                                setSelectedTag(null)
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
                            disabled={actionLoading || !formData.name?.trim()}
                            className='bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2'
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                    Đang xử lý...
                                </>
                            ) : isCreateDialogOpen ? (
                                <>
                                    <Plus className='h-4 w-4' />
                                    Tạo tag
                                </>
                            ) : (
                                <>
                                    <Edit className='h-4 w-4' />
                                    Cập nhật
                                </>
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
                        <div className='p-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg'>
                            <p className='text-sm text-yellow-300'>
                                <strong className='text-yellow-400'>
                                    Lưu ý:
                                </strong>{' '}
                                Tag sẽ bị xóa vĩnh viễn và không thể khôi phục.
                            </p>
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
