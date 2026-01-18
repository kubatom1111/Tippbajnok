import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Championship, Match, Bet, MatchResult, ChatMessage } from './types';

let supabase: SupabaseClient | null = null;

// Konfiguráció betöltése vagy mentése
export const isConfigured = () => {
  return !!localStorage.getItem('ht_sb_url') && !!localStorage.getItem('ht_sb_key');
};

export const configureSupabase = (url: string, key: string) => {
  localStorage.setItem('ht_sb_url', url);
  localStorage.setItem('ht_sb_key', key);
  supabase = createClient(url, key);
};

// Inicializálás induláskor
const storedUrl = localStorage.getItem('ht_sb_url');
const storedKey = localStorage.getItem('ht_sb_key');
if (storedUrl && storedKey) {
  supabase = createClient(storedUrl, storedKey);
}

const getClient = () => {
  if (!supabase) throw new Error("Az adatbázis nincs beállítva!");
  return supabase;
};

// --- Auth ---

export const register = async (username: string, password: string): Promise<User> => {
  const sb = getClient();
  
  // Ellenőrizzük, hogy létezik-e
  const { data: existing } = await sb.from('users').select('id').eq('username', username).single();
  if (existing) throw new Error('Foglalt felhasználónév!');

  const passwordHash = btoa(password); // Productionben ezt nem így csináljuk, de demohoz ok
  
  const { data, error } = await sb.from('users').insert({
    username,
    password_hash: passwordHash
  }).select().single();

  if (error) throw error;
  
  const user = { id: data.id, username: data.username };
  localStorage.setItem('ht_session', JSON.stringify(user));
  return user;
};

export const login = async (username: string, password: string): Promise<User> => {
  const sb = getClient();
  const hash = btoa(password);

  const { data, error } = await sb.from('users')
    .select('*')
    .eq('username', username)
    .eq('password_hash', hash)
    .single();

  if (error || !data) throw new Error('Hibás felhasználónév vagy jelszó!');

  const user = { id: data.id, username: data.username };
  localStorage.setItem('ht_session', JSON.stringify(user));
  return user;
};

export const getSession = (): User | null => {
  const s = localStorage.getItem('ht_session');
  return s ? JSON.parse(s) : null;
};

export const logout = () => {
    localStorage.removeItem('ht_session');
    // Opcionálisan törölhetjük a configot is, ha teljes reset kell:
    // localStorage.removeItem('ht_sb_url');
    // localStorage.removeItem('ht_sb_key');
};

export const resetConfig = () => {
    localStorage.clear();
    location.reload();
}

// --- Logic ---

export const createChamp = async (name: string, code: string, adminId: string) => {
  const sb = getClient();
  
  const { data: existing } = await sb.from('championships').select('id').eq('join_code', code).single();
  if (existing) throw new Error('A kód foglalt!');

  const { error } = await sb.from('championships').insert({
      name,
      join_code: code,
      admin_id: adminId,
      participants: [adminId] // JSONB array
  });

  if (error) throw error;
};

export const joinChamp = async (code: string, userId: string) => {
  const sb = getClient();
  
  const { data: champ, error } = await sb.from('championships').select('*').eq('join_code', code).single();
  if (error || !champ) throw new Error('Érvénytelen kód!');

  const participants: string[] = champ.participants || [];
  if (!participants.includes(userId)) {
      participants.push(userId);
      const { error: updateError } = await sb.from('championships')
        .update({ participants })
        .eq('id', champ.id);
      if (updateError) throw updateError;
  }
};

export const getMyChamps = async (userId: string): Promise<Championship[]> => {
  const sb = getClient();
  // Supabase postgREST filter jsonb contains
  const { data, error } = await sb.from('championships').select('*').contains('participants', JSON.stringify([userId]));
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
  const sb = getClient();
  const { data, error } = await sb.from('matches')
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
  const sb = getClient();
  const { error } = await sb.from('matches').insert({
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
  const sb = getClient();
  // Upsert logic using user_id + match_id unique constraint
  const { error } = await sb.from('bets').upsert({
      user_id: bet.userId,
      match_id: bet.matchId,
      answers: bet.answers,
      timestamp: bet.timestamp
  }, { onConflict: 'user_id,match_id' });
  
  if (error) throw error;
};

export const getBets = (matchId: string): Bet[] => {
  // Ez most async kellene legyen, de a komponens szinkron hívja.
  // Mivel a React `useEffect`-ben van, át kell írni azt is.
  // De a gyors fix érdekében: csináljunk egy async loadert a komponensben.
  // ITT most visszatérünk egy üres tömbbel, és csinálunk egy async verziót.
  return []; 
};

// Async bet loader
export const fetchBetsForMatch = async (matchId: string): Promise<Bet[]> => {
    const sb = getClient();
    const { data, error } = await sb.from('bets').select('*').eq('match_id', matchId);
    if(error) return [];
    return data.map((d: any) => ({
        userId: d.user_id,
        matchId: d.match_id,
        answers: d.answers,
        timestamp: d.timestamp
    }));
}

export const getResults = (): MatchResult[] => {
    return []; // Placeholder, use async
};

export const fetchResults = async (): Promise<MatchResult[]> => {
    const sb = getClient();
    const { data } = await sb.from('results').select('*');
    return data ? data.map((d:any) => ({ matchId: d.match_id, answers: d.answers })) : [];
}

export const closeMatch = async (result: MatchResult) => {
  const sb = getClient();
  
  // 1. Save Result
  await sb.from('results').upsert({
      match_id: result.matchId,
      answers: result.answers
  });

  // 2. Update Match Status
  await sb.from('matches').update({ status: 'FINISHED' }).eq('id', result.matchId);
};

export const getAllUsers = async () => {
    const sb = getClient();
    const { data } = await sb.from('users').select('id, username');
    return data ? data.reduce((acc: any, u: any) => ({...acc, [u.id]: u.username}), {}) : {};
};

export const getGlobalStats = async () => {
  const sb = getClient();
  
  // Ez egy komplex lekérdezés lenne SQL-ben, de itt kliens oldalon rakjuk össze
  const { data: users } = await sb.from('users').select('id, username');
  const { data: matches } = await sb.from('matches').select('*').eq('status', 'FINISHED');
  const { data: results } = await sb.from('results').select('*');
  const { data: bets } = await sb.from('bets').select('*');

  if (!users || !matches || !results || !bets) return [];

  const stats: Record<string, { username: string, points: number, correct: number }> = {};
  users.forEach((u: any) => {
      stats[u.id] = { username: u.username, points: 0, correct: 0 };
  });

  matches.forEach((m: any) => {
      const res = results.find((r: any) => r.match_id === m.id);
      if(!res) return;

      const matchBets = bets.filter((b: any) => b.match_id === m.id);
      matchBets.forEach((b: any) => {
          if(!stats[b.user_id]) return;
          (m.questions as any[]).forEach(q => {
              if (String(b.answers[q.id]) === String(res.answers[q.id])) {
                  stats[b.user_id].points += q.points;
                  stats[b.user_id].correct++;
              }
          });
      });
  });

  return Object.values(stats).sort((a,b) => b.points - a.points);
};