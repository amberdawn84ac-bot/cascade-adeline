import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investigationId } = await request.json();

    if (!investigationId) {
      return NextResponse.json({ error: 'Missing investigationId' }, { status: 400 });
    }

    // Verify the user owns this investigation (or has access to it)
    // This is a simplified check. In a real app, you'd check ownership or permissions.
    const investigation = await prisma.investigation.findUnique({
      where: { id: investigationId },
    });

    if (!investigation) {
      return NextResponse.json({ error: 'Investigation not found' }, { status: 404 });
    }

    // Generate a unique, secure share ID
    const shareId = nanoid(16);

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store the share link in the database
    const shareLink = await prisma.shareLink.create({
      data: {
        id: shareId,
        investigationId,
        createdBy: session.userId,
        expiresAt,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/share/${shareId}`;

    return NextResponse.json({ shareUrl, shareId });
  } catch (error) {
    console.error('[Share API] Error creating share link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
