'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Film,
  Tv,
  Music,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Play,
  Pause,
  Plus,
  Check,
  Volume2,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import type { ContentCandidate, MediaType, FeedbackItem, CEFRLevel } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface CandidateCardProps {
  candidate: ContentCandidate;
  onAddSession?: (candidate: ContentCandidate) => void;
  isAddedToPlan?: boolean;
}

export default function CandidateCard({
  candidate,
  onAddSession,
  isAddedToPlan = false,
}: CandidateCardProps) {
  const { addFeedback, feedbackHistory, userProfile } = useAppStore();

  const [activeTrackPlaying, setActiveTrackPlaying] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if current user has already left feedback on this candidate
  const existingFeedback = feedbackHistory.find(f => f.entityId === candidate.entity.id);

  const handleFeedback = (reaction: 'thumbs_up' | 'thumbs_down') => {
    const item: FeedbackItem = {
      entityId: candidate.entity.id,
      entityName: candidate.entity.name,
      reaction,
      timestamp: new Date().toISOString(),
      targetLanguage: userProfile?.targetLanguage,
      cefrLevel: userProfile?.cefrLevel,
    };
    addFeedback(item);
  };

  const handleToggleTrack = (previewUrl?: string, trackTitle?: string) => {
    if (!previewUrl) return;

    if (activeTrackPlaying === trackTitle) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveTrackPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play().catch(e => console.warn('Audio playback error:', e));
      }
      setActiveTrackPlaying(trackTitle || 'playing');
    }
  };

  const entity = candidate.entity;
  const mediaType: MediaType = entity.type;

  // Medium specific icon & badge
  const typeIcons: Record<MediaType, React.ComponentType<{ className?: string }>> = {
    movie: Film,
    tv: Tv,
    music: Music,
    book: BookOpen,
  };
  const TypeIcon = typeIcons[mediaType] || Film;

  const typeLabels: Record<MediaType, string> = {
    movie: 'Cinema',
    tv: 'Series',
    music: 'Music',
    book: 'Literature',
  };

  // Provenance & Tier formatting
  const provenance = candidate.provenance || 'qloo_grounded';
  const confidenceTier = candidate.confidenceTier || 'strong';

  const tierLabels = {
    strong: {
      text: 'CONFIDENT MATCH',
      classes: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    },
    exploratory: {
      text: 'EXPLORATORY CONNECTION',
      classes: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
    },
    tentative: {
      text: 'TENTATIVE SUGGESTION',
      classes: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    },
  }[confidenceTier];

  const provenanceLabels = {
    qloo_grounded: {
      text: 'QLOO GROUNDED',
      badge: 'Taste-Graph Affinity',
    },
    gemini_verified: {
      text: 'GEMINI VERIFIED',
      badge: 'Reasoning + Metadata Check',
    },
    curated_peer: {
      text: 'CURATED PEER',
      badge: 'Direct Cultural Seed',
    },
  }[provenance];

  // Category specific card styling details
  const categoryBorderClasses = {
    movie: 'hover:border-zinc-400 dark:hover:border-zinc-600',
    tv: 'hover:border-blue-400 dark:hover:border-blue-600',
    music: 'hover:border-purple-400 dark:hover:border-purple-600',
    book: 'hover:border-amber-400 dark:hover:border-amber-600',
  }[mediaType];

  return (
    <article
      aria-label={`${entity.name} recommendation`}
      className={`group relative flex flex-col justify-between rounded-2xl border border-[#e7e5e4] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#141418] p-5 shadow-sm transition-all duration-300 hover:shadow-md ${categoryBorderClasses}`}
    >
      {/* Hidden audio element for track audio previews */}
      <audio
        ref={audioRef}
        onEnded={() => setActiveTrackPlaying(null)}
        onError={() => setActiveTrackPlaying(null)}
      />

      <div className="space-y-4">
        {/* Top Provenance & Confidence Header */}
        <div className="flex items-center justify-between gap-2 border-b border-[#f5f5f4] dark:border-[#1f1f23] pb-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full border font-semibold tracking-wider ${tierLabels.classes}`}>
              {tierLabels.text}
            </span>
            <span className="text-[#a8a29e] dark:text-[#71717a]">
              • {provenanceLabels.text}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-[#7c3aed] dark:text-[#a78bfa] shrink-0">
            <span>Affinity:</span>
            <span>{(candidate.qlooAffinity * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Media Presentation: Artwork + Metadata */}
        <div className="flex items-start gap-4">
          {/* Poster / Cover Image */}
          <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-[#f5f5f4] dark:bg-[#1f1f23] border border-[#e7e5e4] dark:border-[#27272a] shadow-inner">
            {entity.imageUrl && !imageError ? (
              <Image
                src={entity.imageUrl}
                alt={entity.name}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#a8a29e] dark:text-[#71717a]">
                <TypeIcon className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[9px] font-serif leading-tight line-clamp-2">{entity.name}</span>
              </div>
            )}

            {/* Medium Corner Badge */}
            <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 backdrop-blur-sm text-white">
              <TypeIcon className="w-3 h-3" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
              <span>{typeLabels[mediaType]}</span>
              {entity.year && (
                <>
                  <span>•</span>
                  <span>{entity.year}</span>
                </>
              )}
              {entity.country && (
                <>
                  <span>•</span>
                  <span className="truncate">{entity.country}</span>
                </>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-serif font-medium text-[#1a1917] dark:text-[#f7f6f4] leading-snug line-clamp-2">
              {entity.name}
            </h3>

            {entity.creator && (
              <p className="text-xs text-[#78716c] dark:text-[#a8a29e] truncate">
                by <span className="font-medium text-[#44403c] dark:text-[#d4d4d8]">{entity.creator}</span>
              </p>
            )}

            {/* CEFR Difficulty Bar */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#57534e] dark:text-[#a8a29e] font-medium">
                  Difficulty: {candidate.difficultyScore.toFixed(1)}/10
                </span>
                <span className="text-[10px] text-[#78716c] dark:text-[#71717a]">
                  CEFR Fit
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#f5f5f4] dark:bg-[#27272a] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#7c3aed] dark:bg-[#a78bfa] transition-all duration-500"
                  style={{ width: `${Math.min(100, candidate.difficultyScore * 10)}%` }}
                />
              </div>
              {candidate.difficultyKeyNote && (
                <p className="text-[10px] text-[#78716c] dark:text-[#a8a29e] line-clamp-1 italic">
                  {candidate.difficultyKeyNote}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis / Description */}
        {entity.description && (
          <p className="text-xs text-[#57534e] dark:text-[#a1a1aa] leading-relaxed line-clamp-2 pt-1 border-t border-[#f5f5f4] dark:border-[#1f1f23]">
            {entity.description}
          </p>
        )}

        {/* Cultural Taste Connection Reasoning */}
        {candidate.tasteConnectionReason && (
          <div className="p-3 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#f5f2ec] dark:border-[#272733] text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Cultural Affinity Reasoning</span>
            </div>
            <p className="text-[#44403c] dark:text-[#d4d4d8] text-[11px] leading-relaxed">
              {candidate.tasteConnectionReason}
            </p>
          </div>
        )}

        {/* Music: Tracklist & Audio Previews (Only for Music Candidates) */}
        {mediaType === 'music' && candidate.topTracks && candidate.topTracks.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#f5f5f4] dark:border-[#1f1f23]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716c] dark:text-[#a1a1aa] block">
              Sample Tracklist (30s Audio Preview)
            </span>
            <div className="space-y-1">
              {candidate.topTracks.map((track, i) => {
                const isPlaying = activeTrackPlaying === track.title;
                const hasPreview = Boolean(track.previewUrl);

                return (
                  <div
                    key={`track-${i}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[#a8a29e] text-[10px]">{i + 1}.</span>
                      <span className="truncate text-[#1a1917] dark:text-[#f7f6f4]">{track.title}</span>
                      {track.releaseYear && (
                        <span className="text-[10px] text-[#a8a29e] shrink-0">({track.releaseYear})</span>
                      )}
                    </div>

                    {hasPreview && (
                      <button
                        type="button"
                        onClick={() => handleToggleTrack(track.previewUrl, track.title)}
                        className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                          isPlaying
                            ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11]'
                            : 'hover:bg-black/5 dark:hover:bg-white/10 text-[#78716c] dark:text-[#a1a1aa]'
                        }`}
                        aria-label={isPlaying ? `Pause ${track.title}` : `Play preview for ${track.title}`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Card Action Footer: Thumbs Feedback + Add to Plan */}
      <div className="mt-4 pt-3 border-t border-[#e7e5e4] dark:border-[#27272a] flex items-center justify-between gap-2">
        {/* Adaptive Feedback Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleFeedback('thumbs_up')}
            aria-label="Thumbs up recommendation"
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              existingFeedback?.reaction === 'thumbs_up'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-[#78716c] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleFeedback('thumbs_down')}
            aria-label="Thumbs down recommendation"
            className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
              existingFeedback?.reaction === 'thumbs_down'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-[#78716c] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add to Plan Button */}
        {onAddSession && (
          <button
            type="button"
            onClick={() => onAddSession(candidate)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              isAddedToPlan
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-[#faf8f5] dark:bg-[#1f1f26] hover:bg-[#7c3aed] hover:text-white dark:hover:bg-[#a78bfa] dark:hover:text-[#0d0d11] text-[#44403c] dark:text-[#d4d4d8] border border-[#d6d3d1] dark:border-[#27272a]'
            }`}
          >
            {isAddedToPlan ? (
              <>
                <Check className="w-3 h-3" />
                <span>In Plan</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span>Add to Immersion</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
