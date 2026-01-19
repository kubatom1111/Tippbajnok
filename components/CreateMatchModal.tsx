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

  const handleSave = (type: 'F' | 'D') => {
      if(!p1 || !p2 || !date) return;
      
      const questions = type === 'F' 
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-[#1a2632] w-full max-w-md rounded-2xl p-6 border border-[#233648] relative shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-[#92adc9] hover:text-white"><Icon name="close" /></button>
            <h3 className="text-xl font-black text-white mb-6">Új Mérkőzés Felvétele</h3>
            
            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-[#92adc9] uppercase ml-1 mb-1 block">Csapatok / Játékosok</label>
                    <div className="flex items-center gap-3">
                        <input className="w-full bg-[#233648] border border-[#233648] rounded-xl p-3 text-white focus:border-[#137fec] outline-none" placeholder="Hazai" value={p1} onChange={e => setP1(e.target.value)} />
                        <span className="font-black text-[#92adc9]">VS</span>
                        <input className="w-full bg-[#233648] border border-[#233648] rounded-xl p-3 text-white focus:border-[#137fec] outline-none" placeholder="Vendég" value={p2} onChange={e => setP2(e.target.value)} />
                    </div>
                </div>
                <div>
                     <label className="text-xs font-bold text-[#92adc9] uppercase ml-1 mb-1 block">Kezdés Időpontja</label>
                     <input type="datetime-local" className="w-full bg-[#233648] border border-[#233648] rounded-xl p-3 text-white focus:border-[#137fec] outline-none" value={date} onChange={e => setDate(e.target.value)} />
                </div>
            </div>
            
            <label className="text-xs font-bold text-[#92adc9] uppercase ml-1 mb-2 block">Válassz csomagot a kérdésekhez:</label>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleSave('F')} 
                    disabled={!p1 || !p2 || !date}
                    className="bg-[#1a2632] border border-[#233648] hover:border-[#137fec] hover:bg-[#137fec]/5 text-white py-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Icon name="sports_soccer" className="text-2xl text-[#92adc9] group-hover:text-[#137fec]"/> 
                    Foci Csomag
                </button>
                <button 
                    onClick={() => handleSave('D')} 
                    disabled={!p1 || !p2 || !date}
                    className="bg-[#1a2632] border border-[#233648] hover:border-[#137fec] hover:bg-[#137fec]/5 text-white py-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Icon name="adjust" className="text-2xl text-[#92adc9] group-hover:text-[#137fec]"/> 
                    Darts Csomag
                </button>
            </div>
        </div>
    </div>
  );
};
