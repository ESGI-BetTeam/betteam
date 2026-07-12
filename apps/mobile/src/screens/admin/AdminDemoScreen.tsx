import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { colors, spacing, radius, typo } from '@/theme';
import { Button } from '@/components/ui/Button';
import { adminService, Competition, Team, DemoMatch, League } from '@/services/admin.service';
import { ArrowDown2, TickCircle, CloseCircle, Timer } from 'iconsax-react-nativejs';
import { resolveMediaUrl } from '@/services/api';
import { Avatar } from '@/components/ui/Avatar';

export function AdminDemoScreen() {
  // Data
  const [leagues, setLeagues] = useState<League[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [demoMatches, setDemoMatches] = useState<DemoMatch[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [finishingMatchId, setFinishingMatchId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<Team | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<Team | null>(null);
  const [expectedHomeScore, setExpectedHomeScore] = useState('2');
  const [expectedAwayScore, setExpectedAwayScore] = useState('1');

  // Modals
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showHomeTeamModal, setShowHomeTeamModal] = useState(false);
  const [showAwayTeamModal, setShowAwayTeamModal] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [leaguesRes, comps, teamsRes, matches] = await Promise.all([
        adminService.getLeagues(),
        adminService.getCompetitions(),
        adminService.getTeams(),
        adminService.getDemoMatches(),
      ]);
      setLeagues(leaguesRes);
      setCompetitions(comps);
      setTeams(teamsRes);
      setDemoMatches(matches);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les donnees');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleCreateMatch = async () => {
    if (!selectedLeague) {
      Alert.alert('Erreur', 'Selectionnez un groupe pour le pari');
      return;
    }

    if (!selectedCompetition || !selectedHomeTeam || !selectedAwayTeam) {
      Alert.alert('Erreur', 'Selectionnez une competition et deux equipes');
      return;
    }

    if (selectedHomeTeam.id === selectedAwayTeam.id) {
      Alert.alert('Erreur', 'Les deux equipes doivent etre differentes');
      return;
    }

    setIsCreating(true);
    try {
      await adminService.createDemoMatch({
        leagueId: selectedLeague.id,
        competitionId: selectedCompetition.id,
        homeTeamId: selectedHomeTeam.id,
        awayTeamId: selectedAwayTeam.id,
        expectedHomeScore: parseInt(expectedHomeScore) || 0,
        expectedAwayScore: parseInt(expectedAwayScore) || 0,
      });
      Alert.alert('Succes', `Match demo cree dans "${selectedLeague.name}" !`);
      // Reset form
      setSelectedLeague(null);
      setSelectedCompetition(null);
      setSelectedHomeTeam(null);
      setSelectedAwayTeam(null);
      setExpectedHomeScore('2');
      setExpectedAwayScore('1');
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Creation echouee');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinishMatch = async (match: DemoMatch) => {
    Alert.alert(
      'Terminer le match',
      `Appliquer le score ${match.expectedScore.homeScore}-${match.expectedScore.awayScore} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            setFinishingMatchId(match.id);
            try {
              await adminService.finishMatch(match.id);
              Alert.alert('Succes', `Match termine: ${match.expectedScore.homeScore}-${match.expectedScore.awayScore}`);
              loadData();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.error || 'Impossible de terminer le match');
            } finally {
              setFinishingMatchId(null);
            }
          },
        },
      ],
    );
  };

  const handleSettle = async () => {
    setIsSettling(true);
    try {
      const result = await adminService.settleAll();
      Alert.alert(
        'Settlement termine',
        `${result.betsSettled} pari(s) regle(s)\n${result.pointsCredited} points credites`,
      );
      loadData();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Settlement echoue');
    } finally {
      setIsSettling(false);
    }
  };

  const filteredTeams = teamSearch
    ? teams.filter((t) => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
    : teams;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
    >
      <Text style={typo.h1}>Admin Demo</Text>
      <Text style={[typo.pSecondary, styles.subtitle]}>Interface pour la presentation jury</Text>

      {/* Section: Create Match */}
      <View style={styles.section}>
        <Text style={typo.h3}>Creer un match fictif</Text>

        {/* League Picker */}
        <Text style={[typo.smallSecondary, styles.fieldLabel]}>GROUPE POUR LE PARI</Text>
        <TouchableOpacity style={[styles.picker, styles.leaguePicker]} onPress={() => setShowLeagueModal(true)}>
          <Text style={selectedLeague ? typo.p : typo.pSecondary}>
            {selectedLeague?.name || 'Selectionner un groupe'}
          </Text>
          <ArrowDown2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Competition Picker */}
        <TouchableOpacity style={styles.picker} onPress={() => setShowCompetitionModal(true)}>
          <Text style={selectedCompetition ? typo.p : typo.pSecondary}>
            {selectedCompetition?.name || 'Selectionner une competition'}
          </Text>
          <ArrowDown2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Home Team Picker */}
        <TouchableOpacity style={styles.picker} onPress={() => setShowHomeTeamModal(true)}>
          <Text style={selectedHomeTeam ? typo.p : typo.pSecondary}>
            {selectedHomeTeam?.name || 'Equipe domicile'}
          </Text>
          <ArrowDown2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Away Team Picker */}
        <TouchableOpacity style={styles.picker} onPress={() => setShowAwayTeamModal(true)}>
          <Text style={selectedAwayTeam ? typo.p : typo.pSecondary}>
            {selectedAwayTeam?.name || 'Equipe exterieur'}
          </Text>
          <ArrowDown2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Expected Scores */}
        <Text style={[typo.smallSecondary, styles.scoresLabel]}>SCORE ATTENDU (pour la demo)</Text>
        <View style={styles.scoresRow}>
          <TextInput
            style={styles.scoreInput}
            value={expectedHomeScore}
            onChangeText={setExpectedHomeScore}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={typo.h2}>-</Text>
          <TextInput
            style={styles.scoreInput}
            value={expectedAwayScore}
            onChangeText={setExpectedAwayScore}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <Button title="Creer le match" onPress={handleCreateMatch} loading={isCreating} variant="primary" />
      </View>

      {/* Section: Demo Matches */}
      <View style={styles.section}>
        <Text style={typo.h3}>Matchs demo ({demoMatches.length})</Text>
        {demoMatches.length === 0 ? (
          <Text style={typo.pSecondary}>Aucun match demo cree</Text>
        ) : (
          demoMatches.map((match) => (
            <DemoMatchCard
              key={match.id}
              match={match}
              onFinish={() => handleFinishMatch(match)}
              isFinishing={finishingMatchId === match.id}
            />
          ))
        )}
      </View>

      {/* Settlement Button */}
      <View style={styles.section}>
        <Button
          title="Declencher le settlement"
          onPress={handleSettle}
          loading={isSettling}
          variant="secondary"
        />
        <Text style={[typo.small, styles.settlementHint]}>
          Regle tous les paris en attente sur les matchs termines
        </Text>
      </View>

      {/* League Modal */}
      <SelectionModal
        visible={showLeagueModal}
        onClose={() => setShowLeagueModal(false)}
        title="Selectionner un groupe"
        data={leagues}
        renderItem={(item) => (
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
              setSelectedLeague(item);
              setShowLeagueModal(false);
            }}
          >
            <Avatar uri={resolveMediaUrl(item.logoUrl)} name={item.name} size={32} />
            <View style={styles.leagueItemText}>
              <Text style={typo.p}>{item.name}</Text>
              <Text style={typo.smallSecondary}>{item._count.members} membre(s)</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Competition Modal */}
      <SelectionModal
        visible={showCompetitionModal}
        onClose={() => setShowCompetitionModal(false)}
        title="Selectionner une competition"
        data={competitions}
        renderItem={(item) => (
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
              setSelectedCompetition(item);
              setShowCompetitionModal(false);
            }}
          >
            <Avatar uri={resolveMediaUrl(item.logoUrl)} name={item.name} size={32} />
            <Text style={typo.p}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Home Team Modal */}
      <SelectionModal
        visible={showHomeTeamModal}
        onClose={() => {
          setShowHomeTeamModal(false);
          setTeamSearch('');
        }}
        title="Equipe domicile"
        data={filteredTeams}
        searchValue={teamSearch}
        onSearchChange={setTeamSearch}
        renderItem={(item) => (
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
              setSelectedHomeTeam(item);
              setShowHomeTeamModal(false);
              setTeamSearch('');
            }}
          >
            <Avatar uri={resolveMediaUrl(item.logoUrl)} name={item.name} size={32} />
            <Text style={typo.p}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Away Team Modal */}
      <SelectionModal
        visible={showAwayTeamModal}
        onClose={() => {
          setShowAwayTeamModal(false);
          setTeamSearch('');
        }}
        title="Equipe exterieur"
        data={filteredTeams}
        searchValue={teamSearch}
        onSearchChange={setTeamSearch}
        renderItem={(item) => (
          <TouchableOpacity
            style={styles.modalItem}
            onPress={() => {
              setSelectedAwayTeam(item);
              setShowAwayTeamModal(false);
              setTeamSearch('');
            }}
          >
            <Avatar uri={resolveMediaUrl(item.logoUrl)} name={item.name} size={32} />
            <Text style={typo.p}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}

function DemoMatchCard({
  match,
  onFinish,
  isFinishing,
}: {
  match: DemoMatch;
  onFinish: () => void;
  isFinishing: boolean;
}) {
  const isFinished = match.status === 'finished';
  const betsCount = match.groupBets.reduce((sum, gb) => sum + gb._count.bets, 0);

  return (
    <View style={styles.matchCard}>
      <View style={styles.matchTeams}>
        <View style={styles.teamInfo}>
          <Avatar uri={resolveMediaUrl(match.homeTeam.logoUrl)} name={match.homeTeam.name} size={32} />
          <Text style={typo.pBold} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
        </View>
        <Text style={typo.h3}>vs</Text>
        <View style={styles.teamInfo}>
          <Avatar uri={resolveMediaUrl(match.awayTeam.logoUrl)} name={match.awayTeam.name} size={32} />
          <Text style={typo.pBold} numberOfLines={1}>
            {match.awayTeam.name}
          </Text>
        </View>
      </View>

      <View style={styles.matchInfo}>
        <View style={styles.matchInfoRow}>
          <Timer size={14} color={colors.textSecondary} />
          <Text style={typo.smallSecondary}>
            Score attendu: {match.expectedScore.homeScore} - {match.expectedScore.awayScore}
          </Text>
        </View>

        {isFinished && (
          <View style={styles.matchInfoRow}>
            <TickCircle size={14} color={colors.success} />
            <Text style={[typo.small, { color: colors.success }]}>
              Score final: {match.homeScore} - {match.awayScore}
            </Text>
          </View>
        )}

        <View style={styles.matchInfoRow}>
          <Text style={typo.smallSecondary}>{betsCount} pari(s) place(s)</Text>
        </View>
      </View>

      {!isFinished && (
        <Button
          title="Terminer le match"
          onPress={onFinish}
          loading={isFinishing}
          variant="outline"
          size="default"
        />
      )}
    </View>
  );
}

function SelectionModal<T extends { id: string }>({
  visible,
  onClose,
  title,
  data,
  renderItem,
  searchValue,
  onSearchChange,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={typo.h3}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseCircle size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {onSearchChange && (
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={colors.textSecondary}
              value={searchValue}
              onChangeText={onSearchChange}
            />
          )}

          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderItem(item)}
            style={styles.modalList}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  subtitle: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  leaguePicker: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  fieldLabel: {
    marginLeft: spacing.xs,
  },
  leagueItemText: {
    flex: 1,
  },
  scoresLabel: {
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  scoreInput: {
    width: 60,
    height: 50,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  matchCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  matchTeams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  matchInfo: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settlementHint: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
