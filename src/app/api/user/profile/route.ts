import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get full user data including name
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.userId },
      select: { name: true }
    });

    const firstName = user?.name?.split(' ')[0] || 'Student';

    return NextResponse.json({
      userId: sessionUser.userId,
      firstName,
      email: sessionUser.email,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
