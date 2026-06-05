export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import fs from 'fs/promises';
import { resolveInsideUploadDir, ensureUploadDir } from '@/lib/storage';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get('path') ?? '';
    const full = resolveInsideUploadDir(relPath);
    if (!full) {
      return NextResponse.json({ error: 'Caminho inválido' }, { status: 400 });
    }

    await ensureUploadDir();
    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 });
    }
    await fs.writeFile(full, buffer);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Upload PUT error:', error?.message ?? error);
    return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 });
  }
}
