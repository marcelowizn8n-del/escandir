export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { buildStoragePath } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { fileName, contentType } = await request.json();
    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Arquivo e tipo são obrigatórios' }, { status: 400 });
    }
    // Mantém o mesmo contrato do fluxo antigo (S3), mas o upload agora vai pro disco da VPS:
    // o cliente faz PUT do arquivo para esta URL no próprio servidor.
    const cloud_storage_path = buildStoragePath(fileName);
    const uploadUrl = `/api/upload/put?path=${encodeURIComponent(cloud_storage_path)}`;
    return NextResponse.json({ uploadUrl, cloud_storage_path });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de upload' }, { status: 500 });
  }
}
