import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';
import { Avatar } from './Avatar';
import { LogoIcon } from './LogoIcon';

interface HeaderProps {
  username?: string;
  avatarUri?: string | null;
  points?: number;
}

export function Header({ username, avatarUri, points }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <LogoIcon width={50} height={28} />
        <View style={styles.logoTextWrapper}>
          <Text style={styles.logoText}>BetTeam</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* {points !== null && (
          <View style={styles.pointsBlock}>
            <Text style={styles.pointsLabel}>Points</Text>
            <Text style={styles.pointsValue}>{points}</Text>
          </View>
        )} */}
        <Avatar uri={avatarUri} name={username} size={36} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoTextWrapper: {
    height: 28,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoText: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: 'Teko-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pointsBlock: {
    alignItems: 'flex-end',
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  pointsValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
  },
});
