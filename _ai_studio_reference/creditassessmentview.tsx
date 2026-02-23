import React from 'react';
import { CreditAssessment, ProposedCredit } from '../types';
import { RoseMinimal } from './FloralIcons';

interface Props {
  assessment: CreditAssessment;
  onClaimCredit: (credit: ProposedCredit) => void;
  claimedCreditIds: string[];
}

export const CreditAssessmentView: React.FC<Props> = ({ assessment, onClaimCredit, claimedCreditIds }) => {
  return (
    <div className="w-full bg-[#FDFBF7] border-2 border-double border-gold/60 p-1 rounded-sm my-6 font-serif shadow-sm">
      <div className="border border-sage/20 p-6 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
        
        {/* Header */}
        <div className="text-center mb-8 border-b border-gold/30 pb-4">
          <div className="flex justify-center mb-2">
            <RoseMinimal className="w-8 h-8 text-sage-dark" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl text-ink tracking-wide uppercase">Prior Learning Assessment</h2>
          <p className="text-sage-dark italic mt-2 text-sm">Competency-Based Evaluation • Microcredit Transcript</p>
        </div>

        {/* Summary */}
        <div className="mb-8 bg-white/50 p-4 border-l-2 border-sage">
          <h3 className="text-xs font-bold uppercase tracking-widest text-sage-dark mb-2">Candidate Experience</h3>
          <p className="text-ink/90 italic leading-relaxed">"{assessment.experienceSummary}"</p>
        </div>

        {/* Credits Table */}
        <div className="space-y-4">
          <h3 className="text-center font-display text-xl text-ink mb-4">Common Core Mapping</h3>
          
          {assessment.proposedCredits.map((credit) => {
            const isClaimed = claimedCreditIds.includes(credit.id);
            
            return (
              <div key={credit.id} className="flex flex-col md:flex-row items-start gap-4 bg-white border border-gold/20 p-5 transition-all hover:border-sage/40 relative overflow-hidden">
                {/* Decorative Subject Tag */}
                <div className="absolute top-0 right-0 bg-sepia px-3 py-1 text-[10px] uppercase tracking-widest text-ink/50 font-bold rounded-bl">
                    {credit.subjectArea}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-ink">{credit.courseTitle}</span>
                    <span className="px-2 py-0.5 bg-sage text-white text-xs rounded-full font-bold shadow-sm">
                        {credit.credits.toFixed(2)} Credits
                    </span>
                  </div>
                  
                  {/* Standards List */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {credit.standards.map(std => (
                        <span key={std} className="text-[10px] font-mono bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-100" title="Common Core State Standard">
                            {std}
                        </span>
                    ))}
                  </div>

                  <p className="text-sm text-ink/70 leading-snug">{credit.reasoning}</p>
                </div>
                
                <div className="flex items-center">
                    <button
                    onClick={() => !isClaimed && onClaimCredit(credit)}
                    disabled={isClaimed}
                    className={`
                        px-6 py-2 min-w-[120px] font-display text-sm tracking-wider transition-all
                        ${isClaimed 
                        ? 'bg-sage-dark text-white cursor-default border border-sage-dark opacity-80' 
                        : 'bg-transparent border border-sage-dark text-sage-dark hover:bg-sage-dark hover:text-white'
                        }
                    `}
                    >
                    {isClaimed ? '✓ Transcripted' : 'Accredit'}
                    </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gold/30 flex justify-between items-end opacity-60">
           <div className="flex flex-col gap-1">
             <div className="w-32 h-px bg-ink/20"></div>
             <span className="text-[10px] uppercase tracking-widest">Registrar Signature</span>
           </div>
           <div className="text-[10px] uppercase tracking-widest text-right">
             Verified by Adeline AI<br/>{new Date().toLocaleDateString()}
           </div>
        </div>

      </div>
    </div>
  );
};