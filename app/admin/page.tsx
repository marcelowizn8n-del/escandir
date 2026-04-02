'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Feather, BookOpen, ShoppingBag, User, Package, LogOut, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.replace('/admin/login');
    }
    if (mounted && status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [status, mounted, session, router]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (status !== 'authenticated' || (session?.user as any)?.role !== 'admin') {
    return null;
  }

  const menuItems = [
    { href: '/admin/poemas', label: 'Gerenciar Poemas', icon: Feather, description: 'Adicionar, editar e publicar poemas' },
    { href: '/admin/livros', label: 'Gerenciar Livros', icon: BookOpen, description: 'Configurar livros para venda' },
    { href: '/admin/sobre', label: 'Página Sobre', icon: User, description: 'Editar biografia e fotos' },
    { href: '/admin/pedidos', label: 'Pedidos', icon: Package, description: 'Visualizar pedidos recebidos' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Feather className="w-6 h-6 text-gold" />
            <span className="font-playfair text-xl">Painel Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">Ver Site</Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-playfair text-3xl text-navy mb-2">Bem-vindo ao Painel</h1>
        <p className="text-navy/50 mb-10">Gerencie o conteúdo do site</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {menuItems?.map((item: any, i: number) => {
            const Icon = item?.icon;
            return (
              <motion.div
                key={item?.href ?? i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={item?.href ?? '#'}
                  className="group block bg-white rounded-lg shadow-sm hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-start gap-4">
                    {Icon && <div className="p-3 bg-gold/10 rounded-lg group-hover:bg-gold/20 transition-colors"><Icon className="w-6 h-6 text-gold" /></div>}
                    <div>
                      <h3 className="font-semibold text-navy text-lg mb-1">{item?.label}</h3>
                      <p className="text-sm text-navy/50">{item?.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
