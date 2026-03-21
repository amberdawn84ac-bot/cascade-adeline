"use client";

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, BookOpen, Calculator, FlaskConical, Globe, Wrench, ChevronDown, ChevronRight } from 'lucide-react';

interface StandardEntry {
  id: string;
  code: string;
  statement: string;
  mastery: string;
  demonstratedAt: string | null;
}

interface ProgressSummary {
  total: number;
  mastered: number;
  proficient: number;
  developing: number;
  introduced: number;
  notStarted: number;
}

interface ProgressResponse {
  summary: ProgressSummary;
  bySubjectAndGrade: Record<string, Record<string, StandardEntry[]>>;
}

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Mathematics': Calculator,
  'English Language Arts': BookOpen,
  'Science': FlaskConical,
  'Social Studies': Globe,
  'Practical Arts': Wrench,
};

const MASTERY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: 'check' | 'circle' }> = {
  MASTERED:    { label: 'Mastered',    color: 'text-emerald-700', bg: 'bg-emerald-100',  icon: 'check' },
  PROFICIENT:  { label: 'Proficient',  color: 'text-blue-700',   bg: 'bg-blue-100',    icon: 'check' },
  DEVELOPING:  { label: 'Developing',  color: 'text-amber-700',  bg: 'bg-amber-100',   icon: 'circle' },
  INTRODUCED:  { label: 'Introduced',  color: 'text-orange-700', bg: 'bg-orange-100',  icon: 'circle' },
  NOT_STARTED: { label: 'Not started', color: 'text-gray-400',   bg: 'bg-gray-100',    icon: 'circle' },
};

function MasteryBadge({ mastery }: { mastery: string }) {
  const cfg = MASTERY_CONFIG[mastery] ?? MASTERY_CONFIG.NOT_STARTED;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} shrink-0`}>
      {cfg.icon === 'check'
        ? <CheckCircle2 className="w-3 h-3" />
        : <Circle className="w-3 h-3" />}
      {cfg.label}
    </span>
  );
}

function GradeSection({ grade, standards }: { grade: string; standards: StandardEntry[] }) {
  const [open, setOpen] = useState(false);
  const mastered = standards.filter((s) => s.mastery === 'MASTERED' || s.mastery === 'PROFICIENT').length;
  const pct = standards.length > 0 ? Math.round((mastered / standards.length) * 100) : 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="font-semibold text-gray-800 text-sm">Grade {grade}</span>
          <span className="text-xs text-gray-500">{standards.length} standards</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
        </div>
      </button>

      {open && (
        <ul className="divide-y divide-gray-100">
          {standards.map((s) => (
            <li key={s.id} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5">
                {s.mastery === 'MASTERED' || s.mastery === 'PROFICIENT'
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-snug">{s.statement}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{s.code}</p>
              </div>
              <MasteryBadge mastery={s.mastery} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubjectSection({ subject, gradeMap }: { subject: string; gradeMap: Record<string, StandardEntry[]> }) {
  const [open, setOpen] = useState(true);
  const Icon = SUBJECT_ICONS[subject] ?? BookOpen;
  const allStandards = Object.values(gradeMap).flat();
  const mastered = allStandards.filter((s) => s.mastery === 'MASTERED' || s.mastery === 'PROFICIENT').length;
  const grades = Object.keys(gradeMap).sort((a, b) => {
    if (a === 'K') return -1;
    if (b === 'K') return 1;
    return (parseInt(a) || 99) - (parseInt(b) || 99);
  });

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 mb-3 text-left group"
      >
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors">{subject}</h3>
          <p className="text-xs text-gray-500">{mastered} of {allStandards.length} standards met</p>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="pl-2">
          {grades.map((grade) => (
            <GradeSection key={grade} grade={grade} standards={gradeMap[grade]} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StandardsChecklist({ jurisdiction = 'Oklahoma' }: { jurisdiction?: string }) {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('All');

  useEffect(() => {
    const url = `/api/standards/progress?jurisdiction=${encodeURIComponent(jurisdiction)}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json() as Promise<ProgressResponse>;
      })
      .then(setData)
      .catch(() => setError('Could not load standards. Please try again.'))
      .finally(() => setLoading(false));
  }, [jurisdiction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-500 text-sm">Loading standards checklist…</span>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-500 text-sm text-center py-8">{error ?? 'No data'}</p>;
  }

  const { summary, bySubjectAndGrade } = data;
  const subjects = Object.keys(bySubjectAndGrade);
  const allSubjects = ['All', ...subjects];
  const overallPct = summary.total > 0
    ? Math.round(((summary.mastered + summary.proficient) / summary.total) * 100)
    : 0;

  const filteredSubjects = subjectFilter === 'All' ? subjects : subjects.filter((s) => s === subjectFilter);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Summary bar */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Grade-Level Standards Progress</h2>
            <p className="text-sm text-gray-600">{jurisdiction} Academic Standards — {summary.total} total standards</p>
          </div>
          <div className="text-3xl font-bold text-amber-700">{overallPct}%</div>
        </div>
        <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /><strong>{summary.mastered}</strong> mastered</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-600" /><strong>{summary.proficient}</strong> proficient</span>
          <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-amber-500" /><strong>{summary.developing}</strong> developing</span>
          <span className="flex items-center gap-1"><Circle className="w-3 h-3 text-gray-400" /><strong>{summary.notStarted}</strong> not started</span>
        </div>
      </div>

      {/* Subject filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {allSubjects.map((s) => (
          <button
            key={s}
            onClick={() => setSubjectFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              subjectFilter === s
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Standards by subject */}
      {filteredSubjects.map((subject) => (
        <SubjectSection
          key={subject}
          subject={subject}
          gradeMap={bySubjectAndGrade[subject]}
        />
      ))}

      {filteredSubjects.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No standards found for this filter.</p>
      )}
    </div>
  );
}
