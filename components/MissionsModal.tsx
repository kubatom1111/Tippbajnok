import React from 'react';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function MissionsModal({ onClose }: { onClose: () => void }) {
    const missions = [
        { title: "Napi Bejelentkezés", desc: "Lépj be minden nap!", progress: 1, total: 1, reward: "10 XP", completed: true, icon: "calendar_today" },
        { title: "Mesterhármas", desc: "Tippelj helyesen 3 meccsre sorozatban.", progress: 1, total: 3, reward: "Jelvény", completed: false, icon: "local_fire_department" },
        { title: "Közösségi Ember", desc: "Hívj meg egy barátot.", progress: 0, total: 1, reward: "50 XP", completed: false, icon: "group_add" },
    ];

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
                    {missions.map((m, i) => (
                        <div key={i} className={`relative p-4 rounded-xl border ${m.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-surface-dark border-border-dark'} transition-all`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-full flex items-center justify-center ${m.completed ? 'bg-green-500 text-white' : 'bg-surface-dark border border-border-dark text-text-muted'}`}>
                                        {m.completed ? <Icon name="check" /> : <Icon name={m.icon} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${m.completed ? 'text-green-400' : 'text-white'}`}>{m.title}</h4>
                                        <p className="text-xs text-text-muted">{m.desc}</p>
                                    </div>
                                </div>
                                <div className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                    {m.reward}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden mt-3">
                                <div
                                    className={`h-full ${m.completed ? 'bg-green-500' : 'bg-purple-500'} transition-all duration-500`}
                                    style={{ width: `${(m.progress / m.total) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-text-muted font-bold">{m.progress} / {m.total}</span>
                            </div>
                        </div>
                    ))}
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
