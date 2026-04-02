'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, BookOpen, Feather, User, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Início', icon: Feather },
  { href: '/poemas', label: 'Poemas', icon: BookOpen },
  { href: '/sobre', label: 'Sobre', icon: User },
  { href: '/loja', label: 'Livros', icon: ShoppingBag },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-navy/5">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Feather className="w-6 h-6 text-gold transition-transform group-hover:rotate-12" />
            <span className="font-playfair text-xl text-navy font-bold">Poeta</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks?.map((link: any) => {
              const Icon = link?.icon;
              return (
                <Link
                  key={link?.href}
                  href={link?.href ?? '/'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-navy/70 hover:text-navy hover:bg-navy/5 transition-all"
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link?.label}
                </Link>
              );
            })}
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-navy/5 text-navy"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-cream border-b border-navy/5"
          >
            <nav className="px-4 py-3 space-y-1">
              {navLinks?.map((link: any) => {
                const Icon = link?.icon;
                return (
                  <Link
                    key={link?.href}
                    href={link?.href ?? '/'}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-navy/70 hover:text-navy hover:bg-navy/5 transition-all"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {link?.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
