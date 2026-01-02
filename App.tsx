import React, { useState, useEffect } from 'react';
import { User, Championship, Match } from './types';
import { 
  getCurrentUser, loginUser, registerUser, logoutUser, 
  createChampionship, joinChampionship, getMyChampionships, 
  createMatch, getMatches, getBetsForMatch, getResult
} from './services/storageService';
import { Button } from './components/Button';
import { CreateMatchModal } from './components/CreateMatchModal';
import { MatchList } from './components/MatchList';
import { Leaderboard } from './components/Leaderboard';

type Page = 'LOGIN' | 'DASHBOARD' | 'CHAMPIONSHIP';

const StatCard = ({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) => (
    <div className="bg-sport-card border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {icon && <div className="text-slate-600 bg-slate-800 p-2 rounded-lg">{icon}</div>}
    </div>
);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('LOGIN');
  
  // Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [myChamps, setMyChamps] = useState<Championship[]>([]);
  const [newChampName, setNewChampName] = useState('');
  const [newChampCode, setNewChampCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  // Global User Stats
  const [userStats, setUserStats] = useState({ totalBets: 0, totalPoints: 0, accuracy: 0 });

  // Championship View State
  const [activeChamp, setActiveChamp] = useState<Championship | null>(null);
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'LEADERBOARD'>('MATCHES');
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setUser(u);
      setPage('DASHBOARD');
      loadDashboardData(u.id);
    }
  }, []);

  const loadDashboardData = async (uid: string) => {
    const champs = await getMyChampionships(uid);
    setMyChamps(champs);
    
    let tBets = 0;
    let tPoints = 0;
    let tCorrect = 0;
    let tQuestions = 0;

    for (const champ of champs) {
        const ms = await getMatches(champ.id);
        const finished = ms.filter(m => m.status === 'FINISHED');
        for (const m of finished) {
            const res = getResult(m.id);
            if (!res) continue;
            const bets = getBetsForMatch(m.id);
            const myBet = bets.find(b => b.userId === uid);
            if (myBet) {
                tBets++;
                m.questions.forEach(q => {
                    tQuestions++;
                    if (String(myBet.answers[q.id]) === String(res.answers[q.id])) {
                        tPoints += q.points;
                        tCorrect++;
                    }
                });
            }
        }
    }
    setUserStats({
        totalBets: tBets,
        totalPoints: tPoints,
        accuracy: tQuestions > 0 ? Math.round((tCorrect / tQuestions) * 100) : 0
    });
  };

  const loadMatches = async (cid: string) => {
    const m = await getMatches(cid);
    setMatches(m);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      let u: User;
      if (isRegistering) {
        u = await registerUser(username, password);
      } else {
        u = await loginUser(username, password);
      }
      setUser(u);
      setPage('DASHBOARD');
      loadDashboardData(u.id);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setPage('LOGIN');
    setUsername('');
    setPassword('');
  };

  const handleCreateChamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createChampionship(newChampName, newChampCode, user.id);
      setNewChampName('');
      setNewChampCode('');
      loadDashboardData(user.id);
    } catch (err: any) {
        alert(err.message);
    }
  };

  const handleJoinChamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await joinChampionship(joinCode, user.id);
      setJoinCode('');
      loadDashboardData(user.id);
    } catch (err: any) {
        alert(err.message);
    }
  };

  const openChamp = (champ: Championship) => {
    setActiveChamp(champ);
    setPage('CHAMPIONSHIP');
    loadMatches(champ.id);
    setActiveTab('MATCHES');
  };

  const handleMatchCreated = async (matchData: any) => {
    await createMatch(matchData);
    setShowCreateMatch(false);
    if (activeChamp) loadMatches(activeChamp.id);
  };

  const triggerRefresh = () => {
      setRefreshKey(p => p + 1);
      if (activeChamp) loadMatches(activeChamp.id);
      if (user) loadDashboardData(user.id);
  };

  // --- RENDER ---

  if (page === 'LOGIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-sport-bg">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-block p-3 rounded-2xl bg-gradient-to-br from-sport-primary to-blue-600 shadow-glow mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">HaverTipp</h1>
                <p className="text-slate-400 mt-2">Sportfogadás barátok közt</p>
            </div>
            
            <div className="bg-sport-card p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
                    <button onClick={() => setIsRegistering(false)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isRegistering ? 'bg-sport-card text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Belépés</button>
                    <button onClick={() => setIsRegistering(true)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isRegistering ? 'bg-sport-card text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>Regisztráció</button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Felhasználónév</label>
                        <input 
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sport-primary focus:border-transparent outline-none transition-all" 
                            type="text" 
                            required 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Jelszó</label>
                        <input 
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sport-primary focus:border-transparent outline-none transition-all" 
                            type="password" 
                            required 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                        />
                    </div>
                    {authError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">{authError}</div>}
                    <Button fullWidth variant="primary" type="submit" size="lg">{isRegistering ? 'Fiók Létrehozása' : 'Belépés'}</Button>
                </form>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sport-bg text-sport-text font-sans">
      
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-sport-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {page === 'CHAMPIONSHIP' ? (
                    <button onClick={() => setPage('DASHBOARD')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        <span className="text-sm font-medium">Főoldal</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="bg-sport-primary rounded p-1">
                             <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">HaverTipp</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-500 uppercase">Bejelentkezve</p>
                    <p className="text-sm font-semibold text-white">{user?.username}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sport-primary to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-glow">
                    {user?.username.charAt(0).toUpperCase()}
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {page === 'DASHBOARD' && (
            <div className="space-y-10 animate-fade-in">
                {/* Stats */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard 
                        label="Összes Pont" 
                        value={userStats.totalPoints} 
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                    />
                    <StatCard 
                        label="Találati Arány" 
                        value={`${userStats.accuracy}%`} 
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <StatCard 
                        label="Lezárt Tippek" 
                        value={userStats.totalBets} 
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column: Championships */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-end">
                            <h2 className="text-xl font-bold text-white">Bajnokságaim</h2>
                        </div>
                        
                        <div className="grid gap-4">
                            {myChamps.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-slate-800 rounded-xl text-center">
                                    <p className="text-slate-500 mb-2">Még nem csatlakoztál egy bajnoksághoz sem.</p>
                                    <p className="text-sm text-slate-600">Használd az oldalsávot új létrehozásához!</p>
                                </div>
                            ) : (
                                myChamps.map(c => (
                                    <div key={c.id} onClick={() => openChamp(c)} className="bg-sport-card border border-slate-800 p-6 rounded-xl hover:border-sport-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-glow relative overflow-hidden">
                                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-sport-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>
                                        <div className="flex justify-between items-center relative z-10">
                                            <div>
                                                <h3 className="font-bold text-lg text-white group-hover:text-sport-primary transition-colors">{c.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 uppercase font-semibold">Kód:</span>
                                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-300">{c.joinCode}</span>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-sport-primary group-hover:text-white transition-colors">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column: Actions */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-sport-card to-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Új Bajnokság
                            </h3>
                            <form onSubmit={handleCreateChamp} className="space-y-3">
                                <input className="w-full p-2.5 bg-black/20 border border-slate-700 rounded-lg text-sm text-white focus:border-sport-primary outline-none" placeholder="Név (pl. EB 2024)" required value={newChampName} onChange={e => setNewChampName(e.target.value)} />
                                <input className="w-full p-2.5 bg-black/20 border border-slate-700 rounded-lg text-sm text-white focus:border-sport-primary outline-none" placeholder="Egyedi kód" required value={newChampCode} onChange={e => setNewChampCode(e.target.value)} />
                                <Button fullWidth type="submit" variant="primary" size="sm">Létrehozás</Button>
                            </form>
                        </div>

                        <div className="bg-sport-card border border-slate-800 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-white mb-4">Csatlakozás</h3>
                            <form onSubmit={handleJoinChamp} className="space-y-3">
                                <input className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-sport-primary outline-none" placeholder="Belépőkód" required value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                                <Button fullWidth type="submit" variant="outline" size="sm">Csatlakozás</Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {page === 'CHAMPIONSHIP' && activeChamp && (
            <div className="animate-fade-in space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{activeChamp.name}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-slate-500 text-sm">Belépőkód:</span>
                            <code className="bg-slate-800 px-2 py-0.5 rounded text-sm text-sport-primary font-bold">{activeChamp.joinCode}</code>
                        </div>
                    </div>
                    {user?.id === activeChamp.adminId && (
                        <Button variant="secondary" onClick={() => setShowCreateMatch(true)} className="shadow-glow">
                            + Új Mérkőzés
                        </Button>
                    )}
                </div>

                <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg w-full md:w-auto inline-flex">
                    <button 
                        onClick={() => setActiveTab('MATCHES')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'MATCHES' ? 'bg-sport-card text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Mérkőzések
                    </button>
                    <button 
                        onClick={() => setActiveTab('LEADERBOARD')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'LEADERBOARD' ? 'bg-sport-card text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Ranglista
                    </button>
                </div>

                <div>
                    {activeTab === 'MATCHES' ? (
                        <MatchList 
                            matches={matches} 
                            currentUser={user!} 
                            isAdmin={user?.id === activeChamp.adminId} 
                            refreshTrigger={triggerRefresh}
                        />
                    ) : (
                        <Leaderboard championship={activeChamp} refreshTrigger={refreshKey} />
                    )}
                </div>
            </div>
        )}
      </main>

      {showCreateMatch && activeChamp && (
          <CreateMatchModal 
            championshipId={activeChamp.id}
            onClose={() => setShowCreateMatch(false)}
            onSave={handleMatchCreated}
          />
      )}
    </div>
  );
}

export default App;