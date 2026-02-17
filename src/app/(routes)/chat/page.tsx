"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { WheatStalk } from '@/components/illustrations';
import { SketchnoteRenderer } from '@/components/sketchnote/SketchnoteRenderer';
import { GenUIRenderer } from '@/components/gen-ui/GenUIRenderer';
import { AdelineTyping } from '@/components/chat/AdelineTyping';
import { WaitingTips } from '@/components/chat/WaitingTips';
import { ErrorDisplay } from '@/components/chat/ErrorDisplay';

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

function ActiveDot() {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: '#3FB673',
        display: 'inline-block',
        boxShadow: '0 0 0 6px rgba(63,182,115,0.15)',
      }}
      aria-label="Adeline is active"
    />
  );
}

function getMessageText(message: { content?: string; parts?: Array<{ type?: string; text?: string }> }): string {
  if (typeof message.content === 'string' && message.content.length > 0) {
    return message.content;
  }

  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append, error } = useChat({
    api: '/api/chat',
    body: {},
  });
  const [gapNudge, setGapNudge] = useState<string | null>(null);
  const [genUIPayload, setGenUIPayload] = useState<any | null>(null);
  const [detectedIntent, setDetectedIntent] = useState<string | undefined>(undefined);
  const [showTips, setShowTips] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setAudioBase64(base64);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const clearAudio = () => {
    setAudioBase64(null);
    setRecordingDuration(0);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      setPendingImageUrl(dataUri);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setPendingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !pendingImageUrl && !audioBase64) return;
    const body: Record<string, string> = {};
    if (pendingImageUrl) body.imageUrl = pendingImageUrl;
    if (audioBase64) body.audioBase64 = audioBase64;
    handleSubmit(e, { body });
    clearImage();
    clearAudio();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, genUIPayload]);

  // Extract genUIPayload, gapNudge, and intent from the latest assistant message metadata
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    const meta = (lastAssistant as any).metadata;
    if (meta?.genUIPayload) setGenUIPayload(meta.genUIPayload);
    if (meta?.gapNudge) setGapNudge(String(meta.gapNudge));
    if (meta?.intent) setDetectedIntent(meta.intent);
  }, [messages]);

  // Show tips after 5 seconds of loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowTips(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowTips(false);
    }
  }, [isLoading]);

  const renderedMessages = useMemo(
    () =>
      messages.filter((m) => m.role !== 'system').map((m, idx) => {
        const isUser = m.role === 'user';
        return (
          <div key={idx} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '78%',
                background: isUser ? PALM : '#FFFFFF',
                color: isUser ? '#FFFFFF' : '#121B13',
                padding: '12px 14px',
                borderRadius: isUser ? '14px 0 14px 14px' : '0 14px 14px 14px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                border: isUser ? `1px solid rgba(47,71,49,0.3)` : '1px solid #E7DAC3',
              }}
            >
              {isUser ? (
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'Kalam, "Comic Sans MS", system-ui' }}>{getMessageText(m)}</div>
              ) : (
                <SketchnoteRenderer content={getMessageText(m)} mode={gapNudge ? 'SKETCHNOTE' : 'CHAT'} genUIPayload={genUIPayload || undefined} />
              )}
            </div>
          </div>
        );
      }),
    [messages, genUIPayload, gapNudge],
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: CREAM,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid #E7DAC3',
          position: 'sticky',
          top: 0,
          background: CREAM,
          zIndex: 10,
        }}
      >
        <WheatStalk size={40} color={PAPAYA} />
        <div>
          <div style={{ fontFamily: '"Emilys Candy", cursive', color: PALM, fontSize: '1.5rem' }}>Dear Adeline</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B3424', fontSize: 12 }}>
            <ActiveDot />
            <span>Adeline is here</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
              if (lastUserMsg) {
                append({ role: 'user', content: getMessageText(lastUserMsg) });
              }
            }}
          />
        )}
import { Lightbulb, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ... (previous imports)

// ... (inside component)
        {/* Gap Nudge */}
        <AnimatePresence>
          {gapNudge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                background: '#FFFDF5',
                border: `1px solid ${PAPAYA}`,
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'start',
                gap: 12,
                boxShadow: '0 4px 12px rgba(189,104,9,0.1)',
                marginBottom: 8,
              }}
            >
              <div style={{ 
                background: `${PAPAYA}20`, 
                padding: 8, 
                borderRadius: '50%',
                color: PAPAYA
              }}>
                <Lightbulb size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: PALM, fontSize: '0.9rem', marginBottom: 4 }}>
                  Adeline's Insight
                </div>
                <div style={{ color: '#4B3424', fontSize: '0.95rem', lineHeight: 1.4 }}>
                  {gapNudge}
                </div>
              </div>
              <button 
                onClick={() => setGapNudge(null)}
                style={{ color: '#4B3424', opacity: 0.5, cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {renderedMessages}

        {genUIPayload && <GenUIRenderer payload={genUIPayload} />}

        {isLoading && <AdelineTyping intent={detectedIntent} />}
        {isLoading && <WaitingTips show={showTips} />}

        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={handleFormSubmit}
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'rgba(255,254,247,0.95)',
          padding: '10px 14px',
          borderTop: '1px solid #E7DAC3',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {imagePreview && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img
              src={imagePreview}
              alt="Upload preview"
              style={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 10,
                border: '2px solid #E7DAC3',
              }}
            />
            <span style={{ fontSize: 13, color: '#4B3424' }}>📸 Image attached</span>
            <button
              type="button"
              onClick={clearImage}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid #E7DAC3',
                background: '#FFF',
                color: '#4B3424',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}
        {audioBase64 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎙️</span>
            <span style={{ fontSize: 13, color: '#4B3424' }}>Voice memo ready ({recordingDuration}s)</span>
            <button
              type="button"
              onClick={clearAudio}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid #E7DAC3',
                background: '#FFF',
                color: '#4B3424',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Snap to Log — upload a photo of your work"
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid #E7DAC3',
              background: imagePreview ? '#FFF3E7' : '#FFFFFF',
              color: '#4B3424',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            📷
          </button>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            title={isRecording ? 'Stop recording' : 'Voice Log — record what you did'}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: isRecording ? '2px solid #E53E3E' : '1px solid #E7DAC3',
              background: isRecording ? '#FED7D7' : audioBase64 ? '#FFF3E7' : '#FFFFFF',
              color: isRecording ? '#E53E3E' : '#4B3424',
              cursor: 'pointer',
              fontSize: 18,
              animation: isRecording ? 'pulse 1.5s infinite' : 'none',
            }}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={imagePreview ? 'Describe what you made (optional)...' : 'Share what you explored today...'}
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid #E7DAC3',
              background: '#FFFDF5',
              fontFamily: 'Kalam, "Comic Sans MS", system-ui',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !pendingImageUrl && !audioBase64)}
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              border: 'none',
              background: PAPAYA,
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: isLoading || (!input.trim() && !pendingImageUrl && !audioBase64) ? 'not-allowed' : 'pointer',
              opacity: isLoading || (!input.trim() && !pendingImageUrl && !audioBase64) ? 0.7 : 1,
              boxShadow: '0 6px 12px rgba(189,104,9,0.3)',
            }}
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => { setInput(''); clearImage(); }}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid #E7DAC3',
              background: '#FFFFFF',
              color: '#4B3424',
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
