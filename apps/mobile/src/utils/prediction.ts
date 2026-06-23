// Helpers to read the JSON `predictionValue` stored on a bet.

export type MatchOutcome = 'home' | 'draw' | 'away';

export interface ParsedPrediction {
  value: MatchOutcome;
  homeScore?: number;
  awayScore?: number;
}

export function parsePrediction(predictionValue: string): ParsedPrediction | null {
  try {
    const p = JSON.parse(predictionValue);
    if (p?.value !== 'home' && p?.value !== 'draw' && p?.value !== 'away') return null;
    const hasScore =
      Number.isInteger(p.homeScore) && Number.isInteger(p.awayScore);
    return hasScore
      ? { value: p.value, homeScore: p.homeScore, awayScore: p.awayScore }
      : { value: p.value };
  } catch {
    return null;
  }
}

// Short human label, e.g. "Victoire PSG · 2–1" or "Match nul".
export function formatPick(
  predictionValue: string,
  homeName: string,
  awayName: string,
): string {
  const p = parsePrediction(predictionValue);
  if (!p) return 'Pronostic';
  const winner =
    p.value === 'home'
      ? `Victoire ${homeName}`
      : p.value === 'away'
        ? `Victoire ${awayName}`
        : 'Match nul';
  return p.homeScore != null && p.awayScore != null
    ? `${winner} · ${p.homeScore}–${p.awayScore}`
    : winner;
}
