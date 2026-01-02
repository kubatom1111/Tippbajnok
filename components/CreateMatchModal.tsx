import React, { useState } from 'react';
import { QuestionType, QuestionConfig, Match } from '../types';
import { Button } from './Button';

interface CreateMatchModalProps {
  championshipId: string;
  onClose: () => void;
  onSave: (match: Omit<Match, 'id'>) => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({ championshipId, onClose, onSave }) => {
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [startTime, setStartTime] = useState('');
  const [questions, setQuestions] = useState<QuestionConfig[]>([]);

  const addDefaultDartsQuestions = () => {
    if (!player1 || !player2) return;
    
    const newQuestions: QuestionConfig[] = [
      { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Mérkőzés győztese', points: 2, options: [player1, player2] },
      { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos végeredmény (Szettek)', points: 5 },
      { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: '180-as dobások száma (6.5)', threshold: 6.5, points: 1 },
      { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Legmagasabb kiszálló', options: [player1, player2], points: 1 }
    ];
    setQuestions(prev => [...prev, ...newQuestions]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionPoint = (id: string, points: number) => {
      setQuestions(questions.map(q => q.id === id ? {...q, points} : q));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1 || !player2 || !startTime) return;

    onSave({
      championshipId,
      player1,
      player2,
      startTime: new Date(startTime).toISOString(),
      status: 'SCHEDULED',
      questions
    });
  };

  const inputStyle = "w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-sport-primary focus:ring-1 focus:ring-sport-primary outline-none transition-colors";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-sport-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-700 flex flex-col">
        
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Új Mérkőzés</h2>
          <p className="text-slate-400 text-sm">Add meg a részleteket és a tippkérdéseket.</p>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Hazai</label>
                <input required type="text" className={inputStyle} value={player1} onChange={e => setPlayer1(e.target.value)} placeholder="Csapat/Játékos 1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Vendég</label>
                <input required type="text" className={inputStyle} value={player2} onChange={e => setPlayer2(e.target.value)} placeholder="Csapat/Játékos 2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Időpont</label>
              <input required type="datetime-local" className={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>

            <div className="border-t border-slate-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white text-sm">Tippkérdések</h3>
                <Button type="button" variant="outline" size="sm" onClick={addDefaultDartsQuestions} disabled={!player1 || !player2}>
                  + Darts Csomag
                </Button>
              </div>

              {questions.length === 0 && (
                <div className="p-6 border-2 border-dashed border-slate-700 rounded-xl text-center">
                    <p className="text-slate-500 text-sm">Nincsenek kérdések hozzáadva.</p>
                </div>
              )}

              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">{q.label}</div>
                      <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">{q.type}</span>
                          {q.threshold && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">&gt; {q.threshold}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                            <span className="text-xs text-slate-500">Pont:</span>
                            <input 
                                type="number" 
                                min="1" 
                                className="w-8 bg-transparent text-center text-white text-sm focus:outline-none"
                                value={q.points}
                                onChange={(e) => updateQuestionPoint(q.id, parseInt(e.target.value))}
                            />
                        </div>
                        <button type="button" onClick={() => removeQuestion(q.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Mégse</Button>
              <Button type="submit" variant="primary" disabled={questions.length === 0}>
                Létrehozás
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};