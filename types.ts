export enum QuestionType {
  WINNER = 'WINNER', // Select Player 1 or Player 2
  EXACT_SCORE = 'EXACT_SCORE', // X - Y
  OVER_UNDER = 'OVER_UNDER', // Value > Threshold
  CHOICE = 'CHOICE', // Select from custom options (e.g. High checkout player)
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Simple local hash for demo
}

export interface QuestionConfig {
  id: string;
  label: string;
  type: QuestionType;
  points: number;
  options?: string[]; // For CHOICE type or labels for players
  threshold?: number; // For OVER_UNDER
}

export interface Match {
  id: string;
  championshipId: string;
  player1: string;
  player2: string;
  startTime: string; // ISO String
  status: 'SCHEDULED' | 'FINISHED';
  questions: QuestionConfig[];
}

// Stores the actual correct results entered by Admin
export interface MatchResult {
  matchId: string;
  answers: Record<string, string | number>; // questionId -> value
}

// Stores the user's prediction
export interface Bet {
  userId: string;
  matchId: string;
  answers: Record<string, string | number>; // questionId -> value
  timestamp: string;
}

export interface Championship {
  id: string;
  name: string;
  joinCode: string;
  adminId: string;
  participants: string[]; // List of user IDs
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  correctTips: number;
}