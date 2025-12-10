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
import { Loader2, X, Image as ImageIcon, Video, Search, Eye, AlertCircle, Circle, RotateCcw, BookOpen, FileText, Tag as TagIcon, Globe, HelpCircle, Hash, Info, Target, Users, Upload, CheckCircle2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { Course, Category, Tag } from '../../lib/api/types';
import { coursesApi } from '../../lib/api/courses'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

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
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const [videoPreviewRemoved, setVideoPreviewRemoved] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [initialFormData, setInitialFormData] = useState<CourseFormData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<{ submitData: any; thumbnailFile?: File; previewFile?: File } | null>(null);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [availableThumbnails, setAvailableThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState<string | null>(null);
  const [thumbnailDialogTab, setThumbnailDialogTab] = useState<'library' | 'upload'>('upload');
  const [showVideoPreviewDialog, setShowVideoPreviewDialog] = useState(false);
  const [availableVideoPreviews, setAvailableVideoPreviews] = useState<string[]>([]);
  const [loadingVideoPreviews, setLoadingVideoPreviews] = useState(false);
  const [selectedVideoPreviewUrl, setSelectedVideoPreviewUrl] = useState<string | null>(null);
  const [videoPreviewDialogTab, setVideoPreviewDialogTab] = useState<'library' | 'upload'>('upload');
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
      
      // Support both field names for backward compatibility
      const thumbnailUrl = (course as any).thumbnailUrl || (course as any).thumbnail;
      const videoPreviewUrl = (course as any).videoPreviewUrl || (course as any).previewVideoUrl;
      
      if (thumbnailUrl) {
        setThumbnailPreview(thumbnailUrl);
      }
      if (videoPreviewUrl) {
        setPreviewVideoPreview(videoPreviewUrl);
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

  // Get image dimensions (for display only, no validation)
  const getImageDimensions = (file: File): Promise<{ width?: number; height?: number; aspectRatio?: number; error?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const width = img.width;
        const height = img.height;
        const aspectRatio = width / height;
        
        resolve({
          width,
          height,
          aspectRatio
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          error: 'Không thể đọc thông tin ảnh. Vui lòng chọn file ảnh hợp lệ.'
        });
      };
      
      img.src = url;
    });
  };

  const processThumbnailFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Get image dimensions for display (no validation - backend will auto-crop to 16:9)
    const dimensions = await getImageDimensions(file);
    if (dimensions.error) {
      toast.error(dimensions.error);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
      setThumbnailFile(file);
      setThumbnailRemoved(false); // Reset removed flag when new image is selected
      
      const aspectRatio = dimensions.aspectRatio || 0;
      const targetRatio = 16 / 9;
      const isRecommended = Math.abs(aspectRatio - targetRatio) <= 0.1; // Within 10% of 16:9
      
      if (isRecommended) {
        toast.success(`Đã tải ảnh đại diện thành công (${dimensions.width}×${dimensions.height})`);
      } else {
        toast.success(
          `Đã tải ảnh đại diện thành công (${dimensions.width}×${dimensions.height}). Hệ thống sẽ tự động cắt về tỷ lệ 16:9.`,
          { duration: 4000 }
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processThumbnailFile(file);
  };

  const handleThumbnailDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processThumbnailFile(file);
  };

  const handleThumbnailDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(true);
  };

  const handleThumbnailDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Load available thumbnails from instructor's courses
  const loadAvailableThumbnails = async () => {
    try {
      setLoadingThumbnails(true);
      const response = await instructorCoursesApi.getInstructorCourses({ limit: 100 });
      const courses = response.data || [];
      const thumbnails = courses
        .map((c: Course) => c.thumbnailUrl || (c as any).thumbnail)
        .filter((url: string | undefined): url is string => !!url && url.trim() !== '');
      // Remove duplicates
      setAvailableThumbnails([...new Set(thumbnails)]);
    } catch (error) {
      console.error('Error loading thumbnails:', error);
      setAvailableThumbnails([]);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  // Load available video previews from instructor's courses
  const loadAvailableVideoPreviews = async () => {
    try {
      setLoadingVideoPreviews(true);
      const response = await instructorCoursesApi.getInstructorCourses({ limit: 100 });
      const courses = response.data || [];
      const videoPreviews = courses
        .map((c: Course) => c.videoPreviewUrl || (c as any).previewVideoUrl)
        .filter((url: string | undefined): url is string => !!url && url.trim() !== '');
      // Remove duplicates
      setAvailableVideoPreviews([...new Set(videoPreviews)]);
    } catch (error) {
      console.error('Error loading video previews:', error);
      setAvailableVideoPreviews([]);
    } finally {
      setLoadingVideoPreviews(false);
    }
  };

  // Open thumbnail dialog
  const handleOpenThumbnailDialog = () => {
    setShowThumbnailDialog(true);
    setSelectedThumbnailUrl(null);
    loadAvailableThumbnails();
  };

  // Handle selecting thumbnail from library
  const handleSelectThumbnailFromLibrary = (url: string) => {
    setSelectedThumbnailUrl(url);
  };

  // Handle confirming thumbnail selection
  const handleConfirmThumbnail = () => {
    if (selectedThumbnailUrl) {
      setThumbnailPreview(selectedThumbnailUrl);
      setThumbnailFile(null); // Clear file since we're using URL
      setThumbnailRemoved(false); // Reset removed flag when selecting from library
      setShowThumbnailDialog(false);
      toast.success('Đã chọn ảnh đại diện');
    }
  };

  // Handle upload in dialog
  const handleDialogThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processThumbnailFile(file);
    setShowThumbnailDialog(false);
  };

  // Open video preview dialog
  const handleOpenVideoPreviewDialog = () => {
    setShowVideoPreviewDialog(true);
    setSelectedVideoPreviewUrl(null);
    loadAvailableVideoPreviews();
  };

  // Handle selecting video preview from library
  const handleSelectVideoPreviewFromLibrary = (url: string) => {
    setSelectedVideoPreviewUrl(url);
  };

  // Handle confirming video preview selection
  const handleConfirmVideoPreview = () => {
    if (selectedVideoPreviewUrl) {
      setPreviewVideoPreview(selectedVideoPreviewUrl);
      setPreviewFile(null); // Clear file since we're using URL
      setVideoPreviewRemoved(false); // Reset removed flag when selecting from library
      setShowVideoPreviewDialog(false);
      toast.success('Đã chọn video giới thiệu');
    }
  };

  // Handle upload in video preview dialog
  const handleDialogVideoPreviewSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processPreviewFile(file);
    setShowVideoPreviewDialog(false);
  };

  const handlePreviewSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processPreviewFile(file);
  };

  const processPreviewFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Vui lòng chọn file video');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 100MB');
      return;
    }

    setPreviewFile(file);
    setVideoPreviewRemoved(false); // Reset removed flag when new video is selected
    const url = URL.createObjectURL(file);
    setPreviewVideoPreview(url);
    toast.success(`Đã tải video giới thiệu thành công (${formatFileSize(file.size)})`);
  };

  const handlePreviewDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPreview(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processPreviewFile(file);
  };

  const handlePreviewDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPreview(true);
  };

  const handlePreviewDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPreview(false);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailRemoved(true); // Mark as removed for backend deletion
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
    setVideoPreviewRemoved(true); // Mark as removed for backend deletion
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

    // Handle thumbnail deletion: if editing and thumbnail was removed, send null to delete
    if (course && thumbnailRemoved && !thumbnailFile && !thumbnailPreview) {
      submitData.thumbnailUrl = null;
    }

    // Handle video preview deletion: if editing and video preview was removed, send null to delete
    if (course && videoPreviewRemoved && !previewFile && !previewVideoPreview) {
      submitData.videoPreviewUrl = null;
    }

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

    // Prepare submit data
    const submitData: any = prepareSubmitData();
    
    // Store pending submit data and show confirmation dialog
    setPendingSubmitData({
      submitData,
      thumbnailFile: thumbnailFile || undefined,
      previewFile: previewFile || undefined
    });
    setShowSubmitDialog(true);
  };

  // Actually submit the form after confirmation
  const handleConfirmSubmit = async () => {
    if (!pendingSubmitData) return;

    try {
      await onSubmit(
        pendingSubmitData.submitData,
        pendingSubmitData.thumbnailFile,
        pendingSubmitData.previewFile
      );
      
      // Reset initial form data after successful submit to clear change indicators
      setInitialFormData({ ...formData });
      setThumbnailFile(null);
      setPreviewFile(null);
      setShowSubmitDialog(false);
      setPendingSubmitData(null);
    } catch (error) {
      // Error is handled by parent component
      setShowSubmitDialog(false);
      setPendingSubmitData(null);
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
    setThumbnailRemoved(false); // Reset removed flag
    setVideoPreviewRemoved(false); // Reset removed flag
    
    // Reset previews to original course values
    // Support both field names for backward compatibility
    const thumbnailUrl = (course as any)?.thumbnailUrl || (course as any)?.thumbnail;
    const videoPreviewUrl = (course as any)?.videoPreviewUrl || (course as any)?.previewVideoUrl;
    
    if (thumbnailUrl) {
      setThumbnailPreview(thumbnailUrl);
    } else {
      setThumbnailPreview(null);
    }
    
    if (videoPreviewUrl) {
      // Revoke blob URL if exists
      if (previewVideoPreview && previewVideoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previewVideoPreview);
      }
      setPreviewVideoPreview(videoPreviewUrl);
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
    
    // Check thumbnail changes
    const initialThumbnailUrl = (course as any)?.thumbnailUrl || (course as any)?.thumbnail || null;
    const currentThumbnailPreview = thumbnailPreview;
    const thumbnailChanged = 
      thumbnailRemoved || // Thumbnail was removed
      thumbnailFile !== null || // New thumbnail file uploaded
      (initialThumbnailUrl && !currentThumbnailPreview) || // Had thumbnail, now removed
      (currentThumbnailPreview && currentThumbnailPreview !== initialThumbnailUrl); // Thumbnail changed
    
    // Check video preview changes
    const initialVideoPreviewUrl = (course as any)?.videoPreviewUrl || (course as any)?.previewVideoUrl || null;
    const currentVideoPreview = previewVideoPreview;
    const videoPreviewChanged = 
      videoPreviewRemoved || // Video preview was removed
      previewFile !== null || // New video file uploaded
      (initialVideoPreviewUrl && !currentVideoPreview) || // Had video, now removed
      (currentVideoPreview && currentVideoPreview !== initialVideoPreviewUrl); // Video changed
    
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
      thumbnailChanged ||
      videoPreviewChanged
    );
  };

  return (
    <div className="relative">
      <form 
        onSubmit={handleSubmit} 
        className="space-y-6 pb-24 sm:pb-28"
        noValidate
      >
      {/* Basic Information */}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <BookOpen className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Thông tin cơ bản</h3>
            <p className="text-sm text-gray-400 mt-0.5">Thông tin chính về khóa học của bạn</p>
          </div>
        </div>
        
        {/* Title Section */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span>Tiêu đề khóa học</span>
            <span className="text-red-500">*</span>
            {isFieldChanged('title') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Tiêu đề nên ngắn gọn, hấp dẫn và mô tả rõ nội dung khóa học. Tối thiểu 5 ký tự, tối đa 200 ký tự.
              </div>
            </div>
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formData.title.trim().length} / 200 ký tự
                {formData.title.trim().length < 5 && (
                  <span className="text-red-500 ml-2">(Tối thiểu 5 ký tự)</span>
                )}
              </p>
              {formData.title.trim().length >= 5 && formData.title.trim().length <= 200 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-400" />
                  Hợp lệ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        {/* Short Description Section */}
        <div className="space-y-2">
          <Label htmlFor="shortDescription" className="text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>Mô tả ngắn</span>
            {isFieldChanged('shortDescription') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Mô tả ngắn sẽ hiển thị trên trang danh sách khóa học. Viết ngắn gọn, hấp dẫn trong 1-2 câu (tối đa 500 ký tự).
              </div>
            </div>
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
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {formData.shortDescription.length}/500 ký tự
              {formData.shortDescription.length > 500 && (
                <span className="text-red-500 ml-2">(Vượt quá giới hạn)</span>
              )}
            </p>
            {formData.shortDescription.length > 0 && formData.shortDescription.length <= 500 && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Circle className="h-2 w-2 fill-green-400" />
                Hợp lệ
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        {/* Detailed Description Section */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>Mô tả chi tiết</span>
            {isFieldChanged('description') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Mô tả chi tiết sẽ hiển thị trên trang chi tiết khóa học. Bao gồm nội dung, lợi ích, và thông tin quan trọng (tối đa 10,000 ký tự).
              </div>
            </div>
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formData.description.trim().length} / 10000 ký tự
              </p>
              {formData.description.trim().length <= 10000 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-400" />
                  Hợp lệ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        {/* Category and Level Section */}
        <div className="p-4 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <TagIcon className="h-4 w-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-gray-300">Phân loại khóa học</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label htmlFor="categoryId" className="text-white flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <span>Danh mục</span>
              <span className="text-red-500">*</span>
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
              <Globe className="h-4 w-4 text-gray-400" />
              <span>Cấp độ</span>
              {isFieldChanged('level') && (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              )}
              <div className="group relative ml-auto">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 top-6 w-56 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                  Cấp độ phù hợp với học viên: Cơ bản, Trung bình, hoặc Nâng cao.
                </div>
              </div>
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
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        {/* Price Section */}
        <div className="p-4 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Circle className="h-4 w-4 text-green-400 fill-green-400" />
            <h4 className="text-sm font-semibold text-gray-300">Thiết lập giá</h4>
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
        <div className="space-y-3 py-4">
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
      </div>

      {/* Large Divider - Separating Basic Info (Category, Level, Price) from Media */}
      <div className="my-8 border-t-2 border-[#2D2D2D]"></div>

      {/* Media Upload */}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <ImageIcon className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Hình ảnh và Video</h3>
            <p className="text-sm text-gray-400 mt-0.5">Tải lên ảnh đại diện và video giới thiệu cho khóa học</p>
          </div>
        </div>

        {/* Thumbnail Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-gray-400" />
              <span>Ảnh đại diện</span>
              {thumbnailFile !== null && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {course && thumbnailRemoved && !thumbnailFile && !thumbnailPreview && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Đã xóa ảnh đại diện</span>
                </div>
              )}
            </Label>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                ảnh đại diện sẽ hiển thị trên trang danh sách và chi tiết khóa học. Kích thước tối đa 5MB, định dạng: JPG, PNG, GIF. <span className="text-blue-400 font-medium">Khuyến nghị tỷ lệ 16:9</span> - Hệ thống sẽ tự động cắt ảnh về tỷ lệ 16:9 nếu cần.
              </div>
            </div>
          </div>

          {thumbnailPreview ? (
            <div className="space-y-3">
              {/* Preview Image */}
              <div className={`relative w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                thumbnailFile !== null 
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                  : course && thumbnailRemoved
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                  : 'border-[#2D2D2D]'
              }`}>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none group/overlay">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenThumbnailDialog();
                    }}
                    className="bg-white/90 hover:bg-white text-gray-900 border-0 pointer-events-auto"
                    size="sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Thay đổi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="bg-red-600/90 hover:bg-red-700 text-white border-0 pointer-events-auto"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </div>
                {/* Always visible action buttons at bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenThumbnailDialog();
                    }}
                    className="flex-1 bg-white/95 hover:bg-white text-gray-900 border-0 backdrop-blur-sm"
                    size="sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Thay đổi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="bg-red-600/95 hover:bg-red-700 text-white border-0 backdrop-blur-sm"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {/* Status badge */}
                {thumbnailFile !== null && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Mới tải lên</span>
                  </div>
                )}
                {course && thumbnailRemoved && !thumbnailFile && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Đã xóa </span>
                  </div>
                )}
              </div>
              
              {/* File Info */}
              {thumbnailFile && (
                <div className="flex items-center justify-between p-3 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <ImageIcon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{thumbnailFile.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(thumbnailFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Drag & Drop Area */
            <div
              onDrop={handleThumbnailDrop}
              onDragOver={handleThumbnailDragOver}
              onDragLeave={handleThumbnailDragLeave}
              onClick={handleOpenThumbnailDialog}
              className={`relative w-full max-w-md mx-auto aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer group ${
                isDraggingThumbnail
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                  : 'border-[#2D2D2D] bg-[#1F1F1F] hover:border-gray-600 hover:bg-[#2A2A2A]'
              }`}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <div className={`p-4 rounded-full transition-colors ${
                  isDraggingThumbnail ? 'bg-blue-500/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                }`}>
                  <Upload className={`h-8 w-8 transition-colors ${
                    isDraggingThumbnail ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                  }`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white mb-1">
                    {isDraggingThumbnail ? 'Thả ảnh vào đây' : 'Kéo thả ảnh hoặc click để chọn'}
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG, GIF (tối đa 5MB) • <span className="text-blue-400 font-medium">Khuyến nghị: 16:9</span> (tự động cắt)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        {/* Preview Video Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white flex items-center gap-2">
              <Video className="h-4 w-4 text-gray-400" />
              <span>Video giới thiệu</span>
              {previewFile !== null && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              {course && videoPreviewRemoved && !previewFile && !previewVideoPreview && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Đã xóa video</span>
                </div>
              )}
            </Label>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Video giới thiệu sẽ được phát tự động trên trang chi tiết khóa học. Kích thước tối đa 100MB, định dạng: MP4, WebM, MOV.
              </div>
            </div>
          </div>

          {previewVideoPreview ? (
            <div className="space-y-3">
              {/* Preview Video */}
              <div className={`relative w-full max-w-2xl mx-auto aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                previewFile !== null
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                  : course && videoPreviewRemoved
                  ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                  : 'border-[#2D2D2D]'
              }`}>
                <video
                  src={previewVideoPreview}
                  controls
                  className="w-full h-full object-contain bg-black"
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none group/overlay">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenVideoPreviewDialog();
                    }}
                    className="bg-white/90 hover:bg-white text-gray-900 border-0 pointer-events-auto"
                    size="sm"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Thay đổi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreview();
                    }}
                    className="bg-red-600/90 hover:bg-red-700 text-white border-0 pointer-events-auto"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </div>
                {/* Status badge */}
                {previewFile !== null && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Mới tải lên</span>
                  </div>
                )}
                {course && videoPreviewRemoved && !previewFile && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-white" />
                    <span className="text-xs font-medium text-white">Đã xóa</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              {previewFile && (
                <div className="flex items-center justify-between p-3 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Video className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{previewFile.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(previewFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePreview}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Xóa video"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              )}
              {/* Always visible action buttons below preview */}
              <div className="flex justify-center gap-3 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenVideoPreviewDialog}
                  className="flex-1 bg-white/95 hover:bg-white text-gray-900 border-0 backdrop-blur-sm"
                  size="sm"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Thay đổi
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={removePreview}
                  className="bg-red-600/95 hover:bg-red-700 text-white border-0 backdrop-blur-sm"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              </div>
            </div>
          ) : (
            /* Drag & Drop Area */
            <div
              onDrop={handlePreviewDrop}
              onDragOver={handlePreviewDragOver}
              onDragLeave={handlePreviewDragLeave}
              onClick={handleOpenVideoPreviewDialog}
              className={`relative w-full max-w-2xl mx-auto aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer group ${
                isDraggingPreview
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                  : 'border-[#2D2D2D] bg-[#1F1F1F] hover:border-gray-600 hover:bg-[#2A2A2A]'
              }`}
            >
              <input
                ref={previewInputRef}
                type="file"
                accept="video/*"
                onChange={handlePreviewSelect}
                className="hidden"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <div className={`p-4 rounded-full transition-colors ${
                  isDraggingPreview ? 'bg-blue-500/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                }`}>
                  <Video className={`h-8 w-8 transition-colors ${
                    isDraggingPreview ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                  }`} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white mb-1">
                    {isDraggingPreview ? 'Thả video vào đây' : 'Kéo thả video hoặc click để chọn'}
                  </p>
                  <p className="text-xs text-gray-400">
                    MP4, WebM, MOV (tối đa 100MB)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Large Divider - Separating Media from Tags */}
      <div className="my-8 border-t-2 border-[#2D2D2D]"></div>

      {/* Tags */}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Hash className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">Tags</h3>
              {isFieldChanged('tags') && (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">Thêm tags để giúp học viên dễ dàng tìm thấy khóa học của bạn</p>
          </div>
        </div>
        
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

      {/* Large Divider - Separating Tags from Additional Information */}
      <div className="my-8 border-t-2 border-[#2D2D2D]"></div>

      {/* Additional Information */}
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Info className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Thông tin bổ sung</h3>
            <p className="text-sm text-gray-400 mt-0.5">Cung cấp thông tin chi tiết về khóa học để thu hút học viên</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        <div className="space-y-2">
          <Label htmlFor="requirements" className="text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <span>Yêu cầu</span>
            {isFieldChanged('requirements') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Liệt kê các yêu cầu cần thiết để tham gia khóa học (ví dụ: kiến thức cơ bản, phần mềm cần thiết, v.v.)
              </div>
            </div>
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formData.requirements.trim().length} / 5000 ký tự
              </p>
              {formData.requirements.trim().length <= 5000 && formData.requirements.trim().length > 0 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-400" />
                  Hợp lệ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        <div className="space-y-2">
          <Label htmlFor="whatYouLearn" className="text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span>Bạn sẽ học được gì</span>
            {isFieldChanged('whatYouLearn') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Mô tả những kiến thức và kỹ năng cụ thể mà học viên sẽ đạt được sau khi hoàn thành khóa học.
              </div>
            </div>
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formData.whatYouLearn.trim().length} / 5000 ký tự
              </p>
              {formData.whatYouLearn.trim().length <= 5000 && formData.whatYouLearn.trim().length > 0 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-400" />
                  Hợp lệ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        <div className="space-y-2">
          <Label htmlFor="courseObjectives" className="text-white flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span>Mục tiêu khóa học</span>
            {isFieldChanged('courseObjectives') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Nêu rõ các mục tiêu học tập mà khóa học hướng tới đạt được.
              </div>
            </div>
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formData.courseObjectives.trim().length} / 5000 ký tự
              </p>
              {formData.courseObjectives.trim().length <= 5000 && formData.courseObjectives.trim().length > 0 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-400" />
                  Hợp lệ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D2D2D] my-6"></div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience" className="text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>Đối tượng mục tiêu</span>
            {isFieldChanged('targetAudience') && (
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            )}
            <div className="group relative ml-auto">
              <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                Mô tả đối tượng học viên phù hợp với khóa học (ví dụ: người mới bắt đầu, sinh viên, chuyên gia, v.v.)
              </div>
            </div>
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                {formData.targetAudience.trim().length} / 5000 ký tự
              </p>
              {formData.targetAudience.trim().length <= 5000 && formData.targetAudience.trim().length > 0 && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-400" />
                  Hợp lệ
                </span>
              )}
            </div>
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

      {/* Sticky Bottom Action Bar - Sticks to bottom of viewport when scrolling, sticks to form bottom when at end */}
      <div className="sticky bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t-2 border-[#2D2D2D] shadow-2xl mt-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left side - Change Indicator */}
            <div className="flex items-center justify-center sm:justify-start">
              {course && hasChanges() && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-500 font-medium whitespace-nowrap">Có thay đổi chưa lưu</span>
                </div>
              )}
            </div>

            {/* Right side - Action Buttons */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              {course && initialFormData && (
                <DarkOutlineButton
                  type="button"
                  onClick={handleReset}
                  disabled={loading || previewLoading || !hasChanges()}
                  className="flex items-center gap-2 flex-shrink-0"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Đặt lại</span>
                </DarkOutlineButton>
              )}
              {onCancel && (
                <DarkOutlineButton
                  type="button"
                  onClick={handleCancel}
                  disabled={loading || previewLoading}
                  size="sm"
                  className="flex-shrink-0"
                >
                  Hủy
                </DarkOutlineButton>
              )}
              <DarkOutlineButton
                type="button"
                onClick={handlePreview}
                disabled={loading || previewLoading}
                className="flex items-center gap-2 flex-shrink-0"
                size="sm"
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Đang tải...</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Xem trước</span>
                  </>
                )}
              </DarkOutlineButton>
              <Button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }}
                disabled={loading || previewLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Đang lưu...</span>
                  </>
                ) : course ? (
                  <>
                    <span className="hidden sm:inline">Cập nhật khóa học</span>
                    <span className="sm:hidden">Cập nhật</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Tạo khóa học</span>
                    <span className="sm:hidden">Tạo</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </form>

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

      {/* Thumbnail Selection Dialog */}
      <Dialog open={showThumbnailDialog} onOpenChange={setShowThumbnailDialog}>
        <DialogContent className="bg-[#1F1F1F] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Chọn ảnh đại diện
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Chọn ảnh từ thư viện hoặc tải lên ảnh mới từ máy tính
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={thumbnailDialogTab} onValueChange={(v) => setThumbnailDialogTab(v as 'library' | 'upload')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-[#2A2A2A] border border-[#2D2D2D] mb-4">
              <TabsTrigger value="library" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">
                <FolderOpen className="h-4 w-4 mr-2" />
                Thư viện ảnh
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">
                <Upload className="h-4 w-4 mr-2" />
                Tải lên mới
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 overflow-y-auto mt-0">
              {loadingThumbnails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : availableThumbnails.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có ảnh nào trong thư viện</p>
                  <p className="text-sm text-gray-500 mt-2">Tải lên ảnh mới để thêm vào thư viện</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableThumbnails.map((url, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectThumbnailFromLibrary(url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedThumbnailUrl === url
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-[#2D2D2D] hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedThumbnailUrl === url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="flex-1 overflow-y-auto mt-0">
              <div
                onDrop={handleThumbnailDrop}
                onDragOver={handleThumbnailDragOver}
                onDragLeave={handleThumbnailDragLeave}
                onClick={() => thumbnailInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                  isDraggingThumbnail
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                    : 'border-[#2D2D2D] bg-[#1A1A1A] hover:border-gray-600 hover:bg-[#2A2A2A]'
                }`}
              >
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDialogThumbnailSelect}
                  className="hidden"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  <div className={`p-4 rounded-full transition-colors ${
                    isDraggingThumbnail ? 'bg-blue-500/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                  }`}>
                    <Upload className={`h-8 w-8 transition-colors ${
                      isDraggingThumbnail ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white mb-1">
                      {isDraggingThumbnail ? 'Thả ảnh vào đây' : 'Kéo thả ảnh hoặc click để chọn'}
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG, GIF (tối đa 5MB) • <span className="text-blue-400 font-medium">Khuyến nghị: 16:9</span> (tự động cắt)
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <DarkOutlineButton
              type="button"
              onClick={() => {
                setShowThumbnailDialog(false);
                setSelectedThumbnailUrl(null);
              }}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              type="button"
              onClick={handleConfirmThumbnail}
              disabled={!selectedThumbnailUrl && thumbnailDialogTab === 'library'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoPreviewDialog} onOpenChange={setShowVideoPreviewDialog}>
        <DialogContent className="bg-[#1F1F1F] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Video className="h-5 w-5" />
              Chọn video giới thiệu
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Chọn video từ thư viện hoặc tải lên video mới từ máy tính
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={videoPreviewDialogTab} onValueChange={(v) => setVideoPreviewDialogTab(v as 'library' | 'upload')} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-[#2A2A2A] border border-[#2D2D2D] mb-4">
              <TabsTrigger value="library" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">
                <FolderOpen className="h-4 w-4 mr-2" />
                Thư viện video
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-[#1F1F1F] data-[state=active]:text-white">
                <Upload className="h-4 w-4 mr-2" />
                Tải lên mới
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 overflow-y-auto mt-0">
              {loadingVideoPreviews ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : availableVideoPreviews.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có video nào trong thư viện</p>
                  <p className="text-sm text-gray-500 mt-2">Tải lên video mới để thêm vào thư viện</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableVideoPreviews.map((url, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectVideoPreviewFromLibrary(url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedVideoPreviewUrl === url
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-[#2D2D2D] hover:border-gray-600'
                      }`}
                    >
                      <video
                        src={url}
                        className="w-full h-full object-cover"
                        muted
                      />
                      {selectedVideoPreviewUrl === url && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="flex-1 overflow-y-auto mt-0">
              <div
                onDrop={handlePreviewDrop}
                onDragOver={handlePreviewDragOver}
                onDragLeave={handlePreviewDragLeave}
                onClick={() => previewInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                  isDraggingPreview
                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                    : 'border-[#2D2D2D] bg-[#1A1A1A] hover:border-gray-600 hover:bg-[#2A2A2A]'
                }`}
              >
                <input
                  ref={previewInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleDialogVideoPreviewSelect}
                  className="hidden"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  <div className={`p-4 rounded-full transition-colors ${
                    isDraggingPreview ? 'bg-blue-500/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                  }`}>
                    <Video className={`h-8 w-8 transition-colors ${
                      isDraggingPreview ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                    }`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white mb-1">
                      {isDraggingPreview ? 'Thả video vào đây' : 'Kéo thả video hoặc click để chọn'}
                    </p>
                    <p className="text-xs text-gray-400">
                      MP4, WebM, MOV (tối đa 100MB)
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <DarkOutlineButton
              type="button"
              onClick={() => {
                setShowVideoPreviewDialog(false);
                setSelectedVideoPreviewUrl(null);
              }}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              type="button"
              onClick={handleConfirmVideoPreview}
              disabled={!selectedVideoPreviewUrl && videoPreviewDialogTab === 'library'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              {course ? 'Xác nhận cập nhật khóa học' : 'Xác nhận tạo khóa học'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {course 
                ? 'Bạn có chắc chắn muốn cập nhật khóa học này? Các thay đổi sẽ được lưu ngay lập tức.'
                : 'Bạn có chắc chắn muốn tạo khóa học mới? Khóa học sẽ được tạo ở trạng thái "Nháp".'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DarkOutlineButton
              type="button"
              onClick={() => {
                setShowSubmitDialog(false);
                setPendingSubmitData(null);
              }}
              disabled={loading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  {course ? 'Cập nhật' : 'Tạo khóa học'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

