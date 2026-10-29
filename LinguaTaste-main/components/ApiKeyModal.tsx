'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Zap,
  ExternalLink,
  Film,
  Sparkles,
} from 'lucide-react';

interface DiagnosticReport {
  timestamp: string;
  status: 'healthy' | 'partial_or_simulated';
  environment: {
    QLOO_API_KEY: { configured: boolean; length: number; formatHint: string };
    QLOO_BASE_URL: string;
    TMDB_CREDENTIAL: { configured: boolean; detectedType: string; tokenLength: number; formatHint: string };
    GEMINI_API_KEY?: { configured: boolean; model: string; formatHint: string };
    ANTHROPIC_API_KEY: { configured: boolean; status: string };
  };
  qloo: {
    endpoint: string;
    configured: boolean;
    search: {
      testedEndpoint: string;
      status: number;
      source: 'live' | 'cache' | 'simulated';
      success: boolean;
      usableEntitiesCount: number;
      sampleEntity?: string | null;
      error?: string | null;
    };
    insights: {
      testedEndpoint: string;
      status: number;
      source: 'live' | 'cache' | 'simulated';
      success: boolean;
      usableResultsCount: number;
      sampleCandidate?: string | null;
      error?: string | null;
    };
  };
  tmdb: {
    configured: boolean;
    authType: string;
    authenticated: boolean;
    status: number;
    sampleResult?: string | null;
    error?: string | null;
  };
  gemini?: {
    configured: boolean;
    model: string;
    status: string;
  };
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (isLive: boolean) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onStatusChange }: ApiKeyModalProps) {
  const [qlooKey, setQlooKey] = useState('');
  const [qlooBaseUrl, setQlooBaseUrl] = useState('https://hackathon.api.qloo.com');
  const [tmdbKey, setTmdbKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [saveToEnv, setSaveToEnv] = useState(true);

  const [showQloo, setShowQloo] = useState(false);
  const [showTmdb, setShowTmdb] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch current diagnostics on open
  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/diagnostics');
      if (res.ok) {
        const data = await res.json() as DiagnosticReport;
        setDiagnostics(data);
        if (data.qloo.endpoint) {
          setQlooBaseUrl(data.qloo.endpoint);
        }
        if (onStatusChange) {
          onStatusChange(data.qloo.search.success);
        }
      }
    } catch (err) {
      console.error('Failed to fetch diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAndSave = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const payload: Record<string, unknown> = {
        saveToEnv,
      };

      if (qlooKey.trim()) payload.qlooApiKey = qlooKey.trim();
      if (qlooBaseUrl.trim()) payload.qlooBaseUrl = qlooBaseUrl.trim();
      if (tmdbKey.trim()) payload.tmdbApiKey = tmdbKey.trim();
      if (geminiKey.trim()) payload.geminiApiKey = geminiKey.trim();
      if (anthropicKey.trim()) payload.anthropicApiKey = anthropicKey.trim();

      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Diagnostics request failed (HTTP ${res.status})`);
      }

      const data = await res.json() as DiagnosticReport & { savedToEnv?: boolean };
      setDiagnostics(data);

      const isLive = data.qloo.search.success;
      if (onStatusChange) {
        onStatusChange(isLive);
      }

      if (isLive) {
        setStatusMessage(
          data.savedToEnv
            ? '✓ Qloo Cultural Taste Graph connected & verified! Saved to .env.local.'
            : '✓ Qloo Cultural Taste Graph connected & verified live for current session!'
        );
      } else if (data.qloo.configured) {
        setStatusMessage(`⚠ Qloo key provided, but endpoint returned status ${data.qloo.search.status}: ${data.qloo.search.error || 'Check key validity'}`);
      } else {
        setStatusMessage('✓ Running in high-fidelity simulated demo mode. All flows remain interactive!');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setStatusMessage(`✗ Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isQlooLive = diagnostics?.qloo.search.success ?? false;
  const isTmdbLive = diagnostics?.tmdb.authenticated ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] p-6 sm:p-8 shadow-2xl text-[#1a1917] dark:text-[#f7f6f4] space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e7e5e4] dark:border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[#7c3aed] dark:text-[#a78bfa]">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-editorial text-[#1a1917] dark:text-[#f7f6f4]">API Keys & Live Diagnostics</h2>
                {isQlooLive ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE QLOO CONNECTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    DEMO SIMULATION ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-0.5">
                Configure live cultural discovery and media providers, or test credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Overview Banner */}
        <div className={`p-4 rounded-2xl border ${
          isQlooLive
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-xs">
              {isQlooLive ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              <span>{isQlooLive ? 'Qloo Cultural Taste Graph Active' : 'Offline / Demonstration Mode Active'}</span>
            </div>
            <button
              onClick={fetchDiagnostics}
              disabled={isLoading}
              className="text-[11px] underline text-[#57534e] hover:text-[#1a1917] dark:text-[#a8a29e] dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed font-serif">
            {isQlooLive
              ? 'Real-time requests to the Qloo Cultural Taste Graph are active. Entity resolution and cross-domain recommendations are fetched directly from live endpoints.'
              : 'No live Qloo API key is currently detected. LinguaTaste automatically provides rich, high-fidelity cultural taste fallback data and SVG posters so you can explore every single flow!'}
          </p>
        </div>

        {/* Status Message if test was run */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-[#7c3aed] dark:text-[#a78bfa]">
            {statusMessage}
          </div>
        )}

        {/* Credentials Form */}
        <div className="space-y-4">
          
          {/* Qloo API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a78bfa]" />
                <span>Qloo API Key</span>
                <span className="text-[10px] text-[#7c3aed] dark:text-[#a78bfa] font-mono">(Required for live discovery)</span>
              </label>
              <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
                {diagnostics?.environment.QLOO_API_KEY.configured ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">Configured ({diagnostics.environment.QLOO_API_KEY.formatHint})</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">Not set</span>
                )}
              </span>
            </div>
            <div className="relative">
              <input
                type={showQloo ? 'text' : 'password'}
                placeholder="Enter Qloo API Key..."
                value={qlooKey}
                onChange={e => setQlooKey(e.target.value)}
                className="w-full pr-10 pl-3.5 py-2.5 bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] rounded-xl text-xs text-[#1a1917] dark:text-[#f7f6f4] placeholder-[#a8a29e] focus:outline-none focus:border-[#7c3aed] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowQloo(!showQloo)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-white"
              >
                {showQloo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Base URL selector */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-[#78716c] dark:text-[#a1a1aa]">
              <span>Endpoint:</span>
              <button
                type="button"
                onClick={() => setQlooBaseUrl('https://hackathon.api.qloo.com')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                  qlooBaseUrl === 'https://hackathon.api.qloo.com'
                    ? 'bg-purple-500/15 border-purple-500/40 text-[#7c3aed] dark:text-[#a78bfa] font-bold'
                    : 'bg-black/5 dark:bg-white/5 border-transparent text-[#78716c] dark:text-[#a1a1aa]'
                }`}
              >
                hackathon.api.qloo.com
              </button>
              <button
                type="button"
                onClick={() => setQlooBaseUrl('https://api.qloo.com')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                  qlooBaseUrl === 'https://api.qloo.com'
                    ? 'bg-purple-500/15 border-purple-500/40 text-[#7c3aed] dark:text-[#a78bfa] font-bold'
                    : 'bg-black/5 dark:bg-white/5 border-transparent text-[#78716c] dark:text-[#a1a1aa]'
                }`}
              >
                api.qloo.com
              </button>
            </div>
          </div>

          {/* TMDB API Key / Read Access Token */}
          <div className="space-y-1.5 pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-blue-500" />
                <span>TMDB Read Access Token (v4 Bearer) or API Key (v3)</span>
                <span className="text-[10px] text-blue-500 font-mono">(Recommended for posters)</span>
              </label>
              <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
                {diagnostics?.environment.TMDB_CREDENTIAL.configured ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {diagnostics.environment.TMDB_CREDENTIAL.detectedType.toUpperCase()} ({diagnostics.environment.TMDB_CREDENTIAL.formatHint})
                  </span>
                ) : (
                  <span className="text-[#a8a29e]">Optional (Open Library & Deezer active)</span>
                )}
              </span>
            </div>
            <div className="relative">
              <input
                type={showTmdb ? 'text' : 'password'}
                placeholder="eyJ... (v4 Bearer Token) or 32-char v3 API key"
                value={tmdbKey}
                onChange={e => setTmdbKey(e.target.value)}
                className="w-full pr-10 pl-3.5 py-2.5 bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] rounded-xl text-xs text-[#1a1917] dark:text-[#f7f6f4] placeholder-[#a8a29e] focus:outline-none focus:border-[#7c3aed] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowTmdb(!showTmdb)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-white"
              >
                {showTmdb ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5 pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Google Gemini API Key (Taste Intelligence & Reasoning)</span>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">(gemini-2.5-flash)</span>
              </label>
              <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
                {diagnostics?.environment.GEMINI_API_KEY?.configured ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    Configured ({diagnostics.environment.GEMINI_API_KEY.formatHint})
                  </span>
                ) : (
                  <span className="text-[#a8a29e]">Heuristic reasoning fallback active</span>
                )}
              </span>
            </div>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                placeholder="AIzaSy... (Google Gemini API Key)"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                className="w-full pr-10 pl-3.5 py-2.5 bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] rounded-xl text-xs text-[#1a1917] dark:text-[#f7f6f4] placeholder-[#a8a29e] focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-white"
              >
                {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Anthropic API Key */}
          <div className="space-y-1.5 pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Anthropic API Key (Claude 3.5 Sonnet / Haiku)</span>
                <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] font-mono">(Optional)</span>
              </label>
              <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa]">
                {diagnostics?.environment.ANTHROPIC_API_KEY.configured ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">Configured</span>
                ) : (
                  <span className="text-[#a8a29e]">Using built-in pedagogical heuristics</span>
                )}
              </span>
            </div>
            <div className="relative">
              <input
                type={showAnthropic ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                className="w-full pr-10 pl-3.5 py-2.5 bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] rounded-xl text-xs text-[#1a1917] dark:text-[#f7f6f4] placeholder-[#a8a29e] focus:outline-none focus:border-[#7c3aed] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-white"
              >
                {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Save to .env.local Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="saveToEnvCheckbox"
              checked={saveToEnv}
              onChange={e => setSaveToEnv(e.target.checked)}
              className="rounded bg-[#faf8f5] dark:bg-[#1a1a22] border-[#e7e5e4] dark:border-[#272730] text-[#7c3aed] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="saveToEnvCheckbox" className="text-xs text-[#57534e] dark:text-[#a8a29e] cursor-pointer select-none">
              Save changes to <code className="text-[#7c3aed] dark:text-[#a78bfa] font-mono">.env.local</code> on disk (persists across server restarts)
            </label>
          </div>
        </div>

        {/* Live Endpoint Diagnostic Details */}
        {diagnostics && (
          <div className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] space-y-3">
            <span className="text-[10px] font-bold text-[#78716c] dark:text-[#a1a1aa] uppercase tracking-wider block">
              Live Diagnostic Probe Results
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a]">
                <div className="flex items-center justify-between text-[#78716c] dark:text-[#a1a1aa]">
                  <span>Qloo /search:</span>
                  <span className={diagnostics.qloo.search.success ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400'}>
                    HTTP {diagnostics.qloo.search.status} ({diagnostics.qloo.search.source})
                  </span>
                </div>
                <div className="text-[11px] text-[#1a1917] dark:text-[#f7f6f4] truncate mt-1">
                  Sample: {diagnostics.qloo.search.sampleEntity || 'N/A'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a]">
                <div className="flex items-center justify-between text-[#78716c] dark:text-[#a1a1aa]">
                  <span>Qloo /v2/insights:</span>
                  <span className={diagnostics.qloo.insights.success ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400'}>
                    HTTP {diagnostics.qloo.insights.status} ({diagnostics.qloo.insights.source})
                  </span>
                </div>
                <div className="text-[11px] text-[#1a1917] dark:text-[#f7f6f4] truncate mt-1">
                  Results: {diagnostics.qloo.insights.usableResultsCount} items
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] sm:col-span-2">
                <div className="flex items-center justify-between text-[#78716c] dark:text-[#a1a1aa]">
                  <span>TMDB Auth:</span>
                  <span className={diagnostics.tmdb.authenticated ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#a8a29e]'}>
                    {diagnostics.tmdb.authenticated ? `Authenticated (${diagnostics.tmdb.authType})` : 'Not Configured'}
                  </span>
                </div>
                {diagnostics.tmdb.sampleResult && (
                  <div className="text-[11px] text-[#1a1917] dark:text-[#f7f6f4] truncate mt-1">
                    Sample Match: {diagnostics.tmdb.sampleResult}
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] sm:col-span-2">
                <div className="flex items-center justify-between text-[#78716c] dark:text-[#a1a1aa]">
                  <span>Gemini Reasoning:</span>
                  <span className={diagnostics.gemini?.configured ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-[#a8a29e]'}>
                    {diagnostics.gemini?.configured ? `Connected (${diagnostics.gemini.model})` : 'Offline Heuristics Active'}
                  </span>
                </div>
                <div className="text-[11px] text-[#1a1917] dark:text-[#f7f6f4] truncate mt-1">
                  Status: {diagnostics.gemini?.status || 'deterministic_fallbacks_active'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e7e5e4] dark:border-[#27272a]">
          <span className="text-[11px] text-[#78716c] dark:text-[#a1a1aa] flex items-center gap-1 font-serif">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Keys are stored securely server-side and never exposed to the client bundle
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4] transition-all flex-1 sm:flex-none cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleTestAndSave}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Testing Live Connection...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  Test & Apply Keys
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
