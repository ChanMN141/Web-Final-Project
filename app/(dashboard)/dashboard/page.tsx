'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Fetch user to determine role and redirect
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          if (data.user.role === 'SEEKER') {
            router.replace('/dashboard/seeker');
          } else {
            router.replace('/dashboard/provider');
          }
        } else {
             router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-zinc-500">Redirecting to your dashboard...</p>
    </div>
  );
}
