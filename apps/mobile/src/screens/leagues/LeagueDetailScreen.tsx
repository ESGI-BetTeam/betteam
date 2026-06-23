import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AxiosError } from 'axios';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft2, Add, Flash, Coin } from 'iconsax-react-nativejs';
import { LeaguesStackParamList } from '@/types/navigation';
import { useAuthStore } from '@/stores/authStore';
import { leagueService, League, LeaderboardEntry } from '@/services/league.service';
import { matchService, GroupBet } from '@/services/match.service';
import { frenchCompetitionName } from '@/services/competition.service';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ShareLeagueSheet } from '@/components/ui/ShareLeagueSheet';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

type Nav = NativeStackNavigationProp<LeaguesStackParamList, 'LeagueDetail'>;
type Rt = RouteProp<LeaguesStackParamList, 'LeagueDetail'>;

type Period = 'season' | 'month';

// Per-rank accent used by the podium badges (1st gold, 2nd silver, 3rd bronze)
const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'] as const;

// Mirror of the API's recharge ceiling; below it the member can top up.
const RECHARGE_CAP = 1000;

export function LeagueDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { leagueId, leagueName } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [league, setLeague] = useState<League | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeBets, setActiveBets] = useState<GroupBet[]>([]);
  const [competitionName, setCompetitionName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('season');
  const [shareVisible, setShareVisible] = useState(false);
  const [recharging, setRecharging] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [leagueRes, leaderboardRes, challengesRes, competition] = await Promise.all([
        leagueService.getLeague(leagueId),
        leagueService.getLeaderboard(leagueId),
        // Non-blocking: a missing/failed challenges endpoint just means "no bet"
        matchService.getActiveChallenges(leagueId).catch(() => ({ data: [] as GroupBet[] })),
        leagueService.getLeagueCompetition(leagueId).catch(() => null),
      ]);
      setLeague(leagueRes.league);
      setEntries(leaderboardRes.data);
      setActiveBets(challengesRes.data ?? []);
      setCompetitionName(competition ? frenchCompetitionName(competition.name) : null);
    } catch {
      // Keep the UI usable on failure
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleRecharge = useCallback(async () => {
    setRecharging(true);
    try {
      await leagueService.recharge(leagueId);
      await fetchData();
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      Alert.alert(
        'Recharge impossible',
        axiosError.response?.data?.error ?? 'Une erreur est survenue. Réessayez.',
      );
    } finally {
      setRecharging(false);
    }
  }, [leagueId, fetchData]);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const displayName = league?.name ?? leagueName ?? 'Ligue';

  // The recharge button only makes sense for the current member when low on points.
  const currentEntry = entries.find((e) => e.userId === currentUserId);
  const canRecharge = currentEntry != null && currentEntry.points < RECHARGE_CAP;

  return (
    <>
      <ScrollView
        style={styles.wrapper}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={styles.backButton}
          >
            <ArrowLeft2 size={24} color={colors.textPrimary} variant="Outline" />
          </TouchableOpacity>
          <Text style={[typo.h1, styles.title]} numberOfLines={1}>
            {displayName}
          </Text>
          <TouchableOpacity
            style={[styles.inviteButton, !league && styles.inviteButtonDisabled]}
            onPress={() => setShareVisible(true)}
            disabled={!league}
            activeOpacity={0.8}
          >
            <Add size={22} color={colors.white} variant="Outline" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucun membre dans le classement pour le moment.</Text>
          </View>
        ) : (
          <>
            <Podium entries={podium} currentUserId={currentUserId} />

            {rest.length > 0 && (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.thRank, typo.smallSecondary]}>#</Text>
                  <Text style={[styles.thName, typo.smallSecondary]}>JOUEURS</Text>
                  <Text style={[styles.thPts, typo.smallSecondary]}>PTS</Text>
                  <Text style={[styles.thDelta, typo.smallSecondary]}>Δ</Text>
                </View>
                {rest.map((entry) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    isCurrentUser={entry.userId === currentUserId}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Recharge — proposé au membre quand son solde est bas */}
        {canRecharge && (
          <TouchableOpacity
            style={styles.rechargeButton}
            onPress={handleRecharge}
            disabled={recharging}
            activeOpacity={0.8}
          >
            {recharging ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Coin size={18} color={colors.accent} variant="Bulk" />
            )}
            <Text style={[typo.pBold, styles.rechargeText]}>
              Recharger mes points ({currentEntry?.points} pts)
            </Text>
          </TouchableOpacity>
        )}

        {/* Suggérer un pari — affiché tant qu'aucun pari n'est en cours */}
        {!isLoading && activeBets.length === 0 && (
          <View style={styles.suggestCard}>
            <View style={styles.suggestIcon}>
              <Flash size={22} color={colors.accent} variant="Bulk" />
            </View>
            <Text style={[typo.h4, styles.suggestTitle]}>Aucun pari en cours</Text>
            <Text style={[typo.pSecondary, styles.suggestText]}>
              {competitionName
                ? `Lancez le premier pari de la ligue sur ${competitionName}.`
                : 'Lancez le premier pari de votre ligue.'}
            </Text>
            <Button
              title="Suggérer un pari"
              variant="primary"
              onPress={() => {}}
              style={styles.suggestCta}
            />
          </View>
        )}
      </ScrollView>

      {/* Période : barre fixe en bas */}
      <View style={styles.toggleBar}>
        <View style={styles.toggle}>
          <ToggleOption
            label="Saison"
            active={period === 'season'}
            onPress={() => setPeriod('season')}
          />
          <ToggleOption
            label="Ce mois"
            active={period === 'month'}
            onPress={() => setPeriod('month')}
          />
        </View>
      </View>

      {league && (
        <ShareLeagueSheet
          visible={shareVisible}
          onClose={() => setShareVisible(false)}
          leagueName={league.name}
          inviteCode={league.inviteCode}
        />
      )}
    </>
  );
}

// ============================================================
// Podium — top 3 displayed as [2nd, 1st, 3rd]
// ============================================================
function Podium({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}) {
  // Reorder so the winner sits in the middle and stands taller
  const ordered = [entries[1], entries[0], entries[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <View style={styles.podium}>
      {ordered.map((entry) => {
        const isWinner = entry.rank === 1;
        const isCurrentUser = entry.userId === currentUserId;
        const badgeColor = RANK_COLORS[entry.rank - 1] ?? colors.textSecondary;
        const avatarSize = isWinner ? 88 : 68;

        return (
          <View
            key={entry.userId}
            style={[styles.podiumItem, isWinner ? styles.podiumWinner : styles.podiumSide]}
          >
            <View>
              <Avatar
                uri={entry.avatar}
                name={entry.username}
                size={avatarSize}
                style={{
                  borderWidth: borderWidth.md,
                  borderColor: isCurrentUser ? colors.accent : badgeColor,
                }}
              />
              <View style={[styles.rankBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.rankBadgeText}>{entry.rank}</Text>
              </View>
            </View>
            <Text
              style={[typo.pBold, styles.podiumName, isCurrentUser && styles.currentUserText]}
              numberOfLines={1}
            >
              {isCurrentUser ? 'Vous' : entry.username}
              {entry.hasRecharged ? ' 💰' : ''}
            </Text>
            <Text style={[typo.smallSecondary, isCurrentUser && styles.currentUserText]}>
              {entry.points} pts
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ============================================================
// Leaderboard table row (ranks 4+)
// ============================================================
function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <View style={[styles.row, isCurrentUser && styles.rowCurrent]}>
      <Text style={[styles.tdRank, typo.p, isCurrentUser && styles.currentUserText]}>
        {entry.rank}
      </Text>
      <Text
        style={[styles.tdName, typo.p, isCurrentUser && styles.currentUserText]}
        numberOfLines={1}
      >
        {isCurrentUser ? 'Vous' : entry.username}
        {entry.hasRecharged ? ' 💰' : ''}
      </Text>
      <Text style={[styles.tdPts, typo.pBold, isCurrentUser && styles.currentUserText]}>
        {entry.points}
      </Text>
      <Text style={[styles.tdDelta, typo.smallSecondary]}>–</Text>
    </View>
  );
}

function ToggleOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggleOption, active && styles.toggleOptionActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[typo.pBold, styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  backButton: {
    marginLeft: -spacing.xs,
  },
  title: {
    flex: 1,
    marginBottom: 0,
    fontSize: 26,
    lineHeight: 28,
    // Teko renders caps high in its line box; lower the title slightly so it
    // sits level with the back arrow.
    transform: [{ translateY: 5 }],
  },
  inviteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  podiumItem: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  podiumWinner: {
    marginBottom: spacing.lg,
  },
  podiumSide: {
    marginBottom: 0,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  rankBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Inter-Regular',
  },
  podiumName: {
    marginTop: spacing.xs,
    maxWidth: 110,
    textAlign: 'center',
  },
  currentUserText: {
    color: colors.accent,
  },

  // Recharge
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    height: 46,
    borderRadius: radius.full,
    borderWidth: borderWidth.md,
    borderColor: colors.borderActive,
    backgroundColor: colors.backgroundGlass,
  },
  rechargeText: {
    color: colors.accent,
    fontSize: 14,
  },

  // Suggérer un pari
  suggestCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  suggestIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  suggestTitle: {
    marginBottom: 0,
  },
  suggestText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  suggestCta: {
    height: 46,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
  },

  // Table
  table: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundInput,
  },
  thRank: { width: 32 },
  thName: { flex: 1 },
  thPts: { width: 56, textAlign: 'right' },
  thDelta: { width: 32, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: borderWidth.xs,
    borderTopColor: colors.border,
  },
  rowCurrent: {
    backgroundColor: colors.backgroundGlass,
  },
  tdRank: { width: 32 },
  tdName: { flex: 1 },
  tdPts: { width: 56, textAlign: 'right' },
  tdDelta: { width: 32, textAlign: 'center' },

  // Toggle — pinned at the bottom of the page
  toggleBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  toggle: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
  },
  toggleOption: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  toggleOptionActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
});
