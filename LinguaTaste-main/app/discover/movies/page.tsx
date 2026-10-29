'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Film,
  Sparkles,
  RefreshCw,
  Compass,
  ArrowLeft,
  SlidersHorizontal,
  Clock,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ContentCandidate } from '@/lib/types';
import DiscoverySideRail from '@/components/DiscoverySideRail';
import CinemaHeaderAnimation from '@/components/CinemaHeaderAnimation';
import CandidateCard from '@/components/CandidateCard';
import LearningSessionModal from '@/components/LearningSessionModal';

export default function MoviesDiscoveryPage() {
  const {
    userProfile,
    byCategory,
    candidates,
    isLoading,
    runAnalysis,
    setUserProfile,
  } = useAppStore();

  const [activeModalCandidate, setActiveModalCandidate] = useState<ContentCandidate | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'advanced'>('all');

  const movieCandidates = byCategory.movie || candidates.filter(c => c.entity.type === 'movie');

  const filteredMovies = movieCandidates.filter(c => {
    if (difficultyFilter === 'easy') return c.difficultyScore <= 5.0;
    if (difficultyFilter === 'advanced') return c.difficultyScore > 5.0;
    return true;
  });

  const counts = {
    all: candidates.length,
    movie: movieCandidates.length,
    tv: byCategory.tv?.length || 0,
    music: byCategory.music?.length || 0,
    book: byCategory.book?.length || 0,
  };

  const handleRunMovieDiscovery = async () => {
    const seedNames = (userProfile?.seedEntities || []).map(s => s.name);
    await runAnalysis(
      seedNames,
      userProfile?.targetLanguage || 'korean',
      userProfile?.cefrLevel || 'A1',
      ['movie']
    );
  };

  const handleAddSeed = (seedName: string) => {
    if (!seedName.trim()) return;
    const existing = userProfile?.seedEntities || [];
    if (existing.some(s => s.name.toLowerCase() === seedName.toLowerCase())) return;
    setUserProfile({
      seedEntities: [
        ...existing,
        { id: seedName.trim(), name: seedName.trim(), type: 'movie' },
      ],
    });
  };

  return (
    <div className="flex-1 flex w-full bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] transition-colors duration-200">
      
      {/* ── Collapsible Side Rail ── */}
      <DiscoverySideRail
        onAddSeed={handleAddSeed}
        counts={counts}
      />

      {/* ── Main Movies Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        
        {/* Breadcrumb & Navigation Back */}
        <div className="flex items-center justify-between text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 hover:text-[#1a1917] dark:hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery Desk</span>
          </Link>
          <span className="uppercase tracking-wider">
            Medium: Cinema & Feature Films
          </span>
        </div>

        {/* Bespoke Category Header Animation */}
        <CinemaHeaderAnimation />

        {/* Page Title & Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#e7e5e4] dark:border-[#27272a]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]">
                Cinema Showcase
              </span>
              <span className="text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono capitalize">
                {userProfile?.targetLanguage || 'korean'} ({userProfile?.cefrLevel || 'A1'})
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1917] dark:text-[#f7f6f4]">
              Feature Cinema & Narrative Immersion
            </h1>
            <p className="text-sm text-[#57534e] dark:text-[#a8a29e] max-w-2xl font-serif">
              Visual storytelling grounds target-language dialogue in rich situational context, body language, and cultural atmosphere.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRunMovieDiscovery}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Qloo...' : 'Curate Cinema'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Sorting Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="font-bold">Difficulty Filter:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDifficultyFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                  difficultyFilter === 'all'
                    ? 'bg-[#7c3aed] text-white font-bold'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                }`}
              >
                All Levels ({movieCandidates.length})
              </button>
              <button
                type="button"
                onClick={() => setDifficultyFilter('easy')}
                className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                  difficultyFilter === 'easy'
                    ? 'bg-[#7c3aed] text-white font-bold'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                }`}
              >
                A1–B1 Accessible
              </button>
              <button
                type="button"
                onClick={() => setDifficultyFilter('advanced')}
                className={`px-2.5 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                  difficultyFilter === 'advanced'
                    ? 'bg-[#7c3aed] text-white font-bold'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10'
                }`}
              >
                B2–C2 Advanced
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#78716c] dark:text-[#a1a1aa]">
            Showing {filteredMovies.length} verified films
          </div>
        </div>

        {/* Film Cards Grid */}
        {filteredMovies.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#141418] border border-dashed border-[#e7e5e4] dark:border-[#27272a] space-y-4">
            <Film className="w-10 h-10 text-[#7c3aed] dark:text-[#a78bfa] mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                No Cinema Recommendations Found
              </h3>
              <p className="text-xs text-[#57534e] dark:text-[#a8a29e] max-w-md mx-auto">
                Click &ldquo;Curate Cinema&rdquo; to discover authentic target-language films mathematically aligned with your taste seeds.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunMovieDiscovery}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Curate Cinema Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMovies.map(candidate => (
              <CandidateCard
                key={candidate.entity.id}
                candidate={candidate}
                onAddSession={() => setActiveModalCandidate(candidate)}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Learning Session Modal ── */}
      {activeModalCandidate && (
        <LearningSessionModal
          candidate={activeModalCandidate}
          onClose={() => setActiveModalCandidate(null)}
        />
      )}

    </div>
  );
}
