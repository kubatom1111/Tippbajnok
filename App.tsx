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
      <nav className="sticky top-0 z-50 w-full border-b border-border-dark bg-[#111a22]/95 backdrop-blur-md px-4 md:px-10 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setPage('DASHBOARD'); setActiveChamp(null); }}>
          <div className="size-10 flex items-center justify-center text-primary bg-primary/10 rounded-xl">
            <Icon name="sports_esports" className="text-3xl" />
          </div>
          <h2 className="text-white text-xl font-bold leading-tight tracking-tight hidden md:block">
            HaverTipp <span className="text-primary">2025</span>
          </h2>
        </div>
        
        <div className="hidden md:flex flex-1 justify-end items-center gap-8">
           <div className="flex items-center gap-2 bg-surface-dark p-1 rounded-full border border-border-dark">
              <button onClick={() => {setPage('DASHBOARD'); setActiveChamp(null);}} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${page === 'DASHBOARD' && !activeChamp ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Főoldal</button>
              {activeChamp && <button onClick={() => setPage('LEADERBOARD')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${page === 'LEADERBOARD' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Ranglista</button>}
           </div>
           <div className="flex items-center gap-3 pl-6 border-l border-border-dark">
              <div className="text-right">
                 <p className="text-sm font-bold text-white">{user?.username}</p>
                 <button onClick={handleLogout} className="text-xs text-text-muted hover:text-red-400 font-medium">Kilépés</button>
              </div>
              <div className="size-10 rounded-full bg-gradient-to-br from-primary to-blue-600 border-2 border-[#15202b] shadow-lg flex items-center justify-center text-lg font-bold text-white">
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
                  <QuickLeaderboardWidget champ={activeChamp} triggerRefresh={refresh} setPage={setPage} />
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
     <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-[#101922] border border-border-dark shadow-2xl p-8 md:p-12">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Szia, {user.username}! 👋</h1>
                    <p className="text-blue-200 text-lg max-w-xl">
                        Jó látni téged! Készen állsz a mai tippekre? Nézd meg a bajnokságaidat vagy csekkold, hol állsz a világranglistán.
                    </p>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
                            <Icon name="add_circle" /> Új Bajnokság
                        </button>
                    </div>
                </div>
                <div className="bg-surface-dark/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center min-w-[200px]">
                    <div className="text-sm text-blue-200 font-bold uppercase tracking-wider mb-1">Összpontszám</div>
                    <div className="text-5xl font-black text-primary drop-shadow-lg">
                        {globalRank.find(r => r.username === user.username)?.points || 0}
                    </div>
                    <div className="text-xs text-white/50 mt-2">Minden bajnokságból</div>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center mb-8">
            <div className="bg-surface-dark p-1 rounded-full border border-border-dark inline-flex">
                <button onClick={() => setTab('CHAMPS')} className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${tab === 'CHAMPS' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-white'}`}>
                    <Icon name="trophy" className="text-lg"/> Bajnokságaim
                </button>
                <button onClick={() => setTab('GLOBAL')} className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${tab === 'GLOBAL' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-white'}`}>
                    <Icon name="public" className="text-lg"/> Globális Ranglista
                </button>
            </div>
        </div>

        {tab === 'CHAMPS' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {champs.map(c => (
                    <div key={c.id} onClick={() => onOpenChamp(c)} className="group relative bg-surface-dark border border-border-dark p-1 rounded-3xl hover:border-primary/50 cursor-pointer transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
                        <div className="bg-[#15202b] rounded-[20px] p-6 h-full flex flex-col justify-between relative z-10">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="size-12 bg-surface-dark rounded-xl flex items-center justify-center text-primary border border-border-dark">
                                        <Icon name="emoji_events" className="text-2xl" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-text-muted bg-surface-dark px-2 py-1 rounded border border-border-dark">{c.joinCode}</span>
                                </div>
                                <h3 className="text-2xl font-black text-white mb-1 group-hover:text-primary transition-colors">{c.name}</h3>
                                <p className="text-text-muted text-sm">{c.participants?.length || 1} játékos</p>
                            </div>
                            <div className="mt-6 flex items-center text-sm font-bold text-white group-hover:gap-2 transition-all">
                                Belépés <Icon name="arrow_forward" className="text-lg text-primary ml-1" />
                            </div>
                        </div>
                    </div>
                ))}
                {champs.length === 0 && (
                    <div onClick={() => setShowCreate(true)} className="col-span-full py-16 text-center border-2 border-dashed border-border-dark rounded-3xl text-text-muted hover:border-primary/50 hover:text-white cursor-pointer transition-all">
                        <Icon name="add_circle_outline" className="text-5xl mb-4 opacity-50" />
                        <p className="font-bold">Még nem vagy egy bajnokságban sem.</p>
                        <p className="text-sm opacity-50">Kattints ide egy új létrehozásához!</p>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-6">
                {/* Podium */}
                {globalRank.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 mb-10 min-h-[220px]">
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center w-1/3 max-w-[140px]">
                            <div className="mb-2 text-center">
                                <div className="font-bold text-white truncate w-full">{globalRank[1].username}</div>
                                <div className="text-sm text-text-muted font-bold">{globalRank[1].points} p</div>
                            </div>
                            <div className="w-full h-32 bg-surface-dark border-t-4 border-slate-400 rounded-t-xl flex items-start justify-center pt-2 shadow-lg relative">
                                <div className="absolute -top-5 size-10 rounded-full bg-slate-400 flex items-center justify-center font-black text-[#15202b] text-xl border-4 border-[#15202b]">2</div>
                                <Icon name="emoji_events" className="text-slate-600 text-6xl opacity-20 mt-4" />
                            </div>
                        </div>
                        {/* 1st Place */}
                        <div className="flex flex-col items-center w-1/3 max-w-[160px] z-10">
                             <div className="mb-2 text-center">
                                <div className="font-bold text-yellow-400 text-lg truncate w-full">{globalRank[0].username}</div>
                                <div className="text-sm text-yellow-200 font-bold">{globalRank[0].points} p</div>
                            </div>
                            <div className="w-full h-40 bg-gradient-to-b from-yellow-500/20 to-surface-dark border-t-4 border-yellow-400 rounded-t-xl flex items-start justify-center pt-2 shadow-xl shadow-yellow-500/10 relative">
                                <div className="absolute -top-6 size-12 rounded-full bg-yellow-400 flex items-center justify-center font-black text-black text-2xl border-4 border-[#15202b] shadow-lg">1</div>
                                <Icon name="emoji_events" className="text-yellow-500 text-7xl opacity-30 mt-4" />
                            </div>
                        </div>
                        {/* 3rd Place */}
                        <div className="flex flex-col items-center w-1/3 max-w-[140px]">
                             <div className="mb-2 text-center">
                                <div className="font-bold text-white truncate w-full">{globalRank[2].username}</div>
                                <div className="text-sm text-text-muted font-bold">{globalRank[2].points} p</div>
                            </div>
                            <div className="w-full h-24 bg-surface-dark border-t-4 border-amber-700 rounded-t-xl flex items-start justify-center pt-2 shadow-lg relative">
                                <div className="absolute -top-5 size-10 rounded-full bg-amber-700 flex items-center justify-center font-black text-white text-xl border-4 border-[#15202b]">3</div>
                                <Icon name="emoji_events" className="text-amber-800 text-5xl opacity-20 mt-4" />
                            </div>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#15202b] text-xs uppercase text-text-muted font-bold border-b border-border-dark">
                            <tr><th className="p-4 w-16 text-center">#</th><th className="p-4">Játékos</th><th className="p-4 text-right">Pont</th></tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {globalRank.slice(3).map((r, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-center font-mono text-text-muted font-bold">{i+4}</td>
                                    <td className="p-4 font-bold text-white">{r.username}</td>
                                    <td className="p-4 text-right font-black text-primary">{r.points}</td>
                                </tr>
                            ))}
                            {globalRank.length === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-text-muted">Nincs még adat.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        {showCreate && <CreateChampModal userId={user.id} onClose={() => setShowCreate(false)} />}
     </div>
  );
}

const InlineMatchCard: React.FC<{ match: Match, user: User, isAdmin: boolean, refresh: () => void }> = ({ match, user, isAdmin, refresh }) => {
   const [expanded, setExpanded] = useState(false);
   
   // User Bet State
   const [answers, setAnswers] = useState<any>({});
   const [hasBet, setHasBet] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [points, setPoints] = useState<number | null>(null);

   // Admin State
   const [adminMode, setAdminMode] = useState(false);
   const [resultAnswers, setResultAnswers] = useState<any>({});

   const start = new Date(match.startTime);
   const isLocked = new Date() > start;
   const isFinished = match.status === 'FINISHED';
   
   // Init (Async)
   useEffect(() => {
      const init = async () => {
          // 1. Load Bets
          const bets = await db.fetchBetsForMatch(match.id);
          const myBet = bets.find(b => b.userId === user.id);
          if (myBet) { 
              setHasBet(true); 
              setAnswers(myBet.answers); 
              setIsEditing(false); // Default to viewing if bet exists
          } else { 
              setHasBet(false); 
              setAnswers({}); 
              setIsEditing(true); // Default to editing if no bet
          }
          
          // 2. Load Results for Admin / Points Calc
          const results = await db.fetchResults();
          const result = results.find(r => r.matchId === match.id);
          
          if (result) {
             setResultAnswers(result.answers); // Pre-fill admin form
             
             // Calculate points if bet exists and finished
             if (myBet) {
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
      setHasBet(true); 
      setIsEditing(false); // Switch to view mode
      setExpanded(false); // Collapse to confirm
      refresh();
   };

   const handleResultSave = async () => {
      if(confirm('Lezárod a meccset? Ez rögzíti az eredményt és frissíti a pontokat.')) {
         await db.closeMatch({ matchId: match.id, answers: resultAnswers });
         setAdminMode(false);
         refresh();
      }
   };

   const handleResultChange = (qId: string, val: any) => {
       setResultAnswers((prev: any) => ({ ...prev, [qId]: val }));
   };

   const formatAnswer = (val: string) => {
       if (val === 'OVER') return 'Felett';
       if (val === 'UNDER') return 'Alatt';
       return val;
   }

   return (
      <div className={`bg-surface-dark rounded-2xl border border-border-dark overflow-hidden shadow-lg transition-all ${expanded ? 'ring-1 ring-primary/30' : ''}`}>
         <div className="bg-[#15202b] p-4 flex flex-col md:flex-row justify-between items-center border-b border-border-dark gap-4 cursor-pointer hover:bg-[#1a2632] transition-colors" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start flex-1">
               <div className="font-bold text-white text-lg w-1/3 text-right md:w-auto">{match.player1}</div>
               <div className="flex flex-col items-center px-2">
                  <span className="text-text-muted text-[10px] font-bold bg-input-dark px-2 py-1 rounded mb-1">{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  <span className="text-white font-black opacity-30 text-xs">VS</span>
               </div>
               <div className="font-bold text-white text-lg w-1/3 text-left md:w-auto">{match.player2}</div>
            </div>
            <div className="flex items-center gap-3">
               {hasBet && !isFinished && <div className="hidden md:flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 font-bold uppercase"><Icon name="check_circle" className="text-sm"/> Leadva</div>}
               {points !== null ? <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-black">+{points} PONT</div> : <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${isFinished ? 'bg-slate-700 text-slate-400' : 'bg-green-500/20 text-green-500'}`}>{isFinished ? 'VÉGE' : 'TIPPELHETŐ'}</div>}
               <Icon name={expanded ? "expand_less" : "expand_more"} className="text-text-muted" />
            </div>
         </div>
         {expanded && (
            <div className="p-6 bg-[#1a2632]">
               
               {/* ADMIN TABS */}
               {isAdmin && (
                   <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                       <button onClick={() => setAdminMode(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!adminMode ? 'bg-surface-dark text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Játékos Nézet (Tippelés)</button>
                       <button onClick={() => setAdminMode(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${adminMode ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}> <Icon name="settings"/> Eredmény Kezelése</button>
                   </div>
               )}

               {adminMode ? (
                   /* ADMIN RESULT INTERFACE */
                   <div className="bg-gradient-to-br from-black/20 to-red-900/10 border border-white/5 rounded-xl p-6 relative">
                        <div className="absolute top-0 right-0 p-3 opacity-5"><Icon name="gavel" className="text-8xl text-red-500"/></div>
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10">
                            <Icon name="sports_score" className="text-primary"/> Hivatalos Végeredmény Rögzítése
                        </h4>
                        <p className="text-sm text-text-muted mb-6 relative z-10">
                            Figyelem: Az eredmény mentése lezárja a mérkőzést, és a rendszer kiszámolja a pontokat. Ezt követően már nem lehet tippelni.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                           {match.questions.map(q => (
                              <div key={q.id} className="space-y-2">
                                 <label className="text-xs font-bold text-text-muted uppercase flex justify-between">
                                     {q.label}
                                 </label>
                                 {q.type === QuestionType.WINNER && (
                                    <div className="flex gap-2">
                                       {[match.player1, match.player2].map(p => (
                                          <button key={p} onClick={() => handleResultChange(q.id, p)} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${resultAnswers[q.id] === p ? 'bg-primary border-primary text-white' : 'bg-input-dark border-border-dark text-text-muted'}`}>{p}</button>
                                       ))}
                                    </div>
                                 )}
                                 {q.type === QuestionType.EXACT_SCORE && (
                                    <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white text-center font-bold text-lg tracking-widest focus:border-primary outline-none" placeholder="3-1" value={resultAnswers[q.id] || ''} onChange={e => handleResultChange(q.id, e.target.value)} />
                                 )}
                                 {q.type === QuestionType.OVER_UNDER && (
                                    <div className="flex gap-2">
                                         <button onClick={() => handleResultChange(q.id, 'OVER')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${resultAnswers[q.id] === 'OVER' ? 'bg-background-dark border-primary text-primary' : 'bg-input-dark border-border-dark text-text-muted'}`}>FELETT</button>
                                         <button onClick={() => handleResultChange(q.id, 'UNDER')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${resultAnswers[q.id] === 'UNDER' ? 'bg-background-dark border-primary text-primary' : 'bg-input-dark border-border-dark text-text-muted'}`}>ALATT</button>
                                    </div>
                                 )}
                              </div>
                           ))}
                           <button onClick={handleResultSave} className="md:col-span-2 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold mt-2 shadow-lg transition-all">Lezárás és Eredmény Mentése</button>
                        </div>
                   </div>
               ) : (
                   /* USER BETTING INTERFACE */
                   <>
                       {hasBet && !isEditing && !isFinished ? (
                           <div className="bg-[#101922] border border-primary/30 rounded-xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><Icon name="receipt_long" className="text-9xl text-primary"/></div>
                                <div className="relative z-10">
                                    <h4 className="text-primary font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><Icon name="verified"/> Aktív Szelvény</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                        {match.questions.map(q => (
                                            <div key={q.id} className="flex justify-between items-center border-b border-border-dark pb-2 last:border-0">
                                                <span className="text-text-muted text-sm">{q.label}</span>
                                                <span className="font-bold text-white">{formatAnswer(answers[q.id])}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {!isLocked && (
                                        <div className="mt-6 flex justify-end">
                                            <button onClick={() => setIsEditing(true)} className="text-text-muted text-sm hover:text-white underline decoration-dotted">Tipp módosítása</button>
                                        </div>
                                    )}
                                </div>
                           </div>
                       ) : (
                       !isLocked && !isFinished ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {match.questions.map(q => (
                                 <div key={q.id} className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase flex justify-between">
                                        {q.label} <span>{q.points} pont</span>
                                    </label>
                                    {q.type === QuestionType.WINNER && (
                                       <div className="flex gap-2">
                                          {[match.player1, match.player2].map(p => (
                                             <button key={p} onClick={() => setAnswers({...answers, [q.id]: p})} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${answers[q.id] === p ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-input-dark border-border-dark text-text-muted hover:bg-border-dark'}`}>{p}</button>
                                          ))}
                                       </div>
                                    )}
                                    {q.type === QuestionType.EXACT_SCORE && (
                                       <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white text-center font-bold text-lg tracking-widest focus:border-primary focus:outline-none transition-colors" placeholder="3-1" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} />
                                    )}
                                    {q.type === QuestionType.OVER_UNDER && (
                                       <div className="flex gap-2">
                                            <button onClick={() => setAnswers({...answers, [q.id]: 'OVER'})} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${answers[q.id] === 'OVER' ? 'bg-background-dark border-primary text-primary' : 'bg-input-dark border-border-dark text-text-muted hover:bg-border-dark'}`}>FELETT</button>
                                            <button onClick={() => setAnswers({...answers, [q.id]: 'UNDER'})} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${answers[q.id] === 'UNDER' ? 'bg-background-dark border-primary text-primary' : 'bg-input-dark border-border-dark text-text-muted hover:bg-border-dark'}`}>ALATT</button>
                                       </div>
                                    )}
                                 </div>
                              ))}
                              <div className="md:col-span-2 flex gap-3 mt-2">
                                  {hasBet && <button onClick={() => setIsEditing(false)} className="flex-1 bg-surface-dark border border-border-dark text-white py-3 rounded-xl font-bold hover:bg-border-dark">Mégse</button>}
                                  <button onClick={handleSave} className="flex-[2] bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all">Tipp Mentése</button>
                              </div>
                           </div>
                       ) : (
                           <div className="text-center py-4">
                               <p className="text-text-muted mb-4 font-medium">A tippelés lezárult erre a mérkőzésre.</p>
                               {hasBet && (
                                   <div className="bg-[#101922] border border-border-dark rounded-xl p-4 max-w-lg mx-auto mb-6 text-left">
                                        <h4 className="text-text-muted font-bold uppercase tracking-wider text-xs mb-3 border-b border-border-dark pb-2">A te tipped:</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {match.questions.map(q => (
                                                <div key={q.id} className="flex justify-between">
                                                    <span className="text-text-muted text-xs truncate pr-2">{q.label}:</span>
                                                    <span className="font-bold text-white text-xs">{formatAnswer(answers[q.id])}</span>
                                                </div>
                                            ))}
                                        </div>
                                   </div>
                               )}
                           </div>
                       ))}
                   </>
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
         <div className="flex items-center justify-between mb-2">
            <div>
                 <h1 className="text-3xl font-black text-white">{champ.name}</h1>
                 <p className="text-text-muted text-sm flex items-center gap-1 mt-1"><Icon name="key" className="text-sm"/> Kód: <span className="text-white font-mono bg-surface-dark px-2 rounded border border-border-dark">{champ.joinCode}</span></p>
            </div>
             {isAdmin && <button onClick={() => setShowCreateMatch(true)} className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold text-sm border border-primary/20 transition-all flex items-center gap-2"><Icon name="add" className="text-lg"/> Új Meccs</button>}
         </div>
         <div className="bg-gradient-to-r from-transparent via-border-dark to-transparent h-px w-full mb-6"></div>
         <div className="flex flex-col gap-4">
            {matches.map(m => <InlineMatchCard key={m.id} match={m} user={user} isAdmin={isAdmin} refresh={() => setMatches([...matches])} />)}
            {matches.length === 0 && (
                <div className="text-center py-16 bg-surface-dark rounded-2xl border border-border-dark border-dashed">
                    <Icon name="sports_soccer" className="text-4xl text-text-muted opacity-50 mb-2"/>
                    <p className="text-text-muted font-medium">Jelenleg nincsenek aktív meccsek.</p>
                </div>
            )}
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
             <div className="p-4 border-b border-border-dark bg-[#15202b]">
                <h3 className="font-bold text-white flex items-center gap-2"><Icon name="leaderboard"/> Teljes Ranglista</h3>
             </div>
             <table className="w-full text-left">
                <thead className="bg-[#15202b]/50 text-xs uppercase text-text-muted">
                    <tr><th className="p-4 w-16 text-center">Hely</th><th className="p-4">Név</th><th className="p-4 text-center">Találat</th><th className="p-4 text-right">Pont</th></tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                    {entries.map((e, i) => (
                        <tr key={e.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-center">
                                {i === 0 ? <Icon name="emoji_events" className="text-yellow-400"/> : 
                                 i === 1 ? <Icon name="emoji_events" className="text-slate-400"/> :
                                 i === 2 ? <Icon name="emoji_events" className="text-amber-700"/> :
                                 <span className="font-mono text-text-muted font-bold">{i+1}.</span>}
                            </td>
                            <td className="p-4 font-bold text-white flex items-center gap-2">
                                <div className="size-8 rounded-full bg-[#101922] flex items-center justify-center text-xs font-bold border border-border-dark text-text-muted">
                                    {e.name[0].toUpperCase()}
                                </div>
                                {e.name}
                            </td>
                            <td className="p-4 text-center text-text-muted font-mono">{e.correct}</td>
                            <td className="p-4 text-right font-black text-white text-lg">{e.points}</td>
                        </tr>
                    ))}
                    {entries.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-text-muted">Még nincs adat.</td></tr>}
                </tbody>
             </table>
        </div>
    );
}

function QuickLeaderboardWidget({ champ, triggerRefresh, setPage }: { champ: Championship, triggerRefresh: number, setPage: any }) {
    const [top5, setTop5] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const matches = await db.getMatches(champ.id);
            const users = await db.getAllUsers();
            const results = await db.fetchResults();
            const scores: Record<string, any> = {};
            if(champ.participants) champ.participants.forEach(u => scores[u] = { id: u, name: users[u] || '?', points: 0 });
            
            for (const m of matches.filter(x => x.status === 'FINISHED')) {
                const res = results.find(r => r.matchId === m.id);
                if(!res) continue;
                const bets = await db.fetchBetsForMatch(m.id);
                bets.forEach(b => {
                    if(scores[b.userId]) {
                        m.questions.forEach(q => {
                           if(String(b.answers[q.id]) === String(res.answers[q.id])) scores[b.userId].points += q.points;
                        });
                    }
                });
            }
            setTop5(Object.values(scores).sort((a,b) => b.points - a.points).slice(0, 5));
        };
        load();
    }, [champ, triggerRefresh]);

    return (
       <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden shadow-lg">
          <div className="p-4 border-b border-border-dark bg-gradient-to-r from-[#15202b] to-[#1a2632] flex justify-between items-center">
            <h3 className="text-white font-bold flex items-center gap-2"><Icon name="military_tech" className="text-yellow-500"/> Élő Ranglista</h3>
          </div>
          <div className="divide-y divide-border-dark">
             {top5.map((entry, i) => (
                <div key={entry.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                   <div className="flex items-center gap-3">
                      <span className={`font-mono font-bold w-6 text-center ${i===0?'text-yellow-400':i===1?'text-slate-300':i===2?'text-amber-600':'text-slate-600'}`}>{i+1}.</span>
                      <span className="text-sm font-bold text-white truncate max-w-[120px]">{entry.name}</span>
                   </div>
                   <span className="text-sm font-black text-primary">{entry.points} p</span>
                </div>
             ))}
             {top5.length === 0 && <div className="p-4 text-center text-text-muted text-sm">Nincs adat.</div>}
          </div>
          <div className="p-2 bg-[#15202b] text-center border-t border-border-dark">
             <button onClick={() => setPage('LEADERBOARD')} className="text-xs font-bold text-text-muted hover:text-white uppercase tracking-wider py-2 w-full">Teljes táblázat mutatása</button>
          </div>
       </div>
    );
}

function PromoWidget() {
   return (
      <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
         <div className="relative z-10">
             <div className="size-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3 text-white backdrop-blur-sm border border-white/20">
                <Icon name="rocket_launch" className="text-2xl" />
             </div>
             <h3 className="text-white font-black mb-1 text-lg">HaverTipp Pro</h3>
             <p className="text-blue-100 text-xs mb-4">Hamarosan részletes statisztikákkal és grafikonokkal jövünk!</p>
             <button className="bg-white text-primary text-xs font-bold px-4 py-2 rounded-lg shadow-lg hover:bg-blue-50 transition-colors">Értesíts engem</button>
         </div>
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
       <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="w-full max-w-md bg-surface-dark/80 backdrop-blur-xl p-8 rounded-3xl border border-border-dark text-center shadow-2xl relative z-10">
             <div className="inline-flex p-4 rounded-2xl bg-[#111a22] text-primary mb-6 border border-border-dark shadow-lg shadow-primary/10">
                <Icon name="sports_esports" className="text-4xl" />
             </div>
             <h1 className="text-3xl font-black text-white mb-2 tracking-tight">HaverTipp <span className="text-primary">2025</span></h1>
             <p className="text-text-muted mb-8 text-sm">A legjobb hely a baráti fogadásokhoz.</p>
             
             <div className="space-y-4 text-left">
                <div>
                    <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">Felhasználónév</label>
                    <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-input-dark border border-border-dark rounded-xl p-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Pl. Pisti99" />
                </div>
                <div>
                    <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">Jelszó</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-input-dark border border-border-dark rounded-xl p-3.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="••••••••" />
                </div>
                
                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center flex items-center justify-center gap-2"><Icon name="error" className="text-lg"/> {error}</div>}
                
                <button onClick={handleSubmit} disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all mt-4">
                    {loading ? 'Betöltés...' : (isRegistering ? 'Fiók létrehozása' : 'Belépés')}
                </button>
                
                <div className="pt-4 border-t border-border-dark mt-6">
                    <p className="text-center text-sm text-text-muted">
                        {isRegistering ? 'Már van fiókod?' : 'Még nincs fiókod?'} 
                        <span className="text-primary font-bold cursor-pointer hover:underline ml-1" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? 'Belépés' : 'Regisztráció'}
                        </span>
                    </p>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl p-8 border border-border-dark relative">
                 <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white"><Icon name="close" /></button>
                <div className="flex items-center gap-3 mb-8">
                    <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
                        <Icon name="trophy" className="text-xl"/>
                    </div>
                    <h2 className="text-2xl font-black text-white">Bajnokság Kezelése</h2>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2"><Icon name="add_circle" className="text-base"/> Új Létrehozása</h3>
                        <div className="flex gap-2 mb-2">
                            <input className="flex-1 bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Bajnokság neve" value={name} onChange={e => setName(e.target.value)} />
                            <input className="w-28 bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none font-mono" placeholder="KÓD" value={code} onChange={e => setCode(e.target.value)} />
                        </div>
                        <p className="text-xs text-text-muted mb-3">A KÓD egyedi kell legyen (pl. HAVEROK2025).</p>
                        <button onClick={handleCreate} className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Létrehozás</button>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-border-dark"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-surface-dark px-2 text-xs text-text-muted uppercase">Vagy</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Icon name="login" className="text-base"/> Csatlakozás meglévőhöz</h3>
                        <div className="flex gap-2">
                            <input className="flex-1 bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-white outline-none font-mono" placeholder="Írd be a belépőkódot..." value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                            <button onClick={handleJoin} className="bg-white text-black px-6 rounded-xl font-bold hover:bg-gray-200 transition-colors">Belépés</button>
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-surface-dark w-full max-w-md rounded-2xl p-6 border border-border-dark relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white"><Icon name="close" /></button>
                <h3 className="text-xl font-black text-white mb-6">Új Mérkőzés Felvétele</h3>
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">Csapatok / Játékosok</label>
                        <div className="flex items-center gap-3">
                            <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Hazai" value={p1} onChange={e => setP1(e.target.value)} />
                            <span className="font-black text-text-muted">VS</span>
                            <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Vendég" value={p2} onChange={e => setP2(e.target.value)} />
                        </div>
                    </div>
                    <div>
                         <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-1 block">Kezdés Időpontja</label>
                         <input type="datetime-local" className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>
                
                <label className="text-xs font-bold text-text-muted uppercase ml-1 mb-2 block">Válassz csomagot a kérdésekhez:</label>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => save('F')} className="bg-surface-dark border border-border-dark hover:border-primary hover:bg-primary/5 text-white py-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all group">
                        <Icon name="sports_soccer" className="text-2xl text-text-muted group-hover:text-primary"/> 
                        Foci Csomag
                    </button>
                    <button onClick={() => save('D')} className="bg-surface-dark border border-border-dark hover:border-primary hover:bg-primary/5 text-white py-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all group">
                        <Icon name="target" className="text-2xl text-text-muted group-hover:text-primary"/> 
                        Darts Csomag
                    </button>
                </div>
            </div>
        </div>
    )
}