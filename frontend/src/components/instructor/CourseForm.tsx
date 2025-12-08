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
import { Loader2, X, Image as ImageIcon, Video, Search, Eye, AlertCircle, Circle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Course, Category, Tag } from '../../lib/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

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
}

export function CourseForm({
  course,
  categories,
  tags,
  onSubmit,
  onCancel,
  loading = false,
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
  const [initialFormData, setInitialFormData] = useState<CourseFormData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (course) {
      // Get categoryId from course, try multiple sources
      const categoryId = course.categoryId 
        ? String(course.categoryId) 
        : (course.category?.id ? String(course.category.id) : '');
      
      // Level is already transformed to lowercase by CourseEditPage
      // But we handle both cases (uppercase from backend or lowercase from transform)
      let normalizedLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      if (course.level) {
        const levelStr = String(course.level).toLowerCase().trim();
        if (levelStr === 'beginner' || levelStr === 'intermediate' || levelStr === 'advanced') {
          normalizedLevel = levelStr as 'beginner' | 'intermediate' | 'advanced';
        }
      }
      
      const initialData: CourseFormData = {
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || course.description?.substring(0, 500) || '',
        categoryId: categoryId,
        level: normalizedLevel,
        price: course.originalPrice?.toString() || '0',
        discountPrice: course.discountPrice?.toString() || '',
        requirements: course.requirements || '',
        whatYouLearn: course.whatYouLearn || '',
        courseObjectives: course.courseObjectives || '',
        targetAudience: course.targetAudience || '',
        language: course.language || 'vi',
        tags: course.tags?.map((t) => String(t.id)) || [],
      };
      
      setFormData(initialData);
      setInitialFormData(initialData);
      
      if (course.thumbnail) {
        setThumbnailPreview(course.thumbnail);
      }
      if (course.previewVideoUrl) {
        setPreviewVideoPreview(course.previewVideoUrl);
      }
    }
  }, [course]);

  // Ensure categoryId is set after categories are loaded
  useEffect(() => {
    if (course && categories.length > 0 && !formData.categoryId) {
      const categoryId = course.categoryId 
        ? String(course.categoryId) 
        : (course.category?.id ? String(course.category.id) : '');
      
      if (categoryId) {
        // Verify the category exists in the list
        const categoryExists = categories.some(cat => String(cat.id) === categoryId);
        if (categoryExists) {
          setFormData((prev) => ({
            ...prev,
            categoryId: categoryId,
          }));
        }
      }
    }
  }, [course, categories, formData.categoryId]);

  // Force update level if course.level changes and formData.level doesn't match
  // This is a safety net in case the first useEffect didn't set it correctly
  // Only run when course or course.level changes, NOT when formData.level changes (to allow user edits)
  useEffect(() => {
    if (course && course.level) {
      const levelStr = String(course.level).toLowerCase().trim();
      let normalizedLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
      
      if (levelStr === 'beginner' || levelStr === 'intermediate' || levelStr === 'advanced') {
        normalizedLevel = levelStr as 'beginner' | 'intermediate' | 'advanced';
      }
      
      // Only update if level doesn't match (but don't include formData.level in dependencies)
      // This allows user to change level without it being reset
      setFormData((prev) => {
        if (prev.level !== normalizedLevel) {
          return {
            ...prev,
            level: normalizedLevel,
          };
        }
        return prev;
      });
    }
  }, [course, course?.level]);


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

    try {
      const submitData: any = prepareSubmitData();
      await onSubmit(submitData, thumbnailFile || undefined, previewFile || undefined);
      
      // Reset initial form data after successful submit to clear change indicators
      setInitialFormData({ ...formData });
      setThumbnailFile(null);
      setPreviewFile(null);
    } catch (error) {
      // Error is handled by parent component
      throw error;
    }
  };

  const handlePreview = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setPreviewLoading(true);

      // Always prepare preview data from current form data
      const previewData = {
        ...prepareSubmitData(),
        // Get category name
        categoryName: categories.find(c => String(c.id) === formData.categoryId)?.name || '',
        // Get tag names
        tagNames: tags
          .filter(tag => formData.tags.includes(String(tag.id)))
          .map(tag => tag.name),
        // Include preview images/videos
        thumbnailPreview: thumbnailPreview || null,
        previewVideoPreview: previewVideoPreview || null,
      };

      // Save to sessionStorage for preview page
      sessionStorage.setItem('coursePreviewData', JSON.stringify(previewData));

      // Open preview in new tab
      const previewUrl = `/courses/preview`;
      window.open(previewUrl, '_blank');
      
      toast.success('Đã mở xem trước');
    } catch (error: any) {
      console.error('Error preparing preview:', error);
      toast.error('Không thể mở xem trước');
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

  const handleReset = () => {
    if (!initialFormData) return;
    
    // Reset form data to initial values
    setFormData({ ...initialFormData });
    
    // Reset file uploads
    setThumbnailFile(null);
    setPreviewFile(null);
    
    // Reset previews to original course values
    if (course?.thumbnail) {
      setThumbnailPreview(course.thumbnail);
    } else {
      setThumbnailPreview(null);
    }
    
    if (course?.previewVideoUrl) {
      // Revoke blob URL if exists
      if (previewVideoPreview && previewVideoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previewVideoPreview);
      }
      setPreviewVideoPreview(course.previewVideoUrl);
    } else {
      // Revoke blob URL if exists
      if (previewVideoPreview && previewVideoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previewVideoPreview);
      }
      setPreviewVideoPreview(null);
    }
    
    // Clear file input refs
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
    if (previewInputRef.current) {
      previewInputRef.current.value = '';
    }
    
    toast.success('Đã đặt lại form về giá trị ban đầu');
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowCancelDialog(true);
    } else {
      onCancel?.();
    }
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    onCancel?.();
  };

  // Check if a field has been changed
  const isFieldChanged = (fieldName: keyof CourseFormData): boolean => {
    if (!initialFormData || !course) return false;
    const currentValue = formData[fieldName];
    const initialValue = initialFormData[fieldName];
    
    // Special handling for arrays (tags)
    if (fieldName === 'tags') {
      const currentTags = (currentValue as string[]).sort().join(',');
      const initialTags = (initialValue as string[]).sort().join(',');
      return currentTags !== initialTags;
    }
    
    return String(currentValue) !== String(initialValue);
  };

  // Check if form has any changes
  const hasChanges = (): boolean => {
    if (!initialFormData || !course) return false;
    return (
      isFieldChanged('title') ||
      isFieldChanged('description') ||
      isFieldChanged('shortDescription') ||
      isFieldChanged('categoryId') ||
      isFieldChanged('level') ||
      isFieldChanged('price') ||
      isFieldChanged('discountPrice') ||
      isFieldChanged('requirements') ||
      isFieldChanged('whatYouLearn') ||
      isFieldChanged('courseObjectives') ||
      isFieldChanged('targetAudience') ||
      isFieldChanged('language') ||
      isFieldChanged('tags') ||
      thumbnailFile !== null ||
      previewFile !== null
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white flex items-center gap-2">
            Tiêu đề khóa học <span className="text-red-500">*</span>
            {isFieldChanged('title') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nhập tiêu đề khóa học"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('title') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription" className="text-white flex items-center gap-2">
            Mô tả ngắn
            {isFieldChanged('shortDescription') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            placeholder="Mô tả ngắn gọn về khóa học (tối đa 500 ký tự)"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('shortDescription') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-400">{formData.shortDescription.length}/500</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white flex items-center gap-2">
            Mô tả chi tiết <span className="text-red-500">*</span>
            {isFieldChanged('description') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Mô tả chi tiết về khóa học"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('description') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={6}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-white flex items-center gap-2">
              Danh mục <span className="text-red-500">*</span>
              {isFieldChanged('categoryId') && (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              )}
            </Label>
            <Select
              value={formData.categoryId || ''}
              onValueChange={(value) => {
                setFormData({ ...formData, categoryId: value });
                setCategorySearch(''); // Reset search when selected
              }}
            >
              <DarkOutlineSelectTrigger className={`!data-[placeholder]:text-gray-500 dark:!data-[placeholder]:text-gray-400 [&_*[data-slot=select-value]]:!text-black [&_*[data-slot=select-value]]:opacity-100 [&_*[data-slot=select-value][data-placeholder]]:!text-gray-500 dark:[&_*[data-slot=select-value]]:!text-white dark:[&_*[data-slot=select-value]]:opacity-100 dark:[&_*[data-slot=select-value][data-placeholder]]:!text-gray-400 ${
                isFieldChanged('categoryId') ? 'border-green-500 ring-1 ring-green-500/50' : ''
              }`}>
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
            <Label htmlFor="level" className="text-white flex items-center gap-2">
              Cấp độ
              {isFieldChanged('level') && (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              )}
            </Label>
            <Select
              key={`level-select-${formData.level}`}
              value={formData.level || 'beginner'}
              onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                setFormData({ ...formData, level: value })
              }
            >
              <DarkOutlineSelectTrigger className={`[&_*[data-slot=select-value]]:!text-black dark:[&_*[data-slot=select-value]]:!text-white ${
                isFieldChanged('level') ? 'border-green-500 ring-1 ring-green-500/50' : ''
              }`}>
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
            <Label htmlFor="price" className="text-white flex items-center gap-2">
              Giá (VND)
              {isFieldChanged('price') && (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              )}
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
                isFieldChanged('price') ? 'border-green-500 ring-1 ring-green-500/50' : ''
              }`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountPrice" className="text-white flex items-center gap-2">
              Giá khuyến mãi (VND)
              {isFieldChanged('discountPrice') && (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              )}
            </Label>
            <Input
              id="discountPrice"
              type="number"
              min="0"
              value={formData.discountPrice}
              onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
              placeholder="0"
              className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
                isFieldChanged('discountPrice') ? 'border-green-500 ring-1 ring-green-500/50' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Media Upload */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Hình ảnh và Video</h3>

        <div className="space-y-2">
          <Label className="text-white flex items-center gap-2">
            Ảnh đại diện
            {thumbnailFile !== null && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <div className="flex items-center gap-4">
            {thumbnailPreview && (
              <div className={`relative w-32 h-32 rounded-lg overflow-hidden border ${
                thumbnailFile !== null ? 'border-green-500 ring-1 ring-green-500/50' : 'border-[#2D2D2D]'
              }`}>
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
          <Label className="text-white flex items-center gap-2">
            Video giới thiệu
            {previewFile !== null && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <div className="space-y-4">
            {previewVideoPreview && (
              <div className={`relative w-full max-w-2xl aspect-video rounded-lg overflow-hidden border bg-[#1F1F1F] ${
                previewFile !== null ? 'border-green-500 ring-1 ring-green-500/50' : 'border-[#2D2D2D]'
              }`}>
                <video
                  src={previewVideoPreview}
                  controls
                  className="w-full h-full object-contain"
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                <button
                  type="button"
                  onClick={removePreview}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full hover:bg-red-700 z-10"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            )}
            <div>
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
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          Tags
          {isFieldChanged('tags') && (
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
          )}
        </h3>
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
          <Label htmlFor="requirements" className="text-white flex items-center gap-2">
            Yêu cầu
            {isFieldChanged('requirements') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="requirements"
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="Yêu cầu để tham gia khóa học"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('requirements') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatYouLearn" className="text-white flex items-center gap-2">
            Bạn sẽ học được gì
            {isFieldChanged('whatYouLearn') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="whatYouLearn"
            value={formData.whatYouLearn}
            onChange={(e) => setFormData({ ...formData, whatYouLearn: e.target.value })}
            placeholder="Những kiến thức và kỹ năng bạn sẽ học được"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('whatYouLearn') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="courseObjectives" className="text-white flex items-center gap-2">
            Mục tiêu khóa học
            {isFieldChanged('courseObjectives') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="courseObjectives"
            value={formData.courseObjectives}
            onChange={(e) => setFormData({ ...formData, courseObjectives: e.target.value })}
            placeholder="Mục tiêu của khóa học"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('courseObjectives') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-white flex items-center gap-2">
            Đối tượng mục tiêu
            {isFieldChanged('targetAudience') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="targetAudience"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="Khóa học phù hợp với ai"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('targetAudience') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={3}
          />
        </div>
      </div>

      {/* Change Indicator */}
      {course && hasChanges() && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-500">Bạn có thay đổi chưa lưu</span>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[#2D2D2D]">
        {course && initialFormData && (
          <DarkOutlineButton
            type="button"
            onClick={handleReset}
            disabled={loading || previewLoading || !hasChanges()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại
          </DarkOutlineButton>
        )}
        {onCancel && (
          <DarkOutlineButton
            type="button"
            onClick={handleCancel}
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Xác nhận hủy</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy và rời khỏi trang này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DarkOutlineButton
              type="button"
              onClick={() => setShowCancelDialog(false)}
            >
              Ở lại
            </DarkOutlineButton>
            <Button
              type="button"
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Hủy và rời khỏi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

