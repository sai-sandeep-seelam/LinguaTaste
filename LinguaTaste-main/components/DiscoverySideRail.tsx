'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Compass,
  Film,
  Tv,
  Music,
  BookOpen,
  X,
  Plus,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAppStore, SUBSCRIPTION_PLATFORMS, type SubscriptionPlatformId } from '@/lib/store';
import type { MediaType, LanguageCode, CEFRLevel } from '@/lib/types';

interface DiscoverySideRailProps {
  onAddSeed?: (seedName: string) => void;
  counts: {
    all: number;
    movie: number;
    tv: number;
    music: number;
    book: number;
  };
}

export default function DiscoverySideRail({
  onAddSeed,
  counts,
}: DiscoverySideRailProps) {
  const {
    railCollapsed,
    toggleRail,
    userProfile,
    setUserProfile,
    activeCategory,
    setActiveCategory,
    crossCategoryOpportunities,
    subscriptions,
    toggleSubscription,
  } = useAppStore();

  const router = useRouter();
  const pathname = usePathname();
  const [newSeedText, setNewSeedText] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleAddNewSeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeedText.trim() || !onAddSeed) return;
    onAddSeed(newSeedText.trim());
    setNewSeedText('');
  };

  const handleRemoveSeed = (seedName: string) => {
    if (!userProfile) return;
    setUserProfile({
      seedEntities: userProfile.seedEntities.filter(s => s.name !== seedName),
    });
  };

  const categoryList: Array<{ id: 'all' | MediaType; label: string; route: string; icon: React.ComponentType<{ className?: string }>; count: number }> = [
    { id: 'all', label: 'All Mediums', route: '/discover', icon: Sparkles, count: counts.all },
    { id: 'movie', label: 'Cinema', route: '/discover/movies', icon: Film, count: counts.movie },
    { id: 'tv', label: 'TV Dramas', route: '/discover/tv', icon: Tv, count: counts.tv },
    { id: 'music', label: 'Music & Audio', route: '/discover/music', icon: Music, count: counts.music },
    { id: 'book', label: 'Literature', route: '/discover/books', icon: BookOpen, count: counts.book },
  ];

  const languages: Record<LanguageCode, string> = {
    japanese: 'Japanese (日本語)',
    korean: 'Korean (한국어)',
    spanish: 'Spanish (Español)',
    french: 'French (Français)',
    mandarin: 'Mandarin (中文)',
    german: 'German (Deutsch)',
    italian: 'Italian (Italiano)',
    portuguese: 'Portuguese (Português)',
  };

  const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const railContent = (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-6 text-[#1a1917] dark:text-[#f7f6f4] select-none text-xs">
      
      {/* 1. Header with Collapse */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e7e5e4] dark:border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7c3aed] dark:bg-[#a78bfa] animate-pulse" />
          <span className="font-serif text-sm font-medium tracking-tight">Discovery Rail</span>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={toggleRail}
          aria-label={railCollapsed ? 'Expand discovery rail' : 'Collapse discovery rail'}
          className="hidden lg:flex p-1.5 rounded-lg text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(false)}
          aria-label="Close discovery drawer"
          className="lg:hidden p-1.5 rounded-lg text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Target Language & CEFR Goal */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] block font-semibold">
          Target Language & CEFR
        </label>
        
        <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#e7e5e4] dark:border-[#27272a] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#1a1917] dark:text-[#f7f6f4] capitalize">
              {languages[userProfile?.targetLanguage || 'korean']}
            </span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] border border-[#7c3aed]/20">
              {userProfile?.cefrLevel || 'A1'}
            </span>
          </div>

          {/* Quick CEFR Selector */}
          <div className="flex items-center gap-1 pt-1">
            {cefrLevels.map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setUserProfile({ cefrLevel: lvl })}
                className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                  userProfile?.cefrLevel === lvl
                    ? 'bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11]'
                    : 'bg-black/5 dark:bg-white/5 text-[#78716c] dark:text-[#a1a1aa] hover:bg-black/10'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Taste Seeds */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] block font-semibold">
            Taste Profile Seeds ({userProfile?.seedEntities.length || 0})
          </label>
        </div>

        {/* Existing Seed Tags */}
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
          {(userProfile?.seedEntities || []).map((seed) => (
            <span
              key={seed.name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ffffff] dark:bg-[#18181b] border border-[#e7e5e4] dark:border-[#27272a] text-[#1a1917] dark:text-[#f7f6f4] text-[11px] shadow-2xl"
            >
              <span className="truncate max-w-[130px]">{seed.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveSeed(seed.name)}
                className="text-[#a8a29e] hover:text-rose-500 transition-colors"
                aria-label={`Remove seed ${seed.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add Seed Form */}
        {onAddSeed && (
          <form onSubmit={handleAddNewSeed} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              placeholder="Add favorite title or artist..."
              value={newSeedText}
              onChange={e => setNewSeedText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-[#e7e5e4] dark:border-[#27272a] text-xs text-[#1a1917] dark:text-[#f7f6f4] placeholder-[#a8a29e]"
            />
            <button
              type="submit"
              disabled={!newSeedText.trim()}
              className="p-1.5 rounded-lg bg-[#7c3aed] text-white dark:bg-[#a78bfa] dark:text-[#0d0d11] disabled:opacity-40 cursor-pointer"
              aria-label="Add seed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>

      {/* 4. Category Shortcuts */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] block font-semibold">
          Medium Shortcuts
        </label>
        <div className="space-y-1">
          {categoryList.map(cat => {
            const Icon = cat.icon;
            const isSelected = pathname === cat.route || (cat.id === 'all' && pathname === '/discover');

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setMobileDrawerOpen(false);
                  router.push(cat.route);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] font-semibold border border-[#7c3aed]/20'
                    : 'text-[#57534e] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </div>
                <span className="font-mono text-[10px] opacity-75">{cat.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Cross-Category Discovery Prompt */}
      {crossCategoryOpportunities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#7c3aed] dark:text-[#a78bfa] font-semibold">
            <Compass className="w-3 h-3" />
            <span>Cross-Medium Avenues</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-1.5">
            <span className="font-serif text-xs font-medium text-[#1a1917] dark:text-[#f7f6f4] block">
              {crossCategoryOpportunities[0]?.headline}
            </span>
            <p className="text-[11px] text-[#57534e] dark:text-[#a1a1aa] line-clamp-2">
              {crossCategoryOpportunities[0]?.promptText}
            </p>
            <button
              type="button"
              onClick={() => {
                const targetCat = crossCategoryOpportunities[0].toCategory;
                setActiveCategory(targetCat);
                setMobileDrawerOpen(false);
                const routeMap: Record<string, string> = {
                  movie: '/discover/movies',
                  tv: '/discover/tv',
                  music: '/discover/music',
                  book: '/discover/books',
                };
                if (routeMap[targetCat]) router.push(routeMap[targetCat]);
              }}
              className="text-[10px] font-mono underline text-[#7c3aed] dark:text-[#a78bfa] hover:opacity-80 block pt-1 cursor-pointer"
            >
              Explore {crossCategoryOpportunities[0]?.toCategory.toUpperCase()} →
            </button>
          </div>
        </div>
      )}

      {/* 6. Streaming Availability Platform Filters */}
      <div className="space-y-2 pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#78716c] dark:text-[#a1a1aa] block font-semibold">
          Platform Subscriptions
        </label>
        <div className="flex flex-wrap gap-1">
          {SUBSCRIPTION_PLATFORMS.map(p => {
            const hasSub = subscriptions.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSubscription(p.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer ${
                  hasSub
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed] dark:bg-[#a78bfa] dark:text-[#0d0d11] dark:border-[#a78bfa] font-bold'
                    : 'bg-black/[0.02] dark:bg-white/[0.03] border-[#e7e5e4] dark:border-[#27272a] text-[#78716c] dark:text-[#a1a1aa] hover:border-[#a8a29e]'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Provenance Legend */}
      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#e7e5e4] dark:border-[#27272a] space-y-1.5 text-[10px] font-mono text-[#78716c] dark:text-[#a1a1aa]">
        <span className="font-bold text-[#1a1917] dark:text-[#f7f6f4] block">Provenance Key:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Qloo Grounded: Mathematical affinity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Gemini Verified: Reasoning & dialogue checks</span>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* ── Mobile Floating Drawer Trigger ── */}
      <div className="lg:hidden fixed bottom-6 left-6 z-40">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1a1917] text-white dark:bg-[#f7f6f4] dark:text-[#1a1917] shadow-xl font-serif text-xs cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Discovery Rail</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#7c3aed] text-white text-[10px] font-mono">
            {counts.all}
          </span>
        </button>
      </div>

      {/* ── Mobile Slide-out Drawer ── */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] h-full bg-[#faf8f5] dark:bg-[#0d0d11] shadow-2xl z-10">
            {railContent}
          </div>
        </div>
      )}

      {/* ── Desktop Collapsible Side Rail ── */}
      <aside
        aria-label="Discovery and taste rail"
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          railCollapsed ? 'w-14' : 'w-72 xl:w-80'
        } border-r border-[#e7e5e4] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#111116] min-h-[calc(100vh-64px)] relative`}
      >
        {railCollapsed ? (
          /* Collapsed Slim Bookmark Strip */
          <div className="flex flex-col items-center py-6 space-y-6">
            <button
              type="button"
              onClick={toggleRail}
              aria-label="Expand discovery rail"
              className="p-2 rounded-xl text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="[writing-mode:vertical-rl] rotate-180 font-serif text-xs uppercase tracking-widest text-[#a8a29e] dark:text-[#71717a] flex items-center gap-2">
              <span>Discovery Rail</span>
              <span className="font-mono text-[10px]">({counts.all})</span>
            </div>
          </div>
        ) : (
          /* Expanded Full Content */
          railContent
        )}
      </aside>
    </>
  );
}
