"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

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

export default function TranscriptTab() {
  const [groupedTranscript, setGroupedTranscript] = useState<GroupedTranscript>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTranscript();
  }, []);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      
      // Get session info first
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get session');
      }
      const session = await sessionResponse.json();
      
      if (!session?.userId) {
        throw new Error('Not authenticated');
      }
      
      // Fetch transcript with auth params
      const response = await fetch(`/api/transcript?requesterId=${session.userId}&requesterRole=${session.role}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }
      
      const data = await response.json();
      
      // Group entries by subject
      const grouped = data.entries.reduce((acc: GroupedTranscript, entry: any) => {
        const subject = entry.mappedSubject || 'General';
        if (!acc[subject]) {
          acc[subject] = [];
        }
        acc[subject].push({
          id: entry.id,
          activityName: entry.activityName,
          mappedSubject: entry.mappedSubject,
          creditsEarned: Number(entry.creditsEarned),
          dateCompleted: new Date(entry.dateCompleted),
          notes: entry.notes,
        });
        return acc;
      }, {});
      
      setGroupedTranscript(grouped);
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setError('Unable to load transcript data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCredits = Object.values(groupedTranscript).flat().reduce((sum, entry) => {
    const credits = typeof entry.creditsEarned === 'number' ? entry.creditsEarned : Number(entry.creditsEarned) || 0;
    return sum + credits;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Transcript</CardTitle>
          <CardDescription>
            Your approved academic credits and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalCredits.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Credits Earned</p>
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Transcript */}
      {Object.entries(groupedTranscript).map(([subject, entries]) => (
        <Card key={subject}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {subject}
              <Badge variant="outline">
                {entries.reduce((sum, entry) => {
                  const credits = typeof entry.creditsEarned === 'number' ? entry.creditsEarned : Number(entry.creditsEarned) || 0;
                  return sum + credits;
                }, 0).toFixed(2)} credits
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.activityName}</TableCell>
                    <TableCell>{new Date(entry.dateCompleted).toLocaleDateString()}</TableCell>
                    <TableCell>{(typeof entry.creditsEarned === 'number' ? entry.creditsEarned : Number(entry.creditsEarned) || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {Object.keys(groupedTranscript).length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No transcript entries found. Complete activities to earn credits!
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
