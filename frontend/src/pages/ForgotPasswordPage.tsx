import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { BookOpen, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Email khôi phục mật khẩu đã được gửi!');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black py-8 px-4">
      <div className="w-full max-w-md bg-black border border-[#2D2D2D] rounded-3xl p-8">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black border border-white/30">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-semibold text-white">EduLearn</span>
        </Link>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Quên mật khẩu</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Nhập email của bạn để nhận link khôi phục mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>
              <DarkOutlineButton
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Đang gửi...' : 'Gửi email khôi phục'}
              </DarkOutlineButton>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-center w-full space-y-2">
              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
              <p className="text-gray-400">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

