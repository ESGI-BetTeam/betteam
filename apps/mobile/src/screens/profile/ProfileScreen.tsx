import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing, typo } from '../../theme';

import { profileService } from '@/services/profile.service';
import { UserWithStats } from '@/types/stats';
import { ProfileStackParamList } from '@/types/navigation';

import { Cup, DollarCircle, HuobiToken, Lovely, Receipt21, ArrowRight2 } from 'iconsax-react-nativejs';
import { Tag } from '@/components/ui/Tag';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuthStore();
  const { getProfile } = profileService;

  const [profile, setProfile] = useState<UserWithStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (e) {
      console.error('ERROR 👉', e);
    } finally {
      setIsLoading(false);
    }
  }, [getProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={typo.h1}>Profil</Text>

      <View style={styles.header}>
        <Avatar
          uri={profile?.user.avatar || undefined}
          name={`${profile?.user.firstName || ''} ${profile?.user.lastName || ''}`}
          size={100}
        />
        <View style={styles.nameContainer}>
          <Text style={typo.h2}>
            {profile?.user.firstName} {profile?.user.lastName}
          </Text>
          <Text style={typo.pSecondary}>
            @{profile?.user.username}
          </Text>
        </View>
        <View style={styles.tagContainer}>
          <Tag
            title={profile?.stats.currentStreak.count.toString() || '0'}
            variant='outline'
            icon={
              <HuobiToken
                size={12}
                color={colors.accent}
                style={styles.profileTag}
              />}
            />
            <Tag
              title={profile?.stats.averageBetAmount.toString() || '0'}
              variant='outline'
              icon={
                <DollarCircle
                  size={12}
                  color={colors.accent}
                  style={styles.profileTag}
                />}
              />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          Icon={Receipt21}
          label="Paris"
          value={profile?.stats.totalBets.toString() || '0'}
        />
        <StatCard
          Icon={Cup}
          label="Succès"
          value={`${profile?.stats.winRate}%` || '0%'}
        />
        <StatCard
          Icon={Lovely}
          label="Sport favori"
          value={profile?.stats.favoriteSport || 'N/A'}
        />
      </View>

      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => navigation.navigate('MyBets')}
        activeOpacity={0.8}
      >
        <View style={styles.menuIcon}>
          <Receipt21 size="20" color={colors.accent} variant="Bulk" />
        </View>
        <Text style={[typo.pBold, styles.menuLabel]}>Mes paris</Text>
        <ArrowRight2 size={18} color={colors.textSecondary} variant="Outline" />
      </TouchableOpacity>

      <Button
        title="Se déconnecter"
        variant="danger"
        onPress={logout}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

function StatCard({ Icon, label, value }: { Icon: React.ComponentType<{size: string, color: string, variant: "Bulk"}> , label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Icon size="32" color={colors.accent} variant="Bulk" />
      <Text style={[typo.pBold, styles.statCardValue]}>{value}</Text>
      <Text style={typo.smallSecondary}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  nameContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  tagContainer: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm
  },
  profileTag: {
    marginTop: spacing.xs
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: colors.backgroundCard,
    padding: spacing.md,
    borderRadius: radius.lg,
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderActive,
  },
  statCardValue: {
    marginTop: spacing.sm
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
  },
});
