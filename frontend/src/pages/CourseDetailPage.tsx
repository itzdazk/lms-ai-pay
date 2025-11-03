import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Progress } from '../components/ui/progress';
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Award,
  PlayCircle,
  CheckCircle,
  Lock,
  Globe,
  Download,
  Share2
} from 'lucide-react';
import { getCourseById, mockLessons, formatPrice, formatDuration, isEnrolled, currentUser, getEnrollment } from '../lib/mockData';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const course = getCourseById(id || '');
  
  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Không tìm thấy khóa học</h1>
        <Button asChild>
          <Link to="/courses">Quay lại danh sách khóa học</Link>
        </Button>
      </div>
    );
  }

  const enrolled = isEnrolled(currentUser.id, course.id);
  const enrollment = getEnrollment(currentUser.id, course.id);
  const courseLessons = mockLessons.filter(lesson => lesson.course_id === course.id);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Link to="/courses" className="hover:text-white">Khóa học</Link>
                <span>/</span>
                <Link to={`/courses?category=${course.category_id}`} className="hover:text-white">
                  {course.category_name}
                </Link>
              </div>

              {/* Title & Badges */}
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-blue-600">
                    {course.level === 'beginner' && 'Cơ bản'}
                    {course.level === 'intermediate' && 'Trung cấp'}
                    {course.level === 'advanced' && 'Nâng cao'}
                  </Badge>
                  {course.featured && (
                    <Badge className="bg-yellow-500">⭐ Nổi bật</Badge>
                  )}
                  <Badge variant="outline" className="text-white border-white">
                    {course.category_name}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl mb-4">{course.title}</h1>
                <p className="text-lg text-gray-300">{course.description}</p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl">{course.rating_avg}</span>
                  <span className="text-gray-300">({course.rating_count} đánh giá)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{course.enrolled_count.toLocaleString()} học viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{course.lessons_count} bài học</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{formatDuration(course.duration_minutes)}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={course.instructor_avatar} />
                  <AvatarFallback>{course.instructor_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-gray-300">Giảng viên</p>
                  <p className="text-lg">{course.instructor_name}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Button size="lg" variant="secondary" className="rounded-full">
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Xem giới thiệu
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  {course.is_free ? (
                    <div className="text-3xl text-green-600">Miễn phí</div>
                  ) : (
                    <div>
                      {course.discount_price ? (
                        <div>
                          <div className="text-3xl text-blue-600 mb-1">{formatPrice(course.discount_price)}</div>
                          <div className="text-lg text-gray-400 line-through">{formatPrice(course.original_price)}</div>
                          <Badge className="bg-red-500 mt-2">
                            Giảm {Math.round((1 - course.discount_price / course.original_price) * 100)}%
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-3xl text-blue-600">{formatPrice(course.original_price)}</div>
                      )}
                    </div>
                  )}

                  {/* Enrollment Progress */}
                  {enrolled && enrollment ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Tiến độ học tập</span>
                        <span className="font-semibold">{enrollment.progress_percentage}%</span>
                      </div>
                      <Progress value={enrollment.progress_percentage} />
                      <Button asChild className="w-full" size="lg">
                        <Link to={`/learn/${course.id}`}>
                          Tiếp tục học
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link to={`/checkout/${course.id}`}>
                        {course.is_free ? 'Đăng ký học' : 'Mua khóa học'}
                      </Link>
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Chia sẻ
                    </Button>
                  </div>

                  {/* Course Includes */}
                  <div className="space-y-3 pt-4 border-t">
                    <p className="font-semibold">Khóa học bao gồm:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{formatDuration(course.duration_minutes)} video</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span>{course.lessons_count} bài học</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-blue-600" />
                        <span>Tài liệu tải về</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <span>Truy cập mọi lúc, mọi nơi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>Chứng chỉ hoàn thành</span>
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
      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="curriculum">Nội dung</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mô tả khóa học</CardTitle>
                  </CardHeader>
                  <CardContent className="prose max-w-none">
                    <p>{course.description}</p>
                    <p className="mt-4">
                      Khóa học này sẽ giúp bạn nắm vững kiến thức và kỹ năng cần thiết để trở thành một chuyên gia trong lĩnh vực này. 
                      Với phương pháp giảng dạy thực tế và bài tập thực hành, bạn sẽ có thể áp dụng ngay những gì đã học vào công việc.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bạn sẽ học được gì?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        'Nắm vững kiến thức nền tảng',
                        'Thực hành với dự án thực tế',
                        'Xây dựng portfolio chuyên nghiệp',
                        'Áp dụng vào công việc ngay lập tức',
                        'Học cách debug và tối ưu code',
                        'Best practices trong ngành'
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Yêu cầu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-gray-600">
                      <li>Máy tính cài đặt hệ điều hành Windows/Mac/Linux</li>
                      <li>Kết nối internet ổn định</li>
                      <li>Nhiệt huyết và sẵn sàng học hỏi</li>
                      {course.level !== 'beginner' && <li>Kiến thức cơ bản về lập trình (đối với khóa nâng cao)</li>}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Nội dung khóa học</CardTitle>
                    <CardDescription>
                      {courseLessons.length} bài học • {formatDuration(course.duration_minutes)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="section-1">
                        <AccordionTrigger>
                          <div className="flex items-center justify-between w-full pr-4">
                            <span>Phần 1: Giới thiệu</span>
                            <span className="text-sm text-gray-500">{courseLessons.length} bài học</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {courseLessons.map((lesson, index) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.is_preview || enrolled ? (
                                    <PlayCircle className="h-5 w-5 text-blue-600" />
                                  ) : (
                                    <Lock className="h-5 w-5 text-gray-400" />
                                  )}
                                  <div>
                                    <p className="font-medium">{lesson.title}</p>
                                    {lesson.is_preview && !enrolled && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        Preview
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>{lesson.duration_minutes} phút</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Đánh giá của học viên</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-5xl mb-2">{course.rating_avg}</div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">{course.rating_count} đánh giá</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map(star => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-sm w-12">{star} sao</span>
                            <Progress value={star === 5 ? 80 : star === 4 ? 15 : 5} className="flex-1" />
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {star === 5 ? '80%' : star === 4 ? '15%' : '5%'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sample Reviews */}
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="border-b pb-4">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p>Học viên {i}</p>
                                <p className="text-sm text-gray-500">2 tuần trước</p>
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[...Array(5)].map((_, j) => (
                                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <p className="text-gray-600">
                                Khóa học rất hữu ích và dễ hiểu. Giảng viên giải thích rất chi tiết và có nhiều ví dụ thực tế.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Related Courses */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Khóa học liên quan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Link key={i} to={`/courses/${i}`} className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <img
                      src={course.thumbnail}
                      alt="Course"
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2 text-sm mb-1">
                        Khóa học liên quan {i}
                      </p>
                      <p className="text-sm text-blue-600">999.000₫</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
