import prisma from '../db';
import { generateText } from 'ai';
import { getModel } from '../ai-models';
import { loadConfig } from '../config';

export interface CharacterGrowthMetrics {
  virtues: VirtueAssessment[];
  spiritualGrowth: SpiritualGrowthMetrics;
  serviceLearning: ServiceLearningMetrics;
  holisticScore: number;
  growthAreas: string[];
  strengths: string[];
}

export interface VirtueAssessment {
  virtue: string;
  category: 'faith' | 'hope' | 'charity' | 'love' | 'patience' | 'kindness' | 'humility' | 'diligence';
  score: number; // 0-1
  evidence: string[];
  lastAssessed: Date;
  trend: 'improving' | 'stable' | 'declining';
}

export interface SpiritualGrowthMetrics {
  prayerConsistency: number; // 0-1
  scriptureUnderstanding: number; // 0-1
  faithExpression: number; // 0-1
  communityInvolvement: number; // 0-1
  spiritualReflections: number;
  lastReflection: Date | null;
}

export interface ServiceLearningMetrics {
  hoursServed: number;
  projectsCompleted: number;
  peopleImpacted: number;
  skillsDeveloped: string[];
  leadershipDemonstrated: number; // 0-1
  compassionScore: number; // 0-1
}

/**
 * Assess character growth from life activities and reflections.
 */
export async function assessCharacterGrowth(
  userId: string
): Promise<CharacterGrowthMetrics> {
  try {
    // Get user's transcript entries and reflections
    const [transcriptEntries, reflections] = await Promise.all([
      prisma.transcriptEntry.findMany({
        where: { userId },
        orderBy: { dateCompleted: 'desc' },
        take: 50,
      }),
      prisma.reflectionEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    // Assess virtues from activities
    const virtues = await assessVirtues(transcriptEntries, reflections);
    
    // Calculate spiritual growth metrics
    const spiritualGrowth = await calculateSpiritualGrowth(reflections, transcriptEntries);
    
    // Calculate service learning metrics
    const serviceLearning = await calculateServiceLearning(transcriptEntries);
    
    // Calculate holistic score
    const holisticScore = calculateHolisticScore(virtues, spiritualGrowth, serviceLearning);
    
    // Identify growth areas and strengths
    const { growthAreas, strengths } = identifyGrowthAreas(virtues, spiritualGrowth, serviceLearning);

    return {
      virtues,
      spiritualGrowth,
      serviceLearning,
      holisticScore,
      growthAreas,
      strengths,
    };
  } catch (error) {
    console.error('[CharacterGrowth] Assessment failed:', error);
    throw new Error('Failed to assess character growth');
  }
}

/**
 * Assess virtues from activities and reflections.
 */
async function assessVirtues(
  transcriptEntries: any[],
  reflections: any[]
): Promise<VirtueAssessment[]> {
  const config = loadConfig();
  const modelId = config.models.default;

  const activities = transcriptEntries.map(entry => ({
    activity: entry.activityName,
    description: entry.notes || '',
    subject: entry.mappedSubject,
    date: entry.dateCompleted,
  }));

  const reflectionTexts = reflections.map(ref => ref.studentResponse || '').join(' ');

  const { text } = await generateText({
    model: getModel(modelId),
    prompt: `Assess character virtues from these student activities and reflections:

Activities:
${activities.map(a => `- ${a.activity} (${a.subject}): ${a.description}`).join('\n')}

Reflections:
${reflectionTexts}

Assess the following virtues on a scale of 0-1:
- Faith: Trust in divine guidance, spiritual conviction
- Hope: Optimism, trust in future possibilities
- Charity: Love for others, selfless giving
- Love: Genuine care for others, empathy
- Patience: Ability to wait calmly, perseverance
- Kindness: Gentle treatment of others, compassion
- Humility: Modesty, recognition of limitations
- Diligence: Hard work, consistent effort

Return JSON with:
{
  "virtues": [
    {
      "virtue": "faith",
      "category": "faith",
      "score": 0.75,
      "evidence": ["Student prayed before starting project", "Expressed trust in process"],
      "trend": "improving"
    }
  ]
}

Focus on evidence from the activities and reflections. Be realistic but encouraging.`,
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(text.trim());
    return (parsed.virtues || []).map((virtue: any) => ({
      virtue: virtue.virtue || 'unknown',
      category: virtue.category || 'love',
      score: typeof virtue.score === 'number' ? virtue.score : 0.5,
      evidence: Array.isArray(virtue.evidence) ? virtue.evidence : [],
      lastAssessed: new Date(),
      trend: virtue.trend || 'stable',
    }));
  } catch (error) {
    console.error('[CharacterGrowth] Failed to parse virtues assessment:', error);
    return [];
  }
}

/**
 * Calculate spiritual growth metrics.
 */
async function calculateSpiritualGrowth(
  reflections: any[],
  transcriptEntries: any[]
): Promise<SpiritualGrowthMetrics> {
  const spiritualActivities = transcriptEntries.filter(entry =>
    entry.mappedSubject === 'Religious Studies' ||
    entry.mappedSubject === 'Spiritual Development' ||
    entry.activityName.toLowerCase().includes('prayer') ||
    entry.activityName.toLowerCase().includes('bible') ||
    entry.activityName.toLowerCase().includes('worship')
  );

  const spiritualReflections = reflections.filter(ref =>
    ref.type === 'POST_ACTIVITY' &&
    (ref.activitySummary?.toLowerCase().includes('faith') ||
     ref.activitySummary?.toLowerCase().includes('spiritual') ||
     ref.aiFollowUp?.toLowerCase().includes('god'))
  );

  const prayerConsistency = Math.min(1, spiritualActivities.length / 10); // Assuming weekly prayers
  const scriptureUnderstanding = Math.min(1, spiritualReflections.length / 5);
  const faithExpression = Math.min(1, spiritualActivities.length / 8);
  const communityInvolvement = Math.min(1, transcriptEntries.filter(entry =>
    entry.activityName.toLowerCase().includes('church') ||
    entry.activityName.toLowerCase().includes('community') ||
    entry.activityName.toLowerCase().includes('service')
  ).length / 6);

  return {
    prayerConsistency,
    scriptureUnderstanding,
    faithExpression,
    communityInvolvement,
    spiritualReflections: spiritualReflections.length,
    lastReflection: spiritualReflections.length > 0 
      ? new Date(spiritualReflections[0].createdAt) 
      : null,
  };
}

/**
 * Calculate service learning metrics.
 */
async function calculateServiceLearning(
  transcriptEntries: any[]
): Promise<ServiceLearningMetrics> {
  const serviceActivities = transcriptEntries.filter(entry =>
    entry.mappedSubject === 'Community Service' ||
    entry.activityName.toLowerCase().includes('volunteer') ||
    entry.activityName.toLowerCase().includes('service') ||
    entry.activityName.toLowerCase().includes('help')
  );

  const hoursServed = serviceActivities.reduce((total, entry) => {
    const metadata = entry.metadata as any;
    return total + (metadata?.duration || 1); // Default 1 hour
  }, 0);

  const projectsCompleted = serviceActivities.length;
  const peopleImpacted = serviceActivities.reduce((total, entry) => {
    const metadata = entry.metadata as any;
    return total + (metadata?.peopleImpacted || 1);
  }, 0);

  const skillsDeveloped = Array.from(new Set(
    serviceActivities.flatMap(entry => {
      const metadata = entry.metadata as any;
      return metadata?.skills || [];
    })
  ));

  const leadershipDemonstrated = Math.min(1, serviceActivities.filter(entry =>
    entry.activityName.toLowerCase().includes('lead') ||
    entry.activityName.toLowerCase().includes('organize')
  ).length / 3);

  const compassionScore = Math.min(1, serviceActivities.filter(entry =>
    entry.activityName.toLowerCase().includes('care') ||
    entry.activityName.toLowerCase().includes('support') ||
    entry.activityName.toLowerCase().includes('help')
  ).length / 4);

  return {
    hoursServed,
    projectsCompleted,
    peopleImpacted,
    skillsDeveloped,
    leadershipDemonstrated,
    compassionScore,
  };
}

/**
 * Calculate holistic character growth score.
 */
function calculateHolisticScore(
  virtues: VirtueAssessment[],
  spiritualGrowth: SpiritualGrowthMetrics,
  serviceLearning: ServiceLearningMetrics
): number {
  const virtueScore = virtues.length > 0 
    ? virtues.reduce((sum, virtue) => sum + virtue.score, 0) / virtues.length 
    : 0;

  const spiritualScore = (
    spiritualGrowth.prayerConsistency +
    spiritualGrowth.scriptureUnderstanding +
    spiritualGrowth.faithExpression +
    spiritualGrowth.communityInvolvement
  ) / 4;

  const serviceScore = (
    serviceLearning.leadershipDemonstrated +
    serviceLearning.compassionScore +
    Math.min(1, serviceLearning.hoursServed / 20) +
    Math.min(1, serviceLearning.projectsCompleted / 5)
  ) / 4;

  // Weighted average: virtues (40%), spiritual (30%), service (30%)
  return (virtueScore * 0.4) + (spiritualScore * 0.3) + (serviceScore * 0.3);
}

/**
 * Identify growth areas and strengths.
 */
function identifyGrowthAreas(
  virtues: VirtueAssessment[],
  spiritualGrowth: SpiritualGrowthMetrics,
  serviceLearning: ServiceLearningMetrics
): { growthAreas: string[]; strengths: string[] } {
  const growthAreas: string[] = [];
  const strengths: string[] = [];

  // Analyze virtues
  virtues.forEach((virtue) => {
    if (virtue.score < 0.5) {
      growthAreas.push(`Develop ${virtue.virtue} - current score: ${(virtue.score * 100).toFixed(0)}%`);
    } else if (virtue.score > 0.8) {
      strengths.push(`Strong in ${virtue.virtue} - score: ${(virtue.score * 100).toFixed(0)}%`);
    }
  });

  // Analyze spiritual growth
  if (spiritualGrowth.prayerConsistency < 0.5) {
    growthAreas.push('Increase prayer consistency');
  } else if (spiritualGrowth.prayerConsistency > 0.8) {
    strengths.push('Consistent prayer life');
  }

  if (spiritualGrowth.scriptureUnderstanding < 0.5) {
    growthAreas.push('Deepen scripture understanding');
  } else if (spiritualGrowth.scriptureUnderstanding > 0.8) {
    strengths.push('Strong scripture comprehension');
  }

  // Analyze service learning
  if (serviceLearning.hoursServed < 10) {
    growthAreas.push('Increase service hours (currently: ' + serviceLearning.hoursServed + ')');
  } else if (serviceLearning.hoursServed > 50) {
    strengths.push('Dedicated service commitment (' + serviceLearning.hoursServed + ' hours)');
  }

  if (serviceLearning.leadershipDemonstrated < 0.5) {
    growthAreas.push('Develop leadership skills');
  } else if (serviceLearning.leadershipDemonstrated > 0.8) {
    strengths.push('Strong leadership abilities');
  }

  return { growthAreas, strengths };
}

/**
 * Generate character growth report.
 */
export async function generateCharacterGrowthReport(
  userId: string
): Promise<string> {
  const metrics = await assessCharacterGrowth(userId);
  const config = loadConfig();
  const modelId = config.models.default;

  const { text } = await generateText({
    model: getModel(modelId),
    prompt: `Generate a character growth report based on these metrics:

Holistic Score: ${(metrics.holisticScore * 100).toFixed(1)}%

Virtues Assessment:
${metrics.virtues.map(v => `- ${virtue.virtue}: ${(v.score * 100).toFixed(1)}% (${v.trend})`).join('\n')}

Spiritual Growth:
- Prayer Consistency: ${(metrics.spiritualGrowth.prayerConsistency * 100).toFixed(1)}%
- Scripture Understanding: ${(metrics.spiritualGrowth.scriptureUnderstanding * 100).toFixed(1)}%
- Faith Expression: ${(metrics.spiritualGrowth.faithExpression * 100).toFixed(1)}%
- Community Involvement: ${(metrics.spiritualGrowth.communityInvolvement * 100).toFixed(1)}%

Service Learning:
- Hours Served: ${metrics.serviceLearning.hoursServed}
- Projects Completed: ${metrics.serviceLearning.projectsCompleted}
- People Impacted: ${metrics.serviceLearning.peopleImpacted}
- Leadership Score: ${(metrics.serviceLearning.leadershipDemonstrated * 100).toFixed(1)}%
- Compassion Score: ${(metrics.serviceLearning.compassionScore * 100).toFixed(1)}%

Strengths:
${metrics.strengths.map(s => `- ${s}`).join('\n')}

Growth Areas:
${metrics.growthAreas.map(g => `- ${g}`).join('\n')}

Write an encouraging report that:
1. Celebrates the student's character development
2. Highlights specific strengths with examples
3. Provides actionable guidance for growth areas
4. Emphasizes spiritual and character formation
5. Uses warm, encouraging tone appropriate for Christian education

Keep it to 300-400 words and end with a scripture verse that relates to their growth journey.`,
    temperature: 0.7,
  });

  return text;
}

/**
 * Track character growth over time.
 */
export async function getCharacterGrowthTrend(
  userId: string,
  months: number = 6
): Promise<{
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'stable' | 'declining';
  monthlyData: Array<{ month: string; score: number }>;
}> {
  // This would typically use historical data
  // For now, return simulated trend data
  const currentMetrics = await assessCharacterGrowth(userId);
  const currentScore = currentMetrics.holisticScore;
  
  // Simulate historical data (in production, this would query actual historical assessments)
  const monthlyData = Array.from({ length: months }, (_, i) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (months - 1 - i));
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Simulate gradual improvement
    const baseScore = currentScore * 0.7;
    const improvement = (i / months) * (currentScore - baseScore);
    const randomVariation = (Math.random() - 0.5) * 0.1;
    
    return {
      month: monthName,
      score: Math.max(0, Math.min(1, baseScore + improvement + randomVariation)),
    };
  }).reverse();

  const previousScore = monthlyData[0]?.score || currentScore;
  const trend = currentScore > previousScore + 0.05 ? 'improving' : 
                  currentScore < previousScore - 0.05 ? 'declining' : 'stable';

  return {
    currentScore,
    previousScore,
    trend,
    monthlyData,
  };
}
