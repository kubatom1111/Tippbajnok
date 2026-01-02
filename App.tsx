import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Championship, Match, QuestionType, ChatMessage } from './types';
import * as db from './storage';
import { Trophy, Plus, LogOut, ChevronRight, Calendar, User as UserIcon, MessageSquare, Send, Activity, Target, Medal, BarChart3, ArrowRight } from 'lucide-react';

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'AUTH' | 'DASHBOARD' | 'MY_TIPS' | 'GLOBAL_LEADERBOARD' | 'CHAMPIONSHIP'>('AUTH');
  const [activeChamp, setActiveChamp] = useState<Championship | null>(null);
  const [refresh, setRefresh] = useState(0);

  // Global Stats state
  const [globalStats, setGlobalStats] = useState({ totalTips: 0, correctTips: 0, totalPoints: 0 });

  useEffect(() => {
    const u = db.getSession();
    if (u) { setUser(u); setPage('DASHBOARD'); }
    else setPage('AUTH');
  }, []);

  // Globális statisztikák számolása a Footerhez
  useEffect(() => {
    if (!user) return;
    const calcStats = async () => {
      const champs = await db.getMyChamps(user.id);
      let tTips = 0;
      let cTips = 0;
      let tPoints = 0;

      for (const champ of champs) {
        const matches = await db.getMatches(champ.id);
        const results = db.getResults();
        
        for (const m of matches) {
           const bets = db.getBets(m.id);
           const myBet = bets.find(b => b.userId === user.id);
           if (myBet) {
             tTips++;
             const result = results.find(r => r.matchId === m.id);
             if (result) {
               m.questions.forEach(q => {
                 if (String(myBet.answers[q.id]) === String(result.answers[q.id])) {
                   cTips++;
                   tPoints += q.points;
                 }
               });
             }
           }
        }
      }
      setGlobalStats({ totalTips: tTips, correctTips: cTips, totalPoints: tPoints });
    };
    calcStats();
  }, [user, refresh, page]);

  const triggerRefresh = () => setRefresh(prev => prev + 1);

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setPage('AUTH');
  };

  if (page === 'AUTH') return <AuthScreen onLogin={(u) => { setUser(u); setPage('DASHBOARD'); }} />;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* Navbar - Dark Teal */}
      <nav className="bg-primary text-white px-6 py-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => {setPage('DASHBOARD'); setActiveChamp(null);}}>
            <div className="bg-white text-primary p-1.5 rounded-lg"><Trophy size={20} fill="currentColor" /></div>
            <span>HaverTipp</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button onClick={() => {setPage('DASHBOARD'); setActiveChamp(null);}} className={`hover:text-secondary transition-colors ${page === 'DASHBOARD' ? 'text-secondary' : 'text-slate-300'}`}>Bajnokságok</button>
            <button onClick={() => {setPage('MY_TIPS'); setActiveChamp(null);}} className={`hover:text-secondary transition-colors ${page === 'MY_TIPS' ? 'text-secondary' : 'text-slate-300'}`}>Saját Tippek</button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
               <span className="flex items-center gap-2"><UserIcon size={16} /> {user?.username}</span>
               <button onClick={handleLogout}><LogOut size={16} className="text-slate-400 hover:text-red-400" /></button>
            </div>
          </div>
          
          {/* Mobile menu placeholder */}
          <div className="md:hidden flex items-center gap-3">
             <span>{user?.username}</span>
             <button onClick={handleLogout}><LogOut size={18} /></button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {page === 'DASHBOARD' && <Dashboard user={user!} onOpenChamp={(c) => { setActiveChamp(c); setPage('CHAMPIONSHIP'); }} triggerRefresh={refresh} />}
        {page === 'MY_TIPS' && <MyTipsScreen stats={globalStats} user={user!} goDashboard={() => setPage('DASHBOARD')} />}
        {page === 'CHAMPIONSHIP' && activeChamp && <ChampionshipView user={user!} champ={activeChamp} onBack={() => { setPage('DASHBOARD'); setActiveChamp(null); }} triggerRefresh={refresh} />}
      </main>

      {/* Fixed Bottom Footer Stats */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-primary/10 py-3 px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-6xl mx-auto flex justify-center md:justify-around items-center gap-8 text-primary">
           <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Összes tipp</span>
              <div className="flex items-center gap-1.5 font-bold text-lg"><Target size={18} /> {globalStats.totalTips}</div>
           </div>
           <div className="h-8 w-px bg-primary/10"></div>
           <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Helyes tipp</span>
              <div className="flex items-center gap-1.5 font-bold text-lg"><Activity size={18} /> {globalStats.correctTips}</div>
           </div>
           <div className="h-8 w-px bg-primary/10"></div>
           <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Pontok</span>
              <div className="flex items-center gap-1.5 font-bold text-lg"><Medal size={18} /> {globalStats.totalPoints}</div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Screens ---

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
      <div className="w-full max-w-md bg-surface p-10 rounded-3xl border border-primary/5 shadow-xl text-center">
        <div className="inline-flex p-4 rounded-full bg-input text-primary mb-6">
          <LogOut size={32} className="rotate-180" /> {/* Just an icon resembling login */}
        </div>
        
        <h1 className="text-3xl font-bold text-primary mb-2">Bejelentkezés</h1>
        <p className="text-muted mb-8">Lépj be a fiókodba és kezdj el tippelni</p>
        
        <div className="space-y-5 text-left">
          <div>
            <label className="text-sm font-semibold text-primary mb-1.5 block">Felhasználónév</label>
            <input 
              value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-input border-transparent rounded-xl p-3.5 text-primary placeholder-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
              placeholder="Add meg a felhasználóneved"
            />
          </div>
          
          {/* Fake password for visual match with image, technically ignored by current dummy auth */}
          <div>
            <label className="text-sm font-semibold text-primary mb-1.5 block">Jelszó</label>
            <input 
              type="password"
              className="w-full bg-input border-transparent rounded-xl p-3.5 text-primary placeholder-primary/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
              placeholder="Add meg a jelszavad"
            />
          </div>
          
          {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg font-medium">{error}</div>}

          <button onClick={() => handleSubmit(false)} disabled={loading} className="w-full bg-primary hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all mt-4">
            Bejelentkezés
          </button>
          
          <div className="text-center mt-6 text-sm text-muted">
             Még nincs fiókod? <button onClick={() => handleSubmit(true)} className="font-bold text-primary hover:underline">Regisztrálj most</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onOpenChamp, triggerRefresh }: { user: User, onOpenChamp: (c: Championship) => void, triggerRefresh: number }) {
  const [champs, setChamps] = useState<Championship[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => setChamps(await db.getMyChamps(user.id));
  useEffect(() => { load(); }, [triggerRefresh]);

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
         <div>
            <h1 className="text-4xl font-extrabold text-primary mb-2">Bajnokságok</h1>
            <p className="text-muted font-medium">Hozz létre új bajnokságot vagy csatlakozz meglévőhöz</p>
         </div>
         <button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all">
            <Plus size={18} /> Új bajnokság
         </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {champs.length === 0 ? (
          <div className="col-span-full py-16 text-center">
             <div className="bg-surface inline-block p-6 rounded-full mb-4 shadow-sm"><Trophy size={48} className="text-accent opacity-50"/></div>
             <h3 className="text-xl font-bold text-primary">Még nincsenek bajnokságaid</h3>
             <p className="text-muted mt-2">Hozz létre egyet a fenti gombbal!</p>
          </div>
        ) : (
          champs.map(c => (
             <div key={c.id} onClick={() => onOpenChamp(c)} className="bg-surface p-6 rounded-2xl border-2 border-transparent hover:border-primary/10 shadow-card hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-64 relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Aktív</div>
                
                <div>
                  <div className="w-12 h-12 bg-input rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                      <Trophy size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2 line-clamp-1">{c.name}</h3>
                  <p className="text-muted text-sm line-clamp-2">Baráti tippverseny a legjobb sporteseményekre.</p>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-primary/5">
                   <div className="flex items-center gap-2 text-xs font-medium text-muted">
                      <Calendar size={14} /> 2024. Szezon
                   </div>
                   <div className="flex items-center gap-2 text-xs font-medium text-muted">
                      <UserIcon size={14} /> {c.participants.length} résztvevő
                   </div>
                   <div className="text-[10px] font-bold text-primary mt-2">
                      Kód: <span className="font-mono bg-white px-1 rounded">{c.joinCode}</span>
                   </div>
                </div>
             </div>
          ))
        )}
      </div>

      {showCreate && <CreateChampModal userId={user.id} onClose={() => {setShowCreate(false); load();}} />}
    </div>
  );
}

function MyTipsScreen({ stats, user, goDashboard }: { stats: any, user: User, goDashboard: () => void }) {
  // Ez az oldal a 2. kép alapján ("Saját tippjeim")
  return (
    <div>
       <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-primary mb-2">Saját tippjeim</h1>
          <p className="text-muted font-medium">Tekintsd meg az összes leadott tipped és a megszerzett pontokat</p>
       </div>

       {/* Summary Cards */}
       <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-surface p-8 rounded-2xl shadow-card text-center border border-primary/5">
             <div className="w-14 h-14 mx-auto bg-input rounded-full flex items-center justify-center text-primary mb-4">
               <Target size={28} />
             </div>
             <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Összes tipp</div>
             <div className="text-4xl font-extrabold text-primary">{stats.totalTips}</div>
          </div>
          <div className="bg-surface p-8 rounded-2xl shadow-card text-center border border-primary/5">
             <div className="w-14 h-14 mx-auto bg-surface border-2 border-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
               <Trophy size={28} />
             </div>
             <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Helyes tipp</div>
             <div className="text-4xl font-extrabold text-primary">{stats.correctTips}</div>
          </div>
          <div className="bg-surface p-8 rounded-2xl shadow-card text-center border border-primary/5">
             <div className="w-14 h-14 mx-auto bg-input rounded-full flex items-center justify-center text-primary mb-4">
               <Medal size={28} />
             </div>
             <div className="text-sm font-bold text-muted uppercase tracking-wider mb-1">Összes pont</div>
             <div className="text-4xl font-extrabold text-primary">{stats.totalPoints}</div>
          </div>
       </div>

       {/* Empty State CTA */}
       {stats.totalTips === 0 && (
         <div className="bg-surface rounded-3xl p-12 text-center border border-primary/5 shadow-card">
            <div className="w-20 h-20 bg-input rounded-full flex items-center justify-center text-primary mx-auto mb-6">
               <Target size={40} />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Még nincsenek tippjeid</h2>
            <p className="text-muted mb-8 max-w-md mx-auto">Menj a bajnokságokhoz, válassz ki egy aktív meccset és kezdj el tippelni, hogy felkerülj a ranglistára!</p>
            <button onClick={goDashboard} className="bg-primary hover:bg-slate-800 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all">
               Bajnokságok megtekintése
            </button>
         </div>
       )}
    </div>
  );
}

function ChampionshipView({ user, champ, onBack, triggerRefresh }: { user: User, champ: Championship, onBack: () => void, triggerRefresh: number }) {
  const [tab, setTab] = useState<'MATCHES' | 'TABLE' | 'CHAT'>('MATCHES');
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
    <div>
      <button onClick={onBack} className="text-sm font-bold text-muted hover:text-primary mb-6 flex items-center gap-1 transition-colors">← Vissza a bajnokságokhoz</button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="p-2 bg-input rounded-lg text-primary"><Trophy size={20} /></div>
             <span className="text-sm font-bold text-secondary uppercase tracking-wider">Bajnokság</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-extrabold text-primary">{champ.name}</h1>
        </div>
        
        {isAdmin && tab === 'MATCHES' && (
          <button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md">
            <Plus size={16}/> Új Meccs
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/50 p-1 rounded-xl w-fit mb-8">
         {['MATCHES', 'TABLE', 'CHAT'].map((t) => (
           <button 
             key={t}
             onClick={() => setTab(t as any)}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-primary text-white shadow-md' : 'text-muted hover:bg-white'}`}
           >
             {t === 'MATCHES' ? 'Mérkőzések' : t === 'TABLE' ? 'Ranglista' : 'Üzenőfal'}
           </button>
         ))}
      </div>

      {tab === 'MATCHES' ? (
        <div className="grid gap-4">
          {matches.length === 0 ? <div className="text-center py-16 text-muted font-medium bg-surface rounded-2xl border border-primary/5">Nincsenek még meccsek rögzítve ebben a bajnokságban.</div> : 
           matches.map(m => <MatchCard key={m.id} match={m} user={user} isAdmin={isAdmin} refresh={load} />)}
        </div>
      ) : tab === 'TABLE' ? (
        <Leaderboard champ={champ} />
      ) : (
        <ChatTab user={user} champ={champ} />
      )}

      {showCreate && <CreateMatchModal champId={champ.id} onClose={() => setShowCreate(false)} onSave={handleMatchCreate} />}
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
      const scores: Record<string, any> = {};
      
      champ.participants.forEach(u => scores[u] = { pts: 0, tips: 0, correct: 0 });
      
      matches.filter(m => m.status === 'FINISHED').forEach(m => {
        const result = results.find(r => r.matchId === m.id);
        if(!result) return;
        const bets = db.getBets(m.id);
        bets.forEach(b => {
          if(!scores[b.userId]) return;
          scores[b.userId].tips++;
          m.questions.forEach(q => {
             if(String(b.answers[q.id]) === String(result.answers[q.id])) {
               scores[b.userId].pts += q.points;
               scores[b.userId].correct++;
             }
          });
        });
      });
      setData(Object.entries(scores).map(([uid, s]) => ({ uid, name: users[uid] || '?', ...s })).sort((a,b) => b.pts - a.pts));
    };
    calc();
  }, [champ]);

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
         <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
           <Trophy size={32} />
         </div>
         <h2 className="text-3xl font-extrabold text-primary">Ranglista</h2>
         <p className="text-muted">A legjobb tippelők versenyeznek a csúcsért</p>
      </div>

      <div className="grid gap-3 max-w-3xl mx-auto">
        {data.map((d, i) => (
           <div key={d.uid} className={`relative flex items-center p-5 rounded-xl border transition-all ${i === 0 ? 'bg-surface border-accent/30 shadow-lg scale-105 z-10' : 'bg-surface border-primary/5 hover:border-primary/20'}`}>
              <div className="w-10 font-bold text-xl text-muted text-center flex-shrink-0">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div className="ml-4 flex-1">
                 <div className="font-bold text-primary text-lg flex items-center gap-2">
                    {d.name}
                    {i === 0 && <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Bajnok</span>}
                 </div>
                 <div className="text-xs text-muted font-medium mt-1">{d.tips} tipp &bull; {d.correct} helyes</div>
              </div>
              <div className="text-right">
                 <div className="text-[10px] uppercase font-bold text-muted tracking-wider">Pontok</div>
                 <div className="text-3xl font-extrabold text-primary">{d.pts}</div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match, user, isAdmin, refresh }: { match: Match, user: User, isAdmin: boolean, refresh: () => void | Promise<void> }) {
  const [hasBet, setHasBet] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'BET' | 'RESULT' | null>(null);
  const [stats, setStats] = useState<any>(null);

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
    
    if (myBet || isFinished || isLocked) {
      setStats(db.getMatchStats(match.id));
    }
  }, [match, user, isFinished]);

  return (
    <>
      <div className={`bg-surface p-6 rounded-2xl border border-primary/5 shadow-card hover:shadow-md transition-all relative overflow-hidden group ${isFinished ? 'opacity-80 grayscale-[0.3]' : ''}`}>
        {isLocked && !isFinished && <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">ÉLŐ / LEZÁRT</div>}
        {isFinished && <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">VÉGE</div>}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           {/* Date & Info */}
           <div className="md:w-1/4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider mb-1">
                 <Calendar size={12} /> {start.toLocaleDateString()}
              </div>
              <div className="font-bold text-primary">{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
              <div className="mt-2 text-xs font-medium text-secondary">{match.questions.length} kérdés</div>
           </div>

           {/* Matchup */}
           <div className="flex-1 flex items-center justify-center gap-4 md:gap-8">
              <div className="text-lg md:text-xl font-extrabold text-primary text-right flex-1">{match.player1}</div>
              <div className="w-8 h-8 rounded-full bg-input flex items-center justify-center text-xs font-bold text-primary/70">VS</div>
              <div className="text-lg md:text-xl font-extrabold text-primary text-left flex-1">{match.player2}</div>
           </div>

           {/* Action / Status */}
           <div className="md:w-1/4 flex flex-col items-end justify-center gap-2">
              {points !== null ? (
                 <div className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-lg font-bold text-lg flex items-center gap-1">
                    +{points} Pont
                 </div>
              ) : (
                <>
                   {!isFinished && !isLocked && (
                      <button onClick={() => setModalMode('BET')} className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${hasBet ? 'bg-white border border-primary/20 text-primary hover:bg-slate-50' : 'bg-primary text-white hover:bg-slate-800'}`}>
                         {hasBet ? 'Tipp módosítása' : 'Tipp leadása'}
                      </button>
                   )}
                   {isAdmin && !isFinished && (
                      <button onClick={() => setModalMode('RESULT')} className="text-xs font-bold text-muted hover:text-primary underline">
                         Eredmény rögzítése
                      </button>
                   )}
                </>
              )}
           </div>
        </div>

        {/* Mini Stats Bar */}
        {stats && (
           <div className="mt-4 pt-4 border-t border-primary/5 flex items-center gap-4 overflow-hidden">
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted uppercase"><BarChart3 size={12} /> Tippek ({stats.totalBets})</div>
              {match.questions[0].type === QuestionType.WINNER && (
                  <div className="flex-1 h-1.5 bg-input rounded-full overflow-hidden flex">
                      <div className="bg-secondary" style={{width: `${Math.round(((stats.stats[match.questions[0].id]?.[match.player1] || 0) / (stats.totalBets || 1)) * 100)}%`}}></div>
                      <div className="bg-slate-300" style={{width: `${Math.round(((stats.stats[match.questions[0].id]?.['Döntetlen'] || 0) / (stats.totalBets || 1)) * 100)}%`}}></div>
                  </div>
              )}
           </div>
        )}
      </div>
      
      {modalMode === 'BET' && <BetModal match={match} user={user} onClose={() => { setModalMode(null); refresh(); }} />}
      {modalMode === 'RESULT' && <ResultModal match={match} onClose={() => { setModalMode(null); refresh(); }} />}
    </>
  );
}

// --- Modals & Utilities (Style Updated) ---

function CreateChampModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [joinCode, setJoinCode] = useState('');

    const handleCreate = async () => {
        if(!name || !code) return;
        try { await db.createChamp(name, code, userId); onClose(); } catch(e) { alert('Hiba!'); }
    }
    const handleJoin = async () => {
        if(!joinCode) return;
        try { await db.joinChamp(joinCode, userId); onClose(); } catch(e) { alert('Hiba!'); }
    }

    return (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl p-8 border border-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-extrabold text-primary">Új Bajnokság</h2>
                    <button onClick={onClose} className="text-muted hover:text-primary"><Plus size={24} className="rotate-45" /></button>
                </div>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Létrehozás</h3>
                        <div className="flex gap-3">
                            <input className="flex-1 bg-input rounded-xl px-4 py-3 font-medium outline-none text-primary placeholder-primary/40 focus:ring-2 focus:ring-secondary" placeholder="Név (pl. EB 2024)" value={name} onChange={e => setName(e.target.value)} />
                            <input className="w-24 bg-input rounded-xl px-4 py-3 font-medium outline-none text-primary placeholder-primary/40 focus:ring-2 focus:ring-secondary" placeholder="Kód" value={code} onChange={e => setCode(e.target.value)} />
                        </div>
                        <button onClick={handleCreate} className="w-full mt-3 bg-primary text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Létrehozás</button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary/10"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-surface text-muted">VAGY</span></div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4">Csatlakozás meglévőhöz</h3>
                        <div className="flex gap-3">
                            <input className="flex-1 bg-input rounded-xl px-4 py-3 font-medium outline-none text-primary placeholder-primary/40 focus:ring-2 focus:ring-secondary" placeholder="Belépőkód" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                            <button onClick={handleJoin} className="bg-white border-2 border-primary/10 text-primary px-6 rounded-xl font-bold hover:bg-slate-50 transition-all">Belépés</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
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
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-xl rounded-3xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-primary p-6 text-white text-center">
            <h3 className="font-bold text-xl">{match.player1} vs {match.player2}</h3>
            <p className="text-slate-400 text-sm mt-1">Add le a tippjeidet a mérkőzésre</p>
        </div>
        <div className="p-8 overflow-y-auto space-y-6 flex-1">
          {match.questions.map(q => (
            <div key={q.id}>
              <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-primary">{q.label}</div>
                  <div className="text-xs font-bold bg-accent/20 text-accent px-2 py-0.5 rounded">{q.points} pont</div>
              </div>
              
              {q.type === QuestionType.WINNER ? (
                <div className="grid grid-cols-2 gap-3">
                  {[match.player1, match.player2].map(p => (
                    <button key={p} onClick={() => setAnswers({...answers, [q.id]: p})} className={`p-3 rounded-xl border-2 font-bold transition-all ${answers[q.id] === p ? 'bg-secondary border-secondary text-white' : 'border-primary/5 text-muted hover:border-primary/20'}`}>{p}</button>
                  ))}
                </div>
              ) : q.type === QuestionType.OVER_UNDER ? (
                <div className="grid grid-cols-2 gap-3">
                  {['OVER', 'UNDER'].map(o => (
                     <button key={o} onClick={() => setAnswers({...answers, [q.id]: o})} className={`p-3 rounded-xl border-2 font-bold transition-all ${answers[q.id] === o ? 'bg-secondary border-secondary text-white' : 'border-primary/5 text-muted hover:border-primary/20'}`}>{o === 'OVER' ? 'Felett' : 'Alatt'}</button>
                  ))}
                </div>
              ) : (
                <input value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full bg-input rounded-xl p-3 outline-none focus:ring-2 focus:ring-secondary font-medium" placeholder="Írd be a tippet..." />
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-primary/5 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="text-muted font-bold px-4 py-2 hover:bg-slate-200 rounded-lg">Mégse</button>
          <button onClick={save} className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-slate-800">Tipp Mentése</button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ match, onClose }: { match: Match, onClose: () => void }) {
    const [answers, setAnswers] = useState<any>({});
    const save = async () => { if(confirm('Ez lezárja a meccset!')) { await db.closeMatch({ matchId: match.id, answers }); onClose(); }};
    return (
      <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <h3 className="font-bold text-xl text-primary mb-6">Eredmény rögzítése</h3>
          <div className="space-y-4">
             {match.questions.map(q => (
               <div key={q.id}>
                 <div className="text-xs text-muted font-bold mb-1">{q.label}</div>
                 <input value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="w-full bg-input rounded-lg p-3 outline-none font-medium" />
               </div>
             ))}
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={onClose} className="text-muted font-bold">Mégse</button>
            <button onClick={save} className="bg-secondary text-white px-4 py-2 rounded-lg font-bold">Lezárás</button>
          </div>
        </div>
      </div>
    )
}

function CreateMatchModal({ champId, onClose, onSave }: { champId: string, onClose: () => void, onSave: (m: any) => void }) {
    const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [date, setDate] = useState('');
    const handleSave = () => { if(!p1 || !p2 || !date) return; onSave({ championshipId: champId, player1: p1, player2: p2, startTime: new Date(date).toISOString(), status: 'SCHEDULED', questions: [{ id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2 }, { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos eredmény', points: 5 }] }); };
    const applyPreset = (type: any) => { 
        if(!p1 || !p2 || !date) { alert('Adatok!'); return; }
        // Simple simplified preset logic just for demo
        onSave({ championshipId: champId, player1: p1, player2: p2, startTime: new Date(date).toISOString(), status: 'SCHEDULED', questions: [{ id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2, options: [p1, p2] }, { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos eredmény', points: 5 }] }); 
    };
  
    return (
      <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-surface w-full max-w-md rounded-3xl p-8">
          <h3 className="font-bold text-xl text-primary mb-6">Új Meccs</h3>
          <div className="space-y-4">
            <input className="w-full bg-input rounded-xl p-3 font-medium outline-none" placeholder="Hazai" value={p1} onChange={e => setP1(e.target.value)} />
            <input className="w-full bg-input rounded-xl p-3 font-medium outline-none" placeholder="Vendég" value={p2} onChange={e => setP2(e.target.value)} />
            <input type="datetime-local" className="w-full bg-input rounded-xl p-3 font-medium outline-none" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2 mt-4">
             <button onClick={() => applyPreset('F')} className="flex-1 bg-slate-100 py-2 rounded-lg text-xs font-bold hover:bg-slate-200">Foci Sablon</button>
             <button onClick={() => applyPreset('D')} className="flex-1 bg-slate-100 py-2 rounded-lg text-xs font-bold hover:bg-slate-200">Darts Sablon</button>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="text-muted font-bold">Mégse</button>
            <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-lg font-bold">Létrehozás</button>
          </div>
        </div>
      </div>
    );
}

function ChatTab({ user, champ }: { user: User, champ: Championship }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const load = async () => setMessages(await db.getMessages(champ.id));
    useEffect(() => { load(); const i = setInterval(load, 2000); return () => clearInterval(i); }, [champ.id]);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    const send = async () => { if (!text.trim()) return; await db.sendMessage({ championshipId: champ.id, userId: user.id, username: user.username, text: text, timestamp: new Date().toISOString() }); setText(''); load(); };
  
    return (
      <div className="flex flex-col h-[500px] bg-surface rounded-2xl border border-primary/5 shadow-card overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && <div className="text-center text-muted font-medium mt-10 opacity-50">Írj az első üzenetet!</div>}
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.userId === user.id ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm font-medium shadow-sm ${m.userId === user.id ? 'bg-primary text-white rounded-br-sm' : 'bg-input text-primary rounded-bl-sm'}`}>
                {m.userId !== user.id && <div className="text-[10px] opacity-50 font-bold mb-0.5">{m.username}</div>}
                {m.text}
              </div>
              <div className="text-[10px] text-muted mt-1 px-1">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-slate-50 border-t border-primary/5 flex gap-3">
          <input className="flex-1 bg-white border border-primary/10 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-secondary" placeholder="Írj üzenetet..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button onClick={send} className="bg-secondary hover:bg-teal-600 text-white p-2.5 rounded-xl transition-all shadow-md"><Send size={18} /></button>
        </div>
      </div>
    );
  }