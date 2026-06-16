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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Add, People } from 'iconsax-react-nativejs';
import { useFocusEffect } from '@react-navigation/native';
import { LeaguesStackParamList } from '@/types/navigation';
import { resolveMediaUrl } from '@/services/api';
import { leagueService, League } from '@/services/league.service';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { LeagueListItem } from '@/components/ui/LeagueListItem';
import { DiscoverLeagueItem } from '@/components/ui/DiscoverLeagueItem';
import { colors, spacing, radius } from '@/theme';

interface DiscoverLeague {
  id: string;
  name: string;
  subtitle?: string;
  isPrivate: boolean;
}

type Nav = NativeStackNavigationProp<LeaguesStackParamList, 'LeaguesHome'>;

export function LeaguesScreen() {
  const navigation = useNavigation<Nav>();
  const [leagues, setLeagues] = useState<League[]>([]);
  // No discovery endpoint yet — stays empty until real data is available
  const [discoverLeagues] = useState<DiscoverLeague[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeagues = useCallback(async () => {
    try {
      const res = await leagueService.getMyLeagues();
      setLeagues(res.data ?? []);
    } catch {
      // Silently fail — keep the UI usable
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch when the screen regains focus (e.g. after creating a league)
  useFocusEffect(
    useCallback(() => {
      fetchLeagues();
    }, [fetchLeagues]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeagues();
  }, [fetchLeagues]);

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* CTA — Créer / Rejoindre */}
      <View style={styles.ctaRow}>
        <Button
          title="Créer"
          variant="primary"
          onPress={() => navigation.navigate('CreateLeague')}
          icon={<Add size={18} color={colors.white} variant="Outline" />}
          style={styles.ctaButton}
        />
        <Button
          title="Rejoindre"
          variant="outline"
          onPress={() => {}}
          icon={<People size={18} color={colors.textPrimary} variant="Outline" />}
          style={styles.ctaButton}
        />
      </View>

      {/* Mes Ligues */}
      <View style={styles.section}>
        <SectionHeader
          title="Mes Ligues"
          actionLabel={leagues.length > 0 ? 'Voir tout' : undefined}
          onAction={() => {}}
        />

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : leagues.length > 0 ? (
          <View style={styles.list}>
            {leagues.map((league, index) => (
              <LeagueListItem
                key={league.id}
                name={league.name}
                subtitle={league.description ?? undefined}
                membersCount={league._count?.members ?? 0}
                logoUrl={resolveMediaUrl(league.logoUrl)}
                colorIndex={index}
                onPress={() => {}}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune ligue rejointe actuellement.</Text>
          </View>
        )}
      </View>

      {/* À Découvrir */}
      <View style={styles.section}>
        <SectionHeader title={'À Découvrir'} />
        {discoverLeagues.length > 0 ? (
          <View style={styles.list}>
            {discoverLeagues.map((league, index) => (
              <DiscoverLeagueItem
                key={league.id}
                name={league.name}
                subtitle={league.subtitle}
                isPrivate={league.isPrivate}
                colorIndex={index}
                onJoin={() => {}}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune ligue à découvrir pour le moment.</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
    paddingBottom: spacing.xl,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ctaButton: {
    flex: 1,
  },
  section: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.xl,
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
});
