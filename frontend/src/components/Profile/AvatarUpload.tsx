import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { toast } from 'sonner';
import type { User } from '../../lib/api/types';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface AvatarUploadProps {
  user: User;
  onAvatarUpdated?: (user: User) => void;
}

export function AvatarUpload({ user, onAvatarUpdated }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Create preview and open dialog
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setSelectedFile(file);
      setIsDialogOpen(true);
      // Reset input immediately after reading file to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const updatedUser = await usersApi.uploadAvatar(selectedFile);
      setPreview(null);
      setSelectedFile(null);
      setIsDialogOpen(false);
      toast.success('Cập nhật avatar thành công!');
      if (onAvatarUpdated) {
        onAvatarUpdated(updatedUser);
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      // Extract error message safely
      let errorMessage = 'Có lỗi xảy ra khi upload avatar';
      if (error.response?.data) {
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error?.message && typeof error.response.data.error.message === 'string') {
          errorMessage = error.response.data.error.message;
        } else if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setIsDialogOpen(false);
    resetFileInput();
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    // Reset input when dialog closes (by clicking outside or ESC)
    if (!open) {
      setPreview(null);
      setSelectedFile(null);
      resetFileInput();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Construct full URL from relative path
  // In development, Vite proxy will handle /uploads requests
  // In production, use full backend URL
  const getAvatarUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already a full URL
    }
    // Use relative path - Vite proxy will handle it in dev
    // In production, backend should serve with proper CORS
    return url.startsWith('/') ? url : `/${url}`;
  };

  // Don't show preview on main avatar - only in dialog
  const avatarUrl = getAvatarUrl(user.avatarUrl) || getAvatarUrl(user.avatar);
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="relative inline-block">
        <Avatar className="h-32 w-32">
          <AvatarImage src={avatarUrl || undefined} alt={user.fullName} />
          <AvatarFallback className="bg-blue-600 text-white text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full bg-black hover:bg-gray-800"
          onClick={handleClick}
          disabled={isUploading}
          title="Đổi avatar"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xem trước ảnh đại diện</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {preview && (
              <div className="flex flex-col items-center gap-4">
                {/* Full image with circular mask overlay - match avatar display exactly */}
                {/* Use larger container (256px) for better preview, 128px circle = 50% */}
                <div className="relative w-[356px] h-[356px]">
                  {/* Container matching avatar: aspect-square, object-cover, centered */}
                  <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Circular mask overlay - darken OUTSIDE circle, keep INSIDE bright */}
                    {/* 128px = 50% of 256px container */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, transparent 0%, transparent 70%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.6) 100%)',
                      }}
                    />
                    {/* Single circular border - exactly 128px (50% of 256px) to match avatar h-32 w-32 */}
                  
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Bạn có muốn sử dụng ảnh này làm ảnh đại diện không?
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tải...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

