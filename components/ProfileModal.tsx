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

        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 400, 360);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e1b4b');
        gradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = gradient;
        ctx.roundRect(0, 0, 400, 360, 24);
        ctx.fill();

        // Border gradient effect
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 3;
        ctx.roundRect(1.5, 1.5, 397, 357, 24);
        ctx.stroke();

        // Top glow
        const topGlow = ctx.createLinearGradient(0, 0, 0, 100);
        topGlow.addColorStop(0, 'rgba(124, 58, 237, 0.2)');
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, 400, 100);

        // Avatar glow
        ctx.fillStyle = 'rgba(124, 58, 237, 0.3)';
        ctx.beginPath();
        ctx.arc(200, 80, 55, 0, Math.PI * 2);
        ctx.fill();

        // Avatar circle
        const avatarGradient = ctx.createLinearGradient(160, 40, 240, 120);
        avatarGradient.addColorStop(0, '#3b82f6');
        avatarGradient.addColorStop(1, '#9333ea');
        ctx.fillStyle = avatarGradient;
        ctx.beginPath();
        ctx.arc(200, 80, 45, 0, Math.PI * 2);
        ctx.fill();

        // Avatar ring
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(200, 80, 47, 0, Math.PI * 2);
        ctx.stroke();

        // Avatar letter
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(user.username[0].toUpperCase(), 200, 82);

        // Username
        ctx.font = 'bold 26px system-ui';
        ctx.fillText(user.username, 200, 150);

        // Rank badge background
        const rankWidth = ctx.measureText(`🏆 ${user.rank.toUpperCase()}`).width + 24;
        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        ctx.roundRect(200 - rankWidth / 2, 165, rankWidth, 26, 13);
        ctx.fill();
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
        ctx.lineWidth = 1;
        ctx.roundRect(200 - rankWidth / 2, 165, rankWidth, 26, 13);
        ctx.stroke();

        // Rank text
        ctx.font = 'bold 12px system-ui';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`� ${user.rank.toUpperCase()}`, 200, 179);

        // Stats cards
        const cardY = 210;
        const cardHeight = 70;

        // Points card
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.roundRect(20, cardY, 110, cardHeight, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.roundRect(20, cardY, 110, cardHeight, 16);
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px system-ui';
        ctx.fillText(`${stats.points}`, 75, cardY + 30);
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('PONT', 75, cardY + 52);

        // Win Rate card
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.roundRect(145, cardY, 110, cardHeight, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.roundRect(145, cardY, 110, cardHeight, 16);
        ctx.stroke();
        ctx.fillStyle = '#4ade80';
        ctx.font = 'bold 28px system-ui';
        ctx.fillText(`${stats.winRate}%`, 200, cardY + 30);
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('GYŐZELEM', 200, cardY + 52);

        // Streak card
        const streakGradient = ctx.createLinearGradient(270, cardY, 380, cardY + cardHeight);
        streakGradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
        streakGradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
        ctx.fillStyle = streakGradient;
        ctx.roundRect(270, cardY, 110, cardHeight, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.roundRect(270, cardY, 110, cardHeight, 16);
        ctx.stroke();
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 28px system-ui';
        ctx.fillText(`${stats.streak}🔥`, 325, cardY + 30);
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#fdba74';
        ctx.fillText('STREAK', 325, cardY + 52);

        // Footer line
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.moveTo(50, 305);
        ctx.lineTo(350, 305);
        ctx.stroke();

        // Footer
        ctx.font = 'bold 14px system-ui';
        ctx.fillStyle = 'white';
        ctx.fillText('🎯 Tippbajnok', 200, 330);
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#64748b';
        ctx.fillText('tippbajnok.vercel.app', 200, 348);

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
                <div className="fixed inset-0 bg-black/95 z-[110] flex flex-col items-center justify-center p-4 animate-in fade-in">
                    {/* Preview Card */}
                    <div ref={cardRef} className="w-[380px] rounded-3xl overflow-hidden shadow-2xl mb-6 relative">
                        {/* Animated gradient border effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 animate-pulse opacity-50" />

                        <div className="relative m-[2px] rounded-[22px] overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]">
                            {/* Top pattern/decoration */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/20 to-transparent" />
                            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
                            <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-purple-500/10 blur-xl" />

                            {/* Content */}
                            <div className="relative p-6 pt-8">
                                {/* Avatar with glow */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 scale-110" />
                                        <div className="relative size-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg ring-4 ring-white/10">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-white mt-4 tracking-tight">{user.username}</h3>

                                    {/* Rank badge */}
                                    <div className="mt-2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                                        <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                            <span>🏆</span> {user.rank}
                                        </span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                                        <div className="text-3xl font-black text-white">{stats.points}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-wider">Pont</div>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
                                        <div className="text-3xl font-black text-green-400">{stats.winRate}%</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-wider">Győzelem</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur rounded-2xl p-4 text-center border border-orange-500/30">
                                        <div className="text-3xl font-black text-orange-400 flex items-center justify-center gap-1">
                                            {stats.streak}<span className="text-2xl">🔥</span>
                                        </div>
                                        <div className="text-[10px] text-orange-300 uppercase font-bold mt-1 tracking-wider">Streak</div>
                                    </div>
                                </div>

                                {/* Footer watermark */}
                                <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/5">
                                    <span className="text-xl">🎯</span>
                                    <div className="text-center">
                                        <div className="text-white font-bold text-sm">Tippbajnok</div>
                                        <div className="text-slate-500 text-[9px]">tippbajnok.vercel.app</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadCard}
                            className="px-8 py-3.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                        >
                            <Icon name="download" /> Kép letöltése
                        </button>
                        <button
                            onClick={() => setShowShareCard(false)}
                            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-colors"
                        >
                            Bezárás
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
