import type { NavigatorScreenParams } from '@react-navigation/native';
import type { GroupBet, Match } from '@/services/match.service';

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
  // Opened either from an existing group bet, or from a raw upcoming match
  // (a challenge is then resolved/created on validation).
  PronosticDetail: { bet?: GroupBet; match?: Match; leagueName?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  MyBets: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Leagues: NavigatorScreenParams<LeaguesStackParamList>;
  Pronostics: NavigatorScreenParams<PronosticsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Components: undefined;
};
