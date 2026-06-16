import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight2, People } from 'iconsax-react-nativejs';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';
import { Avatar } from './Avatar';

// Fallback colors for leagues without a custom color
const LEAGUE_COLORS = [
  colors.accent,
  colors.secondary,
  colors.leagueAmber,
  colors.leaguePink,
  colors.leaguePurple,
  colors.leagueCyan,
] as const;

interface LeagueListItemProps {
  name: string;
  subtitle?: string;
  statusLabel?: string;
  membersCount: number;
  logoUrl?: string | null;
  colorIndex?: number;
  onPress?: () => void;
}

export function LeagueListItem({
  name,
  subtitle,
  statusLabel = 'En cours',
  membersCount,
  logoUrl,
  colorIndex = 0,
  onPress,
}: LeagueListItemProps) {
  const accentColor = LEAGUE_COLORS[colorIndex % LEAGUE_COLORS.length];

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: `${accentColor}30` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Avatar
        uri={logoUrl}
        name={name}
        size={52}
        style={{ backgroundColor: accentColor, borderRadius: radius.md }}
      />

      <View style={styles.content}>
        <Text style={[typo.pBold, styles.name]} numberOfLines={1}>
          {name}
        </Text>
        {!!subtitle && (
          <Text style={typo.smallSecondary} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        <View style={styles.metaRow}>
          {!!statusLabel && (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          )}
          <View style={styles.membersBlock}>
            <People size={16} color={colors.textSecondary} variant="Bulk" />
            <Text style={typo.smallSecondary}>{membersCount}</Text>
          </View>
        </View>
      </View>

      <ArrowRight2 size={20} color={colors.accent} variant="Outline" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: 16,
    marginBottom: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  statusPill: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Regular',
  },
  membersBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
