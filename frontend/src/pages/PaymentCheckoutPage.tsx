import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import {
  CreditCard,
  Wallet,
  ShieldCheck,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { getCourseById, formatPrice, formatDuration } from '../lib/mockData';
import { toast } from 'sonner';

export function PaymentCheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course = getCourseById(id || '');
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <h1 className="text-3xl mb-4 text-white">Không tìm thấy khóa học</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to="/courses">Quay lại danh sách khóa học</Link>
        </Button>
      </div>
    );
  }

  if (course.is_free) {
    // Auto enroll for free courses
    return (
      <div className="container mx-auto px-4 py-20 text-center bg-background min-h-screen">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl mb-4 text-white">Đăng ký thành công!</h1>
        <p className="text-lg text-gray-400 mb-8">
          Bạn đã đăng ký khóa học "{course.title}" miễn phí
        </p>
        <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link to={`/learn/${course.id}`}>Bắt đầu học ngay</Link>
        </Button>
      </div>
    );
  }

  const finalPrice = course.discount_price || course.original_price;
  const savings = course.discount_price ? course.original_price - course.discount_price : 0;

  const handlePayment = async () => {
    if (!agreeTerms) {
      toast.error('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      toast.success('Thanh toán thành công!');
      navigate(`/learn/${course.id}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background py-4">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6 border-2 border-[#2D2D2D] !text-white bg-black hover:bg-[#1F1F1F] rounded-lg"
          size="lg"
          asChild
        >
          <Link to={`/courses/${course.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Phương thức thanh toán</CardTitle>
                <CardDescription className="text-gray-400">Chọn phương thức thanh toán phù hợp với bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {/* VNPay */}
                    <Label
                      htmlFor="vnpay"
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'vnpay' 
                          ? 'border-blue-600 bg-blue-600/20' 
                          : 'border-[#2D2D2D] hover:bg-[#1F1F1F]'
                      }`}
                    >
                      <RadioGroupItem value="vnpay" id="vnpay" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">VNPay</p>
                          <p className="text-sm text-gray-400">ATM, Visa, Mastercard, Internet Banking</p>
                        </div>
                      </div>
                      {paymentMethod === 'vnpay' && (
                        <Badge className="bg-blue-600">Được chọn</Badge>
                      )}
                    </Label>

                    {/* MoMo */}
                    <Label
                      htmlFor="momo"
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === 'momo' 
                          ? 'border-blue-600 bg-blue-600/20' 
                          : 'border-[#2D2D2D] hover:bg-[#1F1F1F]'
                      }`}
                    >
                      <RadioGroupItem value="momo" id="momo" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-pink-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">MoMo</p>
                          <p className="text-sm text-gray-400">Ví điện tử MoMo</p>
                        </div>
                      </div>
                      {paymentMethod === 'momo' && (
                        <Badge className="bg-blue-600">Được chọn</Badge>
                      )}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Thông tin thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white">Họ</Label>
                      <Input id="firstName" placeholder="Nguyễn" className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white">Tên</Label>
                      <Input id="lastName" placeholder="Văn A" className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Số điện thoại</Label>
                    <Input id="phone" type="tel" placeholder="0901234567" className="bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="bg-blue-600/20 border-blue-600/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-blue-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-blue-400 mb-1">Thanh toán an toàn</p>
                    <p className="text-sm text-blue-300">
                      Thông tin thanh toán của bạn được mã hóa và bảo mật. Chúng tôi không lưu trữ 
                      thông tin thẻ của bạn.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Chi tiết đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Course Info */}
                <div>
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold mb-2 line-clamp-2 text-white">{course.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{course.instructor_name}</p>

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{course.lessons_count} bài học</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(course.duration_minutes)} video</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>Chứng chỉ hoàn thành</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2D2D2D]" />

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Giá gốc:</span>
                    <span className="text-gray-400">{formatPrice(course.original_price)}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(savings)}</span>
                    </div>
                  )}
                  <Separator className="bg-[#2D2D2D]" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl text-white">Tổng cộng:</span>
                    <span className="text-2xl text-blue-500">{formatPrice(finalPrice)}</span>
                  </div>
                </div>

                <Separator className="bg-[#2D2D2D]" />

                {/* Terms Agreement */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-gray-300">
                      Tôi đồng ý với{' '}
                      <Link to="/terms" className="text-blue-500 hover:underline">
                        Điều khoản sử dụng
                      </Link>{' '}
                      và{' '}
                      <Link to="/privacy" className="text-blue-500 hover:underline">
                        Chính sách bảo mật
                      </Link>
                    </label>
                  </div>

                  <DarkOutlineButton
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={isProcessing || !agreeTerms}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Thanh toán {formatPrice(finalPrice)}
                      </>
                    )}
                  </DarkOutlineButton>

                  <p className="text-xs text-center text-gray-500">
                    Bạn sẽ được chuyển đến trang thanh toán an toàn
                  </p>
                </div>

                {/* Money Back Guarantee */}
                <div className="bg-green-600/20 p-4 rounded-lg border border-green-600/50">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-400 text-sm mb-1">
                        Đảm bảo hoàn tiền 30 ngày
                      </p>
                      <p className="text-xs text-green-300">
                        Nếu không hài lòng, bạn có thể yêu cầu hoàn tiền trong 30 ngày đầu tiên
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
