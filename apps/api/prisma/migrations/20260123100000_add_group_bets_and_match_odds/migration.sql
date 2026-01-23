-- AlterTable: Add columns to leagues
ALTER TABLE "leagues" ADD COLUMN "current_competition_id" TEXT;
ALTER TABLE "leagues" ADD COLUMN "competition_changed_at" TIMESTAMP(3);

-- AlterTable: Add column to bets
ALTER TABLE "bets" ADD COLUMN "group_bet_id" TEXT;

-- CreateTable
CREATE TABLE "group_bets" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closes_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "group_bets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_odds" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "odds_api_id" TEXT,
    "home_win_odds" DOUBLE PRECISION,
    "draw_odds" DOUBLE PRECISION,
    "away_win_odds" DOUBLE PRECISION,
    "bookmaker_count" INTEGER NOT NULL DEFAULT 0,
    "raw_data" JSONB,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_odds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_bets_league_id_idx" ON "group_bets"("league_id");

-- CreateIndex
CREATE INDEX "group_bets_match_id_idx" ON "group_bets"("match_id");

-- CreateIndex
CREATE INDEX "group_bets_created_by_id_idx" ON "group_bets"("created_by_id");

-- CreateIndex
CREATE INDEX "group_bets_status_idx" ON "group_bets"("status");

-- CreateIndex
CREATE INDEX "group_bets_closes_at_idx" ON "group_bets"("closes_at");

-- CreateIndex
CREATE UNIQUE INDEX "group_bets_league_id_match_id_key" ON "group_bets"("league_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_odds_match_id_key" ON "match_odds"("match_id");

-- CreateIndex
CREATE INDEX "match_odds_match_id_idx" ON "match_odds"("match_id");

-- CreateIndex
CREATE INDEX "match_odds_synced_at_idx" ON "match_odds"("synced_at");

-- CreateIndex
CREATE INDEX "leagues_current_competition_id_idx" ON "leagues"("current_competition_id");

-- CreateIndex
CREATE INDEX "bets_group_bet_id_idx" ON "bets"("group_bet_id");

-- CreateIndex (unique constraint for user per group bet)
CREATE UNIQUE INDEX "bets_user_id_group_bet_id_key" ON "bets"("user_id", "group_bet_id");

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_current_competition_id_fkey" FOREIGN KEY ("current_competition_id") REFERENCES "competitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_group_bet_id_fkey" FOREIGN KEY ("group_bet_id") REFERENCES "group_bets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bets" ADD CONSTRAINT "group_bets_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bets" ADD CONSTRAINT "group_bets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_bets" ADD CONSTRAINT "group_bets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_odds" ADD CONSTRAINT "match_odds_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
