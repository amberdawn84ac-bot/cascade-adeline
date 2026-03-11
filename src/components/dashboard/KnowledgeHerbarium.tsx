"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BookOpen, TrendingUp, Award, Download, FileText } from 'lucide-react';

// Graduation Requirements (in Credits)
const GRADUATION_REQS: Record<string, number> = {
  'English': 4.0,
  'Math': 3.0,
  'Science': 3.0,
  'Social Studies': 3.0,
  'Arts': 1.0,
  'Elective': 6.0
};

interface SubjectProgress {
  subject: string;
  current: number;
  target: number;
  percentage: number;
}

interface KnowledgeHerbariumProps {
  userId: string;
}

export default function KnowledgeHerbarium({ userId }: KnowledgeHerbariumProps) {
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [recentStandards, setRecentStandards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [userId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Fetch transcript entries via API
      const response = await fetch('/api/transcript/entries');
      if (!response.ok) {
        throw new Error('Failed to fetch transcript entries');
      }
      
      const entries = await response.json();

      // Calculate progress by subject
      const progressMap = new Map<string, number>();
      
      entries.forEach((entry: any) => {
        const subject = entry.mappedSubject || 'Elective';
        const credits = Number(entry.creditsEarned);
        progressMap.set(subject, (progressMap.get(subject) || 0) + credits);
      });

      // Convert to array and calculate percentages
      const progress: SubjectProgress[] = Object.entries(GRADUATION_REQS).map(([subject, target]) => ({
        subject,
        current: progressMap.get(subject) || 0,
        target,
        percentage: Math.min(((progressMap.get(subject) || 0) / target) * 100, 100)
      }));

      // Calculate total credits
      const total = Array.from(progressMap.values()).reduce((sum, credits) => sum + credits, 0);

      // Extract recent standards from notes
      const standards: string[] = [];
      entries.slice(0, 5).forEach((entry: any) => {
        if (entry.notes) {
          // Try to extract standards from notes (this would depend on your data format)
          const standardMatches = entry.notes.match(/(?:Standard|CCSS|NGSS)[\s:]*([A-Z\-\.\d]+)/gi);
          if (standardMatches) {
            standards.push(...standardMatches.map((s: string) => s.trim()));
          }
        }
      });

      setSubjectProgress(progress);
      setTotalCredits(total);
      setRecentStandards(standards.slice(0, 6));
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Simulate report generation - in real implementation, this would call your AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportText = `Student Progress Report

Total Credits Earned: ${totalCredits.toFixed(2)}
Overall Progress: ${(totalCredits / 20 * 100).toFixed(1)}%

Subject Breakdown:
${subjectProgress.map(p => 
  `${p.subject}: ${p.current.toFixed(2)}/${p.target} credits (${p.percentage.toFixed(1)}%)`
).join('\n')}

Recent Achievements:
${recentStandards.slice(0, 3).join(', ') || 'No recent standards recorded'}

This report shows steady progress toward graduation requirements. Continue the excellent work!`;

      setReport(reportText);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 100) return 'default';
    if (percentage >= 75) return 'secondary';
    if (percentage >= 50) return 'outline';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading progress data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Knowledge Herbarium
              </CardTitle>
              <CardDescription>
                Track your progress toward graduation requirements
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Award className="h-3 w-3" />
              Level {Math.floor(totalCredits / 5) + 1}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Graduation Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Graduation Readiness
          </CardTitle>
          <CardDescription>
            Credits earned toward graduation requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {subjectProgress.map((subject) => (
            <div key={subject.subject} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{subject.subject}</span>
                <Badge variant={getProgressVariant(subject.percentage)}>
                  {subject.current.toFixed(2)} / {subject.target}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${subject.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {subject.percentage.toFixed(1)}% complete
              </div>
            </div>
          ))}

          <Separator />

          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalCredits.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Credits Earned</p>
            <div className="mt-2">
              <Badge variant={totalCredits >= 20 ? 'default' : 'secondary'}>
                {totalCredits >= 20 ? 'On Track' : 'In Progress'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Standards */}
      {recentStandards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Standards
            </CardTitle>
            <CardDescription>
              Latest learning standards achieved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentStandards.map((standard, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {standard}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Report */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Report</CardTitle>
          <CardDescription>
            Generate and share your academic progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!report ? (
            <Button 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || totalCredits === 0}
              className="w-full"
            >
              {isGeneratingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Progress Report
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReport(null)}
                  className="absolute top-0 right-0"
                >
                  ×
                </Button>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Progress Report</h4>
                  <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {report}
                  </pre>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

