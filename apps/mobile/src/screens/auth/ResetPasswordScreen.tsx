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

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
  const token = route.params?.token;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async () => {
    if (!token) {
      Alert.alert('Erreur', "Lien invalide ou expiré.");
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', "Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      setIsSuccess(true);
      Alert.alert(
        'Succès',
        response.message || 'Votre mot de passe a été réinitialisé.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      Alert.alert('Erreur', axiosError.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess || !token) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Text style={[typo.p, styles.text, !token && styles.errorText]}>
            {!token ? "Lien invalide ou expiré." : "Votre mot de passe a été réinitialisé avec succès !"}
          </Text>
          <Button title="Retour à la connexion" onPress={() => navigation.replace('Login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[typo.h2, styles.title]}>Nouveau mot de passe</Text>
          <Text style={[typo.p, styles.subtitle]}>
            Entrez votre nouveau mot de passe ci-dessous.
          </Text>

          <Input
            label="Nouveau mot de passe"
            placeholder="Min. 6 caractères"
            value={password}
            onChangeText={setPassword}
            type="password"
          />

          <Input
            label="Confirmer le mot de passe"
            placeholder="Min. 6 caractères"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            type="password"
          />

          <View style={styles.actions}>
            <Button
              title="Réinitialiser"
              onPress={handleReset}
              loading={isLoading}
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
  centerContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
  text: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error,
  },
  actions: {
    marginTop: spacing.xl,
  },
});
