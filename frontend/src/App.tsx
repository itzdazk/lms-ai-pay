import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { AIChatPage } from './pages/AIChatPage';
import { PaymentCheckoutPage } from './pages/PaymentCheckoutPage';
import { QuizPage } from './pages/QuizPage';
import { CertificatePage } from './pages/CertificatePage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AboutPage } from './pages/AboutPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Routes>
          {/* Auth Routes - No Navbar/Footer */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main Routes - With Navbar/Footer */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/:id" element={<CourseDetailPage />} />
                    <Route path="/dashboard" element={<StudentDashboard />} />
                    <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
                    <Route path="/learn/:id" element={<VideoPlayerPage />} />
                    <Route path="/ai-chat" element={<AIChatPage />} />
                    <Route path="/checkout/:id" element={<PaymentCheckoutPage />} />
                    <Route path="/quiz/:id" element={<QuizPage />} />
                    <Route path="/certificate/:courseId" element={<CertificatePage />} />
                    <Route path="/certificates" element={<CertificatesPage />} />
                    <Route path="/about" element={<AboutPage />} />
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}
