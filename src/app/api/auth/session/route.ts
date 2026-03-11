import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      userId: sessionUser.userId,
      role: sessionUser.role,
      email: sessionUser.email
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

