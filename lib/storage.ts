import path from 'path';
import fs from 'fs/promises';

// Diretório onde os uploads ficam salvos no disco da VPS.
// Fora de `public/` de propósito: são servidos pela rota /media/[...] (sem precisar
// reiniciar o app) e não são versionados pelo git.
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.ogv': 'video/ogg',
  '.pdf': 'application/pdf',
};

export function contentTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

export function sanitizeFileName(name: string): string {
  const cleaned = (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  // mantém a extensão (fica no fim) e limita o tamanho
  return cleaned.slice(-120) || 'file';
}

export function buildStoragePath(fileName: string): string {
  return `${Date.now()}-${sanitizeFileName(fileName)}`;
}

// Resolve um caminho relativo garantindo que fica DENTRO de UPLOAD_DIR (anti path traversal).
export function resolveInsideUploadDir(relPath: string): string | null {
  if (!relPath || relPath.includes('\0')) return null;
  const root = path.resolve(UPLOAD_DIR);
  const full = path.resolve(root, relPath);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
