import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get user session
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's domestic arts projects from transcript entries
    const projects = await prisma.transcriptEntry.findMany({
      where: {
        userId: user.userId,
        mappedSubject: 'Domestic Arts',
        approvedById: { not: null },
      },
      select: {
        id: true,
        activityName: true,
        notes: true,
        creditsEarned: true,
        dateCompleted: true,
      },
      orderBy: {
        dateCompleted: 'desc',
      },
    });

    // Format the projects for the frontend
    const formattedProjects = projects.map((entry) => {
      // Parse the notes to extract project details
      let type = 'recipe';
      let materials: string[] = [];
      let instructions: string[] = [];
      let tips: string[] = [];

      if (entry.notes) {
        const notes = entry.notes;
        
        // Extract type
        const typeMatch = notes.match(/Type: (\w+)/);
        if (typeMatch) {
          type = typeMatch[1].toLowerCase() as 'recipe' | 'pattern';
        }

        // Extract materials
        const materialsMatch = notes.match(/Materials: ([^\n]+)/);
        if (materialsMatch) {
          materials = materialsMatch[1].split(', ').map(m => m.trim());
        }

        // Extract instructions
        const instructionsMatch = notes.match(/Instructions: ([^\n]+)/);
        if (instructionsMatch) {
          instructions = instructionsMatch[1].split('; ').map(i => i.trim());
        }
      }

      return {
        id: entry.id,
        title: entry.activityName,
        type,
        materials,
        instructions,
        tips,
        createdAt: entry.dateCompleted,
        creditsAwarded: Number(entry.creditsEarned),
        photo: undefined, // Will be added when photo upload is implemented
      };
    });

    return NextResponse.json({ projects: formattedProjects });

  } catch (error) {
    console.error('Journal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

