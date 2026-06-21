'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.rol !== 'admin') {
      router.replace('/');
    }
  }, [isAuthenticated, loading, router, user?.rol]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-escolar-sky border-t-escolar-navy" />
      </div>
    );
  }

  if (!isAuthenticated || user?.rol !== 'admin') {
    return null;
  }

  return children;
}
