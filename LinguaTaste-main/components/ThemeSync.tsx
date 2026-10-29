'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function ThemeSync() {
  const theme = useAppStore(state => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  return null;
}
