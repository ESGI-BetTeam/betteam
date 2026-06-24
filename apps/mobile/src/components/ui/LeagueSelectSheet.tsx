import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowRight2 } from 'iconsax-react-nativejs';
import { League } from '@/services/league.service';
import { resolveMediaUrl } from '@/services/api';
import { Avatar } from './Avatar';
import { BottomSheet } from './BottomSheet';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';

interface LeagueSelectSheetProps {
  visible: boolean;
  leagues: League[];
  onClose: () => void;
  onSelect: (league: League) => void;
}

// Lets the user pick which league to post a bet in.
export function LeagueSelectSheet({ visible, leagues, onClose, onSelect }: LeagueSelectSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[typo.h3, styles.title]}>Choisir une ligue</Text>
      <Text style={[typo.pSecondary, styles.subtitle]}>Dans quelle ligue parier ?</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {leagues.map((league) => (
          <TouchableOpacity
            key={league.id}
            style={styles.row}
            onPress={() => onSelect(league)}
            activeOpacity={0.8}
          >
            <Avatar uri={resolveMediaUrl(league.logoUrl)} name={league.name} size={40} />
            <View style={styles.rowText}>
              <Text style={typo.pBold} numberOfLines={1}>
                {league.name}
              </Text>
              {league._count?.members != null && (
                <Text style={typo.smallSecondary}>
                  {league._count.members} membre{league._count.members > 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <ArrowRight2 size={18} color={colors.textSecondary} variant="Outline" />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  list: {
    maxHeight: 340,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidth.xs,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
  },
});
