import { useParams, Link } from 'react-router-dom';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Award,
  Download,
  Share2,
  CheckCircle,
  Calendar,
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-lg text-center bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl p-10">
          <Award className="h-16 w-16 text-gray-500 mx-auto mb-6" />
          <h1 className="text-3xl mb-4 text-white">Chứng chỉ không tồn tại</h1>
          <p className="text-gray-400 mb-8">
            Bạn cần hoàn thành khóa học để nhận chứng chỉ
          </p>
          <DarkOutlineButton asChild>
            <Link to="/dashboard">Quay lại Dashboard</Link>
          </DarkOutlineButton>
        </div>
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
    <div className="min-h-screen bg-background text-white">
      <div className="container mx-auto px-4 py-4">
        {/* Header Actions */}
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 no-print bg-[#0F0F0F] border border-[#2D2D2D] rounded-2xl p-4">
          <DarkOutlineButton asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Link>
          </DarkOutlineButton>

          <div className="flex gap-2 flex-wrap">
            <DarkOutlineButton onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Tải xuống
            </DarkOutlineButton>
            <DarkOutlineButton onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              In
            </DarkOutlineButton>
            <DarkOutlineButton>
              <Share2 className="h-4 w-4 mr-2" />
              Chia sẻ
            </DarkOutlineButton>
          </div>
        </div>

        {/* Certificate Card */}
        <Card className="max-w-5xl mx-auto overflow-hidden shadow-2xl bg-[#111111] border-[#2D2D2D] print:shadow-none">
          {/* Decorative Border */}
          <div className="relative p-8 md:p-12 lg:p-16">
            {/* Top Border Pattern */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#1E1E1E] via-[#242424] to-[#2B2B2B]" />
            
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-black border-2 border-white/30 shadow-lg">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl mb-2 text-white">
                  EduLearn
                </h1>
                <p className="text-lg text-gray-400">Nền tảng học tập trực tuyến</p>
              </div>

              {/* Certificate Title */}
              <div className="py-6">
                <h2 className="text-3xl md:text-4xl mb-4 text-white">
                  Chứng Chỉ Hoàn Thành
                </h2>
                <div className="w-32 h-1 bg-gradient-to-r from-[#1E1E1E] via-[#242424] to-[#2B2B2B] mx-auto" />
              </div>

              {/* Recipient Info */}
              <div className="space-y-4">
                <p className="text-lg text-gray-400">Chứng nhận rằng</p>
                <div className="relative inline-block">
                  <p className="text-4xl md:text-5xl text-white px-8">
                    {currentUser.full_name}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300" />
                </div>
              </div>

              {/* Course Info */}
              <div className="space-y-3 py-6">
                <p className="text-lg text-gray-400">đã hoàn thành xuất sắc khóa học</p>
                <p className="text-2xl md:text-3xl text-white px-4">
                  {course.title}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  <Badge variant="outline" className="text-sm py-1 px-3 border-[#2D2D2D] text-gray-300">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {course.lessons_count} bài học
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3 border-[#2D2D2D] text-gray-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    100% hoàn thành
                  </Badge>
                </div>
              </div>

              {/* Issue Date & ID */}
              <div className="grid md:grid-cols-2 gap-6 pt-8 border-t border-[#2D2D2D]">
                <div className="text-center md:text-left">
                  <p className="text-sm text-gray-500 mb-1">Ngày cấp</p>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-white">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p>
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
                  <p className="text-white font-mono">{certificateId}</p>
                </div>
              </div>

              {/* Instructor Signature */}
              <div className="flex justify-center gap-12 pt-8">
                <div className="text-center">
                  <div className="mb-3">
                    <div className="w-48 h-0.5 bg-gray-300 mx-auto mb-2" />
                  </div>
                  <p className="font-semibold text-white">{course.instructor_name}</p>
                  <p className="text-sm text-gray-400">Giảng viên</p>
                </div>
              </div>

              {/* QR Code & Verification */}
              <div className="flex justify-center pt-8">
                <div className="text-center p-4 bg-[#0F0F0F] border border-[#2D2D2D] rounded-lg">
                  <div className="w-24 h-24 bg-black border border-[#2D2D2D] rounded mx-auto mb-2 flex items-center justify-center">
                    <img src="https://dummyimage.com/120x120/000/fff&text=QR" alt="QR" />
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
        <div className="max-w-5xl mx-auto mt-6 no-print">
          <Card className="p-6 bg-[#1A1A1A] border-[#2D2D2D]">
              <div className="text-center space-y-4 text-white">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-white" />
                <h3 className="text-lg text-white">Chia sẻ thành tích của bạn</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <DarkOutlineButton
                  onClick={() => handleShare('LinkedIn')}
                  className="gap-2"
                >
                  <Linkedin className="h-4 w-4 text-[#0077B5]" />
                  LinkedIn
                </DarkOutlineButton>
                <DarkOutlineButton
                  onClick={() => handleShare('Facebook')}
                  className="gap-2"
                >
                  <Facebook className="h-4 w-4 text-[#1877F2]" />
                  Facebook
                </DarkOutlineButton>
                <DarkOutlineButton
                  onClick={() => handleShare('Twitter')}
                  className="gap-2"
                >
                  <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                  Twitter
                </DarkOutlineButton>
              </div>
            </div>
          </Card>
        </div>

        {/* Verification Info */}
        <div className="max-w-5xl mx-auto mt-6 no-print">
          <Card className="p-6 bg-[#1A1A1A] border-[#2D2D2D]">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Chứng chỉ đã được xác thực</h3>
                <p className="text-sm text-gray-400">
                  Chứng chỉ này có thể được xác minh bởi các nhà tuyển dụng tại{' '}
                  <a href="#" className="underline text-white hover:text-gray-200">
                    edulearn.vn/verify/{certificateId}
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Related Courses */}
        <div className="max-w-5xl mx-auto mt-4 no-print">
          <h3 className="text-xl mb-4 text-black">Tiếp tục học tập</h3>
          <Card className="p-6 bg-[#1A1A1A] border-[#2D2D2D]">
            <p className="text-gray-400 mb-4">
              Tiếp tục phát triển kỹ năng của bạn với các khóa học khác
            </p>
            <DarkOutlineButton asChild>
              <Link to="/courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Khám phá khóa học
              </Link>
            </DarkOutlineButton>
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
