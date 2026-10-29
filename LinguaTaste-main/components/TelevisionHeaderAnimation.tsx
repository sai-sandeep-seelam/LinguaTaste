'use client';

import React from 'react';
import { Tv } from 'lucide-react';

export default function TelevisionHeaderAnimation() {
  return (
    <div className="relative w-full overflow-hidden py-3 px-4 rounded-xl bg-[#f5f2ec] dark:bg-[#181820] border border-[#e7e5e4] dark:border-[#2a2a35] shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-700/15 dark:bg-sky-400/20 flex items-center justify-center text-sky-800 dark:text-sky-300">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-serif font-semibold text-sky-950 dark:text-sky-200">
              Serialized Drama & Episodic Context
            </span>
            <p className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
              Situational dialogue with recurring colloquial character registers
            </p>
          </div>
        </div>

        {/* Television Episode Strip Graphic */}
        <div className="flex items-center gap-1.5 opacity-80">
          {['EP.01', 'EP.02', 'EP.03'].map((ep, idx) => (
            <div
              key={ep}
              className="px-2 py-1 rounded bg-[#e8e4dc] dark:bg-[#252532] border border-[#d6cfc5] dark:border-[#383846] text-[8px] font-mono font-medium text-sky-800 dark:text-sky-300"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {ep}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
