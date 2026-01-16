import { useState, useEffect, useRef } from 'react'
import {
    DarkOutlineTableRow,
    DarkOutlineTableCell,
} from '../../../components/ui/dark-outline-table'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
    MoreVertical,
    FolderTree,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react'
import type { Category } from '../../../lib/api/types'
import { formatDate } from '../../../lib/utils'

// Component for each category row with dropdown menu
export function CategoryRow({
    category,
    onEdit,
    onDelete,
    onChangeStatus,
    isSelected,
    onSelect,
}: {
    category: Category
    onEdit: (category: Category) => void
    onDelete: (category: Category) => void
    onChangeStatus: (category: Category) => void
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
                                className='w-16 h-10 object-cover rounded flex-shrink-0'
                            />
                        ) : (
                            <div className='w-16 h-10 bg-[#2D2D2D] rounded flex items-center justify-center flex-shrink-0'>
                                <FolderTree className='h-5 w-5 text-gray-400' />
                            </div>
                        )}
                        <div className='min-w-0 flex-1'>
                            <div className='flex items-start gap-2 min-w-0'>
                                <p className='font-medium text-white break-words whitespace-normal'>
                                    {category.name}
                                </p>
                            </div>
                            {category.description && (
                                <p className='text-sm text-gray-400 break-words whitespace-normal line-clamp-1'>
                                    {category.description}
                                </p>
                            )}
                            {category.parent && (
                                <div className='flex items-center gap-1.5 mt-2'>
                                    <span className='text-xs font-medium text-gray-400'>
                                        Danh mục cha:
                                    </span>
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-800'>
                                        {category.parent.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[120px]'>
                    <span
                        className='text-gray-300 truncate block'
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
                            className='border-[#2D2D2D] text-gray-300'
                        >
                            Không hoạt động
                        </Badge>
                    )}
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <span className='text-gray-300'>
                        {category.coursesCount || 0}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <span className='text-gray-300'>{category.sortOrder}</span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
                    <span className='text-gray-300'>
                        {formatDate(category.createdAt)}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
                    <span className='text-gray-300'>
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
                            onChangeStatus(category)
                            setMenuOpen(false)
                        }}
                    >
                        {category.isActive ? (
                            <ToggleLeft className='h-4 w-4' />
                        ) : (
                            <ToggleRight className='h-4 w-4' />
                        )}
                        Đổi trạng thái
                    </div>
                    <div
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-[#1F1F1F] cursor-pointer hover:text-red-300'
                        onClick={() => {
                            onDelete(category)
                            setMenuOpen(false)
                        }}
                    >
                        <Trash2 className='h-4 w-4 text-red-400' />
                        Xóa
                    </div>
                </div>
            )}
        </>
    )
}
