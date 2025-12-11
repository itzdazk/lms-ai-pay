import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { DarkOutlineButton } from './ui/buttons'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from './ui/dropdown-menu'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet'
import {
    Bell,
    Search,
    BookOpen,
    User,
    Settings,
    LogOut,
    LayoutDashboard,
    Menu,
    Mic,
    MessageCircle,
    Sun,
    Moon,
    Users,
    BookMarked,
    ChevronRight,
    Shield,
    GraduationCap,
} from 'lucide-react'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { useTheme } from '../contexts/ThemeContext'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const { theme, toggleTheme } = useTheme()
    const { user, logout, isAuthenticated } = useAuth()

    const handleVoiceSearch = () => {
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
            console.log('Voice search:', transcript)
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
    }

    const handleLogout = async () => {
        if (isLoggingOut) return

        try {
            setIsLoggingOut(true)
            await logout()
            toast.success('Đăng xuất thành công!')
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Có lỗi xảy ra khi đăng xuất')
        } finally {
            setIsLoggingOut(false)
        }
    }

    // Helper function để render menu items dựa trên role
    const renderRoleSpecificMenuItems = () => {
        if (!user) return null

        switch (user.role) {
            case 'INSTRUCTOR':
                return (
                    <>
                        <DropdownMenuLabel className='text-white px-2 py-1.5'>
                            <div className='flex items-center'>
                                <LayoutDashboard className='mr-2 h-4 w-4 text-blue-400' />
                                <span className='font-medium'>Dashboard</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            asChild
                            className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                        >
                            <Link
                                to='/instructor/dashboard'
                                className='flex items-center pl-6'
                            >
                                <GraduationCap className='mr-2 h-4 w-4 text-blue-400' />
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
                                <User className='mr-2 h-4 w-4 text-green-400' />
                                Học viên
                            </Link>
                        </DropdownMenuItem>
                    </>
                )
            case 'ADMIN':
                return (
                    <>
                        <DropdownMenuLabel className='text-white px-2 py-1.5'>
                            <div className='flex items-center'>
                                <LayoutDashboard className='mr-2 h-4 w-4 text-purple-400' />
                                <span className='font-medium'>Dashboard</span>
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
                                <Shield className='mr-2 h-4 w-4 text-purple-400' />
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
                                <GraduationCap className='mr-2 h-4 w-4 text-blue-400' />
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
                                <User className='mr-2 h-4 w-4 text-green-400' />
                                Học viên
                            </Link>
                        </DropdownMenuItem>
                    </>
                )
            default:
                return (
                    <>
                        <DropdownMenuItem
                            asChild
                            className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                        >
                            <Link
                                to='/dashboard'
                                className='flex items-center'
                            >
                                <LayoutDashboard className='mr-2 h-4 w-4 text-green-400' />
                                Dashboard
                            </Link>
                        </DropdownMenuItem>
                    </>
                )
        }
    }

    // Helper function để render mobile menu items dựa trên role
    const renderMobileRoleSpecificMenuItems = () => {
        if (!user) return null

        switch (user.role) {
            case 'INSTRUCTOR':
                return (
                    <>
                        <div className='px-4 py-2'>
                            <div className='flex items-center gap-2 text-gray-400 text-sm font-medium'>
                                <LayoutDashboard className='h-4 w-4 text-blue-400' />
                                Dashboard
                            </div>
                        </div>
                        <Link
                            to='/instructor/dashboard'
                            className='flex items-center gap-3 px-4 py-3 pl-8 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <GraduationCap className='h-5 w-5 text-blue-400' />
                            Giảng viên
                        </Link>
                        <Link
                            to='/dashboard'
                            className='flex items-center gap-3 px-4 py-3 pl-8 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <User className='h-5 w-5 text-green-400' />
                            Học viên
                        </Link>
                    </>
                )
            case 'ADMIN':
                return (
                    <>
                        <div className='px-4 py-2'>
                            <div className='flex items-center gap-2 text-gray-400 text-sm font-medium'>
                                <LayoutDashboard className='h-4 w-4 text-purple-400' />
                                Dashboard
                            </div>
                        </div>
                        <Link
                            to='/admin/dashboard'
                            className='flex items-center gap-3 px-4 py-3 pl-8 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <Shield className='h-5 w-5 text-purple-400' />
                            Quản trị viên
                        </Link>
                        <Link
                            to='/instructor/dashboard'
                            className='flex items-center gap-3 px-4 py-3 pl-8 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <GraduationCap className='h-5 w-5 text-blue-400' />
                            Giảng viên
                        </Link>
                        <Link
                            to='/dashboard'
                            className='flex items-center gap-3 px-4 py-3 pl-8 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <User className='h-5 w-5 text-green-400' />
                            Học viên
                        </Link>
                    </>
                )
            default:
                return (
                    <Link
                        to='/dashboard'
                        className='flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <LayoutDashboard className='h-5 w-5' />
                        Dashboard
                    </Link>
                )
        }
    }

    return (
        <header className='sticky top-0 z-50 w-full border-b border-[#2D2D2D] bg-black'>
            <div className='container mx-auto flex h-16 items-center justify-between px-4'>
                {/* Logo */}
                <Link to='/' className='flex items-center gap-2'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-black border border-white/30'>
                        <BookOpen className='h-6 w-6 text-white' />
                    </div>
                    <span className='text-xl font-semibold text-white'>
                        EduLearn
                    </span>
                </Link>

                {/* Navigation Links - Desktop */}
                <nav className='hidden lg:flex items-center gap-6 ml-6'>
                    <Link
                        to='/courses'
                        className='text-gray-300 hover:text-gray-600 transition-colors font-semibold'
                    >
                        Khóa học
                    </Link>
                    <Link
                        to='/ai-chat'
                        className='text-gray-300 hover:text-gray-600 transition-colors font-semibold'
                    >
                        AI Chat
                    </Link>
                    <Link
                        to='/about'
                        className='text-gray-300 hover:text-gray-600 transition-colors font-semibold'
                    >
                        Về chúng tôi
                    </Link>
                </nav>

                {/* Search Bar - Desktop */}
                <div className='hidden md:flex flex-1 max-w-xl mx-8'>
                    <div className='relative w-full'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            type='search'
                            placeholder='Tìm kiếm khóa học...'
                            className='w-full pl-10 pr-20 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                        />
                        <Button
                            size='icon'
                            variant='ghost'
                            className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                                isListening
                                    ? 'text-red-500 animate-pulse'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                            onClick={handleVoiceSearch}
                            title='Tìm kiếm bằng giọng nói'
                        >
                            <Mic className='h-4 w-4' />
                        </Button>
                    </div>
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

                    {/* Notifications - Only show when authenticated */}
                    {isAuthenticated && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='relative text-white hover:bg-[#1F1F1F]'
                                >
                                    <Bell className='h-5 w-5' />
                                    <Badge className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600'>
                                        3
                                    </Badge>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align='end'
                                className='w-[480px] max-w-[90vw] bg-[#1A1A1A] border-[#2D2D2D]'
                            >
                                <DropdownMenuLabel className='text-white flex items-center justify-between gap-2'>
                                    <span>Thông báo</span>
                                    <Badge className='bg-blue-600 text-white'>
                                        Mới
                                    </Badge>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className='bg-[#2D2D2D]' />
                                <div className='max-h-[420px] overflow-y-auto divide-y divide-[#2D2D2D]'>
                                    <div className='p-4 hover:bg-[#1F1F1F] cursor-pointer'>
                                        <p className='text-sm text-white font-semibold'>
                                            Bạn đã hoàn thành bài học "React
                                            Hooks"
                                        </p>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            2 giờ trước
                                        </p>
                                    </div>
                                    <div className='p-4 hover:bg-[#1F1F1F] cursor-pointer'>
                                        <p className='text-sm text-white font-semibold'>
                                            Khóa học "Next.js Pro" vừa được cập
                                            nhật
                                        </p>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            Hôm qua
                                        </p>
                                    </div>
                                    <div className='p-4 hover:bg-[#1F1F1F] cursor-pointer'>
                                        <p className='text-sm text-white font-semibold'>
                                            Bạn có chứng chỉ mới cần tải xuống
                                        </p>
                                        <p className='text-xs text-gray-500 mt-1'>
                                            2 ngày trước
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Auth Buttons - Only show when NOT authenticated */}
                    {!isAuthenticated && (
                        <div className='flex items-center gap-2'>
                            <Link to='/login'>
                                <DarkOutlineButton
                                    size='sm'
                                    className='hidden sm:flex'
                                >
                                    Đăng nhập
                                </DarkOutlineButton>
                            </Link>
                            <Link to='/register'>
                                <DarkOutlineButton
                                    size='sm'
                                    className='hidden sm:flex'
                                >
                                    Đăng ký
                                </DarkOutlineButton>
                            </Link>
                            {/* Mobile Auth Button */}
                            <Link to='/login' className='sm:hidden'>
                                <DarkOutlineButton
                                    size='sm'
                                >
                                    Đăng nhập
                                </DarkOutlineButton>
                            </Link>
                        </div>
                    )}

                    {/* User Menu - Only show when authenticated */}
                    {isAuthenticated && user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className='relative h-10 w-10 rounded-full border border-white/30 cursor-pointer hover:border-white transition-colors'>
                                    <Avatar className='h-full w-full'>
                                        <AvatarImage
                                            src={user.avatarUrl || undefined}
                                            alt={user.fullName}
                                        />
                                        <AvatarFallback className='bg-blue-600 text-white'>
                                            {user.fullName
                                                .split(' ')
                                                .map((n) => n[0])
                                                .join('')}
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
                                                src={user.avatarUrl || undefined}
                                                alt={user.fullName}
                                            />
                                            <AvatarFallback className='bg-blue-600 text-white text-sm'>
                                                {user.fullName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-white font-medium truncate'>
                                                {user.fullName}
                                            </p>
                                            <p className='text-xs text-gray-400 truncate'>
                                                {user.email}
                                            </p>
                                            <div className='mt-1.5'>
                                                <Badge
                                                    className={`text-xs px-1.5 py-0.5 ${
                                                        user.role === 'ADMIN'
                                                            ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                                                            : user.role ===
                                                              'INSTRUCTOR'
                                                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                                                            : 'bg-green-600/20 text-green-400 border-green-500/30'
                                                    } border`}
                                                >
                                                    {user.role === 'ADMIN'
                                                        ? 'Quản trị viên'
                                                        : user.role ===
                                                          'INSTRUCTOR'
                                                        ? 'Giảng viên'
                                                        : 'Học viên'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className='bg-[#2D2D2D] my-1' />

                                {/* Role-specific menu items */}
                                {renderRoleSpecificMenuItems()}

                                {/* Common menu items */}
                                <DropdownMenuItem
                                    asChild
                                    className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                                >
                                    <Link
                                        to='/profile'
                                        className='flex items-center'
                                    >
                                        <User className='mr-2 h-4 w-4 text-gray-300' />
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
                                    className='text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer focus:bg-red-500/10 focus:text-red-300'
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                >
                                    {isLoggingOut ? (
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                    ) : (
                                        <LogOut className='mr-2 h-4 w-4' />
                                    )}
                                    {isLoggingOut
                                        ? 'Đang đăng xuất...'
                                        : 'Đăng xuất'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Mobile Menu Button */}
                    <Sheet
                        open={isMobileMenuOpen}
                        onOpenChange={setIsMobileMenuOpen}
                    >
                        <SheetTrigger asChild>
                            <Button
                                variant='ghost'
                                size='icon'
                                className='lg:hidden text-white hover:bg-[#1F1F1F]'
                            >
                                <Menu className='h-5 w-5' />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side='right'
                            className='w-[300px] bg-[#1A1A1A] border-[#2D2D2D]'
                        >
                            <SheetHeader>
                                <SheetTitle className='text-white'>
                                    Menu
                                </SheetTitle>
                            </SheetHeader>
                            <div className='mt-8 space-y-4'>
                                {/* Mobile Search */}
                                <div className='relative'>
                                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                    <Input
                                        type='search'
                                        placeholder='Tìm kiếm...'
                                        className='w-full pl-10 pr-20 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                                    />
                                    <Button
                                        size='icon'
                                        variant='ghost'
                                        className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                                            isListening
                                                ? 'text-red-500'
                                                : 'text-gray-400'
                                        }`}
                                        onClick={handleVoiceSearch}
                                    >
                                        <Mic className='h-4 w-4' />
                                    </Button>
                                </div>

                                {/* Mobile Theme Toggle */}
                                <DarkOutlineButton
                                    onClick={() => {
                                        toggleTheme()
                                    }}
                                    className='w-full'
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <Sun className='h-4 w-4 mr-2' />
                                            Chuyển sang Light Mode
                                        </>
                                    ) : (
                                        <>
                                            <Moon className='h-4 w-4 mr-2' />
                                            Chuyển sang Dark Mode
                                        </>
                                    )}
                                </DarkOutlineButton>

                                {/* Mobile Navigation Links */}
                                <nav className='flex flex-col space-y-2'>
                                    <Link
                                        to='/courses'
                                        className='flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        <BookOpen className='h-5 w-5' />
                                        Khóa học
                                    </Link>
                                    {isAuthenticated &&
                                        renderMobileRoleSpecificMenuItems()}
                                    <Link
                                        to='/ai-chat'
                                        className='flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        <MessageCircle className='h-5 w-5' />
                                        AI Chat
                                    </Link>
                                    <Link
                                        to='/about'
                                        className='flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1F1F1F] hover:text-white transition-colors'
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        <User className='h-5 w-5' />
                                        Về chúng tôi
                                    </Link>
                                </nav>

                                {/* Mobile User Info - Only show when authenticated */}
                                {isAuthenticated && user && (
                                    <div className='pt-4 border-t border-[#2D2D2D]'>
                                        <div className='flex items-center gap-3 px-4 py-3'>
                                            <Avatar>
                                                <AvatarImage
                                                    src={
                                                        user.avatarUrl ||
                                                        undefined
                                                    }
                                                    alt={user.fullName}
                                                />
                                                <AvatarFallback className='bg-blue-600 text-white'>
                                                    {user.fullName
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className='text-sm font-medium text-white'>
                                                    {user.fullName}
                                                </p>
                                                <p className='text-xs text-gray-500'>
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className='mt-2 space-y-1'>
                                            <Link
                                                to='/profile'
                                                className='block px-4 py-2 text-sm text-gray-300 hover:bg-[#1F1F1F] hover:text-white rounded-lg transition-colors'
                                                onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                }
                                            >
                                                Hồ sơ
                                            </Link>
                                            <Link
                                                to='/settings'
                                                className='block px-4 py-2 text-sm text-gray-300 hover:bg-[#1F1F1F] hover:text-white rounded-lg transition-colors'
                                                onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                }
                                            >
                                                Cài đặt
                                            </Link>
                                            <button
                                                className='block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#1F1F1F] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                            >
                                                {isLoggingOut ? (
                                                    <span className='flex items-center'>
                                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                        Đang đăng xuất...
                                                    </span>
                                                ) : (
                                                    'Đăng xuất'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
