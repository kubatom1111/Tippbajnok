import React from 'react';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export function RulesModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#15202b] w-full max-w-lg rounded-2xl p-0 border border-border-dark shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border-dark bg-surface-dark flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Icon name="rule" className="text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Játékszabályok</h3>
                            <p className="text-xs text-text-muted">Így szerezhetsz pontokat</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-white transition-colors">
                        <Icon name="close" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-green-500/20 shadow-lg shadow-green-900/10">
                            <div className="size-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 text-green-400 font-black text-xl">
                                5p
                            </div>
                            <div>
                                <h4 className="font-bold text-green-400">Telitalálat</h4>
                                <p className="text-sm text-slate-300">Ha pontosan eltalálod a végeredményt.</p>
                                <p className="text-xs text-slate-500 mt-1">Pl. Tipp: 2-1, Eredmény: 2-1</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-yellow-500/20 shadow-lg shadow-yellow-900/10">
                            <div className="size-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 text-yellow-400 font-black text-xl">
                                3p
                            </div>
                            <div>
                                <h4 className="font-bold text-yellow-400">Gólkülönbség</h4>
                                <p className="text-sm text-slate-300">Ha a győztest és a gólkülönbséget eltalálod.</p>
                                <p className="text-xs text-slate-500 mt-1">Pl. Tipp: 2-0, Eredmény: 3-1</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-blue-500/20 shadow-lg shadow-blue-900/10">
                            <div className="size-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 font-black text-xl">
                                1p
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-400">Kimenetel</h4>
                                <p className="text-sm text-slate-300">Ha csak a győztest (vagy döntetlent) találod el.</p>
                                <p className="text-xs text-slate-500 mt-1">Pl. Tipp: 1-0, Eredmény: 4-1</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-center">
                        <p className="text-sm text-blue-200">
                            <Icon name="info" className="align-middle mr-1" />
                            A pontok automatikusan frissülnek a meccs lefújása után.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-border-dark text-center">
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-surface-dark hover:bg-white/5 text-white font-bold transition-colors border border-border-dark">
                        Értettem
                    </button>
                </div>
            </div>
        </div>
    );
}
