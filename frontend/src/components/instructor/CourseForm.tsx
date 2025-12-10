import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { DarkOutlineButton } from '../ui/buttons';
import { Input } from '../ui/input';
import { FormInput } from '../ui/form-input';
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
import { coursesApi } from '../../lib/api/courses';
import { Checkbox } from '../ui/checkbox';
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
  isFree: boolean;
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
  onTagCreated?: () => void;
}

// Format number to currency string without VNĐ suffix (for input display)
function formatPriceInput(price: number | undefined | string): string {
  if (!price) return '';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

// Parse currency string to number (remove dots and spaces)
function parsePriceInput(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined;
  // Remove all dots, spaces, and non-numeric characters except digits
  const cleaned = value.replace(/[^\d]/g, '');
  if (cleaned === '') return undefined;
  const parsed = parseFloat(cleaned);
  // Return the parsed number (including 0) if valid, undefined if NaN
  return isNaN(parsed) ? undefined : parsed;
}

export function CourseForm({
  course,
  categories,
  tags: tagsProp,
  onSubmit,
  onCancel,
  loading = false,
  onTagCreated,
}: CourseFormProps) {
  // Use local state for tags to avoid losing newly created tags during reload
  const [tags, setTags] = useState<Tag[]>(tagsProp);
  
  // Update tags when prop changes, but merge with existing tags to avoid losing selected tags
  useEffect(() => {
    if (tagsProp && tagsProp.length > 0) {
      setTags((prevTags) => {
        // Create a map of existing tags by ID
        const existingTagsMap = new Map(prevTags.map(tag => [String(tag.id), tag]));
        
        // Add/update tags from prop
        tagsProp.forEach(tag => {
          existingTagsMap.set(String(tag.id), tag);
        });
        
        // Return merged tags array
        return Array.from(existingTagsMap.values());
      });
    }
    // Don't clear tags if prop is empty - keep existing tags to avoid losing selected tags
    // Only update if we have new tags from prop
  }, [tagsProp]);

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    level: 'beginner',
    price: formatPriceInput(0),
    discountPrice: '',
    isFree: true, // Default to free course
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
  const [tagSearch, setTagSearch] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [initialFormData, setInitialFormData] = useState<CourseFormData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  // Track newly created tags in this session (only when editing)
  const [newlyCreatedTagIds, setNewlyCreatedTagIds] = useState<Set<string>>(new Set());
  // Track original tags when editing (to distinguish from newly added tags)
  const [originalTagIds, setOriginalTagIds] = useState<Set<string>>(new Set());
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
      
      const originalPrice = course.originalPrice || course.price || 0;
      const isFree = originalPrice === 0 || originalPrice === null || originalPrice === undefined;
      
      const initialData: CourseFormData = {
        title: course.title || '',
        description: course.description || '',
        shortDescription: course.shortDescription || course.description?.substring(0, 500) || '',
        categoryId: categoryId,
        level: normalizedLevel,
        price: isFree ? formatPriceInput(0) : formatPriceInput(originalPrice),
        discountPrice: course.discountPrice?.toString() || '',
        isFree: isFree,
        requirements: course.requirements || '',
        whatYouLearn: course.whatYouLearn || '',
        courseObjectives: course.courseObjectives || '',
        targetAudience: course.targetAudience || '',
        language: course.language || 'vi',
        tags: course.tags?.map((t) => String(t.id)) || [],
      };
      
      setFormData(initialData);
      setInitialFormData(initialData);
      
      // Track original tags when editing
      if (course.tags && Array.isArray(course.tags)) {
        const originalIds = course.tags.map((t) => String(t.id));
        setOriginalTagIds(new Set(originalIds));
      }
      
      if (course.thumbnailUrl) {
        setThumbnailPreview(course.thumbnailUrl);
      }
      if (course.videoPreviewUrl) {
        setPreviewVideoPreview(course.videoPreviewUrl);
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

  // Validation helper function
  const validateFormData = (): { missingFields: string[]; invalidFields: string[] } => {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];
    
    // Title validation: required, 5-200 characters
    if (!formData.title.trim()) {
      missingFields.push('tiêu đề khóa học');
    } else {
      const titleLength = formData.title.trim().length;
      if (titleLength < 5 || titleLength > 200) {
        invalidFields.push('tiêu đề khóa học phải có từ 5 đến 200 ký tự');
      }
    }
    
    // Description validation: optional, max 10000 characters
    if (formData.description.trim().length > 10000) {
      invalidFields.push('mô tả chi tiết không được vượt quá 10000 ký tự');
    }
    
    // Short description validation: optional, max 500 characters
    if (formData.shortDescription.trim().length > 500) {
      invalidFields.push('mô tả ngắn không được vượt quá 500 ký tự');
    }
    
    // Category validation: required
    if (!formData.categoryId) {
      missingFields.push('danh mục');
    }
    
    // Price validation: if not free, price is required and must be >= 0
    if (!formData.isFree) {
      // Check if price is empty/missing first
      if (!formData.price.trim()) {
        missingFields.push('giá khóa học');
      } else {
        const price = parsePriceInput(formData.price);
        // Allow 0 as valid price (>= 0 means 0 is valid)
        if (price === undefined || price < 0 || isNaN(price)) {
          invalidFields.push('giá phải là số không âm');
        } else {
          // Only validate discount price if price is valid
          // Discount price validation: optional, >= 0 and <= price
          if (formData.discountPrice.trim()) {
            const discountPrice = parsePriceInput(formData.discountPrice);
            if (discountPrice === undefined || discountPrice < 0) {
              invalidFields.push('giá khuyến mãi phải là số không âm');
            } else if (price !== undefined && discountPrice > price) {
              invalidFields.push('giá khuyến mãi không được lớn hơn giá gốc');
            }
          }
        }
      }
    }
    // If free course, skip discount price validation - it will be cleared/ignored in prepareSubmitData
    
    // Language validation: optional, 2-10 characters
    if (formData.language.trim() && (formData.language.trim().length < 2 || formData.language.trim().length > 10)) {
      invalidFields.push('ngôn ngữ phải có từ 2 đến 10 ký tự');
    }
    
    // Requirements validation: optional, max 5000 characters
    if (formData.requirements.trim().length > 5000) {
      invalidFields.push('yêu cầu không được vượt quá 5000 ký tự');
    }
    
    // What you learn validation: optional, max 5000 characters
    if (formData.whatYouLearn.trim().length > 5000) {
      invalidFields.push('bạn sẽ học được gì không được vượt quá 5000 ký tự');
    }
    
    // Course objectives validation: optional, max 5000 characters
    if (formData.courseObjectives.trim().length > 5000) {
      invalidFields.push('mục tiêu khóa học không được vượt quá 5000 ký tự');
    }
    
    // Target audience validation: optional, max 5000 characters
    if (formData.targetAudience.trim().length > 5000) {
      invalidFields.push('đối tượng mục tiêu không được vượt quá 5000 ký tự');
    }
    
    return { missingFields, invalidFields };
  };

  const prepareSubmitData = () => {
    const categoryId = parseInt(formData.categoryId);
    if (isNaN(categoryId) || categoryId <= 0) {
      throw new Error('Category ID is invalid');
    }

    // If free course, set price to 0 and discountPrice to 0
    // Backend understands: price=0 and discountPrice=0 means free course
    let price: number;
    let discountPrice: number | null;
    
    if (formData.isFree) {
      price = 0;
      discountPrice = 0; // Backend requires discountPrice=0 for free courses
    } else {
      const parsedPrice = parsePriceInput(formData.price);
      // Allow 0 as valid price (>= 0 means 0 is valid)
      if (parsedPrice === undefined || parsedPrice < 0 || isNaN(parsedPrice)) {
        throw new Error('Price is invalid');
      }
      price = parsedPrice;
      
      // Handle discount price for paid courses
      if (formData.discountPrice.trim()) {
        const discount = parsePriceInput(formData.discountPrice);
        if (discount === undefined || discount < 0) {
          throw new Error('Discount price is invalid');
        }
        // If discount is 0, treat it as removing discount (send null)
        if (discount === 0) {
          discountPrice = null;
        } else {
          if (discount > price) {
            throw new Error('Discount price cannot be greater than price');
          }
          discountPrice = discount;
        }
      } else {
        // If no discount price, send null to remove existing discount
        discountPrice = null;
      }
    }

    // Prepare tags for separate handling (not sent in create/update request)
    // This prevents "All tags are already associated" error if backend processes tags during creation
    const tags = formData.tags
      .map(tagId => parseInt(tagId))
      .filter(id => !isNaN(id) && id > 0);

    const submitData: any = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim() || undefined,
      categoryId: categoryId,
      level: formData.level.toUpperCase(),
      price: price,
      discountPrice: discountPrice,
      requirements: formData.requirements.trim() || undefined,
      whatYouLearn: formData.whatYouLearn.trim() || undefined,
      courseObjectives: formData.courseObjectives.trim() || undefined,
      targetAudience: formData.targetAudience.trim() || undefined,
      language: formData.language,
      status: 'DRAFT',
    };

    // Include tags in return object for parent component to handle separately
    // But don't send tags in the actual API request to avoid backend processing them
    if (tags.length > 0) {
      submitData.tags = tags;
    }

    return submitData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const { missingFields, invalidFields } = validateFormData();

    // Priority: Check missing fields first (required fields)
    if (missingFields.length > 0) {
      // Show general message if multiple fields are missing
      if (missingFields.length > 1) {
        toast.error('Vui lòng nhập các thông tin bắt buộc');
      } else {
        // Show specific message for single missing field
        toast.error(`Vui lòng nhập ${missingFields[0]}`);
      }
      
      // Trigger HTML5 validation to show field-level messages
      // Use setTimeout to ensure toast shows first
      setTimeout(() => {
        const form = e.currentTarget.closest('form');
        if (form) {
          const firstInvalidField = form.querySelector(':invalid') as HTMLInputElement | HTMLTextAreaElement;
          if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.reportValidity();
          }
        }
      }, 100);
      return;
    }

    // If there are invalid fields (validation errors), show message
    if (invalidFields.length > 0) {
      if (invalidFields.length > 1) {
        toast.error('Vui lòng kiểm tra lại các thông tin đã nhập');
      } else {
        toast.error(invalidFields[0]);
      }
      
      // Trigger HTML5 validation to show field-level messages
      setTimeout(() => {
        const form = e.currentTarget.closest('form');
        if (form) {
          // Try to find the field that matches the error
          let targetField: HTMLInputElement | HTMLTextAreaElement | null = null;
          const errorMsg = invalidFields[0].toLowerCase();
          
          if (errorMsg.includes('tiêu đề')) {
            targetField = form.querySelector('#title') as HTMLInputElement;
          } else if (errorMsg.includes('mô tả chi tiết')) {
            targetField = form.querySelector('#description') as HTMLTextAreaElement;
          } else if (errorMsg.includes('mô tả ngắn')) {
            targetField = form.querySelector('#shortDescription') as HTMLTextAreaElement;
          } else if (errorMsg.includes('giá')) {
            if (errorMsg.includes('khuyến mãi')) {
              targetField = form.querySelector('#discountPrice') as HTMLInputElement;
            } else {
              targetField = form.querySelector('#price') as HTMLInputElement;
            }
          } else if (errorMsg.includes('ngôn ngữ')) {
            targetField = form.querySelector('#language') as HTMLInputElement;
          } else if (errorMsg.includes('yêu cầu')) {
            targetField = form.querySelector('#requirements') as HTMLTextAreaElement;
          } else if (errorMsg.includes('bạn sẽ học')) {
            targetField = form.querySelector('#whatYouLearn') as HTMLTextAreaElement;
          } else if (errorMsg.includes('mục tiêu')) {
            targetField = form.querySelector('#courseObjectives') as HTMLTextAreaElement;
          } else if (errorMsg.includes('đối tượng')) {
            targetField = form.querySelector('#targetAudience') as HTMLTextAreaElement;
          }
          
          if (targetField) {
            targetField.focus();
            targetField.setCustomValidity(invalidFields[0]);
            targetField.reportValidity();
          }
        }
      }, 100);
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
    // Validate all fields
    const { missingFields, invalidFields } = validateFormData();

    // If there are invalid fields (validation errors), show message
    if (invalidFields.length > 0) {
      if (invalidFields.length > 1) {
        toast.error('Vui lòng kiểm tra lại các thông tin đã nhập');
      } else {
        toast.error(invalidFields[0]);
      }
      
      // Trigger HTML5 validation to show field-level messages
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          const titleField = form.querySelector('#title') as HTMLInputElement;
          if (titleField) {
            titleField.focus();
            titleField.setCustomValidity(invalidFields[0]);
            titleField.reportValidity();
          }
        }
      }, 100);
      return;
    }

    // If there are missing fields, show appropriate message
    if (missingFields.length > 0) {
      // Show general message if multiple fields are missing
      if (missingFields.length > 1) {
        toast.error('Vui lòng nhập các thông tin bắt buộc');
      } else {
        // Show specific message for single missing field
        toast.error(`Vui lòng nhập ${missingFields[0]}`);
      }
      
      // Manually trigger validation for all invalid fields to show field-level messages
      const form = document.querySelector('form');
      if (form) {
        // Get all required inputs and textareas
        const requiredFields = form.querySelectorAll('input[required], textarea[required]') as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
        requiredFields.forEach((field) => {
          if (!field.value.trim()) {
            field.reportValidity();
          }
        });
        
        // Focus on first invalid field
        const firstInvalidField = form.querySelector(':invalid') as HTMLInputElement | HTMLTextAreaElement;
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
      }
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

  const handleCreateTag = async () => {
    if (!tagSearch.trim()) {
      toast.error('Vui lòng nhập tên tag');
      return;
    }

    // Check if tag already exists
    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase().trim() === tagSearch.toLowerCase().trim()
    );
    if (existingTag) {
      toast.error('Tag này đã tồn tại');
      // Select the existing tag instead
      if (!formData.tags.includes(String(existingTag.id))) {
        toggleTag(String(existingTag.id));
      }
      setTagSearch('');
      return;
    }

    try {
      setCreatingTag(true);
      const newTag = await coursesApi.createTag(tagSearch.trim());
      
      // Add new tag to local tags list immediately
      setTags((prev) => [...prev, newTag]);
      
      // Track this as a newly created tag (only when editing)
      if (course) {
        setNewlyCreatedTagIds((prev) => new Set([...prev, String(newTag.id)]));
      }
      
      // Add new tag to selected tags
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, String(newTag.id)],
      }));
      
      // Notify parent to reload tags (async, won't affect current state)
      if (onTagCreated) {
        // Use setTimeout to avoid blocking UI
        setTimeout(() => {
          onTagCreated();
        }, 100);
      }
      
      toast.success('Tạo tag thành công!');
      setTagSearch('');
    } catch (error: any) {
      console.error('Error creating tag:', error);
      // Error toast is already shown by API client interceptor
    } finally {
      setCreatingTag(false);
    }
  };

  const handleReset = () => {
    if (!initialFormData) return;
    
    // Reset form data to initial values
    setFormData({ ...initialFormData });
    
    // Reset file uploads
    setThumbnailFile(null);
    setPreviewFile(null);
    
    // Reset previews to original course values
    if (course?.thumbnailUrl) {
      setThumbnailPreview(course.thumbnailUrl);
    } else {
      setThumbnailPreview(null);
    }
    
    if (course?.videoPreviewUrl) {
      // Revoke blob URL if exists
      if (previewVideoPreview && previewVideoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previewVideoPreview);
      }
      setPreviewVideoPreview(course.videoPreviewUrl);
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

  // Check if form has any changes (works for both create and edit)
  const hasChanges = (): boolean => {
    // For create mode: check if any field has data
    if (!course) {
      return (
        formData.title.trim() !== '' ||
        formData.description.trim() !== '' ||
        formData.shortDescription.trim() !== '' ||
        formData.categoryId !== '' ||
        (formData.price !== '0' && formData.price !== '') ||
        formData.discountPrice !== '' ||
        !formData.isFree ||
        formData.requirements.trim() !== '' ||
        formData.whatYouLearn.trim() !== '' ||
        formData.courseObjectives.trim() !== '' ||
        formData.targetAudience.trim() !== '' ||
        formData.tags.length > 0 ||
        thumbnailFile !== null ||
        previewFile !== null ||
        thumbnailPreview !== null ||
        previewVideoPreview !== null
      );
    }
    
    // For edit mode: check if any field has changed from initial
    if (!initialFormData) return false;
    return (
      isFieldChanged('title') ||
      isFieldChanged('description') ||
      isFieldChanged('shortDescription') ||
      isFieldChanged('categoryId') ||
      isFieldChanged('level') ||
      isFieldChanged('price') ||
      isFieldChanged('discountPrice') ||
      isFieldChanged('isFree') ||
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
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6"
      noValidate
    >
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
          <FormInput
            id="title"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              // Clear custom validation when user types
              const input = e.target as HTMLInputElement;
              input.setCustomValidity('');
            }}
            placeholder="Nhập tiêu đề khóa học"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('title') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            required
            minLength={5}
            maxLength={200}
            customValidationMessage="Vui lòng nhập tiêu đề khóa học"
            onInvalid={(e) => {
              const input = e.currentTarget;
              const value = input.value.trim();
              if (value.length > 0) {
                if (value.length < 5) {
                  input.setCustomValidity('Tiêu đề khóa học phải có ít nhất 5 ký tự');
                } else if (value.length > 200) {
                  input.setCustomValidity('Tiêu đề khóa học không được vượt quá 200 ký tự');
                } else {
                  input.setCustomValidity('Vui lòng nhập tiêu đề khóa học');
                }
              } else {
                input.setCustomValidity('Vui lòng nhập tiêu đề khóa học');
              }
            }}
          />
          {formData.title.trim().length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.title.trim().length} / 200 ký tự
              {formData.title.trim().length < 5 && (
                <span className="text-red-500 ml-2">(Tối thiểu 5 ký tự)</span>
              )}
            </p>
          )}
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
            onChange={(e) => {
              setFormData({ ...formData, shortDescription: e.target.value });
              // Clear custom validation when user types
              const textarea = e.target as HTMLTextAreaElement;
              textarea.setCustomValidity('');
            }}
            placeholder="Mô tả ngắn gọn về khóa học (tối đa 500 ký tự)"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('shortDescription') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={3}
            maxLength={500}
            onInvalid={(e) => {
              const textarea = e.currentTarget;
              if (textarea.value.trim().length > 500) {
                textarea.setCustomValidity('Mô tả ngắn không được vượt quá 500 ký tự');
              }
            }}
          />
          <p className="text-xs text-gray-400">
            {formData.shortDescription.length}/500
            {formData.shortDescription.length > 500 && (
              <span className="text-red-500 ml-2">(Vượt quá giới hạn)</span>
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-white flex items-center gap-2">
            Mô tả chi tiết
            {isFieldChanged('description') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              // Clear custom validation when user types
              const textarea = e.target as HTMLTextAreaElement;
              textarea.setCustomValidity('');
            }}
            placeholder="Mô tả chi tiết về khóa học"
            className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
              isFieldChanged('description') ? 'border-green-500 ring-1 ring-green-500/50' : ''
            }`}
            rows={6}
            maxLength={10000}
            onInvalid={(e) => {
              const textarea = e.currentTarget;
              if (textarea.value.trim().length > 10000) {
                textarea.setCustomValidity('Mô tả chi tiết không được vượt quá 10000 ký tự');
              }
            }}
          />
          {formData.description.trim().length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.description.trim().length} / 10000 ký tự
            </p>
          )}
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

        {/* Checkbox Miễn phí - Chiếm hết hàng với ghi chú chi tiết */}
        <div className="flex items-start gap-3 p-4 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg w-full">
          <Checkbox
            id="isFree"
            checked={formData.isFree}
            onCheckedChange={(checked) => {
              const isFree = checked === true;
              setFormData((prev) => ({
                ...prev,
                isFree,
                price: isFree ? formatPriceInput(0) : prev.price,
                discountPrice: isFree ? '' : prev.discountPrice,
              }));
            }}
            className="mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <div className="flex-1">
            <Label
              htmlFor="isFree"
              className="text-base font-semibold text-white cursor-pointer block mb-2"
            >
              Khóa học miễn phí
            </Label>
            {formData.isFree ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-300">
                  ✓ Khóa học này sẽ được cung cấp <span className="text-green-400 font-medium">miễn phí</span> cho tất cả học viên
                </p>
                <p className="text-xs text-gray-400">
                  Học viên có thể đăng ký và học ngay mà không cần thanh toán. Các trường "Giá (VNĐ)" và "Giá khuyến mãi (VNĐ)" sẽ tự động bị vô hiệu hóa.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-gray-300">
                  Khóa học có phí - Bạn cần nhập giá cho khóa học
                </p>
                <p className="text-xs text-gray-400">
                  Bỏ chọn để thiết lập giá cho khóa học. Bạn có thể nhập "Giá (VNĐ)" và tùy chọn "Giá khuyến mãi (VNĐ)" để tạo chương trình giảm giá.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Giá và Giá khuyến mãi - Cùng một hàng */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white flex items-center gap-2">
                Giá (VNĐ)
                {isFieldChanged('price') && (
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                )}
              </Label>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Allow empty input
                  if (inputValue === '' || inputValue.trim() === '') {
                    setFormData({ ...formData, price: '' });
                    return;
                  }
                  const parsedValue = parsePriceInput(inputValue);
                  if (parsedValue !== undefined) {
                    setFormData({ ...formData, price: formatPriceInput(parsedValue) });
                  } else {
                    // If parsing fails, keep the formatted value
                    setFormData({ ...formData, price: inputValue });
                  }
                  // Clear custom validation when user types
                  const input = e.target as HTMLInputElement;
                  input.setCustomValidity('');
                }}
                placeholder="0"
                disabled={formData.isFree}
                className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
                  isFieldChanged('price') ? 'border-green-500 ring-1 ring-green-500/50' : ''
                } ${formData.isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
                onInvalid={(e) => {
                  const input = e.currentTarget;
                  const price = parsePriceInput(input.value);
                  if (price === undefined || price < 0) {
                    input.setCustomValidity('Giá phải là số không âm');
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice" className="text-white flex items-center gap-2">
                Giá khuyến mãi (VNĐ)
                {isFieldChanged('discountPrice') && (
                  <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                )}
              </Label>
              <Input
                id="discountPrice"
                type="text"
                value={formData.discountPrice}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Allow empty input
                  if (inputValue === '' || inputValue.trim() === '') {
                    setFormData({ ...formData, discountPrice: '' });
                    return;
                  }
                  const parsedValue = parsePriceInput(inputValue);
                  if (parsedValue !== undefined) {
                    setFormData({ ...formData, discountPrice: formatPriceInput(parsedValue) });
                  } else {
                    // If parsing fails, keep the formatted value
                    setFormData({ ...formData, discountPrice: inputValue });
                  }
                  // Clear custom validation when user types
                  const input = e.target as HTMLInputElement;
                  input.setCustomValidity('');
                }}
                placeholder="0"
                disabled={formData.isFree}
                className={`bg-[#1F1F1F] border-[#2D2D2D] text-white ${
                  isFieldChanged('discountPrice') ? 'border-green-500 ring-1 ring-green-500/50' : ''
                } ${formData.isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
                onInvalid={(e) => {
                  const input = e.currentTarget;
                  const discountPrice = parsePriceInput(input.value);
                  const price = parsePriceInput(formData.price);
                  if (discountPrice === undefined || discountPrice < 0) {
                    input.setCustomValidity('Giá khuyến mãi phải là số không âm');
                  } else if (price !== undefined && discountPrice > price) {
                    input.setCustomValidity('Giá khuyến mãi không được lớn hơn giá gốc');
                  }
                }}
              />
            </div>
          </div>

          {/* Chú thích về cách tính giá bán */}
          {!formData.isFree && (
            <div className="p-3 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg">
              <p className="text-xs font-medium text-gray-300 mb-2">📌 Cách tính giá bán:</p>
              <div className="space-y-1.5 text-xs text-gray-400">
                {formData.discountPrice.trim() ? (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>
                        <span className="text-white font-medium">Giá bán hiện tại:</span> {formatPriceInput(parsePriceInput(formData.discountPrice) || 0)} VNĐ
                        <span className="text-gray-500 ml-2">(Giá khuyến mãi)</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 mt-0.5">•</span>
                      <span>
                        Giá gốc: {formatPriceInput(parsePriceInput(formData.price) || 0)} VNĐ
                        <span className="text-gray-500 ml-2">(sẽ hiển thị gạch ngang trên trang chi tiết)</span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-[#2D2D2D]">
                      <span className="text-blue-400 mt-0.5">ℹ️</span>
                      <span>
                        Khi có cả <span className="text-white">Giá (VNĐ)</span> và <span className="text-white">Giá khuyến mãi (VNĐ)</span>, 
                        giá bán sẽ là <span className="text-green-400 font-medium">Giá khuyến mãi</span>. 
                        Học viên sẽ thấy giá gốc bị gạch ngang và giá khuyến mãi nổi bật.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 mt-0.5">•</span>
                      <span>
                        <span className="text-white font-medium">Giá bán:</span> {formatPriceInput(parsePriceInput(formData.price) || 0)} VNĐ
                      </span>
                    </div>
                    <div className="flex items-start gap-2 pt-1 border-t border-[#2D2D2D]">
                      <span className="text-blue-400 mt-0.5">ℹ️</span>
                      <span>
                        Khi chỉ nhập <span className="text-white">Giá (VNĐ)</span> mà không nhập <span className="text-white">Giá khuyến mãi (VNĐ)</span>, 
                        giá bán sẽ là <span className="text-green-400 font-medium">Giá (VNĐ)</span> bạn đã nhập.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
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
        
        {/* Selected Tags */}
        {formData.tags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Tags đã chọn ({formData.tags.length})</Label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-blue-500/30 bg-blue-500/10 rounded-lg">
              {(() => {
                // Sort tags: original tags first, then newly added/created tags
                const sortedTagIds = [...formData.tags].sort((tagId1, tagId2) => {
                  const isNew1 = newlyCreatedTagIds.has(tagId1) || (course && !originalTagIds.has(tagId1));
                  const isNew2 = newlyCreatedTagIds.has(tagId2) || (course && !originalTagIds.has(tagId2));
                  
                  // Original tags come first (return -1), new tags come last (return 1)
                  if (!isNew1 && isNew2) return -1;
                  if (isNew1 && !isNew2) return 1;
                  return 0; // Keep original order within same group
                });
                
                return sortedTagIds.map((tagId) => {
                  const tag = tags.find((t) => String(t.id) === tagId);
                  const isNewlyCreated = newlyCreatedTagIds.has(tagId);
                  // Tag is "newly added" if it's not in original tags (when editing)
                  const isNewlyAdded = course && !originalTagIds.has(tagId);
                  // Use green for newly created or newly added tags, blue for original tags
                  const isGreen = isNewlyCreated || isNewlyAdded;
                  
                  if (!tag) {
                    // Show placeholder if tag not found (might be loading)
                    return (
                      <div
                        key={tagId}
                        className="px-3 py-1 rounded-full text-sm bg-gray-600 border border-gray-600 text-white flex items-center gap-2"
                      >
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    );
                  }
                  
                  const buttonClasses = isGreen
                    ? "px-3 py-1.5 rounded-full text-sm bg-green-600 border border-green-600 text-white hover:bg-green-700 hover:border-green-500 transition-colors flex items-center gap-2 font-medium"
                    : "px-3 py-1.5 rounded-full text-sm bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 hover:border-blue-500 transition-colors flex items-center gap-2 font-medium";
                  
                  const titleText = isNewlyCreated 
                    ? `Click để bỏ chọn tag "${tag.name}" (Tag mới tạo)`
                    : isNewlyAdded
                    ? `Click để bỏ chọn tag "${tag.name}" (Tag mới thêm)`
                    : `Click để bỏ chọn tag "${tag.name}"`;
                  
                  return (
                    <button
                      key={tagId}
                      type="button"
                      onClick={() => toggleTag(tagId)}
                      className={buttonClasses}
                      title={titleText}
                    >
                      {tag.name}
                      <X className="h-3.5 w-3.5" />
                    </button>
                  );
                });
              })()}
            </div>
            {formData.tags.length === 0 && (
              <p className="text-xs text-gray-500 italic">Chưa có tag nào được chọn</p>
            )}
          </div>
        )}

        {/* Search and Create Tag */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-400">Tìm kiếm hoặc tạo tag mới</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Tìm kiếm tags..."
                className="pl-8 bg-[#1F1F1F] border-[#2D2D2D] text-white"
              />
            </div>
            {tagSearch.trim() && 
             !tags.some((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase())) && (
              <Button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creatingTag ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  `Tạo "${tagSearch.trim()}"`
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Available Tags */}
        <div className="space-y-2">
          {(() => {
            const totalTags = tags.length;
            const selectedTagsCount = formData.tags.length;
            const availableTags = tags.filter((tag) => !formData.tags.includes(String(tag.id)));
            const filteredTags = availableTags.filter((tag) => {
              return tagSearch.trim() 
                ? tag.name.toLowerCase().includes(tagSearch.toLowerCase())
                : true;
            });
            const hiddenTagsCount = availableTags.length - filteredTags.length;

            return (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">
                    Tags có sẵn
                    {tagSearch ? (
                      <span className="text-xs text-gray-500 ml-2">
                        (Đang tìm: "{tagSearch}")
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 ml-2">
                        ({filteredTags.length} / {availableTags.length} tags)
                      </span>
                    )}
                  </Label>
                  {hiddenTagsCount > 0 && (
                    <span className="text-xs text-blue-400">
                      +{hiddenTagsCount} tags khác {tagSearch ? 'không khớp' : 'đã được chọn'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border border-[#2D2D2D] rounded-lg">
                  {Array.isArray(tags) && tags.length > 0 ? (
                    filteredTags.length > 0 ? (
                      filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(String(tag.id))}
                          className="px-3 py-1 rounded-full text-sm border border-[#2D2D2D] bg-[#1F1F1F] text-gray-300 hover:bg-[#2D2D2D] hover:border-blue-500 transition-colors"
                        >
                          {tag.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm w-full text-center py-4">
                        {tagSearch ? 'Không tìm thấy tag nào phù hợp' : 'Tất cả tags đã được chọn'}
                      </p>
                    )
                  ) : (
                    <p className="text-gray-400 text-sm w-full text-center py-4">Chưa có tags nào</p>
                  )}
                </div>
                {totalTags > 0 && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Tổng: {totalTags} tags • Đã chọn: {selectedTagsCount} • Còn lại: {availableTags.length}
                    </span>
                    {tagSearch && (
                      <button
                        type="button"
                        onClick={() => setTagSearch('')}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </div>
                )}
              </>
            );
          })()}
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
            maxLength={5000}
          />
          {formData.requirements.trim().length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.requirements.trim().length} / 5000 ký tự
            </p>
          )}
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
            maxLength={5000}
          />
          {formData.whatYouLearn.trim().length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.whatYouLearn.trim().length} / 5000 ký tự
            </p>
          )}
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
            maxLength={5000}
          />
          {formData.courseObjectives.trim().length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.courseObjectives.trim().length} / 5000 ký tự
            </p>
          )}
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
            maxLength={5000}
          />
          {formData.targetAudience.trim().length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.targetAudience.trim().length} / 5000 ký tự
            </p>
          )}
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
              {course 
                ? 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn hủy và rời khỏi trang này không?'
                : 'Bạn đã nhập dữ liệu. Bạn có chắc chắn muốn hủy và rời khỏi trang này không? Tất cả dữ liệu đã nhập sẽ bị mất.'}
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

