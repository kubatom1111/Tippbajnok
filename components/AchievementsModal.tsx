import React, { useEffect, useState } from 'react';
import * as db from '../storage';
import { Achievement } from '../storage';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function AchievementsModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await db.getUserAchievements(userId);
            setAchievements(data);
            setLoading(false);
        };
        load();
    }, [userId]);

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#15202b] w-full max-w-lg rounded-3xl border border-border-dark shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 size-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors">
                        <Icon name="close" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">🏆</span>
                        <div>
                            <h2 className="text-2xl font-black text-white">Jelvények</h2>
                            <p className="text-white/80 text-sm">{unlockedCount} / {achievements.length} feloldva</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center text-text-muted py-8">Betöltés...</div>
                    ) : (
                        <div className="grid gap-3">
                            {achievements.map(ach => (
                                <div
                                    key={ach.id}
                                    className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${ach.unlocked
                                            ? 'bg-surface-dark border-yellow-500/30'
                                            : 'bg-surface-dark/50 border-border-dark opacity-60'
                                        }`}
                                >
                                    <div className={`text-4xl ${!ach.unlocked && 'grayscale'}`}>
                                        {ach.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold ${ach.unlocked ? 'text-white' : 'text-text-muted'}`}>
                                            {ach.name}
                                        </div>
                                        <div className="text-sm text-text-muted">
                                            {ach.description}
                                        </div>
                                    </div>
                                    {ach.unlocked && (
                                        <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <Icon name="check" className="text-green-400 text-lg" />
                                        </div>
                                    )}
                                </div>
                            ))}
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
