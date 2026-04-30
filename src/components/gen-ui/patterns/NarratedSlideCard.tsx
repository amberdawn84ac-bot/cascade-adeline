'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Slide {
  title: string;
  bullets: string[];
  voiceover: string;
  visual?: string;
}

export interface NarratedSlideCardProps {
  title: string;
  slides: Slide[];
  audioUrls?: string[];
  onSlideComplete?: (slideIndex: number) => void;
}

const CREAM = '#FFFEF7';
const PALM = '#2F4731';
const PAPAYA = '#BD6809';

export function NarratedSlideCard({
  title,
  slides,
  audioUrls,
  onSlideComplete,
}: NarratedSlideCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useBrowserTTS, setUseBrowserTTS] = useState(!audioUrls?.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const slide = slides[currentSlide];
  const hasAudio = audioUrls?.[currentSlide];

  // Stop any speech when slide changes
  useEffect(() => {
    stopAll();
    setProgress(0);
    setIsPlaying(false);
  }, [currentSlide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, []);

  function stopAll() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    utteranceRef.current = null;
  }

  function handlePlay() {
    if (isPlaying) {
      if (hasAudio && audioRef.current) {
        audioRef.current.pause();
      } else if (typeof window !== 'undefined') {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);

    if (hasAudio && audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.play();
    } else if (useBrowserTTS && typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(slide.voiceover);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        onSlideComplete?.(currentSlide);
      };
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }

  function handleMute() {
    setIsMuted(!isMuted);
    if (audioRef.current) audioRef.current.muted = !isMuted;
  }

  function goTo(index: number) {
    stopAll();
    setCurrentSlide(index);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: CREAM,
        border: `2px solid ${PALM}40`,
        borderRadius: 16,
        overflow: 'hidden',
        fontFamily: 'Kalam, "Comic Sans MS", system-ui',
      }}
    >
      {/* Header bar */}
      <div style={{
        background: PALM,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{title}</div>
        <div style={{ color: `${CREAM}99`, fontSize: '0.8rem' }}>
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          style={{ padding: '20px' }}
        >
          <div style={{ color: PALM, fontWeight: 700, fontSize: '1.1rem', marginBottom: 14 }}>
            {slide.title}
          </div>

          {/* Visual area */}
          {slide.visual && (
            <div style={{
              background: `${PAPAYA}10`,
              border: `1px dashed ${PAPAYA}`,
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 14,
              color: '#4B3424',
              fontSize: '0.82rem',
              fontStyle: 'italic',
              textAlign: 'center',
            }}>
              🎨 {slide.visual}
            </div>
          )}

          {/* Bullet points */}
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8 }}>
            {slide.bullets.map((bullet, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{ color: PALM, fontSize: '0.95rem', lineHeight: 1.5 }}
              >
                {bullet}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      {/* Audio progress bar */}
      {hasAudio && (
        <div style={{ height: 3, background: '#E7DAC3', margin: '0 16px' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: PAPAYA,
            transition: 'width 0.5s',
            borderRadius: 2,
          }} />
        </div>
      )}

      {/* Voiceover script (collapsible) */}
      <details style={{ padding: '0 16px 4px', fontSize: '0.8rem' }}>
        <summary style={{ color: PAPAYA, cursor: 'pointer', fontWeight: 600, padding: '6px 0' }}>
          📖 Read voiceover script
        </summary>
        <div style={{
          background: '#F0E8D8',
          borderRadius: 8,
          padding: '8px 12px',
          color: '#4B3424',
          lineHeight: 1.5,
          marginTop: 4,
          marginBottom: 8,
        }}>
          {slide.voiceover}
        </div>
      </details>

      {/* Controls */}
      <div style={{
        padding: '10px 16px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-between',
      }}>
        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => goTo(currentSlide - 1)}
            disabled={currentSlide === 0}
            aria-label="Previous slide"
            style={{
              background: currentSlide === 0 ? '#E7DAC3' : PALM,
              color: currentSlide === 0 ? '#4B3424' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => goTo(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
            aria-label="Next slide"
            style={{
              background: currentSlide === slides.length - 1 ? '#E7DAC3' : PALM,
              color: currentSlide === slides.length - 1 ? '#4B3424' : '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: currentSlide === slides.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Play + Mute */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!useBrowserTTS && !hasAudio && (
            <span style={{ color: '#4B3424', fontSize: '0.78rem', opacity: 0.6, fontStyle: 'italic' }}>
              No audio
            </span>
          )}
          <button
            onClick={handlePlay}
            aria-label={isPlaying ? 'Pause voiceover' : 'Play voiceover'}
            style={{
              background: PAPAYA,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 700,
              fontSize: '0.88rem',
              fontFamily: 'inherit',
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Listen'}
          </button>
          <button
            onClick={handleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            style={{
              background: '#E7DAC3',
              border: 'none',
              borderRadius: 8,
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isMuted ? <VolumeX size={16} color={PALM} /> : <Volume2 size={16} color={PALM} />}
          </button>
        </div>
      </div>

      {/* Slide dots */}
      {slides.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 12 }}>
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: idx === currentSlide ? PAPAYA : '#E7DAC3',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Hidden audio element for pre-generated audio */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={hasAudio}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setProgress((el.currentTime / el.duration) * 100);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(100);
            onSlideComplete?.(currentSlide);
          }}
        />
      )}
    </motion.div>
  );
}
