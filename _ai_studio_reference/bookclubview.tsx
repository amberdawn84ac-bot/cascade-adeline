import React, { useState, useEffect } from 'react';
import { BookRecommendation, ReadingLevel, ReadingProgram } from '../types';
import { OpenBookIcon, RoseMinimal, DividerFlower } from './FloralIcons';
import { curateBookshelf, getReadingPrograms, facilitateBookDiscussion } from '../services/geminiService';

interface Props {
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

const READING_LEVELS: ReadingLevel[] = ['Early Reader', 'Middle Grade', 'Young Adult', 'Classic Literature'];

export const BookClubView: React.FC<Props> = ({ isLoading, setGlobalLoading }) => {
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel>('Middle Grade');
  const [interestInput, setInterestInput] = useState('');
  const [books, setBooks] = useState<BookRecommendation[]>([]);
  const [activeBook, setActiveBook] = useState<BookRecommendation | null>(null);
  
  // Incentives
  const [programs, setPrograms] = useState<ReadingProgram[]>([]);
  
  // Discussion State
  const [discussionHistory, setDiscussionHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [discussionInput, setDiscussionInput] = useState('');
  const [isDiscussing, setIsDiscussing] = useState(false);

  useEffect(() => {
    // Load incentive programs on mount
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const data = await getReadingPrograms();
      setPrograms(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCurate = async () => {
    if (!interestInput.trim()) return;
    setGlobalLoading(true);
    setBooks([]); 
    setActiveBook(null);
    try {
      const results = await curateBookshelf(selectedLevel, interestInput);
      setBooks(results);
    } catch (e) {
      console.error(e);
    } finally {
      setGlobalLoading(false);
    }
  };

  const openBookDiscussion = (book: BookRecommendation) => {
    setActiveBook(book);
    setDiscussionHistory([
      { role: 'model', content: `Welcome to the discussion circle for *${book.title}* by ${book.author}. What are your initial thoughts on this piece?` }
    ]);
  };

  const submitDiscussion = async () => {
    if (!discussionInput.trim() || !activeBook) return;
    
    const userMsg = discussionInput;
    setDiscussionHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setDiscussionInput('');
    setIsDiscussing(true);

    try {
      // Build history context string
      const historyStr = discussionHistory.map(h => `${h.role}: ${h.content}`).join('\n');
      const response = await facilitateBookDiscussion(activeBook.title, userMsg, historyStr);
      setDiscussionHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDiscussing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center relative">
        <div>
           <h2 className="font-display text-3xl text-ink">Adeline Literary Society</h2>
           <p className="text-sm italic text-sage-dark mt-1">"A room without books is like a body without a soul."</p>
        </div>
        <OpenBookIcon className="w-8 h-8 text-sage opacity-50" />
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-0">
        
        {/* Left Panel: Library & Curation */}
        <div className={`
             flex-1 overflow-y-auto p-6 md:p-10 transition-all duration-500
             ${activeBook ? 'hidden md:block md:w-1/2 lg:w-1/3 border-r border-gold/20' : 'w-full'}
        `}>
           
           {/* Curation Controls */}
           <div className="bg-white border-2 border-double border-gold/40 p-6 rounded-sm shadow-sm mb-8">
              <h3 className="font-display text-xl text-ink mb-4 text-center">Curate Your Shelf</h3>
              
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                 {READING_LEVELS.map(level => (
                   <button
                     key={level}
                     onClick={() => setSelectedLevel(level)}
                     className={`
                       px-3 py-1 text-xs uppercase tracking-widest border transition-all
                       ${selectedLevel === level 
                         ? 'bg-sage text-white border-sage' 
                         : 'bg-transparent text-ink/60 border-gold/40 hover:border-sage'
                       }
                     `}
                   >
                     {level}
                   </button>
                 ))}
              </div>

              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  placeholder="E.g. dragons, victorian mystery, space travel..."
                  className="w-full bg-[#FDFBF7] border border-gold/40 p-3 pr-10 rounded-none focus:border-sage outline-none font-serif placeholder:italic text-sm"
                />
                <button 
                  onClick={handleCurate}
                  disabled={isLoading || !interestInput}
                  className="absolute right-2 text-sage-dark hover:text-sage disabled:opacity-30"
                >
                  Search
                </button>
              </div>
           </div>

           {/* Books Grid */}
           {books.length > 0 ? (
             <div className="grid gap-6">
                {books.map(book => (
                  <div 
                    key={book.id} 
                    onClick={() => openBookDiscussion(book)}
                    className="bg-white p-5 border border-gold/20 hover:border-sage/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-display text-lg text-ink group-hover:text-sage-dark transition-colors">{book.title}</h4>
                       <span className="text-[10px] uppercase tracking-widest text-ink/40 border border-gold/30 px-1">{book.level}</span>
                    </div>
                    <p className="text-xs italic text-ink/60 mb-3">by {book.author}</p>
                    <p className="text-sm text-ink/80 leading-relaxed mb-4">{book.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {book.themes.map(t => (
                        <span key={t} className="text-[9px] bg-sepia px-1.5 py-0.5 text-sage-dark rounded-full">{t}</span>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                       <span className="text-xs font-bold text-sage uppercase tracking-wider group-hover:underline">Enter Discussion Circle</span>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="text-center py-12 opacity-40">
                <OpenBookIcon className="w-16 h-16 mx-auto mb-4 text-gold" />
                <p className="italic">Request a curation to populate the library.</p>
             </div>
           )}

           {/* Reading Incentives Board (Mobile: Bottom, Desktop: Bottom of Left) */}
           <div className="mt-12 pt-8 border-t border-gold/30">
              <h3 className="font-display text-lg text-sage-dark mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 bg-sage rounded-full"></span>
                 The Bulletin Board
              </h3>
              <div className="grid gap-4">
                 {programs.map((prog, i) => (
                   <div key={i} className="bg-[#FFFDF5] border border-yellow-200/50 p-4 relative shadow-[2px_2px_0px_rgba(234,179,8,0.1)]">
                      {/* Pin Effect */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-400 shadow-sm border border-red-500"></div>
                      
                      <h4 className="font-bold text-ink mb-1">{prog.name}</h4>
                      <p className="text-xs text-ink/70 mb-2 leading-snug">{prog.description}</p>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] uppercase tracking-widest text-sage-dark font-bold">{prog.targetAudience}</span>
                         {prog.link && (
                           <a href={prog.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline italic">Learn More →</a>
                         )}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Panel: Discussion Salon */}
        {activeBook && (
          <div className="flex-1 bg-white border-l border-gold/30 flex flex-col h-full animate-in slide-in-from-right-10 duration-500 z-10 absolute md:relative w-full md:w-auto top-0 bottom-0">
             
             {/* Discussion Header */}
             <div className="p-6 border-b border-gold/20 bg-[#FAF8F2] flex justify-between items-start">
               <div>
                  <button onClick={() => setActiveBook(null)} className="md:hidden text-xs uppercase tracking-widest text-sage-dark mb-2">← Back to Library</button>
                  <h3 className="font-display text-2xl text-ink">{activeBook.title}</h3>
                  <p className="text-sm italic text-ink/60">Literary Salon</p>
               </div>
               <RoseMinimal className="w-8 h-8 text-gold opacity-40" />
             </div>

             {/* Chat Area */}
             <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white custom-scrollbar">
                {/* Discussion Prompts */}
                <div className="bg-sage/5 p-5 border-l-2 border-sage mb-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-sage-dark mb-2">Discussion Prompts</h4>
                   <ul className="space-y-2">
                      {activeBook.discussionQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-ink/80 italic flex gap-2">
                           <span className="text-sage font-serif font-bold">{i+1}.</span>
                           {q}
                        </li>
                      ))}
                   </ul>
                </div>

                {discussionHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`
                       max-w-[85%] p-4 rounded-lg text-sm leading-relaxed
                       ${msg.role === 'user' 
                         ? 'bg-[#F3F0EB] text-ink border border-gold/20 rounded-tr-none' 
                         : 'bg-white border-y border-double border-sepia text-ink rounded-tl-none shadow-sm'
                       }
                     `}>
                        {msg.content}
                     </div>
                  </div>
                ))}
                {isDiscussing && (
                  <div className="flex justify-start">
                     <span className="text-xs italic text-sage animate-pulse">Adeline is pondering...</span>
                  </div>
                )}
             </div>

             {/* Input Area */}
             <div className="p-4 border-t border-gold/20 bg-[#FAF8F2]">
                <div className="relative">
                   <input
                     type="text"
                     value={discussionInput}
                     onChange={(e) => setDiscussionInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && submitDiscussion()}
                     placeholder="Share your thoughts on the chapter..."
                     className="w-full p-3 pr-12 bg-white border border-gold/30 focus:border-sage outline-none rounded-sm font-serif shadow-inner"
                   />
                   <button 
                     onClick={submitDiscussion}
                     disabled={isDiscussing || !discussionInput}
                     className="absolute right-2 top-1/2 -translate-y-1/2 text-sage-dark hover:text-ink disabled:opacity-30"
                   >
                     <span className="text-xl">❧</span>
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};