import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';
import { leagueService, League } from '@/services/league.service';
import { BottomSheet } from './BottomSheet';

interface JoinLeagueSheetProps {
  visible: boolean;
  onClose: () => void;
  onJoined: (league: League) => void;
}

export function JoinLeagueSheet({ visible, onClose, onJoined }: JoinLeagueSheetProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setCode('');
    setError(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleJoin = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const league = await leagueService.joinByCode(trimmed);
      reset();
      onJoined(league);
    } catch (err) {
      // Surface the API's French error message when available
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? (err.response.data.error as string)
          : 'Impossible de rejoindre la ligue. Vérifiez le code.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [code, reset, onJoined]);

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <Text style={[typo.h1, styles.title]}>Rejoignez une équipe !</Text>
      <Text style={[typo.pSecondary, styles.subtitle]}>
        Entrez le code d{'’'}une ligue pour la rejoindre ou demandez à ce qu{'’'}on vous envoie une
        invitation.
      </Text>

      <View style={styles.codeCard}>
        <Text style={[typo.h4, styles.codeLabel]}>Code de ligue</Text>
        <View style={[styles.codeRow, !!error && styles.codeRowError]}>
          <TextInput
            style={[typo.p, styles.codeInput]}
            placeholder="BET-ABC123"
            placeholderTextColor={colors.textSecondary}
            selectionColor={colors.accent}
            autoCapitalize="characters"
            autoCorrect={false}
            value={code}
            onChangeText={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            editable={!loading}
            onSubmitEditing={handleJoin}
            returnKeyType="join"
          />
          <TouchableOpacity
            style={[styles.inlineButton, (!code.trim() || loading) && styles.inlineButtonDisabled]}
            onPress={handleJoin}
            disabled={!code.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[typo.pBold, styles.inlineButtonText]}>Rejoindre</Text>
            )}
          </TouchableOpacity>
        </View>
        {!!error && <Text style={[typo.small, styles.errorText]}>{error}</Text>}
      </View>
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
  codeCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
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
  codeRowError: {
    borderColor: colors.error,
  },
  codeInput: {
    flex: 1,
    color: colors.textPrimary,
  },
  inlineButton: {
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonDisabled: {
    opacity: 0.5,
  },
  inlineButtonText: {
    color: colors.white,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.sm,
  },
});
