import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as db from '../storage';
import { MatchHistoryItem } from '../storage';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

type DetailedStats = {
    history: MatchHistoryItem[];
    totalPoints: number;
    totalBets: number;
    winRate: number;
};

export function StatsModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [stats, setStats] = useState<DetailedStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await db.getDetailedStats(userId);
            setStats(data);
            setLoading(false);
        };
        load();
    }, [userId]);

    // Colors for bars
    const getBarColor = (points: number) => {
        if (points >= 5) return '#22c55e'; // green
        if (points >= 3) return '#eab308'; // yellow
        if (points >= 1) return '#f97316'; // orange
        return '#ef4444'; // red
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#15202b] w-full max-w-2xl rounded-3xl border border-border-dark shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 size-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">
                        <Icon name="close" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">📊</span>
                        <div>
                            <h2 className="text-2xl font-black text-white">Statisztikák</h2>
                            <p className="text-white/80 text-sm">Részletes teljesítmény</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-text-muted py-8">Betöltés...</div>
                    ) : stats && stats.history.length > 0 ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-surface-dark p-4 rounded-2xl border border-border-dark text-center">
                                    <div className="text-text-muted text-xs uppercase font-bold mb-1">Összpont</div>
                                    <div className="text-2xl font-black text-white">{stats.totalPoints}</div>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-border-dark text-center">
                                    <div className="text-text-muted text-xs uppercase font-bold mb-1">Meccsek</div>
                                    <div className="text-2xl font-black text-white">{stats.history.length}</div>
                                </div>
                                <div className="bg-surface-dark p-4 rounded-2xl border border-border-dark text-center">
                                    <div className="text-text-muted text-xs uppercase font-bold mb-1">Win Rate</div>
                                    <div className="text-2xl font-black text-white">{stats.winRate}%</div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-surface-dark rounded-2xl p-4 border border-border-dark mb-6">
                                <h3 className="text-sm font-bold text-text-muted uppercase mb-4">Pontok meccsenként</h3>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.history.slice(-10)}>
                                            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                                                {stats.history.slice(-10).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.points)} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Match History */}
                            <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden">
                                <h3 className="text-sm font-bold text-text-muted uppercase p-4 border-b border-border-dark">Utolsó meccsek</h3>
                                <div className="divide-y divide-border-dark">
                                    {stats.history.slice(-5).reverse().map((match, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-white text-sm">{match.matchName}</div>
                                                <div className="text-xs text-text-muted">{match.date}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-black text-lg ${match.points >= 5 ? 'text-green-400' : match.points >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {match.points} pont
                                                </div>
                                                <div className="text-xs text-text-muted">{match.correct}/{match.total} találat</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-text-muted py-8">
                            <span className="text-4xl mb-4 block">📭</span>
                            Még nincs befejezett meccses tipped.
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
