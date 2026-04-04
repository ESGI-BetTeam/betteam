import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typo } from '@/theme';
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
          <Text style={[typo.h3, styles.logoText]}>BetTeam</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* {points !== null && (
          <View style={styles.pointsBlock}>
            <Text style={typo.smallSecondary}>Points</Text>
            <Text style={typo.pBold}>{points}</Text>
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
    fontSize: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 0,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pointsBlock: {
    alignItems: 'flex-end',
  },
});
