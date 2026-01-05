import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, Mic } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { searchApi } from '../../lib/api'
import type { SearchSuggestions } from '../../lib/api'
import { useTheme } from '../../contexts/ThemeContext'
import { cn } from '../../lib/utils'

interface SearchBarProps {
    onSearch?: (query: string) => void
    placeholder?: string
    className?: string
    showSuggestions?: boolean
    autoFocus?: boolean
}

export function SearchBar({
    onSearch,
    placeholder = 'Tìm kiếm khóa học, công nghệ...',
    className,
    showSuggestions = true,
    autoFocus = false,
}: SearchBarProps) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<SearchSuggestions | null>(
        null
    )
    const [isLoading, setIsLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [showSuggestionsDropdown, setShowSuggestionsDropdown] =
        useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const navigate = useNavigate()
    const { theme } = useTheme()
    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const recognitionRef = useRef<any>(null)

    // Debounced search suggestions
    const fetchSuggestions = useCallback(async (searchQuery: string) => {
        // Show suggestions when user types at least 1 character
        if (!searchQuery || searchQuery.trim().length < 1) {
            setSuggestions(null)
            setShowSuggestionsDropdown(false)
            return
        }

        try {
            // Loading state is already set in handleInputChange for 2+ characters
            // This ensures loading appears immediately when user types
            // Only call API if query has at least 2 characters (API requirement)
            if (searchQuery.trim().length >= 2) {
                const data = await searchApi.getSearchSuggestions(
                    searchQuery,
                    5
                )
                setSuggestions(data)
                setShowSuggestionsDropdown(true)
            } else {
                // For single character, just show empty dropdown (no API call)
                setSuggestions({
                    courses: [],
                    categories: [],
                    tags: [],
                    instructors: [],
                })
                setShowSuggestionsDropdown(true)
                setIsLoading(false) // No loading for single character
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
    const handleInputChange = (value: string) => {
        setQuery(value)
        setSelectedIndex(-1)

        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        // If user types at least 1 character, show dropdown immediately
        if (value.trim().length >= 1 && showSuggestions) {
            // Show dropdown immediately for better UX
            if (value.trim().length === 1) {
                // For single character, show empty dropdown
                setSuggestions({
                    courses: [],
                    categories: [],
                    tags: [],
                    instructors: [],
                })
                setShowSuggestionsDropdown(true)
                setIsLoading(false) // No loading for single character
            } else {
                // For 2+ characters, show loading state immediately
                // This provides instant feedback while waiting for debounce + API call
                setIsLoading(true)
                setShowSuggestionsDropdown(true)
                // Keep existing suggestions visible while loading new ones
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
            // Hide dropdown if no input
            setSuggestions(null)
            setShowSuggestionsDropdown(false)
            setIsLoading(false)
            return
        }

        // Set new timer for debounce (300ms) to fetch actual suggestions
        debounceTimerRef.current = setTimeout(() => {
            if (showSuggestions && value.trim().length >= 1) {
                fetchSuggestions(value)
            }
        }, 300)
    }

    // Handle search submit
    const handleSearch = (searchQuery?: string) => {
        const finalQuery = searchQuery || query.trim()
        if (!finalQuery) return

        setShowSuggestionsDropdown(false)
        if (onSearch) {
            onSearch(finalQuery)
        } else {
            // Navigate to courses page with search query
            navigate(`/courses?q=${encodeURIComponent(finalQuery)}`)
        }
    }

    // Handle voice search
    const handleVoiceSearch = useCallback(() => {
        // Check if browser supports speech recognition
        if (
            !(
                'webkitSpeechRecognition' in window ||
                'SpeechRecognition' in window
            )
        ) {
            alert('Trình duyệt không hỗ trợ nhận diện giọng nói')
            return
        }

        // Stop previous recognition if running
        if (recognitionRef.current) {
            recognitionRef.current.stop()
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
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            setQuery(transcript)
            setIsListening(false)
            // Auto search after getting transcript
            setTimeout(() => {
                handleSearch(transcript)
            }, 100)
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
            if (event.error === 'no-speech') {
                // User didn't speak, just stop listening
                return
            }
            alert('Không thể nhận diện giọng nói. Vui lòng thử lại.')
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
    }, [])

    // Handle suggestion click
    const handleSuggestionClick = (
        type: 'course' | 'category' | 'tag' | 'instructor',
        item: any
    ) => {
        setShowSuggestionsDropdown(false)
        setQuery('')

        switch (type) {
            case 'course':
                navigate(`/courses/${item.slug}`)
                break
            case 'category':
                navigate(`/categories/${item.id}`)
                break
            case 'tag':
                // Navigate to courses page with tag filter
                // CoursesPage expects tagIds (plural, comma-separated)
                navigate(`/courses?tagIds=${item.id}`)
                break
            case 'instructor':
                navigate(`/courses?instructorId=${item.id}`)
                break
        }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!suggestions || !showSuggestionsDropdown) {
            if (e.key === 'Enter') {
                handleSearch()
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
                    // Navigate to selected suggestion
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
                } else {
                    handleSearch()
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

    const hasSuggestions =
        suggestions &&
        (suggestions.courses?.length > 0 ||
            suggestions.categories?.length > 0 ||
            suggestions.tags?.length > 0 ||
            suggestions.instructors?.length > 0)

    return (
        <div ref={searchRef} className={cn('relative w-full', className)}>
            <div className='relative flex items-center'>
                <div className='absolute left-4 z-10'>
                    {isLoading ? (
                        <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                    ) : (
                        <Search className='h-5 w-5 text-muted-foreground' />
                    )}
                </div>
                <Input
                    ref={inputRef}
                    type='text'
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        // Show dropdown if there's a query (at least 1 character) or if there are suggestions
                        if (query.trim().length >= 1 || hasSuggestions) {
                            // If query exists but no suggestions yet, show empty dropdown
                            if (query.trim().length >= 1 && !hasSuggestions) {
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
                    placeholder={placeholder}
                    className={cn(
                        'pl-12 pr-20 h-12 text-base',
                        theme === 'dark'
                            ? 'bg-gray-800/90 border-gray-700 text-white placeholder:text-gray-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500'
                    )}
                    autoFocus={autoFocus}
                />
                <div className='absolute right-2 flex items-center gap-1'>
                    {query && (
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            onClick={() => {
                                setQuery('')
                                setSuggestions(null)
                                setShowSuggestionsDropdown(false)
                                inputRef.current?.focus()
                            }}
                        >
                            <X className='h-4 w-4' />
                        </Button>
                    )}
                    <Button
                        variant='ghost'
                        size='icon'
                        className={cn(
                            'h-8 w-8',
                            isListening
                                ? 'text-red-500 animate-pulse'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                        onClick={handleVoiceSearch}
                        title='Tìm kiếm bằng giọng nói'
                    >
                        <Mic className='h-4 w-4' />
                    </Button>
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestionsDropdown && query.trim().length >= 1 && (
                <div
                    className={cn(
                        'absolute top-full left-0 right-0 mt-2 z-50 rounded-lg shadow-xl border overflow-hidden',
                        theme === 'dark'
                            ? 'bg-[#1A1A1A]  border-gray-800'
                            : 'bg-white border-gray-200'
                    )}
                >
                    <div className='max-h-96 overflow-y-auto relative'>
                        {/* Loading State - Show when fetching data */}
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

                        {/* Show empty state when no results found */}
                        {query.trim().length >= 1 &&
                            !isLoading &&
                            suggestions &&
                            !hasSuggestions && (
                                <div className='p-6 text-center'>
                                    <div className='flex flex-col items-center gap-2'>
                                        <p className='text-sm font-medium text-foreground'>
                                            Không có kết quả cho "
                                            <span className='font-semibold'>
                                                {query.trim()}
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
                                    {suggestions.courses.map((course, idx) => {
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
                                                        alt={course.title}
                                                        className='w-10 h-10 rounded object-cover'
                                                    />
                                                )}
                                                <span className='flex-1 text-sm truncate'>
                                                    {course.title}
                                                </span>
                                            </div>
                                        )
                                    })}
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
                                                (suggestions.courses?.length ||
                                                    0) + idx
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
                                        {suggestions.tags.map((tag, idx) => {
                                            const globalIndex =
                                                (suggestions.courses?.length ||
                                                    0) +
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
                                        })}
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
                                                (suggestions.courses?.length ||
                                                    0) +
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
                                                        {instructor.fullName}
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
