'use client';
import Link from 'next/link';
import { Feather, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy text-white/80 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Feather className="w-5 h-5 text-gold" />
            <span className="font-playfair text-lg text-white">Poeta</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/poemas" className="hover:text-gold transition-colors">Poemas</Link>
            <Link href="/sobre" className="hover:text-gold transition-colors">Sobre</Link>
            <Link href="/loja" className="hover:text-gold transition-colors">Livros</Link>
          </nav>
          <p className="text-xs text-white/50 flex items-center gap-1">
            Feito com <Heart className="w-3 h-3 text-gold" /> para a poesia
          </p>
        </div>
      </div>
    </footer>
  );
}
