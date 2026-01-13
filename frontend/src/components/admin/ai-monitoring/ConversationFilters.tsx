import { Button } from '../../../components/ui/button'
import { DarkOutlineInput } from '../../../components/ui/dark-outline-input'
import { Search, X } from 'lucide-react'

interface ConversationFiltersProps {
    searchInput: string
    selectedMode: 'all' | 'advisor' | 'general'
    onSearchInputChange: (value: string) => void
    onSearch: () => void
    onSearchKeyPress: (e: React.KeyboardEvent) => void
    onClearSearch: () => void
    onModeChange: (mode: 'all' | 'advisor' | 'general') => void
}

export function ConversationFilters({
    searchInput,
    selectedMode,
    onSearchInputChange,
    onSearch,
    onSearchKeyPress,
    onClearSearch,
    onModeChange,
}: ConversationFiltersProps) {
    return (
        <div className='px-6 py-3 border-b border-[#2D2D2D] flex-shrink-0 bg-[#0F0F0F]'>
            <div className='flex gap-2'>
                <div className='flex-1 flex gap-2'>
                    <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <DarkOutlineInput
                            type='text'
                            placeholder='Tìm kiếm theo tiêu đề, người dùng...'
                            value={searchInput}
                            onChange={(e) => onSearchInputChange(e.target.value)}
                            onKeyPress={onSearchKeyPress}
                            className='pl-10 pr-10'
                        />
                        {searchInput && (
                            <button
                                type='button'
                                onClick={onClearSearch}
                                className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={onSearch}
                        className='px-6 bg-blue-600 hover:bg-blue-700 text-white'
                        disabled={!searchInput.trim()}
                    >
                        Tìm Kiếm
                    </Button>
                </div>
                <div className='flex gap-1.5'>
                    <Button
                        variant={selectedMode === 'all' ? 'default' : 'outline'}
                        onClick={() => onModeChange('all')}
                        className={`h-9 px-3 text-xs ${
                            selectedMode === 'all'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D]'
                        }`}
                    >
                        Tất cả
                    </Button>
                    <Button
                        variant={selectedMode === 'advisor' ? 'default' : 'outline'}
                        onClick={() => onModeChange('advisor')}
                        className={`h-9 px-3 text-xs ${
                            selectedMode === 'advisor'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D]'
                        }`}
                    >
                        Trợ lý AI
                    </Button>
                    <Button
                        variant={selectedMode === 'general' ? 'default' : 'outline'}
                        onClick={() => onModeChange('general')}
                        className={`h-9 px-3 text-xs ${
                            selectedMode === 'general'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 border border-[#2D2D2D]'
                        }`}
                    >
                        Gia sư AI
                    </Button>
                </div>
            </div>
        </div>
    )
}
