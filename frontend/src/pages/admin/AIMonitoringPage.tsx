import { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'
import apiClient from '../../lib/api/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
    StatisticsDashboard,
    ConversationFilters,
    ConversationsList,
    MessagesView,
    type Conversation,
    type Message,
    type AIStats,
    type ConversationStats,
} from '../../components/admin/ai-monitoring'

export function AIMonitoringPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<AIStats | null>(null)
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMode, setSelectedMode] = useState<'all' | 'advisor' | 'general'>('all')
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null)
    const [loadingConversationStats, setLoadingConversationStats] = useState(false)
    const [showStatsPanel, setShowStatsPanel] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 20

    // Fetch AI statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/admin/ai/stats')
                setStats(response.data?.data || null)
            } catch (error: any) {
                console.error('Failed to fetch AI stats:', error)
            }
        }

        fetchStats()
    }, [])

    // Fetch all conversations (admin view)
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setLoading(true)
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                })
                if (selectedMode !== 'all') {
                    params.append('mode', selectedMode)
                }
                if (searchQuery) {
                    params.append('search', searchQuery)
                }

                let response
                try {
                    response = await apiClient.get(`/admin/ai/conversations?${params}`)
                } catch (err: any) {
                    if (err?.response?.status === 404 || err?.response?.status === 403) {
                        console.warn('Admin AI endpoint not available')
                        toast.info('Endpoint giám sát AI cần được triển khai ở backend. Hiện tại chưa thể lấy dữ liệu.')
                        setConversations([])
                        setTotal(0)
                        setLoading(false)
                        return
                    }
                    throw err
                }

                const data = response.data?.data || []
                const pagination = response.data?.pagination || {}

                setConversations(data)
                setTotal(pagination.total || 0)
            } catch (error: any) {
                console.error('Failed to fetch conversations:', error)
                toast.error('Không thể tải danh sách cuộc trò chuyện')
            } finally {
                setLoading(false)
            }
        }

        fetchConversations()
    }, [page, selectedMode, searchQuery])

    // Fetch messages and stats for selected conversation
    useEffect(() => {
        if (!selectedConversation) {
            setMessages([])
            setConversationStats(null)
            return
        }

        const fetchData = async () => {
            try {
                setLoadingMessages(true)
                setLoadingConversationStats(true)

                // Fetch messages and stats in parallel
                const [messagesResponse, statsResponse] = await Promise.all([
                    apiClient.get(`/admin/ai/conversations/${selectedConversation.id}/messages`),
                    apiClient.get(`/admin/ai/conversations/${selectedConversation.id}/stats`).catch(() => null),
                ])

                const data = messagesResponse.data?.data || []
                setMessages(data)

                if (statsResponse?.data?.data) {
                    setConversationStats(statsResponse.data.data)
                }
            } catch (error: any) {
                console.error('Failed to fetch conversation data:', error)
                toast.error('Không thể tải dữ liệu cuộc trò chuyện')
            } finally {
                setLoadingMessages(false)
                setLoadingConversationStats(false)
            }
        }

        fetchData()
    }, [selectedConversation])

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const isToday = date.toDateString() === now.toDateString()
            
            if (isToday) {
                // Hôm nay: chỉ hiển thị giờ:phút
                return format(date, 'HH:mm', { locale: vi })
            } else {
                // Khác ngày: hiển thị đầy đủ ngày/tháng/năm giờ:phút
                return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
            }
        } catch {
            return dateString
        }
    }

    const formatMessageTime = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const isToday = date.toDateString() === now.toDateString()
            
            if (isToday) {
                // Hôm nay: chỉ hiển thị giờ:phút
                return format(date, 'HH:mm', { locale: vi })
            } else {
                // Khác ngày: hiển thị đầy đủ ngày/tháng/năm giờ:phút
                return format(date, 'dd/MM/yyyy HH:mm', { locale: vi })
            }
        } catch {
            return dateString
        }
    }

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(2)}s`
    }

    const getModeLabel = (mode: string) => {
        switch (mode) {
            case 'advisor':
                return 'Trợ lý AI'
            case 'general':
                return 'Gia sư AI'
            case 'course':
                return 'Chat bài học'
            default:
                return mode
        }
    }

    const getModeBadgeColor = (mode: string) => {
        switch (mode) {
            case 'advisor':
                return 'bg-purple-600'
            case 'general':
                return 'bg-blue-600'
            case 'course':
                return 'bg-green-600'
            default:
                return 'bg-gray-600'
        }
    }

    // Separate conversations by type
    const advisorConversations = conversations.filter((c) => c.mode === 'advisor')
    const tutorConversations = conversations.filter((c) => c.mode === 'general' || c.mode === 'course')

    // Handle search input change (no auto-search) - đồng bộ với OrdersPage
    const handleSearchInputChange = (value: string) => {
        setSearchInput(value)
    }

    // Handle clear search (reset both input and filters) - đồng bộ với OrdersPage
    const handleClearSearch = () => {
        setSearchInput('')
        setSearchQuery('')
        setPage(1)
    }

    // Handle search execution (manual search) - đồng bộ với OrdersPage
    const handleSearch = () => {
        setSearchQuery(searchInput.trim())
        setPage(1)
    }

    // Handle search on Enter key - đồng bộ với OrdersPage
    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className='min-h-screen flex flex-col bg-background'>
            {/* Header */}
            <div className='px-6 pt-2 pb-2.5 border-b border-[#2D2D2D] flex-shrink-0'>
                <div className='flex items-center justify-between mb-2'>
                    <div>
                        <h1 className='text-xl font-bold text-white flex items-center gap-2'>
                            <Bot className='h-5 w-5 text-purple-400' />
                            Giám sát AI
                        </h1>
                        <p className='text-xs text-gray-400 mt-0.5'>
                            Theo dõi và quản lý hoạt động của Trợ lý AI và Gia sư AI
                        </p>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <StatisticsDashboard stats={stats} formatTime={formatTime} />

            </div>

            {/* Main Content Area - Fixed background for search and 3 columns */}
            <div className='flex-1 flex flex-col min-h-0 bg-[#0F0F0F]'>
                {/* Filters */}
                <ConversationFilters
                    searchInput={searchInput}
                    selectedMode={selectedMode}
                    onSearchInputChange={handleSearchInputChange}
                    onSearch={handleSearch}
                    onSearchKeyPress={handleSearchKeyPress}
                    onClearSearch={handleClearSearch}
                    onModeChange={setSelectedMode}
                />

                {/* 3 Columns Container */}
                <div className='flex-1 flex min-h-0 bg-[#0F0F0F]'>
                    {/* Conversations List */}
                    <ConversationsList
                        conversations={conversations}
                        advisorConversations={advisorConversations}
                        tutorConversations={tutorConversations}
                        selectedMode={selectedMode}
                        selectedConversation={selectedConversation}
                        loading={loading}
                        page={page}
                        total={total}
                        limit={limit}
                        onSelect={setSelectedConversation}
                        onPageChange={setPage}
                        getModeLabel={getModeLabel}
                        getModeBadgeColor={getModeBadgeColor}
                        formatDate={formatDate}
                    />

                    {/* Messages View */}
                    <MessagesView
                        selectedConversation={selectedConversation}
                        messages={messages}
                        conversationStats={conversationStats}
                        loadingMessages={loadingMessages}
                        loadingConversationStats={loadingConversationStats}
                        showStatsPanel={showStatsPanel}
                        onToggleStatsPanel={() => setShowStatsPanel(!showStatsPanel)}
                        formatDate={formatDate}
                        formatTime={formatTime}
                        formatMessageTime={formatMessageTime}
                    />
                </div>
            </div>
        </div>
    )
}
