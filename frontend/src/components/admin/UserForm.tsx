import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Loader2, User as UserIcon, Mail, Phone } from 'lucide-react';
import type { User, UpdateUserRequest } from '../../lib/api/types';

interface UserFormProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: UpdateUserRequest) => Promise<void>;
  loading?: boolean;
}

export function UserForm({ user, open, onOpenChange, onSubmit, loading = false }: UserFormProps) {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
      setErrors({});
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
      });
      setErrors({});
    }
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    if (formData.phone && !/^0\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số và bắt đầu bằng 0';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Giới thiệu không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(user.id, formData);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription className="text-gray-400">
            Cập nhật thông tin của {user.fullName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white">
              Họ và tên
            </Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className={`pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white ${
                  errors.fullName ? 'border-red-500' : ''
                }`}
                disabled={loading}
                required
              />
            </div>
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white opacity-60 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500">Email không thể thay đổi</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">
              Số điện thoại
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="0901234567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={`pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                  errors.phone ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white">
              Giới thiệu
            </Label>
            <Textarea
              id="bio"
              rows={4}
              placeholder="Viết một chút về người dùng..."
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                errors.bio ? 'border-red-500' : ''
              }`}
              disabled={loading}
            />
            {errors.bio ? (
              <p className="text-sm text-red-500">{errors.bio}</p>
            ) : (
              <p className="text-xs text-gray-500">
                {formData.bio?.length || 0}/500 ký tự
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

