'use client';

import React from 'react';
import { Film } from 'lucide-react';

export default function CinemaHeaderAnimation() {
  return (
    <div className="relative w-full overflow-hidden py-3 px-4 rounded-xl bg-[#f5f2ec] dark:bg-[#181820] border border-[#e7e5e4] dark:border-[#2a2a35] shadow-xs">
      {/* 35mm Perforated Film Strip */}
      <div className="flex items-center gap-2 overflow-x-hidden opacity-90 select-none">
        {/* Repeating film frames */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((frameNum) => (
          <div
            key={frameNum}
            className="film-slide-in shrink-0 w-24 h-16 rounded border border-neutral-400/40 dark:border-neutral-600/40 bg-neutral-900 text-white flex flex-col justify-between p-1.5 shadow-sm"
            style={{ animationDelay: `${frameNum * 80}ms` }}
          >
            {/* Top sprockets */}
            <div className="flex justify-between items-center px-1">
              <span className="w-1.5 h-1 rounded-xs bg-neutral-400 dark:bg-neutral-500 opacity-60" />
              <span className="text-[8px] font-mono opacity-50">35MM</span>
              <span className="w-1.5 h-1 rounded-xs bg-neutral-400 dark:bg-neutral-500 opacity-60" />
            </div>

            {/* Frame Center */}
            <div className="flex items-center justify-center gap-1">
              <Film className="w-3.5 h-3.5 text-amber-400 opacity-80" />
              <span className="text-[9px] font-mono font-bold tracking-wider text-neutral-300">
                0{frameNum}:24
              </span>
            </div>

            {/* Bottom sprockets */}
            <div className="flex justify-between items-center px-1">
              <span className="w-1.5 h-1 rounded-xs bg-neutral-400 dark:bg-neutral-500 opacity-60" />
              <span className="text-[7px] font-mono opacity-40">TASTE</span>
              <span className="w-1.5 h-1 rounded-xs bg-neutral-400 dark:bg-neutral-500 opacity-60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
