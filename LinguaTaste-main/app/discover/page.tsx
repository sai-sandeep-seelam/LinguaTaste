'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Compass,
  Film,
  Tv,
  Music,
  BookOpen,
  Calendar,
  RefreshCw,
  Zap,
  ArrowRight,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Plus,
  X,
  Languages,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { LanguageCode, CEFRLevel, MediaType, ContentCandidate } from '@/lib/types';
import DiscoverySideRail from '@/components/DiscoverySideRail';
import CandidateCard from '@/components/CandidateCard';
import CrossCategoryBanner from '@/components/CrossCategoryBanner';
import LearningSessionModal from '@/components/LearningSessionModal';
import RestrainedAnimatedBorder from '@/components/RestrainedAnimatedBorder';

const LANGUAGE_OPTIONS: Record<LanguageCode, { name: string; flag: string; script: string }> = {
  japanese: { name: 'Japanese', flag: '🇯🇵', script: '日本語' },
  korean: { name: 'Korean', flag: '🇰🇷', script: '한국어' },
  spanish: { name: 'Spanish', flag: '🇪🇸', script: 'Español' },
  french: { name: 'French', flag: '🇫🇷', script: 'Français' },
  mandarin: { name: 'Mandarin', flag: '🇨🇳', script: '中文' },
  german: { name: 'German', flag: '🇩🇪', script: 'Deutsch' },
  italian: { name: 'Italian', flag: '🇮🇹', script: 'Italiano' },
  portuguese: { name: 'Portuguese', flag: '🇵🇹', script: 'Português' },
};

const CEFR_LEVELS: Array<{ level: CEFRLevel; title: string; desc: string }> = [
  { level: 'A1', title: 'Beginner', desc: 'Basic phrases & high visual scaffolding' },
  { level: 'A2', title: 'Elementary', desc: 'Simple dialogues & everyday scenarios' },
  { level: 'B1', title: 'Intermediate', desc: 'Connected narrative & standard speech' },
  { level: 'B2', title: 'Upper-Int', desc: 'Idiomatic expressions & natural tempo' },
  { level: 'C1', title: 'Advanced', desc: 'Complex syntax & cultural subtext' },
  { level: 'C2', title: 'Mastery', desc: 'Native nuance, wordplay & literature' },
];

export default function DiscoverHubPage() {
  const router = useRouter();
  const {
    userProfile,
    setUserProfile,
    candidates,
    byCategory,
    isLoading,
    runAnalysis,
    activeCategory,
    setActiveCategory,
  } = useAppStore();

  const [activeModalCandidate, setActiveModalCandidate] = useState<ContentCandidate | null>(null);
  const [newSeedInput, setNewSeedInput] = useState('');

  const counts = {
    all: candidates.length,
    movie: byCategory.movie?.length || 0,
    tv: byCategory.tv?.length || 0,
    music: byCategory.music?.length || 0,
    book: byCategory.book?.length || 0,
  };

  const handleRunDiscovery = async () => {
    const seedNames = (userProfile?.seedEntities || []).map(s => s.name);
    await runAnalysis(
      seedNames,
      userProfile?.targetLanguage || 'korean',
      userProfile?.cefrLevel || 'A1',
      ['movie', 'tv', 'music', 'book']
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
    setNewSeedInput('');
  };

  const handleRemoveSeed = (seedName: string) => {
    const existing = userProfile?.seedEntities || [];
    setUserProfile({
      seedEntities: existing.filter(s => s.name !== seedName),
    });
  };

  // Filter candidates if a specific category was clicked
  const displayedCandidates = activeCategory === 'all'
    ? candidates
    : candidates.filter(c => c.entity.type === activeCategory);

  return (
    <div className="flex-1 flex w-full bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] transition-colors duration-200">
      
      {/* ── Collapsible Side Discovery Rail ── */}
      <DiscoverySideRail
        onAddSeed={handleAddSeed}
        counts={counts}
      />

      {/* ── Main Editorial Discovery Workspace ── */}
      <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-10 py-8 space-y-10">
        
        {/* Header & Page Introduction */}
        <div className="space-y-3 pb-6 border-b border-[#e7e5e4] dark:border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]">
              Curation Desk
            </span>
            <span className="text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono">
              Target: {LANGUAGE_OPTIONS[userProfile?.targetLanguage || 'korean']?.name} ({userProfile?.cefrLevel || 'A1'})
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1917] dark:text-[#f7f6f4]">
                Taste-Matched Immersion Desk
              </h1>
              <p className="text-sm text-[#57534e] dark:text-[#a8a29e] max-w-2xl mt-1 font-serif">
                Configure your cultural taste profile and generate personalized language immersion recommendations grounded in Qloo affinity.
              </p>
            </div>

            {/* Run Analysis Button */}
            <button
              type="button"
              onClick={handleRunDiscovery}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Synthesizing Taste...' : 'Curate Immersion Now'}</span>
            </button>
          </div>
        </div>

        {/* ── Profile Configuration Panel ── */}
        <RestrainedAnimatedBorder isActive={true} variant="ants">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-sm space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Language Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] font-bold block">
                Target Language
              </label>
              <div className="relative">
                <select
                  value={userProfile?.targetLanguage || 'korean'}
                  onChange={e => setUserProfile({ targetLanguage: e.target.value as LanguageCode })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] text-xs font-medium text-[#1a1917] dark:text-[#f7f6f4] focus:outline-none focus:border-[#7c3aed] cursor-pointer appearance-none"
                >
                  {Object.entries(LANGUAGE_OPTIONS).map(([code, meta]) => (
                    <option key={code} value={code}>
                      {meta.flag} {meta.name} ({meta.script})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3 pointer-events-none text-xs text-[#78716c]">
                  ▼
                </div>
              </div>
            </div>

            {/* 2. CEFR Level Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] font-bold block">
                Proficiency Level (CEFR)
              </label>
              <div className="grid grid-cols-6 gap-1">
                {CEFR_LEVELS.map(item => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setUserProfile({ cefrLevel: item.level })}
                    title={`${item.title}: ${item.desc}`}
                    className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      (userProfile?.cefrLevel || 'A1') === item.level
                        ? 'bg-[#7c3aed] text-white shadow-sm dark:bg-[#a78bfa] dark:text-[#0d0d11]'
                        : 'bg-[#faf8f5] dark:bg-[#1a1a22] text-[#57534e] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5 border border-[#e7e5e4] dark:border-[#272730]'
                    }`}
                  >
                    {item.level}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] font-mono truncate">
                {CEFR_LEVELS.find(l => l.level === (userProfile?.cefrLevel || 'A1'))?.title} — {CEFR_LEVELS.find(l => l.level === (userProfile?.cefrLevel || 'A1'))?.desc}
              </p>
            </div>

            {/* 3. Weekly Hours */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] font-bold block">
                Weekly Commitment
              </label>
              <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730]">
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={userProfile?.weeklyHours || 5}
                  onChange={e => setUserProfile({ weeklyHours: Number(e.target.value) })}
                  className="flex-1 accent-[#7c3aed] cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-[#7c3aed] dark:text-[#a78bfa] min-w-[40px] text-right">
                  {userProfile?.weeklyHours || 5}h/wk
                </span>
              </div>
              <p className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] font-mono">
                Allocates ~{Math.round(((userProfile?.weeklyHours || 5) / 7) * 60)} min daily immersion.
              </p>
            </div>

          </div>

          {/* Seeds Tag Manager */}
          <div className="pt-4 border-t border-[#e7e5e4] dark:border-[#27272a] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] font-bold block">
                Taste Profile Seeds ({userProfile?.seedEntities?.length || 0})
              </label>
              <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] font-mono">
                Add films, authors, shows, or musicians you love
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(userProfile?.seedEntities || []).map(seed => (
                <span
                  key={seed.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] text-xs text-[#1a1917] dark:text-[#f7f6f4] shadow-sm"
                >
                  <span>{seed.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSeed(seed.name)}
                    className="text-[#a8a29e] hover:text-rose-500 transition-colors cursor-pointer"
                    aria-label={`Remove ${seed.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Quick Add Seed Input */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAddSeed(newSeedInput);
                }}
                className="inline-flex items-center gap-1"
              >
                <input
                  type="text"
                  placeholder="+ Add taste seed..."
                  value={newSeedInput}
                  onChange={e => setNewSeedInput(e.target.value)}
                  className="px-3 py-1 text-xs rounded-full bg-white dark:bg-[#111116] border border-dashed border-[#a8a29e] dark:border-[#3f3f46] text-[#1a1917] dark:text-[#f7f6f4] focus:outline-none focus:border-[#7c3aed]"
                />
              </form>
            </div>
          </div>

        </div>
      </RestrainedAnimatedBorder>

      {/* ── Cross-Category Opportunities Banner ── */}
        <CrossCategoryBanner />

        {/* ── Category Gateways (The 4 Channels) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
              Immersion Mediums
            </h2>
            <span className="text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
              Click a channel for dedicated deep-dive layouts & animations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <Link
              href="/discover/movies"
              className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/40 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#78716c] dark:text-[#a1a1aa]">
                    {counts.movie} items
                  </span>
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] transition-colors">
                    Cinema
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1">
                    35mm film reel animation, 2:3 vertical posters, and spoken dialogue notes.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>View Cinema Collection →</span>
              </div>
            </Link>

            <Link
              href="/discover/tv"
              className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/40 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center">
                    <Tv className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#78716c] dark:text-[#a1a1aa]">
                    {counts.tv} items
                  </span>
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] transition-colors">
                    TV Shows
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1">
                    Serialized episode strip graphics and natural conversational context.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>View TV Dramas →</span>
              </div>
            </Link>

            <Link
              href="/discover/music"
              className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/40 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#78716c] dark:text-[#a1a1aa]">
                    {counts.music} items
                  </span>
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] transition-colors">
                    Music & Audio
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1">
                    Musical staff wave with gliding notes and user-controlled audio preview player.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>View Music Shelf →</span>
              </div>
            </Link>

            <Link
              href="/discover/books"
              className="p-5 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] hover:border-[#7c3aed]/40 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#78716c] dark:text-[#a1a1aa]">
                    {counts.book} items
                  </span>
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4] group-hover:text-[#7c3aed] transition-colors">
                    Literature
                  </h3>
                  <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1">
                    Tactile folio page-turn animation and reading comprehension guidance.
                  </p>
                </div>
              </div>
              <div className="pt-4 flex items-center text-xs font-mono text-[#7c3aed] dark:text-[#a78bfa] font-semibold gap-1">
                <span>View Literature →</span>
              </div>
            </Link>

          </div>
        </div>

        {/* ── Active Recommendations Grid ── */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                Curated Recommendations ({displayedCandidates.length})
              </h2>
              <p className="text-xs text-[#57534e] dark:text-[#a8a29e] font-serif">
                Showing {activeCategory === 'all' ? 'all mediums' : activeCategory} matching your taste seeds.
              </p>
            </div>

            {/* Quick medium filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11] font-bold'
                    : 'text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa]'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('movie')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCategory === 'movie'
                    ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11] font-bold'
                    : 'text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa]'
                }`}
              >
                Cinema ({counts.movie})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('tv')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCategory === 'tv'
                    ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11] font-bold'
                    : 'text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa]'
                }`}
              >
                TV ({counts.tv})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('music')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCategory === 'music'
                    ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11] font-bold'
                    : 'text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa]'
                }`}
              >
                Music ({counts.music})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('book')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeCategory === 'book'
                    ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11] font-bold'
                    : 'text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa]'
                }`}
              >
                Books ({counts.book})
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {displayedCandidates.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#141418] border border-dashed border-[#e7e5e4] dark:border-[#27272a] space-y-4">
              <Compass className="w-10 h-10 text-[#7c3aed] dark:text-[#a78bfa] mx-auto opacity-70" />
              <div className="space-y-1">
                <h3 className="font-editorial text-lg font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  No Recommendations Generated Yet
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] max-w-md mx-auto">
                  Click &ldquo;Curate Immersion Now&rdquo; to query Qloo taste intelligence and generate cross-medium candidates for {userProfile?.targetLanguage ? LANGUAGE_OPTIONS[userProfile.targetLanguage]?.name : 'your target language'}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunDiscovery}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Curate Recommendations Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCandidates.map(candidate => (
                <CandidateCard
                  key={candidate.entity.id}
                  candidate={candidate}
                  onAddSession={() => setActiveModalCandidate(candidate)}
                />
              ))}
            </div>
          )}
        </div>

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
