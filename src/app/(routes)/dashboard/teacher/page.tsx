"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  gradeLevel: string;
  totalCredits: number;
  lastActive: string;
  masteryBreakdown: Record<string, { mastered: number; total: number }>;
}

interface Intervention {
  studentId: string;
  studentName: string;
  issue: string;
  suggestedAction: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface Overview {
  totalStudents: number;
  transcriptsPending: number;
  learningGaps: Array<{
    user: { id: string; name: string };
    concept: { name: string; subjectArea: string };
    severity: string;
  }>;
  groupActivity: Array<{
    id: string;
    name: string;
    _count: { messages: number; memberships: number; projects: number };
    lastMediationAt: string | null;
  }>;
}

interface PendingEntry {
  id: string;
  activityName: string;
  mappedSubject: string;
  creditsEarned: string;
  dateCompleted: string;
  user: { id: string; name: string; gradeLevel: string };
  notes: string | null;
}

export default function TeacherDashboard() {
  const [activePanel, setActivePanel] = useState<'overview' | 'students' | 'interventions' | 'transcripts'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [pendingTranscripts, setPendingTranscripts] = useState<PendingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activePanel]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activePanel === 'overview') {
        const res = await fetch('/api/teacher/overview');
        if (res.ok) setOverview(await res.json());
      } else if (activePanel === 'students') {
        const res = await fetch('/api/teacher/students');
        if (res.ok) setStudents(await res.json());
      } else if (activePanel === 'interventions') {
        const res = await fetch('/api/teacher/interventions');
        if (res.ok) setInterventions(await res.json());
      } else if (activePanel === 'transcripts') {
        const res = await fetch('/api/teacher/validate-transcript');
        if (res.ok) setPendingTranscripts(await res.json());
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateTranscript = async (entryId: string, approved: boolean, adjustedCredits?: number) => {
    const res = await fetch('/api/teacher/validate-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, approved, adjustedCredits }),
    });
    if (res.ok) {
      setPendingTranscripts(prev => prev.filter(e => e.id !== entryId));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="p-6 border-b border-blue-200 bg-white/80 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-blue-900">Teacher Dashboard</h1>
        <p className="text-sm text-blue-600 italic mt-1">Monitor student progress, approve transcripts, and provide targeted interventions</p>
      </div>

      <div className="flex border-b border-blue-200 bg-white/50">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'interventions', label: 'Interventions', icon: AlertTriangle },
          { id: 'transcripts', label: 'Transcripts', icon: CheckCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id as any)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activePanel === id
                ? 'bg-blue-600 text-white border-b-2 border-blue-700'
                : 'text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {activePanel === 'overview' && overview && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-blue-600">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-900">{overview.totalStudents}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-amber-600">Pending Transcripts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-amber-900">{overview.transcriptsPending}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-red-600">Learning Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-red-900">{overview.learningGaps.length}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-900">Learning Gap Alerts</CardTitle>
                    <CardDescription>Students struggling with specific concepts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {overview.learningGaps.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No significant learning gaps detected</p>
                    ) : (
                      <div className="space-y-2">
                        {overview.learningGaps.slice(0, 10).map((gap, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                            <div>
                              <p className="font-medium text-red-900">{gap.user.name}</p>
                              <p className="text-sm text-red-700">{gap.concept.subjectArea}: {gap.concept.name}</p>
                            </div>
                            <Badge variant="outline" className="border-red-400 text-red-700">{gap.severity}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-900">Science Group Activity</CardTitle>
                    <CardDescription>Recent group collaboration and AI mediation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {overview.groupActivity.map(group => (
                        <div key={group.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div>
                            <p className="font-medium text-emerald-900">{group.name}</p>
                            <p className="text-xs text-emerald-600">
                              {group._count.memberships} members · {group._count.messages} messages · {group._count.projects} projects
                            </p>
                          </div>
                          {group.lastMediationAt && (
                            <Badge variant="outline" className="border-emerald-400 text-emerald-700 text-xs">
                              AI mediated {new Date(group.lastMediationAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activePanel === 'students' && (
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map(student => (
                    <Card key={student.id} className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-blue-900">{student.name}</CardTitle>
                        <CardDescription>Grade {student.gradeLevel}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-600">Total Credits:</span>
                          <span className="font-bold text-blue-900">{student.totalCredits.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-600">Last Active:</span>
                          <span className="text-blue-700">{new Date(student.lastActive).toLocaleDateString()}</span>
                        </div>
                        <div className="pt-2 border-t border-blue-100">
                          <p className="text-xs font-semibold text-blue-700 mb-2">Mastery Progress:</p>
                          {Object.entries(student.masteryBreakdown).map(([subject, data]) => (
                            <div key={subject} className="flex items-center justify-between text-xs mb-1">
                              <span className="text-blue-600">{subject}:</span>
                              <span className="text-blue-900">{data.mastered}/{data.total}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'interventions' && (
              <div className="max-w-4xl mx-auto space-y-4">
                {interventions.length === 0 ? (
                  <Card className="border-green-200">
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-green-900 font-medium">All students are on track!</p>
                      <p className="text-sm text-green-600 mt-1">No interventions needed at this time.</p>
                    </CardContent>
                  </Card>
                ) : (
                  interventions.map((intervention, i) => (
                    <Card key={i} className={`border-2 ${
                      intervention.urgency === 'HIGH' ? 'border-red-400 bg-red-50' :
                      intervention.urgency === 'MEDIUM' ? 'border-amber-400 bg-amber-50' :
                      'border-blue-400 bg-blue-50'
                    }`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{intervention.studentName}</CardTitle>
                          <Badge variant="outline" className={
                            intervention.urgency === 'HIGH' ? 'border-red-500 text-red-700' :
                            intervention.urgency === 'MEDIUM' ? 'border-amber-500 text-amber-700' :
                            'border-blue-500 text-blue-700'
                          }>
                            {intervention.urgency} URGENCY
                          </Badge>
                        </div>
                        <CardDescription className="text-sm font-medium mt-2">{intervention.issue}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white/70 p-4 rounded-lg border border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Suggested Action:</p>
                          <p className="text-sm text-gray-900">{intervention.suggestedAction}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Approve & Log</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm" variant="ghost">Dismiss</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activePanel === 'transcripts' && (
              <div className="max-w-4xl mx-auto space-y-4">
                {pendingTranscripts.length === 0 ? (
                  <Card className="border-green-200">
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-green-900 font-medium">All transcripts reviewed!</p>
                      <p className="text-sm text-green-600 mt-1">No pending entries at this time.</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingTranscripts.map(entry => (
                    <Card key={entry.id} className="border-amber-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-amber-900">{entry.user.name}</CardTitle>
                            <CardDescription>Grade {entry.user.gradeLevel} · {new Date(entry.dateCompleted).toLocaleDateString()}</CardDescription>
                          </div>
                          <Badge variant="outline" className="border-amber-400 text-amber-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-amber-600 font-semibold">Activity:</p>
                            <p className="text-sm text-amber-900">{entry.activityName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-amber-600 font-semibold">Subject:</p>
                            <p className="text-sm text-amber-900">{entry.mappedSubject}</p>
                          </div>
                          <div>
                            <p className="text-xs text-amber-600 font-semibold">Credits Proposed:</p>
                            <p className="text-sm text-amber-900 font-bold">{entry.creditsEarned}</p>
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="bg-amber-50 p-3 rounded border border-amber-200">
                            <p className="text-xs text-amber-600 font-semibold mb-1">Student Notes:</p>
                            <p className="text-sm text-amber-900">{entry.notes}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleValidateTranscript(entry.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleValidateTranscript(entry.id, false)}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">Adjust Credits</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
