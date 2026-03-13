import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const photo = formData.get('photo') as File;
    const projectTitle = formData.get('projectTitle') as string;
    const category = formData.get('category') as string;
    const difficulty = formData.get('difficulty') as string;
    const projectYield = formData.get('yield') as string;

    if (!photo || !projectTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upload photo to Vercel Blob
    const blob = await put(`homesteading/${user.userId}/${Date.now()}-${photo.name}`, photo, {
      access: 'public',
    });

    // Calculate credits based on difficulty
    const creditsMap: Record<string, number> = {
      'Beginner': 0.25,
      'Intermediate': 0.5,
      'Advanced': 0.75,
    };
    const creditsEarned = creditsMap[difficulty] || 0.25;

    // Create transcript entry
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: projectTitle,
        mappedSubject: 'Homesteading',
        creditsEarned,
        dateCompleted: new Date(),
        metadata: {
          category,
          difficulty,
          yield: projectYield,
          photoUrl: blob.url,
          type: 'homesteading-project',
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      transcriptEntry,
      message: 'Project added to transcript successfully!' 
    });

  } catch (error) {
    console.error('[domestic-arts/complete] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
