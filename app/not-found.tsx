'use client';
import Link from 'next/link';
import { Feather } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Feather className="w-16 h-16 text-gold/40 mx-auto mb-6" />
        <h1 className="font-playfair text-4xl text-navy mb-4">Página não encontrada</h1>
        <p className="text-navy/50 mb-8 font-crimson text-lg">Os versos que você procura não estão aqui.</p>
        <Link href="/" className="inline-flex px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all">
          Voltar ao Início
        </Link>
      </motion.div>
    </div>
  );
}
