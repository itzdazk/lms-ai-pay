import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Using HTML5 video player with enhanced controls
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
} from '../components/ui/dialog';
import {
  BookOpen,
  Award,
  Star,
  CheckCircle,
  Users,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api/auth';
import type { User } from '../lib/api/types';
import {
    CourseHeroSection,
    CourseSidebar,
} from '../components/Courses';

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
            <CourseHeroSection
              categoryName={previewData.categoryName}
              showPreviewWarning={true}
              title={previewData.title}
              shortDescription={previewData.shortDescription}
              description={previewData.description}
              level={previewData.level}
              categoryNameForBadge={previewData.categoryName}
              tags={previewData.tagNames}
              language={previewData.language}
              instructor={
                instructorData || currentUser
                    ? instructorForDisplay(instructorData || currentUser)!
                    : null
              }
              ratingAvg={0}
              ratingCount={0}
              enrolledCount={0}
              totalLessons={0}
              durationHours={0}
            />

            <CourseSidebar
              course={{
                title: previewData.title,
                thumbnailUrl: previewData.thumbnailPreview || null,
                videoPreviewUrl: previewData.previewVideoPreview || null,
                price: previewData.price,
                discountPrice: previewData.discountPrice,
              }}
              isPreview={true}
              onVideoPreviewClick={() => setShowPreviewVideo(true)}
            />
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
