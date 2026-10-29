'use client';

import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useAppStore();

  // Synchronize <html> element class on mount and theme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e7e5e4] dark:border-[#27272a] bg-[#ffffff] dark:bg-[#18181b] text-[#1a1917] dark:text-[#f7f6f4] shadow-sm hover:border-[#d6d3d1] dark:hover:border-[#3f3f46] transition-all cursor-pointer text-xs font-mono"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-3.5 h-3.5 text-[#57534e] group-hover:text-[#1a1917] transition-colors" />
          <span className="text-[#57534e] group-hover:text-[#1a1917]">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-[#fbbf24] group-hover:text-[#fde68a] transition-colors" />
          <span className="text-[#a1a1aa] group-hover:text-[#ffffff]">Light</span>
        </>
      )}
    </button>
  );
}
