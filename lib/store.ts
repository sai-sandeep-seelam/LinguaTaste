'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AgentState,
  UserProfile,
  TasteProfile,
  ContentCandidate,
  WeeklyPlan,
  FeedbackItem,
  LanguageCode,
  CEFRLevel,
  MediaType,
  ComparisonResult,
} from '@/lib/types';
import type { ArtworkResult } from '@/lib/artwork';
import type { AvailabilityResult } from '@/lib/availability';

// SUBSCRIPTION_PLATFORMS: canonical list of subscription services for the filter UI
export const SUBSCRIPTION_PLATFORMS = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'prime', name: 'Prime Video' },
  { id: 'disney', name: 'Disney+' },
  { id: 'hulu', name: 'Hulu' },
  { id: 'max', name: 'Max' },
  { id: 'apple_tv', name: 'Apple TV+' },
  { id: 'spotify', name: 'Spotify' },
  { id: 'apple_music', name: 'Apple Music' },
  { id: 'youtube_premium', name: 'YouTube Premium' },
] as const;

export type SubscriptionPlatformId = typeof SUBSCRIPTION_PLATFORMS[number]['id'];

interface AppStore extends AgentState {
  // Actions
  setStep: (step: AgentState['currentStep']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Onboarding
  setUserProfile: (profile: Partial<UserProfile>) => void;

  // Region & subscriptions
  region: string;              // ISO 3166-1 alpha-2, default from browser locale
  setRegion: (region: string) => void;
  subscriptions: SubscriptionPlatformId[];  // platforms the user has
  toggleSubscription: (id: SubscriptionPlatformId) => void;

  // Artwork cache
  artworkCache: Record<string, ArtworkResult>;  // entityId -> ArtworkResult
  setArtwork: (entityId: string, result: ArtworkResult) => void;
  loadArtworkForCandidates: () => Promise<void>;

  // Availability cache
  availabilityCache: Record<string, AvailabilityResult>;  // entityId -> AvailabilityResult
  setAvailability: (entityId: string, result: AvailabilityResult) => void;
  loadAvailabilityForCandidates: () => Promise<void>;

  // Analysis pipeline
  runAnalysis: (seedNames: string[], language: LanguageCode, level: CEFRLevel, mediaTypes: MediaType[]) => Promise<void>;

  // Plan
  generatePlan: (weekNumber?: number) => Promise<void>;

  // Feedback
  addFeedback: (feedback: FeedbackItem) => void;
  submitFeedback: () => Promise<void>;

  // Comparison
  runComparison: (seedNames: string[], language: LanguageCode, level: CEFRLevel) => Promise<void>;

  // Agent log
  agentLog: string[];

  // Reset
  reset: () => void;
}

const initialState: AgentState & {
  agentLog: string[];
  region: string;
  subscriptions: SubscriptionPlatformId[];
  artworkCache: Record<string, ArtworkResult>;
  availabilityCache: Record<string, AvailabilityResult>;
} = {
  userProfile: null,
  tasteProfile: null,
  candidates: [],
  weeklyPlan: null,
  feedbackHistory: [],
  qlooComparison: null,
  llmComparison: null,
  currentStep: 'onboarding',
  isLoading: false,
  error: null,
  agentLog: [],
  region: 'US',
  subscriptions: [],
  artworkCache: {},
  availabilityCache: {},
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Region
      setRegion: (region) => {
        set({ region, availabilityCache: {} });
        get().loadAvailabilityForCandidates();
      },

      // Subscriptions
      toggleSubscription: (id) => set(state => ({
        subscriptions: state.subscriptions.includes(id)
          ? state.subscriptions.filter(s => s !== id)
          : [...state.subscriptions, id],
      })),

      // Artwork
      setArtwork: (entityId, result) => set(state => ({
        artworkCache: { ...state.artworkCache, [entityId]: result },
      })),

      loadArtworkForCandidates: async () => {
        const { candidates, artworkCache } = get();
        const missing = candidates.filter(c => !artworkCache[c.entity.id]);
        if (missing.length === 0) return;

        try {
          const res = await fetch('/api/artwork', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: missing.map(c => ({
                entityId: c.entity.id,
                title: c.entity.name,
                mediaType: c.entity.type,
                year: c.entity.year,
                creator: c.entity.creator,
                qlooImageUrl: c.entity.imageUrl,
              })),
            }),
          });
          if (!res.ok) return;
          const data = await res.json() as { results: Record<string, ArtworkResult> };
          set(state => ({
            artworkCache: { ...state.artworkCache, ...data.results },
          }));
        } catch { /* artwork failure is non-critical */ }
      },

      // Availability
      setAvailability: (entityId, result) => set(state => ({
        availabilityCache: { ...state.availabilityCache, [entityId]: result },
      })),

      loadAvailabilityForCandidates: async () => {
        const { candidates, availabilityCache, region } = get();
        const missing = candidates.filter(c => !availabilityCache[c.entity.id]);
        if (missing.length === 0) return;

        try {
          const res = await fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: missing.map(c => ({
                entityId: c.entity.id,
                title: c.entity.name,
                mediaType: c.entity.type,
                creator: c.entity.creator,
                country: region,
              })),
            }),
          });
          if (!res.ok) return;
          const data = await res.json() as { results: Record<string, AvailabilityResult> };
          set(state => ({
            availabilityCache: { ...state.availabilityCache, ...data.results },
          }));
        } catch { /* availability failure is non-critical */ }
      },

      setUserProfile: (profileUpdate) => {
        const current = get().userProfile;
        set({
          userProfile: {
            id: current?.id || `user-${Date.now()}`,
            targetLanguage: 'japanese',
            cefrLevel: 'A1',
            weeklyHours: 5,
            seedEntities: [],
            createdAt: current?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...current,
            ...profileUpdate,
          },
        });
      },

      runAnalysis: async (seedNames, language, level, mediaTypes) => {
        set({ isLoading: true, error: null, agentLog: [] });
        
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seedNames, targetLanguage: language, cefrLevel: level, mediaTypes }),
          });

          const data = await res.json() as {
            error?: string;
            entityIds?: string[];
            resolvedEntities?: Array<{ name: string; id: string; type: string }>;
            tasteProfile?: TasteProfile;
            candidates?: ContentCandidate[];
            agentLog?: string[];
          };

          if (!res.ok || data.error) {
            throw new Error(data.error || 'Analysis failed');
          }

          set({
            tasteProfile: data.tasteProfile || null,
            candidates: data.candidates || [],
            agentLog: data.agentLog || [],
            currentStep: 'taste_profile',
            isLoading: false,
          });

          // Trigger artwork & availability resolution in background
          get().loadArtworkForCandidates();
          get().loadAvailabilityForCandidates();

        } catch (err) {
          const message = err instanceof Error ? err.message : 'Analysis failed';
          set({ error: message, isLoading: false });
        }
      },

      generatePlan: async (weekNumber = 1) => {
        const { candidates, userProfile } = get();
        if (!userProfile || candidates.length === 0) return;

        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidates,
              targetLanguage: userProfile.targetLanguage,
              cefrLevel: userProfile.cefrLevel,
              weeklyHours: userProfile.weeklyHours,
              weekNumber,
            }),
          });

          const data = await res.json() as { plan?: WeeklyPlan; error?: string };

          if (!res.ok || data.error) throw new Error(data.error || 'Plan generation failed');

          set({ weeklyPlan: data.plan || null, currentStep: 'weekly_plan', isLoading: false });

        } catch (err) {
          const message = err instanceof Error ? err.message : 'Plan generation failed';
          set({ error: message, isLoading: false });
        }
      },

      addFeedback: (feedback) => {
        set(state => ({
          feedbackHistory: [
            ...state.feedbackHistory.filter(f => f.entityId !== feedback.entityId),
            feedback,
          ],
        }));
      },

      submitFeedback: async () => {
        const { feedbackHistory, candidates } = get();
        if (feedbackHistory.length === 0) return;

        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: feedbackHistory, candidates }),
          });

          const data = await res.json() as { adjustedCandidates?: ContentCandidate[]; error?: string };

          if (!res.ok || data.error) throw new Error(data.error || 'Feedback failed');

          set({
            candidates: data.adjustedCandidates || candidates,
            isLoading: false,
          });

          // Re-generate plan with adjusted candidates
          await get().generatePlan((get().weeklyPlan?.week || 0) + 1);

        } catch (err) {
          const message = err instanceof Error ? err.message : 'Feedback failed';
          set({ error: message, isLoading: false });
        }
      },

      runComparison: async (seedNames, language, level) => {
        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              seedNames,
              targetLanguage: language,
              cefrLevel: level,
              mediaTypes: ['movie', 'tv', 'music', 'book'],
            }),
          });

          const data = await res.json() as {
            qloo?: { candidates: ContentCandidate[]; generatedAt: string };
            llm?: { candidates: ContentCandidate[]; generatedAt: string };
            error?: string;
          };

          if (!res.ok || data.error) throw new Error(data.error || 'Comparison failed');

          set({
            qlooComparison: data.qloo
              ? { mode: 'qloo', candidates: data.qloo.candidates, generatedAt: data.qloo.generatedAt }
              : null,
            llmComparison: data.llm
              ? { mode: 'llm_only', candidates: data.llm.candidates, generatedAt: data.llm.generatedAt }
              : null,
            isLoading: false,
          });

        } catch (err) {
          const message = err instanceof Error ? err.message : 'Comparison failed';
          set({ error: message, isLoading: false });
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'taste-immersion-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        tasteProfile: state.tasteProfile,
        candidates: state.candidates,
        weeklyPlan: state.weeklyPlan,
        feedbackHistory: state.feedbackHistory,
        currentStep: state.currentStep,
        region: state.region,
        subscriptions: state.subscriptions,
        artworkCache: state.artworkCache,
        availabilityCache: state.availabilityCache,
      }),
    }
  )
);
