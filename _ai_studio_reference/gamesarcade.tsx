import React, { useState, useEffect, useRef } from 'react';
import { GameProject, Club, Opportunity } from '../types';
import { GearsIcon, RoseMinimal } from './FloralIcons';
import { assistGameCoding, reviewGameSubmission, getSocieties, getOpportunities } from '../services/geminiService';
import { SocietiesView, BulletinView } from './CommunityFeatures';

interface Props {
  isLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; background: #222; display: flex; justify-content: center; align-items: center; height: 100vh; color: #eee; font-family: monospace; }
        canvas { border: 2px solid #555; background: #000; }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        function draw() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.fillText('Press "Ask Adeline" to start coding!', 50, 200);
        }
        draw();
    </script>
</body>
</html>`;

export const GamesArcadeView: React.FC<Props> = ({ isLoading, setGlobalLoading }) => {
  const [activeTab, setActiveTab] = useState<'arcade' | 'atelier' | 'societies' | 'bulletin'>('atelier');
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [currentCode, setCurrentCode] = useState(DEFAULT_CODE);
  const [instruction, setInstruction] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  // Community State
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  // Iframe ref to update preview
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    updatePreview(currentCode);
  }, [currentCode, activeTab]);

  useEffect(() => {
    if (activeTab === 'societies' && clubs.length === 0) {
      loadCommunityData();
    }
  }, [activeTab]);

  const loadCommunityData = async () => {
    try {
      const c = await getSocieties("Game Design & Programming");
      setClubs(c);
      const o = await getOpportunities("Technology & Game Development");
      setOpportunities(o);
    } catch (e) {
      console.error(e);
    }
  };

  const updatePreview = (code: string) => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = code;
    }
  };

  const handleCodingRequest = async () => {
    if (!instruction.trim()) return;
    setGlobalLoading(true);
    setFeedback(null);
    try {
      const result = await assistGameCoding(instruction, currentCode);
      setCurrentCode(result.code);
      setFeedback(result.explanation);
      setInstruction('');
    } catch (e) {
      console.error(e);
      setFeedback("Apologies, I encountered a mechanical failure while drafting the blueprint.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setIsReviewing(true);
    try {
        const result = await reviewGameSubmission(currentCode);
        if (result.approved) {
            const newProject: GameProject = {
                id: crypto.randomUUID(),
                title: `Game Project #${projects.length + 1}`,
                description: result.feedback,
                code: currentCode,
                status: 'published',
                thumbnail: `hsl(${Math.random() * 360}, 70%, 80%)`
            };
            setProjects(prev => [...prev, newProject]);
            setFeedback(`✨ APPROVED: ${result.feedback}`);
        } else {
            setFeedback(`❌ REVISION NEEDED: ${result.feedback}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsReviewing(false);
    }
  };

  const loadProject = (project: GameProject) => {
      setCurrentCode(project.code);
      setActiveGameId(project.id);
      setActiveTab('atelier'); // Go to editor to play/view code
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F2] relative overflow-hidden">
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>

      {/* Header */}
      <div className="p-6 md:p-8 border-b border-gold/40 bg-paper/80 backdrop-blur-sm z-10 flex justify-between items-center relative">
        <div>
           <h2 className="font-display text-3xl text-ink">The Automaton Arcade</h2>
           <p className="text-sm italic text-sage-dark mt-1">"Logic is the anatomy of thought."</p>
        </div>
        <GearsIcon className="w-8 h-8 text-sage opacity-50" />
      </div>

      {/* Navigation */}
      <div className="flex border-b border-gold/20 bg-white/50">
          <button 
            onClick={() => setActiveTab('atelier')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'atelier' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            The Atelier
          </button>
          <button 
            onClick={() => setActiveTab('arcade')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'arcade' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            The Arcade
          </button>
          <button 
            onClick={() => setActiveTab('societies')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'societies' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Guilds
          </button>
          <button 
            onClick={() => setActiveTab('bulletin')}
            className={`flex-1 py-3 text-sm uppercase tracking-widest transition-colors ${activeTab === 'bulletin' ? 'bg-sage text-white' : 'text-ink/60 hover:bg-sepia'}`}
          >
            Bulletin
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
          
          {/* --- ATELIER MODE --- */}
          {activeTab === 'atelier' && (
              <div className="flex flex-col md:flex-row h-full">
                  {/* Left: Code & Chat */}
                  <div className="w-full md:w-1/2 flex flex-col border-r border-gold/30 bg-white">
                      
                      {/* Code Area (Read Only-ish representation or simple textarea) */}
                      <div className="flex-1 p-4 overflow-hidden flex flex-col">
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-ink/40">Blueprint (HTML/JS)</label>
                              <span className="text-[10px] text-sage italic">Adeline is watching...</span>
                          </div>
                          <textarea 
                             value={currentCode}
                             onChange={(e) => setCurrentCode(e.target.value)}
                             className="flex-1 w-full font-mono text-xs bg-[#2b2b2b] text-[#a9b7c6] p-4 rounded-sm outline-none resize-none border-2 border-transparent focus:border-sage"
                             spellCheck={false}
                          />
                      </div>

                      {/* Adeline Interaction Area */}
                      <div className="p-4 bg-[#F3F0EB] border-t border-gold/30">
                           {feedback && (
                               <div className="mb-4 p-3 bg-white border-l-2 border-sage text-sm italic text-ink/80 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                   <span className="font-bold text-sage-dark not-italic mr-2">Adeline:</span> 
                                   {feedback}
                               </div>
                           )}

                           <div className="relative">
                               <input
                                 type="text"
                                 value={instruction}
                                 onChange={(e) => setInstruction(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleCodingRequest()}
                                 placeholder="Ask Adeline to build or fix something (e.g., 'Make a pong game')..."
                                 className="w-full p-3 pr-24 bg-white border border-gold/40 focus:border-sage outline-none rounded-sm font-serif shadow-inner"
                                 disabled={isLoading || isReviewing}
                               />
                               <button 
                                 onClick={handleCodingRequest}
                                 disabled={isLoading || !instruction.trim()}
                                 className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-sage text-white text-xs uppercase tracking-wider rounded-sm hover:bg-sage-dark disabled:opacity-50"
                               >
                                 {isLoading ? '...' : 'Build'}
                               </button>
                           </div>
                           
                           <div className="mt-2 flex justify-end">
                               <button
                                 onClick={handleSubmitForReview}
                                 disabled={isReviewing || isLoading}
                                 className="text-xs font-bold text-sage-dark hover:underline flex items-center gap-1"
                               >
                                   {isReviewing ? 'Reviewing...' : 'Submit for Peer Review →'}
                               </button>
                           </div>
                      </div>
                  </div>

                  {/* Right: Preview */}
                  <div className="w-full md:w-1/2 bg-[#333] flex flex-col relative">
                      <div className="bg-[#444] p-2 text-center text-xs text-[#aaa] border-b border-[#555]">
                          Simulation Window
                      </div>
                      <iframe 
                        ref={iframeRef}
                        title="Game Preview"
                        className="flex-1 w-full border-none bg-white"
                        sandbox="allow-scripts"
                      />
                  </div>
              </div>
          )}

          {/* --- ARCADE MODE --- */}
          {activeTab === 'arcade' && (
              <div className="p-8 overflow-y-auto h-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Placeholder for Empty State */}
                      {projects.length === 0 && (
                          <div className="col-span-full text-center py-20 opacity-40">
                              <GearsIcon className="w-20 h-20 mx-auto mb-4 text-gold" />
                              <p className="font-display text-xl">The Gallery is empty.</p>
                              <p className="italic">Go to the Atelier to forge your first creation.</p>
                          </div>
                      )}

                      {projects.map(proj => (
                          <div key={proj.id} className="bg-white p-4 border border-gold/30 shadow-sm hover:shadow-md transition-all group">
                              <div 
                                className="h-32 w-full mb-4 rounded-sm relative overflow-hidden"
                                style={{ background: proj.thumbnail || '#eee' }}
                              >
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                                      <button 
                                        onClick={() => loadProject(proj)}
                                        className="bg-white text-sage-dark px-4 py-2 text-xs uppercase font-bold tracking-widest shadow-lg"
                                      >
                                          Play
                                      </button>
                                  </div>
                              </div>
                              <h3 className="font-display text-lg text-ink mb-1">{proj.title}</h3>
                              <p className="text-xs text-ink/60 italic mb-2 line-clamp-2">{proj.description}</p>
                              <div className="flex justify-between items-center border-t border-gold/10 pt-2">
                                  <span className="text-[10px] uppercase tracking-widest text-sage font-bold">Published</span>
                                  <span className="text-[10px] text-ink/40">By You</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- SHARED TABS --- */}
          {activeTab === 'societies' && (
              <div className="overflow-y-auto h-full">
                <SocietiesView 
                    clubs={clubs} 
                    onJoinToggle={(id) => setJoinedClubs(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
                    joinedIds={joinedClubs} 
                    isLoading={isLoading && clubs.length === 0}
                    emptyMessage="Scouting for guilds..."
                />
             </div>
          )}
          
          {activeTab === 'bulletin' && (
              <div className="overflow-y-auto h-full">
                <BulletinView 
                    opportunities={opportunities} 
                    isLoading={isLoading && opportunities.length === 0}
                    domain="Game Development"
                />
              </div>
          )}

      </div>
    </div>
  );
};