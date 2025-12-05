import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Settings, User, Lock, Bell, Shield, ArrowLeft } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-4 bg-background text-foreground min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <Link to="/profile">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại hồ sơ
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
            Cài đặt
          </h1>
          <p className="text-muted-foreground">
            Quản lý cài đặt tài khoản và tùy chọn
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-white">Thông tin cá nhân</CardTitle>
                  <CardDescription className="text-gray-400">
                    Quản lý thông tin hồ sơ của bạn
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Cập nhật thông tin cá nhân, avatar và mật khẩu của bạn.
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/profile">Đi đến hồ sơ</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-white">Bảo mật</CardTitle>
                  <CardDescription className="text-gray-400">
                    Quản lý mật khẩu và bảo mật tài khoản
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Đổi mật khẩu</p>
                    <p className="text-sm text-gray-400">
                      Cập nhật mật khẩu để bảo mật tài khoản
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/profile#password">Thay đổi</Link>
                  </Button>
                </div>
                <Separator className="bg-[#2D2D2D]" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Xác thực email</p>
                    <p className="text-sm text-gray-400">
                      Xác thực địa chỉ email của bạn
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Đã xác thực
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-yellow-600" />
                <div>
                  <CardTitle className="text-white">Thông báo</CardTitle>
                  <CardDescription className="text-gray-400">
                    Quản lý cài đặt thông báo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Tính năng này sẽ được triển khai trong tương lai.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">Thông báo email</span>
                  <Button variant="outline" size="sm" disabled>
                    Bật
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Thông báo đẩy</span>
                  <Button variant="outline" size="sm" disabled>
                    Bật
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle className="text-white">Quyền riêng tư</CardTitle>
                  <CardDescription className="text-gray-400">
                    Quản lý quyền riêng tư và dữ liệu của bạn
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 mb-4">
                Tính năng này sẽ được triển khai trong tương lai.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white">Hiển thị hồ sơ công khai</span>
                  <Button variant="outline" size="sm" disabled>
                    Tắt
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Cho phép tìm kiếm</span>
                  <Button variant="outline" size="sm" disabled>
                    Bật
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

