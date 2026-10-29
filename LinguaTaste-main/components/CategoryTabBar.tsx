'use client';

import React from 'react';
import { Film, Tv, Music, BookOpen, Layers } from 'lucide-react';
import type { MediaType } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface CategoryTabBarProps {
  counts: {
    all: number;
    movie: number;
    tv: number;
    music: number;
    book: number;
  };
}

export default function CategoryTabBar({ counts }: CategoryTabBarProps) {
  const { activeCategory, setActiveCategory } = useAppStore();

  const tabs: Array<{
    id: 'all' | MediaType;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }> = [
    {
      id: 'all',
      label: 'All Mediums',
      sublabel: 'Curated Folio',
      icon: Layers,
      count: counts.all,
    },
    {
      id: 'movie',
      label: 'Cinema',
      sublabel: 'Feature Films',
      icon: Film,
      count: counts.movie,
    },
    {
      id: 'tv',
      label: 'Television',
      sublabel: 'Narrative Series',
      icon: Tv,
      count: counts.tv,
    },
    {
      id: 'music',
      label: 'Music & Tracks',
      sublabel: 'Artists & Audio',
      icon: Music,
      count: counts.music,
    },
    {
      id: 'book',
      label: 'Literature',
      sublabel: 'Books & Novellas',
      icon: BookOpen,
      count: counts.book,
    },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Content medium categories"
      className="w-full border-b border-[#e7e5e4] dark:border-[#27272a] bg-[#faf8f5]/80 dark:bg-[#0d0d11]/80 backdrop-blur-md sticky top-0 z-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-2 sm:gap-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(tab.id)}
              className={`relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#ffffff] dark:bg-[#18181b] text-[#1a1917] dark:text-[#ffffff] shadow-sm border border-[#e7e5e4] dark:border-[#27272a]'
                  : 'text-[#78716c] dark:text-[#a1a1aa] hover:text-[#1a1917] dark:hover:text-[#ffffff] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]'
                    : 'text-current opacity-70'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-serif ${isActive ? 'font-medium' : 'font-normal'}`}>
                    {tab.label}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                      isActive
                        ? 'bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20 dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] dark:border-[#a78bfa]/30 font-semibold'
                        : 'bg-black/5 dark:bg-white/5 text-[#78716c] dark:text-[#a1a1aa] border-transparent'
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div className="text-[10px] font-sans text-[#a8a29e] dark:text-[#71717a] hidden sm:block">
                  {tab.sublabel}
                </div>
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#7c3aed] dark:bg-[#a78bfa] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
