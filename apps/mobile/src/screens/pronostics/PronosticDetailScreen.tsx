import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AxiosError } from 'axios';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft2, Calendar, Coin, Cup, Monitor, TickCircle } from 'iconsax-react-nativejs';
import { PronosticsStackParamList } from '@/types/navigation';
import { matchService, WinnerValue } from '@/services/match.service';
import { leagueService, League } from '@/services/league.service';
import { parsePrediction } from '@/utils/prediction';
import { isMatchStarted } from '@/utils/match';
import { Avatar } from '@/components/ui/Avatar';
import { LeagueSelectSheet } from '@/components/ui/LeagueSelectSheet';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { InputNumber } from '@/components/ui/InputNumber';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

// Points staked per pronostic. The design has no stake selector yet, so we
// wager a fixed amount until one is added.
const DEFAULT_STAKE = 100;

type Nav = NativeStackNavigationProp<PronosticsStackParamList, 'PronosticDetail'>;
type Rt = RouteProp<PronosticsStackParamList, 'PronosticDetail'>;

type Outcome = 'home' | 'draw' | 'away';

// Points multiplier for guessing the exact score. Not yet exposed by the API,
// so kept as a display constant until the backend provides it.
const SCORE_MULTIPLIER = 5.0;

// Deterministic fallback odds derived from the match id, used when the match
// has no synced odds yet (mirrors the Home screen's generator).
function generateOdds(matchId: string) {
  let hash = 0;
  for (let i = 0; i < matchId.length; i++) {
    hash = ((hash << 5) - hash + matchId.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(hash);
  return {
    home: 1.2 + (seed % 300) / 100,
    draw: 2.5 + ((seed >> 8) % 250) / 100,
    away: 1.5 + ((seed >> 16) % 400) / 100,
  };
}

function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Ce soir, ${time}`;
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${time}`;
}

// Votes close at kickoff (mirrors the API's M-0 rule).
function matchClosesAt(startTime: string): string {
  return new Date(startTime).toISOString();
}

// Human-friendly time remaining until the vote closes, e.g. "3h 15min".
function formatCountdown(closesAt: string): string | null {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (isNaN(diff) || diff <= 0) return null;
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}j ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

// Label shown once the user has already placed their bet.
function statusLabel(status: string): string {
  switch (status) {
    case 'won':
      return 'Pari gagné';
    case 'lost':
      return 'Pari perdu';
    case 'void':
      return 'Pari annulé';
    default:
      return 'Pronostic validé';
  }
}

// Accent of the read-only confirmation banner per bet status.
function statusStyle(status: string) {
  switch (status) {
    case 'won':
      return { borderColor: colors.accent, backgroundColor: colors.backgroundGlass };
    case 'lost':
      return { borderColor: colors.error, backgroundColor: colors.errorLight };
    case 'void':
      return { borderColor: colors.border, backgroundColor: colors.backgroundCard };
    default:
      return { borderColor: colors.borderActive, backgroundColor: colors.backgroundGlass };
  }
}

export function PronosticDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { bet, match: matchParam, leagueName } = route.params;
  // A detail can open from an existing group bet or from a raw upcoming match.
  const match = bet?.match ?? matchParam;

  // If the user already played this group bet, the screen is pre-filled with
  // their pick and stays editable until kickoff; once the match starts every
  // bet is frozen.
  const existingBet = bet?.userBet ?? null;
  const matchStarted = isMatchStarted(match?.startTime);
  // A pending bet can still be changed before kickoff; a settled one cannot.
  const canEdit = !matchStarted && (existingBet == null || existingBet.status === 'pending');
  const readonly = !canEdit;
  const prefill = existingBet ? parsePrediction(existingBet.predictionValue) : null;

  const [outcome, setOutcome] = useState<Outcome | null>(prefill?.value ?? null);
  const [homeScore, setHomeScore] = useState(prefill?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(prefill?.awayScore ?? 0);
  const [stake, setStake] = useState(existingBet?.amount ?? DEFAULT_STAKE);
  const [submitting, setSubmitting] = useState(false);
  // Non-null while the league chooser sheet is open (raw match, several leagues).
  const [leagueChoices, setLeagueChoices] = useState<League[] | null>(null);
  // The user's leagues, loaded to resolve their balance in the target league.
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [recharging, setRecharging] = useState(false);

  const loadLeagues = () =>
    leagueService
      .getMyLeagues()
      .then((res) => setMyLeagues(res.data))
      .catch(() => setMyLeagues([]));

  useEffect(() => {
    loadLeagues();
  }, []);

  // Resolve which league the bet targets: the group bet's league, or the user's
  // single league for a raw match. Balance is unknown until a league is picked
  // when the user belongs to several leagues.
  const targetLeagueId = bet?.leagueId ?? (myLeagues.length === 1 ? myLeagues[0].id : null);
  const targetLeague = targetLeagueId
    ? myLeagues.find((l) => l.id === targetLeagueId) ?? null
    : null;
  const balance = targetLeague?.myPoints ?? null;
  // Not enough points to cover the stake — offer a recharge before betting.
  const insufficient = balance != null && stake > balance;

  // The exact-score bonus only applies when the entered score implies the same
  // winner as the pick (the API rejects a contradictory winner/score).
  const impliedWinner: Outcome =
    homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
  const scoreBonusActive = outcome != null && impliedWinner === outcome;

  const reportError = (error: unknown) => {
    const axiosError = error as AxiosError<{ error: string }>;
    Alert.alert('Erreur', axiosError.response?.data?.error ?? 'Une erreur est survenue. Réessayez.');
  };

  // Places (or, when editing an existing bet, updates) the bet on a resolved
  // league + challenge.
  const placeBetOn = async (leagueId: string, challengeId: string) => {
    // Attach the exact-score bonus only when it agrees with the winner pick.
    const prediction = scoreBonusActive
      ? matchService.buildScorePrediction(outcome as WinnerValue, homeScore, awayScore)
      : matchService.buildWinnerPrediction(outcome as WinnerValue);
    const payload = { ...prediction, amount: stake };

    if (existingBet) {
      await matchService.updateBet(leagueId, challengeId, payload);
      Alert.alert('Pronostic modifié', 'Votre pronostic a bien été mis à jour.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    await matchService.placeBet(leagueId, challengeId, payload);
    Alert.alert('Pronostic validé', 'Votre pronostic a bien été enregistré.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  // Tops the member's points back up in the target league, then refreshes balance.
  const handleRecharge = async () => {
    if (!targetLeagueId) return;
    setRecharging(true);
    try {
      await leagueService.recharge(targetLeagueId);
      await loadLeagues();
    } catch (error) {
      reportError(error);
    } finally {
      setRecharging(false);
    }
  };

  // For a raw match: reuse an existing challenge in the league or open one, then bet.
  const submitWithLeague = async (league: League) => {
    if (!match) return;
    setSubmitting(true);
    try {
      const { data: challenges } = await matchService.getActiveChallenges(league.id);
      const existing = challenges.find((c) => c.matchId === match.id || c.match?.id === match.id);
      const challenge = existing ?? (await matchService.createChallenge(league.id, match.id));
      await placeBetOn(league.id, challenge.id);
    } catch (error) {
      reportError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async () => {
    if (!outcome) {
      Alert.alert('Pronostic incomplet', 'Choisissez le vainqueur du match.');
      return;
    }

    // Existing group bet: the league + challenge are already known.
    if (bet) {
      setSubmitting(true);
      try {
        await placeBetOn(bet.leagueId, bet.id);
      } catch (error) {
        reportError(error);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!match) return;

    // Raw match: pick the target league (auto when there's only one).
    setSubmitting(true);
    let leagues: League[] = [];
    try {
      leagues = (await leagueService.getMyLeagues()).data;
    } catch (error) {
      reportError(error);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);

    if (leagues.length === 0) {
      Alert.alert('Aucune ligue', 'Rejoignez ou créez une ligue pour pouvoir parier.');
      return;
    }
    if (leagues.length === 1) {
      await submitWithLeague(leagues[0]);
      return;
    }
    setLeagueChoices(leagues);
  };

  const homeTeam = match?.homeTeam ?? { name: 'Team 1', logoUrl: null };
  const awayTeam = match?.awayTeam ?? { name: 'Team 2', logoUrl: null };

  // Prefer synced odds, fall back to the deterministic generator.
  const synced = match?.odds;
  const odds =
    synced && synced.homeWinOdds != null && synced.drawOdds != null && synced.awayWinOdds != null
      ? { home: synced.homeWinOdds, draw: synced.drawOdds, away: synced.awayWinOdds }
      : generateOdds(match?.id ?? bet?.matchId ?? '');

  // Countdown comes from the group bet's deadline, or M-10 for a raw match.
  const closesAtSource = bet?.closesAt ?? (match ? matchClosesAt(match.startTime) : null);
  const countdown = closesAtSource ? formatCountdown(closesAtSource) : null;

  const outcomes: { key: Outcome; label: string; value: number }[] = [
    { key: 'home', label: homeTeam.name, value: odds.home },
    { key: 'draw', label: 'Nul', value: odds.draw },
    { key: 'away', label: awayTeam.name, value: odds.away },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + league name with flanking lines */}
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
            <ArrowLeft2 size={24} color={colors.textPrimary} variant="Outline" />
          </TouchableOpacity>
          <View style={styles.titleCenter}>
            <View style={styles.titleLine} />
            <Text style={[typo.h2, styles.title]} numberOfLines={1}>
              {leagueName ?? match?.competition?.name ?? 'Pronostic'}
            </Text>
            <View style={styles.titleLine} />
          </View>
          {/* Spacer to keep the title visually centered against the back button */}
          <View style={styles.backButton} />
        </View>

        {/* Date + venue */}
        <View style={styles.metaRow}>
          <Calendar size={14} color={colors.textSecondary} variant="Outline" />
          <Text style={typo.smallSecondary}>
            {formatMatchDate(match?.startTime ?? closesAtSource ?? new Date().toISOString())}
          </Text>
          {match?.venue ? (
            <>
              <View style={styles.metaDot} />
              <Text style={typo.smallSecondary}>{match.venue}</Text>
            </>
          ) : null}
        </View>

        {/* Main betting card */}
        <View style={styles.card}>
          {/* Teams */}
          <View style={styles.teamsRow}>
            <View style={styles.team}>
              <Avatar uri={homeTeam.logoUrl} name={homeTeam.name} size={56} />
              <Text style={[typo.small, styles.teamName]} numberOfLines={1}>
                {homeTeam.name}
              </Text>
            </View>

            <Text style={[typo.h3, styles.vs]}>VS</Text>

            <View style={styles.team}>
              <Avatar uri={awayTeam.logoUrl} name={awayTeam.name} size={56} />
              <Text style={[typo.small, styles.teamName]} numberOfLines={1}>
                {awayTeam.name}
              </Text>
            </View>
          </View>

          {/* Score exact (bonus) */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Monitor size={20} color={colors.textPrimary} variant="Bulk" />
              <Text style={[typo.h4, styles.sectionTitleText]}>Score Exact</Text>
            </View>
            <Tag
              title={`x ${SCORE_MULTIPLIER.toFixed(1)} PTS`}
              variant="outline"
              style={scoreBonusActive ? undefined : styles.tagInactive}
              textStyle={scoreBonusActive ? styles.multiplierText : styles.multiplierTextInactive}
            />
          </View>

          <View style={styles.scoreRow}>
            <InputNumber
              value={prefill?.homeScore ?? 0}
              min={0}
              disabled={readonly}
              onChange={setHomeScore}
              containerStyle={styles.scoreStepper}
            />
            <InputNumber
              value={prefill?.awayScore ?? 0}
              min={0}
              disabled={readonly}
              onChange={setAwayScore}
              containerStyle={styles.scoreStepper}
            />
          </View>

          <Text style={[typo.smallSecondary, styles.scoreHint, scoreBonusActive && styles.scoreHintActive]}>
            {scoreBonusActive
              ? `Bonus actif : ${homeScore}–${awayScore}.`
              : 'Le score doit refléter le vainqueur choisi pour activer le bonus.'}
          </Text>

          {/* Vainqueur du match */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Cup size={20} color={colors.textPrimary} variant="Bulk" />
              <Text style={[typo.h4, styles.sectionTitleText]}>Vainqueur du match</Text>
            </View>
            <Text style={typo.smallSecondary}>Cotes indicatives</Text>
          </View>

          <View style={styles.oddsRow}>
            {outcomes.map((o) => {
              const selected = outcome === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.oddButton, selected && styles.oddButtonSelected]}
                  onPress={() => setOutcome(o.key)}
                  disabled={readonly}
                  activeOpacity={readonly ? 1 : 0.8}
                >
                  {selected && (
                    <View style={styles.checkBadge}>
                      <TickCircle size={20} color={colors.accent} variant="Bold" />
                    </View>
                  )}
                  <Text
                    style={[typo.smallSecondary, styles.oddLabel, selected && styles.oddLabelSelected]}
                    numberOfLines={1}
                  >
                    {o.label}
                  </Text>
                  <Text style={[typo.h3, styles.oddValue]}>{o.value.toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Mise */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}>
              <Coin size={20} color={colors.textPrimary} variant="Bulk" />
              <Text style={[typo.h4, styles.sectionTitleText]}>Mise</Text>
            </View>
            {balance != null ? (
              <Text style={typo.smallSecondary}>Solde : {balance} pts</Text>
            ) : (
              <Text style={typo.smallSecondary}>points</Text>
            )}
          </View>

          <InputNumber
            value={existingBet?.amount ?? DEFAULT_STAKE}
            min={1}
            step={10}
            disabled={readonly}
            onChange={setStake}
          />
        </View>

        {/* Frozen banner once the match started, otherwise a place/edit button */}
        {matchStarted ? (
          existingBet ? (
            <View style={[styles.alreadyBet, statusStyle(existingBet.status)]}>
              <TickCircle size={20} color={colors.accent} variant="Bold" />
              <Text style={[typo.pBold, styles.alreadyBetText]}>
                {statusLabel(existingBet.status)}
              </Text>
            </View>
          ) : (
            <View style={[styles.alreadyBet, statusStyle('void')]}>
              <Text style={[typo.pBold, styles.alreadyBetText]}>Match en cours · paris fermés</Text>
            </View>
          )
        ) : insufficient ? (
          <>
            <Text style={[typo.smallSecondary, styles.insufficientText]}>
              Solde insuffisant pour cette mise ({balance} pts).
            </Text>
            <Button
              title="Recharger mes points"
              variant="primary"
              size="large"
              loading={recharging}
              onPress={handleRecharge}
              style={styles.validateButton}
            />
          </>
        ) : (
          <Button
            title={existingBet ? 'Modifier mon pronostic' : 'Valider mon pronostic'}
            variant="primary"
            size="large"
            loading={submitting}
            disabled={!outcome}
            onPress={handleValidate}
            style={styles.validateButton}
          />
        )}

        {!readonly && countdown && (
          <Text style={[typo.smallSecondary, styles.closesText]}>
            Fermeture des votes dans {countdown}
          </Text>
        )}
      </ScrollView>

      <LeagueSelectSheet
        visible={leagueChoices != null}
        leagues={leagueChoices ?? []}
        onClose={() => setLeagueChoices(null)}
        onSelect={(league) => {
          setLeagueChoices(null);
          submitWithLeague(league);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Title
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 24,
    marginLeft: -spacing.xs,
  },
  titleCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  titleLine: {
    width: 32,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  title: {
    marginBottom: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.textSecondary,
  },

  // Card
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamName: {
    fontWeight: '600',
  },
  vs: {
    marginBottom: 0,
    marginHorizontal: spacing.md,
    color: colors.textPrimary,
  },

  // Section headers (Score exact / Vainqueur)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitleText: {
    marginBottom: 0,
  },
  multiplierText: {
    color: colors.accent,
    fontWeight: '700',
  },
  multiplierTextInactive: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  tagInactive: {
    opacity: 0.6,
  },
  scoreHint: {
    marginTop: spacing.sm,
    fontSize: 11,
  },
  scoreHintActive: {
    color: colors.accent,
  },

  // Score steppers
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  scoreStepper: {
    flex: 1,
  },

  // Odds
  oddsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  oddButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    backgroundColor: colors.backgroundInput,
  },
  oddButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.backgroundGlass,
  },
  checkBadge: {
    position: 'absolute',
    top: -10,
    right: -8,
    backgroundColor: colors.background,
    borderRadius: radius.full,
  },
  oddLabel: {
    marginBottom: spacing.xs,
  },
  oddLabelSelected: {
    color: colors.textPrimary,
  },
  oddValue: {
    marginBottom: 0,
  },

  // Validate
  validateButton: {
    marginTop: spacing.lg,
  },
  alreadyBet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    height: 54,
    borderRadius: radius.lg,
    borderWidth: borderWidth.md,
  },
  alreadyBetText: {
    color: colors.textPrimary,
  },
  closesText: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  insufficientText: {
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.error,
  },
});
