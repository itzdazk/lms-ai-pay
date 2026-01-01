import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Users, DollarSign, TrendingUp, Star, Eye, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
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
  revenueOverTime?: Array<{ date: string; revenue?: number; amount?: number }>;
  enrollmentsOverTime?: Array<{ date: string; enrollments?: number; count?: number }>;
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
  topStudents?: Array<{
    name: string;
    progress: number;
    enrolledAt?: string;
    lastAccessedAt?: string;
    avatarUrl?: string;
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

  const revenueSeries = useMemo(
    () =>
      (analytics?.revenueOverTime || []).map((item) => ({
        date: item.date,
        revenue: Number(item.revenue ?? item.amount ?? 0),
      })),
    [analytics?.revenueOverTime]
  );

  const enrollmentSeries = useMemo(
    () =>
      (analytics?.enrollmentsOverTime || []).map((item) => ({
        date: item.date,
        enrollments: Number(item.enrollments ?? item.count ?? 0),
      })),
    [analytics?.enrollmentsOverTime]
  );

  useEffect(() => {
    loadAnalytics();
  }, [courseId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Loading analytics for course:', courseId);
      const data = await instructorCoursesApi.getCourseAnalytics(courseId);
      console.log('Analytics data received:', data);

      // Normalize backend response (admin/instructor share same component)
      // Backend returns nested structure: overview, revenue, enrollments, studentProgress, courseInfo
      const recentEnrollmentsRaw =
        Array.isArray(data?.enrollments?.recentEnrollments)
          ? data.enrollments.recentEnrollments
          : []

      const normalized: AnalyticsData = {
        totalEnrollments: data?.overview?.totalEnrollments ?? 0,
        totalRevenue: data?.revenue?.totalRevenue ?? 0,
        completionRate: data?.overview?.completionRate ?? 0,
        averageRating: data?.overview?.averageRating ?? 0,
        totalViews: data?.overview?.totalViews ?? 0,
        totalLessons: data?.overview?.totalLessons ?? 0,
        completedLessons: data?.studentProgress?.completed ?? 0,
        revenueOverTime: data?.revenue?.trend ?? data?.revenueOverTime ?? [],
        enrollmentsOverTime: data?.enrollments?.trend ?? data?.enrollmentsOverTime ?? [],
        lessonAnalytics: data?.lessonAnalytics ?? [],
        recentEnrollments: recentEnrollmentsRaw.map((item: any) => ({
          studentName: item?.user?.fullName || item?.user?.email || 'Học viên',
          enrolledAt: item?.enrolledAt,
        })),
        topStudents: Array.isArray(data?.topStudents)
          ? data.topStudents.map((s: any) => ({
              name: s?.user?.fullName || s?.user?.userName || 'Học viên',
              progress: Number(s?.progressPercentage ?? 0),
              enrolledAt: s?.enrolledAt,
              lastAccessedAt: s?.lastAccessedAt,
              avatarUrl: s?.user?.avatarUrl,
            }))
          : [],
      };

      setAnalytics(normalized);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      console.error('Error status:', error?.response?.status);
      console.error('Error data:', error?.response?.data);
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

      {/* Enrollment Chart and Top Students */}
      {(enrollmentSeries.length > 0 || (analytics.topStudents && analytics.topStudents.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {enrollmentSeries.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2D2D2D] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Đăng ký 7 ngày gần nhất</CardTitle>
                <CardDescription className="text-gray-400">
                  Số lượng đăng ký mới theo ngày (7 ngày gần đây)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enrollmentSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                      <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#2D2D2D' }} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#2D2D2D' }} width={50} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#E5E7EB' }}
                        labelStyle={{ color: '#E5E7EB' }}
                      />
                      <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                      <Bar dataKey="enrollments" fill="#3B82F6" name="Đăng ký" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {analytics.topStudents && analytics.topStudents.length > 0 && (
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Top 10 học viên</CardTitle>
                <CardDescription className="text-gray-400">
                  Xếp hạng theo tiến độ hoàn thành
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                  {analytics.topStudents.slice(0, 10).map((student, idx) => {
                    const initial = student.name?.charAt(0)?.toUpperCase() || 'H';
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg border border-[#2D2D2D]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{student.name}</p>
                            {student.enrolledAt && (
                              <p className="text-xs text-gray-400">
                                {formatDate(student.enrolledAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-200 font-semibold ml-2">
                          {student.progress.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

