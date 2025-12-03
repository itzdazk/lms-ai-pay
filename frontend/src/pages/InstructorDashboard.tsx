import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  BarChart3,
  FileText
} from 'lucide-react';
import { getCoursesByInstructor, getInstructorStats, formatPrice, formatDuration, mockUsers, mockCategories } from '../lib/mockData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

export function InstructorDashboard() {
  const instructor = mockUsers[1]; // Instructor user
  const courses = getCoursesByInstructor(instructor.id);
  const stats = getInstructorStats(instructor.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state for creating course
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category_id: '',
    level: 'beginner',
    price: '',
    status: 'draft'
  });

  const handleCreateCourse = () => {
    if (!newCourse.title || !newCourse.description || !newCourse.category_id) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    toast.success('Khóa học đã được tạo thành công!');
    setIsCreateDialogOpen(false);
    // Reset form
    setNewCourse({
      title: '',
      description: '',
      category_id: '',
      level: 'beginner',
      price: '',
      status: 'draft'
    });
  };

  const handleDeleteCourse = (_courseId: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa khóa học "${title}"?`)) {
      toast.success('Khóa học đã được xóa');
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-black">Dashboard Giảng viên</h1>
          <p className="text-black-400">Xin chào, {instructor.full_name}! 👋</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className="border-[#2D2D2D] text-white bg-black hover:bg-[#0F0F0F] dark:hover:bg-[#0F0F0F]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo khóa học mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border-[#2D2D2D]">
            <DialogHeader>
              <DialogTitle className="text-white">Tạo khóa học mới</DialogTitle>
              <DialogDescription className="text-gray-400">
                Điền thông tin để tạo khóa học mới. Bạn có thể chỉnh sửa sau.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Tiêu đề khóa học *</Label>
                <Input
                  id="title"
                  placeholder="VD: Lập trình Web với React"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">Mô tả *</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về khóa học..."
                  rows={4}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-white">Danh mục *</Label>
                  <Select value={newCourse.category_id} onValueChange={(value) => setNewCourse({ ...newCourse, category_id: value })}>
                    <SelectTrigger id="category" className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                      {mockCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level" className="text-white">Trình độ</Label>
                  <Select value={newCourse.level} onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}>
                    <SelectTrigger id="level" className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                      <SelectItem value="beginner" className="text-white">Cơ bản</SelectItem>
                      <SelectItem value="intermediate" className="text-white">Trung cấp</SelectItem>
                      <SelectItem value="advanced" className="text-white">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">Giá (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0 = Miễn phí"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                    className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">Trạng thái</Label>
                  <Select value={newCourse.status} onValueChange={(value) => setNewCourse({ ...newCourse, status: value })}>
                    <SelectTrigger id="status" className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                      <SelectItem value="draft" className="text-white">Bản nháp</SelectItem>
                      <SelectItem value="published" className="text-white">Xuất bản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DarkOutlineButton
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Hủy
              </DarkOutlineButton>
              <DarkOutlineButton
                onClick={handleCreateCourse}
              >
                Tạo khóa học
              </DarkOutlineButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Tổng khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.publishedCourses} đã xuất bản • {stats.draftCourses} bản nháp
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Đã đăng ký các khóa học</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng thu nhập</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Đánh giá TB</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2 text-white">
              {stats.avgRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Từ học viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="w-full justify-start bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-1">
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
          <TabsTrigger
            value="revenue"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Doanh thu
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Quản lý khóa học</CardTitle>
              <CardDescription className="text-gray-400">
                Danh sách tất cả khóa học của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                    <TableHead className="text-gray-300">Khóa học</TableHead>
                    <TableHead className="text-gray-300">Trạng thái</TableHead>
                    <TableHead className="text-gray-300">Học viên</TableHead>
                    <TableHead className="text-gray-300">Đánh giá</TableHead>
                    <TableHead className="text-gray-300">Doanh thu</TableHead>
                    <TableHead className="text-gray-300">Hoàn thành</TableHead>
                    <TableHead className="text-right text-gray-300">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map(course => {
                    const revenue = (course.discount_price || course.original_price) * course.enrolled_count;
                    return (
                      <TableRow key={course.id} className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-16 h-10 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium line-clamp-1 text-white">{course.title}</p>
                              <p className="text-sm text-gray-500">{course.lessons_count} bài • {formatDuration(course.duration_minutes)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.status === 'published' ? (
                            <Badge className="bg-green-600">Đã xuất bản</Badge>
                          ) : course.status === 'draft' ? (
                            <Badge variant="outline" className="border-[#2D2D2D] text-gray-300">Bản nháp</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-600 text-white">Đã lưu trữ</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {course.enrolled_count.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {course.rating_avg} ({course.rating_count})
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{formatPrice(revenue)}</TableCell>
                        <TableCell className="text-gray-300">{course.completion_rate}%</TableCell>
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
                              <DropdownMenuItem className="text-white hover:bg-[#1F1F1F]">
                                <FileText className="h-4 w-4 mr-2" />
                                Quản lý bài học
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 hover:bg-[#1F1F1F]"
                                onClick={() => handleDeleteCourse(course.id, course.title)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                <CardTitle className="text-white">Top khóa học</CardTitle>
                <CardDescription className="text-gray-400">Theo số học viên đăng ký</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses
                    .sort((a, b) => b.enrolled_count - a.enrolled_count)
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-500">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1 text-white">{course.title}</p>
                            <p className="text-sm text-gray-500">{course.enrolled_count} học viên</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Đánh giá cao nhất</CardTitle>
                <CardDescription className="text-gray-400">Theo rating trung bình</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses
                    .sort((a, b) => b.rating_avg - a.rating_avg)
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-500">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1 text-white">{course.title}</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-gray-300">{course.rating_avg}</span>
                              <span className="text-gray-500">({course.rating_count})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Thống kê tổng quan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Tổng lượt xem</span>
                  <span className="text-2xl text-white">
                    {courses.reduce((sum, c) => sum + c.views_count, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Tỷ lệ hoàn thành trung bình</span>
                  <span className="text-2xl text-white">
                    {Math.round(courses.reduce((sum, c) => sum + c.completion_rate, 0) / courses.length)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Tổng số bài học</span>
                  <span className="text-2xl text-white">
                    {courses.reduce((sum, c) => sum + c.lessons_count, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Doanh thu theo khóa học</CardTitle>
              <CardDescription className="text-gray-400">Chi tiết doanh thu từng khóa học</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                    <TableHead className="text-gray-300">Khóa học</TableHead>
                    <TableHead className="text-gray-300">Giá bán</TableHead>
                    <TableHead className="text-gray-300">Đã bán</TableHead>
                    <TableHead className="text-right text-gray-300">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses
                    .filter(c => !c.is_free)
                    .sort((a, b) => {
                      const revA = (a.discount_price || a.original_price) * a.enrolled_count;
                      const revB = (b.discount_price || b.original_price) * b.enrolled_count;
                      return revB - revA;
                    })
                    .map(course => {
                      const price = course.discount_price || course.original_price;
                      const revenue = price * course.enrolled_count;
                      return (
                        <TableRow key={course.id} className="border-[#2D2D2D] hover:bg-[#1F1F1F]">
                          <TableCell>
                            <p className="font-medium text-white">{course.title}</p>
                          </TableCell>
                          <TableCell className="text-gray-300">{formatPrice(price)}</TableCell>
                          <TableCell className="text-gray-300">{course.enrolled_count} khóa</TableCell>
                          <TableCell className="text-right font-semibold text-green-500">
                            {formatPrice(revenue)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
