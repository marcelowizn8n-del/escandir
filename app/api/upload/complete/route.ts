export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { cloud_storage_path } = await request.json();
    if (!cloud_storage_path) {
      return NextResponse.json({ error: 'cloud_storage_path é obrigatório' }, { status: 400 });
    }
    // Servido pela rota /media/[...path] (lê do disco da VPS).
    const url = `/media/${encodeURIComponent(cloud_storage_path)}`;
    return NextResponse.json({ url, cloud_storage_path });
  } catch (error: any) {
    console.error('Upload complete error:', error);
    return NextResponse.json({ error: 'Erro ao completar upload' }, { status: 500 });
  }
}
