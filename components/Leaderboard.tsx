import React, { useEffect, useState } from 'react';
import { LeaderboardEntry, Championship } from '../types';
import * as db from '../storage';
import { WeeklyMVP } from '../storage';

interface LeaderboardProps {
  championship: Championship;
  refreshTrigger: number;
  compact?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ championship, refreshTrigger, compact = false }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyMvp, setWeeklyMvp] = useState<WeeklyMVP | null>(null);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);

      // Load data from Supabase
      const matches = await db.getMatches(championship.id);
      const userMap = await db.getAllUsers();
      const allResults = await db.fetchResults();

      const finishedMatches = matches.filter(m => m.status === 'FINISHED');

      const scores: Record<string, LeaderboardEntry> = {};

      championship.participants.forEach(uid => {
        scores[uid] = { userId: uid, username: userMap[uid] || 'Ismeretlen', points: 0, correctTips: 0 };
      });

      for (const match of finishedMatches) {
        const result = allResults.find(r => r.matchId === match.id);
        if (!result) continue;

        const bets = await db.fetchBetsForMatch(match.id);

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

      // Load Weekly MVP
      const mvp = await db.getWeeklyMVP(championship.id);
      setWeeklyMvp(mvp);

      setLoading(false);
    };

    calculate();
  }, [championship, refreshTrigger]);

  if (loading) return <div className={`text-center text-slate-500 ${compact ? 'p-4' : 'p-8'}`}>Adatok betöltése...</div>;

  // Stílus konstansok a compact mód alapján
  const paddingClass = compact ? 'p-2' : 'p-4 md:p-5';
  const headerClass = "bg-slate-900/50 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold";
  const headerTextSize = compact ? "text-[10px]" : "text-xs";

  // Badge Logic
  const getBadges = (entry: LeaderboardEntry, rank: number) => {
    const badges = [];
    if (rank === 0) badges.push({ icon: '👑', title: 'Címvédő' });
    if (weeklyMvp && entry.userId === weeklyMvp.userId) badges.push({ icon: '⭐', title: 'Heti MVP' });
    if (entry.points > 50) badges.push({ icon: '🎖️', title: 'Veterán (50+ pont)' });
    if (entry.correctTips > 5) badges.push({ icon: '🎯', title: 'Mesterlövész (5+ találat)' });
    return badges;
  };

  return (
    <div className="bg-sport-card border border-slate-800 rounded-xl overflow-hidden shadow-card">
      {/* Weekly MVP Banner */}
      {!compact && weeklyMvp && (
        <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 p-4 border-b border-yellow-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold">Heti MVP</div>
              <div className="font-bold text-white">{weeklyMvp.username}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-yellow-400">{weeklyMvp.weeklyPoints} pont</div>
            <div className="text-[10px] text-yellow-400/70">{weeklyMvp.weeklyCorrect} találat ezen a héten</div>
          </div>
        </div>
      )}

      <table className="w-full text-left border-collapse">
        <thead className={`${headerClass} ${headerTextSize}`}>
          <tr>
            <th className={`${paddingClass} w-10 text-center`}>#</th>
            <th className={`${paddingClass}`}>Játékos</th>
            {/* Compact módban elrejtjük a találatokat, hogy kiférjen a pontszám */}
            {!compact && <th className={`${paddingClass} text-center`}>Találat</th>}
            <th className={`${paddingClass} text-right`}>Pont</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {entries.map((entry, idx) => (
            <tr key={entry.userId} className={`group transition-colors hover:bg-slate-800/30 ${idx < 3 ? 'bg-slate-800/10' : ''}`}>
              <td className={`${paddingClass} text-center`}>
                {idx === 0 ? <span className={compact ? "text-sm" : "text-xl"}>🥇</span> :
                  idx === 1 ? <span className={compact ? "text-sm" : "text-xl"}>🥈</span> :
                    idx === 2 ? <span className={compact ? "text-sm" : "text-xl"}>🥉</span> :
                      <span className="text-slate-500 font-mono">{(idx + 1).toString().padStart(2, '0')}</span>}
              </td>
              <td className={paddingClass}>
                <div className={`font-medium truncate max-w-[120px] flex items-center gap-1 ${idx < 3 ? 'text-white' : 'text-slate-300'} ${compact ? 'text-xs' : 'text-base'}`}>
                  {entry.username}
                  {getBadges(entry, idx).map((b, i) => (
                    <span key={i} title={b.title} className="cursor-help text-xs filter drop-shadow hover:scale-125 transition-transform">{b.icon}</span>
                  ))}
                </div>
                {!compact && idx === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/30 mt-1 inline-block">BAJNOK</span>}
              </td>
              {!compact && <td className={`${paddingClass} text-center text-slate-400 text-sm`}>{entry.correctTips}</td>}
              <td className={`${paddingClass} text-right`}>
                <span className={`font-bold ${idx === 0 ? 'text-sport-primary' : 'text-white'} ${compact ? 'text-sm' : 'text-lg'}`}>
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