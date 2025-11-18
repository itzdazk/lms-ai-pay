import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Download, ArrowRight } from 'lucide-react';
import { getCourseById } from '../lib/mockData';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  const course = courseId ? getCourseById(courseId) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-4 px-4">
      <div className="w-full max-w-2xl">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D] text-center">
          <CardHeader>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600/20">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-white">Thanh toán thành công!</CardTitle>
            <CardDescription className="text-lg text-gray-400">
              Cảm ơn bạn đã mua khóa học
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
                Bạn có thể bắt đầu học ngay bây giờ hoặc truy cập từ Dashboard của bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[#2D2D2D] !text-white hover:bg-white/10 gap-2"
                >
                  <Link to={course ? `/learn/${course.id}` : '/dashboard'}>
                    Bắt đầu học ngay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-[#2D2D2D] !text-white hover:bg-white/10"
                >
                  <Link to="/dashboard">
                    Về Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-[#2D2D2D]">
              <p className="text-sm text-gray-400 mb-4">
                Bạn sẽ nhận được email xác nhận thanh toán trong vài phút tới.
              </p>
              <Button
                variant="outline"
                className="border-[#2D2D2D] !text-white hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Tải hóa đơn
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

