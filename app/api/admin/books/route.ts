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
    const books = await prisma.book.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(books ?? []);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    const book = await prisma.book.create({
      data: {
        title: body?.title ?? '',
        description: body?.description ?? '',
        price: body?.price ?? 0,
        imageUrl: body?.imageUrl ?? null,
        imageKey: body?.imageKey ?? null,
        stock: body?.stock ?? 0,
        weight: body?.weight ?? 300,
        active: body?.active ?? true,
      },
    });
    return NextResponse.json(book);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar livro' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    if (!body?.id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    const book = await prisma.book.update({
      where: { id: body.id },
      data: {
        title: body?.title,
        description: body?.description,
        price: body?.price,
        imageUrl: body?.imageUrl,
        imageKey: body?.imageKey,
        stock: body?.stock,
        weight: body?.weight,
        active: body?.active,
      },
    });
    return NextResponse.json(book);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar livro' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams?.get('id') ?? '';
    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao deletar livro' }, { status: 500 });
  }
}
