import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TranscriptEntry {
  id: string;
  activityName: string;
  mappedSubject: string;
  creditsEarned: number;
  dateCompleted: Date;
  notes?: string;
}

interface GroupedTranscript {
  [subject: string]: TranscriptEntry[];
}

async function getTranscriptData(): Promise<{ entries: TranscriptEntry[], grouped: GroupedTranscript, totalCredits: number }> {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  // Fetch approved transcript entries for the user
  const entries = await prisma.transcriptEntry.findMany({
    where: {
      userId: user.userId,
      approvedById: { not: null }, // Only get approved entries
    },
    select: {
      id: true,
      activityName: true,
      mappedSubject: true,
      creditsEarned: true,
      dateCompleted: true,
      notes: true,
    },
    orderBy: {
      dateCompleted: 'desc',
    },
  });

  // Convert Decimal to number
  const formattedEntries: TranscriptEntry[] = entries.map((entry: any) => ({
    ...entry,
    creditsEarned: Number(entry.creditsEarned),
  }));

  // Group by subject
  const grouped: GroupedTranscript = formattedEntries.reduce((acc: GroupedTranscript, entry: TranscriptEntry) => {
    if (!acc[entry.mappedSubject]) {
      acc[entry.mappedSubject] = [];
    }
    acc[entry.mappedSubject].push(entry);
    return acc;
  }, {} as GroupedTranscript);

  // Calculate total credits
  const totalCredits = formattedEntries.reduce((sum, entry) => sum + entry.creditsEarned, 0);

  return { entries: formattedEntries, grouped, totalCredits };
}

export async function TranscriptTab() {
  const { grouped, totalCredits } = await getTranscriptData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Official Homeschool Transcript</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Verified by Adeline AI
          </Badge>
        </CardTitle>
        <CardDescription>
          Cumulative record of completed learning activities and earned credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="flex justify-between items-end">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Student Record</h4>
            <p className="text-sm text-gray-600">Cumulative GPA: 4.0 (Estimated)</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-blue-600">{totalCredits.toFixed(2)}</span>
            <span className="block text-xs text-gray-500 uppercase tracking-wide">Total Credits</span>
          </div>
        </div>

        {/* Transcript by Subject */}
        <div className="space-y-6">
          {Object.keys(grouped).length > 0 ? (
            Object.entries(grouped).map(([subject, entries]) => (
              <div key={subject}>
                <h4 className="bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900 mb-2 rounded">
                  {subject}
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.activityName}</div>
                            {entry.notes && (
                              <div className="text-xs text-gray-500 mt-1">{entry.notes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.creditsEarned.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.dateCompleted.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="italic">No transcript entries yet. Complete learning activities to build your transcript!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400 italic">
            This document is a generated summary of learning experiences assessed by the Adeline Learning Concierge.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
