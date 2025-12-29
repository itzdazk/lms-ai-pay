// Debounce helper
function debounceAsync(fn, delay) {
  let timeoutId;
  let lastPromise = Promise.resolve();
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    let resolveOuter;
    const outerPromise = new Promise((resolve) => (resolveOuter = resolve));
    timeoutId = setTimeout(() => {
      lastPromise = Promise.resolve(fn(...args)).then(resolveOuter);
    }, delay);
    return outerPromise;
  };
}
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { DarkTabsList, DarkTabsTrigger } from '../components/ui/dark-tabs';
import { ChevronLeft, FileText, BookOpen, Loader2, ArrowLeft, ArrowRight, Sun, Moon, PanelLeftClose, PanelLeftOpen, PenTool, Bell, Bot } from 'lucide-react';
import { VideoPlayer } from '../components/Lesson/VideoPlayer';
import { LessonList } from '../components/Lesson/LessonList';
import { Transcript } from '../components/Lesson/Transcript';
import { NotesDrawer } from '../components/Lesson/NotesDrawer';
import { NotesSidebar } from '../components/Lesson/NotesSidebar';
import { AIChatSidebar } from '../components/Lesson/AIChatSidebar';
import { QuizTaking } from '../components/Quiz/QuizTaking';
import { coursesApi, lessonsApi, lessonNotesApi, chaptersApi, progressApi, quizzesApi } from '../lib/api';
import { useQuizTaking } from '../hooks/useQuiz';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { convertTranscriptToVTT, createVTTBlobURL } from '../lib/transcriptUtils';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { User, Settings, LogOut, LayoutDashboard, GraduationCap, Shield } from 'lucide-react';
import type { Course, Lesson, Enrollment, Chapter, Quiz } from '../lib/api/types';

export function LessonPage() {
    // Debounced update progress khi seekbar (VideoPlayer)
    const handleSeek = (time: number) => {
      debouncedUpdateProgressOnSeek(time);
    };
  const params = useParams<{ slug: string; lessonSlug?: string }>();
  const courseSlug = params.slug;
  const lessonSlug = params.lessonSlug;
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [showAIChatSidebar, setShowAIChatSidebar] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [subtitleUrl, setSubtitleUrl] = useState<string | undefined>(undefined);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [lessonNotes, setLessonNotes] = useState<string>('');
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
  const [lessonQuizProgress, setLessonQuizProgress] = useState<Record<number, { isCompleted: boolean; quizCompleted: boolean }>>({});
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<number, Quiz[]>>({});
    // Fetch lesson/quiz progress for all lessons in course
    useEffect(() => {
      async function fetchLessonQuizProgress() {
        if (!courseId) return;
        try {
          const progressList = await progressApi.getCourseLessonProgressList(courseId);
          const progressMap: Record<number, { isCompleted: boolean; quizCompleted: boolean }> = {};
          progressList.forEach((p) => {
            progressMap[p.lessonId] = { isCompleted: p.isCompleted, quizCompleted: p.quizCompleted };
          });
          setLessonQuizProgress(progressMap);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch lesson/quiz progress:', err);
        }
      }
      fetchLessonQuizProgress();
    }, [courseId]);

  // Fetch quizzes for all lessons
  useEffect(() => {
    const fetchQuizzesForLessons = async () => {
      const allLessons: Lesson[] = [];
      if (chapters.length > 0) {
        chapters.forEach((chapter) => {
          if (chapter.lessons) {
            allLessons.push(...chapter.lessons);
          }
        });
      } else {
        allLessons.push(...lessons);
      }

      if (allLessons.length === 0) return;

      for (const lesson of allLessons) {
        try {
          const quizzes = await quizzesApi.getQuizzesByLesson(lesson.id.toString());
          setLessonQuizzes(prev => ({ ...prev, [lesson.id]: quizzes }));
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error fetching quizzes for lesson ${lesson.id}:`, error);
          setLessonQuizzes(prev => ({ ...prev, [lesson.id]: [] }));
        }
      }
    };

    if (lessons.length > 0 || chapters.length > 0) {
      fetchQuizzesForLessons();
    }
  }, [lessons, chapters]);
  const [loading, setLoading] = useState(true);
  const [lessonNotFound, setLessonNotFound] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialVideoTime, setInitialVideoTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [watchedDuration, setWatchedDuration] = useState(0); // tổng thời lượng đã xem lấy từ backend
  
  // Quiz state
    const [showQuiz, setShowQuiz] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
    const [quizState, setQuizState] = useState<'taking' | 'results'>('taking');

    // Remove all border-radius (rounded-*) classes from quiz UI in this file if present (Card, etc.)
  
  // Quiz hook
  const quizHook = useQuizTaking();
  
  const progressSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);
  const previousCourseSlugRef = useRef<string | null>(null);
  const subtitleBlobUrlRef = useRef<string | null>(null);
  const { currentChapter, currentChapterLessonIds } = useMemo(() => {
    if (!selectedLesson) {
      return { currentChapter: null, currentChapterLessonIds: [] as number[] };
    }

    const foundChapter = chapters.find((chapter) =>
      chapter.lessons?.some((l) => l.id === selectedLesson.id)
    );

    return {
      currentChapter: foundChapter || null,
      currentChapterLessonIds: foundChapter?.lessons?.map((l) => l.id) || [],
    };
  }, [chapters, selectedLesson?.id]);

  const notesSidebarChapters = useMemo(
    () =>
      chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        lessonIds: ch.lessons?.map((l) => l.id) || [],
      })),
    [chapters]
  );

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

  // Load course, lessons, and handle quiz param
  useEffect(() => {
    const loadData = async () => {
      if (!courseSlug) return;

      try {
        setLoading(true);
        const params = new URLSearchParams(window.location.search);
        const quizParam = params.get('quiz');

        // Load course by slug first
        const courseData = await coursesApi.getCourseBySlug(courseSlug);
        const loadedCourseId = courseData.id;
        setCourseId(loadedCourseId);
        const chaptersData = await chaptersApi.getChaptersByCourse(loadedCourseId, true);
        setChapters(chaptersData || []);
        const lessonsData = await lessonsApi.getCourseLessons(loadedCourseId);
        setCourse(courseData);
        setLessons(lessonsData.lessons || []);

        // Check enrollment
        try {
          const enrollments = await coursesApi.getEnrollments();
          const userEnrollment = enrollments.find(
            (e) => e.courseId === loadedCourseId && e.userId === Number(user?.id)
          );
          setEnrollment(userEnrollment || null);
        } catch (error) {
          setEnrollment(null);
        }

        // If quiz param is present, always show quiz (even if lessonSlug is invalid)
        if (quizParam) {
          setShowQuiz(true);
          setQuizState('taking');
          await quizHook.fetchQuiz(quizParam);
          await quizHook.fetchAttempts(quizParam);
          // KHÔNG fetchLatestResult ở đây để không set kết quả cũ vào state
          await quizHook.resetQuiz();
          await quizHook.startQuiz();

          // If quiz has lessonId, select that lesson
          const quizData = quizHook.quiz;
          if (quizData && quizData.lessonId) {
            const lesson = lessonsData.lessons.find((l) => String(l.id) === String(quizData.lessonId));
            if (lesson) setSelectedLesson(lesson);
          }
          setLoading(false);
          return;
        }

        // If no quiz param, proceed as normal
        let initialLesson: Lesson | null = null;
        if (lessonSlug) {
          for (const chapter of chaptersData) {
            const lesson = chapter.lessons?.find((l) => l.slug === lessonSlug);
            if (lesson) {
              initialLesson = lesson;
              break;
            }
          }
          if (!initialLesson) {
            initialLesson = lessonsData.lessons.find((l) => l.slug === lessonSlug) || null;
          }
          if (!initialLesson) {
            try {
              initialLesson = await lessonsApi.getLessonBySlug(courseSlug, lessonSlug);
            } catch (error) {
              setLessonNotFound(true);
              setLoading(false);
              return;
            }
          }
          if (!initialLesson) {
            setLessonNotFound(true);
            setLoading(false);
            return;
          }
        } else {
          if (chaptersData.length > 0 && chaptersData[0].lessons && chaptersData[0].lessons.length > 0) {
            initialLesson = chaptersData[0].lessons[0];
          } else if (lessonsData.lessons.length > 0) {
            initialLesson = lessonsData.lessons[0];
          }
        }
        if (initialLesson) {
          setSelectedLesson(initialLesson);
        }
      } catch (error: any) {
        if (!lessonNotFound) {
          toast.error('Không thể tải thông tin khóa học');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseSlug, lessonSlug, user?.id]);

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
        // setVideoLoading(true); // removed unused
        setVideoUrl('');
        setInitialVideoTime(0);

        // Load video URL and lesson details (to get both transcriptUrl and transcriptJsonUrl) in parallel
        let videoData = { videoUrl: '' };
        let videoError = false;
        const [videoResult, lessonDetails] = await Promise.all([
          lessonsApi.getLessonVideo(selectedLesson.id).catch((err) => {
            videoError = true;
            return { videoUrl: '' };
          }),
          lessonsApi.getLessonById(selectedLesson.id).catch(() => {
            return null;
          }),
        ]);
        videoData = videoResult;
        if (videoError) {
          setVideoUrl('');
          toast.error('Bạn cần hoàn thành bài học trước đó để tiếp tục này.');
          navigate(-1); // Quay lại trang trước nếu bài học bị khóa
        } else {
          setVideoUrl(videoData.videoUrl || '');
        }
        
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
            // Subtitle is optional, don't show error
            setSubtitleUrl(undefined);
          }
        } else {
          setSubtitleUrl(undefined);
        }

        // Load progress for this lesson (if enrolled)
        if (enrollment) {
          try {
            const progress = await progressApi.getLessonProgress(selectedLesson.id);
            setInitialVideoTime(progress.lastPosition || 0);
            setWatchedDuration(progress.watchDuration || 0);
            // Log watchedDuration từ backend
            // eslint-disable-next-line no-console
            console.log('[LessonPage] watchedDuration từ backend:', progress.watchDuration);
          } catch (error) {
            // Ignore progress errors
          }
        }

        // Load notes for this lesson
        if (enrollment && user) {
          try {
            // setNotesLoading(true); // removed unused
            const noteData = await lessonNotesApi.getLessonNote(selectedLesson.id);
            setLessonNotes(noteData.note?.content || '');
          } catch (error: any) {
            // If note doesn't exist (404), that's okay - just set empty
            setLessonNotes('');
          } finally {
            // setNotesLoading(false); // removed unused
          }
        } else {
          setLessonNotes('');
        }
      } catch (error: any) {
        toast.error('Không thể tải video bài học');
      } finally {
        // setVideoLoading(false); // removed unused
      }
    };

    loadLessonData();
  }, [selectedLesson?.id, enrollment]);

  // Handle lesson selection
  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowQuiz(false); // Hide quiz when selecting a lesson
    // Update URL without navigation (using slug)
    if (courseSlug && lesson.slug) {
      window.history.pushState({}, '', `/courses/${courseSlug}/lessons/${lesson.slug}`);
    }
  };

  // Handle quiz selection
  const handleQuizSelect = async (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setShowQuiz(true);

    // If quiz has a lessonId, set selected lesson and update URL
    try {
      if (quiz.lessonId) {
        const targetLesson = lessons.find((l) => String(l.id) === String(quiz.lessonId));
        if (targetLesson) {
          setSelectedLesson(targetLesson);
          if (courseSlug && targetLesson.slug) {
            const basePath = `/courses/${courseSlug}/lessons/${targetLesson.slug}`;
            window.history.pushState({}, '', `${basePath}?quiz=${quiz.id}`);
          }
        } else if (courseSlug && selectedLesson?.slug) {
          // Fallback: keep current lesson, still set quiz param
          const basePath = `/courses/${courseSlug}/lessons/${selectedLesson.slug}`;
          window.history.pushState({}, '', `${basePath}?quiz=${quiz.id}`);
        }
      } else if (courseSlug && selectedLesson?.slug) {
        const basePath = `/courses/${courseSlug}/lessons/${selectedLesson.slug}`;
        window.history.pushState({}, '', `${basePath}?quiz=${quiz.id}`);
      }
    } catch {}

    // Fetch full quiz data and related info
    await quizHook.fetchQuiz(String(quiz.id));
    await quizHook.fetchAttempts(String(quiz.id));
    await quizHook.fetchLatestResult(String(quiz.id));

    // Auto-start quiz immediately without requiring a Start button
    await quizHook.startQuiz();
    setQuizState('taking');
  };

  // Handle quiz exit
  const handleQuizExit = () => {
    setShowQuiz(false);
    setCurrentQuiz(null);
    setQuizState('taking');
    quizHook.resetQuiz();

    // Remove quiz param from URL and return to lesson path
    if (courseSlug && selectedLesson?.slug) {
      const basePath = `/courses/${courseSlug}/lessons/${selectedLesson.slug}`;
      window.history.pushState({}, '', basePath);
    }
  };

  // On mount or when lesson changes, auto-open quiz from URL param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qid = params.get('quiz');
    if (qid) {
      (async () => {
        setShowQuiz(true);
        setQuizState('taking');
        await quizHook.fetchQuiz(qid);
        await quizHook.fetchAttempts(qid);
        // KHÔNG fetchLatestResult ở đây để không set kết quả cũ vào state
        await quizHook.resetQuiz();
        await quizHook.startQuiz();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLesson?.id, courseSlug]);

  // Handle video time update (auto-save progress)
  // Đã loại bỏ toàn bộ logic viewedSegments
  const videoCurrentTimeRef = useRef<(() => number) | null>(null);
  const handleTimeUpdate = (time: number, _duration?: number) => {
    setCurrentTime(time);
  };

  // Thêm các hàm xử lý play/pause
  const handlePlay = () => {
    isPlayingRef.current = true;
    if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
    progressSaveIntervalRef.current = setInterval(async () => {
      if (selectedLesson && enrollment) {
        try {
          const position = videoCurrentTimeRef.current ? videoCurrentTimeRef.current() : currentTime;
          const payload: any = {
            position,
            actionType: 'auto',
          };
          console.log('[Progress] Gửi updateLessonProgress:', {
            lessonId: selectedLesson.id,
            ...payload,
            timestamp: new Date().toLocaleTimeString(),
          });
          const updatedProgress = await progressApi.updateLessonProgress(selectedLesson.id, payload);
          if (typeof updatedProgress?.watchDuration === 'number') {
            setWatchedDuration(updatedProgress.watchDuration);
          }
        } catch (err) {}
      }
    }, 30000);
  };

  // Debounced update progress khi pause
  const debouncedUpdateProgress = debounceAsync(async () => {
    if (selectedLesson && enrollment) {
      try {
        const position = videoCurrentTimeRef.current ? videoCurrentTimeRef.current() : currentTime;
        const payload: any = { position, actionType: 'pause' };
        console.log('[Progress] Gửi updateLessonProgress (pause):', {
          lessonId: selectedLesson.id,
          ...payload,
          timestamp: new Date().toLocaleTimeString(),
        });
        const updatedProgress = await progressApi.updateLessonProgress(selectedLesson.id, payload);
        if (typeof updatedProgress?.watchDuration === 'number') {
          setWatchedDuration(updatedProgress.watchDuration);
        }
      } catch (err: any) {
        // Nếu lỗi rate limit, không hiện toast (đã có toast ở VideoPlayer)
        // if (err?.response?.data?.message?.toLowerCase().includes('rate limit')) {
        //   toast.warning('Bạn thao tác quá nhanh, vui lòng chờ một chút rồi thử lại.');
        // }
      }
    }
  }, 1500);

  const handlePause = async () => {
    isPlayingRef.current = false;
    if (progressSaveIntervalRef.current) {
      clearInterval(progressSaveIntervalRef.current);
      progressSaveIntervalRef.current = null;
    }
    debouncedUpdateProgress();
  };

  // Handle video ended
  const handleVideoEnded = async () => {
    if (selectedLesson && enrollment) {
      try {
        await progressApi.completeLesson(selectedLesson.id);
      } catch (err) {}
      if (!completedLessonIds.includes(selectedLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, selectedLesson.id]);
      }
    }
    if (progressSaveIntervalRef.current) {
      clearInterval(progressSaveIntervalRef.current);
      progressSaveIntervalRef.current = null;
    }
  };

  // Handle transcript time click

  // Debounced update progress khi seek
  const debouncedUpdateProgressOnSeek = debounceAsync(async (seekTime: number) => {
    if (selectedLesson && enrollment) {
      try {
        const payload: any = { position: seekTime, actionType: 'seek' };
        console.log('[Progress] Gửi updateLessonProgress (seek):', {
          lessonId: selectedLesson.id,
          ...payload,
          timestamp: new Date().toLocaleTimeString(),
        });
        const updatedProgress = await progressApi.updateLessonProgress(selectedLesson.id, payload);
        if (typeof updatedProgress?.watchDuration === 'number') {
          setWatchedDuration(updatedProgress.watchDuration);
        }
      } catch (err: any) {
        if (err?.response?.data?.message?.toLowerCase().includes('rate limit')) {
          toast.warning('Bạn thao tác quá nhanh, vui lòng chờ một chút rồi thử lại.');
        }
      }
    }
  }, 1500);

  const handleTranscriptTimeClick = (time: number) => {
    setSeekTo(time);
    debouncedUpdateProgressOnSeek(time);
    // Reset seekTo after a short delay to allow seeking to the same time again if needed
    setTimeout(() => {
      setSeekTo(undefined);
    }, 100);
  };

  // Navigation item type
  type NavigationItem = 
    | { type: 'lesson'; lesson: Lesson }
    | { type: 'quiz'; quiz: Quiz; lesson: Lesson };

  // Build navigation items list (lessons + unlocked quizzes)
  const buildNavigationItems = useMemo((): NavigationItem[] => {
    const items: NavigationItem[] = [];
    
    // Flatten all lessons from chapters
    const allLessons: Lesson[] = [];
    if (chapters.length > 0) {
      chapters.forEach((chapter) => {
        if (chapter.lessons) {
          allLessons.push(...chapter.lessons);
        }
      });
    } else {
      allLessons.push(...lessons);
    }

    // Build navigation items
    allLessons.forEach((lesson) => {
      // Add lesson
      items.push({ type: 'lesson', lesson });

      // Add quiz if lesson is completed and quiz exists
      const progress = lessonQuizProgress[lesson.id];
      const quizzes = lessonQuizzes[lesson.id] || [];
      
      if (progress?.isCompleted && quizzes.length > 0) {
        // Add all quizzes for this lesson (usually just one)
        quizzes.forEach((quiz) => {
          items.push({ type: 'quiz', quiz, lesson });
        });
      }
    });

    return items;
  }, [chapters, lessons, lessonQuizProgress, lessonQuizzes]);

  // Navigate to next/previous item (lesson or quiz)
  const navigateToItem = (direction: 'next' | 'prev') => {
    const items = buildNavigationItems;
    if (items.length === 0) return;

    // Find current item index
    let currentIndex = -1;
    
    if (showQuiz && currentQuiz) {
      // Currently viewing a quiz
      currentIndex = items.findIndex(
        (item) => item.type === 'quiz' && item.quiz.id === currentQuiz.id
      );
    } else if (selectedLesson) {
      // Currently viewing a lesson
      currentIndex = items.findIndex(
        (item) => item.type === 'lesson' && item.lesson.id === selectedLesson.id
      );
    }

    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const nextItem = items[newIndex];
    
    if (nextItem.type === 'lesson') {
      handleLessonSelect(nextItem.lesson);
    } else if (nextItem.type === 'quiz') {
      handleQuizSelect(nextItem.quiz);
    }
  };

  // Get current navigation item info
  const getCurrentNavigationInfo = () => {
    const items = buildNavigationItems;
    if (items.length === 0) return { currentIndex: -1, totalItems: 0, currentType: null as 'lesson' | 'quiz' | null };

    let currentIndex = -1;
    let currentType: 'lesson' | 'quiz' | null = null;

    if (showQuiz && currentQuiz) {
      currentIndex = items.findIndex(
        (item) => item.type === 'quiz' && item.quiz.id === currentQuiz.id
      );
      currentType = 'quiz';
    } else if (selectedLesson) {
      currentIndex = items.findIndex(
        (item) => item.type === 'lesson' && item.lesson.id === selectedLesson.id
      );
      currentType = 'lesson';
    }

    return { currentIndex, totalItems: items.length, currentType };
  };

  // Helper function to render menu items based on role
  const renderRoleSpecificMenuItems = () => {
    if (!user) return null;

    switch (user.role) {
      case 'INSTRUCTOR':
        return (
          <>
            <DropdownMenuLabel className='text-white px-2 py-1.5'>
              <div className='flex items-center'>
                <LayoutDashboard className='mr-2 h-4 w-4 text-blue-400' />
                <span className='font-medium'>Dashboard</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem
              asChild
              className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
            >
              <Link
                to='/instructor/dashboard'
                className='flex items-center pl-6'
              >
                <GraduationCap className='mr-2 h-4 w-4 text-blue-400' />
                Giảng viên
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
            >
              <Link
                to='/dashboard'
                className='flex items-center pl-6'
              >
                <User className='mr-2 h-4 w-4 text-green-400' />
                Học viên
              </Link>
            </DropdownMenuItem>
          </>
        );
      case 'ADMIN':
        return (
          <>
            <DropdownMenuLabel className='text-white px-2 py-1.5'>
              <div className='flex items-center'>
                <LayoutDashboard className='mr-2 h-4 w-4 text-purple-400' />
                <span className='font-medium'>Dashboard</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuItem
              asChild
              className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
            >
              <Link
                to='/admin/dashboard'
                className='flex items-center pl-6'
              >
                <Shield className='mr-2 h-4 w-4 text-purple-400' />
                Quản trị viên
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
            >
              <Link
                to='/instructor/dashboard'
                className='flex items-center pl-6'
              >
                <GraduationCap className='mr-2 h-4 w-4 text-blue-400' />
                Giảng viên
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
            >
              <Link
                to='/dashboard'
                className='flex items-center pl-6'
              >
                <User className='mr-2 h-4 w-4 text-green-400' />
                Học viên
              </Link>
            </DropdownMenuItem>
          </>
        );
      default:
        return (
          <>
            <DropdownMenuItem
              asChild
              className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
            >
              <Link
                to='/dashboard'
                className='flex items-center'
              >
                <LayoutDashboard className='mr-2 h-4 w-4 text-green-400' />
                Dashboard
              </Link>
            </DropdownMenuItem>
          </>
        );
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

  if (lessonNotFound) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-foreground">Không tìm thấy bài học</h1>
        <p className="text-muted-foreground mb-8">Bài học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        {courseSlug && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link to={`/courses/${courseSlug}`}>Quay lại khóa học</Link>
          </Button>
        )}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-foreground">Không tìm thấy khóa học</h1>
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

  // Calculate total lessons and completed lessons
  const allLessons: Lesson[] = [];
  if (chapters.length > 0) {
    chapters.forEach((chapter) => {
      if (chapter.lessons) {
        allLessons.push(...chapter.lessons);
      }
    });
  } else {
    allLessons.push(...lessons);
  }
  const totalLessons = allLessons.length;
  const completedLessons = completedLessonIds.length;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-black border-b border-[#2D2D2D] flex-shrink-0 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0 min-w-0">
              <DarkOutlineButton
                size="icon"
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
                title="Quay lại"
              >
                <ChevronLeft className="h-4 w-4" />
              </DarkOutlineButton>
              <h2 className="text-xs md:text-sm font-semibold text-white truncate max-w-[250px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px]">{course.title}</h2>
            </div>
            {isEnrolled && (
              <div className="hidden sm:flex flex-1 flex-col items-center mx-2 md:mx-4 min-w-0">
                <Progress value={enrollmentProgress} className="h-1.5 w-full max-w-xs" />
                <div className="hidden md:flex items-center gap-2 mt-1">
                  <p className="text-xs whitespace-nowrap text-gray-400">
                  {Number(enrollmentProgress).toFixed(0)}% hoàn thành
                  </p>
                  {totalLessons > 0 && (
                    <p className="text-xs whitespace-nowrap text-gray-500">
                      • {completedLessons}/{totalLessons} bài học đã hoàn thành
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              {isEnrolled && (
                <DarkOutlineButton
                  size="sm"
                  onClick={() => setShowNotesSidebar(true)}
                  title="Ghi chú"
                >
                  <BookOpen className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Ghi chú</span>
                </DarkOutlineButton>
              )}
              <DarkOutlineButton
                size="sm"
                onClick={() => setShowAIChatSidebar(true)}
                title="Mở AI Tutor"
              >
                <Bot className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Gia sư AI</span>
              </DarkOutlineButton>
              <DarkOutlineButton
                size="icon"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
                className="hidden sm:flex"
              >
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </DarkOutlineButton>
              {/* Notifications */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='relative text-white hover:bg-[#1F1F1F]'
                    >
                      <Bell className='h-5 w-5' />
                      <Badge className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600'>
                        3
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='w-[480px] max-w-[90vw] bg-[#1A1A1A] border-[#2D2D2D] shadow-xl'
                  >
                    <DropdownMenuLabel className='text-white flex items-center justify-between gap-2'>
                      <span>Thông báo</span>
                      <Badge className='bg-blue-600 text-white'>
                        Mới
                      </Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className='bg-[#2D2D2D]' />
                    <div className='max-h-[420px] overflow-y-auto divide-y divide-[#2D2D2D] custom-scrollbar'>
                      <div className='p-4 hover:bg-[#1F1F1F] cursor-pointer'>
                        <p className='text-sm text-white font-semibold'>
                          Bạn đã hoàn thành bài học "React Hooks"
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          2 giờ trước
                        </p>
                      </div>
                      <div className='p-4 hover:bg-[#1F1F1F] cursor-pointer'>
                        <p className='text-sm text-white font-semibold'>
                          Khóa học "Next.js Pro" vừa được cập nhật
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          Hôm qua
                        </p>
                      </div>
                      <div className='p-4 hover:bg-[#1F1F1F] cursor-pointer'>
                        <p className='text-sm text-white font-semibold'>
                          Bạn có chứng chỉ mới cần tải xuống
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          2 ngày trước
                        </p>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {/* User Avatar */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className='relative h-10 w-10 rounded-full border border-white/30 cursor-pointer hover:border-white transition-colors'>
                      <Avatar className='h-full w-full'>
                        <AvatarImage
                          src={user.avatarUrl || undefined}
                          alt={user.fullName || user.email || 'User'}
                        />
                        <AvatarFallback className='bg-blue-600 text-white'>
                          {user.fullName
                            ? user.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : user.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align='end'
                    className='w-64 bg-[#1A1A1A] border-[#2D2D2D] shadow-xl'
                  >
                    <DropdownMenuLabel className='text-white px-3 py-3'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10 border border-white/20'>
                          <AvatarImage
                            src={user.avatarUrl || undefined}
                            alt={user.fullName || user.email || 'User'}
                          />
                          <AvatarFallback className='bg-blue-600 text-white text-sm'>
                            {user.fullName
                              ? user.fullName
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : user.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className='text-white font-medium truncate'>
                            {user.fullName || user.email}
                          </p>
                          <p className='text-xs text-gray-400 truncate'>
                            {user.email}
                          </p>
                          <div className='mt-1.5'>
                            <Badge
                              className={`text-xs px-1.5 py-0.5 border ${
                                user.role === 'ADMIN'
                                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                                  : user.role === 'INSTRUCTOR'
                                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                                  : 'bg-green-600/20 text-green-400 border-green-500/30'
                              }`}
                            >
                              {user.role === 'ADMIN'
                                ? 'Quản trị viên'
                                : user.role === 'INSTRUCTOR'
                                ? 'Giảng viên'
                                : 'Học viên'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className='bg-[#2D2D2D] my-1' />

                    {/* Role-specific menu items */}
                    {renderRoleSpecificMenuItems()}

                    {/* Common menu items */}
                    <DropdownMenuItem
                      asChild
                      className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                    >
                      <Link
                        to='/profile'
                        className='flex items-center'
                      >
                        <User className='mr-2 h-4 w-4 text-gray-300' />
                        Hồ sơ
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className='text-white hover:bg-[#252525] transition-colors cursor-pointer'
                    >
                      <Link
                        to='/settings'
                        className='flex items-center'
                      >
                        <Settings className='mr-2 h-4 w-4 text-gray-300' />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className='bg-[#2D2D2D] my-1' />
                    <DropdownMenuItem
                      className='text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer focus:bg-red-500/10 focus:text-red-300'
                      onClick={async () => {
                        try {
                          await logout();
                          toast.success('Đăng xuất thành công!');
                          navigate('/');
                        } catch (error) {
                          toast.error('Có lỗi xảy ra khi đăng xuất');
                        }
                      }}
                    >
                      <LogOut className='mr-2 h-4 w-4' />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex-1 overflow-hidden">
        <div className={`grid gap-0 items-start transition-all duration-300 h-full ${showSidebar ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
          {/* Video Player / Quiz Section */}
          <div 
            className={`space-y-0 overflow-y-auto custom-scrollbar ${showSidebar ? 'lg:col-span-3' : 'lg:col-span-1'}`}
            style={{ 
              height: '100%',
              paddingBottom: selectedLesson ? '45px' : '0'
            }}
          >
            {showQuiz ? (
              // Quiz Components
              <div className="">
                {/* Loading state when quiz data isn't ready */}
                {!quizHook.quiz && (
                  <Card className="bg-card border-border rounded-none mb-4">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Đang tải quiz...
                    </CardContent>
                  </Card>
                )}

                {quizState === 'taking' && quizHook.quiz && (
                  <QuizTaking
                    quiz={quizHook.quiz}
                    currentQuestionIndex={quizHook.currentQuestionIndex}
                    answers={quizHook.answers}
                    timeRemaining={quizHook.timeRemaining}
                    onAnswerChange={quizHook.answerQuestion}
                    onNext={quizHook.nextQuestion}
                    onPrevious={quizHook.previousQuestion}
                    onGoToQuestion={quizHook.goToQuestion}
                    onSubmit={async () => {
                      await quizHook.submitQuiz();
                    }}
                    onRetry={async () => {
                      await quizHook.resetQuiz();
                      await quizHook.startQuiz();
                    }}
                    onExit={handleQuizExit}
                    showResult={!!quizHook.result}
                    quizResult={quizHook.result}
                  />
                )}
              </div>
            ) : (
              // Video Player and Tabs
              <>
                {/* Video Player */}
                <Card className="overflow-hidden bg-card border-none rounded-none shadow-none">
                  <VideoPlayer
                    key={selectedLesson?.id}
                    videoUrl={videoUrl}
                    subtitleUrl={subtitleUrl}
                    onTimeUpdate={handleTimeUpdate}
                    getCurrentTime={(fn) => { videoCurrentTimeRef.current = fn; }}
                    onEnded={handleVideoEnded}
                    initialTime={initialVideoTime}
                    seekTo={seekTo}
                    className="lesson-video-player"
                    title={selectedLesson?.title}
                    showSidebar={showSidebar}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    watchedDuration={watchedDuration}
                    onSeek={handleSeek}
                  />
                </Card>

                {/* Lesson Info and Navigation */}
                {selectedLesson && (
                  <Card className="bg-card border-border rounded-none ">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-foreground">{selectedLesson.title}</CardTitle>
                          {selectedLesson.description && (
                        <p className="text-sm text-muted-foreground mt-2">{selectedLesson.description}</p>
                      )}
                    </CardHeader>
                  </Card>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full !gap-0">
                  <DarkTabsList
                    className={`!rounded-none ${
                      isDark ? '' : '!bg-white !text-gray-900 !border-gray-200'
                    }`}
                  >
                    <DarkTabsTrigger
                      value="overview"
                      variant="blue"
                      className={`!rounded-none ${isDark ? '' : '!text-gray-900 !border-gray-200'}`}
                    >
                      Tổng quan
                    </DarkTabsTrigger>
                    <DarkTabsTrigger
                      value="transcript"
                      variant="blue"
                      className={`!rounded-none ${isDark ? '' : '!text-gray-900 !border-gray-200'}`}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Transcript
                    </DarkTabsTrigger>
                  </DarkTabsList>

                  <TabsContent value="overview" className="" >
                    <Card className="bg-card border-border rounded-none">
                      <CardContent className="pt-6">
                        <div className="prose max-w-none">
                          <h3 className="text-foreground">Trong bài học này bạn sẽ học:</h3>
                          {selectedLesson?.content ? (
                            <div className="text-muted-foreground whitespace-pre-wrap">{selectedLesson.content}</div>
                          ) : (
                          
                              <p>{selectedLesson?.description}</p>
                  
                          )}
                        </div>
                      </CardContent>
                    </Card>
              </TabsContent>

              <TabsContent value="transcript" className="">
                {selectedLesson && (
                  <Transcript
                    transcriptJsonUrl={selectedLesson.transcriptJsonUrl}
                    onTimeClick={handleTranscriptTimeClick}
                    currentTime={currentTime}
                    className="rounded-none"
                  />
                )}
              </TabsContent>
            </Tabs>
              </>
            )}
          </div>

          {/* Sidebar - Course Content */}
          {showSidebar && (
            <div className="lg:col-span-1 h-full overflow-y-auto custom-scrollbar">
            <LessonList
              lessons={lessons}
              chapters={chapters}
              selectedLessonId={selectedLesson?.id}
              onLessonSelect={handleLessonSelect}
              onQuizSelect={handleQuizSelect}
              enrollmentProgress={enrollmentProgress}
              completedLessonIds={completedLessonIds}
              isEnrolled={isEnrolled}
              courseTitle={course.title}
              completedLessons={completedLessons}
              totalLessons={totalLessons}
              courseId={courseId || undefined}
              courseSlug={courseSlug}
              activeQuizId={showQuiz && quizHook.quiz ? String(quizHook.quiz.id) : undefined}
            />
            </div>
              )}
            </div>
          </div>

      {/* Bottom Bar - Navigation */}
      {(selectedLesson || (showQuiz && currentQuiz)) && (() => {
        const navInfo = getCurrentNavigationInfo();
        const items = buildNavigationItems;
        const prevItem = navInfo.currentIndex > 0 ? items[navInfo.currentIndex - 1] : null;
        const nextItem = navInfo.currentIndex < items.length - 1 ? items[navInfo.currentIndex + 1] : null;
        
        // Check if next item is accessible
        const isNextAccessible = (() => {
          if (!nextItem) return false;
          
          // Get current item
          const currentItem = navInfo.currentIndex >= 0 ? items[navInfo.currentIndex] : null;
          
          if (nextItem.type === 'lesson') {
            const lesson = nextItem.lesson;
            // Preview lessons are always accessible
            if (lesson.isPreview) return true;
            
            // If current item is preview lesson, next item is always accessible
            if (currentItem?.type === 'lesson' && currentItem.lesson.isPreview) return true;
            
            // If at first lesson (index 0), next lesson is accessible (first lesson is usually preview or always unlocked)
            if (navInfo.currentIndex === 0) return true;
            
            // Check if previous item (current) is completed + quizCompleted
            if (currentItem) {
              if (currentItem.type === 'lesson') {
                const progress = lessonQuizProgress[currentItem.lesson.id];
                return progress ? (progress.isCompleted && progress.quizCompleted) : false;
              } else if (currentItem.type === 'quiz') {
                // If current is quiz, the lesson should be completed
                const progress = lessonQuizProgress[currentItem.lesson.id];
                return progress ? progress.isCompleted : false;
              }
            }
            return false;
          } else if (nextItem.type === 'quiz') {
            // Quiz is accessible if its lesson is completed
            const progress = lessonQuizProgress[nextItem.lesson.id];
            return progress ? progress.isCompleted : false;
          }
          return false;
        })();

        return (
          <div className="bg-black border-t border-[#2D2D2D] fixed bottom-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                {/* Notes Button - Left */}
                {selectedLesson && (
                  <DarkOutlineButton
                    size="sm"
                    onClick={() => setShowNotesDrawer(true)}
                    title="Mở ghi chú"
                  >
                    <PenTool className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline" spellCheck={false}>Thêm ghi chú</span>
                  </DarkOutlineButton>
                )}
                {!selectedLesson && <div />}
                <div className="flex items-center justify-center gap-4 flex-1">
                  <DarkOutlineButton
                    size="sm"
                    onClick={() => navigateToItem('prev')}
                    disabled={!prevItem}
                  >
                    <ArrowLeft className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">
                      {prevItem?.type === 'quiz' ? 'Quiz trước' : 'Bài trước'}
                    </span>
                  </DarkOutlineButton>
                  <Button
                    variant="blue"
                    size="sm"
                    onClick={() => navigateToItem('next')}
                    disabled={!isNextAccessible}
                  >
                    <span className="hidden md:inline">
                      {nextItem?.type === 'quiz' ? 'Quiz tiếp theo' : 'Bài tiếp theo'}
                    </span>
                    <ArrowRight className="h-4 w-4 md:ml-2" />
                  </Button>
                </div>
                {/* Toggle Sidebar Button - Right */}
                {(() => {
                  let displayText = '';
                  if (showQuiz && currentQuiz) {
                    displayText = `Quiz: ${currentQuiz.title}`;
                  } else if (selectedLesson) {
                    // Find lesson number in navigation items
                    const lessonIndex = items.findIndex(
                      (item) => item.type === 'lesson' && item.lesson.id === selectedLesson.id
                    );
                    const lessonNumber = lessonIndex !== -1 ? lessonIndex + 1 : 0;
                    displayText = `Bài ${lessonNumber}: ${selectedLesson.title}`;
                  }
                  
                  return (
                    <DarkOutlineButton
                      size="sm"
                      onClick={() => setShowSidebar(!showSidebar)}
                      title={showSidebar ? 'Ẩn nội dung khóa học' : 'Hiện nội dung khóa học'}
                      className="flex items-center gap-2"
                    >
                      <span className="hidden md:inline text-xs text-foreground font-medium max-w-[200px] truncate">
                        {displayText}
                      </span>
                      {showSidebar ? (
                        <PanelLeftClose className="h-4 w-4" />
                      ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                      )}
                    </DarkOutlineButton>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Notes Drawer */}
      {selectedLesson && (
        <NotesDrawer
          isOpen={showNotesDrawer}
          onClose={() => setShowNotesDrawer(false)}
          lessonId={selectedLesson.id}
          initialNotes={lessonNotes}
          showSidebar={showSidebar}
          chapterTitle={currentChapter?.title}
          lessonTitle={selectedLesson.title}
        />
      )}

      {/* Notes Sidebar */}
      {course && isEnrolled && selectedLesson && (
        <NotesSidebar
          isOpen={showNotesSidebar}
          onClose={() => setShowNotesSidebar(false)}
          courseId={course.id}
          currentChapterId={currentChapter?.id}
          currentChapterTitle={currentChapter?.title}
          currentChapterLessonIds={currentChapterLessonIds}
          chapters={notesSidebarChapters}
          currentLessonId={selectedLesson.id}
          onLessonSelect={(lessonInfo) => {
            const allLessons: Lesson[] = [];
            if (chapters.length > 0) {
              chapters.forEach((chapter) => {
                if (chapter.lessons) {
                  allLessons.push(...chapter.lessons);
                }
              });
            } else {
              allLessons.push(...lessons);
            }
            const lesson = allLessons.find((l) => l.id === lessonInfo.id);
            if (lesson) {
              handleLessonSelect(lesson);
              setShowNotesSidebar(false);
            }
          }}
        />
      )}

      {/* AI Chat Sidebar */}
      {course && (
        <AIChatSidebar
          isOpen={showAIChatSidebar}
          onClose={() => setShowAIChatSidebar(false)}
          courseId={course.id}
          courseTitle={course.title}
          lessonId={selectedLesson?.id}
          lessonTitle={selectedLesson?.title}
        />
      )}
    </div>
  );
}