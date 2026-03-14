import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { ChatOpenAI } from '@langchain/openai';
import { loadConfig } from '@/lib/config';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const group = await prisma.scienceGroup.findUnique({
    where: { id },
    include: { memberships: { include: { user: { select: { id: true, name: true } } } } },
  });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const recentMessages = await prisma.groupMessage.findMany({
    where: { groupId: id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (recentMessages.length < 3) {
    return NextResponse.json({ mediated: false, reason: 'Not enough messages to mediate' });
  }

  const memberNames = group.memberships.map(m => m.user.name);
  const messageSummary = recentMessages
    .reverse()
    .map(m => `${m.author.name}: ${m.content}`)
    .join('\n');

  const participantCounts: Record<string, number> = {};
  for (const msg of recentMessages) {
    participantCounts[msg.author.name] = (participantCounts[msg.author.name] || 0) + 1;
  }

  const config = loadConfig();
  const llm = new ChatOpenAI({ model: config.models.default || 'gpt-4o-mini', temperature: 0.7 });

  const result = await llm.invoke([
    {
      role: 'system',
      content: `You are Adeline, a wise and caring learning coach mediating a student science group called "${group.name}" focused on: ${group.focus}.

Group members: ${memberNames.join(', ')}
Current challenge: ${group.currentChallenge}

MEDIATION GUIDELINES:
- Detect issues: groupthink, unequal participation, students getting stuck, off-topic drift, conflict
- If one student is dominating (>50% of messages), gently invite others
- If no one has spoken in a while, ask an engaging question
- If the group seems stuck, offer a Socratic nudge — never give the answer outright
- Be warm, encouraging, brief (2-3 sentences max)
- Speak AS A GROUP MEMBER, not as a teacher figure

Participation stats: ${JSON.stringify(participantCounts)}`,
    },
    {
      role: 'user',
      content: `Recent group conversation:\n${messageSummary}\n\nDoes this group need mediation? If yes, provide a brief, natural message to improve group dynamics. If no mediation is needed, respond with exactly: NO_MEDIATION_NEEDED`,
    },
  ]);

  const responseText = (result.content as string).trim();

  if (responseText === 'NO_MEDIATION_NEEDED') {
    return NextResponse.json({ mediated: false, reason: 'Group dynamics are healthy' });
  }

  const mediationMessage = await prisma.groupMessage.create({
    data: {
      groupId: id,
      authorId: user.userId,
      content: `💡 Adeline: ${responseText}`,
      aiMediated: true,
    },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });

  return NextResponse.json({ mediated: true, message: mediationMessage });
}
