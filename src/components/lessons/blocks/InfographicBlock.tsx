'use client';

import React from 'react';
import DOMPurify from 'dompurify';

interface InfographicBlockProps {
  blockData: {
    block_id: string;
    // Agent format: URL or description in content
    content?: string;
    metadata?: { title?: string; description?: string };
    // Legacy format fields
    title?: string;
    data_visualization?: 'timeline' | 'bar-chart' | 'network' | 'map';
    data_source?: string;
    svg_content?: string;
    interpretation_guide?: string;
    data_points?: Array<{ year?: number; label?: string; value?: number; [key: string]: any }>;
  };
  onResponse?: (response: any) => void;
  studentResponse?: any;
}

function isSearchUrl(url: string): boolean {
  return (
    url.includes('google.com/search') ||
    url.includes('google.com/images') ||
    url.includes('images.google') ||
    url.includes('bing.com/images') ||
    url.includes('pinterest.com') ||
    url.startsWith('http')
  );
}

function extractSearchTerm(url: string): string {
  try {
    const u = new URL(url);
    return u.searchParams.get('q') || u.searchParams.get('query') || '';
  } catch {
    return '';
  }
}

function isGoogleImagesUrl(url: string): boolean {
  return url.includes('google.com') && (url.includes('images') || url.includes('tbm=isch'));
}

export default function InfographicBlock({ blockData }: InfographicBlockProps) {
  const rawContent: string = blockData.content || '';
  const title: string = blockData.title || blockData.metadata?.title || 'Visual Reference';

  // Case 1: SVG content — render inline
  if (blockData.svg_content) {
    return (
      <div className="infographic-block">
        <div className="infographic-header">
          <h4>{title}</h4>
          {blockData.data_visualization && (
            <span className="visualization-type">{blockData.data_visualization}</span>
          )}
        </div>
        <div
          className="svg-container"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(blockData.svg_content, { USE_PROFILES: { svg: true } }),
          }}
        />
        {blockData.interpretation_guide && (
          <div className="interpretation-guide">
            <p>{blockData.interpretation_guide}</p>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Agent sent a URL in content — render as a styled link card
  if (rawContent && isSearchUrl(rawContent)) {
    const searchTerm = extractSearchTerm(rawContent);
    const isImages = isGoogleImagesUrl(rawContent) || rawContent.includes('images');
    const icon = isImages ? '🖼️' : '🔍';
    const label = isImages ? 'View Images' : 'Search for Visuals';

    return (
      <div
        className="rounded-xl border-2 border-[#E7DAC3] bg-[#FFFEF7] overflow-hidden"
        style={{ boxShadow: '0 2px 8px rgba(61,20,25,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-[#FAF5E4] border-b border-[#E7DAC3]">
          <span className="text-xl" aria-hidden="true">{icon}</span>
          <span className="font-bold text-[#2F4731] text-sm">Infographic / Visual</span>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="font-bold text-[#121B13] text-base mb-1">{title}</p>
          {searchTerm && (
            <p className="text-sm text-[#2F4731]/60 mb-4">
              Topic: <span className="italic">{searchTerm}</span>
            </p>
          )}
          {blockData.interpretation_guide && (
            <p className="text-sm text-[#121B13] mb-4">{blockData.interpretation_guide}</p>
          )}
          <a
            href={rawContent}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#BD6809] text-white font-bold text-sm hover:bg-[#2F4731] transition-colors"
          >
            <span>{icon}</span>
            {label}
          </a>
        </div>
      </div>
    );
  }

  // Case 3: Content is descriptive text (not a URL)
  if (rawContent) {
    return (
      <div
        className="rounded-xl border-2 border-[#E7DAC3] bg-[#FFFEF7] px-5 py-4"
        style={{ boxShadow: '0 2px 8px rgba(61,20,25,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" aria-hidden="true">📊</span>
          <h4 className="font-bold text-[#2F4731]">{title}</h4>
        </div>
        <p className="text-sm text-[#121B13] leading-relaxed">{rawContent}</p>
        {blockData.interpretation_guide && (
          <p className="mt-2 text-sm text-[#2F4731]/70 italic">{blockData.interpretation_guide}</p>
        )}
      </div>
    );
  }

  // Case 4: data_points fallback — render as a simple inline chart
  if (blockData.data_points && blockData.data_points.length > 0) {
    return (
      <div className="infographic-block">
        <div className="infographic-header">
          <h4>{title}</h4>
        </div>
        <div className="placeholder-visualization">
          <svg viewBox="0 0 400 200" className="infographic-svg w-full" style={{ maxHeight: 200 }}>
            {blockData.data_visualization === 'timeline' && (
              <g>
                <line x1="40" y1="100" x2="380" y2="100" stroke="#BD6809" strokeWidth="2" />
                {blockData.data_points.map((point, i) => {
                  const x = 60 + i * Math.min(80, 320 / Math.max(blockData.data_points!.length, 1));
                  return (
                    <g key={i}>
                      <circle cx={x} cy={100} r="6" fill="#BD6809" />
                      <text x={x} y={125} textAnchor="middle" fontSize="11" fill="#2F4731">
                        {point.year ?? point.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
            {blockData.data_visualization !== 'timeline' && (
              <g>
                {blockData.data_points.map((point, i) => {
                  const h = Math.min((point.value || 40) * 1.2, 140);
                  const x = 30 + i * 60;
                  return (
                    <g key={i}>
                      <rect x={x} y={180 - h} width="40" height={h} fill="#2F4731" rx="4" />
                      <text x={x + 20} y={196} textAnchor="middle" fontSize="10" fill="#BD6809">
                        {point.label ?? point.year}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>
    );
  }

  return null;
}
