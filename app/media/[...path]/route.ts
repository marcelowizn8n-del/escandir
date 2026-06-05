export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import fsp from 'fs/promises';
import { Readable } from 'stream';
import { resolveInsideUploadDir, contentTypeFor } from '@/lib/storage';

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  const relPath = (params?.path ?? []).join('/');
  const full = resolveInsideUploadDir(relPath);
  if (!full) {
    return new NextResponse('Not found', { status: 404 });
  }

  let stat: fs.Stats;
  try {
    stat = await fsp.stat(full);
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
  if (!stat.isFile()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const contentType = contentTypeFor(full);
  const rangeHeader = request.headers.get('range');

  // Requisição com Range (vídeo/áudio buscando posição) -> 206 Partial Content
  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    let start = match && match[1] ? parseInt(match[1], 10) : 0;
    let end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
    if (isNaN(start)) start = 0;
    if (isNaN(end) || end >= stat.size) end = stat.size - 1;
    if (start > end || start >= stat.size) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${stat.size}` },
      });
    }
    const nodeStream = fs.createReadStream(full, { start, end });
    return new NextResponse(Readable.toWeb(nodeStream) as any, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  const nodeStream = fs.createReadStream(full);
  return new NextResponse(Readable.toWeb(nodeStream) as any, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(stat.size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
