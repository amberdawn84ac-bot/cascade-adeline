import React from 'react';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { TranscriptCard } from '@/components/gen-ui/TranscriptCard';
import { WheatDivider, VineDivider, DottedArrow } from '@/components/illustrations';
import { getSessionUser } from '@/lib/auth';

function SectionHeader({ title, accent }: { title: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
          transcriptEntries: {
            orderBy: { dateCompleted: 'desc' },
            take: 20,
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

      <div style={{ display: 'grid', gap: 20, marginTop: 16 }}>
        {parent.children.map((child: any) => (
          <div
            key={child.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E7DAC3',
              borderRadius: 16,
              padding: '14px 16px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{child.name}</div>
                <div style={{ color: '#4B3424' }}>Grade: {child.gradeLevel || '—'}</div>
              </div>
              <VineDivider size={120} color="#2F4731" />
            </div>

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
                    <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', gap: 8 }}>
                      <button
                        style={{
                          background: '#D4EDDA',
                          color: '#2F4731',
                          border: '1px solid #2F4731',
                          borderRadius: 8,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                      <button
                        style={{
                          background: '#FFE4EC',
                          color: '#9A3F4A',
                          border: '1px solid #9A3F4A',
                          borderRadius: 8,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        Flag
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <SectionHeader title="Active Projects" accent="#2F4731" />
            <div style={{ display: 'grid', gap: 8 }}>
              {child.projects.length === 0 ? (
                <div style={{ color: '#4B3424' }}>No projects yet.</div>
              ) : (
                child.projects.map((p: any) => <ProjectBadge key={p.id} title={p.title} status={p.status} />)
              )}
            </div>

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
        ))}
      </div>
    </div>
  );
}
