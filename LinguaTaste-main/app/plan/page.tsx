'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Sparkles,
  Clock,
  BookOpen,
  Film,
  Tv,
  Music,
  ArrowRight,
  Download,
  RefreshCw,
  Play,
  CheckCircle2,
  ChevronRight,
  Award,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { WeeklySession, ContentCandidate, MediaType } from '@/lib/types';
import LearningSessionModal from '@/components/LearningSessionModal';

const MEDIUM_ICONS: Record<MediaType, React.ComponentType<{ className?: string }>> = {
  movie: Film,
  tv: Tv,
  music: Music,
  book: BookOpen,
};

export default function WeeklyPlanPage() {
  const {
    weeklyPlan,
    generatePlan,
    candidates,
    userProfile,
    isLoading,
  } = useAppStore();

  const [activeSession, setActiveSession] = useState<WeeklySession | null>(null);

  const handleGeneratePlan = async () => {
    await generatePlan(1);
  };

  const handleExportPlan = () => {
    if (!weeklyPlan) return;
    const jsonStr = JSON.stringify(weeklyPlan, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linguataste-immersion-plan-${userProfile?.targetLanguage || 'immersion'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convert session candidate to ContentCandidate for the modal
  const getCandidateForSession = (session: WeeklySession): ContentCandidate => {
    return session.content;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] px-4 sm:px-6 lg:px-12 py-10 max-w-7xl mx-auto w-full space-y-10 transition-colors duration-200">
      
      {/* ── Page Header ── */}
      <div className="space-y-3 pb-6 border-b border-[#e7e5e4] dark:border-[#27272a]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]">
            Paced Immersion
          </span>
          <span className="text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono capitalize">
            7-Day Schedule • {userProfile?.targetLanguage || 'korean'} ({userProfile?.cefrLevel || 'A1'})
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1917] dark:text-[#f7f6f4]">
              Weekly Immersion Plan
            </h1>
            <p className="text-sm text-[#57534e] dark:text-[#a8a29e] max-w-2xl mt-1 font-serif">
              Structured daily study sessions balancing cinema, music, television, and reading, complete with pre-teach vocabulary.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {weeklyPlan && (
              <button
                type="button"
                onClick={handleExportPlan}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] text-xs font-mono font-semibold text-[#1a1917] dark:text-[#f7f6f4] hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Plan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isLoading || candidates.length === 0}
              className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{weeklyPlan ? 'Regenerate Plan' : 'Synthesize 7-Day Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics Bar ── */}
      {weeklyPlan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] block">
              Total Commitment
            </span>
            <span className="font-editorial text-2xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
              {Math.round(weeklyPlan.totalMinutes / 60)}h / week
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] block">
              Target CEFR
            </span>
            <span className="font-editorial text-2xl font-bold text-[#7c3aed] dark:text-[#a78bfa]">
              {userProfile?.cefrLevel || 'B1'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] block">
              Daily Sessions
            </span>
            <span className="font-editorial text-2xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
              {weeklyPlan.sessions.length} days
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] block">
              Target Language
            </span>
            <span className="font-editorial text-2xl font-bold text-[#1a1917] dark:text-[#f7f6f4] capitalize">
              {userProfile?.targetLanguage || 'korean'}
            </span>
          </div>
        </div>
      )}

      {/* ── Weekly Plan Grid ── */}
      {!weeklyPlan ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#141418] border border-dashed border-[#e7e5e4] dark:border-[#27272a] space-y-5">
          <Calendar className="w-12 h-12 text-[#7c3aed] dark:text-[#a78bfa] mx-auto opacity-70" />
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
              No Immersion Plan Generated Yet
            </h3>
            <p className="text-xs text-[#57534e] dark:text-[#a8a29e]">
              {candidates.length > 0
                ? 'You have curated recommendations ready! Click "Synthesize 7-Day Plan" above to create your structured learning schedule.'
                : 'First generate recommendations on the Discovery Desk, then create your 7-day immersion calendar.'}
            </p>
          </div>

          <div className="pt-2">
            {candidates.length > 0 ? (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Generate 7-Day Plan Now</span>
              </button>
            ) : (
              <Link
                href="/discover"
                className="px-6 py-3 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all cursor-pointer inline-flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Go to Discovery Desk First</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyPlan.sessions.map((session, idx) => {
              const Icon = MEDIUM_ICONS[session.content.entity.type] || Film;

              return (
                <div
                  key={`${session.day}-${idx}`}
                  className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative"
                >
                  <div className="space-y-4">
                    
                    {/* Day badge & Duration */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] text-xs font-mono font-bold">
                        {session.day}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{session.durationMinutes} min</span>
                      </div>
                    </div>

                    {/* Media title & medium */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] mb-1">
                        <Icon className="w-3 h-3 text-[#7c3aed] dark:text-[#a78bfa]" />
                        <span>{session.content.entity.type}</span>
                      </div>
                      <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4] line-clamp-1">
                        {session.content.entity.name}
                      </h3>
                      <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1.5 line-clamp-2 leading-relaxed">
                        {session.tasteMatchExplanation || session.activity}
                      </p>
                    </div>

                    {/* Pre-teach vocabulary chips */}
                    {session.preTeachVocabulary && session.preTeachVocabulary.length > 0 && (
                      <div className="pt-2 border-t border-[#e7e5e4] dark:border-[#27272a] space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#a8a29e] dark:text-[#71717a] block font-semibold">
                          Pre-teach Vocabulary
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {session.preTeachVocabulary.slice(0, 3).map(vocab => (
                            <span
                              key={vocab.word}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] text-[#1a1917] dark:text-[#f7f6f4]"
                              title={vocab.translation}
                            >
                              <strong className="font-semibold">{vocab.word}</strong>: {vocab.translation}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Start Session Trigger */}
                  <div className="pt-5 mt-4 border-t border-[#e7e5e4] dark:border-[#27272a]">
                    <button
                      type="button"
                      onClick={() => setActiveSession(session)}
                      className="w-full py-2.5 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] hover:bg-[#7c3aed] hover:text-white dark:hover:bg-[#a78bfa] dark:hover:text-[#0d0d11] text-xs font-mono font-semibold text-[#1a1917] dark:text-[#f7f6f4] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Immersion Session</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Session Modal ── */}
      {activeSession && (
        <LearningSessionModal
          candidate={getCandidateForSession(activeSession)!}
          onClose={() => setActiveSession(null)}
        />
      )}

    </div>
  );
}
