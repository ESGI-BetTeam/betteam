import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft2 } from 'iconsax-react-nativejs';
import { LeaguesStackParamList } from '@/types/navigation';
import { useAuthStore } from '@/stores/authStore';
import { leagueService, League, LeaderboardEntry } from '@/services/league.service';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ShareLeagueSheet } from '@/components/ui/ShareLeagueSheet';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

type Nav = NativeStackNavigationProp<LeaguesStackParamList, 'LeagueDetail'>;
type Rt = RouteProp<LeaguesStackParamList, 'LeagueDetail'>;

type Period = 'season' | 'month';

// Per-rank accent used by the podium badges (1st gold, 2nd silver, 3rd bronze)
const RANK_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32'] as const;

export function LeagueDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { leagueId, leagueName } = route.params;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [league, setLeague] = useState<League | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('season');
  const [shareVisible, setShareVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [leagueRes, leaderboardRes] = await Promise.all([
        leagueService.getLeague(leagueId),
        leagueService.getLeaderboard(leagueId),
      ]);
      setLeague(leagueRes.league);
      setEntries(leaderboardRes.data);
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

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const displayName = league?.name ?? leagueName ?? 'Ligue';

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
          <Text style={[typo.h1, styles.title]} numberOfLines={2}>
            Classement - {displayName}
          </Text>
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

            {/* Période : UI uniquement (les deux affichent le cumul pour l'instant) */}
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
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Inviter des collègues"
          variant="primary"
          onPress={() => setShareVisible(true)}
          disabled={!league}
          style={styles.cta}
        />
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

  // Toggle
  toggle: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
  },
  toggleOption: {
    flex: 1,
    height: 40,
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

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: borderWidth.sm,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cta: {
    height: 54,
    borderRadius: radius.full,
  },
});
