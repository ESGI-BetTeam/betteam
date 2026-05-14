import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing, typo } from '../../theme';

import { profileService } from '@/services/profile.service';
import { UserWithStats } from '@/types/stats';

import { Cup, DollarCircle, HuobiToken, Lovely, Receipt21 } from 'iconsax-react-nativejs';
import { Tag } from '@/components/ui/Tag';

export function ProfileScreen() {
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

      <Button
        title="Se déconnecter"
        variant="danger"
        onPress={logout}
        style={{ marginTop: spacing.xl }}
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
    marginTop: spacing.md,
  },
  tagContainer: {
    marginTop: spacing.md,
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
  }
});
