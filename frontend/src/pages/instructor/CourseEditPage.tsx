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

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Load instructor courses with pagination to find the course
      // Try with a reasonable limit first
      let courseData: Course | null = null;
      let page = 1;
      const limit = 100; // Use a reasonable limit
      let hasMore = true;
      
      while (hasMore && !courseData) {
        try {
          const coursesResponse = await coursesApi.getInstructorCourses({ 
            page, 
            limit 
          });
          
          const foundCourse = coursesResponse.data.find((c: Course) => String(c.id) === id);
          if (foundCourse) {
            courseData = foundCourse;
            break;
          }
          
          // Check if there are more pages
          hasMore = page < (coursesResponse.pagination?.totalPages || 0);
          page++;
          
          // Safety limit: stop after 10 pages (1000 courses max)
          if (page > 10) break;
        } catch (error: any) {
          // If we get 422 or other error, try with smaller limit
          if (error.response?.status === 422 && limit > 20) {
            // Retry with smaller limit
            const coursesResponse = await coursesApi.getInstructorCourses({ 
              page: 1, 
              limit: 20 
            });
            const foundCourse = coursesResponse.data.find((c: Course) => String(c.id) === id);
            if (foundCourse) {
              courseData = foundCourse;
              break;
            }
          }
          throw error;
        }
      }
      
      if (!courseData) {
        throw new Error('Khóa học không tồn tại');
      }
      
      const [categoriesData, tagsData] = await Promise.all([
        coursesApi.getCategories(),
        coursesApi.getTags(),
      ]);
      
      setCourse(courseData);
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
      navigate('/instructor/courses');
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
    navigate('/instructor/courses');
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

