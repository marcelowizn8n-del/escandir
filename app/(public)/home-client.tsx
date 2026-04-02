'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Feather, BookOpen, ArrowRight, Volume2, Play } from 'lucide-react';

interface Poem {
  id: string;
  title: string;
  text: string;
  imageUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
}

interface Book {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
}

interface Props {
  featuredPoems: Poem[];
  recentPoems: Poem[];
  books: Book[];
  about: { biography: string } | null;
}

export default function HomeClient({ featuredPoems, recentPoems, books, about }: Props) {
  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-navy overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark via-navy to-navy-light opacity-90" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 max-w-3xl"
        >
          <Feather className="w-12 h-12 text-gold mx-auto mb-6" />
          <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            Versos que <span className="text-gold">Ecoam</span>
          </h1>
          <p className="font-crimson text-lg sm:text-xl text-white/70 mb-8 max-w-xl mx-auto">
            Uma vida dedicada à poesia. Descubra versos que tocam a alma e transcendem o tempo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/poemas"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold text-navy font-semibold rounded-lg hover:bg-gold-light transition-all shadow-lg hover:shadow-xl"
            >
              <BookOpen className="w-5 h-5" />
              Explorar Poemas
            </Link>
            <Link
              href="/loja"
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
            >
              Adquirir Livros
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Featured Poems */}
      {(featuredPoems?.length ?? 0) > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-[1200px] mx-auto">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="font-playfair text-3xl sm:text-4xl text-navy mb-3">Poemas em Destaque</h2>
              <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPoems?.map((poem: Poem, i: number) => (
                <motion.div
                  key={poem?.id ?? i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <Link href={`/poemas/${poem?.id}`} className="group block">
                    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 h-full">
                      {poem?.imageUrl && (
                        <div className="relative aspect-[3/2] mb-4 rounded overflow-hidden bg-gray-100">
                          <Image src={poem.imageUrl} alt={poem?.title ?? 'Poema'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <h3 className="font-playfair text-xl text-navy mb-3 group-hover:text-gold transition-colors">{poem?.title}</h3>
                      <p className="font-crimson text-navy/60 line-clamp-4 leading-relaxed">
                        {poem?.text?.slice(0, 150) ?? ''}...
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        {poem?.audioUrl && <Volume2 className="w-4 h-4 text-gold" />}
                        {poem?.videoUrl && <Play className="w-4 h-4 text-gold" />}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Poems */}
      {(recentPoems?.length ?? 0) > 0 && (
        <section className="py-20 px-4 bg-warm">
          <div className="max-w-[1200px] mx-auto">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="font-playfair text-3xl sm:text-4xl text-navy mb-3">Poemas Recentes</h2>
              <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPoems?.map((poem: Poem, i: number) => (
                <motion.div
                  key={poem?.id ?? i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Link href={`/poemas/${poem?.id}`} className="group block bg-white/80 backdrop-blur rounded-lg p-5 shadow-sm hover:shadow-lg transition-all">
                    <h3 className="font-playfair text-lg text-navy mb-2 group-hover:text-gold transition-colors">{poem?.title}</h3>
                    <p className="font-crimson text-navy/50 text-sm line-clamp-3">{poem?.text?.slice(0, 100) ?? ''}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/poemas"
                className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all shadow-md"
              >
                Ver Todos os Poemas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Books */}
      {(books?.length ?? 0) > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-[1200px] mx-auto">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="font-playfair text-3xl sm:text-4xl text-navy mb-3">Livros</h2>
              <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {books?.map((book: Book, i: number) => (
                <motion.div
                  key={book?.id ?? i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.2 }}
                >
                  <Link href="/loja" className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden">
                    {book?.imageUrl && (
                      <div className="relative aspect-[2/3] bg-gray-100">
                        <Image src={book.imageUrl} alt={book?.title ?? 'Livro'} fill className="object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-playfair text-xl text-navy mb-2">{book?.title}</h3>
                      <p className="text-navy/50 text-sm line-clamp-2 mb-3">{book?.description}</p>
                      <p className="font-semibold text-gold text-lg">R$ {book?.price?.toFixed?.(2) ?? '0.00'}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when no content */}
      {(featuredPoems?.length ?? 0) === 0 && (recentPoems?.length ?? 0) === 0 && (
        <section className="py-32 px-4">
          <div className="max-w-xl mx-auto text-center">
            <Feather className="w-16 h-16 text-gold/40 mx-auto mb-6" />
            <h2 className="font-playfair text-2xl text-navy mb-4">Os versos estão a caminho</h2>
            <p className="text-navy/50 font-crimson text-lg">
              Em breve, este espaço será preenchido com poemas que tocam a alma.
              Volte em breve para descobrir a poesia.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
