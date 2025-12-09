import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CourseForm } from '../../components/instructor/CourseForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { coursesApi } from '../../lib/api/courses';
import { toast } from 'sonner';
import { DarkOutlineButton } from '../../components/ui/buttons';
import type { Course, Category, Tag } from '../../lib/api/types';

export function CourseCreatePage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, tagsData] = await Promise.all([
        coursesApi.getCategories(),
        coursesApi.getTags(),
      ]);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setTags(Array.isArray(tagsData) ? tagsData : []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // Error toast is already shown by API client interceptor
      // Set empty arrays on error
      setCategories([]);
      setTags([]);
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
    try {
      setSubmitting(true);
      
      // Extract tags from data before creating course
      // Tags should not be sent in create request to avoid backend processing them
      const { tags, ...courseData } = data;
      
      // Create course (without tags)
      const newCourse = await coursesApi.createInstructorCourse(courseData);
      
      if (!newCourse || !newCourse.id) {
        throw new Error('Course creation failed: No course ID returned');
      }
      
      const courseId = String(newCourse.id);
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        await coursesApi.uploadCourseThumbnail(courseId, thumbnailFile);
      }
      
      // Upload preview video if provided
      if (previewFile) {
        await coursesApi.uploadCoursePreview(courseId, previewFile);
      }
      
      // Add tags separately after course creation
      if (tags && Array.isArray(tags) && tags.length > 0) {
        const tagIds = tags
          .map((tagId) => parseInt(String(tagId)))
          .filter((id) => !isNaN(id) && id > 0);
        if (tagIds.length > 0) {
          await coursesApi.addCourseTags(courseId, tagIds);
        }
      }
      
      toast.success('Tạo khóa học thành công!');
      navigate('/instructor/dashboard');
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      // Log full error response for debugging
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          console.error('Validation errors:', error.response.data.errors);
        }
      }
      
      // Try to get detailed error message
      let errorMessage = 'Không thể tạo khóa học';
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
          // Handle validation errors array - express-validator format
          const errorMessages = error.response.data.errors.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            if (err.path && err.msg) return `${err.path}: ${err.msg}`;
            return JSON.stringify(err);
          }).join(', ');
          errorMessage = errorMessages || errorMessage;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Error toast is already shown by API client interceptor
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/dashboard', { state: { preserveScroll: true } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-2xl">Tạo khóa học mới</CardTitle>
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

