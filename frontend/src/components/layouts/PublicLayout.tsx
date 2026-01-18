import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { AdvisorCard } from '../AI/AdvisorCard';
import { HotlineFloatingButton } from '../HotlineFloatingButton';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();
  
  // Hide AdvisorCard and HotlineButton on instructor admin pages
  const isInstructorRoute = location.pathname.startsWith('/instructor');
  
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* Global AI Advisor entrypoint for all public pages (excluded from instructor admin pages) */}
      {!isInstructorRoute && (
        <>
          <HotlineFloatingButton />
          <AdvisorCard />
        </>
      )}
      <Footer />
    </>
  );
}

