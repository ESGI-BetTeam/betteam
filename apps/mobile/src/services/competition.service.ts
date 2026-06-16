import { api } from './api';

export interface Competition {
  id: string;
  externalId: string;
  name: string;
  sport: string;
  country: string | null;
  logoUrl: string | null;
  isActive: boolean;
  syncedAt: string;
}

interface CompetitionsResponse {
  competitions: Competition[];
  count: number;
}

export const competitionService = {
  async getCompetitions(params?: { sport?: string; isActive?: boolean }): Promise<Competition[]> {
    const { data } = await api.get<CompetitionsResponse>('/competitions', { params });
    return data.competitions ?? [];
  },
};

// The API returns English names — map the common ones to French (fallback: original)
const COMPETITION_NAMES_FR: Record<string, string> = {
  'english premier league': 'Premier League',
  'premier league': 'Premier League',
  'french ligue 1': 'Ligue 1',
  'ligue 1': 'Ligue 1',
  'french ligue 2': 'Ligue 2',
  'german bundesliga': 'Bundesliga',
  bundesliga: 'Bundesliga',
  'italian serie a': 'Serie A',
  'serie a': 'Serie A',
  'spanish la liga': 'La Liga',
  'la liga': 'La Liga',
  'uefa champions league': 'Ligue des Champions',
  'champions league': 'Ligue des Champions',
  'uefa europa league': 'Ligue Europa',
  'europa league': 'Ligue Europa',
  'english championship': 'Championship',
  'portuguese primeira liga': 'Primeira Liga',
  'dutch eredivisie': 'Eredivisie',
};

const COUNTRY_FR: Record<string, string> = {
  england: 'Angleterre',
  france: 'France',
  germany: 'Allemagne',
  italy: 'Italie',
  spain: 'Espagne',
  europe: 'Europe',
  netherlands: 'Pays-Bas',
  portugal: 'Portugal',
  belgium: 'Belgique',
  scotland: 'Écosse',
  'united states': 'États-Unis',
  usa: 'États-Unis',
  brazil: 'Brésil',
  argentina: 'Argentine',
  international: 'International',
};

export function frenchCompetitionName(name: string): string {
  return COMPETITION_NAMES_FR[name.trim().toLowerCase()] ?? name;
}

export function frenchCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  return COUNTRY_FR[country.trim().toLowerCase()] ?? country;
}
