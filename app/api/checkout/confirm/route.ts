export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import { sendOrderNotification } from '@/lib/email';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '' });

async function processOrder(orderId: string, paymentId: string) {
  // Check if already processed
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (existing?.status === 'paid') {
    return existing;
  }

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'paid',
      mpPaymentId: paymentId,
    },
    include: { items: { include: { book: true } } },
  });

  // Update stock
  for (const item of order?.items ?? []) {
    await prisma.book.update({
      where: { id: item?.bookId },
      data: { stock: { decrement: item?.quantity ?? 0 } },
    });
  }

  // Send notification email
  await sendOrderNotification(order);

  return order;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams?.get('order_id') ?? '';
    const paymentId = searchParams?.get('payment_id') ?? '';
    const paymentStatus = searchParams?.get('status') ?? '';

    if (!orderId) return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });

    if (paymentStatus === 'approved' && paymentId) {
      const order = await processOrder(orderId, paymentId);
      return NextResponse.json({ success: true, orderId: order?.id });
    }

    // If status is pending or not approved, just return the order status
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return NextResponse.json({
      success: order?.status === 'paid',
      orderId: order?.id,
      status: order?.status,
    });
  } catch (error: any) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Erro ao confirmar pagamento' }, { status: 500 });
  }
}

