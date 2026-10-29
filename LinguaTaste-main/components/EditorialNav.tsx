'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Film,
  Tv,
  Music,
  BookOpen,
  Calendar,
  Sparkles,
  Key,
  Menu,
  X,
  Languages,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import ThemeToggle from '@/components/ThemeToggle';
import ApiKeyModal from '@/components/ApiKeyModal';

const NAV_ITEMS = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/discover/movies', label: 'Cinema', icon: Film },
  { href: '/discover/tv', label: 'TV Shows', icon: Tv },
  { href: '/discover/music', label: 'Music & Audio', icon: Music },
  { href: '/discover/books', label: 'Literature', icon: BookOpen },
  { href: '/plan', label: '7-Day Plan', icon: Calendar },
  { href: '/taste', label: 'Taste DNA', icon: Sparkles },
];

export default function EditorialNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const userProfile = useAppStore(state => state.userProfile);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-[#121217]/90 border-b border-[#e7e5e4] dark:border-[#272730] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Masthead / Brand Identity */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="group flex items-center gap-2.5 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-500 dark:to-purple-800 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-editorial text-xl font-bold tracking-tight text-[#1c1917] dark:text-[#fafafa] leading-none">
                    LinguaTaste
                  </span>
                  <span className="text-[10px] tracking-wider uppercase text-[#78716c] dark:text-[#a1a1aa] font-mono mt-0.5">
                    Taste-Matched Immersion
                  </span>
                </div>
              </Link>

              {/* Active Profile Pill */}
              <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-[#f5f2ec] dark:bg-[#1c1c24] border border-[#e7e5e4] dark:border-[#2a2a35] text-xs font-medium text-[#57534e] dark:text-[#d4d4d8]">
                <Languages className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span className="capitalize">{userProfile?.targetLanguage || 'korean'}</span>
                <span className="w-1 h-1 rounded-full bg-[#a8a29e] dark:bg-[#71717a]" />
                <span className="text-violet-600 dark:text-violet-400 font-semibold">{userProfile?.cefrLevel || 'A1'}</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/discover' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                      isActive
                        ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 font-semibold'
                        : 'text-[#57534e] dark:text-[#a1a1aa] hover:text-[#1c1917] dark:hover:text-[#fafafa] hover:bg-[#f5f2ec] dark:hover:bg-[#1a1a22]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'opacity-70'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Controls & Modals */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <button
                type="button"
                onClick={() => setKeyModalOpen(true)}
                title="API Credentials & Diagnostics"
                className="p-2 rounded-lg text-[#57534e] dark:text-[#a1a1aa] hover:text-[#1c1917] dark:hover:text-[#fafafa] hover:bg-[#f5f2ec] dark:hover:bg-[#1c1c24] border border-[#e7e5e4] dark:border-[#272730] transition-colors"
                aria-label="API Credentials"
              >
                <Key className="w-4 h-4" />
              </button>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#57534e] dark:text-[#a1a1aa] hover:text-[#1c1917] dark:hover:text-[#fafafa] hover:bg-[#f5f2ec] dark:hover:bg-[#1c1c24] border border-[#e7e5e4] dark:border-[#272730]"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#e7e5e4] dark:border-[#272730] bg-white dark:bg-[#141418] px-4 pt-3 pb-5 space-y-1">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#e7e5e4] dark:border-[#272730]">
              <span className="text-xs font-semibold text-[#57534e] dark:text-[#a1a1aa]">
                Learning: <span className="text-violet-600 dark:text-violet-400 capitalize">{userProfile?.targetLanguage || 'korean'} ({userProfile?.cefrLevel || 'A1'})</span>
              </span>
              <span className="text-[11px] font-mono text-[#78716c] dark:text-[#71717a]">
                {userProfile?.weeklyHours || 5}h / week
              </span>
            </div>
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/discover' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 font-semibold'
                      : 'text-[#57534e] dark:text-[#a1a1aa] hover:text-[#1c1917] dark:hover:text-[#fafafa] hover:bg-[#f5f2ec] dark:hover:bg-[#1c1c24]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* API Key / Diagnostics Modal */}
      <ApiKeyModal
        isOpen={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
      />
    </>
  );
}
