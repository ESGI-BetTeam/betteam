/**
 * Types pour les réponses de l'API TheSportsDB
 */

export interface TheSportsDBLeague {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strLeagueAlternate?: string;
  strCountry?: string;
  strBadge?: string;
  strBanner?: string;
  strLogo?: string;
  strDescriptionEN?: string;
  strCurrentSeason?: string;
  dateFirstEvent?: string;
}

export interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strAlternate?: string;
  strSport: string;
  strCountry?: string;
  strBadge?: string;
  strLogo?: string;
  strStadium?: string;
  strStadiumThumb?: string;
  strStadiumLocation?: string;
  intStadiumCapacity?: string;
  strWebsite?: string;
  strDescriptionEN?: string;
  intFormedYear?: string;
  strKitColour1?: string;
  strKitColour2?: string;
  strKitColour3?: string;
  strGender?: string;
  strFanart1?: string;
}

export interface TheSportsDBEvent {
  idEvent: string;
  strEvent: string;
  strEventAlternate?: string;
  strLeague: string;
  idLeague: string;
  strSport: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strHomeGoalDetails?: string;
  strAwayGoalDetails?: string;
  intHomeShots?: string;
  intAwayShots?: string;
  dateEvent: string;
  strTime?: string;
  strTimeLocal?: string;
  strStatus?: string;
  strVenue?: string;
  intRound?: string;
  strSeason?: string;
  strHomeFormation?: string;
  strAwayFormation?: string;
  intSpectators?: string;
  strReferee?: string;
  strVideo?: string;
  strThumb?: string;
  strBanner?: string;
  strTVStation?: string;
  strPostponed?: string;
}

export interface TheSportsDBPlayer {
  idPlayer: string;
  idTeam: string;
  strPlayer: string;
  strTeam: string;
  strNationality?: string;
  strSport: string;
  dateBorn?: string;
  strBirthLocation?: string;
  strNumber?: string;
  strPosition?: string;
  strHeight?: string;
  strWeight?: string;
  strThumb?: string;
  strCutout?: string;
  strBanner?: string;
  strDescriptionEN?: string;
  strGender?: string;
  strWage?: string;
  strSigning?: string;
  strContract?: string;
}

export interface TheSportsDBStanding {
  idStanding: string;
  idTeam: string;
  strTeam: string;
  strBadge?: string;
  idLeague: string;
  strLeague: string;
  strSeason: string;
  strForm?: string;
  intRank: string;
  intPlayed: string;
  intWin: string;
  intDraw: string;
  intLoss: string;
  intGoalsFor: string;
  intGoalsAgainst: string;
  intGoalDifference: string;
  intPoints: string;
}

// Responses enveloppées V1 (legacy)
export interface TheSportsDBLeagueResponseV1 {
  leagues: TheSportsDBLeague[] | null;
}

export interface TheSportsDBTeamsResponseV1 {
  teams: TheSportsDBTeam[] | null;
}

export interface TheSportsDBEventsResponseV1 {
  events: TheSportsDBEvent[] | null;
}

// Responses enveloppées V2 (current)
export interface TheSportsDBLeagueResponse {
  lookup: TheSportsDBLeague[] | null;
}

export interface TheSportsDBTeamsResponse {
  list: TheSportsDBTeam[] | null;
}

export interface TheSportsDBEventsResponse {
  schedule: TheSportsDBEvent[] | null;
}

export interface TheSportsDBEventResponse {
  events: TheSportsDBEvent[] | null;
}

export interface TheSportsDBPlayersResponse {
  player: TheSportsDBPlayer[] | null;
}

export interface TheSportsDBStandingsResponse {
  table: TheSportsDBStanding[] | null;
}
