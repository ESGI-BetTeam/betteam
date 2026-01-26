-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_members" INTEGER NOT NULL,
    "max_competitions" INTEGER NOT NULL,
    "max_changes_week" INTEGER NOT NULL,
    "monthly_price" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_wallets" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "next_payment_date" TIMESTAMP(3),
    "is_frozen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'mock',
    "payment_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- Insert default plans
INSERT INTO "plans" ("id", "name", "max_members", "max_competitions", "max_changes_week", "monthly_price", "features", "updated_at")
VALUES
    ('free', 'Free', 4, 1, 1, 0, '{}', CURRENT_TIMESTAMP),
    ('champion', 'Champion', 10, -1, -1, 5.99, '{"unlimitedCompetitions": true, "unlimitedChanges": true}', CURRENT_TIMESTAMP),
    ('mvp', 'MVP', 30, -1, -1, 11.99, '{"unlimitedCompetitions": true, "unlimitedChanges": true, "prioritySupport": true}', CURRENT_TIMESTAMP);

-- AlterTable: Add plan_id to leagues
ALTER TABLE "leagues" ADD COLUMN "plan_id" TEXT NOT NULL DEFAULT 'free';

-- CreateIndex
CREATE UNIQUE INDEX "league_wallets_league_id_key" ON "league_wallets"("league_id");

-- CreateIndex
CREATE INDEX "league_wallets_league_id_idx" ON "league_wallets"("league_id");

-- CreateIndex
CREATE INDEX "league_wallets_next_payment_date_idx" ON "league_wallets"("next_payment_date");

-- CreateIndex
CREATE INDEX "contributions_wallet_id_idx" ON "contributions"("wallet_id");

-- CreateIndex
CREATE INDEX "contributions_user_id_idx" ON "contributions"("user_id");

-- CreateIndex
CREATE INDEX "contributions_created_at_idx" ON "contributions"("created_at");

-- CreateIndex
CREATE INDEX "leagues_plan_id_idx" ON "leagues"("plan_id");

-- AddForeignKey
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_wallets" ADD CONSTRAINT "league_wallets_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "league_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create wallets for existing leagues
INSERT INTO "league_wallets" ("id", "league_id", "balance", "is_frozen", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    0,
    false,
    CURRENT_TIMESTAMP
FROM "leagues"
WHERE NOT EXISTS (
    SELECT 1 FROM "league_wallets" WHERE "league_wallets"."league_id" = "leagues"."id"
);
