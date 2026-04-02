export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import LojaClient from './loja-client';

export default async function LojaPage() {
  const books = await prisma.book.findMany({
    where: { active: true },
    orderBy: { createdAt: 'asc' },
  }).catch(() => []);
  return <LojaClient books={JSON.parse(JSON.stringify(books ?? []))} />;
}
