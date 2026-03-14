"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useChat } from '@ai-sdk/react';
import { Lightbulb, X, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { GenUIRenderer } from '@/components/gen-ui/GenUIRenderer';
// import QuickPrompts from '@/components/ui/quick-prompts'; // Component not found
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdelineTyping } from '@/components/chat/AdelineTyping';
import { WaitingTips } from '@/components/chat/WaitingTips';
import { SketchnoteRenderer } from '@/components/sketchnote/SketchnoteRenderer';

type GenUIPayload = {
  component: string;
  props: Record<string, any>;
};
import { ErrorDisplay } from '@/components/chat/ErrorDisplay';

// Enhanced console logging to see in terminal
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog(...args);
    // Also log to terminal via fetch
    if (args[0] && args[0].includes && args[0].includes('[ChatPage]')) {
      fetch('/api/debug-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: args.join(' ') })
      }).catch(() => {});
    }
  };
}

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
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, append, setInput, data } = useChat({
    api: '/api/chat',
    body: {},
    headers: {
      'X-Debug': 'true'
    },
    onFinish: async (message) => {
          try {
            console.log('[ChatPage] === MESSAGE FINISHED ===');
            console.log('[ChatPage] Message:', message);
            console.log('[ChatPage] Data array:', data);

            let metadata: Record<string, unknown> | null = null;
            metadata = (message as any).metadata;

            if (metadata?.gapNudge) setGapNudge(String(metadata.gapNudge));
            if (metadata?.intent) setDetectedIntent(String(metadata.intent));
          } catch (error) {
            console.error('[ChatPage] Error in onFinish:', error);
          }
        },
    onError: (error) => {
      console.error('[ChatPage] useChat error:', error);
      console.error('[ChatPage] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    },
  });
  const [genUIPayload, setGenUIPayload] = useState<GenUIPayload | null>(null);
  const [gapNudge, setGapNudge] = useState<string | null>(null);
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  // Extract GenUI payload from data array (Vercel AI SDK auto-populates from '2:' stream chunks)
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('[ChatPage] Data array updated:', data);
      // Find the most recent genUIPayload in the data array
      for (let i = data.length - 1; i >= 0; i--) {
        const item = data[i];
        if (item && typeof item === 'object' && 'genUIPayload' in item) {
          console.log('[ChatPage] Found genUIPayload in data:', item.genUIPayload);
          setGenUIPayload(item.genUIPayload as GenUIPayload);
          break;
        }
      }
    }
  }, [data]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, genUIPayload]);

  // Extract genUIPayload, gapNudge, and intent from the latest assistant message
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    
    let extractedPayload = null;
    let extractedIntent = null;
    let extractedNudge = null;
    
    // 1. Check message.data array (Vercel Data Stream '2:' chunks end up here)
    const dataArray = (lastAssistant as any).data || [];
    if (Array.isArray(dataArray)) {
      dataArray.forEach((item: any) => {
        if (item?.genUIPayload) extractedPayload = item.genUIPayload;
        else if (item?.component) extractedPayload = item; // Direct payload fallback
        if (item?.intent) extractedIntent = item.intent;
        if (item?.gapNudge) extractedNudge = item.gapNudge;
      });
    }
    
    // 2. Check message.annotations array (Vercel AI SDK v6 fallback)
    const annotations = (lastAssistant as any).annotations || [];
    if (Array.isArray(annotations)) {
      annotations.forEach((annotation: any) => {
        if (annotation?.genUIPayload) extractedPayload = annotation.genUIPayload;
        else if (annotation?.component) extractedPayload = annotation;
        if (annotation?.intent) extractedIntent = annotation.intent;
        if (annotation?.gapNudge) extractedNudge = annotation.gapNudge;
      });
    }
    
    // 3. Fallback to metadata or direct properties
    const meta = (lastAssistant as any).metadata || {};
    if (!extractedPayload) {
      let rawPayload = (lastAssistant as any).genUIPayload || meta.genUIPayload || meta.genuiPayload;
      if (typeof rawPayload === 'string') {
        try { rawPayload = JSON.parse(rawPayload); } catch (e) {}
      }
      extractedPayload = rawPayload;
    }
    if (!extractedIntent) extractedIntent = meta.intent || (lastAssistant as any).intent;
    if (!extractedNudge) extractedNudge = meta.gapNudge || (lastAssistant as any).gapNudge;
    
    // Safely validate and set state
    if (extractedPayload && typeof extractedPayload === 'object' && (extractedPayload.component || extractedPayload.component === 'TIMELINE')) {
      setGenUIPayload(extractedPayload);
    } else {
      setGenUIPayload(null);
    }
    if (extractedIntent) setDetectedIntent(extractedIntent);
    if (extractedNudge) setGapNudge(String(extractedNudge));
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
                <SketchnoteRenderer 
                  content={getMessageText(m)} 
                  mode={detectedIntent && ['INVESTIGATE', 'LIFE_LOG', 'BRAINSTORM', 'REFLECT', 'ASSESS', 'ANALOGY'].includes(detectedIntent) ? 'SKETCHNOTE' : 'CHAT'} 
                  genUIPayload={genUIPayload || undefined} 
                />
              )}
            </div>
          </div>
        );
      }),
    [messages, genUIPayload, detectedIntent],
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
        {/* <WheatStalk size={40} color={PAPAYA} /> */}
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
        {/* Gap Nudge */}
        {/* <AnimatePresence>
          {gapNudge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">{gapNudge}</span>
                <button
                  onClick={() => setGapNudge(null)}
                  className="ml-auto text-yellow-600 hover:text-yellow-800"
                >
                  <X className="w-4 h-4" />
                </button>
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
        </AnimatePresence> */}

        {renderedMessages}

        {genUIPayload && <GenUIRenderer payload={genUIPayload} />}

        {isLoading && <AdelineTyping intent={detectedIntent ?? undefined} />}
        {isLoading && <WaitingTips show={showTips} />}

        <div ref={messagesEndRef} />
      </main>

      <form
        onSubmit={handleSubmit}
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
            onChange={(e) => setInput(e.target.value)}
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

