import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

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
    <div className="bg-white p-8 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Official Homeschool Transcript</h2>
        <p className="text-sm text-gray-600 uppercase tracking-wide">Verified by Adeline AI</p>
      </div>

      {/* Summary */}
      <div className="mb-8 flex justify-between items-end">
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
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-gray-600 uppercase tracking-wider">
                      <th className="pb-2 pl-4">Course Title</th>
                      <th className="pb-2 pr-4 text-right">Credits</th>
                      <th className="pb-2 pr-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-t border-gray-100">
                        <td className="py-3 pl-4 text-gray-800">
                          <div className="font-medium">{entry.activityName}</div>
                          {entry.notes && (
                            <div className="text-xs text-gray-500 mt-1">{entry.notes}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-gray-600">
                          {entry.creditsEarned.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-600">
                          {entry.dateCompleted.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
}
