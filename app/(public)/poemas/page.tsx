export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import PoemasClient from './poemas-client';

export default async function PoemasPage() {
  const poems = await prisma.poem.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  }).catch(() => []);
  return <PoemasClient poems={JSON.parse(JSON.stringify(poems ?? []))} />;
}
