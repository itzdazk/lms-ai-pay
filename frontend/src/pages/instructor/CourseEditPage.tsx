import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CourseForm } from '../../components/instructor/CourseForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { coursesApi } from '../../lib/api/courses';
import { toast } from 'sonner';
import { DarkOutlineButton } from '../../components/ui/buttons';
import type { Course, Category, Tag } from '../../lib/api/types';

export function CourseEditPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/dashboard');
      return;
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Transform backend course data to frontend format
  const transformCourse = (course: any): Course => {
    return {
      id: String(course.id),
      title: course.title || '',
      slug: course.slug || '',
      description: course.description || '',
      shortDescription: course.shortDescription || '',
      thumbnail: course.thumbnailUrl || '',
      previewVideoUrl: course.videoPreviewUrl || '',
      instructorId: String(course.instructorId || ''),
      categoryId: String(course.categoryId || course.category?.id || ''),
      category: course.category ? {
        id: String(course.category.id),
        name: course.category.name,
        slug: course.category.slug,
      } : undefined,
      level: (course.level?.toLowerCase() as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
      originalPrice: parseFloat(String(course.price || 0)) || 0,
      discountPrice: course.discountPrice ? parseFloat(String(course.discountPrice)) : undefined,
      isFree: parseFloat(String(course.price || 0)) === 0,
      status: (course.status?.toLowerCase() as 'draft' | 'published' | 'archived') || 'draft',
      featured: course.isFeatured || false,
      viewsCount: course.viewsCount || 0,
      enrolledCount: course.enrolledCount || 0,
      ratingAvg: course.ratingAvg ? parseFloat(String(course.ratingAvg)) : 0,
      ratingCount: course.ratingCount || 0,
      lessonsCount: course.lessonsCount || course.totalLessons || course._count?.lessons || 0,
      durationMinutes: (course.durationHours || 0) * 60,
      requirements: course.requirements || '',
      whatYouLearn: course.whatYouLearn || '',
      courseObjectives: course.courseObjectives || '',
      targetAudience: course.targetAudience || '',
      language: course.language || 'vi',
      tags: course.tags || course.courseTags?.map((ct: any) => ct.tag || ct) || [],
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: course.updatedAt || new Date().toISOString(),
    };
  };

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Try to get course by ID using instructor endpoint (has full details)
      let courseData: any = null;
      try {
        courseData = await coursesApi.getInstructorCourseById(id);
      } catch (error: any) {
        // If endpoint doesn't exist (404) or fails, fallback to searching in list
        console.warn('getInstructorCourseById failed, falling back to list search');
        let page = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore && !courseData) {
          const coursesResponse = await coursesApi.getInstructorCourses({ 
            page, 
            limit 
          });
          
          const foundCourse = coursesResponse.data.find((c: Course) => String(c.id) === id);
          if (foundCourse) {
            courseData = foundCourse;
            break;
          }
          
          hasMore = page < (coursesResponse.pagination?.totalPages || 0);
          page++;
          
          if (page > 10) break;
        }
      }
      
      if (!courseData) {
        throw new Error('Khóa học không tồn tại hoặc bạn không có quyền truy cập');
      }
      
      // Transform course data to frontend format
      const transformedCourse = transformCourse(courseData);
      console.log('[CourseEditPage] Transformed course level:', transformedCourse.level, 'from original:', courseData.level);
      
      // Load categories and tags in parallel
      const [categoriesData, tagsData] = await Promise.all([
        coursesApi.getCategories(),
        coursesApi.getTags(),
      ]);
      
      setCourse(transformedCourse);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tải dữ liệu';
      toast.error(errorMessage);
      navigate('/instructor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    data: Partial<Course>,
    thumbnailFile?: File,
    previewFile?: File
  ) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      
      // Update course
      await coursesApi.updateInstructorCourse(id, data);
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        await coursesApi.uploadCourseThumbnail(id, thumbnailFile);
      }
      
      // Upload preview video if provided
      if (previewFile) {
        await coursesApi.uploadCoursePreview(id, previewFile);
      }
      
      // Update tags if provided
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        const tagIds = data.tags
          .map((tagId: any) => parseInt(String(tagId)))
          .filter((id: number) => !isNaN(id) && id > 0);
        if (tagIds.length > 0) {
          // Get current course to check existing tags
          // Use the course from state if available, otherwise load it
          let currentCourse: Course | null = course;
          if (!currentCourse) {
            // Try to load the course
            try {
              const coursesResponse = await coursesApi.getInstructorCourses({ page: 1, limit: 100 });
              const found = coursesResponse.data.find((c: Course) => String(c.id) === id);
              if (!found) {
                throw new Error('Không tìm thấy khóa học');
              }
              currentCourse = found;
            } catch (error) {
              console.warn('Could not load course for tags:', error);
              // Continue without removing old tags
            }
          }
          
          // Remove old tags
          if (currentCourse?.tags && Array.isArray(currentCourse.tags)) {
            for (const tag of currentCourse.tags) {
              try {
                await coursesApi.removeCourseTag(id, typeof tag.id === 'string' ? parseInt(tag.id) : tag.id);
              } catch (error) {
                // Ignore errors if tag doesn't exist
                console.warn('Error removing tag:', error);
              }
            }
          }
          
          // Add new tags
          await coursesApi.addCourseTags(id, tagIds);
        }
      }
      
      toast.success('Cập nhật khóa học thành công!');
      // Navigate back to previous page, or to dashboard if no previous page
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/instructor/dashboard');
      }
    } catch (error: any) {
      console.error('Error updating course:', error);
      const errorMessage = error.response?.data?.message || 'Không thể cập nhật khóa học';
      toast.error(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to previous page, or to dashboard if no previous page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/instructor/dashboard');
    }
  };

  const handlePreview = (courseId: string) => {
    // Course was updated, open preview
    const previewUrl = `/courses/${courseId}`;
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Khóa học không tồn tại</p>
          <DarkOutlineButton onClick={handleCancel}>
            Quay lại
          </DarkOutlineButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl">Chỉnh sửa khóa học</CardTitle>
            <DarkOutlineButton
              onClick={handleCancel}
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </DarkOutlineButton>
          </div>
        </CardHeader>
        <CardContent>
          <CourseForm
            course={course}
            categories={categories}
            tags={tags}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={submitting}
            onPreview={handlePreview}
          />
        </CardContent>
      </Card>
    </div>
  );
}

