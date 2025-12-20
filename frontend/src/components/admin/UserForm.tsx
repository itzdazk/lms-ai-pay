import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Loader2, User as UserIcon, Phone, FileText, Mail, Shield, UserCheck } from 'lucide-react';
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
    phone: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
      setErrors({});
    } else {
      setFormData({
        fullName: '',
        phone: '',
        bio: '',
      });
      setErrors({});
    }
  }, [user]);

  // Reset form when dialog closes without saving
  useEffect(() => {
    if (!open && user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
      setErrors({});
    }
  }, [open, user]);

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
      <DialogContent className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border-[#2D2D2D] text-white max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            Chỉnh sửa người dùng
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-base">
            Cập nhật thông tin cá nhân của <span className="text-white font-medium">{user.fullName}</span>
          </DialogDescription>
        </DialogHeader>

        {/* User Info Card */}
        <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1F1F1F] rounded-lg p-4 mb-6 border border-[#3D3D3D]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 border-[#3D3D3D]">
              {user.avatarUrl || user.avatar ? (
                <img
                  src={user.avatarUrl || user.avatar}
                  alt={`${user.fullName} avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    const target = e.target as HTMLElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"><svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{user.fullName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    user.role === 'INSTRUCTOR' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    user.status === 'INACTIVE' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white font-medium flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-400" />
                  Họ và tên <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 ${
                      errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Nhập họ và tên đầy đủ"
                    disabled={loading}
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-400" />
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0901234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all duration-200 ${
                      errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.phone}
                  </p>
                )}
                {!errors.phone && formData.phone && (
                  <p className="text-xs text-green-400">✓ Số điện thoại hợp lệ</p>
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-[#2D2D2D]" />

          {/* Bio Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Giới thiệu</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                Mô tả về người dùng
              </Label>
              <Textarea
                id="bio"
                rows={5}
                placeholder="Viết một chút về người dùng, sở thích, kinh nghiệm..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className={`bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200 resize-none ${
                  errors.bio ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                disabled={loading}
              />
              <div className="flex justify-between items-center">
                {errors.bio ? (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.bio}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Chia sẻ thông tin cá nhân để kết nối tốt hơn
                  </p>
                )}
                <span className={`text-xs font-medium ${
                  (formData.bio?.length || 0) > 450 ? 'text-orange-400' :
                  (formData.bio?.length || 0) > 400 ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {formData.bio?.length || 0}/500
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-[#2D2D2D]" />

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D] hover:text-white transition-all duration-200 min-w-[120px]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

