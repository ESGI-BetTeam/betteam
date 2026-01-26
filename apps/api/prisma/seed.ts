import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Cleaning database...');
  await prisma.contribution.deleteMany();
  await prisma.leagueWallet.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.user.deleteMany();

  // Create plans
  console.log('💎 Creating plans...');
  const plans = [
    { id: 'free', name: 'Free', maxMembers: 4, maxCompetitions: 1, maxChangesWeek: 1, monthlyPrice: 0, features: {} },
    { id: 'champion', name: 'Champion', maxMembers: 10, maxCompetitions: -1, maxChangesWeek: -1, monthlyPrice: 5.99, features: { unlimitedCompetitions: true, unlimitedChanges: true } },
    { id: 'mvp', name: 'MVP', maxMembers: 30, maxCompetitions: -1, maxChangesWeek: -1, monthlyPrice: 11.99, features: { unlimitedCompetitions: true, unlimitedChanges: true, prioritySupport: true } },
  ];

  for (const plan of plans) {
    await prisma.plan.create({ data: plan });
  }
  console.log(`✅ Created ${plans.length} plans`);

  // Create sample users
  console.log('👤 Creating users...');
  const user1 = await prisma.user.create({
    data: {
      email: 'demo@betteam.app',
      username: 'demo_user',
      passwordHash: '$2a$10$demohashdemohashdemohashdemohashdemohashdemohashdemo', // "password123"
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'john@betteam.app',
      username: 'john_doe',
      passwordHash: '$2a$10$demohashdemohashdemohashdemohashdemohashdemohashdemo',
      firstName: 'John',
      lastName: 'Doe',
    },
  });

  console.log('⚽ Creating competitions...');
  const ligue1 = await prisma.competition.create({
    data: {
      externalId: '4334',
      name: 'Ligue 1',
      sport: 'football',
      country: 'France',
      logoUrl: 'https://www.thesportsdb.com/images/media/league/badge/7jcrtj1612467038.png',
      isActive: true,
    },
  });

  const premierLeague = await prisma.competition.create({
    data: {
      externalId: '4328',
      name: 'Premier League',
      sport: 'football',
      country: 'England',
      logoUrl: 'https://www.thesportsdb.com/images/media/league/badge/i6o0kh1549879062.png',
      isActive: true,
    },
  });

  console.log('🏆 Creating teams...');
  const psg = await prisma.team.create({
    data: {
      externalId: '133789',
      name: 'Paris Saint-Germain',
      shortName: 'PSG',
      country: 'France',
      logoUrl: 'https://www.thesportsdb.com/images/media/team/badge/v7vtkq1612471295.png',
    },
  });

  const marseille = await prisma.team.create({
    data: {
      externalId: '133766',
      name: 'Olympique de Marseille',
      shortName: 'OM',
      country: 'France',
      logoUrl: 'https://www.thesportsdb.com/images/media/team/badge/fa9b9a1612471312.png',
    },
  });

  const arsenal = await prisma.team.create({
    data: {
      externalId: '133604',
      name: 'Arsenal',
      shortName: 'Arsenal',
      country: 'England',
      logoUrl: 'https://www.thesportsdb.com/images/media/team/badge/vrtrtp1448813175.png',
    },
  });

  const liverpool = await prisma.team.create({
    data: {
      externalId: '133602',
      name: 'Liverpool',
      shortName: 'Liverpool',
      country: 'England',
      logoUrl: 'https://www.thesportsdb.com/images/media/team/badge/uvxuxy1448813372.png',
    },
  });

  console.log('📅 Creating matches...');
  const match1 = await prisma.match.create({
    data: {
      externalId: '1234567',
      competitionId: ligue1.id,
      homeTeamId: psg.id,
      awayTeamId: marseille.id,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
      status: 'upcoming',
      venue: 'Parc des Princes',
      round: 'Journée 20',
    },
  });

  const match2 = await prisma.match.create({
    data: {
      externalId: '1234568',
      competitionId: premierLeague.id,
      homeTeamId: arsenal.id,
      awayTeamId: liverpool.id,
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      status: 'upcoming',
      venue: 'Emirates Stadium',
      round: 'Matchday 22',
    },
  });

  console.log('🎯 Creating league...');
  const league = await prisma.league.create({
    data: {
      name: 'Ligue Bureau 2024',
      description: 'Notre ligue privée entre collègues',
      ownerId: user1.id,
      inviteCode: 'DEMO2024',
      isPrivate: true,
      planId: 'free',
    },
  });

  // Create wallet for the league
  console.log('💰 Creating league wallet...');
  await prisma.leagueWallet.create({
    data: {
      leagueId: league.id,
      balance: 0,
    },
  });

  console.log('👥 Adding league members...');
  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: user1.id,
      role: 'owner',
      points: 1000,
    },
  });

  await prisma.leagueMember.create({
    data: {
      leagueId: league.id,
      userId: user2.id,
      role: 'member',
      points: 1000,
    },
  });

  console.log('🎲 Creating sample bets...');
  await prisma.bet.create({
    data: {
      userId: user1.id,
      matchId: match1.id,
      leagueId: league.id,
      predictionType: 'winner',
      predictionValue: JSON.stringify({ winner: 'home' }),
      amount: 100,
      status: 'pending',
      potentialWin: 150,
    },
  });

  await prisma.bet.create({
    data: {
      userId: user2.id,
      matchId: match2.id,
      leagueId: league.id,
      predictionType: 'score',
      predictionValue: JSON.stringify({ home: 2, away: 1 }),
      amount: 50,
      status: 'pending',
      potentialWin: 200,
    },
  });

  console.log('📊 Creating sync log...');
  await prisma.syncLog.create({
    data: {
      type: 'competitions',
      competitionId: ligue1.id,
      status: 'success',
      itemsSynced: 2,
      durationMs: 1234,
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
