export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PoemDetailClient from './poem-detail-client';

export default async function PoemPage({ params }: { params: { id: string } }) {
  const poem = await prisma.poem.findUnique({
    where: { id: params?.id, published: true },
  }).catch(() => null);

  if (!poem) notFound();

  return <PoemDetailClient poem={JSON.parse(JSON.stringify(poem))} />;
}
