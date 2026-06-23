import type { NavigatorScreenParams } from '@react-navigation/native';
import type { GroupBet } from '@/services/match.service';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type LeaguesStackParamList = {
  LeaguesHome: undefined;
  CreateLeague: undefined;
  LeagueDetail: { leagueId: string; leagueName?: string };
};

export type PronosticsStackParamList = {
  PronosticsHome: undefined;
  PronosticDetail: { bet: GroupBet; leagueName?: string };
};

export type AppTabParamList = {
  Home: undefined;
  Leagues: NavigatorScreenParams<LeaguesStackParamList>;
  Pronostics: NavigatorScreenParams<PronosticsStackParamList>;
  Profile: undefined;
  Components: undefined;
};
