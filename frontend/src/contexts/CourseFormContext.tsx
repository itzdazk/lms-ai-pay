import { createContext, useContext, useState, ReactNode } from 'react';

interface CourseFormContextType {
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
}

const CourseFormContext = createContext<CourseFormContextType | undefined>(undefined);

export function CourseFormProvider({ children }: { children: ReactNode }) {
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  return (
    <CourseFormContext.Provider
      value={{
        hasChanges,
        setHasChanges,
        showCancelDialog,
        setShowCancelDialog,
      }}
    >
      {children}
    </CourseFormContext.Provider>
  );
}

export function useCourseForm() {
  const context = useContext(CourseFormContext);
  if (context === undefined) {
    throw new Error('useCourseForm must be used within a CourseFormProvider');
  }
  return context;
}

