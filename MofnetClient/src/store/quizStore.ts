import { create } from 'zustand';
import { mockQuizQuestions } from '@/src/mocks';
import type { QuizQuestion, QuizResult } from '@/src/types';

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  results: QuizResult[];
  isActive: boolean;
  timeLeft: number;
  startQuiz: () => void;
  answer: (questionId: string, answer: string) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  finish: () => QuizResult;
  setTimeLeft: (t: number) => void;
  addResult: (result: QuizResult) => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: mockQuizQuestions,
  currentIndex: 0,
  answers: {},
  results: [],
  isActive: false,
  timeLeft: 0,
  startQuiz: () => set({ currentIndex: 0, answers: {}, isActive: true, timeLeft: 600 }),
  answer: (questionId, ans) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: ans } })),
  next: () => set((state) => ({ currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1) })),
  prev: () => set((state) => ({ currentIndex: Math.max(state.currentIndex - 1, 0) })),
  reset: () => set({ currentIndex: 0, answers: {}, isActive: false, timeLeft: 0 }),
  finish: () => {
    const { questions, answers } = get();
    let score = 0;
    const weakTopics: string[] = [];
    questions.forEach((q) => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        score++;
      } else {
        weakTopics.push(q.topic);
      }
    });
    const xpEarned = score * 15;
    const badge = score === questions.length ? 'master' : score >= questions.length * 0.7 ? 'scholar' : 'explorer';
    const result: QuizResult = {
      id: `result_${Date.now()}`,
      quizId: 'qz_001',
      title: 'Mixed Subject Quiz',
      score,
      total: questions.length,
      xpEarned,
      completedAt: Date.now(),
      weakTopics,
      badge,
    };
    set((state) => ({ results: [...state.results, result], isActive: false }));
    return result;
  },
  setTimeLeft: (t) => set({ timeLeft: t }),
  addResult: (result) => set((state) => ({ results: [...state.results, result] })),
}));
