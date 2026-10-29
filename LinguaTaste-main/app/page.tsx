'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass,
  Film,
  Tv,
  Music,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Languages,
  CheckCircle2,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  BrainCircuit,
  Headphones,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { SAMPLE_PERSONAS } from '@/lib/types';
import BespokeIntroSequence from '@/components/BespokeIntroSequence';

export default function LandingPage() {
  const router = useRouter();
  const { userProfile, setUserProfile, introPlayed, setIntroPlayed } = useAppStore();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Only show opening animation if not previously shown in this session
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('linguataste_intro_seen') : null;
    if (!hasSeen && !introPlayed) {
      setShowIntro(true);
    }
  }, [introPlayed]);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setIntroPlayed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('linguataste_intro_seen', 'true');
    }
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  const handleLoadPersona = (persona: typeof SAMPLE_PERSONAS[0]) => {
    setUserProfile({
      targetLanguage: persona.targetLanguage,
      cefrLevel: persona.cefrLevel,
      weeklyHours: persona.weeklyHours,
      seedEntities: persona.seedNames.map(name => ({ id: name, name, type: 'movie' as const })),
    });
    router.push('/discover');
  };

  return (
    <>
      {showIntro && (
        <BespokeIntroSequence onComplete={handleIntroComplete} canSkip={true} />
      )}

      <div className="flex-1 flex flex-col bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] transition-colors duration-200">
        
        {/* ── Editorial Top Notice / Replay Pill ── */}
        <section className="border-b border-[#e7e5e4] dark:border-[#27272a] bg-black/[0.02] dark:bg-white/[0.02] py-2 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#78716c] dark:text-[#a1a1aa]">
            <span className="font-mono text-[11px] tracking-wider uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Issue Nº 04 • The Taste-Matched Immersion Edition
            </span>
            <button
              type="button"
              onClick={handleReplayIntro}
              className="inline-flex items-center gap-1 text-[11px] font-mono hover:text-[#1a1917] dark:hover:text-[#ffffff] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Replay Prologue</span>
            </button>
          </div>
        </section>

        {/* ── Hero Section: The Cultural Magazine Masthead ── */}
        <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#e7e5e4] dark:border-[#27272a] overflow-hidden">
          {/* Subtle editorial dotted background pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
            
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[#7c3aed] dark:text-[#a78bfa] text-xs font-mono font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CULTURAL AFFINITY × PEDAGOGICAL INTELLIGENCE</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1a1917] dark:text-[#f7f6f4] leading-[1.08]">
              Acquire your language through the culture you already adore.
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg lg:text-xl text-[#57534e] dark:text-[#a8a29e] max-w-2xl mx-auto font-serif leading-relaxed">
              LinguaTaste maps your favorite films, music, books, and TV into authentic foreign works via Qloo taste mathematics, calibrated to your exact CEFR fluency.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/discover"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Curate Your Immersion</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/taste"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] text-[#1a1917] dark:text-[#f7f6f4] hover:bg-black/5 dark:hover:bg-white/5 font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <BrainCircuit className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
                <span>Explore Taste DNA</span>
              </Link>
            </div>

            {/* Current Active Language Pill */}
            <div className="pt-4 flex items-center justify-center gap-2 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
              <span>Active Target:</span>
              <span className="capitalize font-semibold text-[#1a1917] dark:text-[#f7f6f4]">
                {userProfile?.targetLanguage || 'korean'}
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] font-bold">
                {userProfile?.cefrLevel || 'A1'}
              </span>
              <span>•</span>
              <span>{userProfile?.seedEntities?.length || 0} taste seeds</span>
            </div>

          </div>
        </section>

        {/* ── Section 2: Four Media Gateways ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#e7e5e4] dark:border-[#27272a] max-w-7xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] font-bold">
              Media Channels
            </span>
            <h2 className="font-editorial text-3xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
              Four Distinctive Mediums of Immersion
            </h2>
            <p className="text-sm text-[#57534e] dark:text-[#a8a29e]">
              Each artform possesses its own rhythm, linguistic density, and cultural nuance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. Cinema */}
            <Link
              href="/discover/movies"
              className="group p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/50 dark:hover:border-[#a78bfa]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Film className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] dark:group-hover:text-[#a78bfa] transition-colors">
                    Cinema
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1.5 leading-relaxed">
                    Feature-length narrative depth. Visual context grounds natural conversational cadence and cultural idioms.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>Explore Cinema</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 2. Television */}
            <Link
              href="/discover/tv"
              className="group p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/50 dark:hover:border-[#a78bfa]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Tv className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] dark:group-hover:text-[#a78bfa] transition-colors">
                    TV Dramas
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1.5 leading-relaxed">
                    Serialized conversational exposure. Ideal 20-45m episodic lengths for daily spaced-repetition listening.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>Explore Dramas</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 3. Music */}
            <Link
              href="/discover/music"
              className="group p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/50 dark:hover:border-[#a78bfa]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] dark:group-hover:text-[#a78bfa] transition-colors">
                    Music & Audio
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1.5 leading-relaxed">
                    Phonetic ear training and rhythm. Shadowing lyrics accelerates intonation and vocabulary memorization.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>Explore Music</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            {/* 4. Literature */}
            <Link
              href="/discover/books"
              className="group p-6 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/50 dark:hover:border-[#a78bfa]/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] dark:group-hover:text-[#a78bfa] transition-colors">
                    Literature
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1.5 leading-relaxed">
                    Syntactic density and grammatical precision. Graded readers, contemporary novellas, and graphic fiction.
                  </p>
                </div>
              </div>
              <div className="pt-6 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>Explore Books</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

          </div>
        </section>

        {/* ── Section 3: Curated Persona Quick Launchers ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#e7e5e4] dark:border-[#27272a] max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] font-bold">
                Editorial Profiles
              </span>
              <h2 className="font-editorial text-3xl font-bold text-[#1a1917] dark:text-[#f7f6f4] mt-1">
                Test with Curated Taste Profiles
              </h2>
              <p className="text-sm text-[#57534e] dark:text-[#a8a29e] mt-1">
                Load an authentic cultural profile to experience taste-matched discovery instantly.
              </p>
            </div>
            <Link
              href="/discover"
              className="text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold hover:underline flex items-center gap-1"
            >
              <span>Or build your custom profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAMPLE_PERSONAS.map(persona => (
              <div
                key={persona.name}
                className="p-5 rounded-2xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{persona.emoji}</span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]">
                      {persona.cefrLevel}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                      {persona.name}
                    </h3>
                    <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1 line-clamp-2">
                      {persona.description}
                    </p>
                  </div>

                  {/* Seed previews */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase text-[#a8a29e] dark:text-[#71717a] block mb-1.5 font-semibold">
                      Taste Seeds
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {persona.seedNames.map(seedName => (
                        <span
                          key={seedName}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/[0.03] dark:bg-white/[0.04] text-[#57534e] dark:text-[#a1a1aa] border border-black/[0.04] dark:border-white/[0.04]"
                        >
                          {seedName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
                  <button
                    type="button"
                    onClick={() => handleLoadPersona(persona)}
                    className="w-full py-2 px-3 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] hover:bg-[#7c3aed] hover:text-white dark:hover:bg-[#a78bfa] dark:hover:text-[#0d0d11] text-xs font-mono font-semibold text-[#1a1917] dark:text-[#f7f6f4] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Load Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 4: Architectural Intelligence (Why LinguaTaste Works) ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-sm space-y-10">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#7c3aed] dark:text-[#a78bfa] font-bold">
                The Intelligence Engine
              </span>
              <h2 className="font-editorial text-3xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                Mathematical Taste Grounding vs. Generic AI Guesswork
              </h2>
              <p className="text-sm text-[#57534e] dark:text-[#a8a29e]">
                Standard language apps recommend generic clichés. LinguaTaste computes multidimensional cultural vectors using Qloo, verified by Gemini pedagogical reasoning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] space-y-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  Zero Hallucinations
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] leading-relaxed">
                  Recommendations originate from canonical catalog identifiers with verified streaming and licensing availability, never invented titles.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] space-y-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  Calibrated CEFR Scoring
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] leading-relaxed">
                  Difficulty ratings are anchored to real lexical density, speaking rate, and grammar requirements, avoiding repetitive median scores.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] space-y-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  7-Day Immersion Calendar
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] leading-relaxed">
                  Paced weekly sessions allocate listening, reading, and viewing blocks with custom pre-teach vocabulary for effortless immersion.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
              <div className="text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono">
                Ready to transform how you learn languages?
              </div>
              <Link
                href="/discover"
                className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-1.5"
              >
                <span>Enter Discovery Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
