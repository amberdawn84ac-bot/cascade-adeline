"use client";

import { useEffect, useState } from 'react';
import { MagnifyingGlass } from '@/components/illustrations';

const PAPAYA = '#BD6809';
const PALM = '#2F4731';

export type LibraryDoc = {
  id: string;
  title: string;
  sourceType: string;
  createdAt: string;
  chunkIndex: number;
};

function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('PRIMARY');
  const [sourceUrl, setSourceUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) {
      setStatus('Please select a file and enter a title.');
      return;
    }
    setLoading(true);
    setStatus(null);
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('source_type', sourceType);
    if (sourceUrl) form.append('source_url', sourceUrl);
    try {
      const res = await fetch('/api/hippocampus/upload', { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        setStatus(`Upload failed: ${text}`);
      } else {
        const json = await res.json();
        setStatus(`Uploaded successfully. Stored chunks: ${json.stored}`);
        setFile(null);
        setTitle('');
        setSourceUrl('');
        onUploaded();
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, background: '#FFFFFF', padding: 16, borderRadius: 14, border: '1px solid #E7DAC3', boxShadow: '0 8px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MagnifyingGlass size={32} color={PALM} />
        <h2 style={{ margin: 0, color: PALM, fontFamily: '"Emilys Candy", cursive' }}>Hippocampus Uploads</h2>
      </div>
      <label style={{ display: 'grid', gap: 6, color: '#4B3424' }}>
        <span>File (PDF or TXT)</span>
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ padding: 8, borderRadius: 10, border: '1px solid #E7DAC3', background: '#FFFDF5' }}
        />
      </label>
      <label style={{ display: 'grid', gap: 6, color: '#4B3424' }}>
        <span>Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: '1px solid #E7DAC3', background: '#FFFDF5', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}
        />
      </label>
      <label style={{ display: 'grid', gap: 6, color: '#4B3424' }}>
        <span>Source Type</span>
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: '1px solid #E7DAC3', background: '#FFFDF5', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}
        >
          {['PRIMARY', 'CURATED', 'SECONDARY', 'MAINSTREAM'].map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: 'grid', gap: 6, color: '#4B3424' }}>
        <span>Source URL (optional)</span>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: '1px solid #E7DAC3', background: '#FFFDF5', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}
        />
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: 'none',
            background: PAPAYA,
            color: '#FFFFFF',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 8px 16px rgba(189,104,9,0.25)',
          }}
        >
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      {status && (
        <div style={{ color: '#4B3424', background: '#FFF3E7', border: `1px solid ${PAPAYA}`, padding: '8px 10px', borderRadius: 10 }}>
          {status}
        </div>
      )}
    </form>
  );
}

function DocumentsList({ initial }: { initial: LibraryDoc[] }) {
  const [docs, setDocs] = useState<LibraryDoc[]>(initial);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/hippocampus/list');
      if (res.ok) {
        const json = await res.json();
        setDocs(json.documents);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDocs(initial);
  }, [initial]);

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E7DAC3', borderRadius: 14, padding: 16, boxShadow: '0 8px 16px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ margin: 0, color: PALM, fontFamily: '"Emilys Candy", cursive' }}>Library</h3>
        <button
          onClick={refresh}
          disabled={loading}
          style={{
            border: '1px solid #E7DAC3',
            borderRadius: 10,
            padding: '6px 10px',
            background: '#FFFDF5',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {docs.length === 0 ? (
          <div style={{ color: '#4B3424' }}>No documents yet.</div>
        ) : (
          docs.map((d) => (
            <div
              key={`${d.id}-${d.chunkIndex}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FFFDF5',
                borderRadius: 10,
                padding: '10px 12px',
                border: '1px solid #E7DAC3',
              }}
            >
              <div style={{ color: '#4B3424' }}>
                <div style={{ fontWeight: 700 }}>{d.title}</div>
                <div style={{ fontSize: 12 }}>Chunk {d.chunkIndex + 1} • {new Date(d.createdAt).toLocaleDateString()}</div>
              </div>
              <span style={{
                padding: '6px 10px',
                borderRadius: 999,
                background: '#EFF7EE',
                color: PALM,
                fontSize: 12,
                border: '1px solid #D5E6D3'
              }}>
                {d.sourceType}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function LibraryClient({ initialDocs }: { initialDocs: LibraryDoc[] }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // trigger refresh after upload
    setVersion((v) => v + 0);
  }, []);

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      <UploadForm onUploaded={() => setVersion((v) => v + 1)} />
      <DocumentsList key={version} initial={initialDocs} />
    </div>
  );
}
