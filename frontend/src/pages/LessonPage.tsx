import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ChevronLeft,
  FileText,
  MessageCircle,
  BookOpen,
  ClipboardList,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { VideoPlayer } from '../components/Lesson/VideoPlayer';
import { LessonList } from '../components/Lesson/LessonList';
import { Transcript } from '../components/Lesson/Transcript';
import { Notes } from '../components/Lesson/Notes';
import { coursesApi, lessonsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { Course, Lesson, Enrollment, CourseLessonsResponse } from '../lib/api/types';

export function LessonPage() {
  const params = useParams<{ id: string; lessonId?: string }>();
  const courseId = params.id;
  const lessonId = params.lessonId;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [transcriptData, setTranscriptData] = useState<{ transcript?: string; transcriptJson?: any } | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialVideoTime, setInitialVideoTime] = useState(0);
  
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load course and lessons
  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        
        // Load course and lessons in parallel
        const [courseData, lessonsData] = await Promise.all([
          coursesApi.getCourseById(courseId),
          lessonsApi.getCourseLessons(courseId),
        ]);

        setCourse(courseData);
        setLessons(lessonsData.lessons || []);

        // Check enrollment
        try {
          const enrollments = await coursesApi.getEnrollments();
          const userEnrollment = enrollments.find(
            (e) => e.courseId === Number(courseId) && e.userId === Number(user?.id)
          );
          setEnrollment(userEnrollment || null);
        } catch (error) {
          // User might not be enrolled, that's okay
          setEnrollment(null);
        }

        // Select initial lesson
        if (lessonId) {
          const lesson = lessonsData.lessons.find((l) => String(l.id) === lessonId);
          if (lesson) {
            setSelectedLesson(lesson);
          } else if (lessonsData.lessons.length > 0) {
            setSelectedLesson(lessonsData.lessons[0]);
          }
        } else if (lessonsData.lessons.length > 0) {
          setSelectedLesson(lessonsData.lessons[0]);
        }
      } catch (error: any) {
        console.error('Error loading course data:', error);
        toast.error('Không thể tải thông tin khóa học');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, lessonId, user?.id]);

  // Load video and transcript when lesson changes
  useEffect(() => {
    const loadLessonData = async () => {
      if (!selectedLesson) return;

      try {
        setVideoLoading(true);
        setVideoUrl('');
        setTranscriptData(null);
        setInitialVideoTime(0);

        // Load video URL and transcript in parallel
        const [videoData, transcriptData] = await Promise.all([
          lessonsApi.getLessonVideo(selectedLesson.id).catch(() => ({ videoUrl: selectedLesson.videoUrl || '' })),
          lessonsApi.getLessonTranscript(selectedLesson.id).catch(() => null),
        ]);

        setVideoUrl(videoData.videoUrl || selectedLesson.videoUrl || '');
        
        if (transcriptData) {
          setTranscriptData(transcriptData);
        } else if (selectedLesson.transcriptUrl) {
          setTranscriptData({ transcript: undefined, transcriptJson: undefined });
        }

        // Load progress for this lesson (if enrolled)
        if (enrollment) {
          try {
            // TODO: Load lesson progress from progress API
            // For now, we'll use enrollment progress
            // const progress = await progressApi.getLessonProgress(selectedLesson.id);
            // setInitialVideoTime(progress.lastPosition || 0);
          } catch (error) {
            // Ignore progress errors
          }
        }
      } catch (error: any) {
        console.error('Error loading lesson data:', error);
        toast.error('Không thể tải video bài học');
      } finally {
        setVideoLoading(false);
      }
    };

    loadLessonData();
  }, [selectedLesson, enrollment]);

  // Handle lesson selection
  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Update URL without navigation
    if (courseId) {
      window.history.pushState({}, '', `/courses/${courseId}/lessons/${lesson.id}`);
    }
  };

  // Handle video time update (auto-save progress)
  const handleTimeUpdate = (currentTime: number, duration: number) => {
    setCurrentTime(currentTime);
    
    // Auto-save progress every 10 seconds
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }
    
    progressSaveTimeoutRef.current = setTimeout(() => {
      if (selectedLesson && enrollment) {
        // TODO: Save progress to API
        // await progressApi.updateLessonProgress(selectedLesson.id, {
        //   position: currentTime,
        //   watchDuration: currentTime,
        // });
      }
    }, 10000);
  };

  // Handle video ended
  const handleVideoEnded = () => {
    if (selectedLesson && enrollment) {
      // TODO: Mark lesson as completed
      // await progressApi.completeLesson(selectedLesson.id);
      if (!completedLessonIds.includes(selectedLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, selectedLesson.id]);
      }
    }
  };

  // Handle mark as complete
  const handleMarkComplete = async () => {
    if (!selectedLesson || !enrollment) {
      toast.error('Bạn cần đăng ký khóa học để đánh dấu hoàn thành');
      return;
    }

    try {
      // TODO: Call API to mark lesson as completed
      // await progressApi.completeLesson(selectedLesson.id);
      if (!completedLessonIds.includes(selectedLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, selectedLesson.id]);
      }
      toast.success('Đã đánh dấu bài học hoàn thành');
    } catch (error: any) {
      toast.error('Không thể đánh dấu hoàn thành');
    }
  };

  // Handle transcript time click
  const handleTranscriptTimeClick = (time: number) => {
    // This will be handled by VideoPlayer component
    // We need to pass a ref to VideoPlayer to control it
  };

  // Navigate to next/previous lesson
  const navigateToLesson = (direction: 'next' | 'prev') => {
    if (!selectedLesson || lessons.length === 0) return;

    const currentIndex = lessons.findIndex((l) => l.id === selectedLesson.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < lessons.length) {
      handleLessonSelect(lessons[newIndex]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-white">Không tìm thấy khóa học</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to="/dashboard">Quay lại Dashboard</Link>
        </Button>
      </div>
    );
  }

  const enrollmentProgress = enrollment?.progressPercentage || 0;
  const isEnrolled = !!enrollment;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-[#1A1A1A] border-b border-[#2D2D2D] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="!text-white hover:bg-white/10">
                <Link to="/dashboard">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h2 className="font-semibold line-clamp-1 text-white">{course.title}</h2>
                <p className="text-sm text-gray-400">
                  {enrollmentProgress.toFixed(0)}% hoàn thành
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DarkOutlineButton size="sm" asChild>
                <Link to="/ai-chat">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  AI Tutor
                </Link>
              </DarkOutlineButton>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden bg-[#1A1A1A] border-[#2D2D2D]">
              <VideoPlayer
                videoUrl={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                initialTime={initialVideoTime}
              />
            </Card>

            {/* Lesson Info and Navigation */}
            {selectedLesson && (
              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white">{selectedLesson.title}</CardTitle>
                      {selectedLesson.description && (
                        <p className="text-sm text-gray-400 mt-2">{selectedLesson.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#2D2D2D] !text-white hover:bg-[#1F1F1F]"
                        onClick={handleMarkComplete}
                        disabled={!isEnrolled || completedLessonIds.includes(selectedLesson.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {completedLessonIds.includes(selectedLesson.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2D2D2D] !text-white hover:bg-[#1F1F1F]"
                      onClick={() => navigateToLesson('prev')}
                      disabled={!lessons.find((l) => l.id === selectedLesson.id) || lessons.findIndex((l) => l.id === selectedLesson.id) === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Bài trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2D2D2D] !text-white hover:bg-[#1F1F1F]"
                      onClick={() => navigateToLesson('next')}
                      disabled={!lessons.find((l) => l.id === selectedLesson.id) || lessons.findIndex((l) => l.id === selectedLesson.id) === lessons.length - 1}
                    >
                      Bài tiếp theo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full bg-[#1A1A1A] border border-[#2D2D2D]">
                <TabsTrigger value="overview" className="flex-1 !text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]">
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value="transcript" className="flex-1 !text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]">
                  <FileText className="h-4 w-4 mr-2" />
                  Transcript
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 !text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D]">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ghi chú
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <CardContent className="pt-6">
                    <div className="prose max-w-none">
                      <h3 className="text-white">Trong bài học này bạn sẽ học:</h3>
                      {selectedLesson?.content ? (
                        <div className="text-gray-300 whitespace-pre-wrap">{selectedLesson.content}</div>
                      ) : (
                        <ul className="text-gray-300">
                          <li>Khái niệm cơ bản về {selectedLesson?.title}</li>
                          <li>Cách triển khai và áp dụng vào dự án</li>
                          <li>Best practices và tips</li>
                          <li>Bài tập thực hành</li>
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                {selectedLesson && (
                  <Transcript
                    transcriptUrl={selectedLesson.transcriptUrl}
                    transcriptJson={transcriptData?.transcriptJson}
                    transcriptText={transcriptData?.transcript}
                    onTimeClick={handleTranscriptTimeClick}
                    currentTime={currentTime}
                  />
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                {selectedLesson && (
                  <Notes
                    lessonId={selectedLesson.id}
                    initialNotes=""
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <LessonList
              lessons={lessons}
              selectedLessonId={selectedLesson?.id}
              onLessonSelect={handleLessonSelect}
              enrollmentProgress={enrollmentProgress}
              completedLessonIds={completedLessonIds}
              isEnrolled={isEnrolled}
              courseTitle={course.title}
            />

            <div className="mt-4 space-y-2">
              <DarkOutlineButton className="w-full" asChild>
                <Link to="/ai-chat">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Hỏi AI Tutor
                </Link>
              </DarkOutlineButton>
              {selectedLesson && (
                <DarkOutlineButton className="w-full" asChild>
                  <Link to={`/quiz/${selectedLesson.id}`}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Làm Quiz
                  </Link>
                </DarkOutlineButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
