import React, { useState, useEffect } from 'react';
import { User, Championship, Match, QuestionType } from './types';
import * as db from './storage';
import { Trophy, Plus, LogOut, ChevronRight, User as UserIcon, Calendar, CheckCircle, Lock } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'AUTH' | 'DASHBOARD' | 'CHAMPIONSHIP'>('AUTH');
  const [activeChamp, setActiveChamp] = useState<Championship | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const u = db.getSession();
    if (u) { setUser(u); setPage('DASHBOARD'); }
    else setPage('AUTH');
  }, []);

  const triggerRefresh = () => setRefresh(prev => prev + 1);

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setPage('AUTH');
  };

  if (page === 'AUTH') return <AuthScreen onLogin={(u) => { setUser(u); setPage('DASHBOARD'); }} />;
  if (page === 'DASHBOARD') return <Dashboard user={user!} onOpenChamp={(c) => { setActiveChamp(c); setPage('CHAMPIONSHIP'); }} onLogout={handleLogout} />;
  if (page === 'CHAMPIONSHIP' && activeChamp) return <ChampionshipView user={user!} champ={activeChamp} onBack={() => { setPage('DASHBOARD'); setActiveChamp(null); }} triggerRefresh={refresh} />;

  return null;
}

// --- Képernyők ---

function AuthScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (isReg: boolean) => {
    if (!username) return;
    setLoading(true); setError('');
    try {
      const u = isReg ? await db.register(username) : await db.login(username);
      onLogin(u);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm bg-surface p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-primary/20 text-primary mb-4">
            <Trophy size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">HaverTipp</h1>
          <p className="text-muted text-sm mt-2">A haverok sportfogadó oldala</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase font-bold text-muted mb-1 block">Felhasználónév</label>
            <input 
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-primary outline-none transition-colors"
              placeholder="Írd be a neved..."
            />
          </div>
          
          {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg">{error}</div>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => handleSubmit(false)} disabled={loading} className="bg-surface border border-white/10 hover:bg-white/5 text-white py-2.5 rounded-lg font-medium transition-colors">
              Belépés
            </button>
            <button onClick={() => handleSubmit(true)} disabled={loading} className="bg-primary hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors">
              Regisztráció
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onOpenChamp, onLogout }: { user: User, onOpenChamp: (c: Championship) => void, onLogout: () => void }) {
  const [champs, setChamps] = useState<Championship[]>([]);
  const [newChampName, setNewChampName] = useState('');
  const [newChampCode, setNewChampCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const load = async () => setChamps(await db.getMyChamps(user.id));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newChampName || !newChampCode) return;
    try { await db.createChamp(newChampName, newChampCode, user.id); setNewChampName(''); setNewChampCode(''); load(); }
    catch (e) { alert('Hiba történt vagy foglalt a kód'); }
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    try { await db.joinChamp(joinCode, user.id); setJoinCode(''); load(); }
    catch (e) { alert('Hiba történt vagy rossz a kód'); }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center font-bold text-lg">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-white leading-tight">Szia, {user.username}!</h2>
            <p className="text-xs text-muted">Jó tippelést mára!</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-muted hover:text-white transition-colors"><LogOut size={20} /></button>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><Trophy size={18} className="text-accent" /> Bajnokságaim</h3>
          {champs.length === 0 ? (
            <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-muted">
              Még nem vagy tagja egy bajnokságnak sem.
            </div>
          ) : (
            champs.map(c => (
              <div key={c.id} onClick={() => onOpenChamp(c)} className="group bg-surface border border-white/10 p-5 rounded-xl cursor-pointer hover:border-primary/50 transition-all relative overflow-hidden">
                 <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h4 className="font-bold text-white text-lg">{c.name}</h4>
                      <code className="text-xs bg-black/30 px-2 py-0.5 rounded text-primary">{c.joinCode}</code>
                    </div>
                    <ChevronRight className="text-muted group-hover:text-primary transition-colors" />
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-surface p-5 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Új Bajnokság</h3>
            <div className="space-y-3">
              <input className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white" placeholder="Név (pl. EB 2024)" value={newChampName} onChange={e => setNewChampName(e.target.value)} />
              <input className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white" placeholder="Egyedi kód" value={newChampCode} onChange={e => setNewChampCode(e.target.value)} />
              <button onClick={handleCreate} className="w-full bg-primary hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Létrehozás</button>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Csatlakozás</h3>
            <div className="space-y-3">
              <input className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-white" placeholder="Belépőkód" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              <button onClick={handleJoin} className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium border border-white/10">Csatlakozás</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChampionshipView({ user, champ, onBack, triggerRefresh }: { user: User, champ: Championship, onBack: () => void, triggerRefresh: number }) {
  const [tab, setTab] = useState<'MATCHES' | 'TABLE'>('MATCHES');
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = champ.adminId === user.id;

  const load = async () => setMatches(await db.getMatches(champ.id));
  useEffect(() => { load(); }, [champ, triggerRefresh]);

  const handleMatchCreate = async (m: any) => {
    await db.createMatch(m);
    setShowCreate(false);
    load();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-sm text-muted hover:text-white mb-6 flex items-center gap-1">← Vissza</button>
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{champ.name}</h1>
          <div className="text-sm text-muted mt-1">Belépőkód: <span className="text-primary font-mono">{champ.joinCode}</span></div>
        </div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Plus size={16}/> Új Meccs</button>}
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button onClick={() => setTab('MATCHES')} className={`pb-3 text-sm font-medium transition-colors ${tab === 'MATCHES' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}>Mérkőzések</button>
        <button onClick={() => setTab('TABLE')} className={`pb-3 text-sm font-medium transition-colors ${tab === 'TABLE' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}>Tabella</button>
      </div>

      {tab === 'MATCHES' ? (
        <div className="space-y-4">
          {matches.length === 0 ? <div className="text-center py-10 text-muted">Nincsenek még meccsek rögzítve.</div> : 
           matches.map(m => <MatchCard key={m.id} match={m} user={user} isAdmin={isAdmin} refresh={load} />)}
        </div>
      ) : (
        <Leaderboard champ={champ} />
      )}

      {showCreate && <CreateMatchModal champId={champ.id} onClose={() => setShowCreate(false)} onSave={handleMatchCreate} />}
    </div>
  );
}

function MatchCard({ match, user, isAdmin, refresh }: { match: Match, user: User, isAdmin: boolean, refresh: () => void }) {
  const [hasBet, setHasBet] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'BET' | 'RESULT' | null>(null);

  const start = new Date(match.startTime);
  const isLocked = new Date() > start;
  const isFinished = match.status === 'FINISHED';

  useEffect(() => {
    const bets = db.getBets(match.id);
    const myBet = bets.find(b => b.userId === user.id);
    setHasBet(!!myBet);

    if (isFinished && myBet) {
      const results = db.getResults().find(r => r.matchId === match.id);
      if (results) {
        let p = 0;
        match.questions.forEach(q => { if (String(myBet.answers[q.id]) === String(results.answers[q.id])) p += q.points; });
        setPoints(p);
      }
    }
  }, [match, user, isFinished]);

  return (
    <>
      <div className={`bg-surface border border-white/10 rounded-xl p-5 relative overflow-hidden ${isFinished ? 'opacity-75' : ''}`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isFinished ? 'bg-muted' : isLocked ? 'bg-accent' : 'bg-primary'}`} />
        
        <div className="flex justify-between items-start mb-4 pl-3">
          <div className="text-xs text-muted font-bold uppercase flex items-center gap-1.5">
            <Calendar size={12} /> {start.toLocaleDateString()} {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </div>
          <div className="flex gap-2">
             {isFinished && <span className="text-[10px] bg-white/10 text-muted px-2 py-0.5 rounded">VÉGE</span>}
             {points !== null && <span className="text-[10px] bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-0.5 rounded font-bold">+{points} PONT</span>}
          </div>
        </div>

        <div className="flex items-center justify-between pl-3 mb-6">
          <div className="text-lg font-bold text-white">{match.player1}</div>
          <div className="text-sm text-muted font-bold px-4">VS</div>
          <div className="text-lg font-bold text-white text-right">{match.player2}</div>
        </div>

        <div className="flex justify-between items-center pl-3 pt-4 border-t border-white/5">
          <div className="text-xs text-muted">{match.questions.length} kérdés</div>
          <div className="flex gap-2">
            {!isFinished && !isLocked && (
              <button onClick={() => setModalMode('BET')} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${hasBet ? 'border-white/20 text-white hover:bg-white/5' : 'bg-primary border-transparent text-white hover:bg-blue-600'}`}>
                {hasBet ? 'Tipp módosítása' : 'Tipp leadása'}
              </button>
            )}
            {isAdmin && !isFinished && (
              <button onClick={() => setModalMode('RESULT')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white hover:bg-white/10">
                Eredmény írása
              </button>
            )}
          </div>
        </div>
      </div>
      {modalMode === 'BET' && <BetModal match={match} user={user} onClose={() => { setModalMode(null); refresh(); }} />}
      {modalMode === 'RESULT' && <ResultModal match={match} onClose={() => { setModalMode(null); refresh(); }} />}
    </>
  );
}

function BetModal({ match, user, onClose }: { match: Match, user: User, onClose: () => void }) {
  const [answers, setAnswers] = useState<any>({});

  useEffect(() => {
    const bets = db.getBets(match.id);
    const myBet = bets.find(b => b.userId === user.id);
    if (myBet) setAnswers(myBet.answers);
  }, []);

  const save = async () => {
    await db.saveBet({ userId: user.id, matchId: match.id, answers, timestamp: new Date().toISOString() });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-white text-lg mb-6">Tipp leadása</h3>
        <div className="space-y-6">
          {match.questions.map(q => (
            <div key={q.id}>
              <div className="text-sm text-muted mb-2">{q.label} <span className="text-primary text-xs">({q.points}p)</span></div>
              {q.type === QuestionType.WINNER ? (
                <div className="grid grid-cols-2 gap-2">
                  {[match.player1, match.player2].map(p => (
                    <button key={p} onClick={() => setAnswers({...answers, [q.id]: p})} className={`p-2 rounded border text-sm ${answers[q.id] === p ? 'bg-primary border-primary text-white' : 'bg-black/20 border-white/10 text-muted'}`}>{p}</button>
                  ))}
                </div>
              ) : q.type === QuestionType.OVER_UNDER ? (
                <div className="grid grid-cols-2 gap-2">
                  {['OVER', 'UNDER'].map(o => (
                     <button key={o} onClick={() => setAnswers({...answers, [q.id]: o})} className={`p-2 rounded border text-sm ${answers[q.id] === o ? 'bg-primary border-primary text-white' : 'bg-black/20 border-white/10 text-muted'}`}>{o === 'OVER' ? 'Felett' : 'Alatt'}</button>
                  ))}
                </div>
              ) : (
                <input value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="text-muted text-sm hover:text-white">Mégse</button>
          <button onClick={save} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Mentés</button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ match, onClose }: { match: Match, onClose: () => void }) {
  const [answers, setAnswers] = useState<any>({});
  const save = async () => {
    if(!confirm('Ez lezárja a meccset!')) return;
    await db.closeMatch({ matchId: match.id, answers });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 p-6">
        <h3 className="font-bold text-white text-lg mb-6">Eredmény rögzítése (Admin)</h3>
        <div className="space-y-4">
           {match.questions.map(q => (
             <div key={q.id}>
               <div className="text-xs text-muted mb-1">{q.label}</div>
               <input value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm" placeholder="Helyes válasz..." />
             </div>
           ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-muted text-sm">Mégse</button>
          <button onClick={save} className="bg-secondary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Lezárás</button>
        </div>
      </div>
    </div>
  )
}

function CreateMatchModal({ champId, onClose, onSave }: { champId: string, onClose: () => void, onSave: (m: any) => void }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [date, setDate] = useState('');
  
  const handleSave = () => {
    if(!p1 || !p2 || !date) return;
    const questions: any[] = [
        { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2 },
        { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos eredmény', points: 5 },
    ];
    onSave({ championshipId: champId, player1: p1, player2: p2, startTime: new Date(date).toISOString(), status: 'SCHEDULED', questions });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl border border-white/10 p-6">
        <h3 className="font-bold text-white text-lg mb-6">Új Meccs</h3>
        <div className="space-y-4">
          <input className="w-full bg-black/20 border border-white/10 p-2 rounded text-white" placeholder="Hazai" value={p1} onChange={e => setP1(e.target.value)} />
          <input className="w-full bg-black/20 border border-white/10 p-2 rounded text-white" placeholder="Vendég" value={p2} onChange={e => setP2(e.target.value)} />
          <input type="datetime-local" className="w-full bg-black/20 border border-white/10 p-2 rounded text-white" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-muted text-sm">Mégse</button>
          <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded text-sm">Létrehozás</button>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ champ }: { champ: Championship }) {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const calc = async () => {
      const matches = await db.getMatches(champ.id);
      const results = db.getResults();
      const users = db.getAllUsers();
      const scores: Record<string, number> = {};
      
      champ.participants.forEach(u => scores[u] = 0);
      
      matches.filter(m => m.status === 'FINISHED').forEach(m => {
        const result = results.find(r => r.matchId === m.id);
        if(!result) return;
        const bets = db.getBets(m.id);
        bets.forEach(b => {
          if(scores[b.userId] === undefined) return;
          m.questions.forEach(q => {
             if(String(b.answers[q.id]) === String(result.answers[q.id])) scores[b.userId] += q.points;
          });
        });
      });
      setData(Object.entries(scores).map(([uid, pts]) => ({ uid, name: users[uid] || '?', pts })).sort((a,b) => b.pts - a.pts));
    };
    calc();
  }, [champ]);

  return (
    <div className="bg-surface rounded-xl border border-white/10 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-white/5 text-xs text-muted uppercase">
          <tr><th className="p-4">#</th><th className="p-4">Név</th><th className="p-4 text-right">Pont</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((d, i) => (
            <tr key={d.uid}>
              <td className="p-4 text-muted">{i+1}</td>
              <td className="p-4 text-white font-medium">{d.name}</td>
              <td className="p-4 text-right text-primary font-bold">{d.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}