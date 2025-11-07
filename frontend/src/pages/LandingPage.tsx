import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Học tập thông minh với AI
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Nền tảng học tập trực tuyến tích hợp AI, giúp bạn phát triển kỹ năng 
              và sự nghiệp với hơn 1000+ khóa học chất lượng cao.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
                <Link to="/courses">
                  Khám phá khóa học
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link to="/register">
                  Đăng ký miễn phí
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Tính năng nổi bật</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              EduLearn cung cấp trải nghiệm học tập toàn diện với công nghệ AI tiên tiến
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}














