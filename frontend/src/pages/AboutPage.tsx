import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  BookOpen,
  Users,
  Award,
  Target,
  Heart,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';

export function AboutPage() {
  const stats = [
    { label: 'Khóa học', value: '1,000+', icon: BookOpen, color: 'text-blue-600' },
    { label: 'Học viên', value: '50,000+', icon: Users, color: 'text-green-600' },
    { label: 'Giảng viên', value: '200+', icon: Award, color: 'text-purple-600' },
    { label: 'Chứng chỉ', value: '25,000+', icon: Award, color: 'text-yellow-600' },
  ];

  const values = [
    {
      icon: Target,
      title: 'Sứ mệnh',
      description: 'Làm cho giáo dục chất lượng cao trở nên dễ tiếp cận cho mọi người, mọi nơi thông qua công nghệ AI.'
    },
    {
      icon: Heart,
      title: 'Tầm nhìn',
      description: 'Trở thành nền tảng học tập trực tuyến hàng đầu tại Việt Nam, nơi mọi người có thể phát triển kỹ năng và sự nghiệp.'
    },
    {
      icon: Zap,
      title: 'Đổi mới',
      description: 'Không ngừng cải tiến và áp dụng công nghệ mới như AI để nâng cao trải nghiệm học tập.'
    },
    {
      icon: Shield,
      title: 'Chất lượng',
      description: 'Cam kết cung cấp nội dung chất lượng cao được xây dựng bởi các chuyên gia hàng đầu trong ngành.'
    }
  ];

  const team = [
    {
      name: 'Nguyễn Văn A',
      role: 'CEO & Founder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ceo',
      bio: 'Chuyên gia công nghệ với hơn 15 năm kinh nghiệm'
    },
    {
      name: 'Trần Thị B',
      role: 'CTO',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cto',
      bio: 'Expert về AI và Machine Learning'
    },
    {
      name: 'Lê Văn C',
      role: 'Head of Education',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=head',
      bio: 'Chuyên gia giáo dục với đam mê công nghệ'
    },
    {
      name: 'Phạm Thị D',
      role: 'Head of Product',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=product',
      bio: 'Designer với tư duy sáng tạo và user-centric'
    }
  ];

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative bg-background text-foreground overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-background/85" />
        <div className="container mx-auto px-4 py-12 md:py-28 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl mb-6 text-black dark:text-white drop-shadow-lg">
            Nền tảng học tập thế hệ mới
          </h1>
          <p className="text-xl text-black dark:text-gray-200 max-w-3xl mx-auto drop-shadow">
            EduLearn là nền tảng học tập trực tuyến tích hợp AI, giúp hàng triệu người 
            học viên phát triển kỹ năng và đạt được mục tiêu nghề nghiệp.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-background ">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className="text-center bg-[#1A1A1A] border-[#2D2D2D] hover:border-blue-500/40 transition-colors"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full bg-blue-600/10 ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-3xl mb-1 text-white">{stat.value}</div>
                  <p className="text-gray-400">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12 bg-background text-foreground border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl mb-6 text-foreground">Câu chuyện của chúng tôi</h2>
            <p className="text-lg text-muted-foreground mb-4">
              EduLearn được thành lập vào năm 2020 với mục tiêu làm cho giáo dục chất lượng cao
              trở nên dễ tiếp cận hơn cho mọi người. Chúng tôi tin rằng mọi người đều có quyền
              học hỏi và phát triển, bất kể họ ở đâu hay hoàn cảnh ra sao.
            </p>
            <p className="text-lg text-muted-foreground">
              Với sự kết hợp giữa công nghệ AI tiên tiến và nội dung chất lượng cao từ các
              chuyên gia hàng đầu, chúng tôi đã giúp hàng chục nghìn học viên đạt được mục tiêu
              nghề nghiệp của họ.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 bg-background text-foreground border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4 text-foreground">Giá trị cốt lõi</h2>
            <p className="text-lg text-muted-foreground">
              Những giá trị dẫn dắt chúng tôi mỗi ngày
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card
                key={index}
                className="text-center bg-[#1A1A1A] border border-[#2D2D2D] hover:border-blue-500/40 transition-colors"
              >
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-blue-600/10 text-white">
                      <value.icon className="h-8 w-8" />
                    </div>
                  </div>
                  <CardTitle className="text-white">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 bg-background text-foreground border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4 text-foreground">Đội ngũ lãnh đạo</h2>
            <p className="text-lg text-muted-foreground">
              Những người đứng sau thành công của EduLearn
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center bg-[#1A1A1A] border border-[#2D2D2D] hover:border-blue-500/40 transition-colors">
                <CardContent className="pt-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-blue-600 text-white">{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl mb-1 text-white">{member.name}</h3>
                  <p className="text-blue-400 mb-3">{member.role}</p>
                  <p className="text-sm text-gray-400">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-12 bg-background text-foreground border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4 text-foreground">Hành trình phát triển</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {[
                { year: '2020', title: 'Thành lập', desc: 'EduLearn được thành lập với 10 khóa học đầu tiên' },
                { year: '2021', title: 'Mở rộng', desc: 'Đạt 10,000 học viên và 100 khóa học' },
                { year: '2022', title: 'Tích hợp AI', desc: 'Ra mắt Gia sư AI - trợ lý học tập thông minh' },
                { year: '2023', title: 'Tăng trưởng', desc: 'Vượt 50,000 học viên và 1,000 khóa học' },
                { year: '2024', title: 'Đổi mới', desc: 'Ra mắt Voice Search và Smart Recommendations' },
                { year: '2025', title: 'Mở rộng toàn cầu', desc: 'Hợp tác với 50+ đối tác quốc tế và ra mắt chương trình chứng chỉ toàn cầu' },
              ].map((milestone, index, array) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2D2D2D] text-white flex-shrink-0">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    {index < array.length - 1 && <div className="w-0.5 h-full bg-[#2D2D2D] mt-2" />}
                  </div>
                  <div className="pb-8">
                    <Badge className="mb-2 bg-[#1A1A1A] border border-[#2D2D2D] text-white">{milestone.year}</Badge>
                    <h3 className="text-xl mb-2 text-foreground">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background border-t border-gray-200 text-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl mb-6">
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng chục nghìn học viên đang phát triển kỹ năng mỗi ngày
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/courses" 
              className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors dark:border dark:border-white/20"
            >
              Khám phá khóa học
            </a>
            <a 
              href="/register" 
              className="inline-flex items-center justify-center px-6 py-3
               border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-100
                transition-colors dark:border-[#2D2D2D] dark:text-white dark:hover:bg-white/10"
            >
              Đăng ký miễn phí
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
