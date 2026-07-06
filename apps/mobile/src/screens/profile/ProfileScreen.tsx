import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { AxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing, typo } from '../../theme';

import { profileService } from '@/services/profile.service';
import { leagueService, League } from '@/services/league.service';
import { UserWithStats } from '@/types/stats';
import { ProfileStackParamList } from '@/types/navigation';

import { Cup, DollarCircle, HuobiToken, Lovely, Receipt21, ArrowRight2, Coin } from 'iconsax-react-nativejs';
import { Tag } from '@/components/ui/Tag';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

// Point ceiling a recharge tops members back up to (mirror of the API cap).
const RECHARGE_CAP = 1000;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuthStore();
  const { getProfile } = profileService;

  const [profile, setProfile] = useState<UserWithStats | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [rechargingId, setRechargingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, leaguesRes] = await Promise.all([
        getProfile(),
        leagueService.getMyLeagues().catch(() => ({ data: [] as League[] })),
      ]);
      setProfile(data);
      setLeagues(leaguesRes.data);
    } catch (e) {
      console.error('ERROR 👉', e);
    } finally {
      setIsLoading(false);
    }
  }, [getProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecharge = useCallback(
    async (leagueId: string) => {
      setRechargingId(leagueId);
      try {
        await leagueService.recharge(leagueId);
        await fetchData();
      } catch (error) {
        const axiosError = error as AxiosError<{ error: string }>;
        Alert.alert(
          'Recharge impossible',
          axiosError.response?.data?.error ?? 'Une erreur est survenue. Réessayez.',
        );
      } finally {
        setRechargingId(null);
      }
    },
    [fetchData],
  );

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

      <TouchableOpacity
        style={[styles.menuRow, { marginTop: spacing.md }]}
        onPress={async () => {
          const Notifications = await import('expo-notifications');
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Test de Notification",
              body: "Les notifications locales fonctionnent ! 🎉",
              sound: true,
            },
            trigger: null, // Send immediately
          });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.menuIcon}>
          <Cup size="20" color={colors.accent} variant="Bulk" />
        </View>
        <Text style={[typo.pBold, styles.menuLabel]}>Tester la Notification</Text>
      </TouchableOpacity>

      {leagues.length > 0 && (
        <View style={styles.groupsSection}>
          <Text style={[typo.smallSecondary, styles.groupsTitle]}>MES GROUPES</Text>
          <View style={styles.groupsCard}>
            {leagues.map((league, index) => {
              const points = league.myPoints ?? 0;
              const canRecharge = points < RECHARGE_CAP;
              return (
                <View
                  key={league.id}
                  style={[styles.groupRow, index > 0 && styles.groupRowBordered]}
                >
                  <View style={styles.groupIcon}>
                    <Coin size={18} color={colors.accent} variant="Bulk" />
                  </View>
                  <Text style={[typo.pBold, styles.groupName]} numberOfLines={1}>
                    {league.name}
                  </Text>
                  <Text style={[typo.pBold, styles.groupPoints]}>{points} pts</Text>
                  {canRecharge && (
                    <TouchableOpacity
                      style={styles.groupRecharge}
                      onPress={() => handleRecharge(league.id)}
                      disabled={rechargingId === league.id}
                      activeOpacity={0.8}
                    >
                      {rechargingId === league.id ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Text style={[typo.smallSecondary, styles.groupRechargeText]}>
                          Recharger
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

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

  // Mes groupes
  groupsSection: {
    marginTop: spacing.lg,
  },
  groupsTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupsCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  groupRowBordered: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    flex: 1,
  },
  groupPoints: {
    color: colors.accent,
  },
  groupRecharge: {
    minWidth: 80,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderActive,
    backgroundColor: colors.backgroundGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRechargeText: {
    color: colors.accent,
  },
});
