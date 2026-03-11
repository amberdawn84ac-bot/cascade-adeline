"use client";

import { useState, useEffect } from 'react';
import { Book, MessageCircle, ArrowLeft, Send, Star } from 'lucide-react';
import { useChat } from '@ai-sdk/react';

interface BookRecommendation {
  title: string;
  author: string;
  description: string;
  themes: string[];
  discussionQuestions: string[];
}

type ReadingLevel = 'Early Reader' | 'Middle Grade' | 'Young Adult' | 'Classic Literature';

export default function ReadingNookPage() {
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
      const welcomeText = `Welcome to the discussion circle for *${activeBook.title}* by ${activeBook.author}. What are your initial thoughts on this piece?`;
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeText,
        parts: [{ type: 'text' as const, text: welcomeText }],
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-600">
            <Book size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reading Nook</h1>
            <p className="text-sm text-gray-600">Discover books and join thoughtful discussions</p>
          </div>
        </div>
      </div>

      {/* Main Content - Dual Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel - Library & Curation */}
        <div className={`
          flex-1 overflow-y-auto p-6 border-b md:border-b-0 md:border-r border-gray-200
          ${activeBook ? 'hidden md:block' : 'block'}
        `}>
          
          {/* Curation Controls */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Curate Your Bookshelf</h3>
            
            {/* Reading Level Selection */}
            <div className="flex flex-wrap gap-2 mb-4">
              {readingLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`
                    px-3 py-1 text-sm font-medium border rounded-lg transition-colors
                    ${selectedLevel === level 
                      ? 'bg-green-600 text-white border-green-600' 
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Interest Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="E.g. dragons, mystery, space travel..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleCurate}
                disabled={isCurating || !interestInput.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isCurating ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid gap-4">
              {books.map((book, index) => (
                <div
                  key={index}
                  onClick={() => openBookDiscussion(book)}
                  className="bg-white p-5 rounded-lg border border-gray-200 hover:border-green-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg text-gray-900">{book.title}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {selectedLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                  <p className="text-sm text-gray-700 mb-4">{book.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {book.themes.map(theme => (
                      <span key={theme} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {theme}
                      </span>
                    ))}
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-green-600 hover:text-green-700">
                      Start Discussion →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Book size={48} className="mx-auto mb-4" />
              <p className="italic">Enter your interests to discover books</p>
            </div>
          )}
        </div>

        {/* Right Panel - Discussion Chat */}
        {activeBook && (
          <div className="flex-1 bg-white border-l border-gray-200 flex flex-col h-full md:relative absolute top-0 left-0 right-0 bottom-0 md:top-auto md:left-auto md:right-auto md:bottom-auto">
            
            {/* Discussion Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
              <div>
                <button 
                  onClick={() => setActiveBook(null)}
                  className="md:hidden text-sm text-gray-600 hover:text-gray-800 mb-2"
                >
                  ← Back to Library
                </button>
                <h3 className="text-lg font-semibold text-gray-900">{activeBook.title}</h3>
                <p className="text-sm text-gray-600">Book Discussion</p>
              </div>
              <MessageCircle size={20} className="text-gray-400" />
            </div>

            {/* Discussion Prompts */}
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Discussion Prompts</h4>
              <ul className="space-y-1">
                {activeBook.discussionQuestions.slice(0, 3).map((question, index) => (
                  <li key={index} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-blue-600 font-semibold">{index + 1}.</span>
                    {question}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[85%] p-3 rounded-lg text-sm
                      ${message.role === 'user'
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-tl-none'
                      }
                    `}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-tl-none p-3 text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Share your thoughts on the book..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

