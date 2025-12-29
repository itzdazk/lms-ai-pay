import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { ProtectedRoute } from './components/routes/ProtectedRoute'
import { RoleRoute } from './components/routes/RoleRoute'
import { PublicLayout } from './components/layouts/PublicLayout'
import { AdminLayout } from './components/layouts/AdminLayout'
import { Toaster } from './components/ui/sonner'

// Auth Pages
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { EmailVerificationPage } from './pages/EmailVerificationPage'

// Public Pages
import { LandingPage } from './pages/LandingPage'
import { CoursesPage } from './pages/CoursesPage'
import { CourseDetailPage } from './pages/CourseDetailPage'
import { CoursePreviewPage } from './pages/CoursePreviewPage'
import { AboutPage } from './pages/AboutPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoriesDetailPage } from './pages/CategoriesDetailPage'

// Student Pages
import { StudentDashboard } from './pages/StudentDashboard'
import { LessonPage } from './pages/LessonPage'
import { AIChatPage } from './pages/AIChatPage'
import { PaymentCheckoutPage } from './pages/PaymentCheckoutPage'
import { PaymentResultPage } from './pages/PaymentResultPage'
import { PaymentSuccessPage } from './pages/PaymentSuccessPage'
import { PaymentFailurePage } from './pages/PaymentFailurePage'
import { QuizPage } from './pages/QuizPage'
import { CertificatePage } from './pages/CertificatePage'
import { CertificatesPage } from './pages/CertificatesPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { MyCoursesPage } from './pages/MyCoursesPage'
import { EnrollmentDetailPage } from './pages/EnrollmentDetailPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { TransactionHistoryPage } from './pages/TransactionHistoryPage'
import { NotificationsPage } from './pages/NotificationsPage'

// Instructor Pages
import { InstructorDashboard } from './pages/InstructorDashboard'
import { CourseLayout } from './pages/instructor/CourseLayout'
import { CourseCreatePage } from './pages/instructor/CourseCreatePage'
import { CourseEditPage } from './pages/instructor/CourseEditPage'
import { CourseChaptersPage } from './pages/instructor/CourseChaptersPage'
import { InstructorOrdersPage } from './pages/instructor/InstructorOrdersPage'
import { InstructorEnrollmentsPage } from './pages/instructor/InstructorEnrollmentsPage'
import { InstructorCoursesManagementPage } from './pages/instructor/InstructorCoursesManagementPage'

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard'
import { UsersPage } from './pages/admin/UsersPage'
import { CoursesPage as AdminCoursesPage } from './pages/admin/CoursesPage'
import { OrdersPage } from './pages/admin/OrdersPage'

export default function App() {
    return (
        <Router>
            <ScrollToTop />
            <div className='flex flex-col min-h-screen bg-background text-foreground'>
                <Routes>
                    {/* ========== AUTH ROUTES (No Layout) ========== */}
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='/register' element={<RegisterPage />} />
                    <Route
                        path='/forgot-password'
                        element={<ForgotPasswordPage />}
                    />
                    <Route
                        path='/reset-password'
                        element={<ResetPasswordPage />}
                    />

                    {/* ========== LESSON PAGE (No Layout - Fullscreen Learning Experience) ========== */}
                    <Route
                        path='/courses/:slug/lessons'
                        element={
                            <ProtectedRoute>
                                <LessonPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path='/courses/:slug/lessons/:lessonSlug'
                        element={
                            <ProtectedRoute>
                                <LessonPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ========== PUBLIC ROUTES (With Navbar/Footer) ========== */}
                    <Route
                        path='/*'
                        element={
                            <PublicLayout>
                                <Routes>
                                    <Route path='/' element={<LandingPage />} />
                                    <Route
                                        path='/verify-email'
                                        element={<EmailVerificationPage />}
                                    />
                                    <Route
                                        path='/courses'
                                        element={<CoursesPage />}
                                    />
                                    <Route
                                        path='/courses/preview'
                                        element={<CoursePreviewPage />}
                                    />
                                    <Route
                                        path='/courses/:slug'
                                        element={<CourseDetailPage />}
                                    />
                                    <Route
                                        path='/courses/:id'
                                        element={<CourseDetailPage />}
                                    />
                                    <Route
                                        path='/categories'
                                        element={<CategoriesPage />}
                                    />
                                    <Route
                                        path='/categories/:id'
                                        element={<CategoriesDetailPage />}
                                    />
                                    <Route
                                        path='/about'
                                        element={<AboutPage />}
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
                                                    <StudentDashboard />
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/my-courses'
                                        element={
                                            <ProtectedRoute>
                                                <RoleRoute
                                                    allowedRoles={[
                                                        'STUDENT',
                                                        'INSTRUCTOR',
                                                        'ADMIN',
                                                    ]}
                                                >
                                                    <MyCoursesPage />
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
                                                    <EnrollmentDetailPage />
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
                                                    <OrderHistoryPage />
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
                                                    <OrderDetailPage />
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
                                                    <TransactionHistoryPage />
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />

                                    <Route
                                        path='/ai-chat'
                                        element={
                                            <ProtectedRoute>
                                                <AIChatPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/checkout/:slug'
                                        element={
                                            <ProtectedRoute>
                                                <PaymentCheckoutPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/payment/result'
                                        element={<PaymentResultPage />}
                                    />
                                    <Route
                                        path='/payment/success'
                                        element={
                                            <ProtectedRoute>
                                                <PaymentSuccessPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/payment/failure'
                                        element={
                                            <ProtectedRoute>
                                                <PaymentFailurePage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/quiz/:id'
                                        element={
                                            <ProtectedRoute>
                                                <QuizPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/certificate/:courseId'
                                        element={
                                            <ProtectedRoute>
                                                <CertificatePage />
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
                                                    <CertificatesPage />
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/profile'
                                        element={
                                            <ProtectedRoute>
                                                <ProfilePage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/settings'
                                        element={
                                            <ProtectedRoute>
                                                <SettingsPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/notifications'
                                        element={
                                            <ProtectedRoute>
                                                <NotificationsPage />
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
                                                    <InstructorDashboard />
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
                                                    <InstructorCoursesManagementPage />
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
                                                    <CourseLayout />
                                                </RoleRoute>
                                            </ProtectedRoute>
                                        }
                                    >
                                        <Route
                                            path='create'
                                            element={<CourseCreatePage />}
                                        />
                                        <Route
                                            path=':id/edit'
                                            element={<CourseEditPage />}
                                        />
                                        <Route
                                            path=':id/chapters'
                                            element={<CourseChaptersPage />}
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
                                                    <InstructorOrdersPage />
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
                                                    <InstructorEnrollmentsPage />
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
                                                element={<AdminDashboard />}
                                            />
                                            <Route
                                                path='/users'
                                                element={<UsersPage />}
                                            />
                                            <Route
                                                path='/courses'
                                                element={<AdminCoursesPage />}
                                            />
                                            <Route
                                                path='/orders'
                                                element={<OrdersPage />}
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
