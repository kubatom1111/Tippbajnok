import React, { useState, useEffect, useRef } from 'react';
import { User, Championship, Match, QuestionType, ChatMessage } from './types';
import * as db from './storage';

// --- Icons (Material Symbols wrapper) ---
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<'AUTH' | 'DASHBOARD' | 'LEADERBOARD' | 'CHAT'>('AUTH');
  const [activeChamp, setActiveChamp] = useState<Championship | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const u = db.getSession();
    if (u) { setUser(u); setPage('DASHBOARD'); }
    else setPage('AUTH');
  }, []);

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setPage('AUTH');
    setMobileMenuOpen(false);
  };
  
  if (page === 'AUTH') return <AuthScreen onLogin={(u) => { setUser(u); setPage('DASHBOARD'); }} />;

  return (
    <div className="min-h-screen bg-background-dark text-white font-sans selection:bg-primary selection:text-white pb-20 md:pb-0">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border-dark bg-[#111a22]/95 backdrop-blur-md px-4 md:px-10 py-3 shadow-lg relative">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setPage('DASHBOARD'); setActiveChamp(null); setMobileMenuOpen(false); }}>
              <div className="size-10 flex items-center justify-center text-primary bg-primary/10 rounded-xl">
                <Icon name="sports_esports" className="text-3xl" />
              </div>
              <h2 className="text-white text-xl font-bold leading-tight tracking-tight">
                Tippbajnok
              </h2>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex flex-1 justify-end items-center gap-8">
               <div className="flex items-center gap-2 bg-surface-dark p-1 rounded-full border border-border-dark">
                  <button onClick={() => {setPage('DASHBOARD'); setActiveChamp(null);}} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${page === 'DASHBOARD' && !activeChamp ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Főoldal</button>
                  {activeChamp && (
                      <>
                        <button onClick={() => setPage('DASHBOARD')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${page === 'DASHBOARD' && activeChamp ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Meccsek</button>
                        <button onClick={() => setPage('LEADERBOARD')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${page === 'LEADERBOARD' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Ranglista</button>
                        <button onClick={() => setPage('CHAT')} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${page === 'CHAT' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Csevegés</button>
                      </>
                  )}
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

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Icon name={mobileMenuOpen ? "close" : "menu"} className="text-3xl" />
            </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-[#111a22] border-b border-border-dark shadow-2xl p-4 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-2 duration-200">
                {/* Mobile Navigation Links */}
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => {setPage('DASHBOARD'); setActiveChamp(null); setMobileMenuOpen(false);}} 
                        className={`p-3 rounded-xl text-left font-bold flex items-center gap-3 ${page === 'DASHBOARD' && !activeChamp ? 'bg-primary text-white' : 'bg-surface-dark text-text-muted'}`}
                    >
                        <Icon name="home" /> Főoldal
                    </button>
                    {activeChamp && (
                        <>
                            <button 
                                onClick={() => {setPage('DASHBOARD'); setMobileMenuOpen(false);}} 
                                className={`p-3 rounded-xl text-left font-bold flex items-center gap-3 ${page === 'DASHBOARD' && activeChamp ? 'bg-primary text-white' : 'bg-surface-dark text-text-muted'}`}
                            >
                                <Icon name="sports_soccer" /> Meccsek
                            </button>
                            <button 
                                onClick={() => {setPage('LEADERBOARD'); setMobileMenuOpen(false);}} 
                                className={`p-3 rounded-xl text-left font-bold flex items-center gap-3 ${page === 'LEADERBOARD' ? 'bg-primary text-white' : 'bg-surface-dark text-text-muted'}`}
                            >
                                <Icon name="leaderboard" /> Ranglista
                            </button>
                            <button 
                                onClick={() => {setPage('CHAT'); setMobileMenuOpen(false);}} 
                                className={`p-3 rounded-xl text-left font-bold flex items-center gap-3 ${page === 'CHAT' ? 'bg-primary text-white' : 'bg-surface-dark text-text-muted'}`}
                            >
                                <Icon name="chat" /> Csevegés
                            </button>
                        </>
                    )}
                </div>

                <div className="h-px bg-border-dark w-full"></div>

                {/* Mobile User Profile */}
                <div className="flex items-center justify-between bg-surface-dark p-3 rounded-xl border border-border-dark">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-blue-600 border border-white/10 flex items-center justify-center text-lg font-bold text-white">
                            {user?.username[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{user?.username}</p>
                            <p className="text-xs text-text-muted">Bejelentkezve</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-colors">
                        <Icon name="logout" />
                    </button>
                </div>
            </div>
        )}
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
                  ) : page === 'LEADERBOARD' ? (
                     <LeaderboardPage champ={activeChamp} />
                  ) : (
                     <ChatPage user={user!} champ={activeChamp} />
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

function ChatPage({ user, champ }: { user: User, champ: Championship }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        const msgs = await db.getChatMessages(champ.id);
        setMessages(msgs);
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000); // Polling for updates
        return () => clearInterval(interval);
    }, [champ.id]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setSending(true);
        try {
            await db.sendChatMessage(champ.id, user.id, text.trim());
            setText('');
            await loadMessages();
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden flex flex-col h-[calc(100vh-140px)] md:h-[600px] relative shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-border-dark bg-[#15202b] flex items-center gap-3 shrink-0">
                <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                    <Icon name="chat_bubble" className="text-xl"/>
                </div>
                <div>
                    <h3 className="font-bold text-white">Bajnoki Csevegő</h3>
                    <p className="text-xs text-text-muted">{champ.participants.length} résztvevő</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#101922] scroll-smooth">
                {messages.length === 0 && (
                    <div className="text-center py-10 opacity-50">
                        <Icon name="forum" className="text-5xl mb-2"/>
                        <p className="text-sm">Még nincsenek üzenetek. Kezdd te!</p>
                    </div>
                )}
                
                {messages.map((msg) => {
                    const isMe = msg.userId === user.id;
                    const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shrink-0 ${isMe ? 'bg-primary text-white' : 'bg-surface-dark text-text-muted'}`}>
                                {msg.username[0].toUpperCase()}
                            </div>
                            <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                    <span className="text-xs font-bold text-text-muted">{msg.username}</span>
                                    <span className="text-[10px] text-white/30">{time}</span>
                                </div>
                                <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    isMe 
                                    ? 'bg-primary text-white rounded-tr-none' 
                                    : 'bg-surface-dark text-white border border-border-dark rounded-tl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#15202b] border-t border-border-dark shrink-0">
                <form onSubmit={handleSend} className="flex gap-2 relative">
                    <input 
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Írj valamit..." 
                        className="w-full bg-input-dark border border-border-dark rounded-xl pl-4 pr-12 py-3.5 text-white focus:border-primary outline-none transition-all shadow-inner"
                    />
                    <button 
                        type="submit"
                        disabled={!text.trim() || sending}
                        className={`absolute right-1 top-1 bottom-1 aspect-square rounded-lg flex items-center justify-center transition-all ${
                            !text.trim() || sending ? 'bg-transparent text-slate-600' : 'bg-primary text-white hover:bg-blue-600 shadow-md'
                        }`}
                    >
                        <Icon name={sending ? "sync" : "send"} className={sending ? "animate-spin" : ""} />
                    </button>
                </form>
            </div>
        </div>
    );
}

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
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* Podium */}
                {globalRank.length > 0 && (
                    <div className="flex items-end justify-center gap-4 mb-12 min-h-[260px] pt-8">
                        {/* 2nd Place */}
                        {globalRank[1] && (
                            <div className="flex flex-col items-center w-1/3 max-w-[140px] relative z-10">
                                <div className="mb-4 text-center flex flex-col items-center">
                                    <div className="size-12 rounded-full bg-slate-700 border-2 border-slate-500 mb-2 flex items-center justify-center text-xl font-bold text-slate-300 shadow-lg">
                                        {globalRank[1].username[0].toUpperCase()}
                                    </div>
                                    <div className="font-bold text-white truncate w-full text-sm mb-1">{globalRank[1].username}</div>
                                    <div className="text-lg text-slate-300 font-black">{globalRank[1].points} p</div>
                                </div>
                                <div className="w-full h-32 bg-gradient-to-b from-slate-600 to-[#1a2632] border-t-4 border-slate-400 rounded-t-2xl flex items-start justify-center pt-2 shadow-2xl relative">
                                    <div className="absolute -top-4 size-8 rounded-full bg-slate-300 flex items-center justify-center font-black text-slate-900 text-sm border-4 border-[#15202b] shadow-lg">2</div>
                                    <Icon name="emoji_events" className="text-slate-400 text-5xl opacity-30 mt-6" />
                                </div>
                            </div>
                        )}
                        
                        {/* 1st Place */}
                        {globalRank[0] && (
                            <div className="flex flex-col items-center w-1/3 max-w-[160px] relative z-20 -mx-2">
                                {/* Glow Effect */}
                                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-[50px] rounded-full pointer-events-none"></div>
                                
                                <div className="mb-4 text-center flex flex-col items-center">
                                    <div className="size-16 rounded-full bg-yellow-600 border-2 border-yellow-400 mb-2 flex items-center justify-center text-2xl font-bold text-yellow-100 shadow-xl ring-4 ring-yellow-500/20">
                                        {globalRank[0].username[0].toUpperCase()}
                                    </div>
                                    <div className="font-bold text-yellow-100 truncate w-full text-base mb-1">{globalRank[0].username}</div>
                                    <div className="text-2xl text-yellow-400 font-black">{globalRank[0].points} p</div>
                                </div>
                                <div className="w-full h-44 bg-gradient-to-b from-yellow-600 to-[#1a2632] border-t-4 border-yellow-400 rounded-t-2xl flex items-start justify-center pt-2 shadow-2xl shadow-yellow-900/50 relative">
                                    <div className="absolute -top-5 size-10 rounded-full bg-yellow-400 flex items-center justify-center font-black text-yellow-900 text-xl border-4 border-[#15202b] shadow-lg">1</div>
                                    <Icon name="emoji_events" className="text-yellow-300 text-6xl opacity-40 mt-8" />
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {globalRank[2] && (
                            <div className="flex flex-col items-center w-1/3 max-w-[140px] relative z-10">
                                <div className="mb-4 text-center flex flex-col items-center">
                                    <div className="size-12 rounded-full bg-amber-800 border-2 border-amber-600 mb-2 flex items-center justify-center text-xl font-bold text-amber-200 shadow-lg">
                                        {globalRank[2].username[0].toUpperCase()}
                                    </div>
                                    <div className="font-bold text-white truncate w-full text-sm mb-1">{globalRank[2].username}</div>
                                    <div className="text-lg text-amber-500 font-black">{globalRank[2].points} p</div>
                                </div>
                                <div className="w-full h-24 bg-gradient-to-b from-amber-800 to-[#1a2632] border-t-4 border-amber-600 rounded-t-2xl flex items-start justify-center pt-2 shadow-2xl relative">
                                    <div className="absolute -top-4 size-8 rounded-full bg-amber-600 flex items-center justify-center font-black text-amber-100 text-sm border-4 border-[#15202b] shadow-lg">3</div>
                                    <Icon name="emoji_events" className="text-amber-500 text-4xl opacity-30 mt-4" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* List - Improved Visibility */}
                <div className="flex flex-col gap-2">
                    {globalRank.slice(3).map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-surface-dark border border-border-dark rounded-xl hover:border-primary/30 transition-all hover:bg-[#1a2632] group">
                            <div className="flex items-center gap-4">
                                <div className="size-8 rounded-lg bg-[#0f151b] border border-border-dark flex items-center justify-center font-mono font-bold text-white group-hover:text-primary transition-colors">
                                    {i + 4}.
                                </div>
                                <div className="font-bold text-white text-lg">{r.username}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-primary text-xl">{r.points} p</div>
                            </div>
                        </div>
                    ))}
                    {globalRank.length === 0 && (
                        <div className="p-8 text-center text-text-muted bg-surface-dark rounded-xl border border-border-dark border-dashed">
                            Nincs még adat a ranglistán.
                        </div>
                    )}
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
   const now = new Date();
   const isLive = !isFinished && isLocked; // Simplified LIVE logic
   
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
      <div className={`relative bg-[#15202b] rounded-2xl border overflow-hidden shadow-lg transition-all ${expanded ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border-dark hover:border-primary/30'}`}>
         
         {/* Top Banner Status */}
         <div className="flex items-center justify-between px-4 py-2 bg-black/20 text-xs font-bold border-b border-white/5">
             <div className="flex items-center gap-2">
                 {isLive && <span className="flex items-center gap-1 text-red-500 animate-pulse"><span className="size-2 rounded-full bg-red-500"></span> ÉLŐ</span>}
                 {!isLive && !isFinished && <span className="text-text-muted">{start.toLocaleDateString()} - {start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                 {isFinished && <span className="text-slate-400">VÉGET ÉRT</span>}
             </div>
             {hasBet && !isFinished && (
                 <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                     <Icon name="confirmation_number" className="text-xs"/> Tipp Leadva
                 </div>
             )}
         </div>

         {/* Main Card Content */}
         <div className="p-5 flex flex-col cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
             <div className="flex justify-between items-center mb-4">
                 <div className="text-xl md:text-2xl font-black text-white">{match.player1}</div>
                 <div className="text-xs font-black text-text-muted bg-surface-dark px-2 py-1 rounded-full border border-border-dark">VS</div>
                 <div className="text-xl md:text-2xl font-black text-white text-right">{match.player2}</div>
             </div>
             
             <div className="flex justify-between items-end">
                 <div className="flex flex-col gap-1">
                     <span className="text-xs text-text-muted font-bold uppercase">{match.questions.length} fogadási piac</span>
                     {points !== null && <span className="text-primary font-black text-lg bg-primary/10 px-2 py-0.5 rounded w-fit">+{points} PONT</span>}
                 </div>
                 <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${expanded ? 'bg-surface-dark text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
                     {expanded ? 'Bezárás' : (hasBet ? 'Tipp Mutatása' : 'Tippelés')} <Icon name={expanded ? "expand_less" : "chevron_right"} className="text-base"/>
                 </button>
             </div>
         </div>

         {/* Expandable Betting/Admin Area */}
         {expanded && (
            <div className="p-6 bg-[#1a2632] border-t border-border-dark animate-in slide-in-from-top-2 duration-200">
               
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
                                 {(q.type === QuestionType.WINNER || q.type === QuestionType.CHOICE) && (
                                    <div className="flex gap-2">
                                       {(q.options || [match.player1, match.player2]).map(p => (
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
                                    {(q.type === QuestionType.WINNER || q.type === QuestionType.CHOICE) && (
                                       <div className="flex gap-2">
                                          {(q.options || [match.player1, match.player2]).map(p => (
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
   const [stats, setStats] = useState<{rank: number, points: number, totalPlayers: number, top3: any[]}>({rank: 0, points: 0, totalPlayers: 0, top3: []});
   const isAdmin = champ.adminId === user.id;

   useEffect(() => { 
       const load = async () => {
           setMatches(await db.getMatches(champ.id));
           
           // Calculate quick stats for header
           const users = await db.getAllUsers();
           const results = await db.fetchResults();
           const matchesData = await db.getMatches(champ.id);
           const scores: Record<string, any> = {};
           
           if(champ.participants) {
               champ.participants.forEach(u => scores[u] = { id: u, name: users[u] || '?', points: 0 });
           }
           
           for (const m of matchesData.filter(x => x.status === 'FINISHED')) {
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
           
           const sorted = Object.values(scores).sort((a,b) => b.points - a.points);
           const myRankIndex = sorted.findIndex(x => x.id === user.id);
           
           setStats({
               rank: myRankIndex + 1,
               points: scores[user.id]?.points || 0,
               totalPlayers: sorted.length,
               top3: sorted.slice(0, 3)
           });
       }; 
       load(); 
    }, [champ, triggerRefresh, showCreateMatch, user]);

   return (
      <>
         {/* Mobile Dashboard / Hero */}
         <div className="mb-6 space-y-4">
             <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-black text-white">{champ.name}</h1>
                     <p className="text-text-muted text-sm flex items-center gap-1 mt-1"><Icon name="key" className="text-sm"/> Kód: <span className="text-white font-mono bg-surface-dark px-2 rounded border border-border-dark">{champ.joinCode}</span></p>
                </div>
                 {isAdmin && <button onClick={() => setShowCreateMatch(true)} className="bg-primary/10 hover:bg-primary/20 text-primary size-10 flex items-center justify-center rounded-xl font-bold border border-primary/20 transition-all"><Icon name="add" className="text-2xl"/></button>}
             </div>
             
             {/* Personal Stats Card */}
             <div className="bg-gradient-to-r from-blue-900 to-[#15202b] rounded-2xl p-5 border border-white/10 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
                 <div className="relative z-10 grid grid-cols-3 divide-x divide-white/10">
                     <div className="text-center px-2">
                         <div className="text-xs text-blue-200 uppercase font-bold mb-1">Helyezés</div>
                         <div className="text-2xl font-black text-white">{stats.rank}. <span className="text-sm text-white/50 font-normal">/ {stats.totalPlayers}</span></div>
                     </div>
                     <div className="text-center px-2">
                         <div className="text-xs text-blue-200 uppercase font-bold mb-1">Pontszám</div>
                         <div className="text-2xl font-black text-primary">{stats.points}</div>
                     </div>
                     <div className="text-center px-2">
                         <div className="text-xs text-blue-200 uppercase font-bold mb-1">Aktív Meccs</div>
                         <div className="text-2xl font-black text-white">{matches.filter(m => m.status === 'SCHEDULED').length}</div>
                     </div>
                 </div>
             </div>

             {/* Mobile Top 3 Mini-Leaderboard */}
             <div className="lg:hidden">
                 <div className="text-xs font-bold text-text-muted uppercase mb-2 ml-1">Top 3 Játékos</div>
                 <div className="grid grid-cols-3 gap-2">
                     {stats.top3.map((p, i) => (
                         <div key={p.id} className="bg-surface-dark border border-border-dark rounded-xl p-2 flex flex-col items-center text-center">
                             <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${i===0?'bg-yellow-500 text-black':i===1?'bg-slate-400 text-black':'bg-amber-700 text-white'}`}>{i+1}</div>
                             <div className="text-xs font-bold text-white truncate w-full">{p.name}</div>
                             <div className="text-xs text-primary font-bold">{p.points}p</div>
                         </div>
                     ))}
                     {stats.top3.length === 0 && <div className="col-span-3 text-center text-xs text-text-muted italic">Még nincs adat.</div>}
                 </div>
             </div>
         </div>

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
             <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Tippbajnok</h1>
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
           ? [
               { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Mérkőzés Győztese', points: 2, options: [p1, 'Döntetlen', p2] },
               { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos Végeredmény', points: 5 },
               { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Félidő Eredmény', points: 2, options: [p1, 'Döntetlen', p2] },
               { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: 'Gólszám 2.5', points: 1 },
               { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Mindkét csapat lő gólt?', points: 1, options: ['Igen', 'Nem'] },
               { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: 'Szögletek 9.5', points: 1 }
             ]
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