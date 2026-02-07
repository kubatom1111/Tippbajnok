import React, { useEffect, useState } from 'react';
import { User, Championship, Match } from '../types';
import * as db from '../storage';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface AdminPanelProps {
    user: User;
    championship?: Championship;
    onClose: () => void;
}

export function AdminPanel({ user, championship, onClose }: AdminPanelProps) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [allChamps, setAllChamps] = useState<Championship[]>([]);
    const [selectedChamp, setSelectedChamp] = useState<string>(championship?.id || '');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'matches' | 'results'>('matches');

    const isGlobalAdmin = user.isGlobalAdmin === true;
    const isChampAdmin = championship?.adminId === user.id;
    const canAccess = isGlobalAdmin || isChampAdmin;

    useEffect(() => {
        const load = async () => {
            if (isGlobalAdmin) {
                // Global admin sees all championships
                const champs = await db.getMyChamps(user.id);
                // For now, we'll just load user's championships
                // In a full implementation, you'd have a getAllChampionships function
                setAllChamps(champs);
                if (champs.length > 0 && !selectedChamp) {
                    setSelectedChamp(champs[0].id);
                }
            }

            if (selectedChamp) {
                const m = await db.getMatches(selectedChamp);
                setMatches(m);
            }
            setLoading(false);
        };
        load();
    }, [user.id, selectedChamp, isGlobalAdmin]);

    if (!canAccess) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-[#15202b] p-8 rounded-3xl border border-border-dark text-center">
                    <span className="text-4xl mb-4 block">🚫</span>
                    <h2 className="text-xl font-bold text-white mb-2">Hozzáférés megtagadva</h2>
                    <p className="text-text-muted mb-4">Nincs admin jogosultságod.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-primary rounded-xl text-white font-bold">
                        Bezárás
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#15202b] w-full max-w-3xl rounded-3xl border border-border-dark shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 size-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">
                        <Icon name="close" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">⚙️</span>
                        <div>
                            <h2 className="text-2xl font-black text-white">Admin Panel</h2>
                            <p className="text-white/80 text-sm">
                                {isGlobalAdmin ? '🌎 Globális Admin' : `📋 ${championship?.name} Admin`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Championship Selector (for global admin) */}
                {isGlobalAdmin && allChamps.length > 0 && (
                    <div className="p-4 border-b border-border-dark">
                        <select
                            value={selectedChamp}
                            onChange={(e) => setSelectedChamp(e.target.value)}
                            className="w-full p-3 bg-surface-dark border border-border-dark rounded-xl text-white"
                        >
                            {allChamps.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-border-dark">
                    <button
                        onClick={() => setTab('matches')}
                        className={`flex-1 p-4 font-bold transition-colors ${tab === 'matches' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                    >
                        <Icon name="sports_soccer" className="mr-2" /> Meccsek
                    </button>
                    <button
                        onClick={() => setTab('results')}
                        className={`flex-1 p-4 font-bold transition-colors ${tab === 'results' ? 'text-primary border-b-2 border-primary' : 'text-text-muted'}`}
                    >
                        <Icon name="scoreboard" className="mr-2" /> Eredmények
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center text-text-muted py-8">Betöltés...</div>
                    ) : tab === 'matches' ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">Meccsek ({matches.length})</h3>
                            </div>
                            {matches.length === 0 ? (
                                <div className="text-center text-text-muted py-8">Nincs meccs ebben a bajnokságban.</div>
                            ) : (
                                matches.map(match => (
                                    <div key={match.id} className="bg-surface-dark p-4 rounded-xl border border-border-dark">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-white">{match.player1} vs {match.player2}</div>
                                                <div className="text-sm text-text-muted">
                                                    {new Date(match.startTime).toLocaleString('hu-HU')}
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${match.status === 'FINISHED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                {match.status === 'FINISHED' ? 'Befejezett' : 'Folyamatban'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white mb-4">Eredmények rögzítése</h3>
                            {matches.filter(m => m.status !== 'FINISHED').length === 0 ? (
                                <div className="text-center text-text-muted py-8">Nincs nyitott meccs az eredmény rögzítéshez.</div>
                            ) : (
                                matches.filter(m => m.status !== 'FINISHED').map(match => (
                                    <div key={match.id} className="bg-surface-dark p-4 rounded-xl border border-border-dark">
                                        <div className="font-bold text-white mb-2">{match.player1} vs {match.player2}</div>
                                        <div className="text-sm text-text-muted mb-3">
                                            {match.questions?.map(q => (
                                                <div key={q.id} className="py-1">{q.label} ({q.points}p)</div>
                                            ))}
                                        </div>
                                        <button className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl font-bold transition-colors">
                                            Eredmény rögzítése
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-dark">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-surface-dark hover:bg-slate-700 text-white font-bold transition-colors"
                    >
                        Bezárás
                    </button>
                </div>
            </div>
        </div>
    );
}
