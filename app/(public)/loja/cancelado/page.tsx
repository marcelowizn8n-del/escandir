'use client';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function CanceladoPage() {
  return (
    <div className="py-32 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center bg-white rounded-lg shadow-md p-12">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
        <h1 className="font-playfair text-3xl text-navy mb-4">Pagamento Cancelado</h1>
        <p className="font-crimson text-navy/60 text-lg mb-8">O pagamento foi cancelado. Seu carrinho ainda está salvo.</p>
        <Link href="/loja" className="inline-flex px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all">
          Voltar à Loja
        </Link>
      </motion.div>
    </div>
  );
}
