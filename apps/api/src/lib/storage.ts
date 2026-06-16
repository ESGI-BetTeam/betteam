import path from 'path';
import fs from 'fs';

/**
 * Root of the persistent storage.
 * On Railway, a Volume is mounted and its path is exposed via
 * RAILWAY_VOLUME_MOUNT_PATH. Locally we fall back to a folder in the repo.
 */
const VOLUME_ROOT =
  process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), '.local-storage');

/** Directory served publicly under /uploads */
export const UPLOADS_DIR = path.join(VOLUME_ROOT, 'uploads');

/** Sub-directory holding league logos */
export const LEAGUE_LOGOS_DIR = path.join(UPLOADS_DIR, 'leagues');

/** Public URL prefix matching the express.static mount */
export const UPLOADS_PUBLIC_PREFIX = '/uploads';

/** Create the uploads directories if they don't exist yet */
export function ensureUploadsDir(): void {
  fs.mkdirSync(LEAGUE_LOGOS_DIR, { recursive: true });
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const ALLOWED_IMAGE_MIMES = Object.keys(MIME_EXTENSIONS);

export function extensionForMime(mime: string): string {
  return MIME_EXTENSIONS[mime] ?? 'jpg';
}
