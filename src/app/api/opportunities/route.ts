/**
 * Opportunities API
 * 
 * Fetches real-world opportunities for students:
 * - Spelling bees
 * - Contests and competitions
 * - Grants and scholarships
 * - Academic events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's grade level to filter appropriate opportunities
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { gradeLevel: true }
    });

    const category = req.nextUrl.searchParams.get('category');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    // Build query filters
    const where: any = {
      isActive: true,
      deadline: {
        gte: new Date() // Only show opportunities with future deadlines
      }
    };

    if (category) {
      where.type = category.toUpperCase();
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: [
        { deadline: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Group by type for easier display
    const grouped = opportunities.reduce((acc: any, opp) => {
      if (!acc[opp.type]) {
        acc[opp.type] = [];
      }
      acc[opp.type].push(opp);
      return acc;
    }, {});

    return NextResponse.json({
      opportunities,
      grouped,
      total: opportunities.length
    });

  } catch (error) {
    console.error('[Opportunities API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add new opportunity (for admin/scraper use)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    
    const body = await req.json();
    
    const opportunity = await prisma.opportunity.create({
      data: {
        title: body.title,
        type: body.type,
        description: body.description,
        url: body.url,
        deadline: body.deadline ? new Date(body.deadline) : null,
        ageRange: body.ageRange,
        matchedInterests: body.matchedInterests || [],
        isActive: body.isActive !== undefined ? body.isActive : true,
        createdById: user.userId
      }
    });

    return NextResponse.json(opportunity);

  } catch (error) {
    console.error('[Opportunities API] Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}
