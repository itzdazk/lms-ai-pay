import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { getCourseById } from '../lib/mockData';

export function PaymentFailurePage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const error = searchParams.get('error') || 'Thanh toán không thành công';
  const course = courseId ? getCourseById(courseId) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D] text-center">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-3xl text-white">Thanh toán thất bại</CardTitle>
            <CardDescription className="text-lg text-gray-400">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {course && (
              <div className="bg-[#1F1F1F] rounded-lg p-6">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                <p className="text-gray-400">{course.instructor_name}</p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-gray-300">
                Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {course && (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-[#2D2D2D] !text-white hover:bg-white/10"
                  >
                    <Link to={`/checkout/${course.id}`}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Thử lại thanh toán
                    </Link>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#2D2D2D] !text-white hover:bg-white/10"
                >
                  <Link to="/courses">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại khóa học
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-[#2D2D2D]">
              <p className="text-sm text-gray-400 mb-2">
                Cần hỗ trợ? Liên hệ chúng tôi:
              </p>
              <p className="text-sm text-blue-500">support@edulearn.vn</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

