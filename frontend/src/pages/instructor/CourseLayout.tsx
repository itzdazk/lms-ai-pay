import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ProgressSteps } from '../../components/ui/progress-steps';
import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';

export function CourseLayout() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const courseId = id ? parseInt(id) : null;

  const courseSteps = useMemo(() => [
    { id: 'course', title: 'Khóa học', description: 'Thông tin cơ bản' },
    { id: 'lessons', title: 'Bài học', description: 'Nội dung học tập' },
  ], []);

  // Determine current step based on pathname
  const currentStep = useMemo(() => {
    if (location.pathname.includes('/chapters')) {
      return 1; // Lessons step
    }
    return 0; // Course step
  }, [location.pathname]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex === currentStep) {
      // Already on this step, do nothing
      return;
    }

    if (stepIndex === 0) {
      // Navigate to course step
      if (courseId) {
        navigate(`/instructor/courses/${courseId}/edit`);
      } else {
        navigate('/instructor/courses/create');
      }
    } else if (stepIndex === 1) {
      // Navigate to lessons step
      if (courseId) {
        navigate(`/instructor/courses/${courseId}/chapters`);
      } else {
        toast.info('Vui lòng tạo khóa học trước khi chuyển sang bước bài học');
      }
    }
  }, [currentStep, courseId, navigate]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Progress Steps - Only rendered once, stays mounted */}
      <ProgressSteps
        steps={courseSteps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        className="mb-6"
      />

      {/* Outlet renders child routes (CourseCreatePage, CourseEditPage, CourseChaptersPage) */}
      <Outlet />
    </div>
  );
}

