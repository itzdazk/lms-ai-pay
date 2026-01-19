// frontend/src/components/admin/system-config/AboutPageSection.tsx
import { Plus, X } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import type { SystemSettings } from '../../../lib/api/system-config'

interface AboutPageSectionProps {
    formData: Partial<SystemSettings>
    onUpdate: (path: string[], value: any) => void
    onUpdateArray: (path: string[], index: number, value: any) => void
    onAddArrayItem: (path: string[], defaultItem: any) => void
    onRemoveArrayItem: (path: string[], index: number) => void
}

export function AboutPageSection({
    formData,
    onUpdate,
    onUpdateArray,
    onAddArrayItem,
    onRemoveArrayItem,
}: AboutPageSectionProps) {
    return (
        <div className='space-y-6'>
            {/* Basic Info */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thông tin cơ bản</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Cấu hình nội dung trang giới thiệu
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Tiêu đề Hero
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.about?.heroTitle || ''}
                            onChange={(e) => onUpdate(['about', 'heroTitle'], e.target.value)}
                            placeholder='Nền tảng học tập thế hệ mới'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Mô tả Hero
                        </label>
                        <textarea
                            className='w-full min-h-[100px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={formData.about?.heroDescription || ''}
                            onChange={(e) =>
                                onUpdate(['about', 'heroDescription'], e.target.value)
                            }
                            placeholder='Mô tả về nền tảng...'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Background Image (URL)
                        </label>
                        <DarkOutlineInput
                            type='url'
                            value={formData.about?.heroBackgroundImage || ''}
                            onChange={(e) =>
                                onUpdate(['about', 'heroBackgroundImage'], e.target.value)
                            }
                            placeholder='https://images.unsplash.com/...'
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Thống kê</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Số liệu thống kê hiển thị trên trang giới thiệu
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>
                                Số khóa học
                            </label>
                            <DarkOutlineInput
                                type='text'
                                value={formData.about?.stats?.courses || ''}
                                onChange={(e) =>
                                    onUpdate(['about', 'stats', 'courses'], e.target.value)
                                }
                                placeholder='1,000+'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>
                                Số học viên
                            </label>
                            <DarkOutlineInput
                                type='text'
                                value={formData.about?.stats?.students || ''}
                                onChange={(e) =>
                                    onUpdate(['about', 'stats', 'students'], e.target.value)
                                }
                                placeholder='50,000+'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>
                                Số giảng viên
                            </label>
                            <DarkOutlineInput
                                type='text'
                                value={formData.about?.stats?.instructors || ''}
                                onChange={(e) =>
                                    onUpdate(['about', 'stats', 'instructors'], e.target.value)
                                }
                                placeholder='200+'
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-300 mb-2'>
                                Số chứng chỉ
                            </label>
                            <DarkOutlineInput
                                type='text'
                                value={formData.about?.stats?.certificates || ''}
                                onChange={(e) =>
                                    onUpdate(['about', 'stats', 'certificates'], e.target.value)
                                }
                                placeholder='25,000+'
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Story */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Câu chuyện</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Nội dung câu chuyện của công ty
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Tiêu đề
                        </label>
                        <DarkOutlineInput
                            type='text'
                            value={formData.about?.story?.title || ''}
                            onChange={(e) =>
                                onUpdate(['about', 'story', 'title'], e.target.value)
                            }
                            placeholder='Câu chuyện của chúng tôi'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Đoạn 1
                        </label>
                        <textarea
                            className='w-full min-h-[120px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={formData.about?.story?.paragraph1 || ''}
                            onChange={(e) =>
                                onUpdate(['about', 'story', 'paragraph1'], e.target.value)
                            }
                            placeholder='Đoạn văn đầu tiên...'
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-300 mb-2'>
                            Đoạn 2
                        </label>
                        <textarea
                            className='w-full min-h-[120px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            value={formData.about?.story?.paragraph2 || ''}
                            onChange={(e) =>
                                onUpdate(['about', 'story', 'paragraph2'], e.target.value)
                            }
                            placeholder='Đoạn văn thứ hai...'
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Values */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>Giá trị cốt lõi</CardTitle>
                            <CardDescription className='text-gray-400'>
                                Các giá trị dẫn dắt công ty
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            size='sm'
                            onClick={() =>
                                onAddArrayItem(['about', 'values'], {
                                    title: '',
                                    description: '',
                                })
                            }
                            className='bg-blue-600 hover:bg-blue-700'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Thêm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {(formData.about?.values || []).map((value, index) => (
                        <div
                            key={index}
                            className='p-4 border border-[#2D2D2D] rounded-lg space-y-3'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-300'>
                                    Giá trị #{index + 1}
                                </span>
                                <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => onRemoveArrayItem(['about', 'values'], index)}
                                    className='text-red-400 hover:text-red-300'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-300 mb-2'>
                                    Tiêu đề
                                </label>
                                <DarkOutlineInput
                                    type='text'
                                    value={value.title || ''}
                                    onChange={(e) =>
                                        onUpdateArray(['about', 'values'], index, {
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder='Sứ mệnh'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-300 mb-2'>
                                    Mô tả
                                </label>
                                <textarea
                                    className='w-full min-h-[80px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={value.description || ''}
                                    onChange={(e) =>
                                        onUpdateArray(['about', 'values'], index, {
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder='Mô tả giá trị...'
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Team */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>Đội ngũ</CardTitle>
                            <CardDescription className='text-gray-400'>
                                Thông tin đội ngũ lãnh đạo
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            size='sm'
                            onClick={() =>
                                onAddArrayItem(['about', 'team'], {
                                    name: '',
                                    role: '',
                                    avatar: '',
                                    bio: '',
                                })
                            }
                            className='bg-blue-600 hover:bg-blue-700'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Thêm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {(formData.about?.team || []).map((member, index) => (
                        <div
                            key={index}
                            className='p-4 border border-[#2D2D2D] rounded-lg space-y-3'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-300'>
                                    Thành viên #{index + 1}
                                </span>
                                <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => onRemoveArrayItem(['about', 'team'], index)}
                                    className='text-red-400 hover:text-red-300'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                                        Tên
                                    </label>
                                    <DarkOutlineInput
                                        type='text'
                                        value={member.name || ''}
                                        onChange={(e) =>
                                            onUpdateArray(['about', 'team'], index, {
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder='Nguyễn Văn A'
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                                        Vai trò
                                    </label>
                                    <DarkOutlineInput
                                        type='text'
                                        value={member.role || ''}
                                        onChange={(e) =>
                                            onUpdateArray(['about', 'team'], index, {
                                                role: e.target.value,
                                            })
                                        }
                                        placeholder='CEO & Founder'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-300 mb-2'>
                                    Avatar (URL)
                                </label>
                                <DarkOutlineInput
                                    type='url'
                                    value={member.avatar || ''}
                                    onChange={(e) =>
                                        onUpdateArray(['about', 'team'], index, {
                                            avatar: e.target.value,
                                        })
                                    }
                                    placeholder='https://api.dicebear.com/...'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-300 mb-2'>
                                    Tiểu sử
                                </label>
                                <textarea
                                    className='w-full min-h-[80px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={member.bio || ''}
                                    onChange={(e) =>
                                        onUpdateArray(['about', 'team'], index, {
                                            bio: e.target.value,
                                        })
                                    }
                                    placeholder='Mô tả ngắn về thành viên...'
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Timeline */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div>
                            <CardTitle className='text-white'>Timeline</CardTitle>
                            <CardDescription className='text-gray-400'>
                                Các mốc phát triển của công ty
                            </CardDescription>
                        </div>
                        <Button
                            type='button'
                            size='sm'
                            onClick={() =>
                                onAddArrayItem(['about', 'timeline'], {
                                    year: '',
                                    title: '',
                                    description: '',
                                })
                            }
                            className='bg-blue-600 hover:bg-blue-700'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Thêm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {(formData.about?.timeline || []).map((milestone, index) => (
                        <div
                            key={index}
                            className='p-4 border border-[#2D2D2D] rounded-lg space-y-3'
                        >
                            <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-gray-300'>
                                    Mốc #{index + 1}
                                </span>
                                <Button
                                    type='button'
                                    size='sm'
                                    variant='ghost'
                                    onClick={() =>
                                        onRemoveArrayItem(['about', 'timeline'], index)
                                    }
                                    className='text-red-400 hover:text-red-300'
                                >
                                    <X className='h-4 w-4' />
                                </Button>
                            </div>
                            <div className='grid grid-cols-3 gap-3'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                                        Năm
                                    </label>
                                    <DarkOutlineInput
                                        type='text'
                                        value={milestone.year || ''}
                                        onChange={(e) =>
                                            onUpdateArray(['about', 'timeline'], index, {
                                                year: e.target.value,
                                            })
                                        }
                                        placeholder='2020'
                                    />
                                </div>
                                <div className='col-span-2'>
                                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                                        Tiêu đề
                                    </label>
                                    <DarkOutlineInput
                                        type='text'
                                        value={milestone.title || ''}
                                        onChange={(e) =>
                                            onUpdateArray(['about', 'timeline'], index, {
                                                title: e.target.value,
                                            })
                                        }
                                        placeholder='Thành lập'
                                    />
                                </div>
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-300 mb-2'>
                                    Mô tả
                                </label>
                                <textarea
                                    className='w-full min-h-[80px] px-3 py-2 bg-[#2D2D2D] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={milestone.description || ''}
                                    onChange={(e) =>
                                        onUpdateArray(['about', 'timeline'], index, {
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder='Mô tả mốc phát triển...'
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
