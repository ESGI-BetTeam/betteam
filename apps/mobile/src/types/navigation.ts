import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type LeaguesStackParamList = {
  LeaguesHome: undefined;
  CreateLeague: undefined;
  LeagueDetail: { leagueId: string; leagueName?: string };
};

export type AppTabParamList = {
  Home: undefined;
  Leagues: NavigatorScreenParams<LeaguesStackParamList>;
  Pronostics: undefined;
  Profile: undefined;
  Components: undefined;
};
