import React, { useState, useEffect } from 'react';
import { Club, Opportunity } from '../types';
import { DividerFlower } from './FloralIcons';

// --- Societies / Clubs Component ---
interface SocietiesViewProps {
  clubs: Club[];
  onJoinToggle: (id: string) => void;
  joinedIds: string[];
  isLoading: boolean;
  emptyMessage?: string;
}

export const SocietiesView: React.FC<SocietiesViewProps> = ({ 
  clubs, 
  onJoinToggle, 
  joinedIds, 
  isLoading,
  emptyMessage = "Searching for societies..." 
}) => {
  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {clubs.map((club) => {
        const isJoined = joinedIds.includes(club.id);
        return (
          <div key={club.id} className={`bg-white border p-6 transition-all relative group ${isJoined ? 'border-sage shadow-md' : 'border-gold/30 shadow-sm'}`}>
            {isJoined && (
              <div className="absolute top-0 right-0 bg-sage text-white text-[10px] uppercase px-2 py-1 font-bold">Member</div>
            )}
            <h3 className="font-display text-xl text-ink mb-1 group-hover:text-sage-dark transition-colors">{club.name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-3">{club.focus}</p>
            
            <p className="text-sm text-ink/70 mb-4 leading-relaxed line-clamp-3">{club.description}</p>
            
            <div className="bg-sepia/30 p-3 rounded mb-4">
              <span className="block text-[9px] uppercase font-bold text-sage-dark mb-1">Current Challenge</span>
              <p className="text-xs italic text-ink/80">"{club.currentChallenge}"</p>
            </div>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gold/10">
              <span className="text-xs text-ink/40">{club.members} Members</span>
              <button 
                onClick={() => onJoinToggle(club.id)}
                className={`px-4 py-1 text-xs uppercase tracking-widest border transition-colors ${isJoined ? 'border-red-200 text-red-400 hover:bg-red-50' : 'border-sage text-sage hover:bg-sage hover:text-white'}`}
              >
                {isJoined ? 'Leave' : 'Join'}
              </button>
            </div>
          </div>
        );
      })}
      {clubs.length === 0 && !isLoading && (
        <div className="col-span-full text-center py-20 opacity-50">
           {emptyMessage}
        </div>
      )}
    </div>
  );
};

// --- Opportunities / Bulletin Component ---
interface BulletinViewProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  domain: string;
}

export const BulletinView: React.FC<BulletinViewProps> = ({ opportunities, isLoading, domain }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <div className="text-center mb-8">
        <h3 className="font-display text-2xl text-ink">{domain} Opportunities</h3>
        <DividerFlower className="w-32 h-6 text-gold mx-auto mt-2" />
      </div>

      {opportunities.map((opp) => (
        <div key={opp.id} className="bg-white p-6 border-l-4 border-gold shadow-sm flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              <span className="bg-ink/5 text-ink/60 text-[10px] uppercase px-2 py-0.5 rounded font-bold">{opp.type}</span>
              {opp.deadline && <span className="text-red-400 text-[10px] uppercase px-2 py-0.5 font-bold">Due: {opp.deadline}</span>}
            </div>
            <h4 className="font-display text-xl text-ink mb-1">{opp.title}</h4>
            <p className="text-xs uppercase tracking-widest text-sage-dark mb-3">{opp.organization}</p>
            <p className="text-sm text-ink/80 leading-relaxed">{opp.description}</p>
          </div>
          <div className="w-full md:w-auto flex flex-col gap-2">
            <button className="w-full px-4 py-2 bg-sage text-white text-xs uppercase tracking-widest hover:bg-sage-dark transition-colors shadow-sm">
              View Details
            </button>
            <button className="w-full px-4 py-2 border border-gold/40 text-ink/60 text-xs uppercase tracking-widest hover:bg-sepia transition-colors">
              Save
            </button>
          </div>
        </div>
      ))}
      {opportunities.length === 0 && !isLoading && (
        <div className="text-center py-20 opacity-50">
           Checking the bulletin board...
        </div>
      )}
    </div>
  );
};