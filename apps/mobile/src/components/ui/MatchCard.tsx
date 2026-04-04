import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'iconsax-react-nativejs';
import { colors, spacing, radius, borderWidth, typo, fontSize } from '@/theme';
import { State } from './State';

interface TeamInfo {
  name: string;
  logoUrl?: string | null;
}

export interface MatchOdds {
  home: number;
  draw: number;
  away: number;
}

interface MatchCardProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  date: string;
  status: 'open' | 'soon' | 'live' | 'closed';
  variant?: 'featured' | 'compact';
  odds?: MatchOdds;
  onPress?: () => void;
}

function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Aujourd'hui, ${time}`;
  if (isTomorrow) return `Demain, ${time}`;

  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}, ${time}`;
}

const stateVariantMap: Record<MatchCardProps['status'], 'active' | 'live' | 'soon' | 'finished'> = {
  open: 'active',
  soon: 'soon',
  live: 'live',
  closed: 'finished',
};

const stateLabels: Record<MatchCardProps['status'], string> = {
  open: 'Ouvert',
  soon: 'Bient\u00f4t',
  live: 'En direct',
  closed: 'Ferm\u00e9',
};

function TeamLogo({ name, logoUrl, size }: TeamInfo & { size: number }) {
  if (logoUrl) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={[styles.teamLogo, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.teamLogoFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[typo.small, styles.teamLogoInitial, { fontSize: size * 0.4 }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function MatchCard({
  homeTeam,
  awayTeam,
  date,
  status,
  variant = 'compact',
  odds,
  onPress,
}: MatchCardProps) {
  const isFeatured = variant === 'featured';
  const canBet = status === 'open';
  const logoSize = isFeatured ? 36 : 28;
  const showOdds = odds && canBet;

  return (
    <TouchableOpacity
      style={[styles.card, isFeatured && styles.cardFeatured]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header: date + status */}
      <View style={styles.header}>
        <View style={styles.dateRow}>
          <Calendar size={14} color={colors.textSecondary} variant="Outline" />
          <Text style={[typo.smallSecondary, styles.dateText]}>{formatMatchDate(date)}</Text>
        </View>
        <State
          variant={stateVariantMap[status]}
          label={stateLabels[status]}
        />
      </View>

      {/* Teams */}
      <View style={[styles.teamsRow, !showOdds && !isFeatured && { marginBottom: 0 }]}>
        <View style={styles.team}>
          <TeamLogo name={homeTeam.name} logoUrl={homeTeam.logoUrl} size={logoSize} />
          <Text style={[typo.small, styles.teamName, isFeatured && styles.teamNameFeatured]} numberOfLines={1}>
            {homeTeam.name}
          </Text>
        </View>

        <Text style={[typo.smallSecondary, styles.vs]}>VS</Text>

        <View style={[styles.team, styles.teamRight]}>
          <Text style={[typo.small, styles.teamName, isFeatured && styles.teamNameFeatured]} numberOfLines={1}>
            {awayTeam.name}
          </Text>
          <TeamLogo name={awayTeam.name} logoUrl={awayTeam.logoUrl} size={logoSize} />
        </View>
      </View>

      {/* Odds row */}
      {showOdds && (
        <View style={styles.oddsRow}>
          <TouchableOpacity style={[styles.oddButton, styles.oddButtonFeatured]} activeOpacity={0.7}>
            <Text style={[typo.smallSecondary, styles.oddLabel, styles.oddLabelFeatured]} numberOfLines={1}>{homeTeam.name}</Text>
            <Text style={[typo.small, styles.oddValue, styles.oddValueFeatured]}>{odds.home.toFixed(2)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.oddButton, styles.oddButtonFeatured]} activeOpacity={0.7}>
            <Text style={[typo.smallSecondary, styles.oddLabel, styles.oddLabelFeatured]} numberOfLines={1}>Match nul</Text>
            <Text style={[typo.small, styles.oddValue, styles.oddValueFeatured]}>{odds.draw.toFixed(2)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.oddButton, styles.oddButtonFeatured]} activeOpacity={0.7}>
            <Text style={[typo.smallSecondary, styles.oddLabel, styles.oddLabelFeatured]} numberOfLines={1}>{awayTeam.name}</Text>
            <Text style={[typo.small, styles.oddValue, styles.oddValueFeatured]}>{odds.away.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardFeatured: {
    borderColor: colors.borderActive,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: 11,
    lineHeight: 16,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  teamRight: {
    justifyContent: 'flex-end',
  },
  teamLogo: {
    backgroundColor: colors.backgroundInput,
  },
  teamLogoFallback: {
    backgroundColor: colors.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoInitial: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  teamName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    flexShrink: 1,
  },
  teamNameFeatured: {
    fontSize: fontSize.md,
  },
  vs: {
    color: colors.textMuted,
    fontWeight: '600',
    marginHorizontal: spacing.sm,
    lineHeight: 16,
  },
  oddsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  oddButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  oddButtonFeatured: {
    backgroundColor: colors.accentMedium,
  },
  oddButtonCompact: {
    backgroundColor: colors.backgroundInput,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
  },
  oddLabel: {
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 2,
  },
  oddLabelFeatured: {
    color: colors.textPrimary,
    opacity: 0.85,
  },
  oddValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    lineHeight: 16,
  },
  oddValueFeatured: {
    color: colors.white,
  },
});
