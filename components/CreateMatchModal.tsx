import React, { useState } from 'react';
import { QuestionType, Match } from '../types';

interface CreateMatchModalProps {
    championshipId: string;
    onClose: () => void;
    onSave: (match: Omit<Match, 'id'>) => void;
}

// Icon helper
const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({ championshipId, onClose, onSave }) => {
    const [p1, setP1] = useState('');
    const [p2, setP2] = useState('');
    const [date, setDate] = useState('');
    const [selectedType, setSelectedType] = useState<'F' | 'D' | null>(null);

    const handleSave = () => {
        if (!p1 || !p2 || !date || !selectedType) return;

        const questions = selectedType === 'F'
            ? [
                { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Mérkőzés Győztese', points: 2, options: [p1, 'Döntetlen', p2] },
                { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos Végeredmény', points: 5 },
                { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Félidő Eredmény', points: 2, options: [p1, 'Döntetlen', p2] },
                { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: 'Gólszám 2.5', points: 1 },
                { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Mindkét csapat lő gólt?', points: 1, options: ['Igen', 'Nem'] },
                { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: 'Szögletek 9.5', points: 1 }
            ]
            : [
                { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2, options: [p1, p2] },
                { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Szett Eredmény', points: 5 },
                { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: '180-asok (6.5)', points: 1, threshold: 6.5 },
                { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Magasabb Kiszálló', points: 1, options: [p1, p2] }
            ];

        onSave({
            championshipId,
            player1: p1,
            player2: p2,
            startTime: new Date(date).toISOString(),
            status: 'SCHEDULED',
            questions
        });
    };

    const isFormValid = p1 && p2 && date && selectedType;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-[#1a2632] to-[#0f1419] w-full max-w-lg rounded-3xl overflow-hidden border border-[#233648] relative shadow-2xl">
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute top-4 left-4 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 size-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#92adc9] hover:text-white transition-all"
                    >
                        <Icon name="close" />
                    </button>

                    <div className="flex items-center gap-3 relative">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Icon name="add_circle" className="text-white text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Új Mérkőzés</h3>
                            <p className="text-xs text-[#92adc9]">Állítsd be a részleteket</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-5">
                    {/* Teams/Players */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider flex items-center gap-2">
                            <Icon name="groups" className="text-sm" />
                            Csapatok / Játékosok
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    className="w-full bg-[#0d1117] border-2 border-[#233648] rounded-2xl px-4 py-3.5 text-white font-bold placeholder:text-[#4a5568] focus:border-primary focus:bg-[#0d1117] outline-none transition-all"
                                    placeholder="Hazai"
                                    value={p1}
                                    onChange={e => setP1(e.target.value)}
                                />
                                {p1 && <div className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-green-500" />}
                            </div>
                            <div className="relative">
                                <div className="size-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
                                    <span className="font-black text-primary text-sm">VS</span>
                                </div>
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    className="w-full bg-[#0d1117] border-2 border-[#233648] rounded-2xl px-4 py-3.5 text-white font-bold placeholder:text-[#4a5568] focus:border-primary focus:bg-[#0d1117] outline-none transition-all"
                                    placeholder="Vendég"
                                    value={p2}
                                    onChange={e => setP2(e.target.value)}
                                />
                                {p2 && <div className="absolute right-3 top-1/2 -translate-y-1/2 size-2 rounded-full bg-green-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Date Time */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider flex items-center gap-2">
                            <Icon name="schedule" className="text-sm" />
                            Kezdés Időpontja
                        </label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                className="w-full bg-[#0d1117] border-2 border-[#233648] rounded-2xl px-4 py-3.5 text-white font-medium focus:border-primary outline-none transition-all [color-scheme:dark]"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                            {date && <div className="absolute right-12 top-1/2 -translate-y-1/2 size-2 rounded-full bg-green-500" />}
                        </div>
                    </div>

                    {/* Question Packages */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider flex items-center gap-2">
                            <Icon name="category" className="text-sm" />
                            Kérdés Csomag
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSelectedType('F')}
                                className={`relative overflow-hidden bg-[#0d1117] border-2 rounded-2xl p-4 transition-all group
                                ${selectedType === 'F'
                                        ? 'border-green-500 bg-green-500/5'
                                        : 'border-[#233648] hover:border-primary/50 hover:bg-primary/5'}`}
                            >
                                {selectedType === 'F' && (
                                    <div className="absolute top-2 right-2 size-5 rounded-full bg-green-500 flex items-center justify-center">
                                        <Icon name="check" className="text-white text-sm" />
                                    </div>
                                )}
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all
                                    ${selectedType === 'F'
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'
                                            : 'bg-[#233648] group-hover:bg-primary/20'}`}>
                                        <span className="text-3xl">⚽</span>
                                    </div>
                                    <div className="text-center">
                                        <div className={`font-bold transition-colors ${selectedType === 'F' ? 'text-green-400' : 'text-white'}`}>
                                            Foci
                                        </div>
                                        <div className="text-[10px] text-[#92adc9]">6 kérdés</div>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setSelectedType('D')}
                                className={`relative overflow-hidden bg-[#0d1117] border-2 rounded-2xl p-4 transition-all group
                                ${selectedType === 'D'
                                        ? 'border-green-500 bg-green-500/5'
                                        : 'border-[#233648] hover:border-primary/50 hover:bg-primary/5'}`}
                            >
                                {selectedType === 'D' && (
                                    <div className="absolute top-2 right-2 size-5 rounded-full bg-green-500 flex items-center justify-center">
                                        <Icon name="check" className="text-white text-sm" />
                                    </div>
                                )}
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all
                                    ${selectedType === 'D'
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'
                                            : 'bg-[#233648] group-hover:bg-primary/20'}`}>
                                        <span className="text-3xl">🎯</span>
                                    </div>
                                    <div className="text-center">
                                        <div className={`font-bold transition-colors ${selectedType === 'D' ? 'text-green-400' : 'text-white'}`}>
                                            Darts
                                        </div>
                                        <div className="text-[10px] text-[#92adc9]">4 kérdés</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleSave}
                        disabled={!isFormValid}
                        className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                        ${isFormValid
                                ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-[#233648] text-[#4a5568] cursor-not-allowed'}`}
                    >
                        <Icon name="add_circle" />
                        Mérkőzés Létrehozása
                    </button>

                    {/* Validation hints */}
                    {(!p1 || !p2 || !date || !selectedType) && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {!p1 && <span className="text-[10px] text-[#92adc9] bg-[#233648]/50 px-2 py-0.5 rounded-full">Hazai csapat hiányzik</span>}
                            {!p2 && <span className="text-[10px] text-[#92adc9] bg-[#233648]/50 px-2 py-0.5 rounded-full">Vendég csapat hiányzik</span>}
                            {!date && <span className="text-[10px] text-[#92adc9] bg-[#233648]/50 px-2 py-0.5 rounded-full">Időpont hiányzik</span>}
                            {!selectedType && <span className="text-[10px] text-[#92adc9] bg-[#233648]/50 px-2 py-0.5 rounded-full">Válassz csomagot</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
