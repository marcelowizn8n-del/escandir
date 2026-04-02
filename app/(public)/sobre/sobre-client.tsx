'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { User, Feather } from 'lucide-react';

interface AboutData {
  biography: string;
  photoUrls: string[];
  poemTitle: string;
  poemText: string;
}

export default function SobreClient({ about }: { about: AboutData | null }) {
  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  if (!about) {
    return (
      <div className="py-32 px-4 text-center">
        <User className="w-16 h-16 text-gold/40 mx-auto mb-6" />
        <h1 className="font-playfair text-3xl text-navy mb-4">Sobre o Poeta</h1>
        <p className="font-crimson text-navy/50 text-lg">Em breve, a história do poeta será contada aqui.</p>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-[1200px] mx-auto">
        <motion.div {...fadeUp} className="text-center mb-12">
          <User className="w-10 h-10 text-gold mx-auto mb-4" />
          <h1 className="font-playfair text-3xl sm:text-4xl text-navy mb-3">Sobre o Poeta</h1>
          <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
        </motion.div>

        {/* Photo Gallery */}
        {(about?.photoUrls?.length ?? 0) > 0 && (
          <motion.div {...fadeUp} className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {about?.photoUrls?.map((url: string, i: number) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-md">
                  <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Biography */}
        <motion.div {...fadeUp} className="max-w-3xl mx-auto mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12">
            <div className="font-crimson text-lg text-navy/70 leading-relaxed whitespace-pre-line">
              {about?.biography}
            </div>
          </div>
        </motion.div>

        {/* Poem about the poet */}
        {about?.poemText && (
          <motion.div {...fadeUp} className="max-w-2xl mx-auto">
            <div className="bg-navy rounded-lg p-8 sm:p-12 text-center">
              <Feather className="w-8 h-8 text-gold mx-auto mb-4" />
              {about?.poemTitle && (
                <h3 className="font-playfair text-2xl text-white mb-6">{about.poemTitle}</h3>
              )}
              <div className="poem-text text-white/80 text-lg">
                {about.poemText}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
