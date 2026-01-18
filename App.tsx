import React, { useState, useEffect, useRef } from 'react';
import { User, Championship, Match, QuestionType, ChatMessage } from './types';
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

        {/* Mobile Menu Toggle (Placeholder) */}
        <div className="md:hidden flex items-center gap-3">
             <div className="size-8 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-sm font-bold text-primary">
                 {user?.username[0].toUpperCase()}
              </div>
             <button onClick={handleLogout}><Icon name="logout" className="text-text-muted" /></button>
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
      
      {/* Mobile Bottom Nav */}
      {activeChamp && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111a22] border-t border-border-dark flex justify-around p-3 z-50 safe-area-bottom">
           <button onClick={() => setPage('DASHBOARD')} className={`flex flex-col items-center gap-1 ${page === 'DASHBOARD' ? 'text-primary' : 'text-text-muted'}`}>
              <Icon name="calendar_month" />
              <span className="text-[10px] font-bold">Meccsek</span>
           </button>
           <button onClick={() => setPage('LEADERBOARD')} className={`flex flex-col items-center gap-1 ${page === 'LEADERBOARD' ? 'text-primary' : 'text-text-muted'}`}>
              <Icon name="leaderboard" />
              <span className="text-[10px] font-bold">Ranglista</span>
           </button>
           <button onClick={() => {setActiveChamp(null); setPage('DASHBOARD');}} className="flex flex-col items-center gap-1 text-text-muted">
              <Icon name="arrow_back" />
              <span className="text-[10px] font-bold">Vissza</span>
           </button>
        </div>
      )}
    </div>
  );
}

// --- Screens & Components ---

function DashboardHome({ user, onOpenChamp }: { user: User, onOpenChamp: (c: Championship) => void }) {
  const [champs, setChamps] = useState<Championship[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ points: 0, rank: '-', topUser: '?' });
  const [globalRank, setGlobalRank] = useState<any[]>([]);
  const [tab, setTab] = useState<'CHAMPS' | 'GLOBAL'>('CHAMPS');

  useEffect(() => { 
      const load = async () => {
          setChamps(await db.getMyChamps(user.id));
          
          const gStats = await db.getGlobalStats();
          setGlobalRank(gStats);
          
          const myStat = gStats.find(s => s.username === user.username);
          setStats({
              points: myStat?.points || 0,
              rank: myStat ? (gStats.indexOf(myStat) + 1).toString() : '-',
              topUser: gStats[0]?.username || '?'
          });
      }; 
      load(); 
  }, [showCreate, user]);

  return (
     <div className="max-w-5xl mx-auto space-y-8">
        
        {/* User Stats Hero */}
        <div className="bg-gradient-to-r from-surface-dark to-[#16202a] rounded-3xl p-8 border border-border-dark shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="size-20 rounded-full bg-surface-dark border-4 border-primary/20 flex items-center justify-center text-3xl font-black text-white shadow-glow">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white">Szia, {user.username}!</h2>
                        <p className="text-text-muted">Jó újra látni a pályán.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-[#101922]/60 backdrop-blur-sm p-4 rounded-2xl border border-border-dark min-w-[120px] text-center">
                        <div className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Összpontszám</div>
                        <div className="text-3xl font-black text-primary">{stats.points}</div>
                    </div>
                    <div className="bg-[#101922]/60 backdrop-blur-sm p-4 rounded-2xl border border-border-dark min-w-[120px] text-center">
                        <div className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Globális Hely</div>
                        <div className="text-3xl font-black text-white">#{stats.rank}</div>
                    </div>
                </div>
             </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border-dark pb-1">
            <div className="flex gap-6">
                <button onClick={() => setTab('CHAMPS')} className={`pb-3 text-lg font-bold transition-all relative ${tab === 'CHAMPS' ? 'text-white' : 'text-text-muted hover:text-white'}`}>
                    Bajnokságaim
                    {tab === 'CHAMPS' && <div className="absolute bottom-[-5px] left-0 w-full h-1 bg-primary rounded-full shadow-glow"></div>}
                </button>
                <button onClick={() => setTab('GLOBAL')} className={`pb-3 text-lg font-bold transition-all relative ${tab === 'GLOBAL' ? 'text-white' : 'text-text-muted hover:text-white'}`}>
                    Globális Ranglista
                    {tab === 'GLOBAL' && <div className="absolute bottom-[-5px] left-0 w-full h-1 bg-accent rounded-full shadow-glow"></div>}
                </button>
            </div>
            {tab === 'CHAMPS' && (
                <button onClick={() => setShowCreate(true)} className="bg-surface-dark hover:bg-border-dark text-white px-4 py-2 rounded-full font-bold text-sm border border-border-dark transition-all flex items-center gap-2">
                    <Icon name="add_circle" /> Új Bajnokság
                </button>
            )}
        </div>

        {/* Content Area */}
        {tab === 'CHAMPS' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {champs.map(c => (
                <div key={c.id} onClick={() => onOpenChamp(c)} className="bg-surface-dark border border-border-dark p-6 rounded-2xl hover:border-primary/50 hover:shadow-lg cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between h-56">
                    <div className="absolute -right-4 -top-4 text-[#1a2632] opacity-50 group-hover:opacity-100 group-hover:text-[#233648] transition-all">
                        <Icon name="trophy" className="text-[140px]" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-primary/10 text-primary w-fit px-2 py-1 rounded-md text-[10px] font-bold uppercase mb-3 border border-primary/20">Aktív</div>
                        <h3 className="text-2xl font-black text-white leading-tight mb-1">{c.name}</h3>
                        <p className="text-text-muted text-sm">Kód: <span className="font-mono text-white">{c.joinCode}</span></p>
                    </div>
                    <div className="relative z-10 border-t border-border-dark pt-4 mt-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {c.participants.slice(0,3).map((p,i) => (
                                <div key={i} className="size-8 rounded-full bg-border-dark border-2 border-surface-dark flex items-center justify-center text-xs font-bold text-text-muted">P{i+1}</div>
                            ))}
                            {c.participants.length > 3 && <div className="size-8 rounded-full bg-border-dark border-2 border-surface-dark flex items-center justify-center text-xs font-bold text-white">+{c.participants.length-3}</div>}
                        </div>
                        <span className="text-xs font-bold text-primary flex items-center gap-1">Belépés <Icon name="arrow_forward" className="text-sm" /></span>
                    </div>
                </div>
            ))}
            {champs.length === 0 && (
                <div className="col-span-full py-16 text-center border-2 border-dashed border-border-dark rounded-3xl bg-surface-dark/30">
                    <div className="size-16 bg-border-dark rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted"><Icon name="sports_esports" className="text-3xl"/></div>
                    <p className="text-white font-bold text-lg">Még nem vagy tagja egy bajnokságnak sem.</p>
                    <p className="text-text-muted text-sm mb-6">Hozz létre egyet a haveroknak, vagy lépj be egy kód segítségével!</p>
                    <button onClick={() => setShowCreate(true)} className="text-primary font-bold hover:underline">Indítás most</button>
                </div>
            )}
            </div>
        ) : (
            <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#15202b] text-xs uppercase text-text-muted font-bold border-b border-border-dark">
                        <tr>
                            <th className="p-4 w-16 text-center">#</th>
                            <th className="p-4">Játékos</th>
                            <th className="p-4 text-center">Pontos Tipp</th>
                            <th className="p-4 text-right">Összpont</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                        {globalRank.map((r, i) => (
                            <tr key={i} className={`group hover:bg-white/5 ${r.username === user.username ? 'bg-primary/5' : ''}`}>
                                <td className="p-4 text-center font-mono text-text-muted">{i+1}</td>
                                <td className="p-4 flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-input-dark flex items-center justify-center font-bold text-xs">{r.username[0]}</div>
                                    <span className={`font-bold ${r.username === user.username ? 'text-primary' : 'text-white'}`}>{r.username}</span>
                                </td>
                                <td className="p-4 text-center text-text-muted font-mono">{r.correct}</td>
                                <td className="p-4 text-right font-black text-white text-lg">{r.points}</td>
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
   
   // Init
   useEffect(() => {
      const bets = db.getBets(match.id);
      const myBet = bets.find(b => b.userId === user.id);
      if (myBet) {
         setHasBet(true);
         setAnswers(myBet.answers);
      } else {
         setHasBet(false);
         setAnswers({});
      }
      
      if (isFinished && myBet) {
         const result = db.getResults().find(r => r.matchId === match.id);
         if (result) {
            let p = 0;
            match.questions.forEach(q => { if (String(myBet.answers[q.id]) === String(result.answers[q.id])) p += q.points; });
            setPoints(p);
         }
      }
   }, [match, user, isFinished, expanded]); // Reload when expanded to ensure fresh state

   const toggleExpand = () => {
      if (!expanded) {
         // Open logic
      }
      setExpanded(!expanded);
   };

   const handleSave = async () => {
      await db.saveBet({ userId: user.id, matchId: match.id, answers, timestamp: new Date().toISOString() });
      setHasBet(true);
      setExpanded(false);
      refresh();
   };

   // Result handling for admin
   const [resultMode, setResultMode] = useState(false);
   const handleResultSave = async () => {
      if(confirm('Lezárod a meccset?')) {
         await db.closeMatch({ matchId: match.id, answers });
         setResultMode(false);
         refresh();
      }
   };

   // Colors & Status
   const statusColor = isFinished ? 'text-text-muted' : isLocked ? 'text-accent' : 'text-primary';
   const statusText = isFinished ? 'VÉGE' : isLocked ? 'ÉLŐ / ZÁRT' : 'TIPPELHETŐ';

   return (
      <div className={`bg-surface-dark rounded-2xl border border-border-dark overflow-hidden shadow-lg transition-all duration-300 ${expanded ? 'ring-1 ring-primary/30' : 'hover:border-primary/30'}`}>
         {/* Header Row */}
         <div className="bg-[#15202b] p-4 flex flex-col md:flex-row justify-between items-center border-b border-border-dark gap-4 cursor-pointer" onClick={toggleExpand}>
            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start flex-1">
               {/* Player 1 */}
               <div className="flex items-center gap-3 flex-1 md:flex-none justify-end md:justify-start">
                   <div className="text-right md:text-left">
                      <p className="text-white font-bold text-lg leading-tight">{match.player1}</p>
                   </div>
                   <div className="size-10 rounded-full bg-surface-dark border-2 border-border-dark flex items-center justify-center font-bold text-text-muted">
                      {match.player1[0]}
                   </div>
               </div>

               {/* VS / Time */}
               <div className="flex flex-col items-center px-2">
                  <span className="text-text-muted text-[10px] font-bold bg-input-dark px-2 py-1 rounded mb-1">{start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  <span className="text-white font-black text-xl italic opacity-50">VS</span>
               </div>

               {/* Player 2 */}
               <div className="flex items-center gap-3 flex-1 md:flex-none">
                   <div className="size-10 rounded-full bg-surface-dark border-2 border-border-dark flex items-center justify-center font-bold text-text-muted">
                      {match.player2[0]}
                   </div>
                   <div className="text-left">
                      <p className="text-white font-bold text-lg leading-tight">{match.player2}</p>
                   </div>
               </div>
            </div>

            {/* Status & Points */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
               {points !== null ? (
                   <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-bold text-sm">
                      +{points} PONT
                   </div>
               ) : (
                  <div className="flex items-center gap-2">
                      <span className={`relative flex h-2 w-2 ${isFinished ? 'hidden' : ''}`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLocked ? 'bg-accent' : 'bg-primary'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isLocked ? 'bg-accent' : 'bg-primary'}`}></span>
                      </span>
                      <p className={`${statusColor} text-xs font-bold uppercase tracking-wider`}>{statusText}</p>
                  </div>
               )}
               <Icon name={expanded ? "expand_less" : "expand_more"} className="text-text-muted" />
            </div>
         </div>

         {/* Expanded Area (Prediction Form) */}
         {expanded && (
            <div className="p-6 bg-[#1a2632]">
               {!isLocked && !isFinished ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {match.questions.map(q => (
                         <div key={q.id} className="space-y-3">
                            <label className="text-text-muted text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                               <Icon name="emoji_events" className="text-sm" /> {q.label} <span className="text-primary ml-1">({q.points}p)</span>
                            </label>
                            
                            {q.type === QuestionType.WINNER && (
                               <div className="flex gap-2 p-1 bg-[#111a22] rounded-full border border-border-dark">
                                  {[match.player1, match.player2].map(p => (
                                     <button key={p} onClick={() => setAnswers({...answers, [q.id]: p})} className={`flex-1 py-2 px-4 rounded-full font-bold text-sm transition-all flex justify-center items-center gap-2 ${answers[q.id] === p ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white hover:bg-border-dark'}`}>
                                        {p} {answers[q.id] === p && <Icon name="check_circle" className="text-sm" />}
                                     </button>
                                  ))}
                               </div>
                            )}

                            {q.type === QuestionType.EXACT_SCORE && (
                               <div className="flex items-center bg-[#111a22] rounded-full border border-border-dark px-4 py-2">
                                  <input 
                                    className="bg-transparent text-white font-mono font-bold text-lg w-full text-center outline-none" 
                                    placeholder="pl. 3-1"
                                    value={answers[q.id] || ''}
                                    onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                  />
                               </div>
                            )}

                            {q.type === QuestionType.OVER_UNDER && (
                               <div className="flex gap-2">
                                  <button onClick={() => setAnswers({...answers, [q.id]: 'OVER'})} className={`flex-1 py-2.5 rounded-full font-bold text-sm border transition-all ${answers[q.id] === 'OVER' ? 'bg-background-dark border-accent text-accent shadow-glow' : 'bg-background-dark border-border-dark text-text-muted hover:border-text-muted'}`}>FELETT</button>
                                  <button onClick={() => setAnswers({...answers, [q.id]: 'UNDER'})} className={`flex-1 py-2.5 rounded-full font-bold text-sm border transition-all ${answers[q.id] === 'UNDER' ? 'bg-background-dark border-accent text-accent shadow-glow' : 'bg-background-dark border-border-dark text-text-muted hover:border-text-muted'}`}>ALATT</button>
                               </div>
                            )}
                            
                            {(q.type === QuestionType.CHOICE && q.options) && (
                               <div className="flex flex-col gap-2">
                                  {q.options.map(opt => (
                                      <button key={opt} onClick={() => setAnswers({...answers, [q.id]: opt})} className={`w-full py-2 bg-background-dark border rounded-full text-sm font-medium transition-all ${answers[q.id] === opt ? 'border-primary text-white' : 'border-border-dark text-text-muted'}`}>
                                          {opt}
                                      </button>
                                  ))}
                               </div>
                            )}
                         </div>
                      ))}
                      <div className="md:col-span-2 pt-4 border-t border-border-dark flex justify-end">
                          <button onClick={handleSave} className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex items-center gap-2">
                             <Icon name="save" /> Tipp Mentése
                          </button>
                      </div>
                   </div>
               ) : (
                   <div className="text-center py-6">
                       <p className="text-text-muted mb-2">{isFinished ? 'A mérkőzés véget ért.' : 'A tippelés lezárult.'}</p>
                       <div className="inline-flex flex-col gap-2 text-left bg-[#111a22] p-4 rounded-xl border border-border-dark min-w-[250px]">
                          <span className="text-xs font-bold text-primary uppercase">Tippjeid:</span>
                          {match.questions.map(q => (
                             <div key={q.id} className="flex justify-between text-sm">
                                <span className="text-text-muted">{q.label}:</span>
                                <span className="font-bold text-white">{answers[q.id] || '-'}</span>
                             </div>
                          ))}
                       </div>
                       
                       {/* Admin Result Entry Block */}
                       {isAdmin && !isFinished && (
                          <div className="mt-8 border-t border-border-dark pt-4">
                             <h4 className="text-white font-bold mb-4">Eredmény Rögzítése (Admin)</h4>
                             <div className="grid gap-4 max-w-md mx-auto">
                                {match.questions.map(q => (
                                   <input key={q.id} placeholder={q.label} value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} className="bg-input-dark border border-border-dark rounded p-2 text-white" />
                                ))}
                                <button onClick={handleResultSave} className="bg-accent text-black font-bold py-2 rounded">Eredmény Mentése</button>
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

   const load = async () => setMatches(await db.getMatches(champ.id));
   useEffect(() => { load(); }, [champ, triggerRefresh, showCreateMatch]);

   // Helper: Find next match for hero
   const nextMatch = matches.find(m => m.status === 'SCHEDULED' && new Date(m.startTime) > new Date());

   return (
      <>
         {/* Hero Section */}
         <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-gradient-to-r from-surface-dark to-[#16202a] p-6 rounded-2xl border border-border-dark shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="flex flex-col gap-2 z-10 relative">
               <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">LIVE</span>
                  <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">{champ.name}</h1>
               </div>
               <p className="text-text-muted text-sm md:text-base max-w-lg">
                  {nextMatch ? `Következő meccs: ${nextMatch.player1} vs ${nextMatch.player2}` : 'Jelenleg nincs aktív mérkőzés.'}
               </p>
            </div>
            {/* Simple Timer Visual */}
            <div className="flex items-center gap-4 bg-[#101922]/50 p-4 rounded-xl border border-dashed border-border-dark backdrop-blur-sm z-10">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider mb-1">MÉRKŐZÉSEK</span>
                  <div className="text-2xl font-mono font-bold text-white">{matches.length}</div>
               </div>
            </div>
         </div>

         {/* Matches Header */}
         <div className="flex items-center justify-between">
             <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <Icon name="calendar_month" className="text-primary" /> Következő Meccsek
             </h2>
             {isAdmin && (
                <button onClick={() => setShowCreateMatch(true)} className="px-4 py-2 bg-surface-dark border border-border-dark text-white text-sm font-medium rounded-full hover:bg-border-dark transition-colors flex items-center gap-1">
                   <Icon name="add" className="text-sm" /> Új Meccs
                </button>
             )}
         </div>

         {/* Match List */}
         <div className="flex flex-col gap-6">
            {matches.map(m => (
               <InlineMatchCard key={m.id} match={m} user={user} isAdmin={isAdmin} refresh={load} />
            ))}
            {matches.length === 0 && <div className="text-center py-10 text-text-muted">Nincsenek meccsek rögzítve.</div>}
         </div>

         {showCreateMatch && <CreateMatchModal champId={champ.id} onClose={() => setShowCreateMatch(false)} />}
      </>
   );
}

// --- Leaderboard Page & Widget ---

function LeaderboardPage({ champ }: { champ: Championship }) {
    const [entries, setEntries] = useState<any[]>([]);
    
    useEffect(() => {
        const load = async () => {
            const matches = await db.getMatches(champ.id);
            const users = db.getAllUsers();
            const results = db.getResults();
            const scores: Record<string, any> = {};
            
            champ.participants.forEach(u => scores[u] = { id: u, name: users[u] || '?', points: 0, correct: 0 });
            
            matches.filter(m => m.status === 'FINISHED').forEach(m => {
                const res = results.find(r => r.matchId === m.id);
                if(!res) return;
                const bets = db.getBets(m.id);
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
            });
            setEntries(Object.values(scores).sort((a,b) => b.points - a.points));
        };
        load();
    }, [champ]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Ranglista</h1>
                <p className="text-text-muted text-base">Kövesd a helyezésed a {champ.name} bajnokságban.</p>
            </div>
            
            <div className="w-full overflow-hidden rounded-2xl border border-border-dark bg-surface-dark shadow-xl">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-[#15202b] border-b border-border-dark">
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider w-24">Hely</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Név</th>
                            <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Találat</th>
                            <th className="px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider text-right">Pontok</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dark">
                         {entries.map((e, i) => (
                             <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                   <div className={`flex items-center justify-center w-12 h-8 rounded-full border text-sm font-bold ${
                                      i===0 ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                      i===1 ? 'bg-slate-300/10 text-slate-300 border-slate-300/20' :
                                      i===2 ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                                      'bg-border-dark text-text-muted border-transparent'
                                   }`}>
                                      {i < 3 && <Icon name="emoji_events" className="text-base mr-1" />} {i+1}
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="size-10 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center font-bold text-text-muted">{e.name[0]}</div>
                                      <p className="text-white font-bold group-hover:text-primary transition-colors">{e.name}</p>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">{e.correct}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <span className="text-2xl font-black text-white tracking-tight">{e.points}</span>
                                </td>
                             </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
        </div>
    );
}

function SidebarWidget({ user, champ, setPage }: { user: User, champ: Championship, setPage: any }) {
    // Mini leaderboard logic similar to full page but simplified
    const [top3, setTop3] = useState<any[]>([]);
    const [myRank, setMyRank] = useState<any>(null);

    useEffect(() => {
        // ... (Similar logic to LeaderboardPage, just slicing top 3 and finding user)
        // For brevity, using simplified mock or repeating logic:
        const load = async () => {
             const matches = await db.getMatches(champ.id);
             const users = db.getAllUsers();
             const results = db.getResults();
             const scores: Record<string, any> = {};
             champ.participants.forEach(u => scores[u] = { id: u, name: users[u] || '?', points: 0 });
             matches.filter(m => m.status === 'FINISHED').forEach(m => {
                 const res = results.find(r => r.matchId === m.id);
                 if(!res) return;
                 const bets = db.getBets(m.id);
                 bets.forEach(b => {
                     if(scores[b.userId]) {
                         m.questions.forEach(q => { if(String(b.answers[q.id]) === String(res.answers[q.id])) scores[b.userId].points += q.points; });
                     }
                 });
             });
             const sorted = Object.values(scores).sort((a,b) => b.points - a.points);
             setTop3(sorted.slice(0, 3));
             const myIdx = sorted.findIndex(s => s.id === user.id);
             if(myIdx !== -1) setMyRank({ ...sorted[myIdx], rank: myIdx + 1 });
        };
        load();
    }, [champ]);

    return (
       <div className="bg-surface-dark rounded-2xl border border-border-dark p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-white text-lg font-bold">Top Játékosok</h3>
             <button onClick={() => setPage('LEADERBOARD')} className="text-primary text-sm font-medium hover:underline">Teljes lista</button>
          </div>
          <div className="flex flex-col gap-1">
             {top3.map((entry, i) => (
                <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl border ${i===0 ? 'bg-[#15202b] border-border-dark' : 'border-transparent'}`}>
                   <div className="flex items-center gap-3">
                      <span className={`font-black text-lg w-6 text-center ${i===0 ? 'text-accent' : 'text-text-muted'}`}>{i+1}</span>
                      <div className="size-8 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-xs text-white">{entry.name[0]}</div>
                      <span className={`text-sm font-medium ${i===0 ? 'text-white' : 'text-text-muted'}`}>{entry.name}</span>
                   </div>
                   <span className={`${i===0 ? 'text-white' : 'text-text-muted'} font-bold`}>{entry.points} pts</span>
                </div>
             ))}
             
             {/* Current User if not in top 3 */}
             {myRank && myRank.rank > 3 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30 mt-2">
                   <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-lg w-6 text-center">{myRank.rank}</span>
                      <div className="size-8 rounded-full bg-primary flex items-center justify-center text-xs text-white">{myRank.name[0]}</div>
                      <span className="text-white font-medium text-sm">Te ({myRank.name})</span>
                   </div>
                   <span className="text-white font-bold">{myRank.points} pts</span>
                </div>
             )}
          </div>
       </div>
    );
}

function PromoWidget() {
   return (
      <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-center shadow-lg shadow-blue-900/50 relative overflow-hidden">
         <div className="relative z-10">
             <Icon name="stars" className="text-white text-4xl mb-2" />
             <h3 className="text-white font-black text-xl mb-1">Prémium Bajnokság</h3>
             <p className="text-white/80 text-sm mb-4">Hozz létre korlátlan privát ligát és statisztikát.</p>
             <button className="bg-white text-primary font-bold py-2 px-6 rounded-full text-sm hover:bg-gray-100 transition-colors">Upgrade</button>
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
        if (!username || !password) {
            setError('Minden mező kitöltése kötelező!');
            return;
        }
        setLoading(true);
        setError('');
        try { 
            const user = isRegistering 
                ? await db.register(username, password) 
                : await db.login(username, password);
            onLogin(user); 
        } catch (e: any) { 
            setError(e.message); 
        } finally {
            setLoading(false);
        }
    };

    return (
       <div className="min-h-screen flex items-center justify-center p-4 bg-background-dark">
          <div className="w-full max-w-md bg-surface-dark p-8 rounded-2xl border border-border-dark text-center shadow-2xl">
             <div className="inline-flex p-4 rounded-full bg-[#111a22] text-primary mb-6 border border-border-dark">
                <Icon name="sports_esports" className="text-4xl" />
             </div>
             <h1 className="text-3xl font-black text-white mb-2">HaverTipp</h1>
             <p className="text-text-muted mb-8">{isRegistering ? 'Hozz létre fiókot és tippelj!' : 'Lépj be és kezdj el tippelni'}</p>
             
             <div className="space-y-4 text-left">
                <div>
                    <label className="text-xs font-bold text-text-muted uppercase ml-1">Felhasználónév</label>
                    <input 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        className="w-full mt-1 bg-input-dark border border-border-dark rounded-xl p-3 text-white placeholder-text-muted focus:border-primary outline-none focus:ring-1 focus:ring-primary transition-all" 
                        placeholder="Pl. Alex99" 
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-text-muted uppercase ml-1">Jelszó</label>
                    <input 
                        type="password"
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full mt-1 bg-input-dark border border-border-dark rounded-xl p-3 text-white placeholder-text-muted focus:border-primary outline-none focus:ring-1 focus:ring-primary transition-all" 
                        placeholder="••••••••" 
                    />
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">{error}</div>}

                <button onClick={handleSubmit} disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-glow transition-all disabled:opacity-50">
                    {loading ? 'Folyamatban...' : (isRegistering ? 'Regisztráció' : 'Belépés')}
                </button>
                
                <div className="text-sm text-text-muted text-center pt-2">
                    {isRegistering ? 'Már van fiókod? ' : 'Nincs fiókod? '} 
                    <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-primary font-bold hover:underline">
                        {isRegistering ? 'Belépés' : 'Regisztráció'}
                    </button>
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
    // Simplified create match for brevity, sticking to design feel
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
                    <button onClick={() => save('F')} className="bg-surface-dark border border-border-dark hover:border-primary text-white py-3 rounded-lg font-bold">⚽ Foci Sablon</button>
                    <button onClick={() => save('D')} className="bg-surface-dark border border-border-dark hover:border-primary text-white py-3 rounded-lg font-bold">🎯 Darts Sablon</button>
                </div>
                <button onClick={onClose} className="w-full mt-4 text-text-muted">Mégse</button>
            </div>
        </div>
    )
}