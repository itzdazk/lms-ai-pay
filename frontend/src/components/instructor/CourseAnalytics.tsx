import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Users, DollarSign, TrendingUp, Star, Eye, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { instructorCoursesApi } from '../../lib/api/instructor-courses';
import { toast } from 'sonner';

interface CourseAnalyticsProps {
  courseId: string;
}

interface AnalyticsData {
  totalEnrollments: number;
  totalRevenue: number;
  completionRate: number;
  averageRating: number;
  totalViews: number;
  totalLessons: number;
  completedLessons: number;
  revenueOverTime?: Array<{ date: string; revenue: number }>;
  enrollmentsOverTime?: Array<{ date: string; count: number }>;
  lessonAnalytics?: Array<{
    lessonId: number;
    lessonTitle: string;
    views: number;
    completions: number;
    completionRate: number;
  }>;
  recentEnrollments?: Array<{
    studentName: string;
    enrolledAt: string;
  }>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function CourseAnalytics({ courseId }: CourseAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [courseId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await instructorCoursesApi.getCourseAnalytics(courseId);
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Không thể tải dữ liệu phân tích');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Không có dữ liệu phân tích</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng đăng ký</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalEnrollments || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Học viên đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatPrice(analytics.totalRevenue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Từ tất cả đăng ký</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tỷ lệ hoàn thành</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.completionRate ? `${analytics.completionRate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Học viên hoàn thành khóa học</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Đánh giá trung bình</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.averageRating ? analytics.averageRating.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Trên 5 sao</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng lượt xem</CardTitle>
            <Eye className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalViews || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Lượt xem khóa học</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tổng bài học</CardTitle>
            <BookOpen className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalLessons || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.completedLessons || 0} đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tỷ lệ hoàn thành bài học</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.totalLessons && analytics.completedLessons
                ? `${((analytics.completedLessons / analytics.totalLessons) * 100).toFixed(1)}%`
                : '0%'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Trung bình học viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Lesson Analytics */}
      {analytics.lessonAnalytics && analytics.lessonAnalytics.length > 0 && (
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white">Phân tích bài học</CardTitle>
            <CardDescription className="text-gray-400">
              Thống kê lượt xem và tỷ lệ hoàn thành từng bài học
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.lessonAnalytics.map((lesson) => (
                <div
                  key={lesson.lessonId}
                  className="p-4 bg-[#1F1F1F] rounded-lg border border-[#2D2D2D]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium">{lesson.lessonTitle}</h4>
                    <span className="text-sm text-gray-400">
                      {lesson.completionRate.toFixed(1)}% hoàn thành
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{lesson.views} lượt xem</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{lesson.completions} hoàn thành</span>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-[#2D2D2D] rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${lesson.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Enrollments */}
      {analytics.recentEnrollments && analytics.recentEnrollments.length > 0 && (
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white">Đăng ký gần đây</CardTitle>
            <CardDescription className="text-gray-400">
              Danh sách học viên đăng ký mới nhất
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentEnrollments.slice(0, 10).map((enrollment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg border border-[#2D2D2D]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {enrollment.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{enrollment.studentName}</p>
                      <p className="text-xs text-gray-400">
                        Đăng ký {formatDate(enrollment.enrolledAt)}
                      </p>
                    </div>
                  </div>
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Placeholder */}
      {(analytics.revenueOverTime || analytics.enrollmentsOverTime) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {analytics.revenueOverTime && analytics.revenueOverTime.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Doanh thu theo thời gian</CardTitle>
                <CardDescription className="text-gray-400">
                  Biểu đồ doanh thu trong khoảng thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <p className="text-sm">Chart sẽ được tích hợp sau (Recharts/Chart.js)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.enrollmentsOverTime && analytics.enrollmentsOverTime.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Đăng ký theo thời gian</CardTitle>
                <CardDescription className="text-gray-400">
                  Biểu đồ số lượng đăng ký theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <p className="text-sm">Chart sẽ được tích hợp sau (Recharts/Chart.js)</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

