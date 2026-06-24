// Client-side match timing. Derived purely from the kickoff time so we never
// poll the server for "is it live yet" — the bet windows mirror the API rules.

// Minutes before kickoff when the vote closes for the "soon" hint (M-10).
const SOON_WINDOW_MS = 10 * 60 * 1000;

export type MatchPhase = 'open' | 'soon' | 'live';

// 'open'  : kickoff is more than 10 minutes away — bets are freely editable.
// 'soon'  : kickoff is within 10 minutes — closing imminent.
// 'live'  : kickoff has passed — bets are frozen.
export function matchPhase(startTime: string | Date): MatchPhase {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  if (now >= start) return 'live';
  if (now >= start - SOON_WINDOW_MS) return 'soon';
  return 'open';
}

// True once kickoff has passed: bets can no longer be placed or modified.
export function isMatchStarted(startTime?: string | Date | null): boolean {
  if (!startTime) return false;
  return Date.now() >= new Date(startTime).getTime();
}
