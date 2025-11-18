import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#2D2D2D] bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black border border-white/30">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
          <span className="text-lg font-semibold text-white">EduLearn</span>
        </Link>
        <p className="text-sm text-gray-400 mb-3">
              Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng và sự nghiệp.
            </p>
                <div className="flex gap-3">
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                </div>
          </div>

          {/* Quick Links */}
              <div>
                <h3 className="font-semibold mb-3 text-white text-sm">Liên kết nhanh</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>
                    <Link to="/courses" className="text-gray-400 hover:text-blue-600 transition-colors">
                      Khóa học
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-gray-400 hover:text-blue-600 transition-colors">
                      Về chúng tôi
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-semibold mb-3 text-white text-sm">Danh mục</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>
                    <Link to="/courses?category=web-development" className="text-gray-400 hover:text-blue-600 transition-colors">
                      Web Development
                    </Link>
                  </li>
                  <li>
                    <Link to="/courses?category=mobile-development" className="text-gray-400 hover:text-blue-600 transition-colors">
                      Mobile Development
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold mb-3 text-white text-sm">Liên hệ</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>support@edulearn.vn</span>
                  </li>
                </ul>
              </div>
        </div>

            {/* Bottom */}
            <div className="border-t border-[#2D2D2D] mt-6 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
              <p>&copy; 2025 EduLearn. All rights reserved.</p>
              <div className="flex gap-6">
                <Link to="/terms" className="hover:text-blue-600 transition-colors">
                  Điều khoản sử dụng
                </Link>
                <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                  Chính sách bảo mật
                </Link>
              </div>
            </div>
      </div>
    </footer>
  );
}