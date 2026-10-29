'use client';

import React from 'react';
import { Music } from 'lucide-react';

export default function MusicHeaderAnimation() {
  return (
    <div className="relative w-full overflow-hidden py-3 px-4 rounded-xl bg-[#f5f2ec] dark:bg-[#181820] border border-[#e7e5e4] dark:border-[#2a2a35] shadow-xs">
      {/* 5-Line Musical Staff with Traveling Notes */}
      <div className="relative h-16 w-full flex items-center select-none">
        {/* Horizontal Staff Lines */}
        <div className="absolute inset-x-0 inset-y-2 flex flex-col justify-between pointer-events-none opacity-25 dark:opacity-30">
          <div className="w-full h-px bg-emerald-800 dark:bg-emerald-400" />
          <div className="w-full h-px bg-emerald-800 dark:bg-emerald-400" />
          <div className="w-full h-px bg-emerald-800 dark:bg-emerald-400" />
          <div className="w-full h-px bg-emerald-800 dark:bg-emerald-400" />
          <div className="w-full h-px bg-emerald-800 dark:bg-emerald-400" />
        </div>

        {/* Floating Musical Clef and Notes */}
        <div className="relative z-10 flex items-center justify-between w-full px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600/15 dark:bg-emerald-400/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-serif italic text-emerald-800 dark:text-emerald-300">
                Lyrical Immersion & Phonetic Rhythms
              </span>
              <p className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
                Authentic target-language tracks with verified 30s previews
              </p>
            </div>
          </div>

          {/* Gliding Musical Notes */}
          <div className="flex items-center gap-6 text-emerald-700 dark:text-emerald-400 text-lg">
            <span className="note-float" style={{ animationDelay: '0ms' }}>♪</span>
            <span className="note-float" style={{ animationDelay: '400ms' }}>♫</span>
            <span className="note-float" style={{ animationDelay: '800ms' }}>♩</span>
            <span className="note-float hidden sm:inline" style={{ animationDelay: '1200ms' }}>♬</span>
            <span className="note-float hidden sm:inline" style={{ animationDelay: '1600ms' }}>♪</span>
          </div>
        </div>
      </div>
    </div>
  );
}
