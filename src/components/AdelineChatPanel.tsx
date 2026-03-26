'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { FloatingBeeBubble } from './FloatingBeeBubble';

interface AdelineChatPanelProps {
  userId?: string;
  onLessonRequest?: (topic: string) => void;
  onLessonMount?: () => void;
}

/**
 * Persistent right-side chat panel. Wraps FloatingBeeBubble in panelMode
 * so the chat UI is always visible — no bubble toggle, no floating overlay.
 */
export function AdelineChatPanel({ userId = '', onLessonRequest, onLessonMount }: AdelineChatPanelProps) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#FFFEF7' }}>
      {/* Panel header */}
      <div className="shrink-0 bg-[#2F4731] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#BD6809] shrink-0">
          <Image
            src="/bee-flower.jpg"
            alt="Adeline"
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <h2
            className="text-sm font-bold text-white leading-tight truncate"
            style={{ fontFamily: 'var(--font-emilys-candy), cursive' }}
          >
            Talking with Adeline
          </h2>
          <p className="text-xs text-white/60 leading-tight">Your learning companion</p>
        </div>
        <Sparkles className="w-4 h-4 text-[#BD6809] ml-auto shrink-0" />
      </div>

      {/* Chat — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <FloatingBeeBubble
          userId={userId}
          onLessonRequest={onLessonRequest}
          onLessonMount={onLessonMount}
          panelMode
        />
      </div>
    </div>
  );
}
