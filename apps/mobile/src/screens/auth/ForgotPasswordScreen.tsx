import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { colors, spacing, typo } from '@/theme';
import { AuthStackParamList } from '@/types/navigation';
import { AxiosError } from 'axios';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', "Veuillez entrer votre adresse email.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'Email envoyé',
        'Si cet email existe, un lien de réinitialisation vous a été envoyé.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      Alert.alert('Erreur', axiosError.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[typo.h2, styles.title]}>Mot de passe oublié</Text>
          <Text style={[typo.p, styles.subtitle]}>
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </Text>

          <Input
            label="Email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            type="email"
          />

          <View style={styles.actions}>
            <Button
              title="Envoyer le lien"
              onPress={handleReset}
              loading={isLoading}
            />
            <Button
              title="Annuler"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
