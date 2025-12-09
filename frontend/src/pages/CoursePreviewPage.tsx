import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Using HTML5 video player with enhanced controls
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
} from '../components/ui/dialog';
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Award,
  PlayCircle,
  Globe,
  Download,
  Share2,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PreviewData {
  title: string;
  description: string;
  shortDescription?: string;
  categoryId: number;
  categoryName: string;
  level: string;
  price: number;
  discountPrice?: number;
  requirements?: string;
  whatYouLearn?: string;
  courseObjectives?: string;
  targetAudience?: string;
  language?: string;
  tags: string[];
  tagNames: string[];
  thumbnailPreview?: string | null;
  previewVideoPreview?: string | null;
}

export function CoursePreviewPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreviewVideo, setShowPreviewVideo] = useState(false);

  useEffect(() => {
    // Load preview data from sessionStorage
    const stored = sessionStorage.getItem('coursePreviewData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setPreviewData(data);
      } catch (error) {
        console.error('Error parsing preview data:', error);
        navigate('/instructor/courses/create');
      }
    } else {
      navigate('/instructor/courses/create');
    }
  }, [navigate]);

  if (!previewData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-foreground">Đang tải...</h1>
      </div>
    );
  }

  const levelLabels: Record<string, string> = {
    BEGINNER: 'Cơ bản',
    INTERMEDIATE: 'Trung cấp',
    ADVANCED: 'Nâng cao',
    beginner: 'Cơ bản',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
  };

  const finalPrice = previewData.discountPrice || previewData.price;
  const isFree = finalPrice === 0;

  const formatPriceLocal = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-background border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-2 pb-7">
          <div className="mb-3">
            <Button
              variant="outline"
              className="border-2 border-[#2D2D2D] !text-white bg-black hover:bg-[#1F1F1F] rounded-lg"
              size="lg"
              onClick={() => window.close()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Đóng
            </Button>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#1A1A1A] border-2 border-[#2D2D2D] rounded-xl p-6 overflow-hidden">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <span>Xem trước</span>
                <span>/</span>
                <span>{previewData.categoryName}</span>
              </div>

              {/* Title & Badges */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-blue-600 text-white">
                    {levelLabels[previewData.level] || previewData.level}
                  </Badge>
                  <Badge variant="outline" className="text-white border-[#2D2D2D]">
                    {previewData.categoryName}
                  </Badge>
                  {previewData.tagNames.length > 0 && previewData.tagNames.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-white border-[#2D2D2D]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl mb-3 text-white font-bold leading-tight">{previewData.title}</h1>
                <p className="text-base text-gray-300 leading-relaxed">
                  {previewData.shortDescription || previewData.description}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold text-white">0</span>
                  </div>
                  <p className="text-xs text-gray-400">Đánh giá</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-bold text-white">0</span>
                  </div>
                  <p className="text-xs text-gray-400">Học viên</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-bold text-white">0</span>
                  </div>
                  <p className="text-xs text-gray-400">Bài học</p>
                </div>
                <div className="bg-[#1A1A1A] rounded-lg p-3 border border-[#2D2D2D]">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-bold text-white">0h</span>
                  </div>
                  <p className="text-xs text-gray-400">Thời lượng</p>
                </div>
              </div>

              {/* Instructor */}
              {currentUser && (
                <div className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg mb-6">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.avatarUrl || currentUser.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white">{currentUser.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Giảng viên</p>
                    <p className="text-sm font-semibold text-white">{currentUser.fullName}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20 bg-[#1A1A1A] border-[#2D2D2D] overflow-hidden">
                {previewData.thumbnailPreview ? (
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <img src={previewData.thumbnailPreview} alt={previewData.title} className="w-full h-full object-cover" />
                    {previewData.previewVideoPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Button 
                          size="lg" 
                          variant="secondary" 
                          className="rounded-full"
                          onClick={() => setShowPreviewVideo(true)}
                        >
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Xem giới thiệu
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-video overflow-hidden rounded-t-lg bg-[#1F1F1F] flex items-center justify-center">
                    {previewData.previewVideoPreview ? (
                      <Button 
                        size="lg" 
                        variant="secondary" 
                        className="rounded-full"
                        onClick={() => setShowPreviewVideo(true)}
                      >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Xem giới thiệu
                      </Button>
                    ) : (
                      <BookOpen className="h-16 w-16 text-gray-600" />
                    )}
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  {isFree ? (
                    <div className="text-3xl font-bold text-green-600">Miễn phí</div>
                  ) : (
                    <div>
                      {previewData.discountPrice ? (
                        <div>
                          <div className="text-3xl font-bold text-blue-600 mb-1">{formatPriceLocal(finalPrice)}</div>
                          <div className="text-lg text-gray-400 line-through">{formatPriceLocal(previewData.price)}</div>
                          <Badge className="bg-red-500 mt-2">
                            Giảm {Math.round((1 - previewData.discountPrice / previewData.price) * 100)}%
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-blue-600">{formatPriceLocal(finalPrice)}</div>
                      )}
                    </div>
                  )}

                  {/* Notice */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-500">
                      ⚠️ Đây là bản xem trước. Khóa học chưa được lưu.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <DarkOutlineButton className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Chia sẻ
                    </DarkOutlineButton>
                  </div>

                  {/* Course Includes */}
                  <div className="space-y-3 pt-4 border-t border-[#2D2D2D]">
                    <p className="font-semibold text-white">Khóa học bao gồm:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-white">Video bài giảng</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="text-white">Nội dung chi tiết</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-blue-600" />
                        <span className="text-white">Tài liệu tải về</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span className="text-white">Truy cập mọi lúc, mọi nơi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span className="text-white">Chứng chỉ hoàn thành</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-7 bg-background">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start bg-[#1A1A1A] border border-[#2D2D2D]">
                <TabsTrigger value="overview" className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black">Tổng quan</TabsTrigger>
                <TabsTrigger value="curriculum" className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black">Nội dung</TabsTrigger>
                <TabsTrigger value="reviews" className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black">Đánh giá</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-6">
                <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <CardHeader>
                    <CardTitle className="text-white">Mô tả khóa học</CardTitle>
                  </CardHeader>
                  <CardContent className="prose max-w-none">
                    <p className="text-gray-300 whitespace-pre-wrap">{previewData.description}</p>
                  </CardContent>
                </Card>

                {previewData.whatYouLearn && (
                  <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <CardHeader>
                      <CardTitle className="text-white">Bạn sẽ học được gì?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {previewData.whatYouLearn}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {previewData.courseObjectives && (
                  <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <CardHeader>
                      <CardTitle className="text-white">Mục tiêu khóa học</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {previewData.courseObjectives}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {previewData.requirements && (
                  <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <CardHeader>
                      <CardTitle className="text-white">Yêu cầu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {previewData.requirements}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {previewData.targetAudience && (
                  <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <CardHeader>
                      <CardTitle className="text-white">Đối tượng mục tiêu</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300 whitespace-pre-wrap">
                        {previewData.targetAudience}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="mt-6">
                <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <CardHeader>
                    <CardTitle className="text-white">Nội dung khóa học</CardTitle>
                    <CardDescription className="text-gray-400">
                      Nội dung sẽ được thêm sau khi khóa học được lưu
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p>Chưa có bài học nào</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <CardHeader>
                    <CardTitle className="text-white">Đánh giá của học viên</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-400">
                      <Star className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                      <p>Chưa có đánh giá nào</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Related Courses */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Thông tin khóa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-300">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">Cấp độ: {levelLabels[previewData.level] || previewData.level}</span>
                  </div>
                  {previewData.language && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">Ngôn ngữ: {previewData.language === 'vi' ? 'Tiếng Việt' : previewData.language}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Danh mục: {previewData.categoryName}</span>
                  </div>
                </div>
                {previewData.tagNames.length > 0 && (
                  <div className="pt-4 border-t border-[#2D2D2D]">
                    <p className="text-sm font-semibold text-white mb-2">Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {previewData.tagNames.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-white border-[#2D2D2D]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Preview Video Dialog */}
      <Dialog open={showPreviewVideo} onOpenChange={setShowPreviewVideo}>
        <DialogContent className="!max-w-[60vw] !w-[60vw] !max-h-[85vh] sm:!max-w-[60vw] bg-[#1A1A1A] border-[#2D2D2D] text-white p-0">
          {previewData.previewVideoPreview && (
            <div className="relative w-full aspect-video bg-black">
              <button
                onClick={() => setShowPreviewVideo(false)}
                className="absolute top-4 right-4 z-50 p-2 bg-black/70 hover:bg-black/90 rounded-full text-white transition-colors"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
              <video
                src={previewData.previewVideoPreview}
                controls
                autoPlay
                className="w-full h-full object-contain"
                controlsList="nodownload"
              >
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
