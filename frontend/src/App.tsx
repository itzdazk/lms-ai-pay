import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ScrollToTop } from './components/ScrollToTop'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { RoleRoute } from './components/routes/RoleRoute'
import { PublicLayout } from './components/layouts/PublicLayout'
import { AdminLayout } from './components/layouts/AdminLayout'
import { Toaster } from './components/ui/sonner'
import { Loader2 } from 'lucide-react'

// Loading fallback component
const PageLoading = () => (
    <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
)

// Auth Pages - Lazy loaded
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })))
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage').then(module => ({ default: module.EmailVerificationPage })))

// Public Pages - Lazy loaded
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })))
const CoursesPage = lazy(() => import('./pages/CoursesPage').then(module => ({ default: module.CoursesPage })))
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage').then(module => ({ default: module.CourseDetailPage })))
const CoursePreviewPage = lazy(() => import('./pages/CoursePreviewPage').then(module => ({ default: module.CoursePreviewPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(module => ({ default: module.CategoriesPage })))
const CategoriesDetailPage = lazy(() => import('./pages/CategoriesDetailPage').then(module => ({ default: module.CategoriesDetailPage })))

// Student Pages - Lazy loaded
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(module => ({ default: module.StudentDashboard })))
const LessonPage = lazy(() => import('./pages/LessonPage').then(module => ({ default: module.LessonPage })))
const AIChatPage = lazy(() => import('./pages/AIChatPage').then(module => ({ default: module.AIChatPage })))
const PaymentCheckoutPage = lazy(() => import('./pages/PaymentCheckoutPage').then(module => ({ default: module.PaymentCheckoutPage })))
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage').then(module => ({ default: module.PaymentResultPage })))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then(module => ({ default: module.PaymentSuccessPage })))
const PaymentFailurePage = lazy(() => import('./pages/PaymentFailurePage').then(module => ({ default: module.PaymentFailurePage })))
const QuizPage = lazy(() => import('./pages/QuizPage').then(module => ({ default: module.QuizPage })))
const CertificatePage = lazy(() => import('./pages/CertificatePage').then(module => ({ default: module.CertificatePage })))
const CertificatesPage = lazy(() => import('./pages/CertificatesPage').then(module => ({ default: module.CertificatesPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const EnrollmentDetailPage = lazy(() => import('./pages/EnrollmentDetailPage').then(module => ({ default: module.EnrollmentDetailPage })))
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage').then(module => ({ default: module.OrderHistoryPage })))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then(module => ({ default: module.OrderDetailPage })))
const TransactionHistoryPage = lazy(() => import('./pages/TransactionHistoryPage').then(module => ({ default: module.TransactionHistoryPage })))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })))

// Instructor Pages - Lazy loaded
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard').then(module => ({ default: module.InstructorDashboard })))
const CourseLayout = lazy(() => import('./pages/instructor/CourseLayout').then(module => ({ default: module.CourseLayout })))
const CourseCreatePage = lazy(() => import('./pages/instructor/CourseCreatePage').then(module => ({ default: module.CourseCreatePage })))
const CourseEditPage = lazy(() => import('./pages/instructor/CourseEditPage').then(module => ({ default: module.CourseEditPage })))
const CourseChaptersPage = lazy(() => import('./pages/instructor/CourseChaptersPage').then(module => ({ default: module.CourseChaptersPage })))
const InstructorOrdersPage = lazy(() => import('./pages/instructor/InstructorOrdersPage').then(module => ({ default: module.InstructorOrdersPage })))
const InstructorEnrollmentsPage = lazy(() => import('./pages/instructor/InstructorEnrollmentsPage').then(module => ({ default: module.InstructorEnrollmentsPage })))
const InstructorCoursesManagementPage = lazy(() => import('./pages/instructor/InstructorCoursesManagementPage').then(module => ({ default: module.InstructorCoursesManagementPage })))
const QuizzesPage = lazy(() => import('./pages/instructor/QuizzesPage').then(module => ({ default: module.QuizzesPage })))

// Admin Pages - Lazy loaded
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })))
const UsersPage = lazy(() => import('./pages/admin/UsersPage').then(module => ({ default: module.UsersPage })))
const AdminCoursesPage = lazy(() => import('./pages/admin/CoursesPage').then(module => ({ default: module.CoursesPage })))
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage').then(module => ({ default: module.OrdersPage })))
const RefundsPage = lazy(() => import('./pages/admin/RefundsPage').then(module => ({ default: module.RefundsPage })))

export default function App() {
    return (
        <Router>
            <ScrollToTop />
            <div className='flex flex-col min-h-screen bg-background text-foreground'>
                <Routes>
                    {/* ========== AUTH ROUTES (No Layout) ========== */}
                    <Route path='/login' element={
                        <Suspense fallback={<PageLoading />}>
                            <LoginPage />
                        </Suspense>
                    } />
                    <Route path='/register' element={
                        <Suspense fallback={<PageLoading />}>
                            <RegisterPage />
                        </Suspense>
                    } />
                    <Route
                        path='/forgot-password'
                        element={
                            <Suspense fallback={<PageLoading />}>
                                <ForgotPasswordPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path='/reset-password'
                        element={
                            <Suspense fallback={<PageLoading />}>
                                <ResetPasswordPage />
                            </Suspense>
                        }
                    />

                    {/* ========== LESSON PAGE (No Layout - Fullscreen Learning Experience) ========== */}
                    <Route
                        path='/courses/:slug/lessons'
                        element={
                            <ProtectedRoute>
                                <Suspense fallback={<PageLoading />}>
                                    <LessonPage />
                                </Suspense>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/courses/:slug/lessons/:lessonSlug'
                        element={
                            <ProtectedRoute>
                                <Suspense fallback={<PageLoading />}>
                                    <LessonPage />
                                </Suspense>
                            </ProtectedRoute>
                        }
                    />

                    {/* ========== PUBLIC ROUTES (With Navbar/Footer) ========== */}
                    <Route
                        path='/*'
                        element={
                            <PublicLayout>
                                <Routes>
                                    <Route path='/' element={
                                        <Suspense fallback={<PageLoading />}>
                                            <LandingPage />
                                        </Suspense>
                                    } />
                                    <Route
                                        path='/verify-email'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <EmailVerificationPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/courses'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <CoursesPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/courses/preview'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <CoursePreviewPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/courses/:slug'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <CourseDetailPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/courses/:id'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <CourseDetailPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/categories'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <CategoriesPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/categories/:id'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <CategoriesDetailPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/about'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <AboutPage />
                                            </Suspense>
                                        }
                                    />

                                    {/* ========== STUDENT ROUTES (Protected) ========== */}
                                    <Route
                                        path='/dashboard'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <StudentDashboard />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/enrollments/:id'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <EnrollmentDetailPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/orders'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <OrderHistoryPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/orders/:id'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <OrderDetailPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/transactions'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <TransactionHistoryPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path='/ai-chat'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <AIChatPage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/checkout/:slug'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <PaymentCheckoutPage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/payment/result'
                                        element={
                                            <Suspense fallback={<PageLoading />}>
                                                <PaymentResultPage />
                                            </Suspense>
                                        }
                                    />
                                    <Route
                                        path='/payment/success'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <PaymentSuccessPage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/payment/failure'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <PaymentFailurePage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/quiz/:id'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <QuizPage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/certificate/:courseId'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <CertificatePage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/certificates'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <CertificatesPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/profile'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <ProfilePage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/settings'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <SettingsPage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/notifications'
                                        element={
                                            <ProtectedRoute>
                                                <Suspense fallback={<PageLoading />}>
                                                    <NotificationsPage />
                                                </Suspense>
                                            </ProtectedRoute>
                                        }
                                    />

                                    {/* ========== INSTRUCTOR ROUTES (Protected, With Navbar/Footer) ========== */}
                                    <Route
                                        path='/instructor/dashboard'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <InstructorDashboard />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/instructor/courses-management'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <InstructorCoursesManagementPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    {/* Course Management Routes with Shared Layout */}
                                    <Route
                                        path='/instructor/courses'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <CourseLayout />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    >
                                        <Route
                                            path='create'
                                            element={
                                                <Suspense fallback={<PageLoading />}>
                                                    <CourseCreatePage />
                                                </Suspense>
                                            }
                                        />
                                        <Route
                                            path=':id/edit'
                                            element={
                                                <Suspense fallback={<PageLoading />}>
                                                    <CourseEditPage />
                                                </Suspense>
                                            }
                                        />
                                        <Route
                                            path=':id/chapters'
                                            element={
                                                <Suspense fallback={<PageLoading />}>
                                                    <CourseChaptersPage />
                                                </Suspense>
                                            }
                                        />
                                        <Route
                                            path=':id/quizzes/lessons/:lessonId'
                                            element={
                                                <Suspense fallback={<PageLoading />}>
                                                    <QuizzesPage />
                                                </Suspense>
                                            }
                                        />
                                    </Route>
                                    <Route
                                        path='/instructor/orders'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <InstructorOrdersPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/instructor/enrollments'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <InstructorEnrollmentsPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/instructor/courses/:courseId/quizzes/lessons/:lessonId'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <QuizzesPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    {/* Lesson-level quizzes management */}
                                    <Route
                                        path='/instructor/lessons/:lessonId/quizzes'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <Suspense fallback={<PageLoading />}>
                                                        <QuizzesPage />
                                                    </Suspense>
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                </Routes>
                            </PublicLayout>
                        }
                    />

                    {/* ========== ADMIN ROUTES (Protected, No Navbar/Footer) ========== */}
                    <Route
                        path='/admin/*'
                        element={
                            <ProtectedRoute>
                                <RoleRoute
                                    allowedRoles={['ADMIN']}
                                    redirectTo='/dashboard'
                                >
                                    <AdminLayout>
                                        <Routes>
                                            <Route
                                                path='/dashboard'
                                                element={
                                                    <Suspense fallback={<PageLoading />}>
                                                        <AdminDashboard />
                                                    </Suspense>
                                                }
                                            />
                                            <Route
                                                path='/users'
                                                element={
                                                    <Suspense fallback={<PageLoading />}>
                                                        <UsersPage />
                                                    </Suspense>
                                                }
                                            />
                                            <Route
                                                path='/courses'
                                                element={
                                                    <Suspense fallback={<PageLoading />}>
                                                        <AdminCoursesPage />
                                                    </Suspense>
                                                }
                                            />
                                            <Route
                                                path='/orders'
                                                element={
                                                    <Suspense fallback={<PageLoading />}>
                                                        <OrdersPage />
                                                    </Suspense>
                                                }
                                            />
                                            <Route
                                                path='/refunds'
                                                element={
                                                    <Suspense fallback={<PageLoading />}>
                                                        <RefundsPage />
                                                    </Suspense>
                                                }
                                            />
                                        </Routes>
                                    </AdminLayout>
                                </RoleRoute>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
                <Toaster />
            </div>
        </Router>
    )
}
