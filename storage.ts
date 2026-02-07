import { createClient } from '@supabase/supabase-js';
import { User, Championship, Match, Bet, MatchResult, ChatMessage } from './types';

// A megadott adatok alapján beállítva - így nem kérdezi a rendszer indításkor
const SUPABASE_URL = 'https://eygkkjaktjongxzrzknv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_loyC2ExGvYpKeSiCiCHgSg_I-1AXcUG';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Logic Helpers ---

const calculateRank = (level: number): string => {
  if (level < 5) return 'Újonc';
  if (level < 10) return 'Amatőr';
  if (level < 20) return 'Haladó';
  if (level < 50) return 'Profi';
  return 'Legenda';
};

// --- Auth ---

export const register = async (username: string, password: string): Promise<User> => {
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) throw new Error('Foglalt felhasználónév!');

  const passwordHash = btoa(password);

  // Try to insert with defaults if schema allows, otherwise just basic insert
  const { data, error } = await supabase.from('users').insert({
    username,
    password_hash: passwordHash
    // xp, level, rank columns might not exist yet, so we don't send them
  }).select().single();

  if (error) throw error;

  // Return with default stats (client-side extension)
  const user: User = {
    id: data.id,
    username: data.username,
    xp: 0,
    level: 1,
    rank: 'Újonc'
  };
  localStorage.setItem('ht_session', JSON.stringify(user));
  return user;
};

export const login = async (username: string, password: string): Promise<User> => {
  const hash = btoa(password);

  const { data, error } = await supabase.from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', hash)
    .single();

  if (error || !data) throw new Error('Hibás felhasználónév vagy jelszó!');

  // Merge DB data with defaults if columns are missing
  const user: User = {
    id: data.id,
    username: data.username,
    xp: data.xp || 0,
    level: data.level || 1,
    rank: data.rank || calculateRank(data.level || 1)
  };
  localStorage.setItem('ht_session', JSON.stringify(user));
  return user;
};

export const getSession = (): User | null => {
  const s = localStorage.getItem('ht_session');
  return s ? JSON.parse(s) : null;
};

export const refreshSession = async (): Promise<User | null> => {
  const current = getSession();
  if (!current) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', current.id).single();
  if (error || !data) return null;

  const updatedUser: User = {
    id: data.id,
    username: data.username,
    xp: data.xp || 0,
    level: data.level || 1,
    rank: data.rank || calculateRank(data.level || 1)
  };
  localStorage.setItem('ht_session', JSON.stringify(updatedUser));
  return updatedUser;
};

export const logout = () => {
  localStorage.removeItem('ht_session');
};

// --- Login Streak ---

export const recordDailyLogin = async (userId: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  // Upsert: Insert today's login, ignore if already exists
  await supabase
    .from('login_history')
    .upsert(
      { user_id: userId, login_date: today },
      { onConflict: 'user_id,login_date', ignoreDuplicates: true }
    );
};

export const getLoginStreak = async (userId: string): Promise<number> => {
  // Fetch all login dates for user, sorted descending
  const { data, error } = await supabase
    .from('login_history')
    .select('login_date')
    .eq('user_id', userId)
    .order('login_date', { ascending: false });

  if (error || !data || data.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let expectedDate = new Date(today);

  for (const row of data) {
    const loginDate = new Date(row.login_date);
    loginDate.setHours(0, 0, 0, 0);

    // Check if this login matches the expected date
    if (loginDate.getTime() === expectedDate.getTime()) {
      streak++;
      // Move expected date back by 1 day
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (loginDate.getTime() < expectedDate.getTime()) {
      // Streak broken (gap in dates)
      break;
    }
    // If loginDate > expectedDate, skip (duplicate or future date)
  }

  return streak;
};

export const addXp = async (amount: number): Promise<User> => {
  const session = getSession();
  if (!session) throw new Error("No session");

  let { xp, level, id } = session;
  xp += amount;

  // Robust Level up logic (while loop)
  while (true) {
    const nextLevelXp = level * 100;
    if (xp >= nextLevelXp) {
      xp -= nextLevelXp;
      level++;
    } else {
      break;
    }
  }

  const rank = calculateRank(level);

  // STRICT DB UPDATE FIRST
  // If this fails, we throw and do NOT update local storage
  const { error } = await supabase.from('users').update({ xp, level, rank }).eq('id', id);

  if (error) {
    console.error("Critical: Could not save XP to server", error);
    throw new Error("Hiba a mentés során! Az XP nem lett jóváírva.");
  }

  // If successful, update local state
  const updatedUser: User = { ...session, xp, level, rank };
  localStorage.setItem('ht_session', JSON.stringify(updatedUser));

  return updatedUser;
};

// --- Achievements ---

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  const stats = await getUserStats(userId);
  const streak = await getLoginStreak(userId);

  // Fetch total bets count
  const { count: betCount } = await supabase
    .from('bets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const achievements: Achievement[] = [
    {
      id: 'first_5p',
      name: 'Első 5 pont',
      description: 'Szerezd meg az első pontos találatod!',
      icon: '🎯',
      unlocked: stats.points >= 5,
    },
    {
      id: 'streak_master',
      name: 'Streak Mester',
      description: '7 napos bejelentkezési sorozat',
      icon: '🔥',
      unlocked: streak >= 7,
    },
    {
      id: 'veteran',
      name: 'Veterán',
      description: 'Gyűjts össze 50+ pontot',
      icon: '⭐',
      unlocked: stats.points >= 50,
    },
    {
      id: 'century',
      name: '100 Tipp',
      description: 'Tippelj 100 meccsre',
      icon: '📊',
      unlocked: (betCount || 0) >= 100,
    },
    {
      id: 'sharp',
      name: 'Mesterlövész',
      description: '70%+ győzelmi arány',
      icon: '🎖️',
      unlocked: stats.winRate >= 70 && stats.total >= 10,
    },
  ];

  return achievements;
};

// --- Missions Persistence (Supabase) ---

// SQL for mission_claims table (run this in Supabase):
// CREATE TABLE IF NOT EXISTS mission_claims (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//   mission_id INTEGER NOT NULL,
//   claimed_at TIMESTAMPTZ DEFAULT now(),
//   UNIQUE(user_id, mission_id)
// );

export const getMissionClaimsFromDB = async (userId: string): Promise<Record<number, string>> => {
  const { data, error } = await supabase
    .from('mission_claims')
    .select('mission_id, claimed_at')
    .eq('user_id', userId);

  if (error || !data) return {};

  const claims: Record<number, string> = {};
  data.forEach((row: any) => {
    claims[row.mission_id] = row.claimed_at;
  });
  return claims;
};

export const saveMissionClaimToDB = async (userId: string, missionId: number): Promise<boolean> => {
  // Upsert: Insert or do nothing if already exists (prevents double-claim at DB level)
  const { error } = await supabase
    .from('mission_claims')
    .upsert(
      { user_id: userId, mission_id: missionId, claimed_at: new Date().toISOString() },
      { onConflict: 'user_id,mission_id', ignoreDuplicates: true }
    );

  if (error) {
    console.error("Failed to save mission claim:", error);
    return false;
  }
  return true;
};

// Check if a daily mission was claimed TODAY by this user
export const wasDailyMissionClaimedToday = async (userId: string, missionId: number): Promise<boolean> => {
  const claims = await getMissionClaimsFromDB(userId);
  const claimDate = claims[missionId];
  if (!claimDate) return false;

  const today = new Date().toISOString().split('T')[0];
  return claimDate.split('T')[0] === today;
};

// DEPRECATED: Keep for backwards compatibility, but prefer DB functions
const MISSION_STORAGE_KEY = 'ht_mission_claims';

export const getMissionClaims = (): Record<number, string> => {
  const s = localStorage.getItem(MISSION_STORAGE_KEY);
  return s ? JSON.parse(s) : {};
};

export const saveMissionClaim = (missionId: number) => {
  const claims = getMissionClaims();
  claims[missionId] = new Date().toISOString();
  localStorage.setItem(MISSION_STORAGE_KEY, JSON.stringify(claims));
};

// --- Logic ---

export const createChamp = async (name: string, code: string, adminId: string) => {
  const { data: existing } = await supabase.from('championships').select('id').eq('join_code', code).single();
  if (existing) throw new Error('A kód foglalt!');

  const { error } = await supabase.from('championships').insert({
    name,
    join_code: code,
    admin_id: adminId,
    participants: [adminId] // JSONB array
  });

  if (error) throw error;
};

export const joinChamp = async (code: string, userId: string) => {
  const { data: champ, error } = await supabase.from('championships').select('*').eq('join_code', code).single();
  if (error || !champ) throw new Error('Érvénytelen kód!');

  const participants: string[] = champ.participants || [];
  if (!participants.includes(userId)) {
    participants.push(userId);
    const { error: updateError } = await supabase.from('championships')
      .update({ participants })
      .eq('id', champ.id);
    if (updateError) throw updateError;
  }
};

export const getMyChamps = async (userId: string): Promise<Championship[]> => {
  // Supabase postgREST filter jsonb contains
  const { data, error } = await supabase.from('championships').select('*').contains('participants', JSON.stringify([userId]));
  if (error) return [];

  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    joinCode: d.join_code,
    adminId: d.admin_id,
    participants: d.participants
  }));
};

export const getMatches = async (champId: string): Promise<Match[]> => {
  const { data, error } = await supabase.from('matches')
    .select('*')
    .eq('championship_id', champId)
    .order('start_time', { ascending: true });

  if (error) return [];

  return data.map((d: any) => ({
    id: d.id,
    championshipId: d.championship_id,
    player1: d.player1,
    player2: d.player2,
    startTime: d.start_time,
    status: d.status,
    questions: d.questions
  }));
};

export const createMatch = async (match: Omit<Match, 'id'>) => {
  const { error } = await supabase.from('matches').insert({
    championship_id: match.championshipId,
    player1: match.player1,
    player2: match.player2,
    start_time: match.startTime,
    status: match.status,
    questions: match.questions
  });
  if (error) throw error;
};

export const saveBet = async (bet: Bet) => {
  // Upsert logic using user_id + match_id unique constraint
  const { error } = await supabase.from('bets').upsert({
    user_id: bet.userId,
    match_id: bet.matchId,
    answers: bet.answers,
    timestamp: bet.timestamp
  }, { onConflict: 'user_id,match_id' });

  if (error) throw error;
};

// Async bet loader
export const fetchBetsForMatch = async (matchId: string): Promise<Bet[]> => {
  const { data, error } = await supabase.from('bets').select('*').eq('match_id', matchId);
  if (error) return [];
  return data.map((d: any) => ({
    userId: d.user_id,
    matchId: d.match_id,
    answers: d.answers,
    timestamp: d.timestamp
  }));
}

export const fetchResults = async (): Promise<MatchResult[]> => {
  const { data } = await supabase.from('results').select('*');
  return data ? data.map((d: any) => ({ matchId: d.match_id, answers: d.answers })) : [];
}

export const closeMatch = async (result: MatchResult) => {
  // 1. Save Result
  await supabase.from('results').upsert({
    match_id: result.matchId,
    answers: result.answers
  });

  // 2. Update Match Status
  await supabase.from('matches').update({ status: 'FINISHED' }).eq('id', result.matchId);
};

export const getAllUsers = async () => {
  const { data } = await supabase.from('users').select('id, username');
  return data ? data.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.username }), {}) : {};
};

// --- Soccer Logic ---

export const calculateSoccerPoints = (betScore: string, resultScore: string): number => {
  if (!betScore || !resultScore) return 0;

  // Check if format is "X-Y"
  if (!betScore.includes('-') || !resultScore.includes('-')) return 0;

  const [b1, b2] = betScore.split('-').map(Number);
  const [r1, r2] = resultScore.split('-').map(Number);

  if (isNaN(b1) || isNaN(b2) || isNaN(r1) || isNaN(r2)) return 0;

  // 1. Exact Match (5p)
  if (b1 === r1 && b2 === r2) return 5;

  const betDiff = b1 - b2;
  const resDiff = r1 - r2;

  // Determine winner (1: Home, 2: Away, 0: Draw)
  const betOutcome = b1 > b2 ? 1 : (b2 > b1 ? 2 : 0);
  const resOutcome = r1 > r2 ? 1 : (r2 > r1 ? 2 : 0);

  // 2. Goal Difference + Winner (3p)
  // Must have same winner AND same goal difference
  // Note: Draw always has diff 0. So if both are draws, they match diff. 
  // But exact match 5p is already handled.
  // Example: Bet 2-0 (+2), Res 3-1 (+2). Winner Home. -> 3p.
  if (betOutcome === resOutcome && betDiff === resDiff) return 3;

  // 3. Outcome Only (1p)
  if (betOutcome === resOutcome) return 1;

  return 0;
};

export const getGlobalStats = async () => {
  // Client-side aggregation (for now, until we move to Supabase Views/Edge Functions)
  const { data: users } = await supabase.from('users').select('id, username');
  // Only finished matches
  const { data: matches } = await supabase.from('matches').select('*').eq('status', 'FINISHED');
  const { data: results } = await supabase.from('results').select('*');
  const { data: bets } = await supabase.from('bets').select('*');

  if (!users || !matches || !results || !bets) return [];

  const stats: Record<string, { username: string, points: number, correct: number }> = {};
  users.forEach((u: any) => {
    stats[u.id] = { username: u.username, points: 0, correct: 0 };
  });

  matches.forEach((m: any) => {
    const res = results.find((r: any) => r.match_id === m.id);
    if (!res) return;

    const matchBets = bets.filter((b: any) => b.match_id === m.id);
    matchBets.forEach((b: any) => {
      if (!stats[b.user_id]) return;

      // Calculate points
      if (m.questions) {
        (m.questions as any[]).forEach(q => {
          // For simplicity, we assume the question ID for "Full Time Result" is usually something standard or we allow custom questions.
          // BUT, the rules define "Score" points. 
          // If the question is "Végeredmény", we use calculateSoccerPoints.
          // If strictly matching custom questions, we stick to equality.
          // Let's assume the question Answer IS the score "2-1".
          const betAns = String(b.answers[q.id]);
          const resAns = String(res.answers[q.id]);

          // Check if it looks like a score?
          if (betAns.includes('-') && resAns.includes('-')) {
            const p = calculateSoccerPoints(betAns, resAns);
            stats[b.user_id].points += p;
            if (p > 0) stats[b.user_id].correct++;
          } else {
            // Classic direct match for non-score questions
            if (betAns === resAns) {
              stats[b.user_id].points += q.points;
              stats[b.user_id].correct++;
            }
          }
        });
      }
    });
  });

  return Object.values(stats).sort((a, b) => b.points - a.points);
};
// --- Stats Cache ---
const statsCache: Map<string, { data: any; expiry: number }> = new Map();
const STATS_CACHE_TTL = 30 * 1000; // 30 seconds

const getCachedStats = async (userId: string, fetcher: () => Promise<any>) => {
  const cached = statsCache.get(userId);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  const data = await fetcher();
  statsCache.set(userId, { data, expiry: Date.now() + STATS_CACHE_TTL });
  return data;
};

export const getUserStats = async (userId: string) => {
  return getCachedStats(`user_${userId}`, async () => {
    // OPTIMIZED: Fetch bets for user FIRST
    const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId);

    if (!bets || bets.length === 0) return { points: 0, correct: 0, total: 0, winRate: 0 };

    const matchIds = bets.map((b: any) => b.match_id);

    // OPTIMIZED: Fetch only relevant matches and results
    const { data: matches } = await supabase.from('matches').select('*').in('id', matchIds).eq('status', 'FINISHED');
    const { data: results } = await supabase.from('results').select('*').in('match_id', matchIds);

    if (!matches || !results) return { points: 0, correct: 0, total: 0, winRate: 0 };

    let points = 0;
    let correct = 0;
    let totalQuestions = 0;

    matches.forEach((m: any) => {
      const res = results.find((r: any) => r.match_id === m.id);
      const bet = bets.find((b: any) => b.match_id === m.id);

      if (!res || !bet) return;

      if (m.questions) {
        (m.questions as any[]).forEach(q => {
          totalQuestions++;
          const betAns = String(bet.answers[q.id]);
          const resAns = String(res.answers[q.id]);

          if (betAns.includes('-') && resAns.includes('-')) {
            const p = calculateSoccerPoints(betAns, resAns);
            points += p;
            if (p > 0) correct++;
          } else {
            if (betAns === resAns) {
              points += q.points;
              correct++;
            }
          }
        });
      }
    });

    const winRate = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return { points, correct, total: totalQuestions, winRate };
  });
};

// Detailed stats for charts
export type MatchHistoryItem = {
  matchName: string;
  date: string;
  points: number;
  correct: number;
  total: number;
};

export const getDetailedStats = async (userId: string): Promise<{
  history: MatchHistoryItem[];
  totalPoints: number;
  totalBets: number;
  winRate: number;
}> => {
  const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId);

  if (!bets || bets.length === 0) {
    return { history: [], totalPoints: 0, totalBets: 0, winRate: 0 };
  }

  const matchIds = bets.map((b: any) => b.match_id);

  const { data: matches } = await supabase.from('matches').select('*').in('id', matchIds).eq('status', 'FINISHED').order('start_time', { ascending: true });
  const { data: results } = await supabase.from('results').select('*').in('match_id', matchIds);

  if (!matches || !results) {
    return { history: [], totalPoints: 0, totalBets: 0, winRate: 0 };
  }

  const history: MatchHistoryItem[] = [];
  let totalPoints = 0;
  let totalCorrect = 0;
  let totalQuestions = 0;

  matches.forEach((m: any) => {
    const res = results.find((r: any) => r.match_id === m.id);
    const bet = bets.find((b: any) => b.match_id === m.id);

    if (!res || !bet || !m.questions) return;

    let matchPoints = 0;
    let matchCorrect = 0;
    let matchTotal = 0;

    (m.questions as any[]).forEach(q => {
      matchTotal++;
      const betAns = String(bet.answers[q.id]);
      const resAns = String(res.answers[q.id]);

      if (betAns.includes('-') && resAns.includes('-')) {
        const p = calculateSoccerPoints(betAns, resAns);
        matchPoints += p;
        if (p > 0) matchCorrect++;
      } else {
        if (betAns === resAns) {
          matchPoints += q.points;
          matchCorrect++;
        }
      }
    });

    history.push({
      matchName: `${m.player1} vs ${m.player2}`,
      date: new Date(m.start_time).toLocaleDateString('hu-HU'),
      points: matchPoints,
      correct: matchCorrect,
      total: matchTotal,
    });

    totalPoints += matchPoints;
    totalCorrect += matchCorrect;
    totalQuestions += matchTotal;
  });

  const winRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return { history, totalPoints, totalBets: bets.length, winRate };
};

export const getConsecutiveCorrectTips = async (userId: string): Promise<number> => {
  const { data: matches } = await supabase.from('matches').select('*').eq('status', 'FINISHED').order('start_time', { ascending: false });
  const { data: results } = await supabase.from('results').select('*');
  const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId);

  if (!matches || !results || !bets || matches.length === 0) return 0;

  let streak = 0;

  // Iterate through matches sorted by newest first
  for (const m of matches) {
    const res = results.find((r: any) => r.match_id === m.id);
    const bet = bets.find((b: any) => b.match_id === m.id);

    // If user didn't bet, streak breaks? Or we only count participated matches?
    // Rules say "Success in 3 matches in a row". 
    // If I skip a match, does it break streak? Usually yes.
    // But for simplicity, let's say "3 matches where I participated and got points". 
    // If I didn't participate, it might not break, but let's be strict: it breaks.
    // HOWEVER, "matches" contains ALL finished matches. 
    // Let's filter matches where the user actually placed a bet to be fair (Active Streak).

    if (!bet) continue; // Skip matches user didn't bet on? 
    // Or if I didn't bet, I didn't win. Streak resets.
    // Let's go with: Streak of "Correct Tips". 
    // If I bet on 3 matches and won all 3, that's a streak.

    let won = false;
    if (bet && res) {
      // Check if got ANY points
      if (m.questions) {
        (m.questions as any[]).forEach(q => {
          // Use new Soccer Logic
          const betAns = String(bet.answers[q.id]);
          const resAns = String(res.answers[q.id]);

          if (betAns.includes('-') && resAns.includes('-')) {
            const p = calculateSoccerPoints(betAns, resAns);
            if (p > 0) won = true;
          } else {
            if (betAns === resAns) {
              won = true;
            }
          }
        });
      }
    }

    if (won) {
      streak++;
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
};

export const didBetToday = async (userId: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  // Check bets with today's timestamp
  // Note: timestamps in DB are ISO strings. 
  // We can filter by "timestamp" column using string matching logic or client side.
  const { data: bets } = await supabase.from('bets').select('timestamp').eq('user_id', userId);

  if (!bets) return false;

  return bets.some((b: any) => b.timestamp && b.timestamp.startsWith(today));
};

// --- Chat ---

export const getChatMessages = async (champId: string): Promise<ChatMessage[]> => {
  // 1. Üzenetek lekérése join nélkül a stabilitásért
  const { data: msgs, error } = await supabase.from('chat_messages')
    .select('*')
    .eq('championship_id', champId)
    .order('timestamp', { ascending: true })
    .limit(50);

  if (error) {
    console.error("Chat error:", error);
    return [];
  }

  if (!msgs || msgs.length === 0) return [];

  // 2. Felhasználónevek lekérése külön
  const userIds = [...new Set(msgs.map((m: any) => m.user_id))];
  const { data: users } = await supabase.from('users').select('id, username').in('id', userIds);

  const userMap = users ? users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.username }), {}) : {};

  return msgs.map((d: any) => ({
    id: d.id,
    championshipId: d.championship_id,
    userId: d.user_id,
    username: userMap[d.user_id] || 'Ismeretlen',
    text: d.text,
    timestamp: d.timestamp
  }));
};

export const sendChatMessage = async (champId: string, userId: string, text: string) => {
  const { error } = await supabase.from('chat_messages').insert({
    championship_id: champId,
    user_id: userId,
    text,
    timestamp: new Date().toISOString()
  });
  if (error) throw error;
};