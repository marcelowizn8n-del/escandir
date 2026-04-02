export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import HomeClient from './home-client';

export default async function HomePage() {
  const featuredPoems = await prisma.poem.findMany({
    where: { published: true, featured: true },
    orderBy: { order: 'asc' },
    take: 3,
  }).catch(() => []);

  const recentPoems = await prisma.poem.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  }).catch(() => []);

  const books = await prisma.book.findMany({
    where: { active: true },
    take: 2,
  }).catch(() => []);

  const about = await prisma.aboutPage.findFirst().catch(() => null);

  const serialized = {
    featuredPoems: JSON.parse(JSON.stringify(featuredPoems ?? [])),
    recentPoems: JSON.parse(JSON.stringify(recentPoems ?? [])),
    books: JSON.parse(JSON.stringify(books ?? [])),
    about: about ? JSON.parse(JSON.stringify(about)) : null,
  };

  return <HomeClient {...serialized} />;
}
