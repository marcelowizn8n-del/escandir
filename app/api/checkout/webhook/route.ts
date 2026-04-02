export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { prisma } from '@/lib/prisma';

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
        try {
          const itemsList = (order?.items ?? []).map((i: any) =>
            `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i?.book?.title ?? 'Livro'}</td><td style="padding:8px;border-bottom:1px solid #eee;">${i?.quantity ?? 0}</td><td style="padding:8px;border-bottom:1px solid #eee;">R$ ${(i?.price ?? 0)?.toFixed?.(2) ?? '0.00'}</td></tr>`
          ).join('');

          const appUrl = process.env.NEXTAUTH_URL || '';
          const appName = appUrl ? new URL(appUrl).hostname.split('.')[0] : 'Poeta';

          const htmlBody = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#1a365d;border-bottom:3px solid #c9a84c;padding-bottom:10px;">Novo Pedido de Livro!</h2>
              <div style="background:#faf8f3;padding:20px;border-radius:8px;margin:20px 0;">
                <p><strong>Cliente:</strong> ${order?.customerName ?? ''}</p>
                <p><strong>Email:</strong> ${order?.customerEmail ?? ''}</p>
                <p><strong>Telefone:</strong> ${order?.customerPhone ?? ''}</p>
              </div>
              <h3 style="color:#1a365d;">Endereço de Entrega</h3>
              <p>${order?.addressStreet ?? ''}, ${order?.addressNumber ?? ''} ${order?.addressComplement ?? ''}<br/>
              ${order?.addressNeighborhood ?? ''} - ${order?.addressCity ?? ''}/${order?.addressState ?? ''}<br/>
              CEP: ${order?.addressZip ?? ''}</p>
              <h3 style="color:#1a365d;">Itens</h3>
              <table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1a365d;color:white;"><th style="padding:8px;text-align:left;">Livro</th><th style="padding:8px;">Qtd</th><th style="padding:8px;">Preço</th></tr></thead><tbody>${itemsList}</tbody></table>
              <div style="margin-top:15px;padding:15px;background:#f5f0e8;border-radius:8px;">
                <p><strong>Frete (${order?.shippingMethod ?? ''}):</strong> R$ ${order?.shippingCost?.toFixed?.(2) ?? '0.00'}</p>
                <p style="font-size:18px;"><strong>Total: R$ ${order?.total?.toFixed?.(2) ?? '0.00'}</strong></p>
              </div>
            </div>
          `;

          await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deployment_token: process.env.ABACUSAI_API_KEY,
              app_id: process.env.WEB_APP_ID,
              notification_id: process.env.NOTIF_ID_NOVO_PEDIDO_DE_LIVRO,
              subject: `Novo Pedido #${order?.id?.slice(-6)?.toUpperCase() ?? ''} - ${order?.customerName ?? ''}`,
              body: htmlBody,
              is_html: true,
              recipient_email: 'marcelowiz@gmail.com',
              sender_email: appUrl ? `noreply@${new URL(appUrl).hostname}` : undefined,
              sender_alias: appName,
            }),
          });
        } catch (emailErr: any) {
          console.error('Email notification failed:', emailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
