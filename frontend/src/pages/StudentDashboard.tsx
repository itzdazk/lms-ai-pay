import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  PlayCircle,
  CheckCircle,
  Flame,
  Calendar,
  BookmarkCheck,
  Compass,
  Target
} from 'lucide-react';
import { mockCourses, getEnrollment, currentUser } from '../lib/mockData';

export function StudentDashboard() {
  const enrolledCourses = mockCourses.filter(course => {
    const enrollment = getEnrollment(currentUser.id, course.id);
    return enrollment !== null;
  });

  const activeCourses = enrolledCourses.filter(course => {
    const enrollment = getEnrollment(currentUser.id, course.id);
    return enrollment && enrollment.progress_percentage < 100;
  });

  const completedCourses = enrolledCourses.filter(course => {
    const enrollment = getEnrollment(currentUser.id, course.id);
    return enrollment && enrollment.progress_percentage === 100;
  });

  const totalProgress =
    enrolledCourses.reduce((acc, course) => {
      const enrollment = getEnrollment(currentUser.id, course.id);
      return acc + (enrollment?.progress_percentage || 0);
    }, 0) / (enrolledCourses.length || 1);

  const quickStats = [
    {
      label: 'Chuỗi học tập',
      value: '7 ngày',
      icon: Flame,
      description: 'Giữ phong độ đều đặn'
    },
    {
      label: 'Thời gian học tuần này',
      value: '5h 45p',
      icon: Clock,
      description: '+1h so với tuần trước'
    },
    {
      label: 'Mục tiêu tuần',
      value: '80% hoàn thành',
      icon: Target,
      description: 'Còn 2 bài học'
    }
  ];

  const quickActions = [
    {
      label: 'Tiếp tục học',
      description: 'Quay lại bài giảng gần nhất',
      icon: PlayCircle,
      href: activeCourses[0] ? `/learn/${activeCourses[0].id}` : '/courses'
    },
    {
      label: 'Khám phá lộ trình',
      description: 'Gợi ý khóa học phù hợp',
      icon: Compass,
      href: '/courses'
    },
    {
      label: 'Xem chứng chỉ',
      description: 'Theo dõi thành tích của bạn',
      icon: Award,
      href: '/certificates'
    }
  ];

  const upcomingSessions = [
    {
      title: 'React Hooks Mastery',
      time: 'Hôm nay • 14:00',
      type: 'Live session',
      course: 'React Pro 2024'
    },
    {
      title: 'AI Project Workshop',
      time: 'Thứ 5 • 09:00',
      type: 'Nhắc học',
      course: 'Applied AI'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr] mb-10">
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/3 opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Xin chào,</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white">{currentUser.full_name}</h1>
                <p className="text-gray-400 mt-2 text-base">
                  Tiếp tục hành trình chinh phục kỹ năng lập trình với lộ trình cá nhân hóa.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {quickStats.map((item, index) => (
                  <div key={index} className="rounded-xl border border-[#2D2D2D] bg-[#1A1A1A] p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <item.icon className="h-4 w-4 text-blue-400" />
                      {item.label}
                    </div>
                    <div className="text-2xl font-semibold text-white mt-2">{item.value}</div>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {quickActions.map(action => (
                  <DarkOutlineButton
                    key={action.label}
                    asChild
                    className="justify-start gap-3 !bg-black py-8"
                  >
                    <Link to={action.href}>
                      <action.icon className="h-4 w-4 text-blue-400" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-black dark:text-white">{action.label}</p>
                        <p className="text-xs text-gray-400">{action.description}</p>
                      </div>
                    </Link>
                  </DarkOutlineButton>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D] rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Lịch học của bạn
            </CardTitle>
            <CardDescription className="text-gray-400">
              Ghi nhớ các buổi học và hoạt động quan trọng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSessions.map((session, index) => (
              <div
                key={session.title}
                className="rounded-xl border border-[#2D2D2D] bg-black/40 p-4 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-black/40 border border-[#2D2D2D] text-gray-300">{session.type}</Badge>
                  <span className="text-xs text-gray-500">{index === 0 ? 'Sắp diễn ra' : 'Gần đây'}</span>
                </div>
                <p className="text-white font-semibold mt-1">{session.title}</p>
                <p className="text-sm text-gray-400">{session.course}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  {session.time}
                </div>
              </div>
            ))}
          </CardContent>
          <CardContent className="pt-2 border-t border-[#2D2D2D]">
            <DarkOutlineButton className="w-full">
              Xem toàn bộ lịch
            </DarkOutlineButton>
          </CardContent>
        </Card>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Khóa học đã đăng ký</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{enrolledCourses.length}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng số khóa học</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Đang học</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeCourses.length}</div>
            <p className="text-xs text-gray-500 mt-1">Khóa học đang học</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Đã hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completedCourses.length}</div>
            <p className="text-xs text-gray-500 mt-1">Khóa học đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Tiến độ tổng quan</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round(totalProgress)}%</div>
            <Progress value={totalProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Continue Watching */}
      {activeCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Tiếp tục học</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCourses.slice(0, 3).map(course => {
              const enrollment = getEnrollment(currentUser.id, course.id);
              return (
                <Card
                  key={course.id}
                  className="bg-[#1A1A1A] border-[#2D2D2D] hover:border-white/30 transition-colors overflow-hidden"
                >
                  <Link to={`/learn/${course.id}`}>
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </Link>
                  <CardHeader>
                    <CardTitle className="text-white line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      Tiến độ: {enrollment?.progress_percentage || 0}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={enrollment?.progress_percentage || 0} className="mb-4" />
                    <DarkOutlineButton
                      asChild
                      className="w-full"
                    >
                      <Link to={`/learn/${course.id}`}>Tiếp tục học</Link>
                    </DarkOutlineButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* My Courses & Achievements */}
      <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-black dark:text-white">Khóa học của tôi</h2>
            <DarkOutlineButton asChild>
              <Link to="/courses">Xem tất cả</Link>
            </DarkOutlineButton>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {enrolledCourses.map(course => {
              const enrollment = getEnrollment(currentUser.id, course.id);
              return (
                <Card key={course.id} className="bg-[#1A1A1A] border-[#2D2D2D] overflow-hidden">
                  <Link to={`/courses/${course.id}`}>
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      {enrollment?.progress_percentage === 100 && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Hoàn thành
                          </Badge>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardHeader>
                    <CardTitle className="text-white line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {enrollment?.progress_percentage || 0}% hoàn thành
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={enrollment?.progress_percentage || 0} className="mb-4" />
                    <div className="flex gap-2">
                      <DarkOutlineButton asChild className="flex-1">
                        <Link to={`/courses/${course.id}`}>Xem chi tiết</Link>
                      </DarkOutlineButton>
                    <DarkOutlineButton
                      asChild
                      className="flex-1"
                    >
                        <Link to={`/learn/${course.id}`}>Học tiếp</Link>
                      </DarkOutlineButton>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookmarkCheck className="h-4 w-4 text-blue-400" />
                Thành tích nổi bật
              </CardTitle>
              <CardDescription className="text-gray-400">
                Kỷ niệm các cột mốc quan trọng của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-[#2D2D2D] p-4 bg-black/40">
                <p className="text-white font-semibold">Chứng chỉ mới</p>
                <p className="text-sm text-gray-400">
                  {completedCourses.length > 0
                    ? `${completedCourses[0].title}`
                    : 'Hãy hoàn thành khóa học để nhận chứng chỉ đầu tiên.'}
                </p>
                <DarkOutlineButton className="mt-3 w-full">
                  Xem chứng chỉ
                </DarkOutlineButton>
              </div>
              <div className="rounded-xl border border-[#2D2D2D] p-4 bg-black/40">
                <p className="text-white font-semibold">Tiến độ tổng quan</p>
                <p className="text-sm text-gray-400">Bạn đã hoàn thành {Math.round(totalProgress)}% mục tiêu đã đăng ký</p>
                <Progress value={totalProgress} className="mt-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                Gợi ý tiếp theo
              </CardTitle>
              <CardDescription className="text-gray-400">
                Những nội dung phù hợp với mục tiêu của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockCourses.slice(0, 2).map(course => (
                <div key={course.id} className="rounded-xl border border-[#2D2D2D] p-4 bg-black/40">
                  <p className="text-white font-semibold">{course.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{course.level}</p>
                  <DarkOutlineButton asChild className="mt-3 w-full">
                    <Link to={`/courses/${course.id}`}>Xem khóa học</Link>
                  </DarkOutlineButton>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

















