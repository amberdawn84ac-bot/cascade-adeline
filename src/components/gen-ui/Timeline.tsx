'use client';

import { motion } from 'framer-motion';
import { Calendar, Circle } from 'lucide-react';

interface TimelineProps {
  content: string;
  title?: string;
  events?: Array<{ date: string; event: string }>;
}

export function Timeline({ events = [], title }: any) {
  console.log('[Timeline] Props received:', { events, title });
  
  // Safely handle missing arrays
  const safeEvents = Array.isArray(events) ? events : [];
  
  return (
    <div className="my-4 p-4 border-2 border-amber-900/20 bg-[#fdfbf7] rounded-xl shadow-sm font-serif">
      <h3 className="text-xl font-bold text-amber-900 mb-4 border-b border-amber-900/10 pb-2">
        {title || "Historical Timeline"}
      </h3>
      <div className="space-y-4">
        {safeEvents.map((item: any, i: number) => (
          <div key={i} className="flex gap-4">
            <div className="font-bold text-amber-800 w-16 shrink-0">
              {item.year || item.date || "..."}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{item.title || item.event || "Event"}</div>
              {(item.description || item.details) && (
                <div className="text-slate-700 text-sm mt-1">{item.description || item.details}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
