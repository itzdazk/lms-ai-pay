import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl">Chứng chỉ của tôi</h1>
            <p className="text-gray-600">Các chứng chỉ bạn đã đạt được</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Tổng chứng chỉ</CardTitle>
            <Award className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{certificates.length}</div>
            <p className="text-xs text-gray-500 mt-1">Đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Năm nay</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {certificates.filter(c => 
                new Date(c.issued_at).getFullYear() === new Date().getFullYear()
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Chứng chỉ mới</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Mục tiêu</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">5</div>
            <p className="text-xs text-gray-500 mt-1">Chứng chỉ/năm</p>
          </CardContent>
        </Card>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="h-20 w-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl mb-2">Chưa có chứng chỉ nào</h2>
          <p className="text-gray-600 mb-6">
            Hoàn thành các khóa học để nhận chứng chỉ
          </p>
          <Button asChild>
            <Link to="/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Khám phá khóa học
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map(certificate => {
            const course = getCourseById(certificate.course_id);
            if (!course) return null;

            const issueDate = new Date(certificate.issued_at);
            const certificateId = `EDU-${certificate.id.toUpperCase()}-${issueDate.getFullYear()}`;

            return (
              <Card key={certificate.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                {/* Certificate Preview */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-center mb-2">
                      <span className="text-sm text-gray-600">Chứng chỉ</span>
                    </p>
                    <h3 className="text-center line-clamp-2 text-sm">
                      {course.title}
                    </h3>
                  </div>

                  {/* Decorative corners */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-blue-600/30" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-blue-600/30" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-blue-600/30" />
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-blue-600/30" />
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {course.category_name}
                    </Badge>
                    <Badge className="bg-green-600 text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      Hoàn thành
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs">
                        {issueDate.toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-mono text-gray-500">
                      {certificateId}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.lessons_count} bài học</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{formatDuration(course.duration_minutes)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/certificate/${course.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        Xem
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-3 w-3" />
                    </Button>
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
          <h2 className="text-2xl mb-6">Thành tích</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle>Người học tích cực</CardTitle>
                    <CardDescription>Hoàn thành {certificates.length} khóa học</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Đạt mục tiêu</CardTitle>
                    <CardDescription>
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
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl mb-2">Tiếp tục chinh phục</h2>
            <p className="text-blue-100 mb-6">
              Khám phá thêm khóa học để nhận thêm chứng chỉ và nâng cao kỹ năng
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/courses">
                <BookOpen className="h-4 w-4 mr-2" />
                Khám phá khóa học
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
