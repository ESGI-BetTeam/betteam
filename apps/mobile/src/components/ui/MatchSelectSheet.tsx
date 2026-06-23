import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { AxiosError } from 'axios';
import { Calendar } from 'iconsax-react-nativejs';
import { matchService, AvailableMatch } from '@/services/match.service';
import { BottomSheet } from './BottomSheet';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

interface MatchSelectSheetProps {
  visible: boolean;
  leagueId: string;
  onClose: () => void;
  onSelect: (match: AvailableMatch) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${time}`;
}

// Lists the matches a league can open a challenge on; picking one suggests a bet.
export function MatchSelectSheet({ visible, leagueId, onClose, onSelect }: MatchSelectSheetProps) {
  const [matches, setMatches] = useState<AvailableMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    setError(null);
    matchService
      .getAvailableMatches(leagueId)
      .then((res) => {
        if (active) setMatches(res.data);
      })
      .catch((e) => {
        if (!active) return;
        const axiosError = e as AxiosError<{ error: string }>;
        setError(axiosError.response?.data?.error ?? 'Impossible de charger les matchs.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, leagueId]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[typo.h3, styles.title]}>Suggérer un pari</Text>
      <Text style={[typo.pSecondary, styles.subtitle]}>Choisissez un match à proposer.</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[typo.pSecondary, styles.emptyText]}>{error}</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={[typo.pSecondary, styles.emptyText]}>
            Aucun match disponible pour cette ligue pour le moment.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {matches.map((m) => {
            const taken = m.hasChallenge;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.row, taken && styles.rowDisabled]}
                onPress={() => !taken && onSelect(m)}
                disabled={taken}
                activeOpacity={0.8}
              >
                <View style={styles.rowText}>
                  <Text style={typo.pBold} numberOfLines={1}>
                    {m.homeTeam.name} <Text style={typo.smallSecondary}>vs</Text> {m.awayTeam.name}
                  </Text>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color={colors.textSecondary} variant="Outline" />
                    <Text style={typo.smallSecondary}>{formatDate(m.startTime)}</Text>
                  </View>
                </View>
                {taken && <Text style={[typo.smallSecondary, styles.taken]}>Déjà proposé</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  center: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidth.xs,
    borderBottomColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taken: {
    color: colors.textMuted,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
});
