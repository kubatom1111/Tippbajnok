import React, { useEffect, useState, useRef } from 'react';
import { User } from '../types';
import * as db from '../storage';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function ProfileModal({ user, onClose, onLogout }: { user: User, onClose: () => void, onLogout: () => void }) {
    const nextLevelXp = user.level * 100;
    const progress = (user.xp / nextLevelXp) * 100;

    const [stats, setStats] = useState({ points: 0, winRate: 0, streak: 0 });
    const [showShareCard, setShowShareCard] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadStats = async () => {
            const s = await db.getUserStats(user.id);
            const streak = await db.getLoginStreak(user.id);
            setStats({ points: s.points, winRate: s.winRate, streak });
        };
        loadStats();
    }, [user.id]);

    const handleShare = async () => {
        setShowShareCard(true);
    };

    const handleDownloadCard = async () => {
        if (!cardRef.current) return;

        // Use html2canvas-like approach with a simple canvas
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 280;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 400, 280);
        gradient.addColorStop(0, '#1a365d');
        gradient.addColorStop(1, '#312e81');
        ctx.fillStyle = gradient;
        ctx.roundRect(0, 0, 400, 280, 16);
        ctx.fill();

        // Top accent bar
        const topGradient = ctx.createLinearGradient(0, 0, 400, 0);
        topGradient.addColorStop(0, '#2563eb');
        topGradient.addColorStop(1, '#7c3aed');
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, 400, 8);

        // Avatar circle
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(200, 70, 40, 0, Math.PI * 2);
        ctx.fill();

        // Avatar letter
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(user.username[0].toUpperCase(), 200, 72);

        // Username
        ctx.font = 'bold 24px system-ui';
        ctx.fillText(user.username, 200, 130);

        // Rank badge
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`🏅 ${user.rank.toUpperCase()}`, 200, 155);

        // Stats row
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.roundRect(20, 175, 360, 60, 12);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px system-ui';
        // Points
        ctx.fillText(`${stats.points}`, 80, 200);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('PONT', 80, 220);

        // Win Rate
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px system-ui';
        ctx.fillText(`${stats.winRate}%`, 200, 200);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('GYŐZELMI %', 200, 220);

        // Streak
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 20px system-ui';
        ctx.fillText(`${stats.streak}🔥`, 320, 200);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#fdba74';
        ctx.fillText('STREAK', 320, 220);

        // Footer
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Tippbajnok • tippbajnok.vercel.app', 200, 260);

        // Download
        const link = document.createElement('a');
        link.download = `${user.username}_tippbajnok.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setShowShareCard(false);
    };

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

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={handleShare}
                            className="flex-1 py-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Icon name="share" /> Megosztás
                        </button>
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

            {/* Share Card Modal */}
            {showShareCard && (
                <div className="fixed inset-0 bg-black/90 z-[110] flex flex-col items-center justify-center p-4 animate-in fade-in">
                    <div ref={cardRef} className="w-[400px] h-[280px] bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl p-6 relative overflow-hidden mb-4">
                        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                        <div className="flex flex-col items-center pt-4">
                            <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white mb-3">
                                {user.username[0].toUpperCase()}
                            </div>
                            <h3 className="text-2xl font-black text-white mb-1">{user.username}</h3>
                            <span className="text-yellow-400 text-sm font-bold mb-4">🏅 {user.rank.toUpperCase()}</span>

                            <div className="flex gap-8 bg-black/30 rounded-xl px-6 py-3">
                                <div className="text-center">
                                    <div className="text-xl font-black text-white">{stats.points}</div>
                                    <div className="text-[10px] text-slate-400 uppercase">Pont</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-white">{stats.winRate}%</div>
                                    <div className="text-[10px] text-slate-400 uppercase">Győzelem</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-orange-400">{stats.streak}🔥</div>
                                    <div className="text-[10px] text-orange-300 uppercase">Streak</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-3 inset-x-0 text-center text-[10px] text-slate-500">
                            Tippbajnok • tippbajnok.vercel.app
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadCard}
                            className="px-6 py-3 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2"
                        >
                            <Icon name="download" /> Kép letöltése
                        </button>
                        <button
                            onClick={() => setShowShareCard(false)}
                            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold"
                        >
                            Bezárás
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
