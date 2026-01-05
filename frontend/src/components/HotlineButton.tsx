import { Phone } from 'lucide-react'
import { CONTACT_INFO } from '../lib/constants'
import { cn } from '../lib/utils'

interface HotlineButtonProps {
    variant?: 'default' | 'prominent' | 'minimal' | 'text'
    size?: 'sm' | 'md' | 'lg'
    showIcon?: boolean
    showWorkingHours?: boolean
    className?: string
}

export function HotlineButton({
    variant = 'default',
    size = 'md',
    showIcon = true,
    showWorkingHours = false,
    className,
}: HotlineButtonProps) {
    const baseClasses = 'inline-flex items-center gap-2 transition-colors'

    const variantClasses = {
        default: 'text-blue-500 hover:text-blue-400 underline',
        prominent:
            'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl',
        minimal: 'text-gray-300 hover:text-white',
        text: 'text-blue-500 hover:text-blue-400',
    }

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    }

    return (
        <a
            href={`tel:${CONTACT_INFO.hotline}`}
            className={cn(
                baseClasses,
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            aria-label={`Gọi hotline ${CONTACT_INFO.hotlineDisplay}`}
        >
            {showIcon && (
                <Phone
                    className={
                        size === 'sm'
                            ? 'h-3 w-3'
                            : size === 'lg'
                            ? 'h-5 w-5'
                            : 'h-4 w-4'
                    }
                />
            )}
            <span>{CONTACT_INFO.hotlineDisplay}</span>
            {showWorkingHours && (
                <span className='text-xs opacity-75 ml-1'>
                    ({CONTACT_INFO.workingHours})
                </span>
            )}
        </a>
    )
}
