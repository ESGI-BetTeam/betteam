-- CreateTable: players
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationality" TEXT,
    "position" TEXT,
    "number" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "height" TEXT,
    "weight" TEXT,
    "photo_url" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_favorite_teams
CREATE TABLE "user_favorite_teams" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: players
CREATE UNIQUE INDEX "players_external_id_key" ON "players"("external_id");
CREATE INDEX "players_team_id_idx" ON "players"("team_id");
CREATE INDEX "players_external_id_idx" ON "players"("external_id");
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex: user_favorite_teams
CREATE INDEX "user_favorite_teams_user_id_idx" ON "user_favorite_teams"("user_id");
CREATE INDEX "user_favorite_teams_team_id_idx" ON "user_favorite_teams"("team_id");
CREATE UNIQUE INDEX "user_favorite_teams_user_id_team_id_key" ON "user_favorite_teams"("user_id", "team_id");

-- AddForeignKey: players -> teams
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_favorite_teams -> users
ALTER TABLE "user_favorite_teams" ADD CONSTRAINT "user_favorite_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_favorite_teams -> teams
ALTER TABLE "user_favorite_teams" ADD CONSTRAINT "user_favorite_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
