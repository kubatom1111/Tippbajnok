import { User, Championship, Match, Bet, MatchResult } from './types';

const KEYS = {
  USERS: 'ht_v2_users',
  CHAMPIONSHIPS: 'ht_v2_champs',
  MATCHES: 'ht_v2_matches',
  BETS: 'ht_v2_bets',
  RESULTS: 'ht_v2_results',
  SESSION: 'ht_v2_session',
};

// Utils
const load = <T>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]');
const save = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));
const delay = () => new Promise(r => setTimeout(r, 400)); // Loading effect

// Auth
export const register = async (username: string): Promise<User> => {
  await delay();
  const users = load<User>(KEYS.USERS);
  if (users.find(u => u.username === username)) throw new Error('Foglalt név!');
  const user = { id: crypto.randomUUID(), username };
  users.push(user);
  save(KEYS.USERS, users);
  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  return user;
};

export const login = async (username: string): Promise<User> => {
  await delay();
  const users = load<User>(KEYS.USERS);
  const user = users.find(u => u.username === username);
  if (!user) throw new Error('Nincs ilyen felhasználó!');
  localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
  return user;
};

export const getSession = (): User | null => {
  const s = localStorage.getItem(KEYS.SESSION);
  return s ? JSON.parse(s) : null;
};

export const logout = () => localStorage.removeItem(KEYS.SESSION);

// Logic
export const createChamp = async (name: string, code: string, adminId: string) => {
  await delay();
  const list = load<Championship>(KEYS.CHAMPIONSHIPS);
  if (list.find(c => c.joinCode === code)) throw new Error('A kód foglalt!');
  list.push({ id: crypto.randomUUID(), name, joinCode: code, adminId, participants: [adminId] });
  save(KEYS.CHAMPIONSHIPS, list);
};

export const joinChamp = async (code: string, userId: string) => {
  await delay();
  const list = load<Championship>(KEYS.CHAMPIONSHIPS);
  const idx = list.findIndex(c => c.joinCode === code);
  if (idx === -1) throw new Error('Érvénytelen kód!');
  if (!list[idx].participants.includes(userId)) {
    list[idx].participants.push(userId);
    save(KEYS.CHAMPIONSHIPS, list);
  }
};

export const getMyChamps = async (userId: string) => {
  await delay();
  return load<Championship>(KEYS.CHAMPIONSHIPS).filter(c => c.participants.includes(userId));
};

export const getMatches = async (champId: string) => {
  await delay();
  return load<Match>(KEYS.MATCHES).filter(m => m.championshipId === champId)
    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

export const createMatch = async (match: Omit<Match, 'id'>) => {
  const list = load<Match>(KEYS.MATCHES);
  list.push({ ...match, id: crypto.randomUUID() });
  save(KEYS.MATCHES, list);
};

export const saveBet = async (bet: Bet) => {
  await delay();
  const list = load<Bet>(KEYS.BETS).filter(b => !(b.matchId === bet.matchId && b.userId === bet.userId));
  list.push(bet);
  save(KEYS.BETS, list);
};

export const getBets = (matchId: string) => load<Bet>(KEYS.BETS).filter(b => b.matchId === matchId);
export const getResults = () => load<MatchResult>(KEYS.RESULTS);

export const closeMatch = async (result: MatchResult) => {
  const resList = load<MatchResult>(KEYS.RESULTS).filter(r => r.matchId !== result.matchId);
  resList.push(result);
  save(KEYS.RESULTS, resList);
  
  const matches = load<Match>(KEYS.MATCHES);
  const mIdx = matches.findIndex(m => m.id === result.matchId);
  if (mIdx !== -1) {
    matches[mIdx].status = 'FINISHED';
    save(KEYS.MATCHES, matches);
  }
};

export const getAllUsers = () => {
    const users = load<User>(KEYS.USERS);
    return users.reduce((acc, u) => ({...acc, [u.id]: u.username}), {} as Record<string, string>);
}