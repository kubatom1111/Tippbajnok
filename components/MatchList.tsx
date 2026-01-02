import React, { useState, useEffect } from 'react';
import { Match, QuestionType } from '../types';
import { getBetsForMatch, saveBet, getResult, saveResult } from '../services/storageService';
import { Button } from './Button';

interface MatchListProps {
  matches: Match[];
  currentUser: any;
  isAdmin: boolean;
  refreshTrigger: () => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, currentUser, isAdmin, refreshTrigger }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [mode, setMode] = useState<'BET' | 'RESULT' | null>(null);

  const handleDelete = (matchId: string) => {
      if (confirm('Biztosan törölni szeretnéd ezt a mérkőzést?')) {
          alert("Törlés funkció hamarosan.");
      }
  }

  if (matches.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-sport-card rounded-xl border border-slate-800 text-center">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-sport-text font-medium text-lg">Nincsenek mérkőzések</h3>
            <p className="text-sport-muted text-sm mt-1">Jelenleg nincs aktív meccs ebben a bajnokságban.</p>
        </div>
    );
  }

  return (
    <div className="grid gap-4">
      {matches.map(match => (
        <MatchCard 
          key={match.id} 
          match={match} 
          currentUser={currentUser}
          isAdmin={isAdmin}
          onOpenBet={() => { setSelectedMatchId(match.id); setMode('BET'); }}
          onOpenResult={() => { setSelectedMatchId(match.id); setMode('RESULT'); }}
          onDelete={() => handleDelete(match.id)}
        />
      ))}

      {selectedMatchId && mode === 'BET' && (
        <BettingModal 
            match={matches.find(m => m.id === selectedMatchId)!} 
            userId={currentUser.id} 
            onClose={() => { setSelectedMatchId(null); setMode(null); }}
            onSave={() => { setSelectedMatchId(null); setMode(null); refreshTrigger(); }}
        />
      )}

      {selectedMatchId && mode === 'RESULT' && isAdmin && (
          <ResultModal
            match={matches.find(m => m.id === selectedMatchId)!}
            onClose={() => { setSelectedMatchId(null); setMode(null); }}
            onSave={() => { setSelectedMatchId(null); setMode(null); refreshTrigger(); }}
          />
      )}
    </div>
  );
};

const MatchCard: React.FC<{ 
    match: Match; 
    currentUser: any; 
    isAdmin: boolean;
    onOpenBet: () => void;
    onOpenResult: () => void;
    onDelete: () => void;
}> = ({ match, currentUser, isAdmin, onOpenBet, onOpenResult, onDelete }) => {
  const [hasBet, setHasBet] = useState(false);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  
  const start = new Date(match.startTime);
  const isLocked = new Date() > start;
  const isFinished = match.status === 'FINISHED';

  useEffect(() => {
    const bets = getBetsForMatch(match.id);
    const myBet = bets.find(b => b.userId === currentUser.id);
    setHasBet(!!myBet);

    if (isFinished && myBet) {
       const result = getResult(match.id);
       if (result) {
         let pts = 0;
         match.questions.forEach(q => {
             if (String(myBet.answers[q.id]) === String(result.answers[q.id])) {
                 pts += q.points;
             }
         });
         setUserPoints(pts);
       }
    }
  }, [match, currentUser.id, isFinished]);

  return (
    <div className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${isFinished ? 'bg-slate-900/50 border border-slate-800 opacity-80' : 'bg-sport-card border border-slate-700 shadow-card hover:border-slate-600'}`}>
        
        {/* Accent Bar */}
        <div className={`absolute top-0 left-0 w-1 h-full ${isFinished ? 'bg-slate-600' : isLocked ? 'bg-sport-accent' : 'bg-sport-primary'}`}></div>

        <div className="p-5 pl-7">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-sport-muted uppercase tracking-wider mb-1">
                        {start.toLocaleDateString('hu-HU', { weekday: 'long' })}
                    </span>
                    <span className="text-sm font-bold text-white">
                         {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wide ${
                        isFinished ? 'bg-slate-800 text-slate-400' : 
                        isLocked ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                        {isFinished ? 'Véget ért' : isLocked ? 'Élő / Lezárt' : 'Tippelhető'}
                    </span>
                    {isAdmin && (
                        <button onClick={onDelete} className="text-slate-600 hover:text-red-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Matchup */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                    <div className="text-lg font-bold text-white">{match.player1}</div>
                </div>
                <div className="px-4 text-slate-600 font-bold text-sm">VS</div>
                <div className="flex-1 text-right">
                    <div className="text-lg font-bold text-white">{match.player2}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                 <div>
                    {isFinished && userPoints !== null ? (
                        <span className="text-sport-secondary font-bold text-lg flex items-center gap-1">
                            +{userPoints} Pont
                        </span>
                    ) : (
                        <span className="text-xs text-slate-500">{match.questions.length} kérdés</span>
                    )}
                 </div>

                <div className="flex items-center gap-2">
                    {!isFinished && !isLocked && (
                        <Button 
                            variant={hasBet ? "outline" : "primary"} 
                            size="sm"
                            onClick={onOpenBet}
                        >
                            {hasBet ? 'Tipp Módosítása' : 'Tipp Leadása'}
                        </Button>
                    )}

                    {isAdmin && !isFinished && (
                        <Button variant="secondary" size="sm" onClick={onOpenResult}>
                            Eredmény
                        </Button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

// --- Modals ---

const BettingModal: React.FC<{ match: Match; userId: string; onClose: () => void; onSave: () => void }> = ({ match, userId, onClose, onSave }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    const bets = getBetsForMatch(match.id);
    const myBet = bets.find(b => b.userId === userId);
    if (myBet) setAnswers(myBet.answers);
  }, [match, userId]);

  const handleChange = (qId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBet({
        userId,
        matchId: match.id,
        answers,
        timestamp: new Date().toISOString()
    });
    onSave();
  };

  const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-sport-primary focus:border-transparent outline-none transition-all";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-sport-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-700">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Tipp Leadása</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex justify-center items-center gap-4">
                     <span className="font-bold text-white">{match.player1}</span>
                     <span className="text-slate-500 text-xs">vs</span>
                     <span className="font-bold text-white">{match.player2}</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {match.questions.map(q => (
                        <div key={q.id}>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {q.label} <span className="text-sport-primary text-xs ml-1">({q.points} pont)</span>
                            </label>
                            
                            {q.type === QuestionType.WINNER && (
                                <div className="grid grid-cols-2 gap-3">
                                    {[match.player1, match.player2].map(p => (
                                        <div 
                                            key={p}
                                            onClick={() => handleChange(q.id, p)}
                                            className={`cursor-pointer text-center py-3 px-2 rounded-lg border transition-all ${
                                                answers[q.id] === p 
                                                ? 'bg-sport-primary border-sport-primary text-white shadow-lg' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                                            }`}
                                        >
                                            <div className="text-sm font-bold truncate">{p}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {q.type === QuestionType.EXACT_SCORE && (
                                <input 
                                    type="text" 
                                    placeholder="Pl. 3-1"
                                    className={inputClass}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                    required
                                />
                            )}

                            {q.type === QuestionType.OVER_UNDER && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => handleChange(q.id, 'OVER')} className={`py-3 rounded-lg font-medium text-sm transition-all ${answers[q.id] === 'OVER' ? 'bg-sport-accent text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        Felett
                                    </button>
                                    <button type="button" onClick={() => handleChange(q.id, 'UNDER')} className={`py-3 rounded-lg font-medium text-sm transition-all ${answers[q.id] === 'UNDER' ? 'bg-sport-accent text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        Alatt
                                    </button>
                                </div>
                            )}

                            {q.type === QuestionType.CHOICE && q.options && (
                                <select 
                                    className={inputClass}
                                    value={answers[q.id] || ''}
                                    onChange={(e) => handleChange(q.id, e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Válassz...</option>
                                    {q.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <Button type="button" variant="ghost" onClick={onClose}>Mégse</Button>
                        <Button type="submit" variant="primary">Mentés</Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

const ResultModal: React.FC<{ match: Match; onClose: () => void; onSave: () => void }> = ({ match, onClose, onSave }) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});
  
    const handleChange = (qId: string, val: any) => {
      setAnswers(prev => ({ ...prev, [qId]: val }));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(confirm('Biztosan rögzíted? Ez lezárja a meccset.')) {
        saveResult({
            matchId: match.id,
            answers
        });
        onSave();
      }
    };

    const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-sport-secondary outline-none";
  
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sport-card w-full max-w-lg rounded-2xl shadow-2xl border-2 border-slate-700">
              <div className="p-6">
                  <h3 className="text-lg font-bold mb-6 text-white border-b border-slate-700 pb-4">
                      Eredmény Rögzítése
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                      {match.questions.map(q => (
                          <div key={q.id}>
                              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wide">{q.label}</label>
                              {q.type === QuestionType.WINNER && (
                                  <select className={inputClass} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} required>
                                      <option value="">Győztes kiválasztása...</option>
                                      <option value={match.player1}>{match.player1}</option>
                                      <option value={match.player2}>{match.player2}</option>
                                  </select>
                              )}
                              {q.type === QuestionType.EXACT_SCORE && (
                                  <input type="text" placeholder="Pl. 3-1" className={inputClass} value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} required />
                              )}
                              {q.type === QuestionType.OVER_UNDER && (
                                  <select className={inputClass} value={answers[q.id] || ''} onChange={e => handleChange(q.id, e.target.value)} required>
                                      <option value="">Válassz...</option>
                                      <option value="OVER">Felett</option>
                                      <option value="UNDER">Alatt</option>
                                  </select>
                              )}
                              {q.type === QuestionType.CHOICE && q.options && (
                                  <select className={inputClass} value={answers[q.id] || ''} onChange={(e) => handleChange(q.id, e.target.value)} required>
                                      <option value="">Válassz...</option>
                                      {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                              )}
                          </div>
                      ))}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                          <Button type="button" variant="ghost" onClick={onClose}>Mégse</Button>
                          <Button type="submit" variant="secondary">Rögzítés</Button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    );
  };