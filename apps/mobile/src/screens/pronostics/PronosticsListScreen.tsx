import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Receipt21 } from 'iconsax-react-nativejs';
import { PronosticsStackParamList } from '@/types/navigation';
import { leagueService } from '@/services/league.service';
import { matchService, GroupBet } from '@/services/match.service';
import { MatchCard } from '@/components/ui/MatchCard';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

type Nav = NativeStackNavigationProp<PronosticsStackParamList, 'PronosticsHome'>;

// A pending group bet, enriched with the name of the league it belongs to.
interface PendingBet extends GroupBet {
  leagueName: string;
}

export function PronosticsListScreen() {
  const navigation = useNavigation<Nav>();

  const [bets, setBets] = useState<PendingBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: leagues } = await leagueService.getMyLeagues();

      // Gather the open group bets of every league the user belongs to.
      const perLeague = await Promise.all(
        leagues.map(async (league) => {
          try {
            const res = await matchService.getActiveChallenges(league.id);
            return (res.data ?? [])
              .filter((b) => b.status === 'open')
              .map((b) => ({ ...b, leagueName: league.name }));
          } catch {
            return [] as PendingBet[];
          }
        }),
      );

      const flattened = perLeague.flat().sort(
        (a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
      );
      setBets(flattened);
    } catch {
      // Keep the UI usable on failure
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch whenever the tab regains focus so a freshly-created bet shows up.
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  function getStatus(bet: PendingBet): 'open' | 'soon' {
    const start = bet.match ? new Date(bet.match.startTime).getTime() : new Date(bet.closesAt).getTime();
    const tenMinBefore = start - 10 * 60 * 1000;
    return Date.now() >= tenMinBefore ? 'soon' : 'open';
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <Text style={[typo.h1, styles.title]}>Pronostics</Text>

      {bets.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Receipt21 size={28} color={colors.accent} variant="Bulk" />
          </View>
          <Text style={[typo.h4, styles.emptyTitle]}>Pas de pari en attente</Text>
          <Text style={[typo.pSecondary, styles.emptyText]}>
            Vous n'avez aucun pronostic à valider pour le moment. Revenez quand une de vos ligues
            lance un pari.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[typo.smallSecondary, styles.subtitle]}>
            {bets.length} pari{bets.length > 1 ? 's' : ''} en attente
          </Text>
          {bets.map((bet) => (
            <MatchCard
              key={bet.id}
              homeTeam={{
                name: bet.match?.homeTeam.name ?? 'Équipe 1',
                logoUrl: bet.match?.homeTeam.logoUrl,
              }}
              awayTeam={{
                name: bet.match?.awayTeam.name ?? 'Équipe 2',
                logoUrl: bet.match?.awayTeam.logoUrl,
              }}
              date={bet.match?.startTime ?? bet.closesAt}
              status={getStatus(bet)}
              onPress={() =>
                navigation.navigate('PronosticDetail', { bet, leagueName: bet.leagueName })
              }
            />
          ))}
        </>
      )}
    </ScrollView>
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },

  // Empty state
  emptyCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    marginBottom: 0,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
