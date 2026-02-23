import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

const SaveProjectSchema = z.object({
  title: z.string(),
  type: z.enum(['recipe', 'pattern']),
  materials: z.array(z.string()),
  instructions: z.array(z.string()),
  tips: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, type, materials, instructions, tips } = SaveProjectSchema.parse(body);

    // Create a new transcript entry for the domestic arts project
    const transcriptEntry = await prisma.transcriptEntry.create({
      data: {
        userId: user.userId,
        activityName: title,
        mappedSubject: 'Domestic Arts',
        creditsEarned: 0, // Will be updated when photo is uploaded
        dateCompleted: new Date(),
        notes: `Type: ${type}\nMaterials: ${materials.join(', ')}\nInstructions: ${instructions.slice(0, 3).join('; ')}`,
        approvedById: user.userId, // Auto-approve for domestic arts projects
      },
    });

    return NextResponse.json({ 
      success: true, 
      projectId: transcriptEntry.id,
      message: 'Project saved successfully' 
    });

  } catch (error) {
    console.error('Save project API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request format', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
