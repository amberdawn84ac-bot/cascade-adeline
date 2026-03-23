/**
 * Tree Data API
 * 
 * Fetches student's learning tree: branches (8 tracks), leaves (standards), 
 * and progress (mastery levels). Adapts visualization to grade level.
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

    // Get student data
    const student = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        standardsProgress: {
          include: {
            standard: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Determine grade band for tree visual
    const gradeBand = getGradeBand(student.gradeLevel);

    // Get all standards for this grade level (the "leaves")
    const allStandards = await prisma.stateStandard.findMany({
      where: {
        gradeLevel: student.gradeLevel || '5th'
      },
      orderBy: {
        subject: 'asc'
      }
    });

    // Map standards to the 8 tracks
    const branches = mapStandardsToTracks(allStandards, student.standardsProgress);

    // Calculate overall progress
    const totalLeaves = allStandards.length;
    const masteredLeaves = student.standardsProgress.filter(
      (sp: any) => sp.mastery === 'MASTERED'
    ).length;
    const progressPercent = totalLeaves > 0 
      ? Math.round((masteredLeaves / totalLeaves) * 100)
      : 0;

    // Get recent growth (standards mastered in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentGrowth = student.standardsProgress.filter(
      (sp: any) => sp.demonstratedAt >= thirtyDaysAgo
    ).length;

    return NextResponse.json({
      gradeBand,
      gradeLevel: student.gradeLevel,
      branches,
      progress: {
        total: totalLeaves,
        mastered: masteredLeaves,
        percent: progressPercent,
        recentGrowth
      },
      visualConfig: getVisualConfig(gradeBand)
    });

  } catch (error) {
    console.error('[Tree Data] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tree data' },
      { status: 500 }
    );
  }
}

/**
 * Determine visual grade band (K-2, 3-5, 6-8, 9-12)
 */
function getGradeBand(gradeLevel?: string | null): string {
  if (!gradeLevel) return 'elementary';
  
  const grade = gradeLevel.toLowerCase();
  
  if (['k', 'kindergarten', '1st', '2nd'].includes(grade)) {
    return 'seedling'; // K-2
  }
  if (['3rd', '4th', '5th'].includes(grade)) {
    return 'young-tree'; // 3-5
  }
  if (['6th', '7th', '8th'].includes(grade)) {
    return 'growing-tree'; // 6-8
  }
  if (['9th', '10th', '11th', '12th'].includes(grade)) {
    return 'mature-oak'; // 9-12
  }
  
  return 'young-tree'; // Default
}

/**
 * Map standards to the 8 subject tracks
 */
function mapStandardsToTracks(
  allStandards: any[],
  studentProgress: any[]
): any[] {
  const trackMap: Record<string, string[]> = {
    'gods-creation-science': ['Science', 'NGSS'],
    'health-naturopathy': ['Health', 'PE'],
    'food-systems': ['Science', 'NGSS', 'Agriculture'],
    'government-economics': ['Social Studies', 'Economics', 'Government'],
    'justice-changemaking': ['Social Studies', 'History'],
    'discipleship-cultural-discernment': ['Social Studies', 'Ethics'],
    'truth-based-history': ['History', 'Social Studies'],
    'english-literature': ['English', 'ELA', 'Reading', 'Writing']
  };

  const branches = Object.keys(trackMap).map(track => {
    // Find standards that belong to this track
    const trackSubjects = trackMap[track];
    const trackStandards = allStandards.filter(standard =>
      trackSubjects.some(subject => 
        standard.subject.includes(subject) || 
        standard.standardCode.includes(subject)
      )
    );

    // Map to leaves with mastery status
    const leaves = trackStandards.map(standard => {
      const progress = studentProgress.find(
        sp => sp.standardId === standard.id
      );

      return {
        id: standard.id,
        standardCode: standard.standardCode,
        description: standard.statementText,
        mastery: progress?.mastery || 'NOT_STARTED',
        demonstratedAt: progress?.demonstratedAt,
        microcredits: progress?.microcreditsEarned || 0
      };
    });

    // Calculate branch progress
    const masteredCount = leaves.filter(l => l.mastery === 'MASTERED').length;
    const proficientCount = leaves.filter(l => l.mastery === 'PROFICIENT').length;
    const practicingCount = leaves.filter(l => l.mastery === 'PRACTICING').length;

    return {
      track,
      displayName: getTrackDisplayName(track),
      color: getTrackColor(track),
      icon: getTrackIcon(track),
      leaves,
      progress: {
        total: leaves.length,
        mastered: masteredCount,
        proficient: proficientCount,
        practicing: practicingCount,
        percent: leaves.length > 0 
          ? Math.round((masteredCount / leaves.length) * 100)
          : 0
      }
    };
  });

  return branches;
}

/**
 * Get display-friendly track names
 */
function getTrackDisplayName(track: string): string {
  const names: Record<string, string> = {
    'gods-creation-science': "God's Creation & Science",
    'health-naturopathy': 'Health & Naturopathy',
    'food-systems': 'Food Systems & Stewardship',
    'government-economics': 'Government & Economics',
    'justice-changemaking': 'Justice & Change-Making',
    'discipleship-cultural-discernment': 'Discipleship & Discernment',
    'truth-based-history': 'Truth-Based History',
    'english-literature': 'English & Literature'
  };
  return names[track] || track;
}

/**
 * Get color for each track
 */
function getTrackColor(track: string): string {
  const colors: Record<string, string> = {
    'gods-creation-science': '#7BA05B', // Forest green
    'health-naturopathy': '#FF7F11', // Neon orange
    'food-systems': '#D4A574', // Golden wheat
    'government-economics': '#6A4C93', // Deep purple
    'justice-changemaking': '#FF006E', // Neon fuschia
    'discipleship-cultural-discernment': '#8B4513', // Saddle brown
    'truth-based-history': '#CD853F', // Peru
    'english-literature': '#4B0082' // Indigo
  };
  return colors[track] || '#7BA05B';
}

/**
 * Get emoji icon for each track
 */
function getTrackIcon(track: string): string {
  const icons: Record<string, string> = {
    'gods-creation-science': '🌿',
    'health-naturopathy': '🌱',
    'food-systems': '🌾',
    'government-economics': '⚖️',
    'justice-changemaking': '✊',
    'discipleship-cultural-discernment': '📖',
    'truth-based-history': '📜',
    'english-literature': '✍️'
  };
  return icons[track] || '🌳';
}

/**
 * Get visual configuration based on grade band
 */
function getVisualConfig(gradeBand: string) {
  const configs: Record<string, any> = {
    'seedling': {
      treeHeight: 400,
      trunkWidth: 30,
      branchCount: 8,
      maxLeavesPerBranch: 5,
      leafSize: 'large', // Big, simple leaves for K-2
      complexity: 'simple'
    },
    'young-tree': {
      treeHeight: 500,
      trunkWidth: 40,
      branchCount: 8,
      maxLeavesPerBranch: 10,
      leafSize: 'medium',
      complexity: 'moderate'
    },
    'growing-tree': {
      treeHeight: 600,
      trunkWidth: 50,
      branchCount: 8,
      maxLeavesPerBranch: 15,
      leafSize: 'small',
      complexity: 'detailed'
    },
    'mature-oak': {
      treeHeight: 700,
      trunkWidth: 60,
      branchCount: 8,
      maxLeavesPerBranch: 20,
      leafSize: 'tiny',
      complexity: 'complex'
    }
  };

  return configs[gradeBand] || configs['young-tree'];
}
