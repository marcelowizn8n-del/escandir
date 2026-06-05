export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';
import { sendOrderNotification } from '@/lib/email';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '' });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mercado Pago sends different notification types
    if (body?.type === 'payment' || body?.action === 'payment.updated') {
      const paymentId = body?.data?.id;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Fetch payment details from Mercado Pago
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData?.status === 'approved') {
        const orderId = paymentData?.external_reference ?? '';
        if (!orderId) {
          console.error('Webhook: no external_reference in payment');
          return NextResponse.json({ received: true });
        }

        // Check if already processed
        const existing = await prisma.order.findUnique({ where: { id: orderId } });
        if (existing?.status === 'paid') {
          return NextResponse.json({ received: true });
        }

        // Update order status
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'paid',
            mpPaymentId: String(paymentId),
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
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
