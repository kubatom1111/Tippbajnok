import React, { useEffect, useState } from 'react';
import { User } from '../types';
import * as db from '../storage';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function ProfileModal({ user, onClose, onLogout }: { user: User, onClose: () => void, onLogout: () => void }) {
    const nextLevelXp = user.level * 100;
    const progress = (user.xp / nextLevelXp) * 100;

    const [stats, setStats] = useState({ points: 0, winRate: 0, streak: 0 });

    useEffect(() => {
        const loadStats = async () => {
            const s = await db.getUserStats(user.id);
            const streak = await db.getLoginStreak(user.id);
            setStats({ points: s.points, winRate: s.winRate, streak });
        };
        loadStats();
    }, [user.id]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#15202b] w-full max-w-md rounded-3xl p-0 border border-border-dark shadow-2xl overflow-hidden">
                {/* Banner / Header */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 size-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">
                        <Icon name="close" />
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-8 relative">
                    <div className="flex justify-between items-end -mt-12 mb-6">
                        <div className="size-24 rounded-full bg-[#15202b] p-1.5">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-3xl font-black text-white shadow-inner">
                                {user.username[0].toUpperCase()}
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-border-dark px-4 py-1.5 rounded-full flex items-center gap-2 mb-2">
                            <Icon name="military_tech" className="text-yellow-400" />
                            <span className="font-bold text-white text-sm uppercase tracking-wider">{user.rank}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-white">{user.username}</h2>
                    </div>

                    {/* Level & XP */}
                    <div className="bg-surface-dark rounded-2xl p-5 border border-border-dark mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Szint {user.level}</span>
                            <span className="text-xs font-bold text-primary">{user.xp} / {nextLevelXp} XP</span>
                        </div>
                        <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-text-muted mt-2 text-center">Gyűjts még {nextLevelXp - user.xp} XP-t a következő szinthez!</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-surface-dark p-3 rounded-2xl border border-border-dark text-center">
                            <div className="text-text-muted text-[10px] uppercase font-bold mb-1">Összpont</div>
                            <div className="text-xl font-black text-white">{stats.points}</div>
                        </div>
                        <div className="bg-surface-dark p-3 rounded-2xl border border-border-dark text-center">
                            <div className="text-text-muted text-[10px] uppercase font-bold mb-1">Győzelmi %</div>
                            <div className="text-xl font-black text-white">{stats.winRate}%</div>
                        </div>
                        <div className="bg-surface-dark p-3 rounded-2xl border border-orange-500/30 text-center">
                            <div className="text-orange-400 text-[10px] uppercase font-bold mb-1 flex items-center justify-center gap-1">
                                <Icon name="local_fire_department" className="text-sm" /> Streak
                            </div>
                            <div className="text-xl font-black text-orange-400">{stats.streak}</div>
                            {stats.streak >= 7 && <div className="text-[9px] text-orange-300 mt-0.5">2x XP!</div>}
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Icon name="logout" /> Kijelentkezés
                    </button>

                </div>
            </div>
        </div>
    );
}
