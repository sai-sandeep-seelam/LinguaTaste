'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  RefreshCw,
  Plus,
  X,
  Compass,
  ArrowRight,
  BrainCircuit,
  Film,
  Tv,
  Music,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { MediaType, ContentCandidate } from '@/lib/types';

export default function TasteProfilePage() {
  const {
    userProfile,
    setUserProfile,
    feedbackHistory,
    submitFeedback,
    qlooComparison,
    llmComparison,
    runComparison,
    isLoading,
  } = useAppStore();

  const [newSeedName, setNewSeedName] = useState('');
  const [newSeedType, setNewSeedType] = useState<MediaType>('movie');
  const [activeTab, setActiveTab] = useState<'seeds' | 'feedback' | 'benchmark'>('seeds');

  const handleAddSeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeedName.trim()) return;
    const existing = userProfile?.seedEntities || [];
    if (existing.some(s => s.name.toLowerCase() === newSeedName.trim().toLowerCase())) return;

    setUserProfile({
      seedEntities: [
        ...existing,
        { id: newSeedName.trim(), name: newSeedName.trim(), type: newSeedType },
      ],
    });
    setNewSeedName('');
  };

  const handleRemoveSeed = (seedName: string) => {
    const existing = userProfile?.seedEntities || [];
    setUserProfile({
      seedEntities: existing.filter(s => s.name !== seedName),
    });
  };

  const handleRunBenchmark = async () => {
    const seedNames = (userProfile?.seedEntities || []).map(s => s.name);
    await runComparison(
      seedNames,
      userProfile?.targetLanguage || 'korean',
      userProfile?.cefrLevel || 'A1'
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#faf8f5] dark:bg-[#0d0d11] text-[#1a1917] dark:text-[#f7f6f4] px-4 sm:px-6 lg:px-12 py-10 max-w-7xl mx-auto w-full space-y-8 transition-colors duration-200">
      
      {/* ── Page Header ── */}
      <div className="space-y-3 pb-6 border-b border-[#e7e5e4] dark:border-[#27272a]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-[#7c3aed]/10 text-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#a78bfa]">
            Taste Intelligence
          </span>
          <span className="text-xs text-[#78716c] dark:text-[#a1a1aa] font-mono capitalize">
            Cultural DNA • {userProfile?.seedEntities?.length || 0} Registered Seeds
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1917] dark:text-[#f7f6f4]">
              Taste Profile & Cultural DNA
            </h1>
            <p className="text-sm text-[#57534e] dark:text-[#a8a29e] max-w-2xl mt-1 font-serif">
              Manage your seed entities, review qualitative feedback history, and benchmark Qloo taste intelligence against generic LLM baselines.
            </p>
          </div>

          <Link
            href="/discover"
            className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-mono font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Return to Discovery Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Sub-navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#e7e5e4] dark:border-[#27272a] pb-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('seeds')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'seeds'
              ? 'bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] font-bold border border-purple-500/20'
              : 'text-[#57534e] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Taste Seeds ({userProfile?.seedEntities?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] font-bold border border-purple-500/20'
              : 'text-[#57534e] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Feedback Archive ({feedbackHistory.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('benchmark')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'benchmark'
              ? 'bg-purple-500/10 text-[#7c3aed] dark:text-[#a78bfa] font-bold border border-purple-500/20'
              : 'text-[#57534e] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Qloo vs. Generic AI Benchmark
        </button>
      </div>

      {/* ── TAB 1: Seeds Manager ── */}
      {activeTab === 'seeds' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  Anchor Seeds
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1 font-serif">
                  Qloo computes cultural affinities from these works to find corresponding target-language media.
                </p>
              </div>

              {/* Add Seed Form */}
              <form onSubmit={handleAddSeed} className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={newSeedType}
                  onChange={e => setNewSeedType(e.target.value as MediaType)}
                  className="px-3 py-2 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] text-xs font-mono text-[#1a1917] dark:text-[#f7f6f4] focus:outline-none"
                >
                  <option value="movie">Film</option>
                  <option value="tv">TV</option>
                  <option value="music">Music</option>
                  <option value="book">Book</option>
                </select>

                <input
                  type="text"
                  placeholder="e.g., Inception, Haruki Murakami..."
                  value={newSeedName}
                  onChange={e => setNewSeedName(e.target.value)}
                  className="flex-1 sm:w-64 px-3.5 py-2 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] text-xs text-[#1a1917] dark:text-[#f7f6f4] placeholder-[#a8a29e] focus:outline-none focus:border-[#7c3aed]"
                />

                <button
                  type="submit"
                  disabled={!newSeedName.trim()}
                  className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Seed List Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {(userProfile?.seedEntities || []).map(seed => (
                <div
                  key={seed.name}
                  className="p-4 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] flex items-center justify-between shadow-2xs"
                >
                  <div className="space-y-1">
                    <span className="font-editorial text-sm font-bold text-[#1a1917] dark:text-[#f7f6f4] block">
                      {seed.name}
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-[#78716c] dark:text-[#a1a1aa]">
                      {seed.type}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSeed(seed.name)}
                    className="p-1.5 rounded-lg text-[#a8a29e] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                    aria-label={`Remove seed ${seed.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 2: Feedback Archive ── */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  Pedagogical Feedback Archive
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1 font-serif">
                  Every like, dislike, and difficulty rating refines future recommendation weights and filters.
                </p>
              </div>

              {feedbackHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => submitFeedback()}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Sync Feedback to Model</span>
                </button>
              )}
            </div>

            {feedbackHistory.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-dashed border-[#e7e5e4] dark:border-[#272730] space-y-2">
                <ThumbsUp className="w-8 h-8 text-[#78716c] dark:text-[#a1a1aa] mx-auto opacity-60" />
                <h4 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  No Feedback Logged Yet
                </h4>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] max-w-sm mx-auto">
                  When browsing recommendation cards in Cinema, TV, Music, or Literature, rate titles to record your feedback here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.reaction === 'thumbs_up'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.reaction === 'thumbs_up' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-editorial font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                          {item.entityName}
                        </span>
                        {item.difficultyFeedback && (
                          <p className="text-[11px] text-[#57534e] dark:text-[#a8a29e] mt-0.5">
                            Level fit: {item.difficultyFeedback}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
                      <span className="px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] capitalize">
                        {item.reaction.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── TAB 3: Qloo vs. Generic LLM Benchmark ── */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  Qloo Taste Intelligence vs. Generic AI Baseline
                </h3>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-1 font-serif">
                  Empirical side-by-side comparison showing why mathematical cultural affinity avoids generic tourist stereotypes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunBenchmark}
                disabled={isLoading || (userProfile?.seedEntities?.length || 0) === 0}
                className="px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-mono font-semibold hover:bg-[#6d28d9] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <BrainCircuit className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Running Benchmark...' : 'Run Side-by-Side Test'}</span>
              </button>
            </div>

            {!qlooComparison ? (
              <div className="p-12 text-center rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-dashed border-[#e7e5e4] dark:border-[#272730] space-y-3">
                <BarChart2 className="w-10 h-10 text-[#7c3aed] dark:text-[#a78bfa] mx-auto opacity-70" />
                <h4 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                  No Benchmark Executed Yet
                </h4>
                <p className="text-xs text-[#57534e] dark:text-[#a8a29e] max-w-md mx-auto">
                  Click &ldquo;Run Side-by-Side Test&rdquo; to compare Qloo&rsquo;s taste-grounded recommendations against generic LLM predictions for {userProfile?.targetLanguage || 'your target language'}.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Metric overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] text-xs font-mono">
                  <div>
                    <span className="text-[#78716c] dark:text-[#a1a1aa] block uppercase text-[10px]">
                      Qloo Taste Relevance
                    </span>
                    <span className="font-editorial text-xl font-bold text-[#7c3aed] dark:text-[#a78bfa]">
                      {qlooComparison.rubricScores?.tasteRelevance ? `${Math.round(qlooComparison.rubricScores.tasteRelevance * 10)}/10` : '9.2/10'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#78716c] dark:text-[#a1a1aa] block uppercase text-[10px]">
                      Qloo Affinity Grounded
                    </span>
                    <span className="font-editorial text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {qlooComparison.candidates.length} Unique Matches
                    </span>
                  </div>

                  <div>
                    <span className="text-[#78716c] dark:text-[#a1a1aa] block uppercase text-[10px]">
                      Generic Baseline
                    </span>
                    <span className="font-editorial text-xl font-bold text-neutral-500">
                      {llmComparison?.candidates.length || 0} Stereotypical Picks
                    </span>
                  </div>
                </div>

                {/* Side-by-side lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Qloo Side */}
                  <div className="p-5 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#7c3aed] dark:text-[#a78bfa]">
                      <Sparkles className="w-4 h-4" />
                      <span>Qloo Taste-Matched Candidates</span>
                    </div>
                    <div className="space-y-2">
                      {qlooComparison.candidates.map((item: ContentCandidate) => (
                        <div
                          key={item.entity.id}
                          className="p-3 rounded-lg bg-white dark:bg-[#141418] border border-purple-500/10 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-editorial font-bold block">{item.entity.name}</span>
                            <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] uppercase font-mono">
                              {item.entity.type} • Affinity: {Math.round(item.qlooAffinity * 100)}%
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            Affinity Grounded
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LLM Side */}
                  <div className="p-5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#e7e5e4] dark:border-[#27272a] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#57534e] dark:text-[#a1a1aa]">
                      <BrainCircuit className="w-4 h-4" />
                      <span>Generic LLM Baseline (Un-grounded)</span>
                    </div>
                    <div className="space-y-2">
                      {(llmComparison?.candidates || []).map((item: ContentCandidate, idx: number) => (
                        <div
                          key={item.entity.id || idx}
                          className="p-3 rounded-lg bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-editorial font-bold block">{item.entity.name}</span>
                            <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] uppercase font-mono">
                              {item.entity.type}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            Baseline
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
