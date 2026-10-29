'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Music,
  Sparkles,
  RefreshCw,
  Compass,
  ArrowLeft,
  SlidersHorizontal,
  Play,
  Pause,
  Volume2,
  Headphones,
  CheckCircle2,
  Disc3,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { ContentCandidate } from '@/lib/types';
import DiscoverySideRail from '@/components/DiscoverySideRail';
import MusicHeaderAnimation from '@/components/MusicHeaderAnimation';
import CandidateCard from '@/components/CandidateCard';
import LearningSessionModal from '@/components/LearningSessionModal';

export default function MusicDiscoveryPage() {
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
  const [playingPreviewUrl, setPlayingPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const musicCandidates = byCategory.music || candidates.filter(c => c.entity.type === 'music');

  const filteredMusic = musicCandidates.filter(c => {
    if (difficultyFilter === 'easy') return c.difficultyScore <= 5.0;
    if (difficultyFilter === 'advanced') return c.difficultyScore > 5.0;
    return true;
  });

  const counts = {
    all: candidates.length,
    movie: byCategory.movie?.length || 0,
    tv: byCategory.tv?.length || 0,
    music: musicCandidates.length,
    book: byCategory.book?.length || 0,
  };

  const handleToggleAudio = (previewUrl: string) => {
    if (playingPreviewUrl === previewUrl) {
      audioRef.current?.pause();
      setPlayingPreviewUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play().catch(err => {
          console.warn('Audio preview playback blocked:', err);
          setPlayingPreviewUrl(null);
        });
        setPlayingPreviewUrl(previewUrl);
      }
    }
  };

  const handleRunMusicDiscovery = async () => {
    const seedNames = (userProfile?.seedEntities || []).map(s => s.name);
    await runAnalysis(
      seedNames,
      userProfile?.targetLanguage || 'korean',
      userProfile?.cefrLevel || 'A1',
      ['music']
    );
  };

  const handleAddSeed = (seedName: string) => {
    if (!seedName.trim()) return;
    const existing = userProfile?.seedEntities || [];
    if (existing.some(s => s.name.toLowerCase() === seedName.toLowerCase())) return;
    setUserProfile({
      seedEntities: [
        ...existing,
        { id: seedName.trim(), name: seedName.trim(), type: 'music' },
      ],
    });
  };

  return (
    <div className="flex-1 flex w-full bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] transition-colors duration-200">
      
      {/* Hidden audio element for preview playback */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingPreviewUrl(null)}
        className="hidden"
      />

      {/* ── Collapsible Side Rail ── */}
      <DiscoverySideRail
        onAddSeed={handleAddSeed}
        counts={counts}
      />

      {/* ── Main Music Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 hover:text-[#1a1917] dark:hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery Desk</span>
          </Link>
          <span className="uppercase tracking-wider">
            Medium: Music & Lyrical Immersion
          </span>
        </div>

        {/* Bespoke Music Staff Header Animation */}
        <MusicHeaderAnimation />

        {/* Page Title & Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#e7e5e4] dark:border-[#27272a]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
                Lyrical & Acoustic Immersion
              </span>
              <span className="text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono capitalize">
                {userProfile?.targetLanguage || 'korean'} ({userProfile?.cefrLevel || 'A1'})
              </span>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1917] dark:text-[#f7f6f4]">
              Musical Staff & Phonetic Ear Training
            </h1>
            <p className="text-sm text-[#57534e] dark:text-[#a8a29e] max-w-2xl font-serif">
              Musical rhythm and lyric rhyming build phonological memory, pitch accent intuition, and natural speech tempo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRunMusicDiscovery}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning Qloo...' : 'Curate Music'}</span>
            </button>
          </div>
        </div>

        {/* Audio Preview Active Notice Bar (if playing) */}
        {playingPreviewUrl && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span>Now playing 30s verified audio preview...</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAudio(playingPreviewUrl)}
              className="px-2 py-1 rounded bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950 text-[10px] uppercase font-bold cursor-pointer"
            >
              Stop Audio
            </button>
          </div>
        )}

        {/* Filter Controls */}
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
                All Levels ({musicCandidates.length})
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
            Showing {filteredMusic.length} verified artists & tracks
          </div>
        </div>

        {/* Music Cards Grid */}
        {filteredMusic.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#141418] border border-dashed border-[#e7e5e4] dark:border-[#27272a] space-y-4">
            <Music className="w-10 h-10 text-[#7c3aed] dark:text-[#a78bfa] mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                No Music Recommendations Found
              </h3>
              <p className="text-xs text-[#57534e] dark:text-[#a8a29e] max-w-md mx-auto">
                Click &ldquo;Curate Music&rdquo; to discover authentic target-language artists matching your cultural affinities.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunMusicDiscovery}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Curate Music Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMusic.map(candidate => {
              const previewUrl = candidate.topTracks?.[0]?.previewUrl || (candidate.entity as any)?.previewUrl;
              const isPlaying = playingPreviewUrl === previewUrl;

              return (
                <div key={candidate.entity.id} className="relative flex flex-col">
                  {/* CandidateCard with full metadata, artwork, difficulty, availability */}
                  <CandidateCard
                    candidate={candidate}
                    onAddSession={() => setActiveModalCandidate(candidate)}
                  />

                  {/* Optional user-controlled 30s Audio Preview pill */}
                  {previewUrl && (
                    <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-[#e7e5e4] dark:border-[#27272a]">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#57534e] dark:text-[#a1a1aa]">
                        <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-emerald-500' : ''}`} />
                        <span>30-second Audio Preview</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(previewUrl)}
                        aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
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
