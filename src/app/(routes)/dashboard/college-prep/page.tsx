"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, FileText, DollarSign, Clipboard, Send, Search, Loader2 } from 'lucide-react';
import TranscriptTab from '@/components/college-prep/TranscriptTab';

interface TestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Scholarship {
  name: string;
  amount: string;
  requirements: string;
  category: string;
  deadline: string;
}

export default function CollegePrepDashboardPage() {
  const [activeTab, setActiveTab] = useState('exams');
  
  // Test Prep State
  const [subject, setSubject] = useState<'Math' | 'English' | 'Science'>('Math');
  const [currentQuestion, setCurrentQuestion] = useState<TestQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Scholarship State
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [profileInput, setProfileInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleGenerateQuestion = async () => {
    setIsLoading(true);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setShowExplanation(false);
    
    try {
      const response = await fetch('/api/college-prep/test-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
      });
      
      if (!response.ok) throw new Error('Failed to generate question');
      
      const data = await response.json();
      setCurrentQuestion(data.question);
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    setShowExplanation(true);
  };

  const handleSearchScholarships = async () => {
    setIsSearching(true);
    setScholarships([]);
    
    try {
      const response = await fetch('/api/college-prep/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: profileInput }),
      });
      
      if (!response.ok) throw new Error('Failed to search scholarships');
      
      const data = await response.json();
      setScholarships(data.scholarships);
    } catch (error) {
      console.error('Error searching scholarships:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">College Prep</h1>
          <p className="text-gray-600">Prepare for college entrance exams and applications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Test Prep
          </TabsTrigger>
          <TabsTrigger value="transcript" className="flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Transcript
          </TabsTrigger>
          <TabsTrigger value="scholarships" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Scholarships
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Preparation</CardTitle>
              <CardDescription>
                Practice questions for college entrance exams
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Select value={subject} onValueChange={(value: any) => setSubject(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Math">Math</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenerateQuestion} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Question'
                  )}
                </Button>
              </div>

              {currentQuestion && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{currentQuestion.question}</h3>
                      <div className="grid gap-2">
                        {currentQuestion.options.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedOption === index ? "default" : "outline"}
                            className="justify-start text-left h-auto p-3"
                            onClick={() => handleSelectOption(index)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      
                      {showExplanation && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="pt-4">
                            <h4 className="font-semibold text-green-800 mb-2">
                              {selectedOption === currentQuestion.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
                            </h4>
                            <p className="text-gray-700">{currentQuestion.explanation}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="space-y-6">
          <TranscriptTab />
        </TabsContent>

        <TabsContent value="scholarships" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scholarship Search</CardTitle>
              <CardDescription>
                Find scholarships that match your profile and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe your academic achievements, interests, goals, and background..."
                  value={profileInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfileInput(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSearchScholarships} disabled={isSearching || !profileInput.trim()}>
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Scholarships
                    </>
                  )}
                </Button>
              </div>

              {scholarships.length > 0 && (
                <div className="grid gap-4">
                  {scholarships.map((scholarship, index) => (
                    <Card key={index} className="border-green-200">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">{scholarship.name}</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {scholarship.amount}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{scholarship.requirements}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <Badge variant="outline">{scholarship.category}</Badge>
                            <span>Deadline: {scholarship.deadline}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>College Applications</CardTitle>
              <CardDescription>
                Track your college application progress and deadlines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Application tracking coming soon...</p>
                <p className="text-sm">You'll be able to manage application deadlines, essays, and requirements here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
