import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { DarkTabsList, DarkTabsTrigger } from '../components/ui/dark-tabs';
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
import { coursesApi, lessonsApi, lessonNotesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { convertTranscriptToVTT, createVTTBlobURL } from '../lib/transcriptUtils';
import type { Course, Lesson, Enrollment, CourseLessonsResponse } from '../lib/api/types';

export function LessonPage() {
  const params = useParams<{ slug: string; lessonId?: string }>();
  const courseSlug = params.slug;
  const lessonId = params.lessonId;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [subtitleUrl, setSubtitleUrl] = useState<string | undefined>(undefined);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lessonNotes, setLessonNotes] = useState<string>('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialVideoTime, setInitialVideoTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  
  const progressSaveTimeoutRef = useRef<number | null>(null);
  const previousCourseSlugRef = useRef<string | null>(null);
  const subtitleBlobUrlRef = useRef<string | null>(null);

  // Save referrer when entering lesson page for the first time (when courseSlug changes)
  useEffect(() => {
    if (courseSlug && courseSlug !== previousCourseSlugRef.current) {
      // Course slug changed, meaning we're entering lesson page from outside
      const referrerKey = `lesson_referrer_${courseSlug}`;
      
      // Only save referrer if we don't have one for this course yet
      if (!sessionStorage.getItem(referrerKey)) {
        // Try to get referrer from document.referrer
        const documentReferrer = document.referrer;
        let referrerPath = `/courses/${courseSlug}`; // Default fallback to course detail page
        
        if (documentReferrer) {
          try {
            const referrerUrl = new URL(documentReferrer);
            const referrerPathname = referrerUrl.pathname;
            
            // Only use referrer if it's from our app and not from lesson pages
            if (referrerPathname && !referrerPathname.includes('/lessons/')) {
              referrerPath = referrerPathname;
            }
          } catch (e) {
            // Invalid URL, use default
          }
        }
        
        // Save referrer for this course
        sessionStorage.setItem(referrerKey, referrerPath);
      }
      
      previousCourseSlugRef.current = courseSlug;
    }
  }, [courseSlug]);

  // Load course and lessons
  useEffect(() => {
    const loadData = async () => {
      if (!courseSlug) return;

      try {
        setLoading(true);
        
        // Load course by slug first (public pages use slug)
        const courseData = await coursesApi.getCourseBySlug(courseSlug);
        const courseId = courseData.id;
        
        // Then load lessons using courseId
        const lessonsData = await lessonsApi.getCourseLessons(courseId);

        setCourse(courseData);
        setLessons(lessonsData.lessons || []);

        // Check enrollment
        try {
          const enrollments = await coursesApi.getEnrollments();
          const userEnrollment = enrollments.find(
            (e) => e.courseId === courseId && e.userId === Number(user?.id)
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
  }, [courseSlug, lessonId, user?.id]);

  // Track previous lesson ID to prevent unnecessary reloads
  const previousLessonIdRef = useRef<number | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (subtitleBlobUrlRef.current) {
        URL.revokeObjectURL(subtitleBlobUrlRef.current);
        subtitleBlobUrlRef.current = null;
      }
    };
  }, []);

  // Load video and transcript when lesson changes
  useEffect(() => {
    const loadLessonData = async () => {
      if (!selectedLesson) return;

      // Prevent reload if same lesson ID
      if (previousLessonIdRef.current === selectedLesson.id) {
        return;
      }
      previousLessonIdRef.current = selectedLesson.id;

      try {
        setVideoLoading(true);
        setVideoUrl('');
        setInitialVideoTime(0);

        // Load video URL and lesson details (to get both transcriptUrl and transcriptJsonUrl) in parallel
        const [videoData, lessonDetails] = await Promise.all([
          lessonsApi.getLessonVideo(selectedLesson.id).catch(() => ({ videoUrl: selectedLesson.videoUrl || '' })),
          lessonsApi.getLessonById(selectedLesson.id).catch((err) => {
            console.error('Error loading lesson details:', err);
            return null;
          }),
        ]);

        setVideoUrl(videoData.videoUrl || selectedLesson.videoUrl || '');
        
        console.log('Lesson details:', lessonDetails);
        console.log('transcriptUrl:', lessonDetails?.transcriptUrl);
        console.log('transcriptJsonUrl:', lessonDetails?.transcriptJsonUrl);
        
        // Update selectedLesson with transcriptJsonUrl only if it's different
        if (lessonDetails) {
          setSelectedLesson(prev => {
            if (!prev) return null;
            // Only update if transcriptJsonUrl actually changed
            if (prev.transcriptJsonUrl !== lessonDetails.transcriptJsonUrl) {
              return { 
                ...prev, 
                transcriptUrl: lessonDetails.transcriptUrl,
                transcriptJsonUrl: lessonDetails.transcriptJsonUrl,
              };
            }
            return prev;
          });
        }

        // Load and convert transcript to VTT for subtitle
        // Clean up previous blob URL
        if (subtitleBlobUrlRef.current) {
          URL.revokeObjectURL(subtitleBlobUrlRef.current);
          subtitleBlobUrlRef.current = null;
        }

        if (lessonDetails?.transcriptJsonUrl) {
          try {
            // Handle both relative and absolute URLs
            let url = lessonDetails.transcriptJsonUrl;
            if (lessonDetails.transcriptJsonUrl.startsWith('/')) {
              const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
              const baseUrl = API_BASE_URL.replace('/api/v1', '');
              url = `${baseUrl}${lessonDetails.transcriptJsonUrl}`;
            }

            const response = await fetch(url, {
              credentials: 'include',
            });

            if (response.ok) {
              const transcriptData = await response.json();
              
              // Parse transcript items
              let items: Array<{ time: number; text: string }> = [];
              if (Array.isArray(transcriptData)) {
                items = transcriptData.map((item: any) => ({
                  time: item.start || item.time || 0,
                  text: item.text || item.content || '',
                }));
              } else if (transcriptData.segments && Array.isArray(transcriptData.segments)) {
                items = transcriptData.segments.map((segment: any) => ({
                  time: segment.start || segment.time || 0,
                  text: segment.text || segment.content || '',
                }));
              }

              // Convert to VTT and create blob URL
              if (items.length > 0) {
                const vttContent = convertTranscriptToVTT(items);
                const blobUrl = createVTTBlobURL(vttContent);
                subtitleBlobUrlRef.current = blobUrl;
                setSubtitleUrl(blobUrl);
              } else {
                setSubtitleUrl(undefined);
              }
            } else {
              setSubtitleUrl(undefined);
            }
          } catch (error) {
            console.error('Error loading transcript for subtitle:', error);
            // Subtitle is optional, don't show error
            setSubtitleUrl(undefined);
          }
        } else {
          setSubtitleUrl(undefined);
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

        // Load notes for this lesson
        if (enrollment && user) {
          try {
            setNotesLoading(true);
            const noteData = await lessonNotesApi.getLessonNote(selectedLesson.id);
            setLessonNotes(noteData.note?.content || '');
          } catch (error: any) {
            // If note doesn't exist (404), that's okay - just set empty
            if (error.response?.status !== 404) {
              console.error('Error loading lesson notes:', error);
            }
            setLessonNotes('');
          } finally {
            setNotesLoading(false);
          }
        } else {
          setLessonNotes('');
        }
      } catch (error: any) {
        console.error('Error loading lesson data:', error);
        toast.error('Không thể tải video bài học');
      } finally {
        setVideoLoading(false);
      }
    };

    loadLessonData();
  }, [selectedLesson?.id, enrollment]);

  // Handle lesson selection
  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    // Update URL without navigation (using slug for public pages)
    if (courseSlug) {
      window.history.pushState({}, '', `/courses/${courseSlug}/lessons/${lesson.id}`);
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
    setSeekTo(time);
    // Reset seekTo after a short delay to allow seeking to the same time again if needed
    setTimeout(() => {
      setSeekTo(undefined);
    }, 100);
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

  const enrollmentProgress = typeof enrollment?.progressPercentage === 'number' 
    ? enrollment.progressPercentage 
    : parseFloat(String(enrollment?.progressPercentage || 0)) || 0;
  const isEnrolled = !!enrollment;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-[#1A1A1A] border-b border-[#2D2D2D] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (courseSlug) {
                    // Get saved referrer for this course
                    const referrerKey = `lesson_referrer_${courseSlug}`;
                    const savedReferrer = sessionStorage.getItem(referrerKey);
                    
                    if (savedReferrer && !savedReferrer.includes('/lessons')) {
                      // Navigate to saved referrer (course detail page or other page)
                      navigate(savedReferrer);
                    } else {
                      // Fallback to course detail page using slug
                      navigate(`/courses/${courseSlug}`);
                    }
                  } else {
                    // Last resort: go back in history
                    navigate(-1);
                  }
                }}
                className="!text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
              <div>
                <h2 className="font-semibold line-clamp-1 text-white">{course.title}</h2>
                <p className="text-sm text-gray-400">
                  {Number(enrollmentProgress).toFixed(0)}% hoàn thành
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
                subtitleUrl={subtitleUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                initialTime={initialVideoTime}
                seekTo={seekTo}
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
                      <DarkOutlineButton
                        size="sm"
                        onClick={handleMarkComplete}
                        disabled={!isEnrolled || completedLessonIds.includes(selectedLesson.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {completedLessonIds.includes(selectedLesson.id) ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                      </DarkOutlineButton>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <DarkOutlineButton
                      size="sm"
                      onClick={() => navigateToLesson('prev')}
                      disabled={!lessons.find((l) => l.id === selectedLesson.id) || lessons.findIndex((l) => l.id === selectedLesson.id) === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Bài trước
                    </DarkOutlineButton>
                    <DarkOutlineButton
                      size="sm"
                      onClick={() => navigateToLesson('next')}
                      disabled={!lessons.find((l) => l.id === selectedLesson.id) || lessons.findIndex((l) => l.id === selectedLesson.id) === lessons.length - 1}
                    >
                      Bài tiếp theo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </DarkOutlineButton>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <DarkTabsList>
                <DarkTabsTrigger value="overview" variant="blue">
                  Tổng quan
                </DarkTabsTrigger>
                <DarkTabsTrigger value="transcript" variant="blue">
                  <FileText className="h-4 w-4 mr-2" />
                  Transcript
                </DarkTabsTrigger>
                <DarkTabsTrigger value="notes" variant="blue">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ghi chú
                </DarkTabsTrigger>
              </DarkTabsList>

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
                    transcriptJsonUrl={selectedLesson.transcriptJsonUrl}
                    onTimeClick={handleTranscriptTimeClick}
                    currentTime={currentTime}
                  />
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                {selectedLesson && (
                  <Notes
                    lessonId={selectedLesson.id}
                    initialNotes={lessonNotes}
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
