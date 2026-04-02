export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import SobreClient from './sobre-client';

export default async function SobrePage() {
  const about = await prisma.aboutPage.findFirst().catch(() => null);
  return <SobreClient about={about ? JSON.parse(JSON.stringify(about)) : null} />;
}
