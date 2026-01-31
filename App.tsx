import React, { useState, useEffect, useRef } from 'react';
import { User, Championship, Match, QuestionType, ChatMessage } from './types';
import * as db from './storage';
import { MatchList } from './components/MatchList';
import { CreateMatchModal } from './components/CreateMatchModal';
import { Leaderboard } from './components/Leaderboard';
import { Button } from './components/Button';
import { InviteModal } from './components/InviteModal';

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

function CreateChampModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [mode, setMode] = useState<'CREATE' | 'JOIN'>('CREATE');

    const handleCreate = async () => {
        if(!name || !code) return;
        try {
            await db.createChamp(name, code, userId);
            onClose();
        } catch(e: any) { alert(e.message); }
    };

    const handleJoin = async () => {
        if(!code) return;
        try {
            await db.joinChamp(code, userId);
            onClose();
        } catch(e: any) { alert(e.message); }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-surface-dark w-full max-w-md rounded-2xl p-6 border border-border-dark relative shadow-2xl">
                 <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white"><Icon name="close" /></button>
                 
                 <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                     <button onClick={() => setMode('CREATE')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'CREATE' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Létrehozás</button>
                     <button onClick={() => setMode('JOIN')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'JOIN' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Csatlakozás</button>
                 </div>

                 {mode === 'CREATE' ? (
                     <div className="space-y-4">
                         <h3 className="text-xl font-black text-white">Új Bajnokság</h3>
                         <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Bajnokság neve" value={name} onChange={e => setName(e.target.value)} />
                         <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Egyedi Csatlakozási Kód" value={code} onChange={e => setCode(e.target.value)} />
                         <button onClick={handleCreate} className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold">Létrehozás</button>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         <h3 className="text-xl font-black text-white">Csatlakozás</h3>
                         <input className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none" placeholder="Csatlakozási Kód" value={code} onChange={e => setCode(e.target.value)} />
                         <button onClick={handleJoin} className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold">Csatlakozás</button>
                     </div>
                 )}
            </div>
        </div>
    );
}

function AuthScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = isLogin ? await db.login(username, password) : await db.register(username, password);
      onLogin(u);
    } catch (err: any) {
      setError(err.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
       <div className="w-full max-w-md bg-surface-dark border border-border-dark p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary mb-4">
                 <Icon name="sports_esports" className="text-4xl" />
              </div>
              <h1 className="text-3xl font-black text-white">Tippbajnok</h1>
              <p className="text-text-muted mt-2">Lépj be és tippelj a győzelemért!</p>
          </div>

          <div className="flex p-1 bg-black/20 rounded-xl mb-6">
             <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Bejelentkezés</button>
             <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}>Regisztráció</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{error}</div>}
             
             <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Felhasználónév</label>
                <input required type="text" className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none transition-colors" value={username} onChange={e => setUsername(e.target.value)} />
             </div>
             
             <div>
                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Jelszó</label>
                <input required type="password" className="w-full bg-input-dark border border-border-dark rounded-xl p-3 text-white focus:border-primary outline-none transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
             </div>

             <button disabled={loading} className="w-full bg-primary hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                {loading ? 'Betöltés...' : (isLogin ? 'Belépés' : 'Regisztráció')}
             </button>
          </form>
       </div>
    </div>
  );
}

function ChampionshipFeed({ user, champ, triggerRefresh }: { user: User, champ: Championship, triggerRefresh: number }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const m = await db.getMatches(champ.id);
    setMatches(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, [champ.id, triggerRefresh]);

  const handleCreateMatch = async (matchData: any) => {
    await db.createMatch(matchData);
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">{champ.name}</h2>
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <span className="font-mono bg-surface-dark px-1.5 py-0.5 rounded border border-border-dark text-xs">{champ.joinCode}</span>
            <span>•</span>
            <span>{matches.length} mérkőzés</span>
          </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setShowInvite(true)} variant="secondary" size="sm">
                <Icon name="share" className="mr-1 text-lg" /> Meghívó
            </Button>
            {champ.adminId === user.id && (
                <Button onClick={() => setShowCreate(true)} size="sm">
                    <Icon name="add" className="mr-1 text-lg" /> Új Meccs
                </Button>
            )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Betöltés...</div>
      ) : (
        <MatchList matches={matches} currentUser={user} isAdmin={champ.adminId === user.id} refreshTrigger={load} />
      )}

      {showCreate && <CreateMatchModal championshipId={champ.id} onClose={() => setShowCreate(false)} onSave={handleCreateMatch} />}
      {showInvite && <InviteModal championship={champ} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

function LeaderboardPage({ champ }: { champ: Championship }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-white">Ranglista</h2>
        <p className="text-text-muted text-sm">A bajnokság legjobb tippelői</p>
      </div>
      <Leaderboard championship={champ} refreshTrigger={0} />
    </div>
  );
}

function ChatPage({ user, champ }: { user: User, champ: Championship }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const msgs = await db.getChatMessages(champ.id);
    setMessages(msgs);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [champ.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!text.trim()) return;
    await db.sendChatMessage(champ.id, user.id, text);
    setText('');
    load();
  };

  return (
    <div className="flex flex-col h-[600px] bg-surface-dark border border-border-dark rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-border-dark bg-[#15202b] flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icon name="forum" /> Csevegő
        </h3>
        <span className="text-xs text-text-muted">Élő</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-dark">
        {messages.length === 0 && <div className="text-center text-text-muted text-sm mt-10">Nincsenek még üzenetek. Kezdj beszélgetést!</div>}
        {messages.map(m => {
          const isMe = m.userId === user.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 ${isMe ? 'bg-primary text-white rounded-br-none' : 'bg-[#15202b] text-slate-200 border border-border-dark rounded-bl-none'}`}>
                {!isMe && <div className="text-[10px] font-bold text-text-muted mb-1">{m.username}</div>}
                <div className="text-sm break-words">{m.text}</div>
                <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}></div>
      </div>

      <form onSubmit={send} className="p-3 bg-[#15202b] border-t border-border-dark flex gap-2">
        <input 
          className="flex-1 bg-surface-dark border border-border-dark rounded-xl px-4 py-2 text-white focus:border-primary outline-none transition-colors"
          placeholder="Írj egy üzenetet..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className="bg-primary hover:bg-blue-600 text-white size-10 rounded-xl flex items-center justify-center transition-colors">
          <Icon name="send" className="text-lg" />
        </button>
      </form>
    </div>
  );
}

function QuickLeaderboardWidget({ champ, triggerRefresh, setPage }: { champ: Championship, triggerRefresh: number, setPage: (p: any) => void }) {
  return (
    <div className="bg-surface-dark border border-border-dark rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Icon name="leaderboard" className="text-primary" /> Toplista
        </h3>
        <button onClick={() => setPage('LEADERBOARD')} className="text-xs font-bold text-primary hover:text-white transition-colors">
          Teljes
        </button>
      </div>
      <div className="text-xs">
         <Leaderboard championship={champ} refreshTrigger={triggerRefresh} compact={true} />
      </div>
    </div>
  );
}

function PromoWidget() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 to-blue-900 border border-white/10 p-6 text-center shadow-lg group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/20 transition-all"></div>
      <Icon name="rocket_launch" className="text-4xl text-white mb-3 relative z-10" />
      <h3 className="text-lg font-black text-white relative z-10">Hívd meg barátaidat!</h3>
      <p className="text-blue-200 text-sm mt-2 relative z-10">Több játékos, nagyobb izgalom. Oszd meg a kódodat!</p>
    </div>
  );
}