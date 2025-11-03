import { useState } from 'react';
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
  X
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl mb-4">Khám phá khóa học</h1>
        <p className="text-lg text-gray-600">
          Tìm kiếm và học hỏi từ {mockCourses.length} khóa học chất lượng cao
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Tìm kiếm khóa học, giảng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className={`absolute right-1 top-1/2 -translate-y-1/2 ${isListening ? 'text-red-600 animate-pulse' : ''}`}
              onClick={handleVoiceSearch}
              title="Tìm kiếm bằng giọng nói"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Bộ lọc
          </Button>
        </div>
        {isListening && (
          <p className="text-sm text-red-600 mt-2 animate-pulse">🎤 Đang nghe...</p>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className={`lg:block ${showFilters ? 'block' : 'hidden'} space-y-6`}>
          <Card>
            <CardHeader>
              <CardTitle>Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Filter */}
              <div className="space-y-3">
                <Label>Danh mục</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cat-all"
                      checked={selectedCategory === 'all'}
                      onCheckedChange={() => setSelectedCategory('all')}
                    />
                    <label htmlFor="cat-all" className="text-sm cursor-pointer">
                      Tất cả
                    </label>
                  </div>
                  {mockCategories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={selectedCategory === category.id}
                        onCheckedChange={() => setSelectedCategory(category.id)}
                      />
                      <label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer">
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Level Filter */}
              <div className="space-y-3">
                <Label>Trình độ</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-all"
                      checked={selectedLevel === 'all'}
                      onCheckedChange={() => setSelectedLevel('all')}
                    />
                    <label htmlFor="level-all" className="text-sm cursor-pointer">
                      Tất cả
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-beginner"
                      checked={selectedLevel === 'beginner'}
                      onCheckedChange={() => setSelectedLevel('beginner')}
                    />
                    <label htmlFor="level-beginner" className="text-sm cursor-pointer">
                      Cơ bản
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-intermediate"
                      checked={selectedLevel === 'intermediate'}
                      onCheckedChange={() => setSelectedLevel('intermediate')}
                    />
                    <label htmlFor="level-intermediate" className="text-sm cursor-pointer">
                      Trung cấp
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="level-advanced"
                      checked={selectedLevel === 'advanced'}
                      onCheckedChange={() => setSelectedLevel('advanced')}
                    />
                    <label htmlFor="level-advanced" className="text-sm cursor-pointer">
                      Nâng cao
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Price Filter */}
              <div className="space-y-3">
                <Label>Giá</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-all"
                      checked={selectedPrice === 'all'}
                      onCheckedChange={() => setSelectedPrice('all')}
                    />
                    <label htmlFor="price-all" className="text-sm cursor-pointer">
                      Tất cả
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-free"
                      checked={selectedPrice === 'free'}
                      onCheckedChange={() => setSelectedPrice('free')}
                    />
                    <label htmlFor="price-free" className="text-sm cursor-pointer">
                      Miễn phí
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="price-paid"
                      checked={selectedPrice === 'paid'}
                      onCheckedChange={() => setSelectedPrice('paid')}
                    />
                    <label htmlFor="price-paid" className="text-sm cursor-pointer">
                      Có phí
                    </label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-3">
                <Label>Tags phổ biến</Label>
                <div className="flex flex-wrap gap-2">
                  {mockTags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="cursor-pointer hover:bg-gray-100">
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
            <p className="text-gray-600">
              Hiển thị {sortedCourses.length} khóa học
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Phổ biến nhất</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="rating">Đánh giá cao</SelectItem>
                <SelectItem value="price-low">Giá thấp → cao</SelectItem>
                <SelectItem value="price-high">Giá cao → thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Courses List */}
          {sortedCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-lg text-gray-600 mb-2">Không tìm thấy khóa học phù hợp</p>
              <p className="text-sm text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedCourses.map(course => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <Link to={`/courses/${course.id}`}>
                    <div className="relative aspect-video overflow-hidden">
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
                      <span className="text-sm text-gray-600">{course.instructor_name}</span>
                    </div>
                    <CardTitle className="line-clamp-2 hover:text-blue-600 transition-colors">
                      <Link to={`/courses/${course.id}`}>{course.title}</Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating_avg}</span>
                        <span className="text-gray-400">({course.rating_count})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrolled_count.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.lessons_count} bài</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(course.duration_minutes)}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                      {course.is_free ? (
                        <span className="text-2xl text-green-600">Miễn phí</span>
                      ) : (
                        <div>
                          {course.discount_price ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl text-blue-600">{formatPrice(course.discount_price)}</span>
                              <span className="text-sm text-gray-400 line-through">{formatPrice(course.original_price)}</span>
                            </div>
                          ) : (
                            <span className="text-2xl text-blue-600">{formatPrice(course.original_price)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

