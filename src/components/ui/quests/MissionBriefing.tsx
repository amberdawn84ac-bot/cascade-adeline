"use client";

import { motion } from 'framer-motion';
import { Target, Calendar, Star } from 'lucide-react';

interface MissionBriefingProps {
  title: string;
  description: string;
  deadline: string;
  briefing: string;
}

export function MissionBriefing({ title, description, deadline, briefing }: MissionBriefingProps) {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-200 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full filter blur-3xl opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 shadow-md">
            <Target size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-800" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              New Quest Available!
            </h2>
            <p className="text-sm text-blue-600 font-medium">Mission Briefing</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-blue-200">
          <h3 className="font-bold text-lg text-blue-700 mb-2">{title}</h3>
          <p className="text-gray-700 mb-3">{description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Calendar size={14} />
            <span>Quest Deadline: {new Date(deadline).toLocaleDateString()}</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-gray-800 leading-relaxed">{briefing}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Star size={14} />
          <span>This quest was selected for you based on your recent adventures.</span>
        </div>
      </motion.div>
    </div>
  );
}
