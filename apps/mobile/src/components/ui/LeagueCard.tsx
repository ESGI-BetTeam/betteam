import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, borderWidth } from '@/theme';
import { Avatar } from './Avatar';
import { Tag } from './Tag';

// Colors for leagues that don't have a custom color yet
const LEAGUE_COLORS = [
  colors.accent,
  colors.secondary,
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#06B6D4',
] as const;

interface LeagueCardProps {
  name: string;
  membersCount: number;
  rank?: number;
  totalMembers?: number;
  level?: number;
  colorIndex?: number;
  onPress?: () => void;
}

export function LeagueCard({
  name,
  membersCount,
  rank,
  totalMembers,
  level,
  colorIndex = 0,
  onPress,
}: LeagueCardProps) {
  const accentColor = LEAGUE_COLORS[colorIndex % LEAGUE_COLORS.length];
  const progress = rank && totalMembers ? (totalMembers - rank + 1) / totalMembers : 0;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: `${accentColor}30` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <Avatar name={name} size={36} style={{ backgroundColor: accentColor }} />
        <View style={styles.nameBlock}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.subtitle}>{membersCount} Participants</Text>
        </View>
        {level != null && (
          <Tag
            title={`Niv. ${level}`}
            variant="primary"
            style={{ backgroundColor: accentColor }}
          />
        )}
      </View>

      {rank != null && totalMembers != null && (
        <View style={styles.rankSection}>
          <View style={styles.rankRow}>
            <Text style={styles.rankLabel}>Classement</Text>
            <Text style={styles.rankValue}>{rank} / {totalMembers}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.max(progress * 100, 5)}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    padding: spacing.md,
    marginRight: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  rankSection: {
    gap: spacing.xs,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  rankValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.backgroundInput,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: radius.full,
  },
});
