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
      toast.error('Bạn không có quyền truy cập trang này');
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
      toast.error('Không thể tải dữ liệu');
      // Set empty arrays on error
      setCategories([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (
    data: Partial<Course>,
    thumbnailFile?: File,
    previewFile?: File
  ) => {
    try {
      setSubmitting(true);
      
      // Create course
      const newCourse = await coursesApi.createInstructorCourse(data);
      
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
      
      // Add tags if provided
      if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
        const tagIds = data.tags
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
      const errorMessage = error.response?.data?.message || 'Không thể tạo khóa học';
      toast.error(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/instructor/dashboard');
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
          />
        </CardContent>
      </Card>
    </div>
  );
}

