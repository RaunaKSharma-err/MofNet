export type Grade = 6 | 7 | 8 | 9 | 10;
export type Language = 'en' | 'ne';
export type SubjectKey = 'science' | 'math' | 'social' | 'english' | 'computer';
export type ConnectionStatus = 'offline' | 'online' | 'mesh';

export interface UserProfile {
  id: string;
  name: string;
  grade: Grade;
  language: Language;
  school: string;
  role: 'student' | 'teacher';
  avatar?: string;
  xp: number;
  streak: number;
  badges: string[];
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  status?: 'sending' | 'sent' | 'error';
  source?: ChatSource;
  confidence?: number;
  bookmarked?: boolean;
  translated?: string;
}

export interface ChatSource {
  grade: string;
  subject: string;
  chapter: string;
  chapterNumber: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface Lesson {
  id: string;
  title: string;
  subject: SubjectKey;
  grade: Grade;
  chapter: number;
  chapterTitle: string;
  description: string;
  duration: number;
  thumbnail: string;
  progress: number;
  downloaded: boolean;
  bookmarked: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  popularity: number;
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'truefalse' | 'fill';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  subject: SubjectKey;
}

export interface QuizResult {
  id: string;
  quizId: string;
  title: string;
  score: number;
  total: number;
  xpEarned: number;
  completedAt: number;
  weakTopics: string[];
  badge?: string;
}

export interface MeshNode {
  id: string;
  name: string;
  type: 'school' | 'student' | 'teacher' | 'hub';
  status: 'connected' | 'weak' | 'offline';
  x: number;
  y: number;
  connections: string[];
  lastSync: number;
  contentSynced: number;
  device?: string;
}

export interface MeshLink {
  from: string;
  to: string;
  strength: 'strong' | 'weak' | 'offline';
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: 'announcement' | 'homework' | 'exam' | 'event' | 'emergency';
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
  read: boolean;
  pinned: boolean;
  author: string;
  attachments?: number;
}

export interface AppNotification {
  id: string;
  type: 'school' | 'homework' | 'learning' | 'quiz' | 'achievement' | 'announcement';
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  action?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: number;
}

export interface SubjectProgress {
  subject: SubjectKey;
  label: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  color: string;
}

export interface ActivityItem {
  id: string;
  type: 'lesson' | 'quiz' | 'chat' | 'bookmark' | 'badge';
  title: string;
  subtitle: string;
  timestamp: number;
  icon: string;
}
