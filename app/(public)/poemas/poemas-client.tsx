'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Volume2, Play, Search } from 'lucide-react';
import { useState } from 'react';

interface Poem {
  id: string;
  title: string;
  text: string;
  imageUrl: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
}

export default function PoemasClient({ poems }: { poems: Poem[] }) {
  const [search, setSearch] = useState('');
  const filtered = (poems ?? []).filter((p: Poem) =>
    (p?.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p?.text ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="py-12 px-4">
      <div className="max-w-[1200px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <BookOpen className="w-10 h-10 text-gold mx-auto mb-4" />
          <h1 className="font-playfair text-3xl sm:text-4xl text-navy mb-3">Galeria de Poemas</h1>
          <p className="font-crimson text-navy/60 text-lg max-w-lg mx-auto">Explore os versos e ouça as declamações</p>
        </motion.div>

        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/30" />
            <input
              type="text"
              placeholder="Buscar poema..."
              value={search}
              onChange={(e: any) => setSearch(e?.target?.value ?? '')}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-navy/10 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all text-navy"
            />
          </div>
        </div>

        {filtered?.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-crimson text-navy/40 text-lg">Nenhum poema encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((poem: Poem, i: number) => (
              <motion.div
                key={poem?.id ?? i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link href={`/poemas/${poem?.id}`} className="group block h-full">
                  <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all p-5 h-full flex flex-col">
                    {poem?.imageUrl && (
                      <div className="relative aspect-[3/2] mb-4 rounded overflow-hidden bg-gray-100">
                        <Image src={poem.imageUrl} alt={poem?.title ?? 'Poema'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <h3 className="font-playfair text-xl text-navy mb-3 group-hover:text-gold transition-colors">{poem?.title}</h3>
                    <p className="font-crimson text-navy/50 line-clamp-4 flex-1">{poem?.text?.slice(0, 150) ?? ''}</p>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-navy/5">
                      {poem?.audioUrl && (
                        <span className="flex items-center gap-1 text-xs text-gold">
                          <Volume2 className="w-3.5 h-3.5" /> Áudio
                        </span>
                      )}
                      {poem?.videoUrl && (
                        <span className="flex items-center gap-1 text-xs text-gold">
                          <Play className="w-3.5 h-3.5" /> Vídeo
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
