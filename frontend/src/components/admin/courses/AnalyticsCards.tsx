import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, TrendingUp, FileText, Archive, Star as StarIcon } from 'lucide-react';
import type { PlatformAnalytics } from '@/lib/api/admin-courses';
import type { AdminCourse } from '@/lib/api/admin-courses';

interface AnalyticsCardsProps {
  analytics: PlatformAnalytics | null;
  courses: AdminCourse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function AnalyticsCards({ analytics, courses, pagination }: AnalyticsCardsProps) {
  return (
    <>
      {!analytics ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Tổng khóa học</p>
                  <p className="text-2xl font-bold text-white">{analytics.overview.courses.total.toLocaleString()}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
              {(() => {
                // Calculate free and paid courses from current courses data
                const freeCount = courses.filter((course) => {
                  const finalPrice = course.discountPrice ?? course.price;
                  return finalPrice === 0 || finalPrice === null || finalPrice === undefined;
                }).length;
                const paidCount = courses.filter((course) => {
                  const finalPrice = course.discountPrice ?? course.price;
                  return finalPrice !== 0 && finalPrice !== null && finalPrice !== undefined;
                }).length;

                // If we have pagination data, estimate based on current page ratio
                const totalCourses = pagination.total || courses.length;
                const currentPageRatio = totalCourses > 0 && courses.length > 0 ? courses.length / totalCourses : 1;
                const estimatedFree = totalCourses > 0 && currentPageRatio > 0 ? Math.round(freeCount / currentPageRatio) : freeCount;
                const estimatedPaid = totalCourses > 0 && currentPageRatio > 0 ? Math.round(paidCount / currentPageRatio) : paidCount;

                return (
                  <div className="mt-3 pt-3 border-t border-[#2D2D2D]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Miễn phí:</span>
                      <span className="text-green-400 font-semibold">{estimatedFree.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-400">Có phí:</span>
                      <span className="text-blue-400 font-semibold">{estimatedPaid.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Đã xuất bản</p>
                  <p className="text-2xl font-bold text-white">{analytics.overview.courses.published.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Bản nháp</p>
                  <p className="text-2xl font-bold text-white">{analytics.overview.courses.draft.toLocaleString()}</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Đã lưu trữ</p>
                  <p className="text-2xl font-bold text-white">{analytics.overview.courses.archived.toLocaleString()}</p>
                </div>
                <Archive className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Nổi bật</p>
                  <p className="text-2xl font-bold text-white">{analytics.overview.courses.featured.toLocaleString()}</p>
                </div>
                <StarIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
