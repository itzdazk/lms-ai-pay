import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Badge } from '../components/ui/badge';
import {
  Award,
  Calendar,
  Download,
  Eye,
  Share2,
  BookOpen,
  Trophy,
  Target
} from 'lucide-react';
import { getUserCertificates, currentUser, getCourseById, formatDuration } from '../lib/mockData';

export function CertificatesPage() {
  const certificates = getUserCertificates(currentUser.id);

  const stats = [
    {
      label: 'Tổng chứng chỉ',
      value: certificates.length,
      icon: Award,
      accent: 'text-blue-400'
    },
    {
      label: 'Năm nay',
      value: certificates.filter(c => new Date(c.issued_at).getFullYear() === new Date().getFullYear()).length,
      icon: Calendar,
      accent: 'text-purple-400'
    },
    {
      label: 'Mục tiêu mỗi năm',
      value: '5',
      icon: Target,
      accent: 'text-green-400'
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 bg-[#0F0F0F] border border-[#2D2D2D] rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black border border-[#2D2D2D]">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-[0.25em]">Success Journey</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Chứng chỉ của tôi</h1>
              <p className="text-gray-400 mt-1">
                Theo dõi thành tích và chia sẻ các chứng chỉ bạn đã đạt được
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <DarkOutlineButton asChild>
              <Link to="/courses">Khám phá thêm khóa học</Link>
            </DarkOutlineButton>
            <DarkOutlineButton>
              Tải danh sách chứng chỉ
            </DarkOutlineButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {stats.map(stat => (
            <Card key={stat.label} className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-gray-400">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.accent}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">Cập nhật theo thời gian thực</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <Card className="p-12 text-center bg-[#1A1A1A] border-[#2D2D2D]">
            <Award className="h-20 w-20 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl mb-2 text-white">Chưa có chứng chỉ nào</h2>
            <p className="text-gray-400 mb-6">Hoàn thành các khóa học để nhận chứng chỉ</p>
            <DarkOutlineButton asChild>
              <Link to="/courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Khám phá khóa học
              </Link>
            </DarkOutlineButton>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map(certificate => {
              const course = getCourseById(certificate.course_id);
              if (!course) return null;

              const issueDate = new Date(certificate.issued_at);
              const certificateId = `EDU-${certificate.id.toUpperCase()}-${issueDate.getFullYear()}`;

              return (
                <Card
                  key={certificate.id}
                  className="overflow-hidden bg-[#111111] border-[#2D2D2D] hover:border-blue-500/40 transition-colors group"
                >
                  {/* Certificate Preview */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#050505]">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-white border border-blue-500/40 mb-4">
                        <BookOpen className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-gray-400 mb-1">Chứng chỉ</p>
                      <h3 className="text-center line-clamp-2 text-white text-sm">{course.title}</h3>
                    </div>
                    <div className="absolute top-2 left-2 w-8 h-8 border-t border-l border-white/10" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t border-r border-white/10" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b border-l border-white/10" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b border-r border-white/10" />
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="text-xs border-[#2D2D2D] text-gray-300">
                        {course.category_name}
                      </Badge>
                      <Badge className="bg-green-600/20 text-green-300 border border-green-500/40 text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Hoàn thành
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg text-white">{course.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        {issueDate.toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="mt-1 text-xs font-mono text-gray-500">{certificateId}</div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span>{course.lessons_count} bài học</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">•</span>
                        <span>{formatDuration(course.duration_minutes)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <DarkOutlineButton
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link to={`/certificate/${course.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Link>
                      </DarkOutlineButton>
                      <DarkOutlineButton size="sm">
                        <Download className="h-3 w-3" />
                      </DarkOutlineButton>
                      <DarkOutlineButton size="sm">
                        <Share2 className="h-3 w-3" />
                      </DarkOutlineButton>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Achievement Section */}
        {certificates.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl mb-6 text-white">Thành tích</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black border border-[#2D2D2D]">
                      <Trophy className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Người học tích cực</CardTitle>
                      <CardDescription className="text-gray-400">
                        Hoàn thành {certificates.length} khóa học
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black border border-[#2D2D2D]">
                      <Target className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Đạt mục tiêu</CardTitle>
                      <CardDescription className="text-gray-400">
                        {Math.round((certificates.length / 5) * 100)}% mục tiêu năm
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}

        {/* Continue Learning CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-[#0F0F0F] via-[#050505] to-[#151515] border border-[#2D2D2D]">
            <CardContent className="p-8 text-center text-white">
              <Award className="h-12 w-12 mx-auto mb-4 text-blue-400" />
              <h2 className="text-2xl mb-2">Tiếp tục chinh phục</h2>
              <p className="text-gray-400 mb-6">
                Khám phá thêm khóa học để nhận thêm chứng chỉ và nâng cao kỹ năng
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <DarkOutlineButton
                  size="lg"
                  asChild
                >
                  <Link to="/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Khám phá khóa học
                  </Link>
                </DarkOutlineButton>
                <DarkOutlineButton
                  size="lg"
                >
                  Chia sẻ thành tích
                </DarkOutlineButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
