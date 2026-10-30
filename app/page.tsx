'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import {
  SAMPLE_PERSONAS,
  type LanguageCode,
  type CEFRLevel,
  type MediaType,
  type ContentCandidate,
} from '@/lib/types';
import {
  Sparkles,
  Film,
  Tv,
  Music,
  BookOpen,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Sliders,
  Check,
  Search,
  Plus,
  X,
  Clock,
  ExternalLink,
  CheckCircle2,
  Globe,
  BookmarkCheck,
  Sun,
  Moon,
  Star,
  Play,
  RotateCcw,
} from 'lucide-react';
import { getPlatformIcon } from '@/lib/platformIcons';
import { SUBSCRIPTION_PLATFORMS } from '@/lib/store';

const REGION_OPTIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
];

function matchesSubscription(avail: any, subs: string[]): boolean {
  if (!avail) return false;
  const allLinks = [
    ...(avail.streams || []),
    ...(avail.reads || []),
    ...(avail.listens || []),
  ];
  if (allLinks.length === 0) return false;
  if (subs.length === 0) return true;
  return allLinks.some((l: any) => {
    const pId = (l.platformId || '').toLowerCase();
    const pName = (l.platformName || '').toLowerCase();
    return subs.some((sub) => {
      if (sub === 'netflix' && (pId.includes('netflix') || pName.includes('netflix'))) return true;
      if (sub === 'prime' && (pId.includes('prime') || pName.includes('prime') || pName.includes('amazon'))) return true;
      if (sub === 'disney' && (pId.includes('disney') || pName.includes('disney'))) return true;
      if (sub === 'hulu' && (pId.includes('hulu') || pName.includes('hulu'))) return true;
      if (sub === 'max' && (pId.includes('max') || pName.includes('max') || pName.includes('hbo'))) return true;
      if (sub === 'apple_tv' && (pId.includes('apple') || pName.includes('apple tv'))) return true;
      if (sub === 'spotify' && (pId.includes('spotify') || pName.includes('spotify'))) return true;
      if (sub === 'apple_music' && (pId.includes('apple_music') || pName.includes('apple music'))) return true;
      if (sub === 'youtube_premium' && (pId.includes('youtube') || pName.includes('youtube'))) return true;
      return false;
    });
  });
}

const LANGUAGE_LABELS: Record<LanguageCode, { name: string; flag: string; native: string }> = {
  japanese: { name: 'Japanese', flag: '🇯🇵', native: '日本語' },
  spanish: { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  korean: { name: 'Korean', flag: '🇰🇷', native: '한국어' },
  french: { name: 'French', flag: '🇫🇷', native: 'Français' },
  mandarin: { name: 'Mandarin', flag: '🇨🇳', native: '中文' },
  german: { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  italian: { name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
  portuguese: { name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
};

const CEFR_DESCRIPTIONS: Record<CEFRLevel, { label: string; sweetSpot: string }> = {
  A1: { label: 'Absolute Beginner', sweetSpot: 'Pop lyrics, slow animation, picture books' },
  A2: { label: 'Elementary', sweetSpot: 'Slice-of-life TV, acoustic ballads, manga' },
  B1: { label: 'Intermediate', sweetSpot: 'Procedural dramas, narrative podcasts, YA fiction' },
  B2: { label: 'Upper Intermediate', sweetSpot: 'Detective thrillers, art-house cinema, modern fiction' },
  C1: { label: 'Advanced', sweetSpot: 'Political talk shows, satire, poetry, classic cinema' },
  C2: { label: 'Mastery', sweetSpot: 'Historical literature, rap cyphers, philosophy' },
};

const POPULAR_TASTE_PRESETS = [
  'Radiohead',
  'Attack on Titan',
  'Breaking Bad',
  'Spirited Away',
  'Kendrick Lamar',
  'Parasite',
  'Phoebe Bridgers',
  'Twin Peaks',
  'Death Note',
];

export default function Home() {
  const store = useAppStore();

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form input states
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('japanese');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [weeklyHours, setWeeklyHours] = useState<number>(5);
  const [seedList, setSeedList] = useState<string[]>([
    'Attack on Titan',
    'Radiohead',
    'Death Note',
  ]);
  const [customSeedInput, setCustomSeedInput] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | MediaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState<string | null>(null);
  const [availableToMeOnly, setAvailableToMeOnly] = useState<boolean>(false);

  // Initialize Dark Mode from localStorage or system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('linguataste_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const enableDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      setIsDarkMode(enableDark);
      document.documentElement.classList.toggle('dark', enableDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('linguataste_theme', nextDark ? 'dark' : 'light');
  };

  // Sync profile to store
  useEffect(() => {
    store.setUserProfile({
      targetLanguage,
      cefrLevel,
      weeklyHours,
    });
  }, [targetLanguage, cefrLevel, weeklyHours]);

  // Load artwork & availability for candidates
  useEffect(() => {
    if (store.candidates.length > 0) {
      store.loadArtworkForCandidates();
      store.loadAvailabilityForCandidates();
    }
  }, [store.candidates, store.region]);

  // Load a demo persona with 1-click
  const handleLoadPersona = async (persona: typeof SAMPLE_PERSONAS[0]) => {
    setTargetLanguage(persona.targetLanguage);
    setCefrLevel(persona.cefrLevel);
    setWeeklyHours(persona.weeklyHours);
    setSeedList([...persona.seedNames]);
    store.setUserProfile({
      targetLanguage: persona.targetLanguage,
      cefrLevel: persona.cefrLevel,
      weeklyHours: persona.weeklyHours,
    });
    await store.runAnalysis(
      persona.seedNames,
      persona.targetLanguage,
      persona.cefrLevel,
      ['movie', 'tv', 'music', 'book']
    );
  };

  // Add custom seed entity
  const handleAddSeed = (nameToAdd?: string) => {
    const val = (nameToAdd || customSeedInput).trim();
    if (val && !seedList.includes(val)) {
      setSeedList((prev) => [...prev, val]);
      if (!nameToAdd) setCustomSeedInput('');
    }
  };

  const handleRemoveSeed = (name: string) => {
    setSeedList((prev) => prev.filter((s) => s !== name));
  };

  // Run full pipeline
  const handleStartAnalysis = async () => {
    if (seedList.length === 0) return;
    await store.runAnalysis(seedList, targetLanguage, cefrLevel, ['movie', 'tv', 'music', 'book']);
  };

  // Handle candidate feedback
  const handleFeedback = (
    candidate: ContentCandidate,
    reaction: 'thumbs_up' | 'thumbs_down',
    difficulty?: 'too_hard' | 'too_easy' | 'just_right'
  ) => {
    store.addFeedback({
      entityId: candidate.entity.id,
      entityName: candidate.entity.name,
      reaction,
      difficultyFeedback: difficulty,
      timestamp: new Date().toISOString(),
    });

    setFeedbackSuccessNotice(`Recorded feedback for "${candidate.entity.name}". Calibrating recommendations...`);
    setTimeout(() => setFeedbackSuccessNotice(null), 3000);
  };

  // Filter & sort candidates
  const scoredCandidates = store.candidates.map((candidate) => {
    const avail = store.availabilityCache[candidate.entity.id];
    const hasSubMatch = matchesSubscription(avail, store.subscriptions);
    const boostedScore = hasSubMatch ? candidate.compositeScore * 1.15 : candidate.compositeScore;
    return { candidate, boostedScore, hasSubMatch };
  });

  const sortedCandidates = scoredCandidates.sort((a, b) => b.boostedScore - a.boostedScore);

  const filteredCandidates = sortedCandidates
    .filter(({ candidate, hasSubMatch }) => {
      const matchesMedia = selectedMediaType === 'all' || candidate.entity.type === selectedMediaType;
      const matchesAvailable = !availableToMeOnly || hasSubMatch;
      const matchesSearch = !searchQuery.trim() ||
        candidate.entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.entity.creator && candidate.entity.creator.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesMedia && matchesAvailable && matchesSearch;
    })
    .map(({ candidate }) => candidate);

  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#121212] text-[#1a1a1a] dark:text-[#f0f0f0] transition-colors duration-200 flex flex-col font-sans">
      {/* Top BookMyShow-style Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#1a1a1a] border-b border-[#e0e0e0] dark:border-[#2e2e2e] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e63232] flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#1a1a1a] dark:text-white">
                  LinguaTaste
                </span>
                <span className="text-[11px] font-bold text-[#e63232] bg-[#fff0f0] dark:bg-[#2a1414] border border-[#ffcccc] dark:border-[#5a1818] px-2 py-0.5 rounded-full">
                  Taste Immersion
                </span>
              </div>
              <p className="text-[11px] text-[#666666] dark:text-[#999999] hidden sm:block">
                Learn languages naturally through movies, TV, music & books you love
              </p>
            </div>
          </div>

          {/* Quick Category Filters in Header (BookMyShow Style) */}
          <div className="hidden lg:flex items-center gap-1 bg-[#f4f4f4] dark:bg-[#252525] p-1 rounded-lg border border-[#e0e0e0] dark:border-[#333333]">
            {(['all', 'movie', 'tv', 'music', 'book'] as const).map((type) => {
              const isSelected = selectedMediaType === type;
              const label =
                type === 'all'
                  ? 'All'
                  : type === 'movie'
                  ? 'Movies'
                  : type === 'tv'
                  ? 'TV Shows'
                  : type === 'music'
                  ? 'Music'
                  : 'Books';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMediaType(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#e63232] text-white shadow-xs'
                      : 'text-[#666666] dark:text-[#a0a0a0] hover:text-[#1a1a1a] dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Controls: Region, Dark Mode Toggle, Reset */}
          <div className="flex items-center gap-2">
            {/* Region Selector */}
            <div className="flex items-center gap-1.5 bg-[#f4f4f4] dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333333] rounded-lg px-2.5 py-1.5">
              <Globe className="w-3.5 h-3.5 text-[#e63232]" />
              <select
                value={store.region}
                onChange={(e) => store.setRegion(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#1a1a1a] dark:text-[#f0f0f0] focus:outline-none cursor-pointer"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-white dark:bg-[#1e1e1e]">
                    {opt.flag} {opt.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-[#e0e0e0] dark:border-[#333333] bg-[#f4f4f4] dark:bg-[#252525] text-[#444444] dark:text-[#e0e0e0] hover:text-[#e63232] dark:hover:text-[#e63232] transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => store.reset()}
              className="p-2 rounded-lg border border-[#e0e0e0] dark:border-[#333333] bg-[#f4f4f4] dark:bg-[#252525] text-[#888888] hover:text-[#e63232] transition-colors cursor-pointer"
              title="Reset All"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Live Toast Notice */}
      {feedbackSuccessNotice && (
        <div className="fixed top-20 right-6 z-50 bg-[#1a1a1a] dark:bg-[#252525] text-white px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg flex items-center gap-2 border border-[#333333] dark:border-[#444444]">
          <CheckCircle2 className="w-4 h-4 text-[#e63232]" />
          {feedbackSuccessNotice}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-6 items-start">
          
          {/* SIDEBAR: Simple, Humble Filters & Taste Inputs */}
          <aside className="w-full space-y-5">
            
            {/* Quick Demo Personas */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#e63232]" />
                  Try a Persona (1-Click)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PERSONAS.map((persona, idx) => {
                  const isSelected = targetLanguage === persona.targetLanguage && cefrLevel === persona.cefrLevel;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadPersona(persona)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#fff0f0] dark:bg-[#2a1414] border-[#e63232] text-[#e63232] font-bold shadow-xs'
                          : 'bg-[#fafafa] dark:bg-[#222222] border-[#e0e0e0] dark:border-[#333333] text-[#333333] dark:text-[#cccccc] hover:border-[#cccccc]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base">{persona.emoji}</span>
                        <span className="text-[10px] font-semibold text-[#e63232] bg-white dark:bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-[#ffcccc] dark:border-[#5a1818]">
                          {LANGUAGE_LABELS[persona.targetLanguage].flag} {persona.cefrLevel}
                        </span>
                      </div>
                      <span className="font-semibold text-xs mt-1.5 truncate text-[#1a1a1a] dark:text-white">
                        {persona.name.split(' ')[1] || persona.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language & Fluency Settings */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-5 shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#e63232]" />
                Language & Level
              </h2>

              {/* Target Language Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#555555] dark:text-[#aaaaaa] block">
                  Target Language
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((lang) => {
                    const isSelected = targetLanguage === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setTargetLanguage(lang)}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#fff0f0] dark:bg-[#2a1414] border-[#e63232] text-[#e63232] font-bold shadow-xs'
                            : 'bg-[#fafafa] dark:bg-[#222222] border-[#e0e0e0] dark:border-[#333333] text-[#333333] dark:text-[#cccccc] hover:bg-[#f0f0f0] dark:hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <span className="text-base leading-none">{LANGUAGE_LABELS[lang].flag}</span>
                        <span className="text-[11px] mt-1 truncate w-full">
                          {LANGUAGE_LABELS[lang].name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CEFR Level Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#555555] dark:text-[#aaaaaa]">
                    CEFR Proficiency Level
                  </label>
                  <span className="text-[11px] font-bold text-[#e63232]">
                    {CEFR_DESCRIPTIONS[cefrLevel].label}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 bg-[#f4f4f4] dark:bg-[#252525] p-1 rounded-lg border border-[#e0e0e0] dark:border-[#333333]">
                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map((lvl) => {
                    const isSelected = cefrLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCefrLevel(lvl)}
                        className={`py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#e63232] text-white shadow-xs'
                            : 'text-[#666666] dark:text-[#aaaaaa] hover:text-[#1a1a1a] dark:hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-[#666666] dark:text-[#999999] bg-[#f9f9f9] dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#333333] rounded-lg p-2.5">
                  <span className="font-semibold text-[#1a1a1a] dark:text-[#f0f0f0]">Sweet Spot: </span>
                  {CEFR_DESCRIPTIONS[cefrLevel].sweetSpot}
                </div>
              </div>

              {/* Weekly Hours */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#555555] dark:text-[#aaaaaa]">
                    Weekly Study Budget
                  </label>
                  <span className="text-xs font-bold text-[#e63232] bg-[#fff0f0] dark:bg-[#2a1414] border border-[#ffcccc] dark:border-[#5a1818] px-2 py-0.5 rounded">
                    {weeklyHours} hrs/week
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-[#e0e0e0] dark:bg-[#333333] rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#888888] dark:text-[#666666]">
                  <span>2 hrs (Casual)</span>
                  <span>10 hrs</span>
                  <span>20 hrs (Immersion)</span>
                </div>
              </div>

              {/* Streaming Subscriptions */}
              <div className="space-y-1.5 pt-2 border-t border-[#e0e0e0] dark:border-[#2e2e2e]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#555555] dark:text-[#aaaaaa]">
                    My Subscriptions
                  </label>
                  <span className="text-[10px] text-[#888888] dark:text-[#666666]">
                    {store.subscriptions.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {SUBSCRIPTION_PLATFORMS.map((platform) => {
                    const isSelected = store.subscriptions.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => store.toggleSubscription(platform.id)}
                        className={`px-2 py-1 rounded-md text-[11px] border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#fff0f0] dark:bg-[#2a1414] border-[#e63232] text-[#e63232] font-semibold'
                            : 'bg-[#fafafa] dark:bg-[#222222] border-[#e0e0e0] dark:border-[#333333] text-[#444444] dark:text-[#cccccc] hover:bg-[#f0f0f0]'
                        }`}
                      >
                        {getPlatformIcon(platform.id, platform.name, { size: 12 })}
                        <span>{platform.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#e63232]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cultural Taste Seeds */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-5 shadow-xs space-y-3.5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a1a1a] dark:text-white">
                  Your Cultural Seeds
                </h2>
                <p className="text-xs text-[#666666] dark:text-[#aaaaaa] mt-0.5">
                  Bands, movies, series, or authors you already love
                </p>
              </div>

              {/* Input + Add */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Radiohead, Breaking Bad..."
                  value={customSeedInput}
                  onChange={(e) => setCustomSeedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSeed()}
                  className="flex-1 bg-white dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#333333] rounded-lg px-3 py-2 text-xs text-[#1a1a1a] dark:text-white placeholder-[#999999] focus:outline-none focus:border-[#e63232]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSeed()}
                  className="px-3.5 py-2 bg-[#1a1a1a] dark:bg-[#333333] hover:bg-[#333333] dark:hover:bg-[#444444] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-[#888888] dark:text-[#666666] self-center mr-1">Popular:</span>
                {POPULAR_TASTE_PRESETS.slice(0, 5).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddSeed(preset)}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#f0f0f0] dark:bg-[#252525] hover:bg-[#e0e0e0] dark:hover:bg-[#333333] text-[#555555] dark:text-[#cccccc] transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>

              {/* Seed Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[50px] p-2 bg-[#f9f9f9] dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#333333] rounded-lg">
                {seedList.map((seed, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#333333] text-xs text-[#1a1a1a] dark:text-white shadow-xs"
                  >
                    <span>{seed}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSeed(seed)}
                      className="text-[#888888] hover:text-[#e63232] transition-colors p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {seedList.length === 0 && (
                  <span className="text-xs text-[#888888] italic self-center">
                    No seeds added yet.
                  </span>
                )}
              </div>

              {/* BookMyShow Style Red Action CTA */}
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={store.isLoading || seedList.length === 0}
                className="w-full py-3 px-4 rounded-lg bg-[#e63232] hover:bg-[#cc2828] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {store.isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Discovering {LANGUAGE_LABELS[targetLanguage].name} Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Discover Content
                  </>
                )}
              </button>
            </div>

          </aside>

          {/* MAIN AREA: BookMyShow Media Catalog */}
          <div className="w-full space-y-5 min-w-0">
            
            {/* Empty State before discovery */}
            {!store.tasteProfile && store.candidates.length === 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-12 text-center shadow-xs space-y-4">
                <div className="w-14 h-14 bg-[#fff0f0] dark:bg-[#2a1414] text-[#e63232] rounded-full flex items-center justify-center mx-auto">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-[#1a1a1a] dark:text-white">
                    Discover Authentic Content for {LANGUAGE_LABELS[targetLanguage].name}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#aaaaaa] mt-2 leading-relaxed">
                    Select a quick persona on the left or add your favorite artists, movies, and TV shows. Click <span className="font-semibold text-[#e63232]">Discover Content</span> to map your taste into authentic {LANGUAGE_LABELS[targetLanguage].name} cinema, music, and literature.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartAnalysis}
                    className="mt-4 px-5 py-2.5 rounded-lg bg-[#e63232] hover:bg-[#cc2828] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Discover with Selected Seeds
                  </button>
                </div>
              </div>
            )}

            {/* Results View */}
            {store.tasteProfile && (
              <div className="space-y-5">
                
                {/* Taste Profile Fingerprint Header */}
                <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e0e0e0] dark:border-[#2e2e2e]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#e63232]">
                        Qloo Cultural Fingerprint
                      </span>
                      <h2 className="text-base font-bold text-[#1a1a1a] dark:text-white mt-0.5">
                        {store.tasteProfile.summary}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => store.generatePlan()}
                      disabled={store.isLoading}
                      className="px-3.5 py-1.5 bg-[#f4f4f4] dark:bg-[#252525] hover:bg-[#eaeaea] dark:hover:bg-[#303030] border border-[#e0e0e0] dark:border-[#333333] text-[#1a1a1a] dark:text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#e63232]" />
                      <span>{store.weeklyPlan ? 'Regenerate 7-Day Plan' : 'Generate 7-Day Plan'}</span>
                    </button>
                  </div>

                  {/* Taste Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {store.tasteProfile.topTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f0f0f0] dark:bg-[#252525] text-xs text-[#444444] dark:text-[#cccccc]"
                      >
                        <span>{tag.name}</span>
                        <span className="text-[10px] font-bold text-[#e63232]">
                          {Math.round(tag.affinity * 100)}%
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-3 shadow-xs">
                  {/* Media Filter Tabs */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['all', 'movie', 'tv', 'music', 'book'] as const).map((type) => {
                      const isSelected = selectedMediaType === type;
                      const label =
                        type === 'all'
                          ? 'All Media'
                          : type === 'movie'
                          ? 'Movies'
                          : type === 'tv'
                          ? 'TV Shows'
                          : type === 'music'
                          ? 'Music'
                          : 'Books';
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedMediaType(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#e63232] text-white shadow-xs'
                              : 'text-[#666666] dark:text-[#aaaaaa] hover:text-[#1a1a1a] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#252525]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search in Results */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search title or artist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 bg-[#f4f4f4] dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333333] rounded-lg text-xs text-[#1a1a1a] dark:text-white placeholder-[#888888] focus:outline-none focus:border-[#e63232] w-40 sm:w-48"
                      />
                    </div>

                    {/* Available on My Subscriptions Only */}
                    <button
                      type="button"
                      onClick={() => setAvailableToMeOnly(!availableToMeOnly)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        availableToMeOnly
                          ? 'bg-[#fff0f0] dark:bg-[#2a1414] border-[#e63232] text-[#e63232]'
                          : 'bg-white dark:bg-[#1a1a1a] border-[#e0e0e0] dark:border-[#333333] text-[#666666] dark:text-[#aaaaaa] hover:bg-[#fafafa]'
                      }`}
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Subscribed</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Media Cards Grid (BookMyShow Movie Poster Style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredCandidates.map((candidate, idx) => {
                    const mediaIcon =
                      candidate.entity.type === 'music' ? (
                        <Music className="w-3 h-3" />
                      ) : candidate.entity.type === 'tv' ? (
                        <Tv className="w-3 h-3" />
                      ) : candidate.entity.type === 'book' ? (
                        <BookOpen className="w-3 h-3" />
                      ) : (
                        <Film className="w-3 h-3" />
                      );

                    const artwork = store.artworkCache[candidate.entity.id];
                    const avail = store.availabilityCache[candidate.entity.id];
                    const isMusic = candidate.entity.type === 'music';
                    const hasSubMatch = matchesSubscription(avail, store.subscriptions);

                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-3">
                          {/* Artwork Poster */}
                          <div
                            className={`relative w-full ${
                              isMusic ? 'aspect-square' : 'aspect-[2/3]'
                            } max-h-56 rounded-lg overflow-hidden bg-[#e8e8e8] dark:bg-[#262626] border border-[#e0e0e0] dark:border-[#333333]`}
                          >
                            {artwork?.url ? (
                              <img
                                src={artwork.url}
                                alt={candidate.entity.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%23222222"/><text x="150" y="225" font-family="sans-serif" font-size="16" fill="%23e63232" text-anchor="middle">${encodeURIComponent(
                                    candidate.entity.name
                                  )}</text></svg>`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#888888]">
                                <div className="p-3 rounded-full bg-white dark:bg-[#333333] shadow-xs">
                                  {mediaIcon}
                                </div>
                                <span className="text-[10px]">Loading cover...</span>
                              </div>
                            )}

                            {/* Subscribed Badge */}
                            {hasSubMatch && (
                              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#e63232] text-white shadow-xs">
                                Subscribed
                              </span>
                            )}
                          </div>

                          {/* Badges Row */}
                          <div className="flex items-center justify-between gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f0f0] dark:bg-[#252525] text-[#444444] dark:text-[#cccccc] capitalize font-medium">
                              {mediaIcon}
                              {candidate.entity.type}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#e63232] bg-[#fff0f0] dark:bg-[#2a1414] border border-[#ffcccc] dark:border-[#5a1818] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-[#e63232]" />
                                {Math.round(candidate.qlooAffinity * 100)}% Match
                              </span>
                              <span className="font-bold text-[#1a1a1a] dark:text-white bg-[#f0f0f0] dark:bg-[#252525] px-1.5 py-0.5 rounded">
                                Lvl {candidate.difficultyScore}/10
                              </span>
                            </div>
                          </div>

                          {/* Title & Creator */}
                          <div>
                            <h3 className="text-base font-bold text-[#1a1a1a] dark:text-white leading-snug line-clamp-1">
                              {candidate.entity.name}
                            </h3>
                            {candidate.entity.creator && (
                              <p className="text-xs text-[#666666] dark:text-[#aaaaaa] mt-0.5 line-clamp-1">
                                by {candidate.entity.creator}
                              </p>
                            )}
                          </div>

                          {/* Description */}
                          {candidate.entity.description && (
                            <p className="text-xs text-[#666666] dark:text-[#aaaaaa] line-clamp-2 leading-relaxed">
                              {candidate.entity.description}
                            </p>
                          )}

                          {/* Why Matched Note */}
                          <div className="p-2.5 rounded-lg bg-[#f9f9f9] dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#333333] text-xs">
                            <span className="text-[10px] font-bold text-[#e63232] uppercase tracking-wider block mb-0.5">
                              Why Qloo Matched This
                            </span>
                            <p className="italic text-[#555555] dark:text-[#cccccc] text-[11px] leading-relaxed">
                              "{candidate.tasteConnectionReason}"
                            </p>
                          </div>

                          {/* Linguistic Fit */}
                          <p className="text-[11px] text-[#777777] dark:text-[#999999] leading-relaxed">
                            <span className="font-semibold text-[#333333] dark:text-[#dddddd]">Linguistic fit: </span>
                            {candidate.difficultyKeyNote}
                          </p>

                          {/* Where to Stream / Listen / Read */}
                          <div className="pt-2 border-t border-[#e0e0e0] dark:border-[#2e2e2e] space-y-1.5">
                            <div className="text-[10px] font-semibold text-[#888888] dark:text-[#777777] flex items-center gap-1 uppercase tracking-wider">
                              <Globe className="w-3 h-3 text-[#e63232]" />
                              <span>Where to {candidate.entity.type === 'book' ? 'Read' : candidate.entity.type === 'music' ? 'Listen' : 'Watch'} ({store.region})</span>
                            </div>

                            {avail ? (
                              <div>
                                {(() => {
                                  const primaryLinks = [
                                    ...(avail.streams || []),
                                    ...(avail.reads || []),
                                    ...(avail.listens || []),
                                  ];
                                  const rentBuyLinks = [
                                    ...(avail.rents || []),
                                    ...(avail.buys || []),
                                  ];

                                  if (primaryLinks.length === 0 && rentBuyLinks.length === 0) {
                                    return (
                                      <div className="flex items-center justify-between text-[11px] text-[#888888] p-1.5 bg-[#f9f9f9] dark:bg-[#222222] rounded border border-[#e0e0e0] dark:border-[#333333]">
                                        <span className="italic">Not streaming in {store.region}</span>
                                        <a
                                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                                            candidate.entity.name + ' ' + candidate.entity.type
                                          )}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#e63232] font-semibold flex items-center gap-1 hover:underline text-[10px]"
                                        >
                                          Search Trailer <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="space-y-1.5">
                                      {primaryLinks.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          {primaryLinks.slice(0, 3).map((link, lIdx) => (
                                            <a
                                              key={lIdx}
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title={link.platformName}
                                              className="p-1 px-2 rounded bg-[#f4f4f4] dark:bg-[#252525] hover:bg-[#eaeaea] dark:hover:bg-[#333333] border border-[#e0e0e0] dark:border-[#333333] text-[11px] text-[#1a1a1a] dark:text-white flex items-center gap-1.5 transition-colors"
                                            >
                                              {link.logoPath && link.logoPath.startsWith('/') ? (
                                                <img
                                                  src={`https://image.tmdb.org/t/p/w92${link.logoPath}`}
                                                  alt={link.platformName}
                                                  className="w-3.5 h-3.5 rounded object-cover"
                                                  onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                  }}
                                                />
                                              ) : (
                                                getPlatformIcon(link.platformId, link.platformName, { size: 12 })
                                              )}
                                              <span className="truncate max-w-[90px]">{link.platformName}</span>
                                              <ExternalLink className="w-2.5 h-2.5 text-[#888888]" />
                                            </a>
                                          ))}
                                        </div>
                                      )}

                                      {rentBuyLinks.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap">
                                          <span className="text-[9px] text-[#888888] uppercase">Rent/Buy:</span>
                                          {rentBuyLinks.slice(0, 2).map((link, lIdx) => (
                                            <a
                                              key={lIdx}
                                              href={link.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-0.5 px-1.5 rounded bg-[#f9f9f9] dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#333333] text-[10px] text-[#555555] dark:text-[#cccccc] hover:text-[#1a1a1a] flex items-center gap-1"
                                            >
                                              <span>{link.platformName}</span>
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="h-6 bg-[#f0f0f0] dark:bg-[#252525] rounded animate-pulse" />
                            )}
                          </div>
                        </div>

                        {/* Thumbs Feedback */}
                        <div className="pt-2.5 border-t border-[#e0e0e0] dark:border-[#2e2e2e] flex items-center justify-between text-xs">
                          <span className="text-[10px] text-[#888888]">Calibrate:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleFeedback(candidate, 'thumbs_up')}
                              className="p-1.5 rounded hover:bg-[#e8f5e9] dark:hover:bg-[#1b3320] text-[#666666] hover:text-[#2e7d32] transition-colors cursor-pointer"
                              title="Matches my taste"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(candidate, 'thumbs_down')}
                              className="p-1.5 rounded hover:bg-[#ffebee] dark:hover:bg-[#331b1b] text-[#666666] hover:text-[#e63232] transition-colors cursor-pointer"
                              title="Not for me"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(candidate, 'thumbs_up', 'too_hard')}
                              className="px-2 py-0.5 rounded bg-[#f0f0f0] dark:bg-[#252525] hover:bg-[#e4e4e4] dark:hover:bg-[#333333] text-[10px] font-medium text-[#444444] dark:text-[#cccccc] transition-colors cursor-pointer"
                              title="Too hard"
                            >
                              Hard
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(candidate, 'thumbs_up', 'too_easy')}
                              className="px-2 py-0.5 rounded bg-[#f0f0f0] dark:bg-[#252525] hover:bg-[#e4e4e4] dark:hover:bg-[#333333] text-[10px] font-medium text-[#444444] dark:text-[#cccccc] transition-colors cursor-pointer"
                              title="Too easy"
                            >
                              Easy
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 7-Day Immersion Calendar (If Generated) */}
                {store.weeklyPlan && (
                  <div className="bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#2e2e2e] rounded-xl p-5 shadow-xs space-y-4 pt-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e0e0e0] dark:border-[#2e2e2e]">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#e63232]" />
                          <h2 className="text-base font-bold text-[#1a1a1a] dark:text-white">
                            Week {store.weeklyPlan.week} Immersion Schedule
                          </h2>
                        </div>
                        <p className="text-xs text-[#666666] dark:text-[#999999] mt-0.5">
                          {store.weeklyPlan.totalMinutes} minutes total study plan
                        </p>
                      </div>
                    </div>

                    {/* Scrollable Calendar */}
                    <div className="flex gap-4 overflow-x-auto pb-3 pt-1">
                      {store.weeklyPlan.sessions.map((session, idx) => {
                        const sessionArtwork = store.artworkCache[session.content.entity.id];
                        const sessionAvail = store.availabilityCache[session.content.entity.id];
                        const topPlatform =
                          sessionAvail?.streams?.[0] ||
                          sessionAvail?.reads?.[0] ||
                          sessionAvail?.listens?.[0] ||
                          null;

                        return (
                          <div
                            key={idx}
                            className="w-64 shrink-0 bg-[#f9f9f9] dark:bg-[#222222] border border-[#e0e0e0] dark:border-[#333333] rounded-lg p-3.5 flex flex-col justify-between space-y-3 shadow-xs"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#e63232] uppercase">
                                  {session.day}
                                </span>
                                <span className="text-[10px] text-[#666666] dark:text-[#aaaaaa] font-mono bg-white dark:bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#e0e0e0] dark:border-[#333333]">
                                  {session.durationMinutes}m
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-14 rounded bg-[#e0e0e0] dark:bg-[#333333] overflow-hidden shrink-0">
                                  {sessionArtwork?.url ? (
                                    <img
                                      src={sessionArtwork.url}
                                      alt={session.content.entity.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#888888]">
                                      <Film className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-[#1a1a1a] dark:text-white truncate">
                                    {session.content.entity.name}
                                  </h4>
                                  <span className="text-[10px] text-[#666666] dark:text-[#aaaaaa] capitalize block mt-0.5">
                                    {session.mediaType} · Lvl {session.content.difficultyScore}/10
                                  </span>
                                </div>
                              </div>

                              {topPlatform && (
                                <a
                                  href={topPlatform.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full text-center py-1 rounded bg-[#fff0f0] dark:bg-[#2a1414] border border-[#ffcccc] dark:border-[#5a1818] text-[10px] font-semibold text-[#e63232] hover:bg-[#ffe5e5] dark:hover:bg-[#3a1a1a] transition-colors"
                                >
                                  Open on {topPlatform.platformName}
                                </a>
                              )}

                              <div className="text-[11px] text-[#444444] dark:text-[#cccccc] bg-white dark:bg-[#1a1a1a] p-2 rounded border border-[#e0e0e0] dark:border-[#333333]">
                                <span className="font-bold text-[#1a1a1a] dark:text-white block mb-0.5">Activity:</span>
                                {session.activity}
                              </div>

                              {session.preTeachVocabulary && session.preTeachVocabulary.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-[#1a1a1a] dark:text-white uppercase">
                                    Vocabulary:
                                  </span>
                                  <div className="space-y-1">
                                    {session.preTeachVocabulary.slice(0, 2).map((v, vIdx) => (
                                      <div
                                        key={vIdx}
                                        className="text-[10px] p-1 rounded bg-white dark:bg-[#1a1a1a] border border-[#e0e0e0] dark:border-[#333333] flex items-center justify-between"
                                      >
                                        <span className="font-bold text-[#1a1a1a] dark:text-white">{v.word}</span>
                                        <span className="text-[#666666] dark:text-[#aaaaaa]">{v.translation}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="text-[10px] text-[#666666] dark:text-[#aaaaaa] bg-white dark:bg-[#1a1a1a] p-2 rounded border border-[#e0e0e0] dark:border-[#333333]">
                                <span className="font-bold text-[#1a1a1a] dark:text-white block mb-0.5">Task:</span>
                                {session.activeTask}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </main>

      {/* BookMyShow Style Minimalist Footer */}
      <footer className="bg-white dark:bg-[#1a1a1a] border-t border-[#e0e0e0] dark:border-[#2e2e2e] py-6 text-xs text-[#666666] dark:text-[#888888] mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a1a1a] dark:text-white">LinguaTaste</span>
              <span>·</span>
              <span>Cultural Language Immersion powered by Qloo Taste Intelligence</span>
            </div>
            <div className="text-[11px] text-[#888888]">
              Next.js 16 · Qloo V2 Taste Graph
            </div>
          </div>
          <div className="pt-2 border-t border-[#f0f0f0] dark:border-[#2a2a2a] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
            <span>Streaming availability data provided by JustWatch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
