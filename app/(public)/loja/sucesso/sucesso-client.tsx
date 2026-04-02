'use client';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SucessoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get?.('session_id') ?? '';
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/checkout/confirm?session_id=${sessionId}`)
        .then((r: any) => r?.json?.())
        .then(() => setConfirmed(true))
        .catch((e: any) => console.error(e));
    }
  }, [sessionId]);

  return (
    <div className="py-32 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center bg-white rounded-lg shadow-md p-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="font-playfair text-3xl text-navy mb-4">Compra Realizada!</h1>
        <p className="font-crimson text-navy/60 text-lg mb-8">Obrigado pela sua compra. Você receberá um email com os detalhes do pedido.</p>
        <Link href="/" className="inline-flex px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all">
          Voltar ao Início
        </Link>
      </motion.div>
    </div>
  );
}

export default function SucessoClient() {
  return (
    <Suspense fallback={<div className="py-32 text-center text-navy/40">Carregando...</div>}>
      <SucessoContent />
    </Suspense>
  );
}
