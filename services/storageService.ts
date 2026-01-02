import { User, Championship, Match, Bet, MatchResult } from '../types';

const KEYS = {
  USERS: 'ht_users',
  CHAMPIONSHIPS: 'ht_championships',
  MATCHES: 'ht_matches',
  BETS: 'ht_bets',
  RESULTS: 'ht_results',
  CURRENT_USER: 'ht_current_user',
};

// Helper to simulate delay and async nature of fetch
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Auth ---

export const registerUser = async (username: string, password: string): Promise<User> => {
  await delay();
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.find(u => u.username === username)) {
    throw new Error('A felhasználónév már foglalt!');
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash: btoa(password), // VERY BASIC encoding, not secure for real prod
  };

  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newUser));
  return newUser;
};

export const loginUser = async (username: string, password: string): Promise<User> => {
  await delay();
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const user = users.find(u => u.username === username && u.passwordHash === btoa(password));
  
  if (!user) {
    throw new Error('Hibás felhasználónév vagy jelszó');
  }
  
  localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.CURRENT_USER);
};

export const getCurrentUser = (): User | null => {
  const u = localStorage.getItem(KEYS.CURRENT_USER);
  return u ? JSON.parse(u) : null;
};

// --- Championships ---

export const createChampionship = async (name: string, joinCode: string, adminId: string): Promise<Championship> => {
  await delay();
  const champs: Championship[] = JSON.parse(localStorage.getItem(KEYS.CHAMPIONSHIPS) || '[]');
  
  if (champs.find(c => c.joinCode === joinCode)) {
    throw new Error('Ez a kód már foglalt!');
  }

  const newChamp: Championship = {
    id: crypto.randomUUID(),
    name,
    joinCode,
    adminId,
    participants: [adminId],
  };

  champs.push(newChamp);
  localStorage.setItem(KEYS.CHAMPIONSHIPS, JSON.stringify(champs));
  return newChamp;
};

export const joinChampionship = async (joinCode: string, userId: string): Promise<Championship> => {
  await delay();
  const champs: Championship[] = JSON.parse(localStorage.getItem(KEYS.CHAMPIONSHIPS) || '[]');
  const champIndex = champs.findIndex(c => c.joinCode === joinCode);
  
  if (champIndex === -1) throw new Error('Nem létező bajnokság kód.');
  
  if (!champs[champIndex].participants.includes(userId)) {
    champs[champIndex].participants.push(userId);
    localStorage.setItem(KEYS.CHAMPIONSHIPS, JSON.stringify(champs));
  }
  
  return champs[champIndex];
};

export const getMyChampionships = async (userId: string): Promise<Championship[]> => {
  await delay();
  const champs: Championship[] = JSON.parse(localStorage.getItem(KEYS.CHAMPIONSHIPS) || '[]');
  return champs.filter(c => c.participants.includes(userId));
};

export const getChampionship = async (id: string): Promise<Championship | undefined> => {
  const champs: Championship[] = JSON.parse(localStorage.getItem(KEYS.CHAMPIONSHIPS) || '[]');
  return champs.find(c => c.id === id);
};

// --- Matches ---

export const createMatch = async (match: Omit<Match, 'id'>): Promise<Match> => {
  await delay();
  const matches: Match[] = JSON.parse(localStorage.getItem(KEYS.MATCHES) || '[]');
  const newMatch = { ...match, id: crypto.randomUUID() };
  matches.push(newMatch);
  localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
  return newMatch;
};

export const getMatches = async (championshipId: string): Promise<Match[]> => {
  await delay();
  const matches: Match[] = JSON.parse(localStorage.getItem(KEYS.MATCHES) || '[]');
  return matches
    .filter(m => m.championshipId === championshipId)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const updateMatchStatus = async (matchId: string, status: 'SCHEDULED' | 'FINISHED') => {
    const matches: Match[] = JSON.parse(localStorage.getItem(KEYS.MATCHES) || '[]');
    const idx = matches.findIndex(m => m.id === matchId);
    if (idx !== -1) {
        matches[idx].status = status;
        localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
    }
}

// --- Bets & Results ---

export const saveBet = async (bet: Bet): Promise<void> => {
  await delay();
  const bets: Bet[] = JSON.parse(localStorage.getItem(KEYS.BETS) || '[]');
  // Remove existing bet for this match/user
  const filtered = bets.filter(b => !(b.matchId === bet.matchId && b.userId === bet.userId));
  filtered.push(bet);
  localStorage.setItem(KEYS.BETS, JSON.stringify(filtered));
};

export const getBetsForMatch = (matchId: string): Bet[] => {
  const bets: Bet[] = JSON.parse(localStorage.getItem(KEYS.BETS) || '[]');
  return bets.filter(b => b.matchId === matchId);
};

export const saveResult = async (result: MatchResult): Promise<void> => {
  await delay();
  const results: MatchResult[] = JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]');
  const filtered = results.filter(r => r.matchId !== result.matchId);
  filtered.push(result);
  localStorage.setItem(KEYS.RESULTS, JSON.stringify(filtered));
  
  // Also close the match
  await updateMatchStatus(result.matchId, 'FINISHED');
};

export const getResult = (matchId: string): MatchResult | undefined => {
  const results: MatchResult[] = JSON.parse(localStorage.getItem(KEYS.RESULTS) || '[]');
  return results.find(r => r.matchId === matchId);
};

export const getUserMap = (): Record<string, string> => {
    const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    return users.reduce((acc, user) => ({...acc, [user.id]: user.username}), {});
}