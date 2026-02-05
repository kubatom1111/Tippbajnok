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

// --- Missions Persistence ---

const MISSION_STORAGE_KEY = 'ht_mission_claims';

export const getMissionClaims = (): Record<number, string> => {
  const s = localStorage.getItem(MISSION_STORAGE_KEY);
  return s ? JSON.parse(s) : {};
};

export const saveMissionClaim = (missionId: number) => {
  const claims = getMissionClaims();
  claims[missionId] = new Date().toISOString(); // Store timestamp
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

export const getGlobalStats = async () => {
  // Ez egy komplex lekérdezés lenne SQL-ben, de itt kliens oldalon rakjuk össze
  const { data: users } = await supabase.from('users').select('id, username');
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
      (m.questions as any[]).forEach(q => {
        if (String(b.answers[q.id]) === String(res.answers[q.id])) {
          stats[b.user_id].points += q.points;
          stats[b.user_id].correct++;
        }
      });
    });
  });

  return Object.values(stats).sort((a, b) => b.points - a.points);
};

export const getUserStats = async (userId: string) => {
  const { data: matches } = await supabase.from('matches').select('*').eq('status', 'FINISHED');
  const { data: results } = await supabase.from('results').select('*');
  const { data: bets } = await supabase.from('bets').select('*').eq('user_id', userId);

  if (!matches || !results || !bets) return { points: 0, correct: 0, total: 0, winRate: 0 };

  let points = 0;
  let correct = 0;
  let totalQuestions = 0;

  matches.forEach((m: any) => {
    const res = results.find((r: any) => r.match_id === m.id);
    if (!res) return;

    const bet = bets.find((b: any) => b.match_id === m.id);
    if (!bet) return;

    (m.questions as any[]).forEach(q => {
      totalQuestions++;
      if (String(bet.answers[q.id]) === String(res.answers[q.id])) {
        points += q.points;
        correct++;
      }
    });
  });

  const winRate = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  return { points, correct, total: totalQuestions, winRate };
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
          if (String(bet.answers[q.id]) === String(res.answers[q.id])) {
            won = true;
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