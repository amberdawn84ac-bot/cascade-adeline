'use client';

import React, { useState } from 'react';

interface VideoBlockProps {
  blockData: {
    block_id: string;
    type?: string;
    // Agent format: URL is in content, title may be in metadata
    content?: string;
    metadata?: { title?: string; description?: string; duration?: string };
    // Legacy format fields
    title?: string;
    video_url?: string;
    duration?: string;
    viewing_prompts?: string[];
    analysis_prompts?: string[];
    interactive?: { viewingPrompts?: string[]; analysisPrompts?: string[]; prompts?: string[] };
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

function extractYouTubeSearchTerm(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get('search_query') || u.searchParams.get('q') || '';
  } catch {
    return '';
  }
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function isYouTubeEmbed(url: string): boolean {
  return url.includes('youtube.com/embed/') || url.includes('youtu.be/');
}

function toEmbedUrl(url: string): string | null {
  // Already an embed URL
  if (url.includes('youtube.com/embed/')) return url;
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return null;
}

export default function VideoBlock({ blockData, onResponse, studentResponse }: VideoBlockProps) {
  const [notes, setNotes] = useState(studentResponse?.notes || '');

  // Normalize: agent puts URL in content, legacy puts it in video_url
  const rawUrl: string = blockData.video_url || blockData.content || '';
  const title: string =
    blockData.title ||
    blockData.metadata?.title ||
    (rawUrl ? extractYouTubeSearchTerm(rawUrl) : '') ||
    'Video Resource';

  const viewingPrompts: string[] =
    blockData.viewing_prompts ||
    blockData.interactive?.viewingPrompts ||
    blockData.interactive?.prompts ||
    [];
  const analysisPrompts: string[] =
    blockData.analysis_prompts ||
    blockData.interactive?.analysisPrompts ||
    [];

  const handleSubmit = () => {
    if (onResponse && notes.trim()) {
      onResponse({ blockId: blockData.block_id, notes });
    }
  };

  // Case 1: embeddable YouTube video (direct watch link or embed link)
  const embedUrl = rawUrl ? toEmbedUrl(rawUrl) : null;
  if (embedUrl) {
    return (
      <div className="video-block">
        <div className="video-container">
          <div className="video-frame" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={embedUrl}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '8px' }}
            />
          </div>
          <div className="video-info">
            <h4>{title}</h4>
          </div>
        </div>
        <VideoPrompts
          viewingPrompts={viewingPrompts}
          analysisPrompts={analysisPrompts}
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // Case 2: YouTube search URL — render as a styled search card
  if (rawUrl && isYouTubeUrl(rawUrl)) {
    const searchTerm = extractYouTubeSearchTerm(rawUrl);
    return (
      <div className="video-block">
        <div
          className="rounded-xl border-2 border-[#E7DAC3] bg-[#FFFEF7] overflow-hidden"
          style={{ boxShadow: '0 2px 8px rgba(61,20,25,0.08)' }}
        >
          {/* Header bar */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#2F4731] text-white">
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 fill-white" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span className="font-semibold text-sm">Video Resource</span>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <p className="font-bold text-[#121B13] text-base mb-1">{title}</p>
            {searchTerm && (
              <p className="text-sm text-[#2F4731]/60 mb-4">
                Search: <span className="italic">{searchTerm}</span>
              </p>
            )}

            {viewingPrompts.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wide mb-2">While Watching</p>
                <ul className="space-y-1">
                  {viewingPrompts.map((p, i) => (
                    <li key={i} className="text-sm text-[#121B13] flex gap-2">
                      <span className="text-[#BD6809] shrink-0">→</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#BD6809] text-white font-bold text-sm hover:bg-[#2F4731] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Search YouTube
            </a>
          </div>
        </div>

        {analysisPrompts.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-[#FAF5E4] border border-[#E7DAC3]">
            <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wide mb-2">After Watching</p>
            <ul className="space-y-1 mb-3">
              {analysisPrompts.map((p, i) => (
                <li key={i} className="text-sm text-[#121B13] flex gap-2">
                  <span className="text-[#BD6809] shrink-0">→</span>{p}
                </li>
              ))}
            </ul>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you observe?"
              rows={3}
              className="w-full rounded-lg border border-[#E7DAC3] bg-white p-3 text-sm text-[#121B13] resize-none focus:outline-none focus:ring-2 focus:ring-[#BD6809]/40"
            />
            {notes.trim() && (
              <button
                onClick={handleSubmit}
                className="mt-2 px-4 py-1.5 rounded-lg bg-[#2F4731] text-white text-sm font-bold hover:bg-[#BD6809] transition-colors"
              >
                Save Notes
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Case 3: no URL or unknown URL — show a placeholder
  return (
    <div className="video-block">
      <div className="rounded-xl border-2 border-[#E7DAC3] bg-[#FFFEF7] px-5 py-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2F4731]/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#2F4731]" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <p className="font-bold text-[#2F4731] mb-1">{title || 'Video Resource'}</p>
        <p className="text-sm text-[#2F4731]/50">Video link unavailable</p>
      </div>
    </div>
  );
}

function VideoPrompts({
  viewingPrompts,
  analysisPrompts,
  notes,
  setNotes,
  onSubmit,
}: {
  viewingPrompts: string[];
  analysisPrompts: string[];
  notes: string;
  setNotes: (v: string) => void;
  onSubmit: () => void;
}) {
  if (viewingPrompts.length === 0 && analysisPrompts.length === 0) return null;
  return (
    <div className="mt-4 space-y-3">
      {viewingPrompts.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FAF5E4] border border-[#E7DAC3]">
          <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wide mb-2">While Watching</p>
          <ul className="space-y-1">
            {viewingPrompts.map((p, i) => (
              <li key={i} className="text-sm text-[#121B13] flex gap-2">
                <span className="text-[#BD6809] shrink-0">→</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysisPrompts.length > 0 && (
        <div className="p-4 rounded-xl bg-[#FAF5E4] border border-[#E7DAC3]">
          <p className="text-xs font-bold text-[#BD6809] uppercase tracking-wide mb-2">After Watching</p>
          <ul className="space-y-1 mb-3">
            {analysisPrompts.map((p, i) => (
              <li key={i} className="text-sm text-[#121B13] flex gap-2">
                <span className="text-[#BD6809] shrink-0">→</span>{p}
              </li>
            ))}
          </ul>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="What did you observe?"
            rows={3}
            className="w-full rounded-lg border border-[#E7DAC3] bg-white p-3 text-sm text-[#121B13] resize-none focus:outline-none focus:ring-2 focus:ring-[#BD6809]/40"
          />
          {notes.trim() && (
            <button
              onClick={onSubmit}
              className="mt-2 px-4 py-1.5 rounded-lg bg-[#2F4731] text-white text-sm font-bold hover:bg-[#BD6809] transition-colors"
            >
              Save Notes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
