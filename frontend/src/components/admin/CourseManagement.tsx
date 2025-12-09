import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, BookOpen, Users, TrendingUp, DollarSign, Star, BarChart3, Award } from 'lucide-react';
import { adminCoursesApi, type PlatformAnalytics } from '../../lib/api/admin-courses';
import { formatPrice } from '../../lib/utils';
import { Link } from 'react-router-dom';

function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function CourseManagement() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminCoursesApi.getPlatformAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Không thể tải dữ liệu phân tích</p>
      </div>
    );
  }

  const { overview, topPerformers, distribution, trends } = analytics;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Courses Overview */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng số khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(overview.courses.total)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {overview.courses.published} đã xuất bản • {overview.courses.draft} bản nháp • {overview.courses.archived} đã lưu trữ
            </div>
            <div className="text-xs text-blue-400 mt-2">
              {overview.courses.publishedLast30Days} khóa học mới trong 30 ngày qua
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Overview */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng số đăng ký</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(overview.enrollments.total)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {overview.enrollments.active} đang học • {overview.enrollments.completed} đã hoàn thành
            </div>
            <div className="text-xs text-green-400 mt-2">
              Tỷ lệ hoàn thành: {formatPercentage(overview.enrollments.completionRate)}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatPrice(overview.revenue.total)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {formatNumber(overview.revenue.totalOrders)} đơn hàng
            </div>
            <div className="text-xs text-green-400 mt-2">
              {formatPrice(overview.revenue.last30Days)} trong 30 ngày qua
            </div>
          </CardContent>
        </Card>

        {/* Users Overview */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng số người dùng</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(overview.users.total)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {overview.users.instructors} giảng viên • {overview.users.students} học viên
            </div>
            <div className="text-xs text-blue-400 mt-2">
              {overview.users.newUsersLast30Days} người dùng mới trong 30 ngày qua
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses by Enrollments */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Khóa học phổ biến nhất
            </CardTitle>
            <CardDescription className="text-gray-400">
              Top 10 khóa học có nhiều học viên đăng ký nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.coursesByEnrollments.length === 0 ? (
                <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
              ) : (
                topPerformers.coursesByEnrollments.map((course, index) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#2D2D2D] transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          <Users className="h-3 w-3 inline mr-1" />
                          {formatNumber(course.enrolledCount)}
                        </span>
                        {course.ratingAvg && (
                          <span className="text-xs text-gray-400">
                            <Star className="h-3 w-3 inline mr-1 fill-yellow-400 text-yellow-400" />
                            {course.ratingAvg.toFixed(1)} ({formatNumber(course.ratingCount)})
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Courses by Revenue */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Khóa học có doanh thu cao nhất
            </CardTitle>
            <CardDescription className="text-gray-400">
              Top 10 khóa học có doanh thu cao nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.coursesByRevenue.length === 0 ? (
                <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
              ) : (
                topPerformers.coursesByRevenue.map((course, index) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#2D2D2D] transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-12 h-8 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{course.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-green-400 font-semibold">
                          {formatPrice(course.totalRevenue)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatNumber(course.totalOrders)} đơn hàng
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Instructors and Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Instructors */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5" />
              Giảng viên hàng đầu
            </CardTitle>
            <CardDescription className="text-gray-400">
              Top 10 giảng viên có nhiều khóa học nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.instructors.length === 0 ? (
                <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
              ) : (
                topPerformers.instructors.map((instructor, index) => (
                  <div
                    key={instructor.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#2D2D2D] transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    {instructor.avatarUrl ? (
                      <img
                        src={instructor.avatarUrl}
                        alt={instructor.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{instructor.fullName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatNumber(instructor.totalCourses)} khóa học
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatNumber(instructor.totalEnrollments)} học viên
                        </span>
                        {instructor.averageRating > 0 && (
                          <span className="text-xs text-gray-400">
                            <Star className="h-3 w-3 inline mr-1 fill-yellow-400 text-yellow-400" />
                            {instructor.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Phân bố theo danh mục
            </CardTitle>
            <CardDescription className="text-gray-400">
              Top 10 danh mục có nhiều khóa học nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribution.categories.length === 0 ? (
                <p className="text-gray-400 text-sm">Chưa có dữ liệu</p>
              ) : (
                distribution.categories.map((category, index) => (
                  <div
                    key={category.categoryId}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#2D2D2D] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{category.categoryName}</p>
                        <p className="text-xs text-gray-400">{formatNumber(category.courseCount)} khóa học</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Summary */}
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Xu hướng 30 ngày qua</CardTitle>
          <CardDescription className="text-gray-400">
            Tổng quan về đăng ký và doanh thu trong 30 ngày gần nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enrollment Trend Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Đăng ký khóa học</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Tổng đăng ký:</span>
                  <span className="text-white font-semibold">{formatNumber(overview.enrollments.last30Days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">7 ngày qua:</span>
                  <span className="text-white font-semibold">{formatNumber(overview.enrollments.last7Days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Trung bình/ngày:</span>
                  <span className="text-white font-semibold">
                    {formatNumber(Math.round(overview.enrollments.last30Days / 30))}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Trend Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Doanh thu</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Tổng doanh thu:</span>
                  <span className="text-white font-semibold">{formatPrice(overview.revenue.last30Days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Số đơn hàng:</span>
                  <span className="text-white font-semibold">{formatNumber(overview.revenue.ordersLast30Days)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Giá trị trung bình/đơn:</span>
                  <span className="text-white font-semibold">
                    {overview.revenue.ordersLast30Days > 0
                      ? formatPrice(Math.round(overview.revenue.last30Days / overview.revenue.ordersLast30Days))
                      : formatPrice(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

