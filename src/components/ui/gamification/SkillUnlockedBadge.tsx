"use client";

import { motion } from 'framer-motion';
import { Check, Sparkles, Dna, FlaskConical, Calculator, Feather, ScrollText, Gamepad2 } from 'lucide-react';
import Confetti from 'react-confetti';

const SUBJECT_ICONS: Record<string, typeof Dna> = {
  science: FlaskConical,
  math: Calculator,
  ela: Feather,
  history: ScrollText,
  arcade: Gamepad2,
  default: Dna,
};

interface SkillUnlockedBadgeProps {
  activityName: string;
  subjects: string[];
  credits: number;
  scheduledConcepts: string[];
}

export function SkillUnlockedBadge({ activityName, subjects, credits, scheduledConcepts }: SkillUnlockedBadgeProps) {
  const primarySubject = subjects[0]?.split(':')[0]?.toLowerCase() || 'default';
  const Icon = SUBJECT_ICONS[primarySubject] || SUBJECT_ICONS.default;

  return (
    <div className="relative bg-white rounded-2xl p-6 shadow-lg border border-gray-200 overflow-hidden">
      <Confetti recycle={false} numberOfPieces={100} width={400} height={300} />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="text-center"
      >
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4">
          <Icon className="text-green-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          New Skill Unlocked!
        </h2>
        <p className="text-lg font-semibold text-gray-600 mt-1">{activityName}</p>

        <div className="mt-4 space-y-2 text-left text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-500" size={16} />
            <span>
              <span className="font-bold">Subjects:</span> {subjects.join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="text-blue-500" size={16} />
            <span>
              <span className="font-bold">Credits Logged:</span> {credits.toFixed(2)}
            </span>
          </div>
          {scheduledConcepts.length > 0 && (
            <div className="flex items-center gap-2">
              <Dna className="text-purple-500" size={16} />
              <span>
                <span className="font-bold">Concepts for Review:</span> {scheduledConcepts.join(', ')}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4">Your parent has been notified to approve this entry for your official transcript.</p>
      </motion.div>
    </div>
  );
}
