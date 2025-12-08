import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectValue,
} from '../ui/select';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../ui/dark-outline-select-trigger';
import { Loader2, X, Image as ImageIcon, Video, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { Course, Category, Tag } from '../../lib/api/types';
import { coursesApi } from '../../lib/api/courses';

interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: string;
  discountPrice: string;
  requirements: string;
  whatYouLearn: string;
  courseObjectives: string;
  targetAudience: string;
  language: string;
  tags: string[];
}

interface CourseFormProps {
  course?: Course | null;
  categories: Category[];
  tags: Tag[];
  onSubmit: (data: Partial<Course>, thumbnailFile?: File, previewFile?: File) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  onPreview?: (courseId: string) => void;
}

export function CourseForm({
  course,
  categories,
  tags,
  onSubmit,
  onCancel,
  loading = false,
  onPreview,
}: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    level: 'beginner',
    price: '0',
    discountPrice: '',
    requirements: '',
    whatYouLearn: '',
    courseObjectives: '',
    targetAudience: '',
    language: 'vi',
    tags: [],
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [previewVideoPreview, setPreviewVideoPreview] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.description?.substring(0, 500) || '',
        categoryId: course.categoryId || '',
        level: course.level || 'beginner',
        price: course.originalPrice?.toString() || '0',
        discountPrice: course.discountPrice?.toString() || '',
        requirements: '',
        whatYouLearn: '',
        courseObjectives: '',
        targetAudience: '',
        language: 'vi',
        tags: course.tags?.map((t) => String(t.id)) || [],
      });
      if (course.thumbnail) {
        setThumbnailPreview(course.thumbnail);
      }
      if (course.previewVideoUrl) {
        setPreviewVideoPreview(course.previewVideoUrl);
      }
    }
  }, [course]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
      setThumbnailFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Vui lòng chọn file video');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 100MB');
      return;
    }

    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewVideoPreview(url);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const removePreview = () => {
    setPreviewFile(null);
    if (previewVideoPreview && previewVideoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(previewVideoPreview);
    }
    setPreviewVideoPreview(null);
    if (previewInputRef.current) {
      previewInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề khóa học');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả khóa học');
      return false;
    }

    if (!formData.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return false;
    }

    return true;
  };

  const prepareSubmitData = () => {
    return {
      title: formData.title.trim(),
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim() || undefined,
      categoryId: parseInt(formData.categoryId),
      level: formData.level.toUpperCase(),
      price: parseFloat(formData.price) || 0,
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
      requirements: formData.requirements.trim() || undefined,
      whatYouLearn: formData.whatYouLearn.trim() || undefined,
      courseObjectives: formData.courseObjectives.trim() || undefined,
      targetAudience: formData.targetAudience.trim() || undefined,
      language: formData.language,
      status: 'DRAFT',
      tags: formData.tags,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: any = prepareSubmitData();
    await onSubmit(submitData, thumbnailFile || undefined, previewFile || undefined);
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setPreviewLoading(true);

      // If course already exists, just open preview
      if (course?.id) {
        const previewUrl = `/courses/${course.id}`;
        window.open(previewUrl, '_blank');
        return;
      }

      // If creating new course, save it first as draft
      const submitData: any = prepareSubmitData();
      
      // Create course
      const newCourse = await coursesApi.createInstructorCourse(submitData);
      
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
      if (submitData.tags && Array.isArray(submitData.tags) && submitData.tags.length > 0) {
        const tagIds = submitData.tags
          .map((tagId: any) => parseInt(String(tagId)))
          .filter((id: number) => !isNaN(id) && id > 0);
        if (tagIds.length > 0) {
          await coursesApi.addCourseTags(courseId, tagIds);
        }
      }

      // Notify parent component about the new course (for CourseCreatePage to update)
      if (onPreview) {
        onPreview(courseId);
      }

      // Open preview in new tab
      const previewUrl = `/courses/${courseId}`;
      window.open(previewUrl, '_blank');
      
      toast.success('Đã lưu bản nháp và mở xem trước');
    } catch (error: any) {
      console.error('Error creating course for preview:', error);
      toast.error('Không thể tạo khóa học để xem trước');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id: string) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white">
            Tiêu đề khóa học <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nhập tiêu đề khóa học"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription" className="text-white">
            Mô tả ngắn
          </Label>
          <Textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Mô tả ngắn gọn về khóa học (tối đa 500 ký tự)"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-400">{formData.shortDescription.length}/500</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white">
            Mô tả chi tiết <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả chi tiết về khóa học"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            rows={6}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-white">
              Danh mục <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.categoryId ? String(formData.categoryId) : ''}
              onValueChange={(value) => {
                setFormData({ ...formData, categoryId: value });
                setCategorySearch(''); // Reset search when selected
              }}
            >
              <DarkOutlineSelectTrigger className="!data-[placeholder]:text-gray-500 dark:!data-[placeholder]:text-gray-400 [&_*[data-slot=select-value]]:!text-black [&_*[data-slot=select-value]]:opacity-100 [&_*[data-slot=select-value][data-placeholder]]:!text-gray-500 dark:[&_*[data-slot=select-value]]:!text-white dark:[&_*[data-slot=select-value]]:opacity-100 dark:[&_*[data-slot=select-value][data-placeholder]]:!text-gray-400">
                <SelectValue placeholder="Chọn danh mục" />
              </DarkOutlineSelectTrigger>
              <DarkOutlineSelectContent>
                <div className="p-2 border-b border-gray-300 dark:border-[#2D2D2D]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm danh mục..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full pl-8 pr-2 py-1.5 text-sm bg-white dark:bg-[#1F1F1F] border border-gray-300 dark:border-[#2D2D2D] rounded text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {categories
                    .filter((category) =>
                      category.name.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .slice(0, 100) // Limit to 100 items for performance
                    .map((category) => (
                      <DarkOutlineSelectItem
                        key={category.id}
                        value={String(category.id)}
                      >
                        {category.name}
                      </DarkOutlineSelectItem>
                    ))}
                  {categories.filter((category) =>
                    category.name.toLowerCase().includes(categorySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      Không tìm thấy danh mục
                    </div>
                  )}
                </div>
              </DarkOutlineSelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="level" className="text-white">
              Cấp độ
            </Label>
            <Select
              value={formData.level}
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                setFormData({ ...formData, level: value })
              }
            >
              <DarkOutlineSelectTrigger className="[&_*[data-slot=select-value]]:!text-black dark:[&_*[data-slot=select-value]]:!text-white">
                <SelectValue />
              </DarkOutlineSelectTrigger>
              <DarkOutlineSelectContent>
                <DarkOutlineSelectItem value="beginner">
                  Cơ bản
                </DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="intermediate">
                  Trung bình
                </DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="advanced">
                  Nâng cao
                </DarkOutlineSelectItem>
              </DarkOutlineSelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-white">
              Giá (VND)
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPrice" className="text-white">
              Giá khuyến mãi (VND)
            </Label>
            <Input
              id="discountPrice"
              type="number"
              min="0"
              value={formData.discountPrice}
              onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
              placeholder="0"
              className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            />
          </div>
        </div>
      </div>

      {/* Media Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Hình ảnh và Video</h3>

        <div className="space-y-2">
          <Label className="text-white">Ảnh đại diện</Label>
          <div className="flex items-center gap-4">
            {thumbnailPreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#2D2D2D]">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="absolute top-1 right-1 p-1 bg-red-600 rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                className="bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {thumbnailPreview ? 'Thay đổi ảnh' : 'Chọn ảnh đại diện'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Video giới thiệu</Label>
          <div className="flex items-center gap-4">
            {previewVideoPreview && (
              <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-[#2D2D2D] bg-[#1F1F1F] flex items-center justify-center">
                <Video className="h-8 w-8 text-gray-400" />
                <button
                  type="button"
                  onClick={removePreview}
                  className="absolute top-1 right-1 p-1 bg-red-600 rounded-full hover:bg-red-700"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
            <div className="flex-1">
              <input
                ref={previewInputRef}
                type="file"
                accept="video/*"
                onChange={handlePreviewSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => previewInputRef.current?.click()}
                className="bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
              >
                <Video className="h-4 w-4 mr-2" />
                {previewVideoPreview ? 'Thay đổi video' : 'Chọn video giới thiệu'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(tags) && tags.length > 0 ? tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                formData.tags.includes(tag.id)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D]'
              }`}
            >
              {tag.name}
            </button>
          )) : (
            <p className="text-gray-400 text-sm">Chưa có tags nào</p>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Thông tin bổ sung</h3>

        <div className="space-y-2">
          <Label htmlFor="requirements" className="text-white">
            Yêu cầu
          </Label>
          <Textarea
            id="requirements"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="Yêu cầu để tham gia khóa học"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatYouLearn" className="text-white">
            Bạn sẽ học được gì
          </Label>
          <Textarea
            id="whatYouLearn"
            value={formData.whatYouLearn}
            onChange={(e) => setFormData({ ...formData, whatYouLearn: e.target.value })}
            placeholder="Những kiến thức và kỹ năng bạn sẽ học được"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="courseObjectives" className="text-white">
            Mục tiêu khóa học
          </Label>
          <Textarea
            id="courseObjectives"
            value={formData.courseObjectives}
            onChange={(e) => setFormData({ ...formData, courseObjectives: e.target.value })}
            placeholder="Mục tiêu của khóa học"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-white">
            Đối tượng mục tiêu
          </Label>
          <Textarea
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="Khóa học phù hợp với ai"
            className="bg-[#1F1F1F] border-[#2D2D2D] text-white"
            rows={3}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D]">
        {onCancel && (
          <DarkOutlineButton
            type="button"
            onClick={onCancel}
            disabled={loading || previewLoading}
          >
            Hủy
          </DarkOutlineButton>
        )}
        <DarkOutlineButton
          type="button"
          onClick={handlePreview}
          disabled={loading || previewLoading}
          className="flex items-center gap-2"
        >
          {previewLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Xem trước
            </>
          )}
        </DarkOutlineButton>
        <Button
          type="submit"
          disabled={loading || previewLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : course ? (
            'Cập nhật khóa học'
          ) : (
            'Tạo khóa học'
          )}
        </Button>
      </div>
    </form>
  );
}

