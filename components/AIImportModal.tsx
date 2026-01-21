import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Match, QuestionType } from '../types';

interface AIImportModalProps {
  championshipId: string;
  onClose: () => void;
  onSave: (match: Omit<Match, 'id'>) => Promise<void>;
}

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const AIImportModal: React.FC<AIImportModalProps> = ({ championshipId, onClose, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setGeneratedMatches([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview', // Gyors modell a generáláshoz
        contents: `Generáld le a következő sportesemények listáját JSON formátumban: "${prompt}". 
                   A válaszban csak a valós vagy reális csapatnevek és időpontok legyenek.
                   Csak a jövőbeni vagy a promptban kért időpontokat használd.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                player1: { type: Type.STRING, description: "Hazai csapat vagy játékos neve" },
                player2: { type: Type.STRING, description: "Vendég csapat vagy játékos neve" },
                startTime: { type: Type.STRING, description: "ISO 8601 formátumú dátum és idő (pl. 2026-05-20T20:45:00)" },
                sport: { type: Type.STRING, enum: ["FOOTBALL", "DARTS", "OTHER"], description: "A sportág típusa" }
              },
              required: ["player1", "player2", "startTime", "sport"]
            }
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setGeneratedMatches(data);
        // Alapból mindet kijelöljük
        setSelectedIndices(data.map((_: any, i: number) => i));
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert("Hiba történt a generálás során. Ellenőrizd az API kulcsot vagy próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    const matchesToSave = generatedMatches.filter((_, i) => selectedIndices.includes(i));

    for (const m of matchesToSave) {
        // Alapértelmezett kérdéscsomag generálása sportág alapján
        const questions = m.sport === 'DARTS' 
         ? [
             { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Győztes', points: 2, options: [m.player1, m.player2] }, 
             { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Szett Eredmény', points: 5 }, 
             { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: '180-asok (6.5)', points: 1, threshold: 6.5 }, 
             { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Magasabb Kiszálló', points: 1, options: [m.player1, m.player2] }
           ]
         : [ // Default to Football
             { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Mérkőzés Győztese', points: 2, options: [m.player1, 'Döntetlen', m.player2] },
             { id: crypto.randomUUID(), type: QuestionType.EXACT_SCORE, label: 'Pontos Végeredmény', points: 5 },
             { id: crypto.randomUUID(), type: QuestionType.WINNER, label: 'Félidő Eredmény', points: 2, options: [m.player1, 'Döntetlen', m.player2] },
             { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: 'Gólszám 2.5', points: 1 },
             { id: crypto.randomUUID(), type: QuestionType.CHOICE, label: 'Mindkét csapat lő gólt?', points: 1, options: ['Igen', 'Nem'] },
             { id: crypto.randomUUID(), type: QuestionType.OVER_UNDER, label: 'Szögletek 9.5', points: 1 }
           ];

        await onSave({
            championshipId,
            player1: m.player1,
            player2: m.player2,
            startTime: m.startTime,
            status: 'SCHEDULED',
            questions
        });
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-[#1a2632] w-full max-w-2xl rounded-2xl p-6 border border-[#233648] relative shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={onClose} className="absolute top-4 right-4 text-[#92adc9] hover:text-white"><Icon name="close" /></button>
            
            <div className="mb-6">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Icon name="auto_awesome" className="text-purple-400" /> AI Meccs Importáló
                </h3>
                <p className="text-sm text-[#92adc9] mt-1">
                    Írd be milyen meccseket keresel, és az AI legenerálja a menetrendet.
                </p>
            </div>

            {generatedMatches.length === 0 ? (
                <div className="space-y-4">
                    <textarea 
                        className="w-full bg-[#233648] border border-[#233648] rounded-xl p-4 text-white focus:border-purple-500 outline-none min-h-[100px]" 
                        placeholder="Pl.: 2026 BL elődöntők, Következő Real Madrid meccsek, Foci EB döntő..." 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                    />
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading || !prompt}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Generálás...' : <><Icon name="search_spark" /> Meccsek Keresése</>}
                    </button>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[#92adc9] uppercase">{selectedIndices.length} meccs kiválasztva</span>
                        <button onClick={() => setGeneratedMatches([])} className="text-xs text-[#92adc9] hover:text-white underline">Új keresés</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 mb-4">
                        {generatedMatches.map((m, i) => (
                            <div 
                                key={i} 
                                onClick={() => toggleSelect(i)}
                                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selectedIndices.includes(i) ? 'bg-purple-500/10 border-purple-500/50' : 'bg-[#233648]/50 border-transparent hover:bg-[#233648]'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`size-5 rounded border flex items-center justify-center ${selectedIndices.includes(i) ? 'bg-purple-500 border-purple-500' : 'border-[#92adc9]'}`}>
                                        {selectedIndices.includes(i) && <Icon name="check" className="text-xs text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">{m.player1} vs {m.player2}</div>
                                        <div className="text-xs text-[#92adc9]">{new Date(m.startTime).toLocaleString()} • {m.sport}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleImport} 
                        disabled={loading || selectedIndices.length === 0}
                        className="w-full bg-[#137fec] hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {loading ? 'Mentés folyamatban...' : `Kiválasztott ${selectedIndices.length} meccs Importálása`}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};
