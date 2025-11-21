'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getAuthToken } from '../lib/auth';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // Public pages that don't require authentication
  const publicPages = ['/login', '/register', '/'];

  useEffect(() => {
    setMounted(true);
    const token = getAuthToken();
    const isAuth = !!token;
    setIsAuthenticated(isAuth);

    // Redirect logic after component is mounted
    if (mounted) {
      const isPublicPage = publicPages.includes(pathname);
      
      if (!isAuth && !isPublicPage) {
        // Not authenticated and trying to access protected page - redirect to login
        router.push('/login');
        return;
      }
      
      if (isAuth && pathname === '/') {
        // Authenticated user on landing page - redirect to dashboard
        router.push('/dashboard');
        return;
      }
    }
  }, [pathname, mounted, router]);

  // Prevent hydration mismatch - show loading until mounted
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Public pages (login, register, landing) - no sidebar
  const shouldShowPublicLayout = publicPages.includes(pathname) || !isAuthenticated;

  if (shouldShowPublicLayout) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  // Authenticated app layout with sidebar
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
