// Types for the Taste-Matched Language Immersion app

export type LanguageCode = 'japanese' | 'spanish' | 'french' | 'korean' | 'mandarin' | 'german' | 'italian' | 'portuguese';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type MediaType = 'movie' | 'tv' | 'music' | 'book';

export interface UserProfile {
  id: string;
  targetLanguage: LanguageCode;
  cefrLevel: CEFRLevel;
  weeklyHours: number;
  seedEntities: SeedEntity[];
  feedback?: FeedbackItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SeedEntity {
  id: string;         // Qloo entity ID
  name: string;
  type: MediaType;
  imageUrl?: string;
}

export interface TasteProfile {
  topTags: TasteTag[];
  summary: string;
  generatedAt: string;
}

export interface TasteTag {
  id: string;
  name: string;
  affinity: number;
}

export interface MusicTrackItem {
  id?: string;
  title: string;
  artistName?: string;
  previewUrl?: string;
  durationSeconds?: number;
  releaseYear?: number;
  albumTitle?: string;
}

export type ProvenanceSource = 'qloo_grounded' | 'gemini_verified' | 'curated_peer';
export type ConfidenceTier = 'strong' | 'exploratory' | 'tentative';

export interface ContentCandidate {
  entity: {
    id: string;
    name: string;
    type: MediaType;
    imageUrl?: string;
    year?: number;
    description?: string;
    creator?: string;      // director, artist, author
    country?: string;
    language?: string;
  };
  qlooAffinity: number;    // 0-1 from Qloo taste graph
  difficultyScore: number; // 1-10 language difficulty
  difficultyJustification: string;
  difficultyKeyNote: string; // "why hard/easy" in one line
  compositeScore: number;  // final ranking score
  tasteConnectionReason: string; // Evidence-grounded connection
  tags?: TasteTag[];
  languageValidation?: {
    status: 'verified' | 'probable' | 'uncertain';
    detectedCountry?: string;
    detectedLanguage?: string;
    notes: string;
  };
  dataSource?: 'live' | 'cache' | 'simulated';
  provenance?: ProvenanceSource;
  confidenceTier?: ConfidenceTier;
  topTracks?: MusicTrackItem[];
  explainabilityData?: Record<string, unknown>;
}

export interface CrossCategoryOpportunity {
  id: string;
  fromCategory: MediaType;
  toCategory: MediaType;
  normalizedGenre: string;
  headline: string;
  promptText: string;
  rationale: string;
}

export type EditorialTheme = 'light' | 'dark';

export interface WeeklySession {
  day: string;               // "Monday", "Wednesday", etc.
  date?: string;
  mediaType: MediaType;
  content: ContentCandidate;
  durationMinutes: number;
  activity: string;          // "2 songs + lyric study", "episode 1 with JP subs"
  preTeachVocabulary: Array<{ word: string; translation: string; pronunciation?: string }>;
  activeTask: string;        // "Shadow this scene", "Summarize in Spanish"
  tasteMatchExplanation: string; // Full explanation of Qloo connection
  learningObjective?: string;
  cefrSuitability?: string;
}

export interface WeeklyPlan {
  week: number;
  sessions: WeeklySession[];
  totalMinutes: number;
  coverageByType: Record<MediaType, number>;
  generatedAt: string;
  adaptationNotes?: string[];
}

export interface FeedbackItem {
  entityId: string;
  entityName: string;
  reaction: 'thumbs_up' | 'thumbs_down';
  reason?: 'not_relevant' | 'wrong_language' | 'too_difficult' | 'too_easy' | 'already_consumed' | 'other';
  difficultyFeedback?: 'too_hard' | 'too_easy' | 'just_right';
  timestamp: string;
  targetLanguage?: LanguageCode;
  cefrLevel?: CEFRLevel;
  learningObjective?: string;
  exerciseAttempted?: string;
  exerciseResult?: 'completed' | 'struggled' | 'skipped';
  adjustmentExplanation?: string;
}

export interface ComparisonRubricScores {
  tasteRelevance: number;
  languageCorrectness: number;
  difficultyFit: number;
  recommendationDiversity: number;
  resourceAvailability: number;
  overallScore: number;
}

export interface ComparisonResult {
  mode: 'qloo' | 'llm_only';
  candidates: ContentCandidate[];
  generatedAt: string;
  rubricScores?: ComparisonRubricScores;
  isLive?: boolean;
}

export interface AgentState {
  userProfile: UserProfile | null;
  tasteProfile: TasteProfile | null;
  candidates: ContentCandidate[];
  weeklyPlan: WeeklyPlan | null;
  feedbackHistory: FeedbackItem[];
  qlooComparison: ComparisonResult | null;
  llmComparison: ComparisonResult | null;
  currentStep: 'onboarding' | 'taste_profile' | 'candidates' | 'weekly_plan' | 'feedback';
  isLoading: boolean;
  error: string | null;
}

// Sample personas for demo
export const SAMPLE_PERSONAS: Array<{
  name: string;
  description: string;
  targetLanguage: LanguageCode;
  cefrLevel: CEFRLevel;
  weeklyHours: number;
  seedNames: string[];
  emoji: string;
}> = [
  {
    name: 'The Anime & Indie Rock Fan',
    description: 'Loves anime and indie music, wants to learn Japanese from authentic content',
    targetLanguage: 'japanese',
    cefrLevel: 'A1',
    weeklyHours: 5,
    seedNames: ['Attack on Titan', 'Death Note', 'Radiohead', 'Neutral Milk Hotel', 'Spirited Away'],
    emoji: '🎸',
  },
  {
    name: 'The True Crime & Hip-Hop Fan',
    description: 'True crime obsessed, listens to hip-hop, learning Spanish through telenovelas and urban music',
    targetLanguage: 'spanish',
    cefrLevel: 'A2',
    weeklyHours: 4,
    seedNames: ['Serial (podcast)', 'Making a Murderer', 'Kendrick Lamar', 'J. Cole', 'Breaking Bad'],
    emoji: '🎤',
  },
  {
    name: 'The K-Drama Newcomer',
    description: 'Just discovered K-dramas via Netflix, huge BTS fan, wants to understand what they\'re watching',
    targetLanguage: 'korean',
    cefrLevel: 'A1',
    weeklyHours: 6,
    seedNames: ['Squid Game', 'Parasite', 'BTS', 'Blackpink', 'My Love from the Star'],
    emoji: '🌸',
  },
  {
    name: 'The French Cinema Lover',
    description: 'Watches French New Wave films, loves philosophy and jazz, ready to advance to B2',
    targetLanguage: 'french',
    cefrLevel: 'B1',
    weeklyHours: 8,
    seedNames: ['Amelie', 'Jean-Luc Godard', 'Miles Davis', 'Albert Camus', 'The Artist'],
    emoji: '🗼',
  },
];
