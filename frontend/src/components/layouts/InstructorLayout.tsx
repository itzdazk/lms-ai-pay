import { ReactNode } from 'react';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

interface InstructorLayoutProps {
  children: ReactNode;
}

export function InstructorLayout({ children }: InstructorLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

