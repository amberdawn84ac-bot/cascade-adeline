import React, { useMemo } from 'react';
import {
  WheatDivider,
  VineDivider,
  DottedArrow,
  BraidedRope,
  LeafBranch,
  Lightbulb,
  WheatStalk,
  OliveBranch,
  Dove,
} from '../illustrations';
import {
  TranscriptCard,
  InvestigationBoard,
  ProjectImpactCard,
  MissionBriefing,
} from '@/components/gen-ui';
import { CalloutBox } from './CalloutBox';
import { HighlightSpan } from './HighlightSpan';
import { ScriptureNote } from './ScriptureNote';

const DIVIDERS = [WheatDivider, VineDivider, DottedArrow, BraidedRope];
const BULLET_ICONS = [LeafBranch, Lightbulb, WheatStalk];
const PAPAYA = '#BD6809';
const PALM = '#2F4731';
const PARADISE = '#9A3F4A';
const NEAR_BLACK = '#121B13';
const BIBLE_BOOKS = [
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  'Samuel',
  'Kings',
  'Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalm',
  'Psalms',
  'Proverb',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  'Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  'Thessalonians',
  'Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  'Peter',
  'Jude',
  'Revelation',
];

export type SketchnoteRendererProps = {
  content: string;
  mode: 'SKETCHNOTE' | 'CHAT';
  genUIPayload?: { component: string; props: Record<string, unknown> };
};

function deterministicPick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function renderInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return renderBold(part.slice(2, -2));
    if (part.startsWith('*') && part.endsWith('*')) return renderItalic(part.slice(1, -1));
    if (part.startsWith('`') && part.endsWith('`')) return renderInlineCode(part.slice(1, -1));
    return part;
  });
}

function renderDivider(seed: number) {
  const Divider = deterministicPick(DIVIDERS, seed);
  return <Divider key={`div-${seed}`} size={200} color={PALM} className="my-3" />;
}

function renderListItem(text: string, index: number) {
  const Icon = deterministicPick(BULLET_ICONS, index);
  return (
    <li key={index} style={{ listStyle: 'none', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ marginTop: 4 }}>
        <Icon size={18} color={PALM} />
      </span>
      <span style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', color: NEAR_BLACK }}>
        {renderInlineFormatting(text)}
      </span>
    </li>
  );
}

function renderInlineCode(code: string) {
  return (
    <code
      style={{
        background: '#FFF3CD',
        color: PAPAYA,
        padding: '2px 6px',
        borderRadius: 6,
        fontSize: '1.05em',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      {code}
    </code>
  );
}

function renderBold(text: string) {
  return <strong style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.15em' }}>{text}</strong>;
}

function renderItalic(text: string) {
  return <em style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>{text}</em>;
}

function renderBlockquote(text: string, index: number) {
  const hasScripture = BIBLE_BOOKS.some((book) => text.match(new RegExp(`\\b${book}\\b`, 'i')));
  if (hasScripture) {
    return <ScriptureNote key={index} text={text.trim()} />;
  }
  return (
    <blockquote
      key={index}
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        color: PARADISE,
        background: '#FFFEF7',
        borderLeft: `4px solid ${PARADISE}`,
        padding: '8px 12px',
        margin: '8px 0',
      }}
    >
      {renderInlineFormatting(text)}
    </blockquote>
  );
}

function renderHeader(line: string, level: 1 | 2 | 3, index: number) {
  const text = line.replace(/^#+\s*/, '');
  if (level === 1) {
    return (
      <h1
        key={index}
        style={{
          fontFamily: '"Emilys Candy", cursive',
          color: PAPAYA,
          fontSize: '2.2rem',
          margin: '12px 0 8px',
        }}
      >
        {text}
      </h1>
    );
  }
  return (
    <h2
      key={index}
      style={{
        fontFamily: '"Kranky", cursive',
        color: PALM,
        fontSize: level === 2 ? '1.6rem' : '1.3rem',
        fontWeight: level === 3 ? 700 : 400,
        margin: '10px 0 6px',
      }}
    >
      {level === 3 ? (
        <span style={{ fontFamily: 'Kalam, "Comic Sans MS", system-ui', fontWeight: 700, color: NEAR_BLACK }}>{text}</span>
      ) : (
        text
      )}
    </h2>
  );
}

function renderParagraph(text: React.ReactNode, index: number) {
  return (
    <p
      key={index}
      style={{
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
        color: NEAR_BLACK,
        lineHeight: 1.6,
        margin: '8px 0',
      }}
    >
      {text}
    </p>
  );
}

// Naive markdown-ish parser tailored to the specified styling rules.
function parseContent(raw: string) {
  const lines = raw.split(/\n/);
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith('---')) {
      elements.push(renderDivider(i));
      i++;
      continue;
    }
    if (line.startsWith('>')) {
      elements.push(renderBlockquote(line.replace(/^>\s?/, ''), i));
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(renderHeader(line, 1, i));
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(renderHeader(line, 2, i));
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(renderHeader(line, 3, i));
      i++;
      continue;
    }
    if (line.startsWith('- ')) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(renderListItem(lines[i].slice(2), i));
        i++;
      }
      elements.push(
        <ul key={`list-${i}`} style={{ paddingLeft: 0, margin: '8px 0', display: 'grid', gap: 6 }}>
          {items}
        </ul>,
      );
      continue;
    }

    elements.push(renderParagraph(renderInlineFormatting(line), i));
    i++;
  }

  return elements;
}

function renderGenUI(gen?: { component: string; props: Record<string, unknown> }) {
  if (!gen?.component) return null;
  switch (gen.component) {
    case 'TranscriptCard':
      return <TranscriptCard {...(gen.props as any)} />;
    case 'InvestigationBoard':
      return <InvestigationBoard {...(gen.props as any)} />;
    case 'ProjectImpactCard':
      return <ProjectImpactCard {...(gen.props as any)} />;
    case 'MissionBriefing':
      return <MissionBriefing {...(gen.props as any)} />;
    default:
      return null;
  }
}

export function SketchnoteRenderer({ content, mode, genUIPayload }: SketchnoteRendererProps) {
  const parsed = useMemo(() => (mode === 'SKETCHNOTE' ? parseContent(content) : null), [content, mode]);

  if (mode === 'CHAT') {
    return (
      <div
        style={{
          fontFamily: 'Kalam, "Comic Sans MS", system-ui',
          color: NEAR_BLACK,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFDF7', padding: '12px 14px', borderRadius: 16, border: '1px solid #E7DAC3' }}>
      {parsed}
      {renderGenUI(genUIPayload)}
    </div>
  );
}
