import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Send2 } from 'iconsax-react-nativejs';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';
import { BottomSheet } from './BottomSheet';

interface ShareLeagueSheetProps {
  visible: boolean;
  onClose: () => void;
  leagueName: string;
  inviteCode: string;
}

export function ShareLeagueSheet({
  visible,
  onClose,
  leagueName,
  inviteCode,
}: ShareLeagueSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleClose = useCallback(() => {
    setCopied(false);
    onClose();
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteCode]);

  const handleInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `Rejoins ma ligue "${leagueName}" sur BetTeam ! Code d'invitation : ${inviteCode}`,
      });
    } catch {
      // User dismissed the share sheet
    }
  }, [leagueName, inviteCode]);

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <Text style={[typo.h1, styles.title]}>Agrandissez votre équipe !</Text>
      <Text style={[typo.pSecondary, styles.subtitle]}>
        Partagez ce code ou envoyez une invitation à vos collègues pour qu{'’'}ils rejoignent la
        ligue <Text style={styles.leagueName}>{leagueName}</Text>.
      </Text>

      <View style={styles.codeCard}>
        <Text style={[typo.h4, styles.codeLabel]}>Votre code de ligue</Text>
        <View style={styles.codeRow}>
          <Text style={[typo.pBold, styles.code]} numberOfLines={1}>
            {inviteCode}
          </Text>
          <TouchableOpacity style={styles.inlineButton} onPress={handleCopy} activeOpacity={0.8}>
            <Copy size={16} color={colors.white} variant="Outline" />
            <Text style={[typo.pBold, styles.inlineButtonText]}>
              {copied ? 'Copié !' : 'Copier'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[typo.smallSecondary, styles.caption]}>
          Toute personne disposant de ce code peut rejoindre la ligue.
        </Text>
      </View>

      <TouchableOpacity style={styles.actionPrimary} onPress={handleInvite} activeOpacity={0.8}>
        <Send2 size={18} color={colors.white} variant="Outline" />
        <Text style={[typo.pBold, styles.actionPrimaryText]}>Envoyer une invitation</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  leagueName: {
    color: colors.accent,
    fontFamily: 'Inter-Regular',
    fontWeight: '700',
  },
  codeCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  codeLabel: {
    marginBottom: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    borderRadius: radius.full,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    backgroundColor: colors.backgroundInput,
  },
  code: {
    flex: 1,
    letterSpacing: 1,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  inlineButtonText: {
    color: colors.white,
    fontSize: 14,
  },
  caption: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  actionPrimaryText: {
    color: colors.white,
    fontSize: 14,
  },
});
