// ============================================
// FILE: src/components/Courses/CourseSortSelect.tsx (TẠO MỚI)
// Sort dropdown component
// ============================================

import { Select, SelectValue } from '../ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../ui/dark-outline-select-trigger'

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
            <DarkOutlineSelectTrigger
                className={`w-full sm:w-48 ${className}`}
            >
                <SelectValue placeholder='Sắp xếp theo' />
            </DarkOutlineSelectTrigger>
            <DarkOutlineSelectContent>
                {sortOptions.map((option) => (
                    <DarkOutlineSelectItem
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </DarkOutlineSelectItem>
                ))}
            </DarkOutlineSelectContent>
        </Select>
    )
}
