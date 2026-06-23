import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft2, Receipt21 } from 'iconsax-react-nativejs';
import { ProfileStackParamList } from '@/types/navigation';
import { betService, Bet, BetStatus } from '@/services/bet.service';
import { formatPick } from '@/utils/prediction';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MyBets'>;

const STATUS_META: Record<BetStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En cours', color: colors.accentWarning, bg: colors.backgroundInput },
  won: { label: 'Gagné', color: colors.accent, bg: colors.backgroundGlass },
  lost: { label: 'Perdu', color: colors.error, bg: colors.errorLight },
  void: { label: 'Annulé', color: colors.textSecondary, bg: colors.backgroundCard },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MyBetsScreen() {
  const navigation = useNavigation<Nav>();
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await betService.getMyBets();
      setBets(data);
    } catch {
      // Keep the UI usable on failure
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      <View style={styles.titleRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
          <ArrowLeft2 size={24} color={colors.textPrimary} variant="Outline" />
        </TouchableOpacity>
        <Text style={[typo.h1, styles.title]}>Mes paris</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : bets.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Receipt21 size={28} color={colors.accent} variant="Bulk" />
          </View>
          <Text style={[typo.h4, styles.emptyTitle]}>Aucun pari</Text>
          <Text style={[typo.pSecondary, styles.emptyText]}>
            Vos pronostics validés apparaîtront ici.
          </Text>
        </View>
      ) : (
        bets.map((bet) => <BetRow key={bet.id} bet={bet} />)
      )}
    </ScrollView>
  );
}

function BetRow({ bet }: { bet: Bet }) {
  const status = STATUS_META[bet.status];
  const home = bet.match?.homeTeam ?? 'Équipe 1';
  const away = bet.match?.awayTeam ?? 'Équipe 2';
  const settled = bet.status === 'won' || bet.status === 'lost';
  const finalScore =
    bet.match && bet.match.homeScore != null && bet.match.awayScore != null
      ? `${bet.match.homeScore}–${bet.match.awayScore}`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[typo.pBold, styles.match]} numberOfLines={1}>
          {home} <Text style={typo.smallSecondary}>vs</Text> {away}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={[typo.smallSecondary, styles.pick]}>
        {formatPick(bet.predictionValue, home, away)}
        {finalScore ? `  •  Résultat ${finalScore}` : ''}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={typo.smallSecondary}>{formatDate(bet.createdAt)}</Text>
        <Text style={[typo.small, styles.amount]}>
          Mise {bet.amount} pts
          {settled && bet.actualWin != null
            ? bet.status === 'won'
              ? `  ·  +${bet.actualWin} pts`
              : '  ·  −' + bet.amount + ' pts'
            : ''}
        </Text>
      </View>
    </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    marginLeft: -spacing.xs,
  },
  title: {
    marginBottom: 0,
    transform: [{ translateY: 4 }],
  },
  center: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
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
  emptyTitle: { marginBottom: 0 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  // Bet card
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  match: {
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter-Regular',
  },
  pick: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: borderWidth.xs,
    borderTopColor: colors.border,
  },
  amount: {
    color: colors.textSecondary,
  },
});
