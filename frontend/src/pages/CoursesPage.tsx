import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Star,
  Users,
  BookOpen,
  Clock,
  Search,
  Filter,
  Mic,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { mockCourses, mockCategories, mockTags, formatPrice, formatDuration } from '../lib/mockData';

export function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  // Voice Search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      alert('Không thể nhận diện giọng nói. Vui lòng thử lại.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Filter courses
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || course.category_id === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesPrice = selectedPrice === 'all' ||
      (selectedPrice === 'free' && course.is_free) ||
      (selectedPrice === 'paid' && !course.is_free);

    return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
  });

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.enrolled_count - a.enrolled_count;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'rating':
        return b.rating_avg - a.rating_avg;
      case 'price-low':
        const priceA = a.is_free ? 0 : (a.discount_price || a.original_price);
        const priceB = b.is_free ? 0 : (b.discount_price || b.original_price);
        return priceA - priceB;
      case 'price-high':
        const priceA2 = a.is_free ? 0 : (a.discount_price || a.original_price);
        const priceB2 = b.is_free ? 0 : (b.discount_price || b.original_price);
        return priceB2 - priceA2;
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const paginatedCourses = sortedCourses.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLevel, selectedPrice, sortBy]);

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <div className="bg-[#1A1A1A] border-b border-[#2D2D2D]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Khám phá khóa học</h1>
              <p className="text-sm text-gray-400">
                Tìm kiếm và học hỏi từ <span className="text-white font-semibold">{mockCourses.length}</span> khóa học chất lượng cao
              </p>
            </div>
            
            {/* Stats - Compact */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{mockCourses.length}</div>
                <div className="text-xs text-gray-400">Khóa học</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{mockCategories.length}</div>
                <div className="text-xs text-gray-400">Danh mục</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm khóa học, giảng viên, công nghệ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500 focus:border-blue-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className={`absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 ${isListening ? 'text-red-600 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                onClick={handleVoiceSearch}
                title="Tìm kiếm bằng giọng nói"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden h-9 border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
            </Button>
          </div>
          {isListening && (
            <p className="text-sm text-red-600 mt-2 animate-pulse flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Đang nghe...
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className={`lg:block ${showFilters ? 'block' : 'hidden'} space-y-6`}>
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-white">Danh mục</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cat-all"
                      checked={selectedCategory === 'all'}
                      onCheckedChange={() => setSelectedCategory('all')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="cat-all" className="text-sm cursor-pointer text-gray-300">
                      Tất cả
                    </label>
                  </div>
                  {mockCategories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={selectedCategory === category.id}
                        onCheckedChange={() => setSelectedCategory(category.id)}
                        className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer text-gray-300">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Level Filter */}
              <div className="space-y-3">
                <Label className="text-white">Trình độ</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-all"
                      checked={selectedLevel === 'all'}
                      onCheckedChange={() => setSelectedLevel('all')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="level-all" className="text-sm cursor-pointer text-gray-300">
                      Tất cả
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-beginner"
                      checked={selectedLevel === 'beginner'}
                      onCheckedChange={() => setSelectedLevel('beginner')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="level-beginner" className="text-sm cursor-pointer text-gray-300">
                      Cơ bản
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-intermediate"
                      checked={selectedLevel === 'intermediate'}
                      onCheckedChange={() => setSelectedLevel('intermediate')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="level-intermediate" className="text-sm cursor-pointer text-gray-300">
                      Trung cấp
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-advanced"
                      checked={selectedLevel === 'advanced'}
                      onCheckedChange={() => setSelectedLevel('advanced')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="level-advanced" className="text-sm cursor-pointer text-gray-300">
                      Nâng cao
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Price Filter */}
              <div className="space-y-3">
                <Label className="text-white">Giá</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-all"
                      checked={selectedPrice === 'all'}
                      onCheckedChange={() => setSelectedPrice('all')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="price-all" className="text-sm cursor-pointer text-gray-300">
                      Tất cả
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-free"
                      checked={selectedPrice === 'free'}
                      onCheckedChange={() => setSelectedPrice('free')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="price-free" className="text-sm cursor-pointer text-gray-300">
                      Miễn phí
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-paid"
                      checked={selectedPrice === 'paid'}
                      onCheckedChange={() => setSelectedPrice('paid')}
                      className="border-[#2D2D2D] bg-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label htmlFor="price-paid" className="text-sm cursor-pointer text-gray-300">
                      Có phí
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-white">Tags phổ biến</Label>
                <div className="flex flex-wrap gap-2">
                  {mockTags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="cursor-pointer hover:bg-[#1F1F1F] border-[#2D2D2D] text-gray-300">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Courses Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sort & Results */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-gray-400">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, sortedCourses.length)} trong tổng số {sortedCourses.length} khóa học
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 bg-[#1F1F1F] border-[#2D2D2D] text-white">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
                <SelectItem value="popular" className="text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D]">Phổ biến nhất</SelectItem>
                <SelectItem value="newest" className="text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D]">Mới nhất</SelectItem>
                <SelectItem value="rating" className="text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D]">Đánh giá cao</SelectItem>
                <SelectItem value="price-low" className="text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D]">Giá thấp → cao</SelectItem>
                <SelectItem value="price-high" className="text-white hover:bg-[#2D2D2D] focus:bg-[#2D2D2D]">Giá cao → thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses List */}
          {sortedCourses.length === 0 ? (
            <Card className="p-12 text-center bg-[#1A1A1A] border-[#2D2D2D]">
              <p className="text-lg text-gray-300 mb-2">Không tìm thấy khóa học phù hợp</p>
              <p className="text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </Card>
          ) : (
            <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedCourses.map(course => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-[#1A1A1A] border-[#2D2D2D]">
                  <Link to={`/courses/${course.id}`}>
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 left-3 bg-blue-600">
                        {course.level === 'beginner' && 'Cơ bản'}
                        {course.level === 'intermediate' && 'Trung cấp'}
                        {course.level === 'advanced' && 'Nâng cao'}
                      </Badge>
                      {course.featured && (
                        <Badge className="absolute top-3 right-3 bg-yellow-500">
                          ⭐ Nổi bật
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <CardHeader className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={course.instructor_avatar} />
                        <AvatarFallback>{course.instructor_name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-400">{course.instructor_name}</span>
                    </div>
                    <CardTitle className="line-clamp-2 hover:text-blue-600 transition-colors text-white">
                      <Link to={`/courses/${course.id}`}>{course.title}</Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-gray-400">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating_avg}</span>
                        <span className="text-gray-500">({course.rating_count})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{course.enrolled_count.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span>{course.lessons_count} bài</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatDuration(course.duration_minutes)}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t border-[#2D2D2D] pt-4">
                    <div className="flex items-center justify-between w-full">
                      {course.is_free ? (
                        <span className="text-2xl text-green-600">Miễn phí</span>
                      ) : (
                        <div>
                          {course.discount_price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl text-blue-500">{formatPrice(course.discount_price)}</span>
                              <span className="text-sm text-gray-500 line-through">{formatPrice(course.original_price)}</span>
                            </div>
                          ) : (
                            <span className="text-2xl text-blue-500">{formatPrice(course.original_price)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D] disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={
                          currentPage === page
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
                        }
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-gray-400">...</span>;
                  }
                  return null;
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D] disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

