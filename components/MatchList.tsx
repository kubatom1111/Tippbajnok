import React, { useState, useEffect } from 'react';
import { Match, QuestionType, User } from '../types';
import * as db from '../storage';
import { BetDistribution } from '../storage';

interface MatchListProps {
    matches: Match[];
    currentUser: User;
    isAdmin: boolean;
    refreshTrigger: () => void;
}

// Icon helper
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const MatchList: React.FC<MatchListProps> = ({ matches, currentUser, isAdmin, refreshTrigger }) => {
    if (matches.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-[#233648] rounded-2xl">
                <p className="text-[#92adc9]">Nincsenek mérkőzések ebben a bajnokságban.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-6">
            {matches.map(match => (
                <InlineMatchCard
                    key={match.id}
                    match={match}
                    user={currentUser}
                    isAdmin={isAdmin}
                    refresh={refreshTrigger}
                />
            ))}
        </div>
    );
};

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

    // Bet Distribution State (for "Mások tippjei")
    const [betsStats, setBetsStats] = useState<BetDistribution[]>([]);
    const [showBetsStats, setShowBetsStats] = useState(false);

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

            // 3. Load Bet Stats for finished or locked matches
            if (isLocked || isFinished) {
                const stats = await db.getMatchBetsStats(match.id);
                setBetsStats(stats);
            }
        }
        init();
    }, [match, user, isFinished, expanded]);

    const handleSave = async () => {
        await db.saveBet({ userId: user.id, matchId: match.id, answers, timestamp: new Date().toISOString() });
        import('canvas-confetti').then((confetti) => {
            confetti.default({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#137fec', '#ffffff', '#39ff14']
            });
        });
        setHasBet(true);
        setIsEditing(false); // Switch to view mode
        setExpanded(false); // Collapse to confirm
        refresh();
    };

    const handleResultSave = async () => {
        if (confirm('Lezárod a meccset? Ez rögzíti az eredményt és frissíti a pontokat.')) {
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
        <div className={`relative bg-[#15202b] rounded-2xl border overflow-hidden shadow-lg transition-all ${expanded ? 'border-[#137fec]/50 ring-1 ring-[#137fec]/20' : 'border-[#233648] hover:border-[#137fec]/30'}`}>

            {/* Top Banner Status */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 text-xs font-bold border-b border-white/5">
                <div className="flex items-center gap-2">
                    {isLocked && !isFinished && <span className="flex items-center gap-1 text-red-500 animate-pulse"><span className="size-2 rounded-full bg-red-500"></span> ÉLŐ / LEZÁRT</span>}
                    {!isLocked && !isFinished && <span className="text-[#92adc9]">{start.toLocaleDateString()} - {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    {isFinished && <span className="text-slate-400">VÉGET ÉRT</span>}
                </div>
                {hasBet && !isFinished && (
                    <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        <Icon name="confirmation_number" className="text-xs" /> Tipp Leadva
                    </div>
                )}
            </div>

            {/* Main Card Content */}
            <div className="p-5 flex flex-col cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
                <div className="flex justify-between items-center mb-4">
                    <div className="text-xl md:text-2xl font-black text-white">{match.player1}</div>
                    <div className="text-xs font-black text-[#92adc9] bg-[#1a2632] px-2 py-1 rounded-full border border-[#233648]">VS</div>
                    <div className="text-xl md:text-2xl font-black text-white text-right">{match.player2}</div>
                </div>

                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#92adc9] font-bold uppercase">{match.questions.length} fogadási piac</span>
                        {points !== null && <span className="text-[#137fec] font-black text-lg bg-[#137fec]/10 px-2 py-0.5 rounded w-fit">+{points} PONT</span>}
                    </div>
                    <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${expanded ? 'bg-[#1a2632] text-white' : 'bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20'}`}>
                        {expanded ? 'Bezárás' : (hasBet ? 'Tipp Mutatása' : 'Tippelés')} <Icon name={expanded ? "expand_less" : "chevron_right"} className="text-base" />
                    </button>
                </div>
            </div>

            {/* Expandable Betting/Admin Area */}
            {expanded && (
                <div className="p-6 bg-[#1a2632] border-t border-[#233648] animate-in slide-in-from-top-2 duration-200">

                    {/* ADMIN TABS */}
                    {isAdmin && (
                        <div className="flex p-1 bg-black/20 rounded-xl mb-6">
                            <button onClick={() => setAdminMode(false)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!adminMode ? 'bg-[#1a2632] text-white shadow-lg' : 'text-[#92adc9] hover:text-white'}`}>Játékos Nézet (Tippelés)</button>
                            <button onClick={() => setAdminMode(true)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${adminMode ? 'bg-[#137fec] text-white shadow-lg' : 'text-[#92adc9] hover:text-white'}`}> <Icon name="settings" /> Eredmény Kezelése</button>
                        </div>
                    )}

                    {adminMode ? (
                        /* ADMIN RESULT INTERFACE */
                        <div className="bg-gradient-to-br from-black/20 to-red-900/10 border border-white/5 rounded-xl p-6 relative">
                            <div className="absolute top-0 right-0 p-3 opacity-5"><Icon name="gavel" className="text-8xl text-red-500" /></div>
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2 relative z-10">
                                <Icon name="sports_score" className="text-[#137fec]" /> Hivatalos Végeredmény Rögzítése
                            </h4>
                            <p className="text-sm text-[#92adc9] mb-6 relative z-10">
                                Figyelem: Az eredmény mentése lezárja a mérkőzést, és a rendszer kiszámolja a pontokat. Ezt követően már nem lehet tippelni.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                {match.questions.map(q => (
                                    <div key={q.id} className="space-y-2">
                                        <label className="text-xs font-bold text-[#92adc9] uppercase flex justify-between">
                                            {q.label}
                                        </label>
                                        {(q.type === QuestionType.WINNER || q.type === QuestionType.CHOICE) && (
                                            <div className="flex gap-2">
                                                {(q.options || [match.player1, match.player2]).map(p => (
                                                    <button key={p} onClick={() => handleResultChange(q.id, p)} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${resultAnswers[q.id] === p ? 'bg-[#137fec] border-[#137fec] text-white' : 'bg-[#233648] border-[#233648] text-[#92adc9]'}`}>{p}</button>
                                                ))}
                                            </div>
                                        )}
                                        {q.type === QuestionType.EXACT_SCORE && (
                                            <input className="w-full bg-[#233648] border border-[#233648] rounded-xl p-3 text-white text-center font-bold text-lg tracking-widest focus:border-[#137fec] outline-none" placeholder="3-1" value={resultAnswers[q.id] || ''} onChange={e => handleResultChange(q.id, e.target.value)} />
                                        )}
                                        {q.type === QuestionType.OVER_UNDER && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleResultChange(q.id, 'OVER')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${resultAnswers[q.id] === 'OVER' ? 'bg-[#101922] border-[#137fec] text-[#137fec]' : 'bg-[#233648] border-[#233648] text-[#92adc9]'}`}>FELETT</button>
                                                <button onClick={() => handleResultChange(q.id, 'UNDER')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${resultAnswers[q.id] === 'UNDER' ? 'bg-[#101922] border-[#137fec] text-[#137fec]' : 'bg-[#233648] border-[#233648] text-[#92adc9]'}`}>ALATT</button>
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
                                <div className="bg-[#101922] border border-[#137fec]/30 rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Icon name="receipt_long" className="text-9xl text-[#137fec]" /></div>
                                    <div className="relative z-10">
                                        <h4 className="text-[#137fec] font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><Icon name="verified" /> Aktív Szelvény</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                            {match.questions.map(q => (
                                                <div key={q.id} className="flex justify-between items-center border-b border-[#233648] pb-2 last:border-0">
                                                    <span className="text-[#92adc9] text-sm">{q.label}</span>
                                                    <span className="font-bold text-white">{formatAnswer(answers[q.id])}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {!isLocked && (
                                            <div className="mt-6 flex justify-end">
                                                <button onClick={() => setIsEditing(true)} className="text-[#92adc9] text-sm hover:text-white underline decoration-dotted">Tipp módosítása</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                !isLocked && !isFinished ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {match.questions.map(q => (
                                            <div key={q.id} className="space-y-2">
                                                <label className="text-xs font-bold text-[#92adc9] uppercase flex justify-between">
                                                    {q.label} <span>{q.points} pont</span>
                                                </label>
                                                {(q.type === QuestionType.WINNER || q.type === QuestionType.CHOICE) && (
                                                    <div className="flex gap-2">
                                                        {(q.options || [match.player1, match.player2]).map(p => (
                                                            <button key={p} onClick={() => setAnswers({ ...answers, [q.id]: p })} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${answers[q.id] === p ? 'bg-[#137fec] border-[#137fec] text-white shadow-lg shadow-[#137fec]/20' : 'bg-[#233648] border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}>{p}</button>
                                                        ))}
                                                    </div>
                                                )}
                                                {q.type === QuestionType.EXACT_SCORE && (
                                                    <input className="w-full bg-[#233648] border border-[#233648] rounded-xl p-3 text-white text-center font-bold text-lg tracking-widest focus:border-[#137fec] focus:outline-none transition-colors" placeholder="3-1" value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
                                                )}
                                                {q.type === QuestionType.OVER_UNDER && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setAnswers({ ...answers, [q.id]: 'OVER' })} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${answers[q.id] === 'OVER' ? 'bg-[#101922] border-[#137fec] text-[#137fec]' : 'bg-[#233648] border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}>FELETT</button>
                                                        <button onClick={() => setAnswers({ ...answers, [q.id]: 'UNDER' })} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${answers[q.id] === 'UNDER' ? 'bg-[#101922] border-[#137fec] text-[#137fec]' : 'bg-[#233648] border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}>ALATT</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div className="md:col-span-2 flex gap-3 mt-2">
                                            {hasBet && <button onClick={() => setIsEditing(false)} className="flex-1 bg-[#1a2632] border border-[#233648] text-white py-3 rounded-xl font-bold hover:bg-[#233648]">Mégse</button>}
                                            <button onClick={handleSave} className="flex-[2] bg-[#137fec] hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-[#137fec]/25 transition-all">Tipp Mentése</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-[#92adc9] mb-4 font-medium">A tippelés lezárult erre a mérkőzésre.</p>
                                        {hasBet && (
                                            <div className="bg-[#101922] border border-[#233648] rounded-xl p-4 max-w-lg mx-auto mb-6 text-left">
                                                <h4 className="text-[#92adc9] font-bold uppercase tracking-wider text-xs mb-3 border-b border-[#233648] pb-2">A te tipped:</h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {match.questions.map(q => (
                                                        <div key={q.id} className="flex justify-between">
                                                            <span className="text-[#92adc9] text-xs truncate pr-2">{q.label}:</span>
                                                            <span className="font-bold text-white text-xs">{formatAnswer(answers[q.id])}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Mások tippjei Section */}
                                        {betsStats.length > 0 && (
                                            <div className="mt-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowBetsStats(!showBetsStats); }}
                                                    className="text-[#137fec] text-sm font-bold flex items-center justify-center gap-1 mx-auto hover:underline"
                                                >
                                                    <Icon name={showBetsStats ? "expand_less" : "expand_more"} className="text-base" />
                                                    {showBetsStats ? 'Elrejtés' : 'Mások tippjei'} ({betsStats[0]?.totalBets || 0} tipp)
                                                </button>

                                                {showBetsStats && (
                                                    <div className="mt-4 bg-[#0d1117] border border-[#233648] rounded-xl p-4 text-left animate-in slide-in-from-top-2">
                                                        <h4 className="text-[#92adc9] font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                                                            <Icon name="groups" /> Tipp megoszlás
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {match.questions.map((q, qIdx) => {
                                                                const statForQ = betsStats.find(s => s.questionId === q.id);
                                                                if (!statForQ) return null;
                                                                return (
                                                                    <div key={q.id}>
                                                                        <div className="text-xs text-[#92adc9] mb-2 font-medium">{q.label}</div>
                                                                        <div className="space-y-1">
                                                                            {statForQ.distribution.map((d, dIdx) => (
                                                                                <div key={dIdx} className="flex items-center gap-2">
                                                                                    <div className="w-20 text-xs text-white truncate font-medium">{formatAnswer(d.answer)}</div>
                                                                                    <div className="flex-1 h-5 bg-[#1a2632] rounded-full overflow-hidden">
                                                                                        <div
                                                                                            className={`h-full rounded-full transition-all ${dIdx === 0 ? 'bg-[#137fec]' : 'bg-[#233648]'}`}
                                                                                            style={{ width: `${d.percentage}%` }}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="w-12 text-xs text-[#92adc9] text-right">{d.percentage}%</div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
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
