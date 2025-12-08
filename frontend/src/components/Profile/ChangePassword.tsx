import { useState } from 'react';
import { DarkOutlineButton } from '../ui/buttons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { toast } from 'sonner';

export function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(
        formData.newPassword
      )
    ) {
      newErrors.newPassword =
        'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await usersApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error changing password:', error);
      console.log('Error response:', error.response?.data);
      
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const responseData = error.response?.data;
        
        // Check if it's validation errors array
        if (responseData?.errors && Array.isArray(responseData.errors)) {
          const validationErrors: Record<string, string> = {};
          responseData.errors.forEach((err: any) => {
            // Map backend field names to frontend field names
            const backendField = err.field || err.path || err.param || '';
            const errorMsg = err.message || err.msg || '';
            
            // Map field names
            if (backendField === 'currentPassword') {
              validationErrors.currentPassword = errorMsg;
            } else if (backendField === 'newPassword') {
              validationErrors.newPassword = errorMsg;
            } else if (backendField === 'confirmPassword') {
              validationErrors.confirmPassword = errorMsg;
            }
          });
          setErrors(validationErrors);
          
          // Show first error as toast (only string)
          const firstError = responseData.errors[0];
          const firstErrorMsg = firstError?.message || firstError?.msg || 'Vui lòng kiểm tra lại thông tin';
          if (typeof firstErrorMsg === 'string') {
            toast.error(firstErrorMsg);
          } else {
            toast.error('Vui lòng kiểm tra lại thông tin');
          }
        } else {
          // Single error message
          const errorMessage = responseData?.message || 'Vui lòng kiểm tra lại thông tin';
          if (typeof errorMessage === 'string') {
            toast.error(errorMessage);
          } else {
            toast.error('Vui lòng kiểm tra lại thông tin');
          }
        }
      } 
      // Handle 400 Bad Request (wrong current password or other errors)
      else if (error.response?.status === 400) {
        const responseData = error.response?.data;
        
        // Extract message from error object structure
        let errorMessage = 'Mật khẩu hiện tại không đúng';
        if (responseData?.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (responseData?.error?.message && typeof responseData.error.message === 'string') {
          errorMessage = responseData.error.message;
        } else if (typeof responseData?.error === 'string') {
          errorMessage = responseData.error;
        }
        
        // Translate English message to Vietnamese if needed
        if (errorMessage.toLowerCase().includes('current password is incorrect')) {
          errorMessage = 'Mật khẩu hiện tại không đúng';
        }
        
        toast.error(errorMessage);
        setErrors({ currentPassword: errorMessage });
      }
      // Handle 401 Unauthorized
      else if (error.response?.status === 401) {
        const responseData = error.response?.data;
        let errorMessage = 'Mật khẩu hiện tại không đúng';
        if (responseData?.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (responseData?.error?.message && typeof responseData.error.message === 'string') {
          errorMessage = responseData.error.message;
        }
        toast.error(errorMessage);
        setErrors({ currentPassword: errorMessage });
      }
      // Other errors
      else {
        const responseData = error.response?.data;
        let errorMessage = 'Có lỗi xảy ra khi đổi mật khẩu';
        if (responseData?.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (responseData?.error?.message && typeof responseData.error.message === 'string') {
          errorMessage = responseData.error.message;
        } else if (typeof responseData?.error === 'string') {
          errorMessage = responseData.error;
        }
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword" className="text-white">
          Mật khẩu hiện tại
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.currentPassword}
            onChange={(e) =>
              setFormData({ ...formData, currentPassword: e.target.value })
            }
            className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
              errors.currentPassword ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
            onClick={() =>
              setShowPasswords({ ...showPasswords, current: !showPasswords.current })
            }
            disabled={isSubmitting}
          >
            {showPasswords.current ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-500">{errors.currentPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-white">
          Mật khẩu mới
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.newPassword}
            onChange={(e) =>
              setFormData({ ...formData, newPassword: e.target.value })
            }
            className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
              errors.newPassword ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
            onClick={() =>
              setShowPasswords({ ...showPasswords, new: !showPasswords.new })
            }
            disabled={isSubmitting}
          >
            {showPasswords.new ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.newPassword ? (
          <p className="text-sm text-red-500">{errors.newPassword}</p>
        ) : (
          <p className="text-xs text-gray-500">
            Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword" className="text-white">
          Xác nhận mật khẩu mới
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="confirmNewPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className={`pl-10 pr-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 ${
              errors.confirmPassword ? 'border-red-500' : ''
            }`}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
            onClick={() =>
              setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
            }
            disabled={isSubmitting}
          >
            {showPasswords.confirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <DarkOutlineButton
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Đổi mật khẩu
          </>
        )}
      </DarkOutlineButton>
    </form>
  );
}

