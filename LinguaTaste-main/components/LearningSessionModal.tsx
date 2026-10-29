'use client';

import React, { useState } from 'react';
import type { WeeklySession, ContentCandidate, LanguageCode, CEFRLevel } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import {
  X,
  Sparkles,
  BookOpen,
  Music,
  Tv,
  Film,
  CheckCircle2,
  Clock,
  ExternalLink,
  Volume2,
  Award,
  ChevronRight,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Compass,
} from 'lucide-react';

interface LearningSessionModalProps {
  session?: WeeklySession | null;
  candidate?: ContentCandidate | null;
  targetLanguage?: LanguageCode;
  cefrLevel?: CEFRLevel;
  isOpen?: boolean;
  onClose: () => void;
  onCompleteFeedback?: (
    session: WeeklySession,
    reaction: 'thumbs_up' | 'thumbs_down',
    difficulty: 'too_hard' | 'too_easy' | 'just_right',
    score: number
  ) => void;
}

// Cultural passages and interactive comprehension questions calibrated by language and media
interface LessonContent {
  passageTitle: string;
  passageLines: Array<{ target: string; phonetic?: string; english: string; speaker?: string }>;
  culturalContextNote: string;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
}

const LESSON_CONTENT_BY_LANG: Record<string, LessonContent> = {
  japanese: {
    passageTitle: 'Authentic Scene Excerpt: Solitude & Modern Connectivity',
    passageLines: [
      { speaker: 'Lain', target: '人は誰でも繋がっているの？', phonetic: 'Hito wa dare demo tsunagatte iru no?', english: 'Is everyone connected to someone?' },
      { speaker: 'Voice', target: '現実と仮想の境界は、君が思っているより曖昧だ。', phonetic: 'Genjitsu to kasou no kyoukai wa, kimi ga omotte iru yori aimai da.', english: 'The boundary between reality and virtuality is more ambiguous than you think.' },
      { speaker: 'Lain', target: '私はどこにでもいるし、ここにもいる。', phonetic: 'Watashi wa doko ni demo iru shi, koko ni mo iru.', english: 'I am everywhere, and I am here as well.' },
    ],
    culturalContextNote: 'Explores the late-90s Japanese philosophical theme of "The Wired" (digital identity) using accessible casual sentence-ending particles (の, だ).',
    quiz: [
      {
        question: 'In the dialogue, what does the word "境界" (kyoukai) mean?',
        options: ['Boundary / Border', 'Connection', 'Internet network', 'Everyday memory'],
        correctIndex: 0,
        explanation: '境界 (kyoukai) means "boundary" or "border", formed by 境 (border) and 界 (world/boundary).',
      },
      {
        question: 'Which phrase is used to state "Is everyone connected?"',
        options: [
          '私はどこにでもいる',
          '人は誰でも繋がっているの？',
          '現実と仮想の境界',
          '君が思っているより曖昧だ',
        ],
        correctIndex: 1,
        explanation: '「人は誰でも繋がっているの？」 uses 誰でも (anyone/everyone) and 繋がっている (connected).',
      },
    ],
  },
  spanish: {
    passageTitle: 'Authentic Dialogue Excerpt: The Investigative Clue',
    passageLines: [
      { speaker: 'Detective', target: 'Las pistas encontradas en el callejón no coinciden con la coartada.', english: 'The clues found in the alleyway do not match the alibi.' },
      { speaker: 'Sospechoso', target: 'No tengo nada que ocultar. La verdad saldrá a la luz muy pronto.', english: 'I have nothing to hide. The truth will come to light very soon.' },
      { speaker: 'Detective', target: 'En este caso, cada silencio es una confesión.', english: 'In this case, every silence is a confession.' },
    ],
    culturalContextNote: 'Features dramatic crime procedural register with subjunctive nuances and classic Spanish idioms (salir a la luz = come to light).',
    quiz: [
      {
        question: 'What does the idiom "saldrá a la luz" mean in context?',
        options: ['Will be destroyed', 'Will come to light / be revealed', 'Will stay secret', 'Will cause guilt'],
        correctIndex: 1,
        explanation: '"Salir a la luz" literally translates to "come out into the light", meaning the truth will be uncovered or made public.',
      },
      {
        question: 'What is the detective referring to with "las pistas"?',
        options: ['The witnesses', 'The clues / evidence', 'The alleyways', 'The suspects'],
        correctIndex: 1,
        explanation: '"Las pistas" means clues, leads, or physical evidence in an investigative context.',
      },
    ],
  },
  french: {
    passageTitle: 'Extrait Littéraire / Cinéma: L’Étrangeté du Quotidien',
    passageLines: [
      { speaker: 'Narrateur', target: 'Le crépuscule tombait doucement sur les quais de la Seine.', english: 'Twilight was falling gently over the banks of the Seine.' },
      { speaker: 'Cléo', target: 'Dans cette solitude, la beauté n’est jamais tout à fait innocente.', english: 'In this solitude, beauty is never entirely innocent.' },
      { speaker: 'Ami', target: 'Il faut accepter l’absurde pour trouver un sens à nos pas.', english: 'One must accept the absurd to find meaning in our footsteps.' },
    ],
    culturalContextNote: 'Rich existentialist reflection characteristic of Nouvelle Vague cinema and Camus philosophy.',
    quiz: [
      {
        question: 'What time of day is represented by "Le crépuscule"?',
        options: ['Early morning dawn', 'Noon', 'Twilight / Dusk', 'Midnight'],
        correctIndex: 2,
        explanation: '"Le crépuscule" is the poetic French term for twilight or dusk, the transition between day and night.',
      },
      {
        question: 'Translate the key philosophical term "L’absurde":',
        options: ['The absurd / the meaningless', 'The destiny', 'The anxiety', 'The truth'],
        correctIndex: 0,
        explanation: '"L’absurde" refers to the existential conflict between the human search for meaning and the indifference of the universe.',
      },
    ],
  },
  korean: {
    passageTitle: 'Authentic Scene Excerpt: The Unspoken Promise',
    passageLines: [
      { speaker: '주인공', target: '새벽이 오기 전에 진실을 말해줘.', phonetic: 'Saebyeoki ogi jeone jinsireul malhaejwo.', english: 'Tell me the truth before dawn arrives.' },
      { speaker: '상대방', target: '우리 둘만의 비밀로 남겨두자.', phonetic: 'Uri dulmanui bimillo namgyeoduja.', english: 'Let us leave this as a secret just between the two of us.' },
      { speaker: '주인공', target: '기억은 사라져도 마음은 남아있어.', phonetic: 'Gieokeun sarajyeodo maeumeun namaisseo.', english: 'Even if memories fade, the heart remains.' },
    ],
    culturalContextNote: 'Dramatic high-context dialogue featuring subtle honorific nuances and romantic melancholia common in K-dramas.',
    quiz: [
      {
        question: 'What does "진실" (jinsil) mean in this sentence?',
        options: ['Secret', 'Truth', 'Memory', 'Dawn'],
        correctIndex: 1,
        explanation: '"진실" (jinsil) means truth or factual reality, contrasting with "비밀" (bimil = secret).',
      },
      {
        question: 'What time does "새벽" (saebyeok) refer to?',
        options: ['Midnight', 'Afternoon', 'Early dawn / daybreak', 'Sunset'],
        correctIndex: 2,
        explanation: '"새벽" (saebyeok) refers specifically to the quiet pre-dawn hours between 3 AM and sunrise.',
      },
    ],
  },
};

export default function LearningSessionModal({
  session,
  candidate,
  targetLanguage,
  cefrLevel,
  isOpen,
  onClose,
  onCompleteFeedback,
}: LearningSessionModalProps) {
  const storeUserProfile = useAppStore(state => state.userProfile);
  const addFeedback = useAppStore(state => state.addFeedback);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'too_hard' | 'just_right' | 'too_easy'>('just_right');
  const [isCompleted, setIsCompleted] = useState(false);

  // If isOpen is explicitly passed as false, return null
  if (isOpen !== undefined && !isOpen) return null;

  // Construct effective session if candidate was passed directly
  const effectiveSession: WeeklySession | null = session || (candidate ? {
    day: 'Immersion',
    mediaType: candidate.entity.type,
    content: candidate,
    durationMinutes: candidate.entity.type === 'music' ? 20 : candidate.entity.type === 'book' ? 30 : 45,
    activity: `Target study session for ${candidate.entity.name}`,
    preTeachVocabulary: [
      { word: '孤独 (kodoku)', translation: 'Solitude / Loneliness', pronunciation: 'koh-doh-koo' },
      { word: '真実 (shinjitsu)', translation: 'Truth / Reality', pronunciation: 'sheen-jee-tsoo' },
      { word: '記憶 (kioku)', translation: 'Memory / Recollection', pronunciation: 'kee-oh-koo' },
      { word: '日常 (nichijou)', translation: 'Everyday life', pronunciation: 'nee-chee-joh' },
    ],
    activeTask: 'Shadow dialogues and extract core vocabulary',
    tasteMatchExplanation: candidate.tasteConnectionReason || 'Culturally grounded immersion match',
    learningObjective: candidate.tasteConnectionReason || `Master authentic communicative phrases in ${candidate.entity.name}.`,
  } : null);

  if (!effectiveSession) return null;

  const activeLang = targetLanguage || storeUserProfile?.targetLanguage || 'japanese';
  const activeLevel = cefrLevel || storeUserProfile?.cefrLevel || 'B1';

  const lesson = LESSON_CONTENT_BY_LANG[activeLang] || LESSON_CONTENT_BY_LANG['japanese'];

  const mediaIcon =
    effectiveSession.mediaType === 'music' ? <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> :
    effectiveSession.mediaType === 'tv' ? <Tv className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" /> :
    effectiveSession.mediaType === 'book' ? <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" /> :
    <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />;

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    lesson.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const handleFinishSession = () => {
    const score = calculateScore();
    if (onCompleteFeedback) {
      onCompleteFeedback(effectiveSession, 'thumbs_up', selectedDifficulty, score);
    } else {
      addFeedback({
        entityId: effectiveSession.content.entity.id,
        entityName: effectiveSession.content.entity.name,
        reaction: 'thumbs_up',
        difficultyFeedback: selectedDifficulty,
        timestamp: new Date().toISOString(),
        targetLanguage: activeLang,
        cefrLevel: activeLevel,
      });
    }
    setIsCompleted(true);
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setIsCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#141418] border border-[#e7e5e4] dark:border-[#27272a] p-6 sm:p-8 shadow-2xl text-[#1a1917] dark:text-[#f7f6f4] space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#e7e5e4] dark:border-[#27272a] gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
              {mediaIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#7c3aed] dark:text-[#a78bfa] uppercase tracking-wider font-mono">
                  {effectiveSession.day} Immersion Session
                </span>
                <span className="text-[10px] bg-black/5 dark:bg-white/5 text-[#57534e] dark:text-[#a8a29e] px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#7c3aed] dark:text-[#a78bfa]" />
                  {effectiveSession.durationMinutes} Minutes
                </span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  CEFR {activeLevel} Calibrated
                </span>
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#1a1917] dark:text-[#f7f6f4] mt-1">
                {effectiveSession.content.entity.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Stated Learning Objective */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
          <span className="text-[10px] font-bold text-[#7c3aed] dark:text-[#a78bfa] uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Session Pedagogical Objective
          </span>
          <p className="text-xs font-medium text-[#1a1917] dark:text-[#f7f6f4] leading-relaxed font-serif">
            {effectiveSession.learningObjective || `Master authentic communicative phrases and contextual vocabulary in ${effectiveSession.content.entity.name}.`}
          </p>
          <p className="text-[11px] text-[#78716c] dark:text-[#a1a1aa] italic">
            Calibrated for proximal development without cognitive overload.
          </p>
        </div>

        {/* 2. Authentic Immersion Content / Cultural Dialogue */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cultural Immersion Passage</span>
            </h3>
            <span className="text-[10px] text-[#78716c] dark:text-[#a1a1aa] font-mono">
              {lesson.passageTitle}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] space-y-3 font-sans">
            {lesson.passageLines.map((line, idx) => (
              <div key={idx} className="space-y-1 pb-2 border-b border-[#e7e5e4]/60 dark:border-[#272730] last:border-0 last:pb-0">
                {line.speaker && (
                  <span className="text-[10px] font-bold text-[#7c3aed] dark:text-[#a78bfa] uppercase tracking-wider font-mono">
                    {line.speaker}:
                  </span>
                )}
                <div className="text-sm font-medium text-[#1a1917] dark:text-[#f7f6f4] tracking-wide">
                  {line.target}
                </div>
                {line.phonetic && (
                  <div className="text-[11px] font-mono text-[#78716c] dark:text-[#a1a1aa]">
                    {line.phonetic}
                  </div>
                )}
                <div className="text-xs text-[#57534e] dark:text-[#d4d4d8] italic font-serif">
                  &ldquo;{line.english}&rdquo;
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#78716c] dark:text-[#a1a1aa] px-1 font-serif">
            💡 <strong className="text-[#1a1917] dark:text-[#f7f6f4]">Cultural Grounding:</strong> {lesson.culturalContextNote}
          </p>
        </div>

        {/* 3. Pre-Teach Vocabulary Keys */}
        <div className="space-y-3">
          <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#7c3aed] dark:text-[#a78bfa]" />
            <span>Pre-Teach Vocabulary Keys</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(effectiveSession.preTeachVocabulary && effectiveSession.preTeachVocabulary.length > 0
              ? effectiveSession.preTeachVocabulary
              : [
                  { word: '孤独 (kodoku)', translation: 'Solitude / Loneliness', pronunciation: 'koh-doh-koo' },
                  { word: '真実 (shinjitsu)', translation: 'Truth / Reality', pronunciation: 'sheen-jee-tsoo' },
                  { word: '記憶 (kioku)', translation: 'Memory / Recollection', pronunciation: 'kee-oh-koo' },
                  { word: '日常 (nichijou)', translation: 'Everyday life', pronunciation: 'nee-chee-joh' },
                ]
            ).slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-[#1a1917] dark:text-[#f7f6f4]">
                    {item.word}
                  </div>
                  {item.pronunciation && (
                    <div className="text-[10px] font-mono text-[#78716c] dark:text-[#a1a1aa]">
                      /{item.pronunciation}/
                    </div>
                  )}
                  <div className="text-xs text-[#57534e] dark:text-[#a8a29e] mt-0.5 font-serif">
                    {item.translation}
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[#78716c] dark:text-[#a1a1aa] font-mono">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Interactive Comprehension Quiz */}
        <div className="space-y-4 pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-base font-bold text-[#1a1917] dark:text-[#f7f6f4] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Interactive Comprehension Challenge</span>
            </h3>
            {showResults && (
              <span className="text-xs font-mono font-bold text-[#7c3aed] dark:text-[#a78bfa] bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                Score: {calculateScore()} / {lesson.quiz.length}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {lesson.quiz.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[qIdx];
              const isAnswered = selectedOpt !== undefined;
              const isCorrect = selectedOpt === q.correctIndex;

              return (
                <div key={qIdx} className="p-4 rounded-2xl bg-[#faf8f5] dark:bg-[#1a1a22] border border-[#e7e5e4] dark:border-[#272730] space-y-3">
                  <div className="text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4]">
                    {qIdx + 1}. {q.question}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      let btnStyle = 'bg-white dark:bg-[#141418] border-[#e7e5e4] dark:border-[#27272a] text-[#57534e] dark:text-[#a8a29e] hover:border-[#7c3aed] hover:text-[#1a1917] dark:hover:text-[#ffffff]';

                      if (showResults) {
                        if (optIdx === q.correctIndex) {
                          btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                        } else if (selectedOpt === optIdx) {
                          btnStyle = 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300';
                        }
                      } else if (selectedOpt === optIdx) {
                        btnStyle = 'bg-[#7c3aed]/15 border-[#7c3aed] text-[#7c3aed] dark:text-[#a78bfa] font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                          disabled={showResults}
                          className={`p-2.5 rounded-xl text-xs text-left border transition-all cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono opacity-60">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span>{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {showResults && (
                    <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed border ${
                      isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                    }`}>
                      {isCorrect ? '✓ Correct! ' : '✗ Note: '}
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showResults ? (
            <button
              type="button"
              onClick={handleCheckAnswers}
              disabled={Object.keys(selectedAnswers).length < lesson.quiz.length}
              className="w-full py-3 rounded-2xl bg-[#7c3aed] hover:bg-[#6d28d9] text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              Verify Challenge Answers
            </button>
          ) : !isCompleted ? (
            /* 5. Learner Feedback & Agent Adaptation */
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1a1917] dark:text-[#f7f6f4]">How did this session feel?</h4>
                  <p className="text-[11px] text-[#57534e] dark:text-[#a8a29e]">
                    Your feedback dynamically tunes future candidate difficulty and taste weights.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['too_hard', 'just_right', 'too_easy'] as const).map(diff => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize cursor-pointer ${
                      selectedDifficulty === diff
                        ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-xs'
                        : 'bg-white dark:bg-[#141418] border-[#e7e5e4] dark:border-[#27272a] text-[#57534e] dark:text-[#a8a29e]'
                    }`}
                  >
                    {diff === 'too_hard' ? '😓 Too Difficult' : diff === 'too_easy' ? '⚡ Too Easy' : '🎯 Just Right (Optimal)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e7e5e4] dark:border-[#27272a]">
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="text-xs text-[#78716c] hover:text-[#1a1917] dark:text-[#a1a1aa] dark:hover:text-[#ffffff] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={handleFinishSession}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Session & Recalibrate Agent
                </button>
              </div>
            </div>
          ) : (
            /* Post-Completion Reasoned Adjustment */
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Session Completed & Recorded!</span>
              </div>
              <p className="text-xs text-[#57534e] dark:text-[#a8a29e] leading-relaxed font-serif">
                <strong className="text-[#1a1917] dark:text-[#f7f6f4]">Reasoned Next-Session Adjustment:</strong>{' '}
                {selectedDifficulty === 'just_right'
                  ? `Optimal proximal development zone confirmed for ${effectiveSession.content.entity.name}. Future sessions will sustain this dialogue cadence while introducing richer narrative expressions.`
                  : selectedDifficulty === 'too_easy'
                  ? `Challenge target elevated for future sessions. Next week's plan will feature faster natural dialogue and unscripted conversation formats.`
                  : `Challenge target lowered for future sessions. Next week's plan will favor slower pacing and visual context aids.`}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-[#1a1917] dark:text-[#f7f6f4] transition-all cursor-pointer"
              >
                Return to Immersion Schedule
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
