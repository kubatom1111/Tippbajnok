import React, { useState } from 'react';
import * as db from '../storage';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

type Mission = {
    id: number;
    title: string;
    desc: string;
    progress: number;
    total: number;
    rewardXp: number;
    icon: string;
    claimed: boolean;
};

export function MissionsModal({ onClose, onUpdateUser }: { onClose: () => void, onUpdateUser: () => void }) {
    const [missions, setMissions] = useState<Mission[]>([
        { id: 1, title: "Napi Bejelentkezés", desc: "Lépj be minden nap!", progress: 1, total: 1, rewardXp: 50, claimed: false, icon: "calendar_today" },
        { id: 2, title: "Mesterhármas", desc: "Tippelj helyesen 3 meccsre sorozatban.", progress: 0, total: 3, rewardXp: 150, claimed: false, icon: "local_fire_department" },
        { id: 3, title: "Közösségi Ember", desc: "Hívj meg egy barátot.", progress: 0, total: 1, rewardXp: 100, claimed: false, icon: "group_add" },
        { id: 4, title: "Napi Tippelő", desc: "Tippelj ma legalább egy meccsre!", progress: 0, total: 1, rewardXp: 30, claimed: false, icon: "sports_soccer" },
    ]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const loadData = async () => {
            const session = db.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            // Fetch from Supabase (async)
            const claimMap = await db.getMissionClaimsFromDB(session.id);
            const streak = await db.getConsecutiveCorrectTips(session.id);
            const betToday = await db.didBetToday(session.id);

            setMissions(prev => prev.map(m => {
                const claimDate = claimMap[m.id];

                // ID 1: Napi Bejelentkezés (daily)
                if (m.id === 1) {
                    if (!claimDate) return { ...m, claimed: false };
                    const claimedDay = claimDate.split('T')[0];
                    return { ...m, claimed: claimedDay === today };
                }

                // ID 2: Mesterhármas (one-time)
                if (m.id === 2) {
                    const isClaimed = !!claimDate;
                    return { ...m, progress: streak, claimed: isClaimed };
                }

                // ID 4: Napi Tippelő (daily)
                if (m.id === 4) {
                    let isClaimed = false;
                    if (claimDate) {
                        const claimedDay = claimDate.split('T')[0];
                        isClaimed = (claimedDay === today);
                    }
                    return { ...m, progress: betToday ? 1 : 0, claimed: isClaimed };
                }

                // Others (one-time)
                if (claimDate) return { ...m, claimed: true };
                return m;
            }));
            setLoading(false);
        };
        loadData();
    }, []);

    const handleClaim = async (mission: Mission) => {
        if (mission.claimed) return;

        const session = db.getSession();
        if (!session) return;

        const today = new Date().toISOString().split('T')[0];

        // CRITICAL: Server-side (Supabase) check for repeated claims
        const currentClaims = await db.getMissionClaimsFromDB(session.id);
        const existingClaimDate = currentClaims[mission.id];

        // For daily missions (1, 4), check if claimed TODAY
        if (mission.id === 1 || mission.id === 4) {
            if (existingClaimDate) {
                const claimedDay = existingClaimDate.split('T')[0];
                if (claimedDay === today) {
                    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, claimed: true } : m));
                    console.warn(`Mission ${mission.id} already claimed today in DB.`);
                    return;
                }
            }
        } else {
            // For one-time missions, if ANY claim exists, block.
            if (existingClaimDate) {
                setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, claimed: true } : m));
                console.warn(`Mission ${mission.id} already claimed in DB.`);
                return;
            }
        }

        // --- Safe to claim ---
        // Optimistic UI update
        setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, claimed: true } : m));

        // Save to Supabase
        const saved = await db.saveMissionClaimToDB(session.id, mission.id);
        if (!saved) {
            // Rollback on failure
            setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, claimed: false } : m));
            alert("Hiba a mentés során. Próbáld újra!");
            return;
        }

        try {
            // Check streak for 2x XP bonus
            const streak = await db.getLoginStreak(session.id);
            const multiplier = streak >= 7 ? 2 : 1;
            const xpToAdd = mission.rewardXp * multiplier;

            await db.addXp(xpToAdd);
            onUpdateUser();

            if (multiplier > 1) {
                console.log(`🔥 Streak bonus! ${mission.rewardXp} x ${multiplier} = ${xpToAdd} XP`);
            }
        } catch (e) {
            console.error("Failed to add XP:", e);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center">
                <div className="text-white text-lg animate-pulse">Küldetések betöltése...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#15202b] w-full max-w-lg rounded-2xl p-0 border border-border-dark shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border-dark bg-surface-dark flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <Icon name="assignment" className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Küldetések</h3>
                            <p className="text-xs text-text-muted">Teljesítsd őket extra jutalmakért!</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors relative z-10">
                        <Icon name="close" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {missions.map((m) => {
                        const isCompleted = m.progress >= m.total;
                        return (
                            <div key={m.id} className={`relative p-4 rounded-xl border ${isCompleted && !m.claimed ? 'bg-gradient-to-r from-surface-dark to-purple-500/10 border-purple-500/30' : 'bg-surface-dark border-border-dark'} transition-all`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-full flex items-center justify-center ${isCompleted || m.claimed ? 'bg-purple-500 text-white' : 'bg-surface-dark border border-border-dark text-text-muted'}`}>
                                            <Icon name={m.icon} />
                                        </div>
                                        <div>
                                            <h4 className={`font-bold ${isCompleted ? 'text-white' : 'text-text-muted'}`}>{m.title}</h4>
                                            <p className="text-xs text-text-muted">{m.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                            +{m.rewardXp} XP
                                        </div>
                                        {isCompleted && !m.claimed && (
                                            <button
                                                onClick={() => handleClaim(m)}
                                                className="px-3 py-1 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-500/20 animate-pulse"
                                            >
                                                BEGYŰJTÉS
                                            </button>
                                        )}
                                        {m.claimed && (
                                            <span className="text-xs font-bold text-green-400 flex items-center gap-1"><Icon name="check_circle" className="text-sm" /> KÉSZ</span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {!m.claimed && (
                                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-3">
                                        <div
                                            className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-purple-500'} transition-all duration-500`}
                                            style={{ width: `${(m.progress / m.total) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-border-dark text-center">
                    <button onClick={onClose} className="text-sm text-text-muted hover:text-white transition-colors">
                        Bezárás
                    </button>
                </div>
            </div>
        </div>
    );
}
