import React, { useState } from 'react';
import { ProposedCredit, SubjectArea } from '../types';
import { RoseMinimal, DividerFlower } from './FloralIcons';
import { generateParentReport } from '../services/geminiService';

interface Props {
  credits: ProposedCredit[];
}

// Typical Graduation Requirements (in Credits)
const GRADUATION_REQS: Record<SubjectArea, number> = {
    'English': 4.0,
    'Math': 3.0,
    'Science': 3.0,
    'Social Studies': 3.0,
    'Arts': 1.0,
    'Elective': 6.0
};

export const KnowledgeHerbarium: React.FC<Props> = ({ credits }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  // Calculate progress per subject
  const progress = credits.reduce((acc, credit) => {
    acc[credit.subjectArea] = (acc[credit.subjectArea] || 0) + credit.credits;
    return acc;
  }, {} as Record<SubjectArea, number>);

  const totalCredits = Object.values(progress).reduce((a, b) => a + b, 0);

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      try {
          const result = await generateParentReport(credits);
          setReport(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingReport(false);
      }
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex flex-col items-center mb-6">
           <div className="w-20 h-20 border border-sage rounded-full flex items-center justify-center mb-4 bg-paper shadow-sm transition-transform hover:scale-105 duration-500">
             <RoseMinimal className="w-12 h-12 text-sage-dark" />
           </div>
           <h1 className="font-display text-4xl text-sage-dark tracking-wide">Adeline</h1>
           <span className="text-sm italic text-gray-500 mt-2 font-serif">The Learning Concierge</span>
        </div>
        
        <DividerFlower className="w-full h-6 text-gold mb-6" />
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="mb-6">
                <h3 className="font-display text-lg mb-4 text-sage-dark flex items-center justify-between">
                    <span>Graduation Readiness</span>
                </h3>
                
                <div className="space-y-4">
                    {(Object.keys(GRADUATION_REQS) as SubjectArea[]).map((subject) => {
                        const current = progress[subject] || 0;
                        const target = GRADUATION_REQS[subject];
                        const percentage = Math.min((current / target) * 100, 100);
                        
                        return (
                            <div key={subject} className="relative">
                                <div className="flex justify-between text-xs uppercase tracking-widest mb-1 text-ink/70">
                                    <span>{subject}</span>
                                    <span>{current.toFixed(2)} / {target}</span>
                                </div>
                                <div className="h-2 w-full bg-sepia rounded-full overflow-hidden border border-gold/20">
                                    <div 
                                        className="h-full bg-sage-dark transition-all duration-1000 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-gold/20">
                     <div className="text-center">
                         <span className="font-display text-3xl text-sage-dark">{totalCredits.toFixed(2)}</span>
                         <span className="block text-xs uppercase tracking-widest text-ink/40">Total Credits Earned</span>
                     </div>
                </div>
            </div>

            {/* Recent Badges / Standards */}
            <div className="mt-8">
               <h3 className="font-display text-lg mb-2 text-sage-dark">Recent Standards</h3>
               <div className="flex flex-wrap gap-2">
                   {credits.slice(-5).reverse().map((c) => c.standards).flat().slice(0, 6).map((std, i) => (
                       <span key={i} className="text-[9px] bg-white border border-gold/30 px-1.5 py-0.5 text-ink/60 font-mono">
                           {std}
                       </span>
                   ))}
               </div>
           </div>
           
           {/* Report Generation */}
           <div className="mt-8 border-t border-gold/30 pt-4">
               {!report ? (
                   <button 
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport || credits.length === 0}
                    className="w-full py-2 border border-sage text-sage text-xs uppercase tracking-widest hover:bg-sage hover:text-white transition-colors disabled:opacity-50"
                   >
                       {isGeneratingReport ? 'Compiling...' : 'Share Progress Report'}
                   </button>
               ) : (
                   <div className="bg-white p-4 border border-gold/30 shadow-sm relative">
                       <button onClick={() => setReport(null)} className="absolute top-2 right-2 text-xs text-ink/40 hover:text-ink">✕</button>
                       <h4 className="font-bold text-xs uppercase mb-2">Progress Report</h4>
                       <div className="text-xs text-ink/80 max-h-40 overflow-y-auto italic mb-2 whitespace-pre-line">
                           {report}
                       </div>
                       <button className="text-[10px] uppercase font-bold text-sage-dark hover:underline">Download / Print</button>
                   </div>
               )}
           </div>
        </div>
    </div>
  );
};