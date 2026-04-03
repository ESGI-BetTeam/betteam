import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, radius, typo } from '../../theme';
import { AuthStackParamList } from '../../types/navigation';
import { AxiosError } from 'axios';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNav>();
  const { register, isLoading } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!email.trim()) newErrors.email = "L'email est requis";
    if (!username.trim()) newErrors.username = 'Le pseudo est requis';
    if (username.trim().length < 3) newErrors.username = '3 caractères minimum';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    if (password.length < 6) newErrors.password = '6 caractères minimum';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register(
        email.trim().toLowerCase(),
        username.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
      );
      Alert.alert(
        'Compte créé',
        'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      const message = axiosError.response?.data?.error ?? 'Une erreur est survenue. Réessayez.';
      Alert.alert('Erreur', message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>⚽</Text>
            </View>
            <Text style={typo.h1}>Créer un compte</Text>
            <Text style={typo.pSecondary}>Rejoignez BetTeam</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Prénom"
              placeholder="Votre prénom"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              type='text'
              autoCapitalize="words"
            />

            <Input
              label="Nom"
              placeholder="Votre nom"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              type='text'
              autoCapitalize="words"
            />

            <Input
              label="Pseudo"
              placeholder="Votre pseudo"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              type='text'
            />

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              type='email'
            />

            <Input
              label="Mot de passe"
              placeholder="6 caractères minimum"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              type='password'
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Confirmez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              type='password'
            />

            <Button
              title="Créer mon compte"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={typo.smallSecondary}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[typo.small, styles.footerLink]}>Se connecter</Text>
            </TouchableOpacity>
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
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 36,
  },
  form: {
    marginBottom: spacing.lg,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  footerLink: {
    color: colors.accent,
  },
});
