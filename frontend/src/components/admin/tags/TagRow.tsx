import React, { useState, useEffect, useRef } from 'react'
import { DarkOutlineTableRow, DarkOutlineTableCell } from '../../../components/ui/dark-outline-table'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Tag as TagIcon, Edit, Trash2, MoreVertical } from 'lucide-react'
import type { Tag } from '../../../lib/api/types'
import { formatDate } from '../../../lib/utils'

interface TagRowProps {
    tag: Tag
    isSelected: boolean
    onRowSelect: (id: number | null) => void
    onEdit: (tag: Tag) => void
    onDelete: (tag: Tag) => void
}

export function TagRow({ tag, isSelected, onRowSelect, onEdit, onDelete }: TagRowProps) {
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
            onRowSelect(null)
        } else {
            onRowSelect(tag.id)
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
                top = 8
            }
        }

        setAdjustedPosition({ x: left, y: top, transform })
    }, [menuOpen, menuPosition])

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

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
                <DarkOutlineTableCell className='min-w-[150px] max-w-[200px]'>
                    <div className='flex items-center gap-3 min-w-0'>
                        <div className='w-10 h-10 bg-gray-200 dark:bg-[#2D2D2D] rounded-full flex items-center justify-center flex-shrink-0'>
                            <TagIcon className='h-5 w-5 text-gray-600 dark:text-gray-300' />
                        </div>
                        <div className='min-w-0 flex-1'>
                            <p className='font-medium text-gray-900 dark:text-white break-words whitespace-normal'>
                                {tag.name}
                            </p>
                        </div>
                    </div>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='min-w-[120px] max-w-[150px]'>
                    <span className='text-gray-900 dark:text-gray-300 break-words whitespace-normal'>
                        {tag.slug}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='min-w-[150px] max-w-[200px]'>
                    <span className='text-gray-900 dark:text-gray-300 break-words whitespace-normal'>
                        {tag.description || 'Không có mô tả'}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[100px]'>
                    <span className='text-gray-900 dark:text-gray-300'>
                        {coursesCount}
                    </span>
                </DarkOutlineTableCell>
                <DarkOutlineTableCell className='w-[110px]'>
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
                                onRowSelect(tag.id)
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
                        className='flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer'
                        onClick={() => {
                            onDelete(tag)
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
