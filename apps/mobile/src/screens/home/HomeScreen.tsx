import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Add } from 'iconsax-react-nativejs';
import { useAuthStore } from '@/stores/authStore';
import { leagueService, League, LeaderboardEntry } from '@/services/league.service';
import { matchService, Match } from '@/services/match.service';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LeagueCard } from '@/components/ui/LeagueCard';
import { MatchCard } from '@/components/ui/MatchCard';
import { SportFilter, SportFilterItem } from '@/components/ui/SportFilter';
import { colors, spacing, radius } from '@/theme';
import { AppTabParamList } from '@/types/navigation';

type HomeNav = BottomTabNavigationProp<AppTabParamList, 'Home'>;

interface LeagueWithRank extends League {
  userRank?: number;
}

export function HomeScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<HomeNav>();

  const [leagues, setLeagues] = useState<LeagueWithRank[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [leaguesRes, matchesRes] = await Promise.all([
        leagueService.getMyLeagues(),
        matchService.getUpcoming(),
      ]);

      const leaguesData = leaguesRes.data ?? [];
      const upcomingMatches = (matchesRes.matches ?? []).filter(
        (m: Match) => m.status === 'upcoming',
      );

      // Fetch leaderboard for each league to get user rank
      const leaguesWithRank: LeagueWithRank[] = await Promise.all(
        leaguesData.map(async (league) => {
          try {
            const lb = await leagueService.getLeaderboard(league.id);
            const myEntry = lb.data?.find((e: LeaderboardEntry) => e.userId === user?.id);
            return { ...league, userRank: myEntry?.rank };
          } catch {
            return league;
          }
        }),
      );

      setLeagues(leaguesWithRank);
      setAllMatches(upcomingMatches);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Build sport filter items from all matches
  const sportItems: SportFilterItem[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of allMatches) {
      const sport = m.competition?.sport ?? 'other';
      counts[sport] = (counts[sport] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        key,
        label: key,
        count,
      }));
  }, [allMatches]);

  // Filter + sort by closest to now
  const displayedMatches = useMemo(() => {
    const filtered = selectedSport
      ? allMatches.filter((m) => m.competition?.sport === selectedSport)
      : allMatches;

    const sorted = [...filtered].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    return sorted.slice(0, 5);
  }, [allMatches, selectedSport]);

  // Generate fake odds from match id (deterministic per match)
  function generateOdds(matchId: string) {
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = ((hash << 5) - hash + matchId.charCodeAt(i)) | 0;
    }
    const seed = Math.abs(hash);
    const home = 1.2 + (seed % 300) / 100;
    const draw = 2.5 + ((seed >> 8) % 250) / 100;
    const away = 1.5 + ((seed >> 16) % 400) / 100;
    return { home, draw, away };
  }

  function getMatchStatus(match: Match): 'open' | 'soon' | 'live' | 'closed' {
    if (match.status === 'live') return 'live';
    if (match.status === 'finished' || match.status === 'cancelled') return 'closed';

    const now = new Date();
    const start = new Date(match.startTime);
    const tenMinBefore = new Date(start.getTime() - 10 * 60 * 1000);

    if (now >= tenMinBefore) return 'soon';
    return 'open';
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Sport filter - sticky under header */}
      {sportItems.length > 0 && (
        <SportFilter
          items={sportItems}
          selected={selectedSport}
          onSelect={setSelectedSport}
        />
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Mes Ligues */}
        <View style={styles.padded}>
          <SectionHeader
            title="Mes Ligues"
            actionLabel={leagues.length > 0 ? 'Voir tout' : undefined}
            onAction={() => navigation.navigate('Leagues')}
          />
        </View>

        {leagues.length > 0 ? (
          <FlatList
            data={leagues}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.leaguesList}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <LeagueCard
                name={item.name}
                membersCount={item._count?.members ?? 0}
                rank={item.userRank}
                totalMembers={item._count?.members}
                colorIndex={index}
                onPress={() => {}}
              />
            )}
          />
        ) : (
          <View style={styles.emptyLeagues}>
            <Text style={styles.emptyText}>
              Vous n'avez rejoint aucune ligue pour le moment.
            </Text>
            <TouchableOpacity
              style={styles.emptyCtaButton}
              onPress={() => navigation.navigate('Leagues')}
              activeOpacity={0.7}
            >
              <Add size={18} color={colors.white} variant="Outline" />
              <Text style={styles.emptyCtaText}>Rejoindre ou cr{'\u00e9'}er une ligue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Prochains Matchs */}
        <View style={[styles.padded, styles.matchesSection]}>
          <SectionHeader title="Prochains Matchs" />

          {displayedMatches.length > 0 ? (
            displayedMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                homeTeam={{
                  name: match.homeTeam.name,
                  logoUrl: match.homeTeam.logoUrl,
                }}
                awayTeam={{
                  name: match.awayTeam.name,
                  logoUrl: match.awayTeam.logoUrl,
                }}
                date={match.startTime}
                status={getMatchStatus(match)}
                variant={index === 0 ? 'featured' : 'compact'}
                odds={generateOdds(match.id)}
                onPress={() => {}}
              />
            ))
          ) : (
            <View style={styles.emptyMatches}>
              <Text style={styles.emptyText}>Aucun match {'\u00e0'} venir pour le moment.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  // Leagues
  leaguesList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyLeagues: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  emptyCtaText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontWeight: '600',
  },
  // Matches
  matchesSection: {
    marginTop: spacing.lg,
  },
  emptyMatches: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
});
