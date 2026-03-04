"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Book, MessageCircle, Send, Star, Loader2, BookOpen } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

interface BookRecommendation {
  title: string;
  author: string;
  description: string;
  themes: string[];
  discussionQuestions: string[];
}

type ReadingLevel = 'Early Reader' | 'Middle Grade' | 'Young Adult' | 'Classic Literature';

export default function ReadingNookDashboardPage() {
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel>('Middle Grade');
  const [interestInput, setInterestInput] = useState('');
  const [books, setBooks] = useState<BookRecommendation[]>([]);
  const [activeBook, setActiveBook] = useState<BookRecommendation | null>(null);
  const [isCurating, setIsCurating] = useState(false);
  
  // Chat state for book discussion
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/reading-nook/discuss',
    initialMessages: []
  });

  useEffect(() => {
    if (activeBook) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Welcome to the discussion circle for *${activeBook.title}* by ${activeBook.author}. What are your initial thoughts on this piece?`,
        parts: [{ type: 'text', text: `Welcome to the discussion circle for *${activeBook.title}* by ${activeBook.author}. What are your initial thoughts on this piece?` }],
      }]);
    }
  }, [activeBook, setMessages]);

  const handleCurate = async () => {
    if (!interestInput.trim()) return;
    
    setIsCurating(true);
    setBooks([]);
    setActiveBook(null);
    
    try {
      const response = await fetch('/api/reading-nook/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingLevel: selectedLevel, interestInput }),
      });
      
      if (!response.ok) throw new Error('Failed to curate books');
      
      const data = await response.json();
      setBooks(data.books);
    } catch (error) {
      console.error('Error curating books:', error);
    } finally {
      setIsCurating(false);
    }
  };

  const openBookDiscussion = (book: BookRecommendation) => {
    setActiveBook(book);
  };

  const readingLevels: ReadingLevel[] = ['Early Reader', 'Middle Grade', 'Young Adult', 'Classic Literature'];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Reading Nook</h1>
          <p className="text-gray-600">Discover books and engage in thoughtful discussions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
        {/* Left Panel - Library Curation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Library Curation
              </CardTitle>
              <CardDescription>
                Find books that match your interests and reading level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Select value={selectedLevel} onValueChange={(value: any) => setSelectedLevel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reading level" />
                  </SelectTrigger>
                  <SelectContent>
                    {readingLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Textarea
                  placeholder="Tell me about your interests, favorite genres, topics you'd like to explore..."
                  value={interestInput}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInterestInput(e.target.value)}
                  rows={3}
                />
                
                <Button 
                  onClick={handleCurate} 
                  disabled={isCurating || !interestInput.trim()}
                  className="w-full"
                >
                  {isCurating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Curating Books...
                    </>
                  ) : (
                    'Find Books'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Book Recommendations */}
          <div className="space-y-4 overflow-y-auto max-h-96">
            {books.map((book, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{book.title}</h3>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                    </div>
                    
                    <p className="text-sm text-gray-700 line-clamp-2">{book.description}</p>
                    
                    <div className="flex flex-wrap gap-1">
                      {book.themes.map((theme, themeIndex) => (
                        <Badge key={themeIndex} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => openBookDiscussion(book)}
                      size="sm"
                      className="w-full"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Start Discussion
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel - Socratic Chat */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Discussion Circle
            </CardTitle>
            <CardDescription>
              {activeBook ? `Discussing "${activeBook.title}"` : 'Select a book to start discussing'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {activeBook ? (
              <div className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Share your thoughts..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                <div className="space-y-4">
                  <Book className="h-12 w-12 mx-auto opacity-50" />
                  <div>
                    <p className="font-medium">No book selected</p>
                    <p className="text-sm">Choose a book from the library to start a discussion</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
