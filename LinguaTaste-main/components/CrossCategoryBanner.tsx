'use client';

import React from 'react';
import { Compass, ArrowRight, X, Sparkles } from 'lucide-react';
import type { CrossCategoryOpportunity, MediaType } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface CrossCategoryBannerProps {
  opportunity?: CrossCategoryOpportunity;
  onExplore?: (targetCategory: MediaType) => void;
  onDismiss?: (id: string) => void;
}

export default function CrossCategoryBanner({
  opportunity: propOpportunity,
  onExplore,
  onDismiss,
}: CrossCategoryBannerProps = {}) {
  const { crossCategoryOpportunities, setActiveCategory, dismissCrossCategoryOpportunity } = useAppStore();
  const opportunity = propOpportunity || crossCategoryOpportunities[0];

  if (!opportunity) return null;

  const handleExplore = () => {
    setActiveCategory(opportunity.toCategory);
    if (onExplore) {
      onExplore(opportunity.toCategory);
    }
  };

  const handleDismiss = () => {
    dismissCrossCategoryOpportunity(opportunity.id);
    if (onDismiss) {
      onDismiss(opportunity.id);
    }
  };

  const categoryNames: Record<MediaType, string> = {
    movie: 'Cinema',
    tv: 'TV Dramas',
    music: 'Music & Audio',
    book: 'Literature',
  };

  return (
    <aside
      aria-label="Cross-category discovery avenue"
      className="relative my-6 p-5 sm:p-6 rounded-2xl border border-[#d6d3d1] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#141418] shadow-sm transition-all"
    >
      {/* Editorial Decorative Corner Bookmark */}
      <div className="absolute top-0 right-10 w-6 h-3 bg-[#7c3aed] dark:bg-[#a78bfa] rounded-b-sm" />

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss cross-category suggestion"
        className="absolute top-4 right-4 p-1.5 rounded-lg text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Cultural Compass Icon */}
        <div className="p-3 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] shrink-0 w-fit">
          <Compass className="w-6 h-6 animate-spin-slow" />
        </div>

        {/* Content body */}
        <div className="space-y-2 flex-1 pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              CROSS-CATEGORY DIRECTION
            </span>
            <span className="text-xs font-mono text-[#78716c] dark:text-[#a1a1aa]">
              {categoryNames[opportunity.fromCategory]} → {categoryNames[opportunity.toCategory]}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#57534e] dark:text-[#d4d4d8]">
              {opportunity.normalizedGenre}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-serif text-[#1a1917] dark:text-[#f7f6f4] font-medium leading-snug">
            {opportunity.headline}
          </h3>

          <p className="text-xs sm:text-sm text-[#57534e] dark:text-[#a1a1aa] leading-relaxed">
            {opportunity.promptText}
          </p>

          <p className="text-xs text-[#78716c] dark:text-[#71717a] italic border-l-2 border-[#e7e5e4] dark:border-[#27272a] pl-2.5 pt-0.5">
            Rationale: {opportunity.rationale}
          </p>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExplore}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] dark:bg-[#a78bfa] dark:hover:bg-[#8b5cf6] text-white dark:text-[#0d0d11] font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <span>Explore {categoryNames[opportunity.toCategory]}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#78716c] dark:text-[#a1a1aa] hover:text-[#1a1917] dark:hover:text-[#ffffff] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Keep Current Medium
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
