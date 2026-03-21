"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen, Calculator, FlaskConical, Globe, Wrench, Loader2, GraduationCap, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// ─── Types (mirror standardsProgress.ts shape) ───────────────────────────────

interface StandardEntry {
  id: string;
  code: string;
  statement: string;
  mastery: string;
  masteryPct: number;
  demonstratedAt: string | null;
}

interface DomainGroup {
  domainCode: string;
  domainLabel: string;
  standards: StandardEntry[];
  summary: { total: number; mastered: number; pct: number };
}

interface SubjectTab {
  subject: string;
  gradeLevel: number;
  gradeName: string;
  domains: DomainGroup[];
  summary: { total: number; mastered: number; pct: number };
}

interface ProgressResult {
  studentName: string;
  tabs: SubjectTab[];
  overallSummary: { total: number; mastered: number; pct: number };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Mathematics':            Calculator,
  'English Language Arts':  BookOpen,
  'Science':                FlaskConical,
  'Social Studies':         Globe,
  'Practical Arts':         Wrench,
};

const MASTERY_BADGE: Record<string, { label: string; cls: string }> = {
  MASTERED:    { label: 'Mastered',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PROFICIENT:  { label: 'Proficient',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  DEVELOPING:  { label: 'Developing',  cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  INTRODUCED:  { label: 'Introduced',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  NOT_STARTED: { label: 'Not started', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

// ─── Domain group (collapsible) ───────────────────────────────────────────────

function DomainSection({ domain }: { domain: DomainGroup }) {
  const [open, setOpen] = useState(false);
  const { summary } = domain;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800 text-sm">{domain.domainLabel}</span>
          <span className="ml-2 text-xs text-gray-400">{summary.mastered}/{summary.total} met</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Progress value={summary.pct} className="w-24 h-2" />
          <span className="text-xs font-semibold text-gray-600 w-9 text-right">{summary.pct}%</span>
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-gray-100">
          {domain.standards.map((s) => {
            const met = s.mastery === 'MASTERED' || s.mastery === 'PROFICIENT';
            const badge = MASTERY_BADGE[s.mastery] ?? MASTERY_BADGE.NOT_STARTED;
            return (
              <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 shrink-0">
                  {met
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <Circle className="w-5 h-5 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{s.statement}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{s.code}</p>
                  {s.demonstratedAt && (
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Demonstrated {new Date(s.demonstratedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${badge.cls}`}>
                  {badge.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface StandardsChecklistProps {
  studentId?: string;
  jurisdiction?: string;
}

export function StandardsChecklist({ studentId, jurisdiction = 'Oklahoma' }: StandardsChecklistProps) {
  const [data, setData] = useState<ProgressResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ jurisdiction });
    if (studentId) params.set('studentId', studentId);
    fetch(`/api/standards/progress?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json() as Promise<ProgressResult>;
      })
      .then(setData)
      .catch(() => setError('Could not load standards. Please try again.'))
      .finally(() => setLoading(false));
  }, [studentId, jurisdiction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        <span className="text-gray-500 text-sm">Loading standards checklist…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.tabs.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="py-12 text-center">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No standards loaded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Standards are loaded automatically when a grade level is set in Settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { tabs, overallSummary, studentName } = data;

  return (
    <div className="w-full space-y-5">
      {/* Overall header card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-blue-900 text-base">
                  {studentName}&apos;s Standards Progress
                </h3>
              </div>
              <p className="text-xs text-blue-600">
                {jurisdiction} Academic Standards · {overallSummary.total} standards tracked
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">{overallSummary.pct}%</div>
              <div className="text-xs text-blue-500">{overallSummary.mastered} met</div>
            </div>
          </div>
          <Progress value={overallSummary.pct} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Subject tabs */}
      <Tabs defaultValue={tabs[0]?.subject} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-100 p-1 rounded-xl mb-1">
          {tabs.map((tab) => {
            const Icon = SUBJECT_ICONS[tab.subject] ?? BookOpen;
            return (
              <TabsTrigger
                key={tab.subject}
                value={tab.subject}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.subject.replace('English Language Arts', 'ELA')}</span>
                <Badge variant="outline" className="ml-1 text-xs py-0 px-1.5 border-gray-300">
                  {tab.gradeName.replace('Kindergarten', 'K').replace('Grade ', 'G')}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.subject} value={tab.subject} className="mt-3">
            {/* Subject summary row */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <span className="font-semibold text-gray-800">{tab.subject}</span>
                <span className="ml-2 text-sm text-gray-500">— {tab.gradeName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={tab.summary.pct} className="w-28 h-2" />
                <span className="text-sm font-bold text-gray-700">{tab.summary.pct}%</span>
              </div>
            </div>

            {/* Domain groups */}
            {tab.domains.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No standards in this subject yet.</p>
            ) : (
              tab.domains.map((domain) => (
                <DomainSection key={domain.domainCode} domain={domain} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
