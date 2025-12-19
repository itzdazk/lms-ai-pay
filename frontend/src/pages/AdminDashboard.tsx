import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  BarChart3,
  Settings,
  ShoppingCart,
  FolderTree,
  LayoutDashboard,
  Menu,
  X,
  Loader2,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ChevronRight,
  Shield,
  GraduationCap,
  Tag,
} from 'lucide-react';
import { dashboardApi } from '../lib/api/dashboard';
import { UsersPage } from './admin/UsersPage';
import { CoursesPage as AdminCoursesPage } from './admin/CoursesPage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

type AdminSection = 'dashboard' | 'users' | 'students' | 'instructors' | 'courses' | 'analytics' | 'orders' | 'categories' | 'settings' | 'tags';

interface MenuItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  color?: string;
  children?: MenuItem[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400' },
      { id: 'analytics', label: 'Thống kê/Phân tích', icon: BarChart3, color: 'text-yellow-400' },
    ],
  },
  {
    label: 'Quản lý người dùng',
    items: [
      { id: 'users', label: 'Người dùng', icon: Users, color: 'text-purple-400' },
    ],
  },
  {
    label: 'Quản lý khóa học',
    items: [
      { id: 'courses', label: 'Khóa học', icon: BookOpen, color: 'text-green-400' },
      { id: 'categories', label: 'Danh mục', icon: FolderTree, color: 'text-cyan-400' },
      { id: 'tags', label: 'Tags', icon: Tag, color: 'text-pink-400' },
    ],
  },
  {
    label: 'Quản lý đơn hàng',
    items: [
      { id: 'orders', label: 'Đơn hàng', icon: ShoppingCart, color: 'text-orange-400' },
    ],
  },
];

export function AdminDashboard() {
  const { user: currentUser, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      if (currentUser.role !== 'ADMIN') {
        // RoleRoute component already handles permission check and shows toast
        navigate('/');
        return;
      }
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (activeSection === 'dashboard') {
      loadDashboard();
    }
  }, [activeSection]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const dashboardData = await dashboardApi.getAdminDashboard();
      setDashboard(dashboardData);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      // Error toast is already shown by API client interceptor
    } finally {
      setLoading(false);
    }
  };

  // Extract stats from dashboard response
  const summary = dashboard?.summary || {};
  const displayStats = {
    totalUsers: summary.users?.total || 0,
    totalStudents: summary.users?.students || 0,
    totalInstructors: summary.users?.instructors || 0,
    totalCourses: summary.courses?.total || 0,
    publishedCourses: summary.courses?.published || 0,
    totalRevenue: summary.revenue?.total || 0,
    growth: summary.users?.growthPercentage || 0,
    featuredCourses: summary.courses?.featured || 0,
  };

  const getBreadcrumb = () => {
    if (activeSection === 'dashboard') {
      return (
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-blue-500" />
          <span className="text-white">Dashboard</span>
        </div>
      );
    }
    const currentItem = menuGroups
      .flatMap((group) => group.items)
      .find((item) => item.id === activeSection);
    if (currentItem) {
      const CurrentIcon = currentItem.icon;
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <ChevronRight className="h-4 w-4 text-gray-500" />
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-5 w-5 text-blue-500" />
            <span className="text-white">{currentItem.label}</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-blue-500" />
        <span className="text-white">Admin Dashboard</span>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview loading={loading} stats={displayStats} />;
      case 'users':
        return (
          <div className="h-full">
            <UsersPage />
          </div>
        );
      case 'courses':
        return (
          <div className="h-full">
            <AdminCoursesPage />
          </div>
        );
      case 'analytics':
        return <AnalyticsView stats={displayStats} />;
      case 'orders':
        return <OrdersManagement />;
      case 'categories':
        return <CategoriesManagement />;
      case 'tags':
        return <TagsManagement />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardOverview loading={loading} stats={displayStats} />;
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Don't render if not admin (redirect is handled in useEffect)
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-black border-r border-[#2D2D2D] transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#2D2D2D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black border border-white/30">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-white">EduLearn</span>
              <span className="text-xs text-gray-400">Admin Panel</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white hover:bg-[#2D2D2D]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              {/* Group Label */}
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </span>
              </div>
              
              {/* Group Items */}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                const itemColor = item.color || 'text-gray-400';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id !== activeSection) {
                        setSectionLoading(true);
                        setActiveSection(item.id);
                        // Reset loading after a short delay to allow component to mount
                        setTimeout(() => {
                          setSectionLoading(false);
                        }, 200);
                      }
                    }}
                    disabled={sectionLoading}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2D2D2D] to-[#252525] text-white shadow-lg shadow-purple-500/10 border border-purple-500/20'
                        : 'text-gray-400 hover:bg-gradient-to-r hover:from-[#1F1F1F] hover:to-[#1A1A1A] hover:text-white hover:shadow-md border border-transparent'
                    } ${sectionLoading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <Icon className={`h-5 w-5 transition-colors ${isActive ? itemColor : 'group-hover:' + itemColor}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#2D2D2D]">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-[#1F1F1F] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
            <span>Thoát Admin</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-black border-b border-[#2D2D2D] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-400 hover:text-white hover:bg-[#2D2D2D]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-2xl font-bold text-white">
              {getBreadcrumb()}
            </h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <DarkOutlineButton
              size="sm"
              onClick={toggleTheme}
              className="hidden md:flex items-center gap-2"
              title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </DarkOutlineButton>
            <DarkOutlineButton
              size="icon"
              onClick={toggleTheme}
              className="md:hidden"
              title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
            >
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </DarkOutlineButton>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#1F1F1F]">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[480px] max-w-[90vw] bg-[#1A1A1A] border-[#2D2D2D]">
                <DropdownMenuLabel className="text-white flex items-center justify-between gap-2">
                  <span>Thông báo</span>
                  <Badge className="bg-blue-600 text-white">Mới</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2D2D2D]" />
                <div className="max-h-[420px] overflow-y-auto divide-y divide-[#2D2D2D]">
                  <div className="p-4 hover:bg-[#1F1F1F] cursor-pointer">
                    <p className="text-sm text-white font-semibold">Người dùng mới đăng ký</p>
                    <p className="text-xs text-gray-500 mt-1">5 phút trước</p>
                  </div>
                  <div className="p-4 hover:bg-[#1F1F1F] cursor-pointer">
                    <p className="text-sm text-white font-semibold">Khóa học mới được tạo</p>
                    <p className="text-xs text-gray-500 mt-1">10 phút trước</p>
                  </div>
                  <div className="p-4 hover:bg-[#1F1F1F] cursor-pointer">
                    <p className="text-sm text-white font-semibold">Thanh toán thành công</p>
                    <p className="text-xs text-gray-500 mt-1">1 giờ trước</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative h-10 w-10 rounded-full border border-white/30 cursor-pointer hover:border-white transition-colors">
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={currentUser?.avatarUrl || currentUser?.avatar}
                      alt={currentUser?.fullName || 'Admin'}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {currentUser?.fullName
                        ? currentUser.fullName.split(' ').map(n => n[0]).join('')
                        : 'A'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#1A1A1A] border-[#2D2D2D] shadow-xl">
                <DropdownMenuLabel className="text-white px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-white/20">
                      <AvatarImage
                        src={currentUser?.avatarUrl || currentUser?.avatar}
                        alt={currentUser?.fullName || 'Admin'}
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {currentUser?.fullName
                          ? currentUser.fullName.split(' ').map(n => n[0]).join('')
                          : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {currentUser?.fullName || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {currentUser?.email || ''}
                      </p>
                      <div className="mt-1.5">
                        <Badge className="text-xs px-1.5 py-0.5 bg-purple-600/20 text-purple-400 border-purple-500/30 border">
                          Quản trị viên
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2D2D2D] my-1" />
                
                {/* Dashboard Menu Items */}
                <DropdownMenuLabel className="text-white px-2 py-1.5">
                  <div className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4 text-purple-400" />
                    <span className="font-medium">Dashboard</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  asChild
                  className="text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center pl-6"
                  >
                    <Shield className="mr-2 h-4 w-4 text-purple-400" />
                    Quản trị viên
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <Link
                    to="/instructor/dashboard"
                    className="flex items-center pl-6"
                  >
                    <GraduationCap className="mr-2 h-4 w-4 text-blue-400" />
                    Giảng viên
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <Link
                    to="/dashboard"
                    className="flex items-center pl-6"
                  >
                    <UserIcon className="mr-2 h-4 w-4 text-green-400" />
                    Học viên
                  </Link>
                </DropdownMenuItem>

                {/* Common menu items */}
                <DropdownMenuItem
                  asChild
                  className="text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <Link
                    to="/profile"
                    className="flex items-center"
                  >
                    <UserIcon className="mr-2 h-4 w-4 text-gray-300" />
                    Hồ sơ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="text-white hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  <Link
                    to="/settings"
                    className="flex items-center"
                  >
                    <Settings className="mr-2 h-4 w-4 text-gray-300" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2D2D2D] my-1" />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer focus:bg-red-500/10 focus:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-6 relative">
          {sectionLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-400">Đang tải...</p>
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview({ loading, stats }: { loading: boolean; stats: any }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalStudents || 0} học viên • {stats.totalInstructors || 0} giảng viên
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCourses || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Khóa học trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng thu nhập</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tăng trưởng</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.growth !== undefined
                ? `${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(1)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">So với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white">Thống kê người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">Người dùng hoạt động</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                <div className="flex items-center gap-3">
                  <UserX className="h-5 w-5 text-red-500" />
                  <span className="text-gray-300">Người dùng bị khóa</span>
                </div>
                <span className="text-2xl font-bold text-white">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white">Thống kê khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                <span className="text-gray-300">Tổng khóa học</span>
                <span className="text-2xl font-bold text-white">{stats.totalCourses || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                <span className="text-gray-300">Khóa học nổi bật</span>
                <span className="text-2xl font-bold text-white">{stats.featuredCourses || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// Analytics View Component
function AnalyticsView({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Phân tích và Báo cáo</CardTitle>
          <CardDescription className="text-gray-400">
            Xem các báo cáo chi tiết về hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#1F1F1F] rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Thống kê người dùng</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tổng người dùng</span>
                  <span className="text-white font-bold">{stats.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Học viên</span>
                  <span className="text-white font-bold">{stats.totalStudents || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Giảng viên</span>
                  <span className="text-white font-bold">{stats.totalInstructors || 0}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#1F1F1F] rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Thống kê khóa học</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Tổng khóa học</span>
                  <span className="text-white font-bold">{stats.totalCourses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Đã xuất bản</span>
                  <span className="text-white font-bold">{stats.publishedCourses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Nổi bật</span>
                  <span className="text-white font-bold">{stats.featuredCourses || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-gray-400 text-sm">Biểu đồ và phân tích chi tiết sẽ được triển khai sau.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Orders Management Component
function OrdersManagement() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Quản lý Đơn hàng</CardTitle>
          <CardDescription className="text-gray-400">
            Xem và quản lý tất cả đơn hàng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chức năng quản lý đơn hàng sẽ được triển khai sau.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Categories Management Component
function CategoriesManagement() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Quản lý Danh mục</CardTitle>
          <CardDescription className="text-gray-400">
            Quản lý các danh mục và thẻ khóa học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chức năng quản lý danh mục sẽ được triển khai sau.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Tags Management Component
function TagsManagement() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Quản lý Tags</CardTitle>
          <CardDescription className="text-gray-400">
            Quản lý các tags của khóa học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chức năng quản lý tags sẽ được triển khai sau.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings View Component
function SettingsView() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Cài đặt Hệ thống</CardTitle>
          <CardDescription className="text-gray-400">
            Cấu hình các thiết lập hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chức năng cài đặt hệ thống sẽ được triển khai sau.</p>
        </CardContent>
      </Card>
    </div>
  );
}
