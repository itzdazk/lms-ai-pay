import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { RoleRoute } from './components/routes/RoleRoute';
import { PublicLayout } from './components/layouts/PublicLayout';
import { AdminLayout } from './components/layouts/AdminLayout';
import { Toaster } from './components/ui/sonner';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { EmailVerificationPage } from './pages/EmailVerificationPage';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CoursePreviewPage } from './pages/CoursePreviewPage';
import { AboutPage } from './pages/AboutPage';

// Student Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { AIChatPage } from './pages/AIChatPage';
import { PaymentCheckoutPage } from './pages/PaymentCheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailurePage } from './pages/PaymentFailurePage';
import { QuizPage } from './pages/QuizPage';
import { CertificatePage } from './pages/CertificatePage';
import { CertificatesPage } from './pages/CertificatesPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Instructor Pages
import { InstructorDashboard } from './pages/InstructorDashboard';
import { CourseCreatePage } from './pages/instructor/CourseCreatePage';
import { CourseEditPage } from './pages/instructor/CourseEditPage';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { CoursesPage as AdminCoursesPage } from './pages/admin/CoursesPage';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Routes>
          {/* ========== AUTH ROUTES (No Layout) ========== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          {/* ========== PUBLIC ROUTES (With Navbar/Footer) ========== */}
          <Route
            path="/*"
            element={
              <PublicLayout>
              <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/courses/preview" element={<CoursePreviewPage />} />
                  <Route path="/courses/:id" element={<CourseDetailPage />} />
                  <Route path="/about" element={<AboutPage />} />

                  {/* ========== STUDENT ROUTES (Protected) ========== */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                          <StudentDashboard />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/learn/:id"
                    element={
                      <ProtectedRoute>
                        <VideoPlayerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ai-chat"
                    element={
                      <ProtectedRoute>
                        <AIChatPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout/:id"
                    element={
                      <ProtectedRoute>
                        <PaymentCheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment/success"
                    element={
                      <ProtectedRoute>
                        <PaymentSuccessPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment/failure"
                    element={
                      <ProtectedRoute>
                        <PaymentFailurePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/quiz/:id"
                    element={
                      <ProtectedRoute>
                        <QuizPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/certificate/:courseId"
                    element={
                      <ProtectedRoute>
                        <CertificatePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/certificates"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
                          <CertificatesPage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* ========== INSTRUCTOR ROUTES (Protected, With Navbar/Footer) ========== */}
                  <Route
                    path="/instructor/dashboard"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                          <InstructorDashboard />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructor/courses/create"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                          <CourseCreatePage />
                        </RoleRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/instructor/courses/:id/edit"
                    element={
                      <ProtectedRoute>
                        <RoleRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
                          <CourseEditPage />
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
            path="/admin/*"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']} redirectTo="/dashboard">
                  <AdminLayout>
                  <Routes>
                      <Route path="/dashboard" element={<AdminDashboard />} />
                      <Route path="/users" element={<UsersPage />} />
                      <Route path="/courses" element={<AdminCoursesPage />} />
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
  );
}
