import React, { useState, useEffect } from 'react';
import { User, Championship, Match, QuestionType } from './types';
import * as db from './storage';

// --- Icons (Material Symbols wrapper) ---
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'AUTH' | 'DASHBOARD' | 'LEADERBOARD'>('AUTH');
  const [activeChamp, setActiveChamp] = useState<Championship | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const u = db.getSession();
    if (u) { setUser(u); setPage('DASHBOARD'); }
    else setPage('AUTH');
  }, []);

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setPage('AUTH');
  };
  
  if (page === 'AUTH') return <AuthScreen onLogin={(u) => { setUser(u); setPage('DASHBOARD'); }} />;

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white pb-20 md:pb-0">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border-dark bg-[#111a22]/95 backdrop-blur-md px-4 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setPage('DASHBOARD'); setActiveChamp(null); }}>
          <div className="size-8 flex items-center justify-center text-primary">
            <Icon name="sports_esports" className="text-3xl" />
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-tight hidden md:block">
            HaverTipp <span className="text-primary">2025</span>
          </h2>
        </div>
        
        <div className="hidden md:flex flex-1 justify-end items-center gap-8">
           <div className="flex items-center gap-6">
              <button onClick={() => {setPage('DASHBOARD'); setActiveChamp(null);}} className={`text-sm font-medium transition-colors ${page === 'DASHBOARD' && !activeChamp ? 'text-primary' : 'text-text-muted hover:text-white'}`}>Főoldal</button>
              {activeChamp && <button onClick={() => setPage('LEADERBOARD')} className={`text-sm font-medium transition-colors ${page === 'LEADERBOARD' ? 'text-primary' : 'text-text-muted hover:text-white'}`}>Ranglista</button>}
           </div>
           <div className="flex items-center gap-3 pl-6 border-l border-border-dark">
              <div className="text-right">
                 <p className="text-sm font-bold text-white">{user?.username}</p>
                 <button onClick={handleLogout} className="text-xs text-text-muted hover:text-red-400">Kilépés</button>
              </div>
              <div className="size-10 rounded-full bg-surface-dark border-2 border-border-dark flex items-center justify-center text-lg font-bold text-primary">
                 {user?.username[0].toUpperCase()}
              </div>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto p-4 md:p-8">
         {page === 'DASHBOARD' && !activeChamp && <DashboardHome user={user!} onOpenChamp={(c) => { setActiveChamp(c); }} />}
         {activeChamp && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               {/* Left Column (Content) */}
               <div className="lg:col-span-8 flex flex-col gap-6">
                  {page === 'DASHBOARD' ? (
                     <ChampionshipFeed user={user!} champ={activeChamp} triggerRefresh={refresh} />
                  ) : (
                     <LeaderboardPage champ={activeChamp} />
                  )}
               </div>

               {/* Right Column (Sidebar) */}
               <div className="hidden lg:flex lg:col-span-4 flex-col gap-6 sticky top-24">
                  <SidebarWidget user={user!} champ={activeChamp} setPage={setPage} />
                  <PromoWidget />
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

// --- Screens & Components ---

function DashboardHome({ user, onOpenChamp }: { user: User, onOpenChamp: (c: Championship) => void }) {
  const [champs, setChamps] = useState<Championship[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [globalRank, setGlobalRank] = useState<any[]>([]);
  const [tab, setTab] = useState<'CHAMPS' | 'GLOBAL'>('CHAMPS');

  useEffect(() => { 
      const load = async () => {
          setChamps(await db.getMyChamps(user.id));
          setGlobalRank(await db.getGlobalStats());
      }; 
      load(); 
  }, [showCreate, user]);

  return (
     <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b border-border-dark pb-1">
            <div className="flex gap-6">
                <button onClick={() => setTab('CHAMPS')} className={`pb-3 text-lg font-bold transition-all relative ${tab === 'CHAMPS' ? 'text-white' : 'text-text-muted hover:text-white'}`}>Bajnokságaim</button>
                <button onClick={() => setTab('GLOBAL')} className={`pb-3 text-lg font-bold transition-all relative ${tab === 'GLOBAL' ? 'text-white' : 'text-text-muted hover:text-white'}`}>Globális Ranglista</button>
            </div>
            {tab === 'CHAMPS' && (
                <button onClick={() => setShowCreate(true)} className="bg-surface-dark hover:bg-border-dark text-white px-4 py-2 rounded-full font-bold text-sm border border-border-dark transition-all flex items-center gap-2">
                    <Icon name="add_circle" /> Új Bajnokság
                </button>
            )}
        </div>

        {tab === 'CHAMPS' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {champs.map(c => (
                <div key={c.id} onClick={() => onOpenChamp(c)} className="bg-surface-dark border border-border-dark p-6 rounded-2xl hover:border-primary/50 cursor-pointer transition-all group relative overflow-hidden h-40 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white">{c.name}</h3>
                        <p className="text-text-muted text-sm">Kód: {c.joinCode}</p>
                    </div>
                    <div className="text-primary text-sm font-bold flex items-center gap-1">Megnyitás <Icon name="arrow_forward" className="text-sm"/></div>
                </div>
            ))}
            </div>
        ) : (
            <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#15202b] text-xs uppercase text-text-muted font-bold border-b border-border-dark">
                        <tr><th className="p-4 w-16">#</th><th className="p-4">Játékos</th><th className="p-4 text-right">Pont</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                        {globalRank.map((r, i) => (
                            <tr key={i} className="hover:bg-white/5">
                                <td className="p-4 text-center font-mono text-text-muted">{i+1}</td>
                                <td className="p-4 font-bold text-white">{r.username}</td>
                                <td className="p-4 text-right font-black text-white">{r.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        {showCreate && <CreateChampModal userId={user.id} onClose={() => setShowCreate(false)} />}
     </div>
  );
}

const InlineMatchCard: React.FC<{ match: Match, user: User, isAdmin: boolean, refresh: () => void }> = ({ match, user, isAdmin, refresh }) => {
   const [expanded, setExpanded] = useState(false);
   const [answers, setAnswers] = useState<any>({});
   const [hasBet, setHasBet] = useState(false);
   const [points, setPoints] = useState<number | null>(null);

   const start = new Date(match.startTime);
   const isLocked = new Date() > start;
   const isFinished = match.status === 'FINISHED';
   
   // Init (Async)
   useEffect(() => {
      const init = async () => {
          const bets = await db.fetchBetsForMatch(match.id);
          const myBet = bets.find(b => b.userId === user.id);
          if (myBet) { setHasBet(true); setAnswers(myBet.answers); }
          else { setHasBet(false); setAnswers({}); }
          
          if (isFinished && myBet) {
             const results = await db.fetchResults();
             const result = results.find(r => r.matchId === match.id);
             if (result) {
                let p = 0;
                match.questions.forEach(q => { if (String(myBet.answers[q.id]) === String(result.answers[q.id])) p += q.points; });
                setPoints(p);
             }
          }
      }
      init();
   }, [match, user, isFinished, expanded]);

   const handleSave = async () => {
      await db.saveBet({ userId: user.id, matchId: match.id, answers, timestamp: new Date().toISOString() });
      setHasBet(true); setExpanded(false); refresh();
   };

   const handleResultSave = async () => {
      if(confirm('Lezárod a meccset?')) {
         await db.closeMatch({ matchId: match.id, answers });
         refresh();
      }
   };

   return (
      <div className={`bg-surface-dark rounded-2xl border border-border-dark overflow-hidden shadow-lg transition-all ${expanded ? 'ring-1 ring-primary/30' : ''}`}>
         <div className="bg-[#15202b] p-4 flex flex-col md:flex-row justify-between items-center border-b border-border-dark gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start flex-1">
               <div className="font-bold text-white text-lg">{match.player1}</div>
               <div className="flex flex-col items-center px-2">
                  <span className="text-text-muted text-[10px] font-bold bg-input-dark px-2 py-1 rounded mb-1">{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  <span className="text-white font-black opacity-50">VS</span>
               </div>
               <div className="font-bold text-white text-lg">{match.player2}</div>
            </div>
            <div className="flex items-center gap-3">
               {points !== null ? <div className="text-primary font-bold">+{points} PONT</div> : <div className="text-xs font-bold uppercase text-text-muted">{isFinished ? 'VÉGE' : 'ÉLŐ'}</div>}
               <Icon name={expanded ? "expand_less" : "expand_more"} className="text-text-muted" />
            </div>
         </div>
         {expanded && (
            <div className="p-6 bg-[#1a2632]">
               {!isLocked && !isFinished ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {match.questions.map(q => (
                         <div key={q.id} className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">{q.label} ({q.points}p)</label>
                            {q.type === QuestionType.WINNER && (
                               <div className="flex gap-2">
                                  {[match.player1, match.player2].map(p => (
                                     <button key={p} onClick={() => setAnswers({...answers, [q.id]: p})} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${answers[q.id] === p ? 'bg-primary border-primary text-white' : 'bg-input-dark border-border-dark text-text-muted'}`}>{p}</button>
                                  ))}
                               </div>
                            )}
                            {q.type === QuestionType.EXACT_SCORE && (
                               <input className="w-full bg-input-dark border border-border-dark rounded-lg p-2 text-white text-center font-bold" placeholder="3-1" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} />
                            )}
                            {q.type === QuestionType.OVER_UNDER && (
                               <div className="flex gap-2">
                                    <button onClick={() => setAnswers({...answers, [q.id]: 'OVER'})} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${answers[q.id] === 'OVER' ? 'bg-background-dark border-accent text-accent' : 'bg-input-dark border-border-dark text-text-muted'}`}>FELETT</button>
                                    <button onClick={() => setAnswers({...answers, [q.id]: 'UNDER'})} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${answers[q.id] === 'UNDER' ? 'bg-background-dark border-accent text-accent' : 'bg-input-dark border-border-dark text-text-muted'}`}>ALATT</button>
                               </div>
                            )}
                         </div>
                      ))}
                      <button onClick={handleSave} className="md:col-span-2 bg-primary text-white py-3 rounded-lg font-bold mt-2">Tipp Mentése</button>
                   </div>
               ) : (
                   <div className="text-center py-4">
                       <p className="text-text-muted mb-4">A tippelés lezárult.</p>
                       {isAdmin && !isFinished && (
                          <div className="border-t border-border-dark pt-4">
                             <h4 className="text-white font-bold mb-4">Eredmény (Admin)</h4>
                             <div className="grid gap-2 max-w-sm mx-auto">
                                {match.questions.map(q => (
                                   <input key={q.id} placeholder={q.label} value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="bg-input-dark border border-border-dark rounded p-2 text-white" />
                                ))}
                                <button onClick={handleResultSave} className="bg-accent text-black font-bold py-2 rounded">Lezárás</button>
                             </div>
                          </div>
                       )}
                   </div>
               )}
            </div>
         )}
      </div>
   );
};

function ChampionshipFeed({ user, champ, triggerRefresh }: { user: User, champ: Championship, triggerRefresh: number }) {
   const [matches, setMatches] = useState<Match[]>([]);
   const [showCreateMatch, setShowCreateMatch] = useState(false);
   const isAdmin = champ.adminId === user.id;

   useEffect(() => { const l = async () => setMatches(await db.getMatches(champ.id)); l(); }, [champ, triggerRefresh, showCreateMatch]);

   return (
      <>
         <div className="flex items-center justify-between mb-6">
             <h1 className="text-3xl font-black text-white">{champ.name}</h1>
             {isAdmin && <button onClick={() => setShowCreateMatch(true)} className="bg-primary/20 text-primary px-4 py-2 rounded-full font-bold text-sm">Új Meccs</button>}
         </div>
         <div className="flex flex-col gap-4">
            {matches.map(m => <InlineMatchCard key={m.id} match={m} user={user} isAdmin={isAdmin} refresh={() => setMatches([...matches])} />)}
            {matches.length === 0 && <div className="text-center text-text-muted py-10">Nincsenek meccsek.</div>}
         </div>
         {showCreateMatch && <CreateMatchModal champId={champ.id} onClose={() => setShowCreateMatch(false)} />}
      </>
   );
}

function LeaderboardPage({ champ }: { champ: Championship }) {
    const [entries, setEntries] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const matches = await db.getMatches(champ.id);
            const users = await db.getAllUsers();
            const results = await db.fetchResults();
            const scores: Record<string, any> = {};
            
            // Init scores
            if(champ.participants) {
                champ.participants.forEach(u => scores[u] = { id: u, name: users[u] || '?', points: 0, correct: 0 });
            }
            
            // Calculate
            for (const m of matches.filter(x => x.status === 'FINISHED')) {
                const res = results.find(r => r.matchId === m.id);
                if(!res) continue;
                const bets = await db.fetchBetsForMatch(m.id);
                bets.forEach(b => {
                    if(scores[b.userId]) {
                        m.questions.forEach(q => {
                           if(String(b.answers[q.id]) === String(res.answers[q.id])) {
                               scores[b.userId].points += q.points;
                               scores[b.userId].correct++;
                           }
                        });
                    }
                });
            }
            setEntries(Object.values(scores).sort((a,b) => b.points - a.points));
        };
        load();
    }, [champ]);

    return (
        <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-[#15202b] text-xs uppercase text-text-muted">
                    <tr><th className="p-4 w-12">#</th><th className="p-4">Név</th><th className="p-4 text-right">Pont</th></tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    {entries.map((e, i) => (
                        <tr key={e.id} className="hover:bg-white/5">
                            <td className="p-4 text-center text-text-muted">{i+1}</td>
                            <td className="p-4 font-bold text-white">{e.name}</td>
                            <td className="p-4 text-right font-black text-white">{e.points}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
    );
}

function SidebarWidget({ user, champ, setPage }: { user: User, champ: Championship, setPage: any }) {
    // Placeholder simplified widget logic
    return (
       <div className="bg-surface-dark rounded-2xl border border-border-dark p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold">Ranglista</h3>
            <button onClick={() => setPage('LEADERBOARD')} className="text-primary text-xs">Részletek</button>
          </div>
          <p className="text-text-muted text-sm">A teljes ranglista megtekintéséhez kattints a részletekre.</p>
       </div>
    );
}

function PromoWidget() {
   return (
      <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-center shadow-lg">
         <Icon name="stars" className="text-white text-3xl mb-2" />
         <h3 className="text-white font-black mb-1">HaverTipp Pro</h3>
         <p className="text-white/80 text-xs">Több statisztika hamarosan.</p>
      </div>
   )
}

function AuthScreen({ onLogin }: { onLogin: (u: User) => void }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!username || !password) return setError('Minden mező kötelező!');
        setLoading(true); setError('');
        try { 
            const user = isRegistering ? await db.register(username, password) : await db.login(username, password);
            onLogin(user); 
        } catch (e: any) { setError(e.message); } 
        finally { setLoading(false); }
    };

    return (
       <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
          <div className="w-full max-w-md bg-surface-dark p-8 rounded-2xl border border-border-dark text-center shadow-2xl relative">
             <div className="inline-flex p-4 rounded-full bg-[#111a22] text-primary mb-6 border border-border-dark">
                <Icon name="sports_esports" className="text-4xl" />
             </div>
             <h1 className="text-3xl font-black text-white mb-2">HaverTipp</h1>
             <p className="text-text-muted mb-8">{isRegistering ? 'Hozz létre fiókot' : 'Lépj be'}</p>
             <div className="space-y-4 text-left">
                <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white" placeholder="Felhasználónév" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white" placeholder="Jelszó" />
                {error && <div className="text-red-500 text-sm font-bold text-center">{error}</div>}
                <button onClick={handleSubmit} disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold">
                    {loading ? '...' : (isRegistering ? 'Regisztráció' : 'Belépés')}
                </button>
                <div className="text-center text-sm text-text-muted cursor-pointer hover:text-white" onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? 'Már van fiókod? Belépés' : 'Nincs fiókod? Regisztráció'}
                </div>
             </div>
          </div>
       </div>
    );
}

function CreateChampModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [name, setName] = useState(''); const [code, setCode] = useState(''); const [joinCode, setJoinCode] = useState('');
    const handleCreate = async () => { if(!name || !code) return; try { await db.createChamp(name, code, userId); onClose(); } catch(e) { alert('Hiba!'); } }
    const handleJoin = async () => { if(!joinCode) return; try { await db.joinChamp(joinCode, userId); onClose(); } catch(e) { alert('Hiba!'); } }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl p-8 border border-border-dark">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-white">Bajnokság Kezelése</h2>
                    <button onClick={onClose}><Icon name="close" className="text-text-muted hover:text-white"/></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Új Létrehozása</h3>
                        <div className="flex gap-2">
                            <input className="flex-1 bg-input-dark border border-border-dark rounded-lg p-3 text-white" placeholder="Név" value={name} onChange={e => setName(e.target.value)} />
                            <input className="w-24 bg-input-dark border border-border-dark rounded-lg p-3 text-white" placeholder="Kód" value={code} onChange={e => setCode(e.target.value)} />
                        </div>
                        <button onClick={handleCreate} className="w-full mt-2 bg-primary text-white py-2 rounded-lg font-bold">Létrehozás</button>
                    </div>
                    <div className="border-t border-border-dark pt-6">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Csatlakozás</h3>
                        <div className="flex gap-2">
                            <input className="flex-1 bg-input-dark border border-border-dark rounded-lg p-3 text-white" placeholder="Belépőkód" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                            <button onClick={handleJoin} className="bg-white text-black px-6 rounded-lg font-bold hover:bg-gray-200">Belépés</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CreateMatchModal({ champId, onClose }: { champId: string, onClose: () => void }) {
    const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [date, setDate] = useState('');
    const save = async (type: 'F' | 'D') => {
        if(!p1 || !p2 || !date) return;
        const questions = type === 'F' 
           ? [{ id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2, options: [p1, p2, 'Döntetlen'] }, { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos Eredmény', points: 5 }]
           : [{ id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2, options: [p1, p2] }, { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Szett Eredmény', points: 5 }, { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: '180-asok (6.5)', points: 1 }, { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Magasabb Kiszálló', points: 1, options: [p1, p2] }];
        
        await db.createMatch({ championshipId: champId, player1: p1, player2: p2, startTime: new Date(date).toISOString(), status: 'SCHEDULED', questions });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-dark w-full max-w-md rounded-2xl p-6 border border-border-dark">
                <h3 className="text-xl font-bold text-white mb-4">Új Mérkőzés</h3>
                <div className="space-y-3 mb-4">
                    <input className="w-full bg-input-dark border border-border-dark rounded-lg p-3 text-white" placeholder="Hazai" value={p1} onChange={e => setP1(e.target.value)} />
                    <input className="w-full bg-input-dark border border-border-dark rounded-lg p-3 text-white" placeholder="Vendég" value={p2} onChange={e => setP2(e.target.value)} />
                    <input type="datetime-local" className="w-full bg-input-dark border border-border-dark rounded-lg p-3 text-white" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => save('F')} className="bg-surface-dark border border-border-dark hover:border-primary text-white py-3 rounded-lg font-bold">⚽ Foci</button>
                    <button onClick={() => save('D')} className="bg-surface-dark border border-border-dark hover:border-primary text-white py-3 rounded-lg font-bold">🎯 Darts</button>
                </div>
                <button onClick={onClose} className="w-full mt-4 text-text-muted">Mégse</button>
            </div>
        </div>
    )
}