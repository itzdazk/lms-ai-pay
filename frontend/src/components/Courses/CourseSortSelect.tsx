// ============================================
// FILE: src/components/Courses/CourseSortSelect.tsx (TẠO MỚI)
// Sort dropdown component
// ============================================

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'

export type SortOption =
    | 'newest'
    | 'popular'
    | 'rating'
    | 'price_asc'
    | 'price_desc'

interface CourseSortSelectProps {
    value: SortOption
    onChange: (value: SortOption) => void
    className?: string
}

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'popular', label: 'Phổ biến nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'rating', label: 'Đánh giá cao' },
    { value: 'price_asc', label: 'Giá thấp → cao' },
    { value: 'price_desc', label: 'Giá cao → thấp' },
]

export function CourseSortSelect({
    value,
    onChange,
    className = '',
}: CourseSortSelectProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                className={`w-full sm:w-48 bg-[#1F1F1F] border-[#2D2D2D] text-white ${className}`}
            >
                <SelectValue placeholder='Sắp xếp theo' />
            </SelectTrigger>
            <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                {sortOptions.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className='text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D]'
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
