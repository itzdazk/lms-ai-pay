import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { DarkOutlineButton } from '../components/ui/buttons'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Checkbox } from '../components/ui/checkbox'
import { CreditCard, ShieldCheck, CheckCircle, ArrowLeft } from 'lucide-react'
import VnpayLogo from '../assets/images/payment_method/VNPAY-Logo-App.png'
import MomoLogo from '../assets/images/payment_method/MOMO-Logo-App.png'
import { coursesApi } from '../lib/api/courses'
import type { PublicCourse } from '../lib/api/types'
import { getCoursePrice } from '../lib/courseUtils'
import { OrderSummary } from '../components/Payment/OrderSummary'
import { useCreateOrder } from '../hooks/useOrders'
import { paymentsApi } from '../lib/api/payments'

export function PaymentCheckoutPage() {
    const { slug } = useParams<{ slug: string }>()
    const [course, setCourse] = useState<PublicCourse | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'momo'>(
        'vnpay',
    )
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [finalPrice, setFinalPrice] = useState<number | null>(null)
    const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(
        null,
    )
    const [billing, setBilling] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    })

    const { createOrder } = useCreateOrder()

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) {
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                const data = await coursesApi.getCourseBySlug(slug)
                setCourse(data)
            } catch (error: any) {
                console.error('Error fetching course', error)
                setCourse(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourse()
    }, [slug])

    const priceInfo = useMemo(
        () =>
            course
                ? getCoursePrice({
                      price: course.price ?? course.originalPrice,
                      discountPrice: course.discountPrice,
                      originalPrice: course.originalPrice ?? course.price,
                  })
                : null,
        [course],
    )

    if (!slug) {
        return (
            <div className='container mx-auto px-4 py-20 text-center bg-background min-h-screen'>
                <h1 className='text-3xl mb-4 text-white'>
                    Không tìm thấy khóa học
                </h1>
                <Button
                    asChild
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                    <Link to='/courses'>Quay lại danh sách khóa học</Link>
                </Button>
            </div>
        )
    }

    if (!isLoading && course && priceInfo?.isFree) {
        return (
            <div className='container mx-auto px-4 py-20 text-center bg-background min-h-screen'>
                <CheckCircle className='h-20 w-20 text-green-500 mx-auto mb-6' />
                <h1 className='text-3xl mb-4 text-white'>Khóa học miễn phí</h1>
                <p className='text-lg text-gray-400 mb-8'>
                    Bạn có thể bắt đầu học ngay mà không cần thanh toán: "
                    {course.title}"
                </p>
                <Button
                    size='lg'
                    asChild
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                    <Link to={`/courses/${course.slug}/lessons`}>
                        Bắt đầu học ngay
                    </Link>
                </Button>
            </div>
        )
    }

    if (!isLoading && !course) {
        return (
            <div className='container mx-auto px-4 py-20 text-center bg-background min-h-screen'>
                <h1 className='text-3xl mb-4 text-white'>
                    Không tìm thấy khóa học
                </h1>
                <Button
                    asChild
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                    <Link to='/courses'>Quay lại danh sách khóa học</Link>
                </Button>
            </div>
        )
    }

    const handlePayment = async () => {
        if (!agreeTerms) {
            return
        }

        if (!course || !priceInfo) {
            return
        }

        const paymentGateway = paymentMethod === 'vnpay' ? 'VNPay' : 'MoMo'

        setIsProcessing(true)
        try {
            const order = await createOrder({
                courseId: course.id,
                paymentGateway,
                billingAddress: {
                    fullName:
                        `${billing.firstName} ${billing.lastName}`.trim() ||
                        undefined,
                    email: billing.email || undefined,
                    phone: billing.phone || undefined,
                },
                couponCode: appliedCouponCode || undefined,
            })

            const paymentUrl =
                paymentMethod === 'vnpay'
                    ? await paymentsApi.createVNPayUrl(order.id)
                    : await paymentsApi.createMoMoUrl(order.id)
            console.log('paymentUrl', paymentUrl)

            window.location.href = paymentUrl
        } catch (error: any) {
            console.error('handlePayment error', error)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className='min-h-screen bg-background py-4'>
            <div className='container mx-auto px-4'>
                <Button
                    variant='outline'
                    className='mb-6 border-2 border-[#2D2D2D] text-white bg-black hover:bg-[#1F1F1F] rounded-lg'
                    size='lg'
                    asChild
                >
                    <Link to={`/courses/${slug}`}>
                        <ArrowLeft className='h-4 w-4 mr-2' />
                        Quay lại
                    </Link>
                </Button>

                <div className='grid lg:grid-cols-3 gap-8'>
                    <div className='lg:col-span-2 space-y-6'>
                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-white'>
                                    Phương thức thanh toán
                                </CardTitle>
                                <CardDescription className='text-gray-400'>
                                    Chọn phương thức thanh toán phù hợp với bạn
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={(value) =>
                                        setPaymentMethod(
                                            value as 'vnpay' | 'momo',
                                        )
                                    }
                                >
                                    <div className='space-y-3'>
                                        <Label
                                            htmlFor='vnpay'
                                            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                                paymentMethod === 'vnpay'
                                                    ? 'border-blue-600 bg-blue-600/20'
                                                    : 'border-[#2D2D2D] hover:bg-[#1F1F1F]'
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value='vnpay'
                                                id='vnpay'
                                            />
                                            <div className='flex items-center gap-3 flex-1'>
                                                <div className='w-12 h-12 bg-white rounded-lg flex items-center justify-center'>
                                                    <img
                                                        src={VnpayLogo}
                                                        alt='VNPay logo'
                                                        className='w-10 h-10 object-contain'
                                                    />
                                                </div>
                                                <div className='flex-1'>
                                                    <p className='font-semibold text-white'>
                                                        VNPay
                                                    </p>
                                                    <p className='text-sm text-gray-400'>
                                                        ATM, Visa, Mastercard,
                                                        Internet Banking
                                                    </p>
                                                </div>
                                            </div>
                                            {paymentMethod === 'vnpay' && (
                                                <Badge className='bg-blue-600'>
                                                    Được chọn
                                                </Badge>
                                            )}
                                        </Label>

                                        <Label
                                            htmlFor='momo'
                                            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                                paymentMethod === 'momo'
                                                    ? 'border-blue-600 bg-blue-600/20'
                                                    : 'border-[#2D2D2D] hover:bg-[#1F1F1F]'
                                            }`}
                                        >
                                            <RadioGroupItem
                                                value='momo'
                                                id='momo'
                                            />
                                            <div className='flex items-center gap-3 flex-1'>
                                                <div className='w-12 h-12 bg-pink-600/20 rounded-lg flex items-center justify-center'>
                                                    <img
                                                        src={MomoLogo}
                                                        alt='MoMo logo'
                                                        className='w-10 h-10 object-contain'
                                                    />
                                                </div>
                                                <div className='flex-1'>
                                                    <p className='font-semibold text-white'>
                                                        MoMo
                                                    </p>
                                                    <p className='text-sm text-gray-400'>
                                                        Ví điện tử MoMo
                                                    </p>
                                                </div>
                                            </div>
                                            {paymentMethod === 'momo' && (
                                                <Badge className='bg-blue-600'>
                                                    Được chọn
                                                </Badge>
                                            )}
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>

                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardHeader>
                                <CardTitle className='text-white'>
                                    Thông tin thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-4'>
                                    <div className='grid md:grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label
                                                htmlFor='firstName'
                                                className='text-white'
                                            >
                                                Họ
                                            </Label>
                                            <Input
                                                id='firstName'
                                                placeholder='Nguyễn'
                                                className='bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                                                value={billing.firstName}
                                                onChange={(e) =>
                                                    setBilling((prev) => ({
                                                        ...prev,
                                                        firstName:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <Label
                                                htmlFor='lastName'
                                                className='text-white'
                                            >
                                                Tên
                                            </Label>
                                            <Input
                                                id='lastName'
                                                placeholder='Văn A'
                                                className='bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                                                value={billing.lastName}
                                                onChange={(e) =>
                                                    setBilling((prev) => ({
                                                        ...prev,
                                                        lastName:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className='space-y-2'>
                                        <Label
                                            htmlFor='email'
                                            className='text-white'
                                        >
                                            Email
                                        </Label>
                                        <Input
                                            id='email'
                                            type='email'
                                            placeholder='email@example.com'
                                            className='bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                                            value={billing.email}
                                            onChange={(e) =>
                                                setBilling((prev) => ({
                                                    ...prev,
                                                    email: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className='space-y-2'>
                                        <Label
                                            htmlFor='phone'
                                            className='text-white'
                                        >
                                            Số điện thoại
                                        </Label>
                                        <Input
                                            id='phone'
                                            type='tel'
                                            placeholder='0901234567'
                                            className='bg-[#1F1F1F] border-[#2D2D2D] text-white placeholder:text-gray-500'
                                            value={billing.phone}
                                            onChange={(e) =>
                                                setBilling((prev) => ({
                                                    ...prev,
                                                    phone: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className='bg-blue-600/20 dark:bg-blue-600/20 border-blue-600/50 dark:border-blue-600/50'>
                            <CardContent className='pt-6'>
                                <div className='flex items-start gap-3'>
                                    <ShieldCheck className='h-6 w-6 dark:text-blue-500 text-blue-800 shrink-0 mt-1' />
                                    <div>
                                        <p className='font-semibold dark:text-blue-500 text-blue-800 mb-1'>
                                            Thanh toán an toàn
                                        </p>
                                        <p className='text-sm dark:text-blue-300 text-blue-600'>
                                            Thông tin thanh toán của bạn được mã
                                            hóa và bảo mật. Chúng tôi không lưu
                                            trữ thông tin thẻ của bạn.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className='lg:col-span-1 space-y-4'>
                        <OrderSummary
                            course={course}
                            loading={isLoading}
                            showCourseMeta={false}
                            showCouponInput={false}
                            onPriceChange={setFinalPrice}
                            onCouponApplied={(couponCode) =>
                                setAppliedCouponCode(couponCode)
                            }
                            onCouponRemoved={() => setAppliedCouponCode(null)}
                        />

                        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                            <CardContent className='space-y-4 pt-6'>
                                <div className='flex items-start space-x-2'>
                                    <Checkbox
                                        id='terms'
                                        checked={agreeTerms}
                                        onCheckedChange={(checked) =>
                                            setAgreeTerms(checked as boolean)
                                        }
                                        className='mt-1 border-2 border-[#5e5757]'
                                    />
                                    <label
                                        htmlFor='terms'
                                        className='text-sm leading-relaxed cursor-pointer text-gray-300'
                                    >
                                        Tôi đồng ý với{' '}
                                        <Link
                                            to='/terms'
                                            className='text-blue-500 hover:underline'
                                        >
                                            Điều khoản sử dụng
                                        </Link>{' '}
                                        và{' '}
                                        <Link
                                            to='/privacy'
                                            className='text-blue-500 hover:underline'
                                        >
                                            Chính sách bảo mật
                                        </Link>
                                    </label>
                                </div>

                                <DarkOutlineButton
                                    className='w-full'
                                    size='lg'
                                    onClick={handlePayment}
                                    disabled={
                                        isProcessing || !agreeTerms || isLoading
                                    }
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2' />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className='mr-2 h-4 w-4' />
                                            {finalPrice !== null
                                                ? `Thanh toán ${new Intl.NumberFormat(
                                                      'vi-VN',
                                                      {
                                                          style: 'currency',
                                                          currency: 'VND',
                                                      },
                                                  ).format(finalPrice)}`
                                                : priceInfo
                                                  ? `Thanh toán ${priceInfo.displayPrice}`
                                                  : 'Thanh toán'}
                                        </>
                                    )}
                                </DarkOutlineButton>

                                <p className='text-xs text-center text-gray-500'>
                                    Bạn sẽ được chuyển đến trang thanh toán an
                                    toàn
                                </p>

                                <div className='bg-green-600/20 p-4 rounded-lg border border-green-600/50'>
                                    <div className='flex items-start gap-2'>
                                        <CheckCircle className='h-5 w-5 text-green-500 shrink-0 mt-0.5' />
                                        <div>
                                            <p className='font-semibold text-green-400 text-sm mb-1'>
                                                Đảm bảo hoàn tiền 30 ngày
                                            </p>
                                            <p className='text-xs text-green-300'>
                                                Nếu không hài lòng, bạn có thể
                                                yêu cầu hoàn tiền trong 30 ngày
                                                đầu tiên
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
    )
}
