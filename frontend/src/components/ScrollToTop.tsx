import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Store scroll positions for dashboard
const dashboardScrollPosition = { position: 0 };

export function ScrollToTop() {
  const { pathname, state } = useLocation();
  const prevPathnameRef = useRef<string>('');

  useEffect(() => {
    const prevPathname = prevPathnameRef.current;
    
    // Save scroll position when leaving dashboard
    if (prevPathname === '/instructor/dashboard' && pathname !== '/instructor/dashboard') {
      dashboardScrollPosition.position = window.scrollY;
    }
    
    // Check if we should preserve scroll position (from state or navigating back from create/edit)
    const preserveScroll = state?.preserveScroll || 
      (prevPathname.includes('/instructor/courses/create') && pathname === '/instructor/dashboard') ||
      (prevPathname.includes('/instructor/courses/') && prevPathname.includes('/edit') && pathname === '/instructor/dashboard');
    
    if (preserveScroll && pathname === '/instructor/dashboard') {
      // Restore scroll position for dashboard
      setTimeout(() => {
        window.scrollTo({
          top: dashboardScrollPosition.position,
          left: 0,
          behavior: 'auto',
        });
      }, 0);
    } else if (!preserveScroll) {
      // Scroll to top for other navigation
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname, state]);

  return null;
}