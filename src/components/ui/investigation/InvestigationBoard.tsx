"use client";

import { motion } from 'framer-motion';
import { FileText, ExternalLink, Users, Lock } from 'lucide-react';

interface Source {
  id: string;
  title: string;
  content: string;
  sourceType: 'PRIMARY' | 'CURATED' | 'SECONDARY' | 'MAINSTREAM';
  similarity?: number;
}

interface Investigation {
  id: string;
  title: string;
  summary: string;
  sources: Source[];
}

interface InvestigationBoardProps {
  investigation: Investigation;
  isSharedView?: boolean;
  shareId?: string;
}

const sourceTypeColors = {
  PRIMARY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CURATED: 'bg-blue-100 text-blue-800 border-blue-200',
  SECONDARY: 'bg-amber-100 text-amber-800 border-amber-200',
  MAINSTREAM: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function InvestigationBoard({ investigation, isSharedView = false, shareId }: InvestigationBoardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}>
          {investigation.title}
        </h2>
        <p className="text-white/90">{investigation.summary}</p>
        {isSharedView && (
          <div className="flex items-center gap-2 mt-3 text-sm text-white/80">
            <Users size={14} />
            <span>Shared view - collaboration enabled</span>
          </div>
        )}
      </div>

      {/* Sources Grid */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} />
          Evidence & Sources
        </h3>
        
        <div className="grid gap-4">
          {investigation.sources.map((source, index) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${sourceTypeColors[source.sourceType]}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-sm uppercase tracking-wider">
                  {source.sourceType} SOURCE
                </h4>
                {source.similarity && (
                  <span className="text-xs opacity-75">
                    {Math.round(source.similarity * 100)}% match
                  </span>
                )}
              </div>
              <h5 className="font-semibold mb-2">{source.title}</h5>
              <p className="text-sm leading-relaxed">{source.content}</p>
              <div className="mt-3 pt-3 border-t border-current/20">
                <a
                  href="#"
                  className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                >
                  <ExternalLink size={12} />
                  View full source
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {!isSharedView && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              This investigation board can be shared for collaborative learning.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock size={12} />
              <span>Private until shared</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
