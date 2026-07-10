import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { colors, spacing, typo } from '@/theme';
import { AuthStackParamList } from '@/types/navigation';
import { AxiosError } from 'axios';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const token = route.params?.token;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide ou expiré.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Votre email a été vérifié avec succès !');
      } catch (error) {
        const axiosError = error as AxiosError<{ error: string }>;
        setStatus('error');
        setMessage(axiosError.response?.data?.error || 'Une erreur est survenue lors de la vérification.');
      }
    };

    verify();
  }, [token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={[typo.h2, styles.title]}>Vérification</Text>
        
        {status === 'loading' ? (
          <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
            <Text style={[typo.p, styles.text]}>Vérification en cours...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={[typo.p, styles.text, status === 'error' && styles.errorText]}>
              {message}
            </Text>
            <Button
              title="Retour à la connexion"
              onPress={() => navigation.replace('Login')}
              style={styles.button}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing.xl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  loader: {
    marginBottom: spacing.md,
  },
  text: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error,
  },
  button: {
    width: '100%',
  },
});
