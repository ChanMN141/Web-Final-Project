import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Get token from cookie
    const cookieHeader = request.headers.get('cookie');
    const cookies = Object.fromEntries(
        (cookieHeader || '').split('; ').map(c => {
            const [key, ...v] = c.split('=');
            return [key, v.join('=')];
        })
    );
    const token = cookies['auth-token'];

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
