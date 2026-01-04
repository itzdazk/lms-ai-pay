// ============================================
// FILE: src/components/Courses/CourseSearch.tsx (TẠO MỚI)
// Search bar with voice input and autocomplete suggestions
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { DarkOutlineInput } from '../ui/dark-outline-input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Search, X, Mic, Loader2 } from 'lucide-react'
import { searchApi } from '../../lib/api'
import type { SearchSuggestions } from '../../lib/api'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

interface CourseSearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    showSuggestions?: boolean
    onSuggestionClick?: (
        type: 'course' | 'category' | 'tag' | 'instructor',
        item: any
    ) => void
}

export function CourseSearch({
    value,
    onChange,
    placeholder = 'Tìm kiếm khóa học, giảng viên, công nghệ...',
    className = '',
    showSuggestions = true,
    onSuggestionClick,
}: CourseSearchProps) {
    const [isListening, setIsListening] = useState(false)
    const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(
        null
    )
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestionsDropdown, setShowSuggestionsDropdown] =
        useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const { theme } = useTheme()
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const recognitionRef = useRef<any>(null)

    // Debounced search suggestions
    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.trim().length < 1) {
            setSuggestions(null)
            setShowSuggestionsDropdown(false)
            return
        }

        try {
            if (searchQuery.trim().length >= 2) {
                const data = await searchApi.getSearchSuggestions(
                    searchQuery,
                    5
                )
                setSuggestions(data)
                setShowSuggestionsDropdown(true)
            } else {
                setSuggestions({
                    courses: [],
                    categories: [],
                    tags: [],
                    instructors: [],
                })
                setShowSuggestionsDropdown(true)
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Failed to fetch search suggestions:', error)
            setSuggestions(null)
            setShowSuggestionsDropdown(false)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Handle input change with debounce
    const handleInputChange = (newValue: string) => {
        onChange(newValue)
        setSelectedIndex(-1)

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        if (newValue.trim().length >= 1 && showSuggestions) {
            if (newValue.trim().length === 1) {
                setSuggestions({
                    courses: [],
                    categories: [],
                    tags: [],
                    instructors: [],
                })
                setShowSuggestionsDropdown(true)
                setIsLoading(false)
            } else {
                setIsLoading(true)
                setShowSuggestionsDropdown(true)
                if (!suggestions) {
                    setSuggestions({
                        courses: [],
                        categories: [],
                        tags: [],
                        instructors: [],
                    })
                }
            }
        } else {
            setSuggestions(null)
            setShowSuggestionsDropdown(false)
            setIsLoading(false)
            return
        }

        debounceTimerRef.current = setTimeout(() => {
            if (showSuggestions && newValue.trim().length >= 1) {
                fetchSuggestions(newValue)
            }
        }, 300)
    }

    // Handle suggestion click
    const handleSuggestionClick = (
        type: 'course' | 'category' | 'tag' | 'instructor',
        item: any
    ) => {
        setShowSuggestionsDropdown(false)
        setSelectedIndex(-1)

        if (onSuggestionClick) {
            onSuggestionClick(type, item)
        } else {
            // Default navigation behavior if no handler provided
            switch (type) {
                case 'course':
                    window.location.href = `/courses/${item.slug}`
                    break
                case 'category':
                    window.location.href = `/categories/${item.id}`
                    break
                case 'tag':
                    window.location.href = `/courses?tagIds=${item.id}`
                    break
                case 'instructor':
                    window.location.href = `/courses?instructorId=${item.id}`
                    break
            }
        }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!suggestions || !showSuggestionsDropdown) {
            if (e.key === 'Enter') {
                // Trigger search on Enter if no suggestions
                return
            }
            return
        }

        const totalSuggestions =
            (suggestions.courses?.length || 0) +
            (suggestions.categories?.length || 0) +
            (suggestions.tags?.length || 0) +
            (suggestions.instructors?.length || 0)

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex((prev) =>
                    prev < totalSuggestions - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0) {
                    let currentIndex = 0
                    if (suggestions.courses) {
                        for (const course of suggestions.courses) {
                            if (currentIndex === selectedIndex) {
                                handleSuggestionClick('course', course)
                                return
                            }
                            currentIndex++
                        }
                    }
                    if (suggestions.categories) {
                        for (const category of suggestions.categories) {
                            if (currentIndex === selectedIndex) {
                                handleSuggestionClick('category', category)
                                return
                            }
                            currentIndex++
                        }
                    }
                    if (suggestions.tags) {
                        for (const tag of suggestions.tags) {
                            if (currentIndex === selectedIndex) {
                                handleSuggestionClick('tag', tag)
                                return
                            }
                            currentIndex++
                        }
                    }
                    if (suggestions.instructors) {
                        for (const instructor of suggestions.instructors) {
                            if (currentIndex === selectedIndex) {
                                handleSuggestionClick('instructor', instructor)
                                return
                            }
                            currentIndex++
                        }
                    }
                }
                break
            case 'Escape':
                setShowSuggestionsDropdown(false)
                setSelectedIndex(-1)
                break
        }
    }

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowSuggestionsDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    // Cleanup debounce timer and speech recognition
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [])

    const handleVoiceSearch = useCallback(() => {
        if (
            !(
                'webkitSpeechRecognition' in window ||
                'SpeechRecognition' in window
            )
        ) {
            alert('Trình duyệt không hỗ trợ nhận diện giọng nói')
            return
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
            setIsListening(false)
            return
        }

        const SpeechRecognition =
            (window as any).webkitSpeechRecognition ||
            (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'vi-VN'
        recognition.continuous = false
        recognition.interimResults = false

        recognition.onstart = () => {
            setIsListening(true)
            onChange('')
            setSuggestions(null)
            setShowSuggestionsDropdown(false)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            onChange(transcript)
            setIsListening(false)
            if (showSuggestions) {
                handleInputChange(transcript)
            }
        }

        recognition.onerror = (event: any) => {
            setIsListening(false)
            console.error('Speech recognition error:', event.error)
            if (event.error === 'no-speech') {
                // User didn't speak, just stop listening
                return
            } else if (event.error === 'not-allowed') {
                alert('Vui lòng cấp quyền truy cập microphone cho trình duyệt.')
            } else {
                alert('Lỗi nhận diện giọng nói. Vui lòng thử lại.')
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [onChange, showSuggestions])

    const hasSuggestions =
        suggestions &&
        (suggestions.courses?.length > 0 ||
            suggestions.categories?.length > 0 ||
            suggestions.tags?.length > 0 ||
            suggestions.instructors?.length > 0)

    return (
        <div ref={searchRef} className={cn('relative', className)}>
            <div className='relative flex items-center'>
                <div className='absolute left-3 z-10'>
                    {isLoading ? (
                        <Loader2 className='h-4 w-4 animate-spin text-gray-400 dark:text-gray-400' />
                    ) : (
                        <Search className='h-4 w-4 text-gray-400 dark:text-gray-400' />
                    )}
                </div>
                {isListening && (
                    <>
                        <Mic className='absolute left-10 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600 animate-pulse z-10' />
                        <div className='absolute left-16 top-1/2 -translate-y-1/2 text-sm text-red-600 animate-pulse pointer-events-none z-10 whitespace-nowrap'>
                            Đang nghe...
                        </div>
                    </>
                )}
                <DarkOutlineInput
                    ref={inputRef}
                    type='text'
                    placeholder={isListening ? '' : placeholder}
                    value={isListening ? '' : value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (value.trim().length >= 1 || hasSuggestions) {
                            if (value.trim().length >= 1 && !hasSuggestions) {
                                setSuggestions({
                                    courses: [],
                                    categories: [],
                                    tags: [],
                                    instructors: [],
                                })
                            }
                            setShowSuggestionsDropdown(true)
                        }
                    }}
                    className={cn(
                        'pl-10 pr-20 h-10 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden',
                        isListening && 'pl-28'
                    )}
                    disabled={isListening}
                />
                <div className='absolute right-2 flex items-center gap-1'>
                    {value && !isListening && (
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => {
                                onChange('')
                                setSuggestions(null)
                                setShowSuggestionsDropdown(false)
                                inputRef.current?.focus()
                            }}
                        >
                            <X className='h-4 w-4' />
                        </Button>
                    )}
                    <Button
                        size='icon'
                        variant='ghost'
                        className={cn(
                            'h-8 w-8',
                            isListening
                                ? 'text-red-600 animate-pulse'
                                : 'text-gray-400 hover:text-white'
                        )}
                        onClick={handleVoiceSearch}
                        title='Tìm kiếm bằng giọng nói'
                    >
                        <Mic className='h-4 w-4' />
                    </Button>
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions &&
                showSuggestionsDropdown &&
                value.trim().length >= 1 && (
                    <div
                        className={cn(
                            'absolute top-full left-0 right-0 mt-2 z-50 rounded-lg shadow-xl border overflow-hidden',
                            theme === 'dark'
                                ? 'bg-[#1A1A1A] border-gray-700'
                                : 'bg-white border-gray-200'
                        )}
                    >
                        <div className='max-h-96 overflow-y-auto relative'>
                            {/* Loading State */}
                            {isLoading && (
                                <div className='absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center'>
                                    <div className='flex flex-col items-center gap-3 py-8'>
                                        <Loader2 className='h-6 w-6 animate-spin text-primary' />
                                        <span className='text-sm text-muted-foreground'>
                                            Đang tìm kiếm...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {value.trim().length >= 2 &&
                                !isLoading &&
                                suggestions &&
                                !hasSuggestions && (
                                    <div className='p-6 text-center'>
                                        <div className='flex flex-col items-center gap-2'>
                                            <p className='text-sm font-medium text-foreground'>
                                                Không có kết quả cho "
                                                <span className='font-semibold'>
                                                    {value.trim()}
                                                </span>
                                                "
                                            </p>
                                            <p className='text-xs text-muted-foreground'>
                                                Thử tìm kiếm với từ khóa khác
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {/* Courses */}
                            {suggestions &&
                                suggestions.courses &&
                                suggestions.courses.length > 0 && (
                                    <div className='p-2'>
                                        <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase'>
                                            Khóa học
                                        </div>
                                        {suggestions.courses.map(
                                            (course, idx) => {
                                                const globalIndex = idx
                                                return (
                                                    <div
                                                        key={course.id}
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                'course',
                                                                course
                                                            )
                                                        }
                                                        className={cn(
                                                            'px-3 py-2 rounded-md cursor-pointer flex items-center gap-3 hover:bg-accent transition-colors',
                                                            selectedIndex ===
                                                                globalIndex &&
                                                                'bg-accent'
                                                        )}
                                                    >
                                                        {course.thumbnailUrl && (
                                                            <img
                                                                src={
                                                                    course.thumbnailUrl
                                                                }
                                                                alt={
                                                                    course.title
                                                                }
                                                                className='w-10 h-10 rounded object-cover'
                                                            />
                                                        )}
                                                        <span className='flex-1 text-sm truncate'>
                                                            {course.title}
                                                        </span>
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                )}

                            {/* Categories */}
                            {suggestions &&
                                suggestions.categories &&
                                suggestions.categories.length > 0 && (
                                    <div className='p-2 border-t'>
                                        <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase'>
                                            Danh mục
                                        </div>
                                        {suggestions.categories.map(
                                            (category, idx) => {
                                                const globalIndex =
                                                    (suggestions.courses
                                                        ?.length || 0) + idx
                                                return (
                                                    <div
                                                        key={category.id}
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                'category',
                                                                category
                                                            )
                                                        }
                                                        className={cn(
                                                            'px-3 py-2 rounded-md cursor-pointer flex items-center gap-2 hover:bg-accent transition-colors',
                                                            selectedIndex ===
                                                                globalIndex &&
                                                                'bg-accent'
                                                        )}
                                                    >
                                                        <span className='text-sm'>
                                                            {category.name}
                                                        </span>
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                )}

                            {/* Tags */}
                            {suggestions &&
                                suggestions.tags &&
                                suggestions.tags.length > 0 && (
                                    <div className='p-2 border-t'>
                                        <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase'>
                                            Công nghệ
                                        </div>
                                        <div className='flex flex-wrap gap-2 px-3'>
                                            {suggestions.tags.map(
                                                (tag, idx) => {
                                                    const globalIndex =
                                                        (suggestions.courses
                                                            ?.length || 0) +
                                                        (suggestions.categories
                                                            ?.length || 0) +
                                                        idx
                                                    return (
                                                        <Badge
                                                            key={tag.id}
                                                            variant='secondary'
                                                            onClick={() =>
                                                                handleSuggestionClick(
                                                                    'tag',
                                                                    tag
                                                                )
                                                            }
                                                            className={cn(
                                                                'cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors',
                                                                selectedIndex ===
                                                                    globalIndex &&
                                                                    'bg-primary text-primary-foreground'
                                                            )}
                                                        >
                                                            {tag.name}
                                                        </Badge>
                                                    )
                                                }
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Instructors */}
                            {suggestions &&
                                suggestions.instructors &&
                                suggestions.instructors.length > 0 && (
                                    <div className='p-2 border-t'>
                                        <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase'>
                                            Giảng viên
                                        </div>
                                        {suggestions.instructors.map(
                                            (instructor, idx) => {
                                                const globalIndex =
                                                    (suggestions.courses
                                                        ?.length || 0) +
                                                    (suggestions.categories
                                                        ?.length || 0) +
                                                    (suggestions.tags?.length ||
                                                        0) +
                                                    idx
                                                return (
                                                    <div
                                                        key={instructor.id}
                                                        onClick={() =>
                                                            handleSuggestionClick(
                                                                'instructor',
                                                                instructor
                                                            )
                                                        }
                                                        className={cn(
                                                            'px-3 py-2 rounded-md cursor-pointer flex items-center gap-3 hover:bg-accent transition-colors',
                                                            selectedIndex ===
                                                                globalIndex &&
                                                                'bg-accent'
                                                        )}
                                                    >
                                                        {instructor.avatarUrl ? (
                                                            <img
                                                                src={
                                                                    instructor.avatarUrl
                                                                }
                                                                alt={
                                                                    instructor.fullName
                                                                }
                                                                className='w-8 h-8 rounded-full object-cover'
                                                            />
                                                        ) : (
                                                            <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                                                                <span className='text-xs font-semibold'>
                                                                    {
                                                                        instructor
                                                                            .fullName[0]
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        <span className='text-sm'>
                                                            {
                                                                instructor.fullName
                                                            }
                                                        </span>
                                                    </div>
                                                )
                                            }
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                )}
        </div>
    )
}
