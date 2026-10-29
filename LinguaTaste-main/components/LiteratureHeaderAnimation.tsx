'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';

export default function LiteratureHeaderAnimation() {
  return (
    <div className="relative w-full overflow-hidden py-3 px-4 rounded-xl bg-[#f5f2ec] dark:bg-[#181820] border border-[#e7e5e4] dark:border-[#2a2a35] shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-700/15 dark:bg-amber-400/20 flex items-center justify-center text-amber-800 dark:text-amber-300">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-serif font-semibold text-amber-950 dark:text-amber-200">
              Literary Immersion & Autonomous Reading
            </span>
            <p className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
              Novels, manga, and reading material calibrated to reading comprehension
            </p>
          </div>
        </div>

        {/* Tactile Book Page-Turn Graphic */}
        <div className="relative w-16 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-xs bg-[#e8e4dc] dark:bg-[#252530] border border-[#d6cfc5] dark:border-[#383845] shadow-xs" />
          <div className="book-page-turn absolute inset-y-0 right-0 w-8 bg-white dark:bg-[#1e1e28] border-l border-[#d6cfc5] dark:border-[#383845] rounded-r-xs flex items-center justify-center">
            <span className="text-[7px] font-serif text-amber-800 dark:text-amber-400 italic">Folio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
