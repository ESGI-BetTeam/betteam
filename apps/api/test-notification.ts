import { prisma } from './src/lib/prisma';
import { settlementService } from './src/services/settlement.service';

async function runTest() {
  console.log('🚀 Démarrage du test de notification de pari...');

  // 1. Trouver ton utilisateur (le dernier à s'être connecté)
  const user = await prisma.user.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  if (!user) {
    console.error('❌ Aucun utilisateur n\'existe dans la base.');
    process.exit(1);
  }

  console.log(`👤 Utilisateur ciblé : ${user.username} (Tokens: ${user.pushTokens.length})`);
  if (user.pushTokens.length === 0) {
    console.log('⚠️ Attention : Cet utilisateur n\'a aucun Push Token. (S\'il est sur iPhone, demande-lui de se reconnecter).');
  }

  // 2. Trouver ou créer une ligue pour le test
  let league = await prisma.league.findFirst({ where: { ownerId: user.id } });
  if (!league) {
    league = await prisma.league.create({
      data: {
        name: 'Ligue de Test Notification',
        ownerId: user.id,
        inviteCode: 'TESTNOTIF123'
      }
    });
  }

  // S'assurer que l'utilisateur est membre
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId: user.id } }
  });
  if (!member) {
    await prisma.leagueMember.create({
      data: { leagueId: league.id, userId: user.id, role: 'owner' }
    });
  }

  // 3. Créer un faux match terminé (avec un ID externe unique)
  const fakeCompetition = await prisma.competition.findFirst() || await prisma.competition.create({
    data: { externalId: 'comp-test', name: 'Compétition Test', sport: 'Football' }
  });

  const fakeHome = await prisma.team.findFirst() || await prisma.team.create({
    data: { externalId: 'team-home-test', name: 'Équipe A' }
  });

  const fakeAway = await prisma.team.findFirst({ skip: 1 }) || await prisma.team.create({
    data: { externalId: 'team-away-test', name: 'Équipe B' }
  });

  const uniqueId = `match-test-${Date.now()}`;
  const match = await prisma.match.create({
    data: {
      externalId: uniqueId,
      competitionId: fakeCompetition.id,
      homeTeamId: fakeHome.id,
      awayTeamId: fakeAway.id,
      startTime: new Date(Date.now() - 1000000), // Match passé
      status: 'finished', // MATCH TERMINÉ
      homeScore: 2, // L'équipe A gagne 2-1
      awayScore: 1
    }
  });

  console.log(`⚽ Faux Match créé : ${fakeHome.name} vs ${fakeAway.name} (Terminé 2-1)`);

  // 4. Créer le challenge
  const groupBet = await prisma.groupBet.create({
    data: {
      leagueId: league.id,
      matchId: match.id,
      createdById: user.id,
      status: 'closed',
      closesAt: new Date(Date.now() - 10000)
    }
  });

  // 5. Placer un faux pari GAGNANT pour l'utilisateur
  const bet = await prisma.bet.create({
    data: {
      userId: user.id,
      matchId: match.id,
      leagueId: league.id,
      groupBetId: groupBet.id,
      predictionType: 'winner',
      predictionValue: JSON.stringify({ type: 'winner', value: 'home' }), // Pari sur l'équipe A
      amount: 100, // Pari de 100 points
      status: 'pending' // Pari en attente
    }
  });

  console.log('✅ Faux pari GAGNANT placé en base de données.');
  
  // 6. Déclencher le Settlement Service
  console.log('⚙️ Exécution du settlementService (qui devrait envoyer la notification)...');
  await settlementService.settleFinishedMatches();

  console.log('🎉 Test terminé ! Regarde les logs de l\'API pour voir si la notification est partie.');
}

runTest().catch(console.error).finally(() => process.exit(0));
