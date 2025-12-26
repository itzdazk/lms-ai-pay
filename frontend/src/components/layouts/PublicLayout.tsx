import { ReactNode } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { AdvisorCard } from '../AI/AdvisorCard';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* Global AI Advisor entrypoint for all public pages (excluded from lesson layout) */}
      <AdvisorCard />
      <Footer />
    </>
  );
}

