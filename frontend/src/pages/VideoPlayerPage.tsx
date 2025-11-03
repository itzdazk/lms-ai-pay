import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import {
  PlayCircle,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
  Maximize,
  CheckCircle,
  Lock,
  ChevronLeft,
  FileText,
  MessageCircle,
  BookOpen
} from 'lucide-react';
import { getCourseById, mockLessons, getEnrollment, currentUser } from '../lib/mockData';

export function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const course = getCourseById(id || '');
  const [selectedLesson, setSelectedLesson] = useState(mockLessons[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl mb-4">Không tìm thấy khóa học</h1>
        <Button asChild>
          <Link to="/dashboard">Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  const enrollment = getEnrollment(currentUser.id, course.id);
  const courseLessons = mockLessons.filter(lesson => lesson.course_id === course.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h2 className="font-semibold line-clamp-1">{course.title}</h2>
                <p className="text-sm text-gray-600">
                  {enrollment?.progress_percentage || 0}% hoàn thành
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/ai-chat">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  AI Tutor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative bg-black aspect-video">
                {/* Placeholder for video */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <PlayCircle className="h-20 w-20 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video Player Placeholder</p>
                    <p className="text-sm text-gray-400 mt-2">In production, integrate actual video player</p>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer group">
                      <div 
                        className="h-full bg-blue-600 transition-all group-hover:bg-blue-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2 ml-2">
                        <Volume2 className="h-4 w-4" />
                        <div className="w-20 h-1 bg-white/30 rounded-full">
                          <div className="h-full w-3/4 bg-white rounded-full" />
                        </div>
                      </div>
                      <span className="text-sm ml-2">5:23 / 15:00</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lesson Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{selectedLesson.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">{selectedLesson.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Đánh dấu hoàn thành
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="transcript">
                  <FileText className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="notes">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ghi chú
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose max-w-none">
                      <h3>Trong bài học này bạn sẽ học:</h3>
                      <ul>
                        <li>Khái niệm cơ bản về {selectedLesson.title}</li>
                        <li>Cách triển khai và áp dụng vào dự án</li>
                        <li>Best practices và tips</li>
                        <li>Bài tập thực hành</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {[
                        { time: '00:00', text: 'Xin chào các bạn, hôm nay chúng ta sẽ học về...' },
                        { time: '00:15', text: 'Đầu tiên, chúng ta cần hiểu khái niệm cơ bản...' },
                        { time: '00:45', text: 'Tiếp theo, chúng ta sẽ xem cách triển khai...' },
                        { time: '01:20', text: 'Một điều quan trọng cần lưu ý là...' },
                      ].map((item, index) => (
                        <div key={index} className="flex gap-4 hover:bg-gray-50 p-2 rounded cursor-pointer">
                          <span className="text-sm text-blue-600 font-mono">{item.time}</span>
                          <p className="text-sm flex-1">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <Card>
                  <CardContent className="pt-6">
                    <textarea
                      className="w-full min-h-48 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Viết ghi chú của bạn ở đây..."
                    />
                    <Button className="mt-4">Lưu ghi chú</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Nội dung khóa học</span>
                  <Badge variant="outline">{courseLessons.length} bài</Badge>
                </CardTitle>
                <Progress value={enrollment?.progress_percentage || 0} className="mt-2" />
                <p className="text-sm text-gray-600 mt-2">
                  {enrollment?.progress_percentage || 0}% hoàn thành
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="section-1" className="w-full">
                  <AccordionItem value="section-1">
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>Phần 1: Giới thiệu</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {courseLessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedLesson.id === lesson.id
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {lesson.is_preview ? (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{lesson.title}</p>
                                <p className="text-xs text-gray-500">{lesson.duration_minutes} phút</p>
                              </div>
                            </div>
                            {!lesson.is_preview && !enrollment && (
                              <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="mt-4 pt-4 border-t space-y-2">
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/ai-chat">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Hỏi AI Tutor
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link to="/quiz/1">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Làm Quiz
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
