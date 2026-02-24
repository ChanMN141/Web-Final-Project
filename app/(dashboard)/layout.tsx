import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Navbar from '@/components/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect('/login');
  }

  await connectToDatabase();
  const dbUser = await User.findById(decoded.userId).lean();
  if (!dbUser) {
    redirect('/login');
  }

  const user = {
    name: (dbUser as { name: string }).name,
    email: (dbUser as { email: string }).email,
    role: (dbUser as { role: 'SEEKER' | 'PROVIDER' }).role,
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
