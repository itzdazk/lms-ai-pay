import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Award,
  Download,
  Share2,
  CheckCircle,
  Calendar,
  User,
  BookOpen,
  ArrowLeft,
  Printer,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import { getCertificate, getCourseById, currentUser } from '../lib/mockData';
import { toast } from 'sonner';

export function CertificatePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const certificate = getCertificate(currentUser.id, courseId || '');
  const course = getCourseById(courseId || '');

  if (!certificate || !course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Award className="h-20 w-20 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl mb-4">Chứng chỉ không tồn tại</h1>
        <p className="text-gray-600 mb-8">
          Bạn cần hoàn thành khóa học để nhận chứng chỉ
        </p>
        <Button asChild>
          <Link to="/dashboard">Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  const handleDownload = () => {
    toast.success('Đang tải xuống chứng chỉ...');
    // In production, trigger actual download
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (platform: string) => {
    toast.success(`Chia sẻ lên ${platform}`);
    // In production, open share dialog
  };

  const issueDate = new Date(certificate.issued_at);
  const certificateId = `EDU-${certificate.id.toUpperCase()}-${issueDate.getFullYear()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 no-print">
          <Button variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Link>
          </Button>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              In
            </Button>
            <Button>
              <Share2 className="h-4 w-4 mr-2" />
              Chia sẻ
            </Button>
          </div>
        </div>

        {/* Certificate Card */}
        <Card className="max-w-5xl mx-auto overflow-hidden shadow-2xl bg-white print:shadow-none">
          {/* Decorative Border */}
          <div className="relative p-8 md:p-12 lg:p-16">
            {/* Top Border Pattern */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            
            {/* Corner Decorations */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-blue-600 opacity-20" />
            <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-blue-600 opacity-20" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-blue-600 opacity-20" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-blue-600 opacity-20" />

            {/* Content */}
            <div className="relative text-center space-y-8">
              {/* Logo & Title */}
              <div>
                <div className="flex justify-center mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl mb-2 text-gray-900">
                  EduLearn
                </h1>
                <p className="text-lg text-gray-600">Nền tảng học tập trực tuyến</p>
              </div>

              {/* Certificate Title */}
              <div className="py-6">
                <h2 className="text-3xl md:text-4xl mb-4 text-gray-800">
                  Chứng Chỉ Hoàn Thành
                </h2>
                <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto" />
              </div>

              {/* Recipient Info */}
              <div className="space-y-4">
                <p className="text-lg text-gray-600">Chứng nhận rằng</p>
                <div className="relative inline-block">
                  <p className="text-4xl md:text-5xl text-blue-600 px-8">
                    {currentUser.full_name}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300" />
                </div>
              </div>

              {/* Course Info */}
              <div className="space-y-3 py-6">
                <p className="text-lg text-gray-600">đã hoàn thành xuất sắc khóa học</p>
                <p className="text-2xl md:text-3xl text-gray-900 px-4">
                  {course.title}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {course.lessons_count} bài học
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    100% hoàn thành
                  </Badge>
                </div>
              </div>

              {/* Issue Date & ID */}
              <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-500 mb-1">Ngày cấp</p>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">
                      {issueDate.toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-500 mb-1">Mã chứng chỉ</p>
                  <p className="text-gray-900 font-mono">{certificateId}</p>
                </div>
              </div>

              {/* Instructor Signature */}
              <div className="flex justify-center gap-12 pt-8">
                <div className="text-center">
                  <div className="mb-3">
                    <div className="w-48 h-0.5 bg-gray-300 mx-auto mb-2" />
                  </div>
                  <p className="font-semibold text-gray-900">{course.instructor_name}</p>
                  <p className="text-sm text-gray-600">Giảng viên</p>
                </div>
              </div>

              {/* QR Code & Verification */}
              <div className="flex justify-center pt-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="w-24 h-24 bg-white border-2 border-gray-200 rounded mx-auto mb-2 flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 ${Math.random() > 0.5 ? 'bg-gray-800' : 'bg-white'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Quét mã để xác thực</p>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-6 text-xs text-gray-500">
                <p>Chứng chỉ này xác nhận sự hoàn thành khóa học trên EduLearn</p>
                <p className="mt-1">Có thể xác thực tại edulearn.vn/verify/{certificateId}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Share Section - Below Certificate */}
        <div className="max-w-5xl mx-auto mt-8 no-print">
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg">Chia sẻ thành tích của bạn</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleShare('LinkedIn')}
                  className="gap-2"
                >
                  <Linkedin className="h-4 w-4 text-[#0077B5]" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('Facebook')}
                  className="gap-2"
                >
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleShare('Twitter')}
                  className="gap-2"
                >
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  Twitter
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Verification Info */}
        <div className="max-w-5xl mx-auto mt-6 no-print">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Chứng chỉ đã được xác thực</h3>
                <p className="text-sm text-blue-700">
                  Chứng chỉ này có thể được xác minh bởi các nhà tuyển dụng tại{' '}
                  <a href="#" className="underline hover:text-blue-800">
                    edulearn.vn/verify/{certificateId}
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Related Courses */}
        <div className="max-w-5xl mx-auto mt-8 no-print">
          <h3 className="text-xl mb-4">Tiếp tục học tập</h3>
          <Card className="p-6">
            <p className="text-gray-600 mb-4">
              Tiếp tục phát triển kỹ năng của bạn với các khóa học khác
            </p>
            <Button asChild>
              <Link to="/courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Khám phá khóa học
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
