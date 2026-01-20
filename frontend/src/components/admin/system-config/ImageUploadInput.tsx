// frontend/src/components/admin/system-config/ImageUploadInput.tsx
import { useState, useRef } from 'react'
import { Button } from '../../../components/ui/button'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImage } from '../../../lib/api/upload'
import { getAbsoluteUrl } from '../../../lib/api/client'
import { toast } from 'sonner'

interface ImageUploadInputProps {
    label: string
    value: string | null
    onChange: (url: string) => void
    placeholder?: string
    accept?: string
    maxSizeMB?: number
    uploadType?: 'avatar' | 'thumbnail' | 'system' | 'general'
}

export function ImageUploadInput({
    label,
    value,
    onChange,
    placeholder = 'Nhập URL hoặc tải ảnh lên',
    accept = 'image/*',
    maxSizeMB = 5,
    uploadType = 'general',
}: ImageUploadInputProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh')
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Kích thước file không được vượt quá ${maxSizeMB}MB`)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)

        // Upload file
        setIsUploading(true)
        try {
            const result = await uploadImage(file, uploadType)
            onChange(result.url)
            toast.success('Tải ảnh lên thành công!')
        } catch (error: any) {
            console.error('Error uploading image:', error)
            toast.error('Có lỗi xảy ra khi tải ảnh lên')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            setPreview(null)
        }
    }

    const handleRemove = () => {
        onChange('')
        setPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const displayUrl = preview || value

    return (
        <div className='space-y-2'>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
                {label}
            </label>

            {/* URL Input */}
            <div className='flex gap-2'>
                <DarkOutlineInput
                    type='text'
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className='flex-1'
                />
                <input
                    ref={fileInputRef}
                    type='file'
                    accept={accept}
                    onChange={handleFileSelect}
                    className='hidden'
                />
                <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className='border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D] shrink-0'
                    title='Tải ảnh lên'
                >
                    {isUploading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                        <Upload className='h-4 w-4' />
                    )}
                </Button>
                {value && (
                    <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={handleRemove}
                        className='border-[#2D2D2D] text-red-400 hover:bg-red-500/20 hover:border-red-500/50 shrink-0'
                        title='Xóa ảnh'
                    >
                        <X className='h-4 w-4' />
                    </Button>
                )}
            </div>

            {/* Preview */}
            {displayUrl && (
                <div className='relative w-full h-48 rounded-lg overflow-hidden border border-[#2D2D2D] bg-[#1F1F1F]'>
                    <img
                        src={getAbsoluteUrl(displayUrl)}
                        alt='Preview'
                        className='w-full h-full object-contain'
                        onError={(e) => {
                            // Show error message on error
                            const target = e.target as HTMLImageElement
                            const parent = target.parentElement
                            if (parent) {
                                target.style.display = 'none'
                                const errorDiv = document.createElement('div')
                                errorDiv.className = 'flex items-center justify-center h-full text-red-400 text-sm'
                                errorDiv.textContent = 'Không thể tải ảnh. Vui lòng kiểm tra URL.'
                                parent.appendChild(errorDiv)
                            }
                            console.error('Failed to load image:', displayUrl)
                        }}
                        onLoad={() => {
                            console.log('Image loaded successfully:', displayUrl)
                        }}
                    />
                    {preview && (
                        <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                            <div className='flex items-center gap-2 text-white'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                <span className='text-sm'>Đang tải lên...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Helper text */}
            <p className='text-xs text-gray-500'>
                Nhập URL hoặc nhấp vào nút <Upload className='h-3 w-3 inline' /> để tải ảnh từ máy tính (tối đa {maxSizeMB}MB)
            </p>
        </div>
    )
}
