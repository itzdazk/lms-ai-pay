import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Using HTML5 video player with enhanced controls
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
  X,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import type { User } from '../lib/api/types';
import { InstructorInfo } from '../components/Courses';
import { getCourseLevelBadge } from '../lib/courseUtils';

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
  const [instructorData, setInstructorData] = useState<User | null>(null);

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

  // Fetch full user data to get bio
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          const fullUserData = await authApi.getCurrentUser();
          setInstructorData(fullUserData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to currentUser if API fails
          setInstructorData(currentUser);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  if (!previewData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-foreground">Đang tải...</h1>
      </div>
    );
  }

  // Get level badge with colors
  const levelBadge = getCourseLevelBadge(previewData.level);

  const finalPrice = previewData.discountPrice || previewData.price;
  const isFree = finalPrice === 0;

  const formatPriceLocal = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Transform User to Instructor format for InstructorInfo component
  const instructorForDisplay = (user: User | null) => {
    if (!user) return null;
    return {
      id: user.id,
      userName: user.userName,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl || user.avatar,
      bio: user.bio || undefined,
      totalCourses: 0, // Not available in preview context
      otherCourses: [], // Not available in preview context
    };
  };

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background via-background to-[#0F0F0F] border-b border-gray-200/10">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 pb-10">
          <div className="mb-4">
            <Button
              variant="outline"
              className="border-2 border-[#2D2D2D] !text-white bg-black/50 hover:bg-[#1F1F1F] hover:border-[#3D3D3D] rounded-lg backdrop-blur-sm transition-all duration-200"
              size="lg"
              onClick={() => window.close()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Đóng
            </Button>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 relative">
            <div className="lg:col-span-2 bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50 rounded-2xl p-8 overflow-hidden shadow-2xl hover:border-[#3D3D3D]/50 transition-all duration-300">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <span className="hover:text-white transition-colors cursor-default">Xem trước</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-300 font-medium">{previewData.categoryName}</span>
              </div>

              {/* Title & Badges */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={`${levelBadge.className} shadow-lg transition-transform hover:scale-105`}>
                    {levelBadge.label}
                  </Badge>
                  <Badge className="bg-orange-600 text-white hover:bg-orange-700 shadow-lg transition-transform hover:scale-105">
                    {previewData.categoryName}
                  </Badge>
                  {previewData.tagNames.length > 0 && previewData.tagNames.map((tag, index) => (
                    <Badge key={index} className="bg-gray-600 text-white hover:bg-gray-700 shadow-lg transition-transform hover:scale-105">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl mb-4 text-white font-bold leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {previewData.title}
                </h1>
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  {previewData.shortDescription || previewData.description}
                </p>

                {/* Course Info */}
                <div className="bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-semibold text-white">Thông tin khóa học</p>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span>Cấp độ: <span className="font-medium text-white">{levelBadge.label}</span></span>
                    </div>
                    {previewData.language && (
                      <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                        <Globe className="h-4 w-4 text-blue-500" />
                        <span>Ngôn ngữ: <span className="font-medium text-white">{previewData.language === 'vi' ? 'Tiếng Việt' : previewData.language}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>Danh mục: <span className="font-medium text-white">{previewData.categoryName}</span></span>
                    </div>
                    {previewData.tagNames.length > 0 && (
                      <div className="pt-3 border-t border-[#2D2D2D]">
                        <p className="text-xs font-semibold text-gray-400 mb-2">Tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {previewData.tagNames.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs text-gray-400 border-[#2D2D2D] hover:border-gray-500 hover:text-gray-300 transition-colors">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructor Info */}
              {(instructorData || currentUser) && (
                <div className="mb-8">
                  <InstructorInfo instructor={instructorForDisplay(instructorData || currentUser)!} />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-yellow-500/50 transition-all duration-200 shadow-lg hover:shadow-yellow-500/10 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">0</span>
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Đánh giá</p>
                </div>
                <div className="bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-blue-500/50 transition-all duration-200 shadow-lg hover:shadow-blue-500/10 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">0</span>
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Học viên</p>
                </div>
                <div className="bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-green-500/50 transition-all duration-200 shadow-lg hover:shadow-green-500/10 group">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">0</span>
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Bài học</p>
                </div>
                <div className="bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-purple-500/50 transition-all duration-200 shadow-lg hover:shadow-purple-500/10 group">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">0h</span>
                  </div>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Thời lượng</p>
                </div>
              </div>

            </div>

            {/* Sidebar Card */}
            <div className="lg:col-span-1 lg:row-span-2">
              <Card className="sticky top-20 bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50 overflow-hidden self-start shadow-2xl hover:shadow-3xl hover:border-[#3D3D3D]/50 transition-all duration-300 rounded-2xl">
                {previewData.thumbnailPreview ? (
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={previewData.thumbnailPreview} 
                      alt={previewData.title} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                    />
                    {previewData.previewVideoPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-transparent group">
                        <Button 
                          size="lg" 
                          variant="secondary" 
                          className="rounded-full bg-white/90 hover:bg-white text-black shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200"
                          onClick={() => setShowPreviewVideo(true)}
                        >
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Xem giới thiệu
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#1F1F1F] to-[#151515] flex items-center justify-center">
                    {previewData.previewVideoPreview ? (
                      <Button 
                        size="lg" 
                        variant="secondary" 
                        className="rounded-full bg-white/90 hover:bg-white text-black shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200"
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
                <CardContent className="p-5 space-y-4">
                  {/* Price */}
                  <div className="pb-3 border-b border-[#2D2D2D]/50">
                    {isFree ? (
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xl font-bold shadow-md">
                          Miễn phí
                        </div>
                      </div>
                    ) : (
                      <div>
                        {previewData.discountPrice ? (
                          <div className="space-y-1.5">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                              {formatPriceLocal(finalPrice)}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-400 line-through">{formatPriceLocal(previewData.price)}</div>
                              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs shadow-md">
                                Giảm {Math.round((1 - previewData.discountPrice / previewData.price) * 100)}%
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            {formatPriceLocal(finalPrice)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notice */}
                  <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-500/15 to-yellow-500/20 border border-yellow-500/40 rounded-lg p-2.5 shadow-md">
                    <p className="text-xs text-yellow-400 leading-relaxed">
                      ⚠️ Đây là bản xem trước. Khóa học chưa được lưu.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <DarkOutlineButton className="flex-1 hover:bg-[#2D2D2D] hover:border-[#3D3D3D] transition-all duration-200 text-sm py-2">
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Chia sẻ
                    </DarkOutlineButton>
                  </div>

                  {/* Course Includes */}
                  <div className="space-y-2 pt-3 border-t border-[#2D2D2D]/50">
                    <p className="font-semibold text-white text-sm mb-2">Khóa học bao gồm:</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                        <span>Video bài giảng</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <BookOpen className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                        <span>Nội dung chi tiết</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Download className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                        <span>Tài liệu tải về</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Globe className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                        <span>Truy cập mọi lúc, mọi nơi</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-300">
                        <Award className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                        <span>Chứng chỉ hoàn thành</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Main Content - Tổng quan, Nội dung, Đánh giá */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start bg-gradient-to-r from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl p-1 shadow-lg">
                  <TabsTrigger 
                    value="overview" 
                    className="!text-gray-400 data-[state=active]:!text-white data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-blue-600 data-[state=active]:!to-blue-700 data-[state=active]:!shadow-lg transition-all duration-200 rounded-lg px-4 py-2"
                  >
                    Tổng quan
                  </TabsTrigger>
                  <TabsTrigger 
                    value="curriculum" 
                    className="!text-gray-400 data-[state=active]:!text-white data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-green-600 data-[state=active]:!to-green-700 data-[state=active]:!shadow-lg transition-all duration-200 rounded-lg px-4 py-2"
                  >
                    Nội dung
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="!text-gray-400 data-[state=active]:!text-white data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-yellow-600 data-[state=active]:!to-yellow-700 data-[state=active]:!shadow-lg transition-all duration-200 rounded-lg px-4 py-2"
                  >
                    Đánh giá
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-8">
                  <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-400" />
                        </div>
                        <CardTitle className="text-white text-xl">Mô tả khóa học</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="prose max-w-none prose-invert">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{previewData.description}</p>
                    </CardContent>
                  </Card>

                  {previewData.whatYouLearn && (
                    <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-green-500/30 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Award className="h-5 w-5 text-green-400" />
                          </div>
                          <CardTitle className="text-white text-xl">Bạn sẽ học được gì?</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {previewData.whatYouLearn}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {previewData.courseObjectives && (
                    <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-purple-500/30 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Star className="h-5 w-5 text-purple-400" />
                          </div>
                          <CardTitle className="text-white text-xl">Mục tiêu khóa học</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {previewData.courseObjectives}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {previewData.requirements && (
                    <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-orange-500/30 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-orange-400" />
                          </div>
                          <CardTitle className="text-white text-xl">Yêu cầu</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {previewData.requirements}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {previewData.targetAudience && (
                    <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-cyan-400" />
                          </div>
                          <CardTitle className="text-white text-xl">Đối tượng mục tiêu</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {previewData.targetAudience}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Curriculum Tab */}
                <TabsContent value="curriculum" className="mt-8">
                  <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-xl">Nội dung khóa học</CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            Nội dung sẽ được thêm sau khi khóa học được lưu
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-400">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
                          <BookOpen className="h-10 w-10 text-green-500/50" />
                        </div>
                        <p className="text-lg font-medium">Chưa có bài học nào</p>
                        <p className="text-sm text-gray-500 mt-2">Nội dung sẽ được hiển thị sau khi khóa học được lưu</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reviews Tab */}
                <TabsContent value="reviews" className="mt-8">
                  <Card className="bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Star className="h-5 w-5 text-yellow-400" />
                        </div>
                        <CardTitle className="text-white text-xl">Đánh giá của học viên</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-400">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 mb-4">
                          <Star className="h-10 w-10 text-yellow-500/50" />
                        </div>
                        <p className="text-lg font-medium">Chưa có đánh giá nào</p>
                        <p className="text-sm text-gray-500 mt-2">Hãy là người đầu tiên đánh giá khóa học này</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
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
