import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderWidth, typo } from '@/theme';

export interface SportFilterItem {
  key: string;
  label: string;
  count: number;
}

interface SportFilterProps {
  items: SportFilterItem[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}

function SportIcon({ sport, color, size }: { sport: string; color: string; size: number }) {
  switch (sport.toLowerCase()) {
    case 'soccer':
      return <Ionicons name="football" size={size} color={color} />;
    case 'basketball':
      return <MaterialCommunityIcons name="basketball" size={size} color={color} />;
    case 'ice hockey':
      return <FontAwesome5 name="hockey-puck" size={size - 2} color={color} />;
    case 'tennis':
      return <Ionicons name="tennisball" size={size} color={color} />;
    case 'baseball':
      return <MaterialCommunityIcons name="baseball" size={size} color={color} />;
    case 'rugby':
      return <MaterialCommunityIcons name="rugby" size={size} color={color} />;
    default:
      return <MaterialCommunityIcons name="trophy" size={size} color={color} />;
  }
}

export function SportFilter({ items, selected, onSelect }: SportFilterProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* "Tous" chip */}
        <TouchableOpacity
          style={[styles.chip, !selected && styles.chipActive]}
          onPress={() => onSelect(null)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="flash"
            size={13}
            color={!selected ? colors.accent : colors.textSecondary}
          />
          <Text style={[typo.smallSecondary, styles.chipLabel, !selected && styles.chipLabelActive]}>Tout</Text>
          <Text style={[typo.small, styles.chipCount, !selected && styles.chipCountActive]}>{total}</Text>
        </TouchableOpacity>

        {items.map((item) => {
          const isActive = selected === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(isActive ? null : item.key)}
              activeOpacity={0.7}
            >
              <SportIcon
                sport={item.key}
                color={isActive ? colors.accent : colors.textSecondary}
                size={14}
              />
              <Text style={[typo.smallSecondary, styles.chipLabel, isActive && styles.chipLabelActive]}>{getSportLabel(item.key)}</Text>
              <Text style={[typo.small, styles.chipCount, isActive && styles.chipCountActive]}>{item.count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    soccer: 'Football',
    basketball: 'Basket',
    'ice hockey': 'Hockey',
    tennis: 'Tennis',
    baseball: 'Baseball',
    rugby: 'Rugby',
    volleyball: 'Volley',
    handball: 'Handball',
  };
  return labels[sport.toLowerCase()] ?? sport;
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 28,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  chipLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: colors.textPrimary,
  },
  chipCount: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipCountActive: {
    color: colors.textPrimary,
  },
});
