'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { SAMPLE_PERSONAS, type LanguageCode, type CEFRLevel, type MediaType, type ContentCandidate, type WeeklySession } from '@/lib/types';
import {
  Sparkles,
  Compass,
  Film,
  Tv,
  Music,
  BookOpen,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  Sliders,
  Terminal,
  ArrowRight,
  Check,
  ChevronRight,
  BarChart3,
  Layers,
  Search,
  Plus,
  X,
  Clock,
  Key,
  Shield,
  Lightbulb,
  ExternalLink,
  Info,
  CheckCircle2,
  ChevronDown,
  Volume2,
  Globe,
  Radio,
  CheckSquare,
  Square,
  BookmarkCheck,
} from 'lucide-react';
import { getPlatformIcon, TmdbLogoIcon } from '@/lib/platformIcons';
import { SUBSCRIPTION_PLATFORMS, type SubscriptionPlatformId } from '@/lib/store';

const REGION_OPTIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
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
    return subs.some(sub => {
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

const LANGUAGE_LABELS: Record<LanguageCode, { name: string; flag: string; script: string }> = {
  japanese: { name: 'Japanese', flag: '🇯🇵', script: '日本語' },
  spanish: { name: 'Spanish', flag: '🇪🇸', script: 'Español' },
  korean: { name: 'Korean', flag: '🇰🇷', script: '한국어' },
  french: { name: 'French', flag: '🇫🇷', script: 'Français' },
  mandarin: { name: 'Mandarin', flag: '🇨🇳', script: '中文' },
  german: { name: 'German', flag: '🇩🇪', script: 'Deutsch' },
  italian: { name: 'Italian', flag: '🇮🇹', script: 'Italiano' },
  portuguese: { name: 'Portuguese', flag: '🇧🇷', script: 'Português' },
};

const CEFR_DESCRIPTIONS: Record<CEFRLevel, { label: string; desc: string; sweetSpot: string }> = {
  A1: { label: 'Absolute Beginner', desc: 'Single words, basic greetings, slow visual cues', sweetSpot: 'Pop lyrics, children animation, picture books' },
  A2: { label: 'Elementary', desc: 'Daily routines, simple social exchanges, common vocabulary', sweetSpot: 'Slice-of-life TV, acoustic ballads, manga' },
  B1: { label: 'Intermediate', desc: 'Opinions, plot summaries, familiar narratives', sweetSpot: 'Procedural dramas, narrative podcasts, YA novels' },
  B2: { label: 'Upper Intermediate', desc: 'Complex arguments, colloquial idioms, rapid natural speech', sweetSpot: 'Detective thrillers, art-house cinema, contemporary fiction' },
  C1: { label: 'Advanced', desc: 'Subtext, regional slang, technical nuances', sweetSpot: 'Political talk shows, satire, classical poetry' },
  C2: { label: 'Mastery', desc: 'Native dialect, archaic literature, high-register wordplay', sweetSpot: 'Historic novels, rap cyphers, philosophical essays' },
};

export default function Home() {
  const store = useAppStore();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'immersion' | 'comparison' | 'inspector'>('immersion');
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Form input states
  const [targetLanguage, setTargetLanguage] = useState<LanguageCode>('japanese');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A1');
  const [weeklyHours, setWeeklyHours] = useState<number>(5);
  const [seedList, setSeedList] = useState<string[]>([
    'Attack on Titan',
    'Radiohead',
    'Death Note',
    'Spirited Away',
    'Neutral Milk Hotel',
  ]);
  const [customSeedInput, setCustomSeedInput] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | MediaType>('all');
  const [feedbackSuccessNotice, setFeedbackSuccessNotice] = useState<string | null>(null);
  const [availableToMeOnly, setAvailableToMeOnly] = useState<boolean>(false);

  // Initialize profile in store
  useEffect(() => {
    store.setUserProfile({
      targetLanguage,
      cefrLevel,
      weeklyHours,
    });
  }, [targetLanguage, cefrLevel, weeklyHours]);

  // Auto-detect browser region if not set
  useEffect(() => {
    if (typeof window !== 'undefined' && (!store.region || store.region === 'US')) {
      try {
        const locale = navigator.language || '';
        const parts = locale.split('-');
        if (parts.length > 1 && parts[1].length === 2) {
          store.setRegion(parts[1].toUpperCase());
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Automatically fetch artwork & availability for any newly populated candidates
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
    // Trigger analysis immediately
    await store.runAnalysis(
      persona.seedNames,
      persona.targetLanguage,
      persona.cefrLevel,
      ['movie', 'tv', 'music', 'book']
    );
  };

  // Add custom seed entity
  const handleAddSeed = () => {
    const trimmed = customSeedInput.trim();
    if (trimmed && !seedList.includes(trimmed)) {
      setSeedList(prev => [...prev, trimmed]);
      setCustomSeedInput('');
    }
  };

  const handleRemoveSeed = (name: string) => {
    setSeedList(prev => prev.filter(s => s !== name));
  };

  // Run full pipeline
  const handleStartAnalysis = async () => {
    if (seedList.length === 0) return;
    await store.runAnalysis(seedList, targetLanguage, cefrLevel, ['movie', 'tv', 'music', 'book']);
  };

  // Handle candidate feedback
  const handleFeedback = (candidate: ContentCandidate, reaction: 'thumbs_up' | 'thumbs_down', difficulty?: 'too_hard' | 'too_easy' | 'just_right') => {
    store.addFeedback({
      entityId: candidate.entity.id,
      entityName: candidate.entity.name,
      reaction,
      difficultyFeedback: difficulty,
      timestamp: new Date().toISOString(),
    });

    setFeedbackSuccessNotice(`Recorded feedback for "${candidate.entity.name}". Recalibrating taste weights...`);
    setTimeout(() => setFeedbackSuccessNotice(null), 3000);
  };

  // Candidate ranking boost & filtering:
  // Boost items available on the user's subscribed streaming services (+15% score)
  const scoredCandidates = store.candidates.map(candidate => {
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
      return matchesMedia && matchesAvailable;
    })
    .map(({ candidate }) => candidate);

  return (
    <div className="min-h-screen bg-[#07070c] text-zinc-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Background radial blurs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-white/[0.08] gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[1px] shadow-lg shadow-purple-600/20">
              <div className="w-full h-full bg-[#0d0d16] rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-purple-200 bg-clip-text text-transparent">
                  LinguaTaste
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                  Qloo Taste Graph Core
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Taste-Matched Cultural Immersion · Calibrated to CEFR Proficiency
              </p>
            </div>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] flex items-center gap-1">
              <button
                onClick={() => setActiveTab('immersion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'immersion'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Immersion Studio
              </button>
              <button
                onClick={() => {
                  setActiveTab('comparison');
                  if (!store.qlooComparison && !store.llmComparison) {
                    store.runComparison(seedList, targetLanguage, cefrLevel);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'comparison'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Qloo vs. Generic LLM
              </button>
              <button
                onClick={() => setActiveTab('inspector')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === 'inspector'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Taste Graph Inspector
              </button>
            </div>

            <button
              onClick={() => setShowLogDrawer(!showLogDrawer)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Agent Execution Log"
            >
              <Terminal className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Log</span>
            </button>

            <button
              onClick={() => store.reset()}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition-all text-xs"
              title="Reset state"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Live Feedback Toast Notice */}
        {feedbackSuccessNotice && (
          <div className="fixed top-5 right-5 z-50 bg-purple-950/90 text-purple-200 border border-purple-500/40 px-4 py-2.5 rounded-xl text-xs font-medium backdrop-blur-md shadow-xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedbackSuccessNotice}
          </div>
        )}

        {/* MAIN BODY TABS */}
        <main className="flex-1 py-8">
          {activeTab === 'immersion' && (
            <div className="space-y-10">
              
              {/* Persona Quick Picker (Judge Demo Showcase) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      Judge Quick-Launch Personas
                    </h2>
                    <p className="text-xs text-zinc-400">
                      1-click demonstration personas showcasing how Qloo maps disparate western tastes into target cultures
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {SAMPLE_PERSONAS.map((persona, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleLoadPersona(persona)}
                      className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                        targetLanguage === persona.targetLanguage && cefrLevel === persona.cefrLevel
                          ? 'bg-purple-900/20 border-purple-500/50 shadow-lg shadow-purple-900/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                          {persona.emoji}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-white uppercase px-2 py-0.5 rounded-full bg-white/[0.08]">
                            {LANGUAGE_LABELS[persona.targetLanguage].flag} {persona.cefrLevel}
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-1">
                            {persona.weeklyHours}h / week
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {persona.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {persona.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[10px] text-purple-400 font-medium">
                          {persona.seedNames.slice(0, 2).join(' · ')}...
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Onboarding & Custom Controls Section */}
              <section className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Preferences */}
                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-purple-400" />
                        Immersion Parameters
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Configure target language, CEFR sweet-spot, and weekly commitment
                      </p>
                    </div>

                    {/* Language Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Target Language
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map(lang => (
                          <button
                            key={lang}
                            onClick={() => setTargetLanguage(lang)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              targetLanguage === lang
                                ? 'bg-purple-600/30 border-purple-500 text-white font-medium shadow-sm'
                                : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="text-sm">{LANGUAGE_LABELS[lang].flag}</div>
                            <div className="text-xs font-semibold mt-1">{LANGUAGE_LABELS[lang].name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{LANGUAGE_LABELS[lang].script}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CEFR Level Selector with Sweet Spot Insights */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                          Current CEFR Level
                        </label>
                        <span className="text-[11px] text-purple-400 font-mono">
                          {CEFR_DESCRIPTIONS[cefrLevel].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5 bg-white/[0.02] p-1 rounded-xl border border-white/[0.06]">
                        {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]).map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => setCefrLevel(lvl)}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              cefrLevel === lvl
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs space-y-1">
                        <div className="text-purple-300 font-medium flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                          Recommended Medium: {CEFR_DESCRIPTIONS[cefrLevel].sweetSpot}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {CEFR_DESCRIPTIONS[cefrLevel].desc}
                        </p>
                      </div>
                    </div>

                    {/* Weekly Study Hours Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                          Weekly Study Budget
                        </label>
                        <span className="text-xs font-bold text-white font-mono bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                          {weeklyHours} Hours / Week
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        step="1"
                        value={weeklyHours}
                        onChange={e => setWeeklyHours(Number(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-white/[0.08] rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>2 hrs (Casual)</span>
                        <span>10 hrs (Dedicated)</span>
                        <span>20 hrs (Full Immersion)</span>
                      </div>
                    </div>

                    {/* Region Selector (Where to Consume) */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-purple-400" />
                          Availability Region
                        </label>
                        <span className="text-[10px] text-zinc-400">
                          Streaming & media providers
                        </span>
                      </div>
                      <select
                        value={store.region}
                        onChange={e => store.setRegion(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
                      >
                        {REGION_OPTIONS.map(opt => (
                          <option key={opt.code} value={opt.code} className="bg-[#12121e] text-white">
                            {opt.flag} {opt.name} ({opt.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Active Streaming Subscriptions */}
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-purple-400" />
                          My Active Subscriptions
                        </label>
                        <span className="text-[10px] text-purple-400 font-mono">
                          {store.subscriptions.length} active
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Select your platforms to boost accessible content to the top.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {SUBSCRIPTION_PLATFORMS.map(platform => {
                          const isSelected = store.subscriptions.includes(platform.id);
                          return (
                            <button
                              key={platform.id}
                              type="button"
                              onClick={() => store.toggleSubscription(platform.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600/30 border-purple-500/80 text-white font-medium shadow-sm'
                                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                              }`}
                            >
                              {getPlatformIcon(platform.id, platform.name, { size: 14 })}
                              <span>{platform.name}</span>
                              {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Cultural Taste Seeds */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Layers className="w-5 h-5 text-purple-400" />
                          Your Cultural Taste Seeds
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1">
                          Enter your favorite media (bands, movies, shows, books). Qloo will resolve their taste graph coordinates.
                        </p>
                      </div>

                      {/* Add Seed Input */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Add artist, anime, TV show, or author (e.g., Radiohead, Breaking Bad)..."
                            value={customSeedInput}
                            onChange={e => setCustomSeedInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSeed()}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                          />
                        </div>
                        <button
                          onClick={handleAddSeed}
                          className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>

                      {/* Seed Tags Chips */}
                      <div className="flex flex-wrap gap-2 min-h-[90px] p-3 rounded-2xl bg-black/30 border border-white/[0.06] items-start">
                        {seedList.map((seed, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-xs text-purple-200"
                          >
                            <span>{seed}</span>
                            <button
                              onClick={() => handleRemoveSeed(seed)}
                              className="hover:text-red-400 transition-colors p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {seedList.length === 0 && (
                          <span className="text-xs text-zinc-500 italic p-2">
                            No seeds added yet. Type above or click a demo persona!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Launch Immersion Engine CTA */}
                    <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-zinc-400 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>Cultural grounding via Qloo V2 Insights & Search</span>
                      </div>

                      <button
                        onClick={handleStartAnalysis}
                        disabled={store.isLoading || seedList.length === 0}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {store.isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Querying Qloo Taste Graph...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Synthesize Taste-Matched Immersion
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </section>

              {/* TASTE PROFILE DASHBOARD (If analysis exists) */}
              {store.tasteProfile && (
                <section className="space-y-6 animate-fadeIn">
                  
                  {/* Top Taste DNA Bar */}
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-black border border-purple-500/20 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                            Qloo Cultural Fingerprint
                          </span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                            Taste Vector Active
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mt-1">
                          {store.tasteProfile.summary}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => store.generatePlan()}
                          disabled={store.isLoading}
                          className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-xs font-semibold text-white flex items-center gap-2 transition-all"
                        >
                          <Calendar className="w-4 h-4" />
                          {store.weeklyPlan ? 'Regenerate Weekly Plan' : 'Generate 7-Day Plan'}
                        </button>
                      </div>
                    </div>

                    {/* Affinity Tags Pills */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {store.tasteProfile.topTags.map((tag, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs"
                        >
                          <span className="text-zinc-200">{tag.name}</span>
                          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-1.5 py-0.5 rounded-md">
                            {(tag.affinity * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RECOMMENDATION CANDIDATE MATRIX */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Compass className="w-5 h-5 text-purple-400" />
                          Taste-Matched Cultural Recommendations
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Content items sharing your exact cultural DNA, calibrated to CEFR {cefrLevel}
                        </p>
                      </div>

                      {/* Filter by Subscription Availability & Media Type */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setAvailableToMeOnly(!availableToMeOnly)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            availableToMeOnly
                              ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-600/20'
                              : 'bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white'
                          }`}
                          title="Show only items available on your active subscriptions or free/web providers"
                        >
                          <BookmarkCheck className={`w-3.5 h-3.5 ${availableToMeOnly ? 'text-emerald-400' : 'text-zinc-400'}`} />
                          <span>Available to Me</span>
                          {availableToMeOnly && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </button>

                        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                          {(['all', 'movie', 'tv', 'music', 'book'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => setSelectedMediaType(type)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer ${
                                selectedMediaType === type
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Candidate Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredCandidates.map((candidate, idx) => {
                        const mediaIcon =
                          candidate.entity.type === 'music' ? <Music className="w-3.5 h-3.5" /> :
                          candidate.entity.type === 'tv' ? <Tv className="w-3.5 h-3.5" /> :
                          candidate.entity.type === 'book' ? <BookOpen className="w-3.5 h-3.5" /> :
                          <Film className="w-3.5 h-3.5" />;

                        const artwork = store.artworkCache[candidate.entity.id];
                        const avail = store.availabilityCache[candidate.entity.id];
                        const isMusic = candidate.entity.type === 'music';
                        const hasSubMatch = matchesSubscription(avail, store.subscriptions);

                        return (
                          <div
                            key={idx}
                            className="flex flex-col justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/40 hover:bg-white/[0.04] transition-all space-y-4 group shadow-lg"
                          >
                            <div className="space-y-3">
                              {/* Artwork Poster / Cover Container */}
                              <div className={`relative w-full ${isMusic ? 'aspect-square' : 'aspect-[2/3]'} max-h-64 rounded-xl overflow-hidden bg-black/40 border border-white/[0.08] shadow-inner`}>
                                {artwork?.url ? (
                                  <img
                                    src={artwork.url}
                                    alt={candidate.entity.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%231a102f"/><text x="150" y="225" font-family="sans-serif" font-size="16" fill="%23a855f7" text-anchor="middle">${encodeURIComponent(candidate.entity.name)}</text></svg>`;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full animate-pulse bg-white/[0.04] flex flex-col items-center justify-center gap-2 text-zinc-500">
                                    <div className="p-3 rounded-full bg-white/[0.06]">
                                      {mediaIcon}
                                    </div>
                                    <span className="text-[10px] font-mono">Loading Artwork...</span>
                                  </div>
                                )}

                                {/* Artwork Source Badge */}
                                {artwork && (
                                  <span className="absolute top-2 right-2 text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-black/75 text-zinc-300 backdrop-blur-md border border-white/10 uppercase">
                                    {artwork.source}
                                  </span>
                                )}

                                {/* User Subscription Match Indicator */}
                                {hasSubMatch && (
                                  <span className="absolute top-2 left-2 text-[9px] font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1 shadow-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    Subscribed
                                  </span>
                                )}
                              </div>

                              {/* Card Metadata Bar */}
                              <div className="flex items-start justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] text-[11px] font-semibold text-zinc-200 capitalize">
                                  {mediaIcon}
                                  {candidate.entity.type}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    {(candidate.qlooAffinity * 100).toFixed(0)}% Taste
                                  </span>
                                  <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                                    Lvl {candidate.difficultyScore}/10
                                  </span>
                                </div>
                              </div>

                              {/* Title & Creator */}
                              <div>
                                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                                  {candidate.entity.name}
                                </h3>
                                {candidate.entity.creator && (
                                  <p className="text-xs text-zinc-400 mt-0.5">
                                    by {candidate.entity.creator}
                                  </p>
                                )}
                              </div>

                              {/* Description if available */}
                              {candidate.entity.description && (
                                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                                  {candidate.entity.description}
                                </p>
                              )}

                              {/* "Why Qloo matched this" Taste connection callout */}
                              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs">
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                                  ⚡ Qloo Taste Graph Bridge
                                </span>
                                <p className="text-zinc-300 text-[11px] leading-relaxed">
                                  {candidate.tasteConnectionReason}
                                </p>
                              </div>

                              {/* Linguistic & Difficulty Justification */}
                              <div className="text-[11px] text-zinc-400 space-y-1">
                                <span className="text-zinc-500 font-medium">Linguistic Fit:</span>
                                <p className="italic text-zinc-300">
                                  "{candidate.difficultyKeyNote}"
                                </p>
                              </div>

                              {/* Where to Watch / Read / Listen Availability */}
                              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Where to {candidate.entity.type === 'book' ? 'Read' : candidate.entity.type === 'music' ? 'Listen' : 'Watch'} ({store.region})</span>
                                  </span>
                                </div>

                                {avail ? (
                                  <div className="space-y-2">
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
                                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-center justify-between gap-2">
                                            <span className="italic">Not available in {store.region}</span>
                                            <a
                                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(candidate.entity.name + ' trailer')}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[10px] text-purple-300 hover:text-white underline flex items-center gap-1 font-semibold"
                                            >
                                              Trailer <ExternalLink className="w-3 h-3" />
                                            </a>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="space-y-1.5">
                                          {primaryLinks.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                                {candidate.entity.type === 'book' ? 'Read' : candidate.entity.type === 'music' ? 'Listen' : 'Stream'}
                                              </span>
                                              {primaryLinks.slice(0, 4).map((link, lIdx) => (
                                                <a
                                                  key={lIdx}
                                                  href={link.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title={`${link.platformName} · ${link.tier === 1 ? 'Direct Deep Link' : link.tier === 2 ? 'Watch Provider Page' : 'Search'}`}
                                                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-purple-600/30 hover:border-purple-500/50 border border-white/[0.08] transition-all flex items-center gap-1.5 text-[11px] text-zinc-200 hover:text-white group/btn"
                                                >
                                                  {link.logoPath && link.logoPath.startsWith('/') ? (
                                                    <img
                                                      src={`https://image.tmdb.org/t/p/w92${link.logoPath}`}
                                                      alt={link.platformName}
                                                      className="w-4 h-4 rounded object-cover"
                                                      onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                      }}
                                                    />
                                                  ) : (
                                                    getPlatformIcon(link.platformId, link.platformName, { size: 16 })
                                                  )}
                                                  <span className="text-[10px] font-medium">{link.platformName}</span>
                                                  <ExternalLink className="w-2.5 h-2.5 text-zinc-400 group-hover/btn:text-purple-300" />
                                                </a>
                                              ))}
                                            </div>
                                          )}

                                          {rentBuyLinks.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                                Rent / Buy
                                              </span>
                                              {rentBuyLinks.slice(0, 3).map((link, lIdx) => (
                                                <a
                                                  key={lIdx}
                                                  href={link.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  title={`${link.platformName} (${link.category})`}
                                                  className="p-1 rounded-lg bg-white/[0.03] hover:bg-amber-600/20 border border-white/[0.06] transition-all flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white"
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
                                                    getPlatformIcon(link.platformId, link.platformName, { size: 14 })
                                                  )}
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
                                  <div className="h-6 animate-pulse bg-white/[0.04] rounded-lg" />
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Interactive Feedback Buttons */}
                            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                              <span className="text-[10px] text-zinc-500">
                                Calibrate agent:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleFeedback(candidate, 'thumbs_up')}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-emerald-500/20 hover:text-emerald-400 text-zinc-400 transition-colors"
                                  title="Matches my taste (boosts affinity)"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(candidate, 'thumbs_down')}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 hover:text-red-400 text-zinc-400 transition-colors"
                                  title="Not for me (removes item)"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleFeedback(candidate, 'thumbs_up', 'too_hard')}
                                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-amber-500/20 hover:text-amber-400 text-zinc-400 text-[10px] transition-colors"
                                  title="Too hard for my level"
                                >
                                  Too Hard
                                </button>
                                <button
                                  onClick={() => handleFeedback(candidate, 'thumbs_up', 'too_easy')}
                                  className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-blue-500/20 hover:text-blue-400 text-zinc-400 text-[10px] transition-colors"
                                  title="Too easy for my level"
                                >
                                  Too Easy
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* STRUCTURED 7-DAY IMMERSION CALENDAR */}
                  {store.weeklyPlan && (
                    <section className="space-y-4 pt-6 border-t border-white/[0.08]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-emerald-400" />
                              Week {store.weeklyPlan.week} Immersion Schedule
                            </h2>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-md border border-emerald-500/30">
                              {store.weeklyPlan.totalMinutes} min scheduled
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Balanced across media types with pre-teach vocabulary and active learning tasks
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {store.weeklyPlan.sessions.map((session, idx) => {
                          const sessionArtwork = store.artworkCache[session.content.entity.id];
                          const sessionAvail = store.availabilityCache[session.content.entity.id];
                          const topPlatform = sessionAvail?.streams?.[0] || sessionAvail?.reads?.[0] || sessionAvail?.listens?.[0] || sessionAvail?.rents?.[0] || null;

                          return (
                            <div
                              key={idx}
                              className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-md"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                                    {session.day}
                                  </span>
                                  <span className="text-[11px] font-mono bg-white/[0.06] text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-purple-400" />
                                    {session.durationMinutes}m
                                  </span>
                                </div>

                                {/* Poster & Title Header */}
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/40 border border-white/[0.08] shrink-0">
                                    {sessionArtwork?.url ? (
                                      <img
                                        src={sessionArtwork.url}
                                        alt={session.content.entity.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%231a102f"/></svg>`;
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                                        <Film className="w-4 h-4 text-zinc-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-bold text-white truncate">
                                      {session.content.entity.name}
                                    </h4>
                                    <span className="text-[10px] text-zinc-400 capitalize block">
                                      {session.mediaType} · Level {session.content.difficultyScore}/10
                                    </span>
                                  </div>
                                </div>

                                {/* Exact Platform to Open */}
                                {topPlatform ? (
                                  <a
                                    href={topPlatform.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/30 text-xs font-semibold text-purple-200 hover:text-white transition-all flex items-center justify-between group"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {topPlatform.logoPath && topPlatform.logoPath.startsWith('/') ? (
                                        <img
                                          src={`https://image.tmdb.org/t/p/w92${topPlatform.logoPath}`}
                                          alt={topPlatform.platformName}
                                          className="w-4 h-4 rounded object-cover shrink-0"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        getPlatformIcon(topPlatform.platformId, topPlatform.platformName, { size: 16 })
                                      )}
                                      <span className="truncate">Open on {topPlatform.platformName}</span>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-purple-400 group-hover:text-purple-200 shrink-0 ml-1" />
                                  </a>
                                ) : (
                                  <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(session.content.entity.name + ' ' + session.mediaType)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full px-2.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-[11px] text-zinc-400 hover:text-white transition-all flex items-center justify-between"
                                  >
                                    <span>Search Online</span>
                                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                                  </a>
                                )}

                                <div className="text-xs text-zinc-300 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Activity:</span>
                                  {session.activity}
                                </div>

                                {/* Pre-teach Vocabulary */}
                                {session.preTeachVocabulary && session.preTeachVocabulary.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                      Pre-Teach Vocabulary
                                    </span>
                                    <div className="space-y-1">
                                      {session.preTeachVocabulary.slice(0, 3).map((v, vIdx) => (
                                        <div
                                          key={vIdx}
                                          className="text-[11px] p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/10 flex items-center justify-between"
                                        >
                                          <span className="font-semibold text-emerald-200">{v.word}</span>
                                          <span className="text-zinc-400 text-[10px]">{v.translation}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Active Task */}
                                <div className="text-xs text-purple-300 bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/20">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase block mb-1">Active Challenge:</span>
                                  {session.activeTask}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                </section>
              )}

            </div>
          )}

          {/* TAB 2: QLOO VS. GENERIC LLM SIDE-BY-SIDE BENCHMARK */}
          {activeTab === 'comparison' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/20 to-black border border-purple-500/30 backdrop-blur-xl">
                <div className="max-w-3xl space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    Judging Benchmark · Why Qloo is Indispensable
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    Qloo Taste Graph vs. Generic LLM Recommendations
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Without Qloo's cultural taste graph, generic LLMs fall back on the most statistically common, clichéd recommendations (e.g. recommending "Despacito" to every Spanish learner or "Doraemon" to every Japanese learner). Qloo uncovers authentic cross-domain cultural peers that match the user's specific aesthetic DNA.
                  </p>
                </div>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Generic LLM (The Problem) */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-red-500/20 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                          Generic LLM Baseline
                        </span>
                        <span className="text-[10px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded-full border border-red-500/20">
                          Un-grounded
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        Predictable Mainstream Clichés
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Recommends generic pop culture that fits standard prompt keywords, but lacks personal aesthetic nuance and cognitive sweet-spot calibration.
                  </p>

                  <div className="space-y-3">
                    {(store.llmComparison?.candidates || [
                      {
                        entity: { id: 'c1', name: 'Doraemon', type: 'tv' as MediaType, description: 'Child anime about robot cat' },
                        difficultyScore: 2,
                        tasteConnectionReason: 'Very popular children show recommended to all beginners',
                        qlooAffinity: 0.12,
                        compositeScore: 0.4,
                        difficultyKeyNote: 'Repetitive vocab for 6-year-olds; boring for adults',
                        difficultyJustification: 'Basic vocabulary',
                      },
                      {
                        entity: { id: 'c2', name: 'Demon Slayer', type: 'tv' as MediaType, description: 'Shonen battle anime' },
                        difficultyScore: 7,
                        tasteConnectionReason: 'Top anime on Netflix',
                        qlooAffinity: 0.45,
                        compositeScore: 0.48,
                        difficultyKeyNote: 'Screaming, historical dialect, samurai vocabulary',
                        difficultyJustification: 'Taisho period dialect',
                      },
                      {
                        entity: { id: 'c3', name: 'Hikaru Utada - First Love', type: 'music' as MediaType, description: '1999 J-Pop ballad' },
                        difficultyScore: 4,
                        tasteConnectionReason: 'The best-selling album in Japan',
                        qlooAffinity: 0.35,
                        compositeScore: 0.5,
                        difficultyKeyNote: 'Standard pop love ballad',
                        difficultyJustification: 'Standard pop lyrics',
                      },
                    ]).map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-red-950/10 border border-red-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{item.entity.name}</h4>
                          <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
                            No Taste Affinity Signal
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">{item.tasteConnectionReason}</p>
                        <div className="text-[11px] text-red-300 font-mono italic">
                          Issue: {item.difficultyKeyNote}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Qloo Taste Graph (The Solution) */}
                <div className="p-6 rounded-3xl bg-purple-950/20 border border-purple-500/40 space-y-4 shadow-xl shadow-purple-950/30">
                  <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                          Qloo Taste Graph Engine
                        </span>
                        <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Culturally Grounded
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        Cross-Domain Aesthetic Peer Matches
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Identifies the exact cultural counterparts in target media based on multidimensional mathematical affinities in music, cinema, and literature.
                  </p>

                  <div className="space-y-3">
                    {(store.candidates.slice(0, 3).length > 0 ? store.candidates.slice(0, 3) : [
                      {
                        entity: { id: 'q1', name: 'toe (Band)', type: 'music' as MediaType, creator: 'toe', description: 'Japanese math-rock' },
                        qlooAffinity: 0.95,
                        difficultyScore: 3,
                        tasteConnectionReason: 'Direct cultural counterpart to Radiohead & American Football: intricate rhythmic structures and melancholic indie textures.',
                        difficultyKeyNote: 'Minimal poetic repeated phrasing; accessible A2 grammar.',
                      },
                      {
                        entity: { id: 'q2', name: 'Serial Experiments Lain', type: 'tv' as MediaType, creator: 'Ryutaro Nakamura', description: 'Cyberpunk anime' },
                        qlooAffinity: 0.93,
                        difficultyScore: 4,
                        tasteConnectionReason: 'Matches Death Note’s cerebral tension and Radiohead’s dystopian alienation.',
                        difficultyKeyNote: 'Slow, measured cadence with long atmospheric pauses.',
                      },
                      {
                        entity: { id: 'q3', name: 'Cure (1997)', type: 'movie' as MediaType, creator: 'Kiyoshi Kurosawa', description: 'Psychological thriller' },
                        qlooAffinity: 0.91,
                        difficultyScore: 5,
                        tasteConnectionReason: 'Carries the cerebral cat-and-mouse psychology of Death Note with art-house stillness.',
                        difficultyKeyNote: 'Naturalistic Tokyo dialogue without rapid screaming.',
                      },
                    ]).map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-purple-200">{item.entity.name}</h4>
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold">
                            {(item.qlooAffinity * 100).toFixed(0)}% Qloo Affinity
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300">{item.tasteConnectionReason}</p>
                        <div className="text-[11px] text-emerald-300 font-mono">
                          ✓ Sweet-spot fit: {item.difficultyKeyNote}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TASTE GRAPH INSPECTOR */}
          {activeTab === 'inspector' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-purple-400" />
                      Qloo API & Endpoint Inspection
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Technical documentation of endpoints utilized by LinguaTaste
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Endpoint 1: Entity Resolution
                    </span>
                    <div className="font-mono text-xs text-emerald-400">
                      GET https://hackathon.api.qloo.com/search
                    </div>
                    <p className="text-xs text-zinc-400">
                      Resolves free-text user media seeds to canonical Qloo entity IDs with type filtering (`urn:entity:artist`, `urn:entity:movie`, `urn:entity:tv_show`, `urn:entity:book`).
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Endpoint 2: Cultural Recommendations
                    </span>
                    <div className="font-mono text-xs text-emerald-400">
                      GET https://hackathon.api.qloo.com/v2/insights
                    </div>
                    <p className="text-xs text-zinc-400">
                      Discovers cross-domain media by passing `signal.interests.entities` combined with geographic filters (`filter.release_country=JP,ES,FR,KR`) and `feature.explainability=true`.
                    </p>
                  </div>
                </div>

                {/* Agent Toolchain Architecture Diagram */}
                <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                    Agent Tool Chain Sequence
                  </span>
                  <div className="flex flex-col sm:flex-row items-center gap-2 text-xs font-mono">
                    <span className="p-2 rounded-lg bg-black/50 border border-purple-500/30 text-purple-200">1. search_entities</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90 sm:rotate-0" />
                    <span className="p-2 rounded-lg bg-black/50 border border-purple-500/30 text-purple-200">2. get_taste_profile</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90 sm:rotate-0" />
                    <span className="p-2 rounded-lg bg-black/50 border border-purple-500/30 text-purple-200">3. recommend_by_taste</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90 sm:rotate-0" />
                    <span className="p-2 rounded-lg bg-black/50 border border-purple-500/30 text-purple-200">4. estimate_difficulty</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500 rotate-90 sm:rotate-0" />
                    <span className="p-2 rounded-lg bg-black/50 border border-emerald-500/30 text-emerald-300">5. build_weekly_plan</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* AGENT LOG DRAWER / MODAL */}
        {showLogDrawer && (
          <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#0c0c14] border-l border-white/[0.1] z-50 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Agent Execution Log</h3>
                </div>
                <button
                  onClick={() => setShowLogDrawer(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="font-mono text-xs text-zinc-300 space-y-2 max-h-[70vh] overflow-y-auto p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
                {store.agentLog.length > 0 ? (
                  store.agentLog.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-500 italic">
                    No run logs yet. Run an analysis or pick a persona to see agent tool calls in real time.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] text-[11px] text-zinc-500">
              Qloo Agentic Tool Pipeline Active
            </div>
          </div>
        )}

        {/* Footer & Compliance Attributions */}
        <footer className="pt-8 pb-6 border-t border-white/[0.08] space-y-4 text-xs text-zinc-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-400">LinguaTaste</span>
              <span>·</span>
              <span>Taste-Matched Language Immersion powered by Qloo Cultural Taste Graph</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
              <span>Next.js 16 · Qloo V2 · Claude 3.5</span>
            </div>
          </div>

          {/* Required TMDB & JustWatch Compliance Attributions */}
          <div className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <TmdbLogoIcon size={14} className="shrink-0" />
              <span>
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-zinc-400">
                Streaming availability data provided by JustWatch
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
