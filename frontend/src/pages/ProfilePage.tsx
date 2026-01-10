import { useState, useEffect } from 'react';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { User, Mail, Phone, Save, Loader2, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api/users';
import { authApi } from '../lib/api/auth';
import { AvatarUpload } from '../components/Profile/AvatarUpload';
import { ChangePassword } from '../components/Profile/ChangePassword';
import type { User as UserType } from '../lib/api/types';

export function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    bio?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await usersApi.getProfile();
        setUser(profile);
        setFormData({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
        });
      } catch (error: any) {
        console.error('Error loading profile:', error);
        // Error toast is already shown by API client interceptor
        // Fallback to auth user if available
        if (authUser) {
          setUser(authUser);
          setFormData({
            fullName: authUser.fullName || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            bio: authUser.bio || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authUser]);

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: { fullName?: string; phone?: string; bio?: string } = {};

    // Validate fullName
    if (formData.fullName.trim()) {
      if (formData.fullName.trim().length < 2) {
        newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
      } else if (formData.fullName.trim().length > 100) {
        newErrors.fullName = 'Họ và tên không được vượt quá 100 ký tự';
      }
    }

    // Validate phone
    if (formData.phone.trim()) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = 'Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng 0';
      }
    }

    // Validate bio
    if (formData.bio.trim() && formData.bio.trim().length > 500) {
      newErrors.bio = 'Giới thiệu không được vượt quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Client-side validation
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await usersApi.updateProfile({
        fullName: formData.fullName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      });
      setUser(updatedUser);
      await refreshUser();
      setErrors({});
      toast.success('Thông tin đã được cập nhật!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      // Handle validation errors from backend (422)
      if (error.response?.status === 422) {
        const responseData = error.response.data;
        const validationErrors: { fullName?: string; phone?: string; bio?: string } = {};

        // Backend returns errors in different formats
        if (responseData.errors && Array.isArray(responseData.errors)) {
          // Format: { errors: [{ field: 'fullName', message: '...' }] }
          responseData.errors.forEach((err: any) => {
            if (err.field === 'fullName') validationErrors.fullName = err.message;
            if (err.field === 'phone') validationErrors.phone = err.message;
            if (err.field === 'bio') validationErrors.bio = err.message;
          });
        } else if (responseData.error?.details) {
          // Format: { error: { details: { fullName: '...', phone: '...' } } }
          const details = responseData.error.details;
          if (details.fullName) validationErrors.fullName = Array.isArray(details.fullName) ? details.fullName[0] : details.fullName;
          if (details.phone) validationErrors.phone = Array.isArray(details.phone) ? details.phone[0] : details.phone;
          if (details.bio) validationErrors.bio = Array.isArray(details.bio) ? details.bio[0] : details.bio;
        }

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
        }
        // Error toast is already shown by API client interceptor for generic errors
      } else {
        // Other errors - toast is already shown by API client interceptor
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpdated = async (updatedUser: UserType) => {
    setUser(updatedUser);
    await refreshUser();
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      await authApi.resendVerification();
      toast.success('Email xác nhận đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (error: any) {
      console.error('Error resending verification:', error);
      // Error toast is already shown by API client interceptor
    } finally {
      setIsResendingVerification(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-muted-foreground">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 bg-background text-foreground min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground mb-8">Quản lý thông tin cá nhân và tài khoản</p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <AvatarUpload user={user} onAvatarUpdated={handleAvatarUpdated} />
                </div>
                <CardTitle className="text-white">{user.fullName}</CardTitle>
                <CardDescription className="text-gray-400">{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Vai trò</p>
                    <p className="text-white font-medium">
                      {user.role === 'STUDENT'
                        ? 'Học viên'
                        : user.role === 'INSTRUCTOR'
                        ? 'Giảng viên'
                        : 'Quản trị viên'}
                    </p>
                  </div>
                  <Separator className="bg-[#2D2D2D]" />
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Thành viên từ</p>
                    <p className="text-white">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Separator className="bg-[#2D2D2D]" />
                  {user.emailVerified ? (
                    <div>
                      <p className="text-sm text-green-400">✓ Email đã xác thực</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-yellow-400 font-medium">Email chưa được xác thực</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Vui lòng xác thực email để đảm bảo tài khoản của bạn được bảo mật.
                          </p>
                        </div>
                      </div>
                      <DarkOutlineButton
                        type="button"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="w-full"
                      >
                        {isResendingVerification ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-2" />
                            Gửi lại email xác nhận
                          </>
                        )}
                      </DarkOutlineButton>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Thông tin cá nhân</CardTitle>
                <CardDescription className="text-gray-400">
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-white">Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => {
                          setFormData({ ...formData, fullName: e.target.value });
                          // Clear error when user types
                          if (errors.fullName) {
                            setErrors({ ...errors, fullName: undefined });
                          }
                        }}
                        className={`pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white ${
                          errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white opacity-60 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email không thể thay đổi
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0901234567"
                        value={formData.phone}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/\D/g, '');
                          setFormData({ ...formData, phone: value });
                          // Clear error when user types
                          if (errors.phone) {
                            setErrors({ ...errors, phone: undefined });
                          }
                        }}
                        className={`pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
                          errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        maxLength={10}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                    )}
                    {!errors.phone && formData.phone && (
                      <p className="text-xs text-gray-500 mt-1">
                        Định dạng: 10 chữ số, bắt đầu bằng 0
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white">Giới thiệu</Label>
                    <textarea
                      id="bio"
                      rows={4}
                      placeholder="Viết một chút về bản thân..."
                      value={formData.bio}
                      onChange={(e) => {
                        setFormData({ ...formData, bio: e.target.value });
                        // Clear error when user types
                        if (errors.bio) {
                          setErrors({ ...errors, bio: undefined });
                        }
                      }}
                      className={`w-full p-3 rounded-md bg-[#1F1F1F] border text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
                        errors.bio 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-[#2D2D2D] focus:ring-blue-600'
                      }`}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      {errors.bio && (
                        <p className="text-sm text-red-500">{errors.bio}</p>
                      )}
                      <p className={`text-xs ml-auto ${
                        formData.bio.length > 500 ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {formData.bio.length}/500 ký tự
                      </p>
                    </div>
                  </div>

                  <DarkOutlineButton
                    type="submit"
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </DarkOutlineButton>
                </form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Đổi mật khẩu</CardTitle>
                <CardDescription className="text-gray-400">
                  Cập nhật mật khẩu để bảo mật tài khoản
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChangePassword />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

