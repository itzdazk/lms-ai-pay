import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { DarkOutlineButton } from '../components/ui/buttons'
import {
    BarChart3,
    Settings,
    ShoppingCart,
    FolderTree,
    LayoutDashboard,
    Menu,
    X,
    Loader2,
    Sun,
    Moon,
    LogOut,
    User as UserIcon,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Shield,
    GraduationCap,
    Tag,
    LibraryBig,
    ReceiptText,
    Users,
    BookOpen,
    RotateCcw,
    Bot,
} from 'lucide-react'
import { UsersPage } from './admin/UsersPage'
import { CoursesPage as AdminCoursesPage } from './admin/CoursesPage'
import { CategoriesPage } from './admin/CategoriesPage'
import { TagsPage } from './admin/TagsPage'
import { OrdersPage } from './admin/OrdersPage'
import { AIMonitoringPage } from './admin/AIMonitoringPage'
import { RevenueStatsPage } from './admin/RevenueStatsPage'
import { InstructorsRevenuePage } from './admin/InstructorsRevenuePage'
import { CoursesRevenuePage } from './admin/CoursesRevenuePage'
import { SystemConfigPage } from './admin/SystemConfigPage'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
    OverviewStats,
    UsersAnalytics,
    CoursesAnalytics,
    RevenueAnalytics,
    RecentActivities,
    SystemStats,
} from '../components/admin/dashboard'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Badge } from '../components/ui/badge'
import { NotificationBell } from '../components/Notifications/NotificationBell'
import { RefundsPage } from './admin/RefundsPage'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

type AdminSection =
    | 'dashboard'
    | 'users'
    | 'students'
    | 'instructors'
    | 'courses'
    | 'analytics'
    | 'orders'
    | 'refunds'
    | 'categories'
    | 'settings'
    | 'tags'
    | 'ai-monitoring'
    | 'revenue-stats'
    | 'instructors-revenue'
    | 'courses-revenue'

interface MenuItem {
    id: AdminSection
    label: string
    icon: React.ElementType
    color?: string
    children?: MenuItem[]
}

interface MenuGroup {
    label: string
    items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
    {
        label: 'Tổng quan',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: LayoutDashboard,
                color: 'text-blue-400',
            },
            {
                id: 'analytics',
                label: 'Thống kê/Phân tích',
                icon: BarChart3,
                color: 'text-yellow-400',
            },
        ],
    },
    {
        label: 'Quản lý người dùng',
        items: [
            {
                id: 'users',
                label: 'Người dùng',
                icon: Users,
                color: 'text-purple-400',
            },
        ],
    },
    {
        label: 'Quản lý khóa học',
        items: [
            {
                id: 'courses',
                label: 'Khóa học',
                icon: BookOpen,
                color: 'text-green-400',
            },
            {
                id: 'categories',
                label: 'Danh mục',
                icon: FolderTree,
                color: 'text-cyan-400',
            },
            { id: 'tags', label: 'Tags', icon: Tag, color: 'text-pink-400' },
        ],
    },
    {
        label: 'Quản lý đơn hàng',
        items: [
            {
                id: 'orders',
                label: 'Đơn hàng',
                icon: ShoppingCart,
                color: 'text-orange-400',
            },
            {
                id: 'refunds',
                label: 'Hoàn tiền',
                icon: RotateCcw,
                color: 'text-yellow-400',
            },
        ],
    },
    {
        label: 'Thống kê doanh thu',
        items: [
            {
                id: 'revenue-stats',
                label: 'Tổng quan',
                icon: ReceiptText,
                color: 'text-green-400',
            },
            {
                id: 'instructors-revenue',
                label: 'Giảng viên',
                icon: Users,
                color: 'text-blue-400',
            },
            {
                id: 'courses-revenue',
                label: 'Khóa học',
                icon: BookOpen,
                color: 'text-purple-400',
            },
        ],
    },
    {
        label: 'Giám sát AI',
        items: [
            {
                id: 'ai-monitoring',
                label: 'Lịch sử Chat AI',
                icon: Bot,
                color: 'text-purple-400',
            },
        ],
    },
    {
        label: 'Cấu hình hệ thống',
        items: [
            {
                id: 'settings',
                label: 'Cài đặt chung',
                icon: Settings,
                color: 'text-gray-400',
            },
        ],
    },
]

export function AdminDashboard() {
    const { user: currentUser, loading: authLoading, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [activeSection, setActiveSection] =
        useState<AdminSection>('dashboard')
    const [sectionLoading, setSectionLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    
    // Load expanded groups from localStorage on mount
    const loadExpandedGroups = (): Set<string> => {
        try {
            const saved = localStorage.getItem('admin-sidebar-expanded-groups')
            if (saved) {
                const parsed = JSON.parse(saved) as string[]
                return new Set(parsed)
            }
        } catch (error) {
            console.error('Error loading expanded groups from localStorage:', error)
        }
        // Default: all groups expanded
        return new Set(menuGroups.map((_, index) => index.toString()))
    }
    
    // Track expanded menu groups
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(loadExpandedGroups)
    
    // Save expanded groups to localStorage whenever they change
    useEffect(() => {
        try {
            const groupsArray = Array.from(expandedGroups)
            localStorage.setItem('admin-sidebar-expanded-groups', JSON.stringify(groupsArray))
        } catch (error) {
            console.error('Error saving expanded groups to localStorage:', error)
        }
    }, [expandedGroups])

    // Check if user is admin
    useEffect(() => {
        if (!authLoading) {
            if (!currentUser) {
                navigate('/login')
                return
            }
            if (currentUser.role !== 'ADMIN') {
                // RoleRoute component already handles permission check and shows toast
                navigate('/')
                return
            }
        }
    }, [currentUser, authLoading, navigate])

    const getBreadcrumb = () => {
        // Find the group and item for current section
        let currentGroup: MenuGroup | undefined
        let currentItem: MenuItem | undefined
        
        for (const group of menuGroups) {
            const item = group.items.find((item) => item.id === activeSection)
            if (item) {
                currentGroup = group
                currentItem = item
                break
            }
        }
        
        if (currentItem && currentGroup) {
            const CurrentIcon = currentItem.icon
            return (
                <div className='flex items-center gap-2'>
                    <span className='text-gray-400'>{currentGroup.label}</span>
                    <ChevronRight className='h-4 w-4 text-gray-500' />
                    <div className='flex items-center gap-2'>
                        <CurrentIcon className='h-5 w-5 text-blue-500' />
                        <span className='text-white'>{currentItem.label}</span>
                    </div>
                </div>
            )
        }
        
        return (
            <div className='flex items-center gap-2'>
                <LayoutDashboard className='h-5 w-5 text-blue-500' />
                <span className='text-white'>Admin Dashboard</span>
            </div>
        )
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardOverview />
            case 'users':
                return (
                    <div className='h-full'>
                        <UsersPage />
                    </div>
                )
            case 'courses':
                return (
                    <div className='h-full'>
                        <AdminCoursesPage />
                    </div>
                )
            case 'analytics':
                return <AnalyticsView />
            case 'orders':
                return (
                    <div className='h-full'>
                        <OrdersPage />
                    </div>
                )
            case 'refunds':
                return (
                    <div className='h-full'>
                        <RefundsPage />
                    </div>
                )
            case 'categories':
                return <CategoriesManagement />
            case 'tags':
                return <TagsManagement />
            case 'settings':
                return (
                    <div className='h-full'>
                        <SystemConfigPage />
                    </div>
                )
            case 'ai-monitoring':
                return <AIMonitoringPage />
            case 'revenue-stats':
                return (
                    <div className='h-full'>
                        <RevenueStatsPage />
                    </div>
                )
            case 'instructors-revenue':
                return (
                    <div className='h-full'>
                        <InstructorsRevenuePage />
                    </div>
                )
            case 'courses-revenue':
                return (
                    <div className='h-full'>
                        <CoursesRevenuePage />
                    </div>
                )
            default:
                return <DashboardOverview />
        }
    }

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className='flex items-center justify-center h-screen bg-background'>
                <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
            </div>
        )
    }

    // Don't render if not admin (redirect is handled in useEffect)
    if (!currentUser || currentUser.role !== 'ADMIN') {
        return null
    }

    return (
        <div className='flex h-screen bg-background text-foreground overflow-hidden'>
            {/* Sidebar */}
            <aside
                className={`${
                    sidebarOpen ? 'w-64' : 'w-0'
                } bg-black border-r border-[#2D2D2D] transition-all duration-300 overflow-hidden flex flex-col`}
            >
                {/* Sidebar Header */}
                <div className='p-4 border-b border-[#2D2D2D] flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-black border border-white/30'>
                            <BookOpen className='h-6 w-6 text-white' />
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-xl font-semibold text-white'>
                                EduLearn
                            </span>
                            <span className='text-xs text-gray-400'>
                                Admin Panel
                            </span>
                        </div>
                    </div>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => setSidebarOpen(false)}
                        className='text-gray-400 hover:text-white hover:bg-[#2D2D2D]'
                    >
                        <X className='h-5 w-5' />
                    </Button>
                </div>

                {/* Menu Items */}
                <nav className='flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4'>
                    {menuGroups.map((group, groupIndex) => {
                        const groupKey = groupIndex.toString()
                        const isExpanded = expandedGroups.has(groupKey)
                        
                        const toggleGroup = () => {
                            setExpandedGroups((prev) => {
                                const newSet = new Set(prev)
                                if (newSet.has(groupKey)) {
                                    newSet.delete(groupKey)
                                } else {
                                    newSet.add(groupKey)
                                }
                                return newSet
                            })
                        }

                        return (
                            <div key={groupIndex} className=''>
                                {/* Group Label with Toggle */}
                                <button
                                    onClick={toggleGroup}
                                    className='w-full px-4 py-2 flex items-center justify-between hover:bg-[#1F1F1F] rounded-lg transition-colors group'
                                >
                                    <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-400'>
                                        {group.label}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp className='h-4 w-4 text-gray-500 group-hover:text-gray-400' />
                                    ) : (
                                        <ChevronDown className='h-4 w-4 text-gray-500 group-hover:text-gray-400' />
                                    )}
                                </button>

                                {/* Group Items - Conditionally rendered */}
                                {isExpanded && group.items.map((item) => {
                                const Icon = item.icon
                                const isActive = activeSection === item.id
                                const itemColor = item.color || 'text-gray-400'

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (item.id !== activeSection) {
                                                setSectionLoading(true)
                                                setActiveSection(item.id)
                                                // Reset loading after a short delay to allow component to mount
                                                setTimeout(() => {
                                                    setSectionLoading(false)
                                                }, 200)
                                            }
                                        }}
                                        disabled={sectionLoading}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                                            isActive
                                                ? 'bg-gradient-to-r from-[#2D2D2D] to-[#252525] text-white shadow-lg'
                                                : 'text-gray-400 hover:bg-gradient-to-r hover:from-[#1F1F1F] hover:to-[#1A1A1A] hover:text-white hover:shadow-md'
                                        } ${
                                            sectionLoading
                                                ? 'opacity-50 cursor-wait'
                                                : ''
                                        }`}
                                    >
                                        <Icon
                                            className='h-5 w-5 transition-colors text-gray-400'
                                        />
                                        <span className='font-medium text-sm'>
                                            {item.label}
                                        </span>
                                    </button>
                                )
                            })}
                            </div>
                        )
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className='p-4 border-t border-[#2D2D2D]'>
                    <Link
                        to='/'
                        className='flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                    >
                        <X className='h-5 w-5' />
                        <span>Thoát Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className='flex-1 flex flex-col overflow-hidden'>
                {/* Top Bar */}
                <header className='bg-black border-b border-[#2D2D2D] px-6 py-4 flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                        {!sidebarOpen && (
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => setSidebarOpen(true)}
                                className='text-gray-400 hover:text-white hover:bg-[#2D2D2D]'
                            >
                                <Menu className='h-5 w-5' />
                            </Button>
                        )}
                        <h1 className='text-2xl font-bold text-white'>
                            {getBreadcrumb()}
                        </h1>
                    </div>

                    {/* Right Side Actions */}
                    <div className='flex items-center gap-3'>
                        {/* Theme Toggle */}
                        <DarkOutlineButton
                            size='sm'
                            onClick={toggleTheme}
                            className='hidden md:flex items-center gap-2'
                            title={
                                theme === 'dark'
                                    ? 'Chuyển sang Light Mode'
                                    : 'Chuyển sang Dark Mode'
                            }
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Moon className='h-4 w-4' />
                                    <span>Dark Mode</span>
                                </>
                            ) : (
                                <>
                                    <Sun className='h-4 w-4' />
                                    <span>Light Mode</span>
                                </>
                            )}
                        </DarkOutlineButton>
                        <DarkOutlineButton
                            size='icon'
                            onClick={toggleTheme}
                            className='md:hidden'
                            title={
                                theme === 'dark'
                                    ? 'Chuyển sang Light Mode'
                                    : 'Chuyển sang Dark Mode'
                            }
                        >
                            {theme === 'dark' ? (
                                <Moon className='h-5 w-5' />
                            ) : (
                                <Sun className='h-5 w-5' />
                            )}
                        </DarkOutlineButton>

                        {/* Notifications */}
                        <NotificationBell />

                        {/* User Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className='relative h-10 w-10 rounded-full border border-white/30 cursor-pointer hover:border-white transition-colors'>
                                    <Avatar className='h-full w-full'>
                                        <AvatarImage
                                            src={
                                                currentUser?.avatarUrl ||
                                                currentUser?.avatar
                                            }
                                            alt={
                                                currentUser?.fullName || 'Admin'
                                            }
                                        />
                                        <AvatarFallback className='bg-blue-600 text-white'>
                                            {currentUser?.fullName
                                                ? currentUser.fullName
                                                      .split(' ')
                                                      .map((n) => n[0])
                                                      .join('')
                                                : 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align='end'
                                className='w-64 bg-[#1A1A1A] border-[#2D2D2D] shadow-xl'
                            >
                                <DropdownMenuLabel className='text-white px-3 py-3'>
                                    <div className='flex items-center gap-3'>
                                        <Avatar className='h-10 w-10 border border-white/20'>
                                            <AvatarImage
                                                src={
                                                    currentUser?.avatarUrl ||
                                                    currentUser?.avatar
                                                }
                                                alt={
                                                    currentUser?.fullName ||
                                                    'Admin'
                                                }
                                            />
                                            <AvatarFallback className='bg-blue-600 text-white text-sm'>
                                                {currentUser?.fullName
                                                    ? currentUser.fullName
                                                          .split(' ')
                                                          .map((n) => n[0])
                                                          .join('')
                                                    : 'A'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-white font-medium truncate'>
                                                {currentUser?.fullName ||
                                                    'Admin'}
                                            </p>
                                            <p className='text-xs text-gray-400 truncate'>
                                                {currentUser?.email || ''}
                                            </p>
                                            <div className='mt-1.5'>
                                                <Badge className='text-xs px-1.5 py-0.5 bg-purple-600/20 text-purple-400 border-purple-500/30 border'>
                                                    Quản trị viên
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className='bg-[#2D2D2D] my-1' />

                                {/* Dashboard Menu Items */}
                                <DropdownMenuLabel className='text-white px-2 py-1.5'>
                                    <div className='flex items-center'>
                                        <LayoutDashboard className='mr-2 h-4 w-4' />
                                        <span className='font-medium'>
                                            Bảng điều khiển
                                        </span>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/admin/dashboard'
                                        className='flex items-center pl-6'
                                    >
                                        <Shield className='mr-2 h-4 w-4 text-gray-300' />
                                        Quản trị viên
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/instructor/dashboard'
                                        className='flex items-center pl-6'
                                    >
                                        <GraduationCap className='mr-2 h-4 w-4 text-gray-300' />
                                        Giảng viên
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/dashboard'
                                        className='flex items-center pl-6'
                                    >
                                        <UserIcon className='mr-2 h-4 w-4 text-gray-300' />
                                        Học viên
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/orders'
                                        className='flex items-center'
                                    >
                                        <ReceiptText className='mr-2 h-4 w-4 text-gray-300' />
                                        Đơn hàng
                                    </Link>
                                </DropdownMenuItem>

                                {/* Common menu items */}
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/profile'
                                        className='flex items-center'
                                    >
                                        <UserIcon className='mr-2 h-4 w-4 text-gray-300' />
                                        Hồ sơ
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/settings'
                                        className='flex items-center'
                                    >
                                        <Settings className='mr-2 h-4 w-4 text-gray-300' />
                                        Cài đặt
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className='bg-[#2D2D2D] my-1' />
                                <DropdownMenuItem
                                    onClick={async () => {
                                        await logout()
                                        navigate('/')
                                    }}
                                    className='text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer focus:bg-red-500/10 focus:text-red-300'
                                >
                                    <LogOut className='mr-2 h-4 w-4' />
                                    Đăng xuất
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Content Area */}
                <main className='flex-1 overflow-y-auto bg-background p-6 relative custom-scrollbar'>
                    {sectionLoading && (
                        <div className='absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center'>
                            <div className='flex flex-col items-center gap-3'>
                                <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
                                <p className='text-sm text-gray-400'>
                                    Đang tải...
                                </p>
                            </div>
                        </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    )
}

// Dashboard Overview Component
function DashboardOverview() {
    return (
        <div className='space-y-6'>
            <OverviewStats />
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <RecentActivities />
                <SystemStats />
            </div>
        </div>
    )
}

// Analytics View Component
function AnalyticsView() {
    return (
        <div className='space-y-6'>
            <UsersAnalytics />
            <CoursesAnalytics />
            <RevenueAnalytics />
        </div>
    )
}

// Categories Management Component
function CategoriesManagement() {
    return (
        <div className='h-full'>
            <CategoriesPage />
        </div>
    )
}

// Tags Management Component
function TagsManagement() {
    return (
        <div className='h-full'>
            <TagsPage />
        </div>
    )
}

// Settings View Component
function SettingsView() {
    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
                        <Settings className='h-6 w-6' />
                        Cài đặt chung
                    </h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Quản lý các cài đặt chung của hệ thống
                    </p>
                </div>
            </div>

            {/* Settings Content */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Cài đặt Hệ thống
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                        Cấu hình các thiết lập hệ thống
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-gray-400'>
                        Chức năng cài đặt hệ thống sẽ được triển khai sau.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
