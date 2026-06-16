-- Add optional logo (URL or base64 data-URI) to leagues
ALTER TABLE "leagues" ADD COLUMN "logo_url" TEXT;
