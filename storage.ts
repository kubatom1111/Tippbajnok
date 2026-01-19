import { createClient } from '@supabase/supabase-js';
import { User, Championship, Match, Bet, MatchResult, ChatMessage } from './types';

// A megadott adatok alapján beállítva - így nem kérdezi a rendszer indításkor
const SUPABASE_URL = 'https://eygkkjaktjongxzrzknv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_loyC2ExGvYpKeSiCiCHgSg_I-1AXcUG';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Auth ---

export const register = async (username: string, password: string): Promise<User> => {
  // Ellenőrizzük, hogy létezik-e
  const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
  if (existing) throw new Error('Foglalt felhasználónév!');

  const passwordHash = btoa(password); // Demo hash
  
  const { data, error } = await supabase.from('users').insert({
    username,
    password_hash: passwordHash
  }).select().single();

  if (error) throw error;
  
  const user = { id: data.id, username: data.username };
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
    if(error) return [];
    return data.map((d: any) => ({
        userId: d.user_id,
        matchId: d.match_id,
        answers: d.answers,
        timestamp: d.timestamp
    }));
}

export const fetchResults = async (): Promise<MatchResult[]> => {
    const { data } = await supabase.from('results').select('*');
    return data ? data.map((d:any) => ({ matchId: d.match_id, answers: d.answers })) : [];
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
    return data ? data.reduce((acc: any, u: any) => ({...acc, [u.id]: u.username}), {}) : {};
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

// --- Chat ---

export const getChatMessages = async (champId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase.from('chat_messages')
        .select(`
            id, 
            championship_id, 
            user_id, 
            text, 
            timestamp, 
            users ( username )
        `)
        .eq('championship_id', champId)
        .order('timestamp', { ascending: true })
        .limit(50);

    if (error) {
        // Fallback if table doesn't exist yet in the user's supabase project
        console.error("Chat error (table missing?):", error);
        return [];
    }

    return data.map((d: any) => ({
        id: d.id,
        championshipId: d.championship_id,
        userId: d.user_id,
        username: d.users?.username || 'Ismeretlen',
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