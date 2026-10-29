'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BespokeIntroSequenceProps {
  onComplete: () => void;
  canSkip?: boolean;
}

/**
 * BespokeIntroSequence
 * Handcrafted cultural motion-design prologue:
 *   1. Film strip advances with authentic frame notches
 *   2. Literary book spine opens with page lift
 *   3. Musical staff lines with melodic notes drift across
 *   4. Visuals settle into the LinguaTaste editorial wordmark
 * Respects prefers-reduced-motion and offers instant skip.
 */
export default function BespokeIntroSequence({
  onComplete,
  canSkip = true,
}: BespokeIntroSequenceProps) {
  const [phase, setPhase] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Keyboard escape listener & reduced motion check
  useEffect(() => {
    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        onComplete();
        return;
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Timed progression of cultural motifs
    const timers = [
      setTimeout(() => setPhase(1), 300),   // Film reel advances
      setTimeout(() => setPhase(2), 1200),  // Book folio turns
      setTimeout(() => setPhase(3), 2100),  // Musical staff drifts
      setTimeout(() => setPhase(4), 3000),  // Settle into LinguaTaste wordmark
      setTimeout(() => {
        setIsDismissed(true);
        setTimeout(onComplete, 600);
      }, 4300),
    ];

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setIsDismissed(true);
    setTimeout(onComplete, 250);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] overflow-hidden select-none"
      >
        {/* Skip button */}
        {canSkip && (
          <button
            onClick={handleSkip}
            aria-label="Skip opening animation"
            className="absolute top-6 right-6 px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a8a29e] hover:text-[#1a1917] dark:hover:text-[#ffffff] border border-[#e7e5e4] dark:border-[#27272a] rounded-full transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer z-10"
          >
            Skip Intro [ESC]
          </button>
        )}

        {/* Central Motion Canvas */}
        <div className="relative w-full max-w-lg h-72 flex flex-col items-center justify-center px-4">
          
          {/* ── Motif 1: Cinema Film Strip (Phase 1) ── */}
          <AnimatePresence>
            {phase >= 1 && phase < 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute flex items-center justify-center"
              >
                <svg width="220" height="60" viewBox="0 0 220 60" fill="none" className="overflow-visible">
                  {/* Outer film strip */}
                  <rect x="0" y="5" width="220" height="50" rx="3" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.3" />
                  
                  {/* Top sprocket holes */}
                  {[10, 32, 54, 76, 98, 120, 142, 164, 186, 208].map((x, i) => (
                    <rect key={`sprocket-top-${i}`} x={x - 4} y="8" width="8" height="6" rx="1.5" fill="currentColor" fillOpacity="0.4" />
                  ))}

                  {/* Film frames moving */}
                  <motion.g
                    animate={{ x: [-20, 0] }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                  >
                    <rect x="18" y="18" width="56" height="24" rx="2" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                    <rect x="82" y="18" width="56" height="24" rx="2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
                    <rect x="146" y="18" width="56" height="24" rx="2" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.4" />
                  </motion.g>

                  {/* Bottom sprocket holes */}
                  {[10, 32, 54, 76, 98, 120, 142, 164, 186, 208].map((x, i) => (
                    <rect key={`sprocket-bot-${i}`} x={x - 4} y="46" width="8" height="6" rx="1.5" fill="currentColor" fillOpacity="0.4" />
                  ))}
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Motif 2: Book Folio & Turning Page (Phase 2) ── */}
          <AnimatePresence>
            {phase >= 2 && phase < 4 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute flex items-center justify-center"
              >
                <svg width="180" height="70" viewBox="0 0 180 70" fill="none">
                  {/* Left book leaf */}
                  <path d="M 90 55 C 60 52, 30 54, 15 57 L 15 22 C 30 19, 60 17, 90 20 Z" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
                  {/* Left text lines */}
                  <line x1="28" y1="28" x2="76" y2="28" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />
                  <line x1="28" y1="36" x2="72" y2="36" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />
                  <line x1="28" y1="44" x2="68" y2="44" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />

                  {/* Right book leaf */}
                  <path d="M 90 55 C 120 52, 150 54, 165 57 L 165 22 C 150 19, 120 17, 90 20 Z" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.4" />
                  {/* Right text lines */}
                  <line x1="104" y1="28" x2="152" y2="28" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />
                  <line x1="104" y1="36" x2="148" y2="36" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />
                  <line x1="104" y1="44" x2="140" y2="44" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="2 3" />

                  {/* Spine center */}
                  <line x1="90" y1="18" x2="90" y2="57" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.6" />

                  {/* Turning page animation */}
                  <motion.path
                    d="M 90 55 C 105 45, 115 35, 120 20 L 90 20 Z"
                    fill="currentColor"
                    fillOpacity="0.12"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    animate={{ scaleX: [0.9, 0.2, -0.7] }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Motif 3: Musical Staff & Notes (Phase 3) ── */}
          <AnimatePresence>
            {phase >= 3 && phase < 4 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute flex items-center justify-center w-full"
              >
                <svg width="260" height="50" viewBox="0 0 260 50" fill="none">
                  {/* 5 musical staff lines */}
                  {[10, 18, 26, 34, 42].map((y, i) => (
                    <motion.line
                      key={`staff-${i}`}
                      x1="10"
                      y1={y}
                      x2="250"
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="0.8"
                      strokeOpacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                    />
                  ))}

                  {/* Treble clef hint or notes */}
                  <circle cx="60" cy="26" r="3.5" fill="currentColor" fillOpacity="0.6" />
                  <line x1="63.5" y1="26" x2="63.5" y2="12" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />

                  <circle cx="110" cy="18" r="3.5" fill="currentColor" fillOpacity="0.6" />
                  <line x1="113.5" y1="18" x2="113.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />

                  <circle cx="150" cy="26" r="3.5" fill="currentColor" fillOpacity="0.6" />
                  <circle cx="170" cy="34" r="3.5" fill="currentColor" fillOpacity="0.6" />
                  <path d="M 153.5 26 L 153.5 12 L 173.5 20 L 173.5 34" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" fill="none" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Motif 4: Settle Into LinguaTaste Wordmark (Phase 4) ── */}
          <AnimatePresence>
            {phase >= 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                {/* Cultural Crest */}
                <div className="flex items-center justify-center gap-3 mb-3 text-[#7c3aed] dark:text-[#a78bfa]">
                  <span className="text-sm font-mono tracking-widest uppercase">Est. 2026</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs uppercase font-mono tracking-wider">Taste Intelligence</span>
                </div>

                {/* Editorial Wordmark */}
                <h1 className="text-4xl sm:text-5xl font-serif tracking-tight text-[#1a1917] dark:text-[#f7f6f4] font-normal">
                  LinguaTaste
                </h1>

                {/* Handcrafted underline */}
                <div className="w-48 mx-auto mt-2 overflow-visible">
                  <svg className="w-full h-3 text-[#7c3aed] dark:text-[#a78bfa]" viewBox="0 0 200 10" fill="none">
                    <motion.path
                      d="M 2 7 C 40 3, 90 8, 130 5 C 160 3, 185 7, 198 5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </svg>
                </div>

                <p className="mt-3 text-xs sm:text-sm font-sans tracking-wide text-[#78716c] dark:text-[#a8a29e] max-w-sm mx-auto">
                  Cultural Taste Graph • Gemini Discovery • Pedagogical Immersion
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Minimal progress indicator at bottom */}
        <div className="absolute bottom-10 flex items-center gap-2">
          {[1, 2, 3, 4].map(idx => (
            <div
              key={`dot-${idx}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                phase >= idx
                  ? 'w-6 bg-[#7c3aed] dark:bg-[#a78bfa]'
                  : 'w-1.5 bg-[#d6d3d1] dark:bg-[#3f3f46]'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
