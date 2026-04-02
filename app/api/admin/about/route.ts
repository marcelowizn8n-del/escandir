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
    let about = await prisma.aboutPage.findFirst();
    if (!about) {
      about = await prisma.aboutPage.create({
        data: { biography: '', photoUrls: [], photoKeys: [], poemTitle: '', poemText: '' },
      });
    }
    return NextResponse.json(about);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await checkAdmin())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await request.json();
    let about = await prisma.aboutPage.findFirst();
    if (!about) {
      about = await prisma.aboutPage.create({
        data: {
          biography: body?.biography ?? '',
          photoUrls: body?.photoUrls ?? [],
          photoKeys: body?.photoKeys ?? [],
          poemTitle: body?.poemTitle ?? '',
          poemText: body?.poemText ?? '',
        },
      });
    } else {
      about = await prisma.aboutPage.update({
        where: { id: about.id },
        data: {
          biography: body?.biography,
          photoUrls: body?.photoUrls,
          photoKeys: body?.photoKeys,
          poemTitle: body?.poemTitle,
          poemText: body?.poemText,
        },
      });
    }
    return NextResponse.json(about);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar página Sobre' }, { status: 500 });
  }
}
