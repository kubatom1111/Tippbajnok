export enum QuestionType {
  WINNER = 'WINNER',
  EXACT_SCORE = 'EXACT_SCORE',
  OVER_UNDER = 'OVER_UNDER',
  CHOICE = 'CHOICE',
}

export interface User {
  id: string;
  username: string;
  passwordHash?: string;
  xp: number;
  level: number;
  rank: string;
}

export interface ChatMessage {
  id: string;
  championshipId: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

export interface QuestionConfig {
  id: string;
  label: string;
  type: QuestionType;
  points: number;
  options?: string[];
  threshold?: number;
}

export interface Match {
  id: string;
  championshipId: string;
  player1: string;
  player2: string;
  startTime: string;
  status: 'SCHEDULED' | 'FINISHED';
  questions: QuestionConfig[];
}

export interface MatchResult {
  matchId: string;
  answers: Record<string, string | number>;
}

export interface Bet {
  userId: string;
  matchId: string;
  answers: Record<string, string | number>;
  timestamp: string;
}

export interface Championship {
  id: string;
  name: string;
  joinCode: string;
  adminId: string;
  participants: string[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  correctTips: number;
}