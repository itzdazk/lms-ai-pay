// ============================================
// FILE: src/components/Courses/CourseSearch.tsx (TẠO MỚI)
// Search bar with voice input
// ============================================

import { useState, useCallback } from 'react'
import { DarkOutlineInput } from '../ui/dark-outline-input'
import { Button } from '../ui/button'
import { Search, X, Mic } from 'lucide-react'

interface CourseSearchProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function CourseSearch({
    value,
    onChange,
    placeholder = 'Tìm kiếm khóa học, giảng viên, công nghệ...',
    className = '',
}: CourseSearchProps) {
    const [isListening, setIsListening] = useState(false)

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

        const SpeechRecognition =
            (window as any).webkitSpeechRecognition ||
            (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'vi-VN'
        recognition.continuous = false

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            onChange(transcript)
            setIsListening(false)
        }

        recognition.onerror = () => {
            setIsListening(false)
            alert('Không thể nhận diện giọng nói. Vui lòng thử lại.')
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.start()
    }, [onChange])

    return (
        <div className={`relative ${className}`}>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-400 z-10' />
            <DarkOutlineInput
                type='text'
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className='pl-10 pr-20 h-10 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden'
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className='absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors z-10'
                    title='Xóa tìm kiếm'
                >
                    <X className='h-4 w-4' />
                </button>
            )}
            <Button
                size='icon'
                variant='ghost'
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                    isListening
                        ? 'text-red-600 animate-pulse'
                        : 'text-gray-400 hover:text-white'
                }`}
                onClick={handleVoiceSearch}
                title='Tìm kiếm bằng giọng nói'
            >
                <Mic className='h-4 w-4' />
            </Button>
            {isListening && (
                <p className='absolute -bottom-6 left-0 text-sm text-red-600 animate-pulse flex items-center gap-2'>
                    <Mic className='h-4 w-4' />
                    Đang nghe...
                </p>
            )}
        </div>
    )
}
