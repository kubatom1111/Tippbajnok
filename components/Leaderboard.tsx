import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, Championship } from '../types';
import { getMatches, getBetsForMatch, getResult, getUserMap } from '../services/storageService';

interface LeaderboardProps {
  championship: Championship;
  refreshTrigger: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ championship, refreshTrigger }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      const matches = await getMatches(championship.id);
      const userMap = getUserMap();
      const finishedMatches = matches.filter(m => m.status === 'FINISHED');
      
      const scores: Record<string, LeaderboardEntry> = {};

      championship.participants.forEach(uid => {
          scores[uid] = { userId: uid, username: userMap[uid] || 'Ismeretlen', points: 0, correctTips: 0 };
      });

      for (const match of finishedMatches) {
        const result = getResult(match.id);
        if (!result) continue;

        const bets = getBetsForMatch(match.id);
        
        bets.forEach(bet => {
            if (!scores[bet.userId]) return;

            match.questions.forEach(q => {
                if (String(bet.answers[q.id]) === String(result.answers[q.id])) {
                    scores[bet.userId].points += q.points;
                    scores[bet.userId].correctTips += 1;
                }
            });
        });
      }

      setEntries(Object.values(scores).sort((a, b) => b.points - a.points));
      setLoading(false);
    };

    calculate();
  }, [championship, refreshTrigger]);

  if (loading) return <div className="p-8 text-center text-slate-500">Adatok betöltése...</div>;

  return (
    <div className="bg-sport-card border border-slate-800 rounded-xl overflow-hidden shadow-card">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
          <tr>
            <th className="p-5 w-16 text-center">#</th>
            <th className="p-5">Játékos</th>
            <th className="p-5 text-center">Találat</th>
            <th className="p-5 text-right">Pontszám</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {entries.map((entry, idx) => (
            <tr key={entry.userId} className={`group transition-colors hover:bg-slate-800/30 ${idx < 3 ? 'bg-slate-800/10' : ''}`}>
              <td className="p-5 text-center">
                 {idx === 0 ? <span className="text-xl">🥇</span> : 
                  idx === 1 ? <span className="text-xl">🥈</span> :
                  idx === 2 ? <span className="text-xl">🥉</span> :
                  <span className="text-slate-500 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>}
              </td>
              <td className="p-5">
                  <div className={`font-medium ${idx < 3 ? 'text-white text-base' : 'text-slate-300'}`}>
                      {entry.username}
                      {idx === 0 && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30">BAJNOK</span>}
                  </div>
              </td>
              <td className="p-5 text-center text-slate-400 text-sm">{entry.correctTips}</td>
              <td className="p-5 text-right">
                  <span className={`font-bold text-lg ${idx === 0 ? 'text-sport-primary' : 'text-white'}`}>
                    {entry.points}
                  </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};