import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CourseForm } from '../../components/instructor/CourseForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { coursesApi } from '../../lib/api/courses'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
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
      // RoleRoute component already handles permission check and shows toast
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
      id: Number(course.id) || 0,
      title: course.title || '',
      slug: course.slug || '',
      description: course.description || '',
      shortDescription: course.shortDescription || '',
      thumbnailUrl: course.thumbnailUrl || course.thumbnail || '',
      videoPreviewUrl: course.videoPreviewUrl || course.previewVideoUrl || '',
      instructorId: Number(course.instructorId) || 0,
      categoryId: Number(course.categoryId || course.category?.id) || 0,
      category: course.category ? {
        id: Number(course.category.id) || 0,
        name: course.category.name || '',
        slug: course.category.slug || '',
        description: course.category.description,
        imageUrl: course.category.imageUrl,
        parentId: course.category.parentId ? Number(course.category.parentId) : undefined,
        sortOrder: course.category.sortOrder || 0,
        isActive: course.category.isActive !== undefined ? course.category.isActive : true,
        createdAt: course.category.createdAt || new Date().toISOString(),
        updatedAt: course.category.updatedAt || new Date().toISOString(),
      } : undefined,
      level: (course.level?.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') || 'BEGINNER',
      price: parseFloat(String(course.price || 0)) || 0,
      discountPrice: course.discountPrice ? parseFloat(String(course.discountPrice)) : undefined,
      durationHours: course.durationHours || 0,
      totalLessons: course.totalLessons || 0,
      language: course.language || 'vi',
      status: (course.status?.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') || 'DRAFT',
      isFeatured: course.isFeatured || false,
      ratingAvg: course.ratingAvg ? parseFloat(String(course.ratingAvg)) : 0,
      ratingCount: course.ratingCount || 0,
      enrolledCount: course.enrolledCount || 0,
      viewsCount: course.viewsCount || 0,
      completionRate: course.completionRate ? parseFloat(String(course.completionRate)) : 0,
      requirements: course.requirements || '',
      whatYouLearn: course.whatYouLearn || '',
      courseObjectives: course.courseObjectives || '',
      targetAudience: course.targetAudience || '',
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
        courseData = await instructorCoursesApi.getInstructorCourseById(id);
      } catch (error: any) {
        // If endpoint doesn't exist (404) or fails, fallback to searching in list
        console.warn('getInstructorCourseById failed, falling back to list search');
        let page = 1;
        const limit = 100;
        let hasMore = true;
        
        while (hasMore && !courseData) {
          const coursesResponse = await instructorCoursesApi.getInstructorCourses({ 
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
      
      // Extract selected tag IDs from course data (before transform, in case tags structure is different)
      const selectedTagIds = courseData.tags 
        ? courseData.tags.map((t: any) => String(t.id || t))
        : (courseData.courseTags 
          ? courseData.courseTags.map((ct: any) => String(ct.tag?.id || ct.tagId || ct.tag))
          : []);
      
      // Load categories and tags in parallel
      // Pass selected tag IDs to ensure they are loaded even if not in first 25
      const [categoriesData, tagsData] = await Promise.all([
        coursesApi.getCategories(),
        coursesApi.getTags(selectedTagIds),
      ]);
      
      setCourse(transformedCourse);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // Error toast is already shown by API client interceptor
      navigate('/instructor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const reloadTags = async () => {
    try {
      const tagsData = await coursesApi.getTags();
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Error reloading tags:', error);
      // Don't show error toast, just log it
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
      await instructorCoursesApi.updateInstructorCourse(id, data);
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        await instructorCoursesApi.uploadCourseThumbnail(id, thumbnailFile);
      }
      
      // Upload preview video if provided
      if (previewFile) {
        await instructorCoursesApi.uploadCoursePreview(id, previewFile);
      }
      
      // Update tags if provided
      if (data.tags && Array.isArray(data.tags)) {
        const newTagIds = data.tags
          .map((tagId: any) => parseInt(String(tagId)))
          .filter((id: number) => !isNaN(id) && id > 0);
        
        // Always load fresh course data from API to get current tags
        // This ensures we have the most up-to-date tag associations
        let currentCourse: Course | null = null;
        try {
          // Try to get course by ID first
          try {
            currentCourse = await instructorCoursesApi.getInstructorCourseById(id);
          } catch (error) {
            // If endpoint doesn't exist, fallback to searching in list
            const coursesResponse = await instructorCoursesApi.getInstructorCourses({ page: 1, limit: 100 });
            const found = coursesResponse.data.find((c: Course) => String(c.id) === id);
            if (found) {
              currentCourse = found;
            }
          }
        } catch (error) {
          console.warn('Could not load course for tags:', error);
        }
        
        if (currentCourse) {
          // Get existing tag IDs - handle both Tag[] and different tag structures
          const existingTagIds: number[] = [];
          if (currentCourse.tags && Array.isArray(currentCourse.tags) && currentCourse.tags.length > 0) {
            for (const tag of currentCourse.tags) {
              // Handle different tag structures: {id: string}, {id: number}, or just number/string
              let tagId: number;
              if (typeof tag === 'object' && tag !== null) {
                tagId = typeof tag.id === 'string' ? parseInt(tag.id) : (tag.id as number);
              } else {
                tagId = typeof tag === 'string' ? parseInt(tag) : (tag as number);
              }
              if (!isNaN(tagId) && tagId > 0) {
                existingTagIds.push(tagId);
              }
            }
          }
          
          // Find tags to remove (in existing but not in new)
          const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));
          
          // Find tags to add (in new but not in existing)
          const tagsToAdd = newTagIds.filter(id => !existingTagIds.includes(id));
          
          // Remove tags that are no longer selected
          for (const tagId of tagsToRemove) {
            try {
              await instructorCoursesApi.removeCourseTag(id, tagId);
            } catch (error) {
              // Ignore errors if tag doesn't exist
              console.warn('Error removing tag:', error);
            }
          }
          
          // Add only new tags (not already associated)
          if (tagsToAdd.length > 0) {
            try {
              await instructorCoursesApi.addCourseTags(id, tagsToAdd);
            } catch (error: any) {
              // If error is "All tags are already associated", it means our comparison was wrong
              // This could happen if tags weren't loaded properly
              if (error?.response?.data?.message?.includes('already associated')) {
                console.warn('Tags already associated - skipping add');
                // Don't throw - tags are already there, which is fine
              } else {
                throw error;
              }
            }
          }
        } else {
          // If we can't load current course, we need to be more careful
          // Try to remove all existing tags first, then add new ones
          // But we don't know which tags exist, so we'll just try to add
          // and let backend handle duplicates gracefully
          if (newTagIds.length > 0) {
            try {
              await instructorCoursesApi.addCourseTags(id, newTagIds);
            } catch (error: any) {
              // If error is "All tags are already associated", try removing all first
              if (error?.response?.data?.message?.includes('already associated')) {
                console.warn('All tags already associated - trying to sync tags');
                // This is a fallback - we can't know which tags to remove without course data
                // So we'll just log and continue
                console.warn('Cannot sync tags without course data');
              } else {
                throw error;
              }
            }
          }
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
      // Error toast is already shown by API client interceptor
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to previous page, or to dashboard if no previous page
    if (window.history.length > 1) {
      navigate(-1 as any, { state: { preserveScroll: true } });
    } else {
      navigate('/instructor/dashboard', { state: { preserveScroll: true } });
    }
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
    <div className="p-6 max-w-6xl mx-auto">
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
            onTagCreated={reloadTags}
          />
        </CardContent>
      </Card>
    </div>
  );
}

