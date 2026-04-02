'use client';
import { motion } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function SucessoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get?.('order_id') ?? '';
  const paymentId = searchParams?.get?.('payment_id') ?? '';
  const status = searchParams?.get?.('status') ?? '';
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (orderId) {
      const params = new URLSearchParams();
      params.set('order_id', orderId);
      if (paymentId) params.set('payment_id', paymentId);
      if (status) params.set('status', status);

      fetch(`/api/checkout/confirm?${params.toString()}`)
        .then((r: any) => r?.json?.())
        .then((data: any) => {
          if (data?.success) setConfirmed(true);
          else if (data?.status === 'pending') setPending(true);
          else setConfirmed(true);
        })
        .catch((e: any) => console.error(e));
    }
  }, [orderId, paymentId, status]);

  if (pending) {
    return (
      <div className="py-32 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center bg-white rounded-lg shadow-md p-12">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="font-playfair text-3xl text-navy mb-4">Pagamento Pendente</h1>
          <p className="font-crimson text-navy/60 text-lg mb-8">Seu pagamento está sendo processado. Você receberá uma confirmação por email assim que for aprovado.</p>
          <Link href="/" className="inline-flex px-6 py-3 bg-navy text-white rounded-lg hover:bg-navy-light transition-all">
            Voltar ao Início
          </Link>
        </motion.div>
      </div>
    );
  }

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
