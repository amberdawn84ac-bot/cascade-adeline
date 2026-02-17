import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { TranscriptCard } from '@/components/gen-ui/TranscriptCard';
import { WheatDivider, VineDivider, DottedArrow } from '@/components/illustrations';
import { getSessionUser } from '@/lib/auth';

function SectionHeader({ title, accent }: { title: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 24 }}>
      <DottedArrow size={140} color={accent || '#BD6809'} />
      <h2
        style={{
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
          color: accent || '#BD6809',
          fontSize: '1.2rem',
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function GapBadge({ text, addressed }: { text: string; addressed: boolean }) {
  return (
    <span
      style={{
        background: addressed ? '#D4EDDA' : '#FFE4EC',
        color: addressed ? '#2F4731' : '#9A3F4A',
        padding: '4px 8px',
        borderRadius: 999,
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        fontSize: '0.85rem',
        fontWeight: 700,
      }}
    >
      {text} {addressed ? '✓' : '•'}
    </span>
  );
}

function ProjectBadge({ title, status }: { title: string; status: string }) {
  const statusColor: Record<string, string> = {
    BRAINSTORM: '#BD6809',
    ACTIVE: '#2F4731',
    COMPLETED: '#3D1419',
    SHOWCASED: '#6F42C1',
  };
  return (
    <div
      style={{
        border: `1px solid ${(statusColor[status] || '#2F4731')}33`,
        borderRadius: 12,
        padding: '8px 10px',
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: '#121B13', fontWeight: 700 }}>{title}</span>
        <span
          style={{
            background: `${statusColor[status] || '#2F4731'}12`,
            color: statusColor[status] || '#2F4731',
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function StandardsProgress({ standards }: { standards: any[] }) {
  const stats = {
    math: { total: 0, mastered: 0 },
    ela: { total: 0, mastered: 0 },
    science: { total: 0, mastered: 0 },
    social: { total: 0, mastered: 0 },
  };

  standards.forEach((s) => {
    const subj = s.standard.subject.toLowerCase();
    const isMastered = s.mastery === 'MASTERED' || s.mastery === 'PROFICIENT';
    
    if (subj.includes('math')) { stats.math.total++; if (isMastered) stats.math.mastered++; }
    else if (subj.includes('english') || subj.includes('ela')) { stats.ela.total++; if (isMastered) stats.ela.mastered++; }
    else if (subj.includes('science')) { stats.science.total++; if (isMastered) stats.science.mastered++; }
    else { stats.social.total++; if (isMastered) stats.social.mastered++; }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
      {Object.entries(stats).map(([key, stat]) => (
        <div key={key} className="bg-white border border-[#E7DAC3] rounded-xl p-3 text-center">
          <div className="text-xs uppercase font-bold text-[#BD6809] mb-1">{key === 'social' ? 'History' : key}</div>
          <div className="text-2xl font-bold text-[#2F4731]" style={{ fontFamily: 'var(--font-emilys-candy)' }}>
            {stat.mastered} <span className="text-sm text-[#2F4731]/40">/ {stat.total || '-'}</span>
          </div>
          <div className="text-[10px] text-[#2F4731]/60 font-bold mt-1">OK Standards</div>
        </div>
      ))}
    </div>
  );
}

export default async function ParentDashboard() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    redirect('/login');
  }
  if (sessionUser.role !== 'PARENT') {
    return <div style={{ padding: 24 }}>Unauthorized.</div>;
  }

  const parent = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      name: true,
      children: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          projects: true,
          standardsProgress: {
            include: { standard: true }
          },
          transcriptEntries: {
            orderBy: { dateCompleted: 'desc' },
            take: 5,
            select: { id: true, activityName: true, mappedSubject: true, creditsEarned: true, notes: true, createdAt: true },
          },
          learningGaps: {
            select: {
              id: true,
              addressed: true,
              severity: true,
              concept: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return <div style={{ padding: 24 }}>Parent not found.</div>;
  }

  return (
    <div
      style={{
        background: '#FFFEF7',
        minHeight: '100vh',
        padding: '24px 28px',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        color: '#121B13',
      }}
    >
      <h1 style={{ fontFamily: '"Emilys Candy", cursive', color: '#BD6809', fontSize: '2rem', marginBottom: 12 }}>
        Parent Dashboard — {parent.name}
      </h1>
      <WheatDivider size={200} color="#BD6809" />

      <div style={{ display: 'grid', gap: 24, marginTop: 24 }}>
        {parent.children.map((child: any) => (
          <div
            key={child.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 24,
              padding: '24px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-emilys-candy)' }}>{child.name}</div>
                <div style={{ color: '#4B3424' }}>Grade: {child.gradeLevel || '—'}</div>
              </div>
              <VineDivider size={120} color="#2F4731" />
            </div>

            <SectionHeader title="Oklahoma Standards Compliance" accent="#2F4731" />
            <StandardsProgress standards={child.standardsProgress} />

            <SectionHeader title="Recent Transcript Entries" accent="#BD6809" />
            <div style={{ display: 'grid', gap: 10 }}>
              {child.transcriptEntries.length === 0 ? (
                <div style={{ color: '#4B3424' }}>No entries yet.</div>
              ) : (
                child.transcriptEntries.map((entry: any) => (
                  <div key={entry.id} style={{ position: 'relative' }}>
                    <TranscriptCard
                      activityName={entry.activityName}
                      mappedSubjects={[entry.mappedSubject]}
                      creditsEarned={entry.creditsEarned.toString()}
                      extensionSuggestion={entry.notes || undefined}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <SectionHeader title="Active Projects" accent="#2F4731" />
                <div style={{ display: 'grid', gap: 8 }}>
                  {child.projects.length === 0 ? (
                    <div style={{ color: '#4B3424' }}>No projects yet.</div>
                  ) : (
                    child.projects.map((p: any) => <ProjectBadge key={p.id} title={p.title} status={p.status} />)
                  )}
                </div>
              </div>

              <div>
                <SectionHeader title="Learning Gaps" accent="#9A3F4A" />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {child.learningGaps.length === 0 ? (
                    <div style={{ color: '#4B3424' }}>No gaps detected.</div>
                  ) : (
                    child.learningGaps.map((gap: any) => (
                      <GapBadge key={gap.id} text={gap.concept.name} addressed={gap.addressed} />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
