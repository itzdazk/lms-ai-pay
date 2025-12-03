import { useState } from 'react';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { User, Mail, Phone, Camera, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { currentUser } from '../lib/mockData';

export function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: currentUser.full_name,
    email: currentUser.email,
    phone: '',
    bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Thông tin đã được cập nhật!');
      setIsSaving(false);
    }, 1000);
  };

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
                <div className="relative inline-block mb-4">
                  <Avatar className="h-32 w-32 mx-auto">
                    <AvatarImage src={currentUser.avatar} alt={formData.fullName} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {formData.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <DarkOutlineButton
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full bg-black"
                    title="Đổi avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </DarkOutlineButton>
                </div>
                <CardTitle className="text-white">{formData.fullName}</CardTitle>
                <CardDescription className="text-gray-400">{formData.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Vai trò</p>
                    <p className="text-white font-medium">
                      {currentUser.role === 'student' ? 'Học viên' : currentUser.role === 'instructor' ? 'Giảng viên' : 'Quản trị viên'}
                    </p>
                  </div>
                  <Separator className="bg-[#2D2D2D]" />
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Thành viên từ</p>
                    <p className="text-white">Tháng 1, 2024</p>
                  </div>
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
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white"
                        required
                      />
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
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white">Giới thiệu</Label>
                    <textarea
                      id="bio"
                      rows={4}
                      placeholder="Viết một chút về bản thân..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full p-3 rounded-md bg-[#1F1F1F] border border-[#2D2D2D] text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <DarkOutlineButton
                    type="submit"
                    className="w-full"
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-white">Mật khẩu hiện tại</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">Mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Tối thiểu 8 ký tự</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword" className="text-white">Xác nhận mật khẩu mới</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <DarkOutlineButton
                    type="submit"
                    className="w-full"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Đổi mật khẩu
                  </DarkOutlineButton>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

