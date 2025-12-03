import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { mockUsers, mockCourses, formatPrice } from '../lib/mockData';

export function AdminDashboard() {
  const stats = {
    totalUsers: mockUsers.length,
    totalStudents: mockUsers.filter(u => u.role === 'student').length,
    totalInstructors: mockUsers.filter(u => u.role === 'instructor').length,
    totalCourses: mockCourses.length,
    totalRevenue: mockCourses.reduce((sum, c) => {
      if (c.is_free) return sum;
      return sum + (c.discount_price || c.original_price) * c.enrolled_count;
    }, 0),
  };

  return (
    <div className="container mx-auto px-4 py-4 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Quản lý hệ thống và người dùng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalStudents} học viên • {stats.totalInstructors} giảng viên
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">Khóa học trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng thu nhập</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tăng trưởng</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">+12.5%</div>
            <p className="text-xs text-gray-500 mt-1">So với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="w-full justify-start bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-1">
          <TabsTrigger
            value="users"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <Users className="h-4 w-4 mr-2" />
            Người dùng
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Khóa học
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Phân tích
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Quản lý người dùng</CardTitle>
              <CardDescription className="text-gray-400">
                Danh sách tất cả người dùng trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                    <TableHead className="text-gray-300">Người dùng</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Vai trò</TableHead>
                    <TableHead className="text-gray-300">Trạng thái</TableHead>
                    <TableHead className="text-right text-gray-300">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map(user => (
                    <TableRow key={user.id} className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                            {user.full_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.full_name}</p>
                            <p className="text-sm text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            user.role === 'admin' ? 'bg-purple-600' :
                            user.role === 'instructor' ? 'bg-blue-600' :
                            'bg-green-600'
                          }
                        >
                          {user.role === 'admin' ? 'Admin' :
                           user.role === 'instructor' ? 'Giảng viên' :
                           'Học viên'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">Hoạt động</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1F1F1F]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2D2D2D]">
                            <DropdownMenuItem className="text-white hover:bg-[#1F1F1F]">
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-[#1F1F1F]">
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:bg-[#1F1F1F]">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Quản lý khóa học</CardTitle>
              <CardDescription className="text-gray-400">
                Tất cả khóa học trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                    <TableHead className="text-gray-300">Khóa học</TableHead>
                    <TableHead className="text-gray-300">Giảng viên</TableHead>
                    <TableHead className="text-gray-300">Học viên</TableHead>
                    <TableHead className="text-gray-300">Trạng thái</TableHead>
                    <TableHead className="text-gray-300">Nổi bật</TableHead>
                    <TableHead className="text-right text-gray-300">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCourses.slice(0, 10).map(course => (
                    <TableRow key={course.id} className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-white line-clamp-1">{course.title}</p>
                            <p className="text-sm text-gray-500">{course.category_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{course.instructor_name}</TableCell>
                      <TableCell className="text-gray-300">{course.enrolled_count.toLocaleString()}</TableCell>
                      <TableCell>
                        {course.status === 'published' ? (
                          <Badge className="bg-green-600">Đã xuất bản</Badge>
                        ) : (
                          <Badge variant="outline" className="border-[#2D2D2D] text-gray-300">Bản nháp</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.featured ? (
                          <Badge className="bg-yellow-500">⭐ Nổi bật</Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1F1F1F]">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2D2D2D]">
                            <DropdownMenuItem asChild className="text-white hover:bg-[#1F1F1F]">
                              <Link to={`/courses/${course.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-white hover:bg-[#1F1F1F]">
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-400 hover:bg-[#1F1F1F]">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
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
                    <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
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
                    <span className="text-2xl font-bold text-white">{stats.totalCourses}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                    <span className="text-gray-300">Khóa học nổi bật</span>
                    <span className="text-2xl font-bold text-white">
                      {mockCourses.filter(c => c.featured).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

