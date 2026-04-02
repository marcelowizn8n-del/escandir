export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user && (session?.user as any)?.role === 'admin';
}

export async function GET() {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const poems = await prisma.poem.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json(poems ?? []);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const poem = await prisma.poem.create({
      data: {
        title: body?.title ?? '',
        text: body?.text ?? '',
        audioUrl: body?.audioUrl ?? null,
        audioKey: body?.audioKey ?? null,
        videoUrl: body?.videoUrl ?? null,
        videoKey: body?.videoKey ?? null,
        imageUrl: body?.imageUrl ?? null,
        imageKey: body?.imageKey ?? null,
        published: body?.published ?? false,
        featured: body?.featured ?? false,
        order: body?.order ?? 0,
      },
    });
    return NextResponse.json(poem);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar poema' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    if (!body?.id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    const poem = await prisma.poem.update({
      where: { id: body.id },
      data: {
        title: body?.title,
        text: body?.text,
        audioUrl: body?.audioUrl,
        audioKey: body?.audioKey,
        videoUrl: body?.videoUrl,
        videoKey: body?.videoKey,
        imageUrl: body?.imageUrl,
        imageKey: body?.imageKey,
        published: body?.published,
        featured: body?.featured,
        order: body?.order,
      },
    });
    return NextResponse.json(poem);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar poema' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams?.get('id') ?? '';
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    await prisma.poem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao deletar poema' }, { status: 500 });
  }
}
