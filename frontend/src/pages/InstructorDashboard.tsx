import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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

  const handleDeleteCourse = (courseId: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa khóa học "${title}"?`)) {
      toast.success('Khóa học đã được xóa');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2">Dashboard Giảng viên</h1>
          <p className="text-gray-600">Xin chào, {instructor.full_name}! 👋</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Tạo khóa học mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo khóa học mới</DialogTitle>
              <DialogDescription>
                Điền thông tin để tạo khóa học mới. Bạn có thể chỉnh sửa sau.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề khóa học *</Label>
                <Input
                  id="title"
                  placeholder="VD: Lập trình Web với React"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết về khóa học..."
                  rows={4}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục *</Label>
                  <Select value={newCourse.category_id} onValueChange={(value) => setNewCourse({ ...newCourse, category_id: value })}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Trình độ</Label>
                  <Select value={newCourse.level} onValueChange={(value) => setNewCourse({ ...newCourse, level: value })}>
                    <SelectTrigger id="level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Cơ bản</SelectItem>
                      <SelectItem value="intermediate">Trung cấp</SelectItem>
                      <SelectItem value="advanced">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Giá (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0 = Miễn phí"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select value={newCourse.status} onValueChange={(value) => setNewCourse({ ...newCourse, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="published">Xuất bản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateCourse}>
                Tạo khóa học
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Tổng khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.publishedCourses} đã xuất bản • {stats.draftCourses} bản nháp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Đã đăng ký các khóa học</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng thu nhập</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Đánh giá TB</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2">
              {stats.avgRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Từ học viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Khóa học
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Phân tích
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Doanh thu
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý khóa học</CardTitle>
              <CardDescription>
                Danh sách tất cả khóa học của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Hoàn thành</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map(course => {
                    const revenue = (course.discount_price || course.original_price) * course.enrolled_count;
                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-16 h-10 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium line-clamp-1">{course.title}</p>
                              <p className="text-sm text-gray-500">{course.lessons_count} bài • {formatDuration(course.duration_minutes)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {course.status === 'published' ? (
                            <Badge className="bg-green-600">Đã xuất bản</Badge>
                          ) : course.status === 'draft' ? (
                            <Badge variant="outline">Bản nháp</Badge>
                          ) : (
                            <Badge variant="secondary">Đã lưu trữ</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {course.enrolled_count.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {course.rating_avg} ({course.rating_count})
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(revenue)}</TableCell>
                        <TableCell>{course.completion_rate}%</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/courses/${course.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="h-4 w-4 mr-2" />
                                Quản lý bài học
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
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
            <Card>
              <CardHeader>
                <CardTitle>Top khóa học</CardTitle>
                <CardDescription>Theo số học viên đăng ký</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses
                    .sort((a, b) => b.enrolled_count - a.enrolled_count)
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{course.title}</p>
                            <p className="text-sm text-gray-500">{course.enrolled_count} học viên</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Đánh giá cao nhất</CardTitle>
                <CardDescription>Theo rating trung bình</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses
                    .sort((a, b) => b.rating_avg - a.rating_avg)
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{course.title}</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{course.rating_avg}</span>
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

          <Card>
            <CardHeader>
              <CardTitle>Thống kê tổng quan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Tổng lượt xem</span>
                  <span className="text-2xl">
                    {courses.reduce((sum, c) => sum + c.views_count, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Tỷ lệ hoàn thành trung bình</span>
                  <span className="text-2xl">
                    {Math.round(courses.reduce((sum, c) => sum + c.completion_rate, 0) / courses.length)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Tổng số bài học</span>
                  <span className="text-2xl">
                    {courses.reduce((sum, c) => sum + c.lessons_count, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doanh thu theo khóa học</CardTitle>
              <CardDescription>Chi tiết doanh thu từng khóa học</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Đã bán</TableHead>
                    <TableHead className="text-right">Doanh thu</TableHead>
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
                        <TableRow key={course.id}>
                          <TableCell>
                            <p className="font-medium">{course.title}</p>
                          </TableCell>
                          <TableCell>{formatPrice(price)}</TableCell>
                          <TableCell>{course.enrolled_count} khóa</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
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
