import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft2, Camera, SearchNormal1, Setting2, TickCircle } from 'iconsax-react-nativejs';
import { colors, spacing, radius, borderWidth, typo } from '@/theme';
import { LeaguesStackParamList } from '@/types/navigation';
import { leagueService, League } from '@/services/league.service';
import {
  competitionService,
  Competition,
  frenchCompetitionName,
  frenchCountry,
} from '@/services/competition.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { SelectableRow } from '@/components/ui/SelectableRow';
import { RadioGroup, RadioRichTile, RadioOption } from '@/components/ui/Radio/Index';

type Nav = NativeStackNavigationProp<LeaguesStackParamList, 'CreateLeague'>;

const TOTAL_STEPS = 4;

// French labels for sport keys returned by the API (fallback: capitalized key)
const SPORT_LABELS: Record<string, string> = {
  football: 'Football',
  soccer: 'Football',
  basketball: 'Basketball',
  tennis: 'Tennis',
  rugby: 'Rugby',
  handball: 'Handball',
  cycling: 'Cyclisme',
  'ice hockey': 'Hockey sur glace',
  motorsport: 'Sport mécanique',
  baseball: 'Baseball',
  'american football': 'Football américain',
  golf: 'Golf',
  volleyball: 'Volley-ball',
  boxing: 'Boxe',
  darts: 'Fléchettes',
  snooker: 'Snooker',
};

// Emoji used as the card visual per sport (fallback: trophy)
const SPORT_EMOJI: Record<string, string> = {
  football: '⚽',
  soccer: '⚽',
  basketball: '🏀',
  tennis: '🎾',
  rugby: '🏉',
  handball: '🤾',
  cycling: '🚴',
  'ice hockey': '🏒',
  motorsport: '🏎️',
  baseball: '⚾',
  'american football': '🏈',
  golf: '⛳',
  volleyball: '🏐',
  boxing: '🥊',
  darts: '🎯',
  snooker: '🎱',
};

function sportLabel(sport: string): string {
  return SPORT_LABELS[sport.toLowerCase()] ?? sport.charAt(0).toUpperCase() + sport.slice(1);
}

function sportEmoji(sport: string): string {
  return SPORT_EMOJI[sport.toLowerCase()] ?? '🏆';
}

const INTEGRATION_OPTIONS: RadioOption[] = [
  {
    value: 'private',
    description: 'Privé',
    label: 'Sur invitation uniquement.',
    icon: Setting2,
  },
  {
    value: 'public',
    description: 'Public',
    label: 'Ouvert à toute la communauté BetTeam',
    icon: Setting2,
  },
];

export function CreateLeagueScreen() {
  const navigation = useNavigation<Nav>();

  // Wizard state — step 5 is the confirmation screen
  const [step, setStep] = useState(1);

  // Form state
  const [logo, setLogo] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<string | null>(null);
  const [competitionIds, setCompetitionIds] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [search, setSearch] = useState('');

  // Data
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Async
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);

  useEffect(() => {
    competitionService
      .getCompetitions({ isActive: true })
      .then(setCompetitions)
      .catch(() => setCompetitions([]));
  }, []);

  // Available sports derived from competitions
  const sports = useMemo(() => {
    const unique = Array.from(new Set(competitions.map((c) => c.sport)));
    return unique.sort();
  }, [competitions]);

  // Competitions for the selected sport, filtered by search
  const visibleCompetitions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return competitions
      .filter((c) => (sport ? c.sport === sport : true))
      .filter((c) =>
        query
          ? c.name.toLowerCase().includes(query) || c.country?.toLowerCase().includes(query)
          : true,
      );
  }, [competitions, sport, search]);

  const selectedCompetitions = useMemo(
    () => competitions.filter((c) => competitionIds.includes(c.id)),
    [competitions, competitionIds],
  );

  const toggleCompetition = useCallback((id: string) => {
    setCompetitionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const pickLogo = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });

    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const type = asset.mimeType ?? 'image/jpeg';
    const name = asset.fileName ?? `logo.${type.split('/')[1] ?? 'jpg'}`;
    setLogo({ uri: asset.uri, name, type });
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  }, [step, navigation]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const league = await leagueService.createLeague({
        name: name.trim(),
        isPrivate,
      });

      let finalLeague = league;

      // Upload the logo to the volume once the league exists
      if (logo) {
        try {
          finalLeague = await leagueService.uploadLogo(league.id, logo);
        } catch {
          // Non-blocking: league is created even if logo upload fails
        }
      }

      // The API supports a single active competition — assign the first selected one.
      if (competitionIds.length > 0) {
        try {
          await leagueService.setCompetition(league.id, competitionIds[0]);
        } catch {
          // Non-blocking: league is created even if competition assignment fails
        }
      }

      setCreatedLeague(finalLeague);
      setStep(5);
    } catch {
      setError('Une erreur est survenue lors de la création. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }, [name, logo, isPrivate, competitionIds]);

  const handleShare = useCallback(async () => {
    if (!createdLeague) return;
    try {
      await Share.share({
        message: `Rejoins ma ligue "${createdLeague.name}" sur BetTeam ! Code d'invitation : ${createdLeague.inviteCode}`,
      });
    } catch {
      // User dismissed the share sheet
    }
  }, [createdLeague]);

  // ---- Step validity ----
  const canContinue = useMemo(() => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return sport !== null;
    if (step === 3) return competitionIds.length > 0;
    return true;
  }, [step, name, sport, competitionIds]);

  const isConfirm = step === 5;

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title + back */}
        <View style={styles.titleRow}>
          {!isConfirm && (
            <TouchableOpacity onPress={goBack} hitSlop={8} style={styles.backButton}>
              <ArrowLeft2 size={24} color={colors.textPrimary} variant="Outline" />
            </TouchableOpacity>
          )}
          <Text style={[typo.h1, styles.title]}>Création d{'’'}une ligue</Text>
        </View>

        {/* Stepper or success check */}
        {isConfirm ? (
          <View style={styles.successWrapper}>
            <View style={styles.successCircle}>
              <TickCircle size={40} color={colors.white} variant="Bold" />
            </View>
          </View>
        ) : (
          <View style={styles.stepperWrapper}>
            <StepIndicator current={step} total={TOTAL_STEPS} />
          </View>
        )}

        {step === 1 && (
          <StepInformation
            logoUri={logo?.uri ?? null}
            onPickLogo={pickLogo}
            name={name}
            onNameChange={setName}
          />
        )}

        {step === 2 && (
          <StepSport
            sports={sports}
            selected={sport}
            onSelect={setSport}
            hasData={competitions.length > 0}
          />
        )}

        {step === 3 && (
          <StepCompetitions
            competitions={visibleCompetitions}
            selectedIds={competitionIds}
            onToggle={toggleCompetition}
            search={search}
            onSearchChange={setSearch}
          />
        )}

        {step === 4 && (
          <StepIntegration
            value={isPrivate ? 'private' : 'public'}
            onChange={(v) => setIsPrivate(v === 'private')}
          />
        )}

        {isConfirm && createdLeague && (
          <ConfirmRecap
            name={createdLeague.name}
            sport={sport ? sportLabel(sport) : '—'}
            competitions={selectedCompetitions.map((c) => c.name)}
            isPrivate={isPrivate}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        {step <= 3 && (
          <Button
            title="Suivant"
            variant="primary"
            onPress={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            style={styles.cta}
          />
        )}
        {step === 4 && (
          <Button
            title="Créer la ligue"
            variant="primary"
            onPress={handleSubmit}
            loading={submitting}
            style={styles.cta}
          />
        )}
        {isConfirm && (
          <View style={styles.footerRow}>
            <Button
              title="Partager"
              variant="outline"
              onPress={handleShare}
              style={styles.confirmButton}
            />
            <Button
              title="Continuer"
              variant="primary"
              onPress={() => navigation.navigate('LeaguesHome')}
              style={styles.confirmButton}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// Step 1 — Informations générales
// ============================================================
interface StepInformationProps {
  logoUri: string | null;
  onPickLogo: () => void;
  name: string;
  onNameChange: (v: string) => void;
}

function StepInformation({ logoUri, onPickLogo, name, onNameChange }: StepInformationProps) {
  return (
    <View>
      <Text style={[typo.h2, styles.stepTitle]}>Informations Générales</Text>
      <Text style={[typo.pSecondary, styles.stepSubtitle]}>
        Commencez par donner une identité unique à votre ligue.
      </Text>

      <View style={styles.logoWrapper}>
        <TouchableOpacity style={styles.logoCircle} onPress={onPickLogo} activeOpacity={0.8}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
          ) : (
            <Camera size={28} color={colors.accent} variant="Bulk" />
          )}
        </TouchableOpacity>
        <Text style={[typo.smallSecondary, styles.logoCaption]}>
          {logoUri ? 'Modifier le logo' : 'Logo de la ligue'}
        </Text>
      </View>

      <Input
        label="Nom de la ligue"
        placeholder="Ex. Les Pronos du bureau"
        value={name}
        onChangeText={onNameChange}
        maxLength={100}
      />
    </View>
  );
}

// ============================================================
// Step 2 — Le sport
// ============================================================
interface StepSportProps {
  sports: string[];
  selected: string | null;
  onSelect: (sport: string) => void;
  hasData: boolean;
}

function StepSport({ sports, selected, onSelect, hasData }: StepSportProps) {
  return (
    <View>
      <Text style={[typo.h2, styles.stepTitle]}>Le sport sur lequel parier</Text>
      <Text style={[typo.pSecondary, styles.stepSubtitle]}>
        Choisissez le type de sport sur lequel les joueurs pourront parier.
      </Text>

      {sports.length > 0 ? (
        <View style={styles.groupCard}>
          {sports.map((s, index) => (
            <React.Fragment key={s}>
              {index > 0 && <View style={styles.groupDivider} />}
              <SelectableRow
                compact
                title={sportLabel(s)}
                selected={selected === s}
                onPress={() => onSelect(s)}
                iconBg={selected === s ? colors.accentLight : colors.backgroundInput}
                icon={<Text style={styles.sportEmoji}>{sportEmoji(s)}</Text>}
              />
            </React.Fragment>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {hasData ? 'Aucun sport disponible pour le moment.' : 'Chargement des sports...'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// Step 3 — Les compétitions
// ============================================================
interface StepCompetitionsProps {
  competitions: Competition[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

function StepCompetitions({
  competitions,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
}: StepCompetitionsProps) {
  return (
    <View>
      <Text style={[typo.h2, styles.stepTitle]}>Quels sont les compétitions ?</Text>
      <Text style={[typo.pSecondary, styles.stepSubtitle]}>
        Sélectionnez les championnats à inclure dans votre ligue de pronostics.
      </Text>

      <Input
        type="search"
        placeholder="Rechercher une compétition"
        value={search}
        onChangeText={onSearchChange}
        iconLeft={<SearchNormal1 size={18} color={colors.textSecondary} variant="Outline" />}
      />

      <View style={styles.list}>
        {competitions.length > 0 ? (
          competitions.map((c) => (
            <SelectableRow
              key={c.id}
              title={frenchCompetitionName(c.name)}
              subtitle={frenchCountry(c.country)}
              selected={selectedIds.includes(c.id)}
              onPress={() => onToggle(c.id)}
              iconBg={c.logoUrl ? colors.white : undefined}
              icon={
                c.logoUrl ? (
                  <Image
                    source={{ uri: c.logoUrl }}
                    style={styles.competitionLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Setting2 size={20} color={colors.accent} variant="Bulk" />
                )
              }
            />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune compétition trouvée.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================
// Step 4 — Intégration
// ============================================================
function StepIntegration({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Text style={[typo.h2, styles.stepTitle]}>Intégration</Text>
      <Text style={[typo.pSecondary, styles.stepSubtitle]}>
        Définissez qui peut intégrer la ligue.
      </Text>

      <RadioGroup
        options={INTEGRATION_OPTIONS}
        value={value}
        onChange={onChange}
        ItemComponent={RadioRichTile}
      />
    </View>
  );
}

// ============================================================
// Confirmation recap
// ============================================================
interface ConfirmRecapProps {
  name: string;
  sport: string;
  competitions: string[];
  isPrivate: boolean;
}

function ConfirmRecap({ name, sport, competitions, isPrivate }: ConfirmRecapProps) {
  return (
    <View>
      <Text style={[typo.h2, styles.recapHeading]}>Terminé</Text>
      <Text style={[typo.pSecondary, styles.recapIntro]}>
        <Text style={styles.recapName}>{name}</Text> a été créé avec succès.
      </Text>

      <View style={styles.recapCard}>
        <RecapBlock title="Sport" value={sport} />
        <RecapBlock
          title="Compétitions"
          value={competitions.length > 0 ? competitions.join(' · ') : 'Aucune'}
        />
        <RecapBlock title="Intégration" value={isPrivate ? 'Privé' : 'Public'} last />
      </View>
    </View>
  );
}

function RecapBlock({
  title,
  value,
  last = false,
}: {
  title: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={!last && styles.recapBlock}>
      <Text style={[typo.h4, styles.recapBlockTitle]}>{title}</Text>
      <Text style={typo.pSecondary}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    marginLeft: -spacing.xs,
  },
  title: {
    marginBottom: 0,
  },
  stepperWrapper: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    marginBottom: spacing.lg,
  },

  // Step 1 logo
  logoWrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundGlass,
    borderWidth: borderWidth.md,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoCaption: {
    marginTop: spacing.xs,
  },

  // Sport emoji shown in the round icon slot of the list rows
  sportEmoji: {
    fontSize: 20,
  },

  // Step 2 — grouped list (single rounded card with inset dividers)
  groupCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.sm,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupDivider: {
    height: borderWidth.xs,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 34 + spacing.md, // align under the text (padding + icon + gap)
  },

  // Step 3 list
  list: {
    gap: spacing.md,
  },
  competitionLogo: {
    width: 30,
    height: 30,
  },

  // Empty
  emptyBox: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },

  // Success
  successWrapper: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recap
  recapHeading: {
    marginBottom: spacing.xs,
  },
  recapIntro: {
    marginBottom: spacing.lg,
  },
  recapName: {
    color: colors.accent,
    fontWeight: '700',
  },
  recapCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  recapBlock: {
    marginBottom: spacing.lg,
  },
  recapBlockTitle: {
    marginBottom: spacing.xs,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: borderWidth.sm,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cta: {
    height: 54,
    borderRadius: radius.full,
  },
  confirmButton: {
    flex: 1,
    height: 54,
    borderRadius: radius.full,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
