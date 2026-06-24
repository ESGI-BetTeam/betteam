-- Track whether a league member has topped up their points ("mis la main au pot")
ALTER TABLE "league_members" ADD COLUMN "has_recharged" BOOLEAN NOT NULL DEFAULT false;
