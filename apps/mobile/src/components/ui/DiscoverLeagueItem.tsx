import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock1, Global } from 'iconsax-react-nativejs';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';
import { Avatar } from './Avatar';
import { Button } from './Button';

const LEAGUE_COLORS = [
  colors.accent,
  colors.secondary,
  colors.leagueAmber,
  colors.leaguePink,
  colors.leaguePurple,
  colors.leagueCyan,
] as const;

interface DiscoverLeagueItemProps {
  name: string;
  subtitle?: string;
  isPrivate?: boolean;
  colorIndex?: number;
  onJoin?: () => void;
}

export function DiscoverLeagueItem({
  name,
  subtitle,
  isPrivate = false,
  colorIndex = 0,
  onJoin,
}: DiscoverLeagueItemProps) {
  const accentColor = LEAGUE_COLORS[colorIndex % LEAGUE_COLORS.length];

  return (
    <View style={styles.card}>
      <Avatar name={name} size={48} style={{ backgroundColor: accentColor }} />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[typo.pBold, styles.name]} numberOfLines={1}>
            {name}
          </Text>
          {isPrivate ? (
            <Lock1 size={16} color={colors.textSecondary} variant="Bulk" />
          ) : (
            <Global size={16} color={colors.accent} variant="Bulk" />
          )}
        </View>
        {!!subtitle && (
          <Text style={typo.smallSecondary} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <Button
        title="Rejoindre"
        variant="outline"
        onPress={onJoin ?? (() => {})}
        style={styles.joinButton}
        textStyle={styles.joinText}
      />
    </View>
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
    borderColor: colors.border,
    padding: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: 16,
    marginBottom: 0,
    flexShrink: 1,
  },
  joinButton: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  joinText: {
    fontSize: 13,
  },
});
