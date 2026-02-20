"use client";

import { motion } from 'framer-motion';
import { Lightbulb, Brain } from 'lucide-react';

interface AnalogyCardProps {
  concept: string;
  analogy: string;
  interests: string[];
}

export function AnalogyCard({ concept, analogy, interests }: AnalogyCardProps) {
  return (
    <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-purple-200 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200 rounded-full filter blur-3xl opacity-50"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600 shadow-md">
            <Lightbulb size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-purple-800" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
              A New Way to Think About It
            </h2>
            <p className="text-sm text-purple-600 font-medium">Analogy for "{concept}"</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-purple-200">
          <p className="text-gray-800 leading-relaxed">
            <span className="font-semibold text-purple-700">{concept}</span> is like{' '}
            <span className="font-semibold text-pink-700">{analogy}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Brain size={14} />
          <span>Bridged to your interests: {interests.join(', ')}</span>
        </div>
      </motion.div>
    </div>
  );
}
