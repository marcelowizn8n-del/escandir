export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-06-20' as any });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams?.get('session_id') ?? '';
    if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session?.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const orderId = session?.metadata?.orderId ?? '';
    if (!orderId) return NextResponse.json({ error: 'Order not found' }, { status: 400 });

    // Update order status
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        stripePaymentId: session?.payment_intent as string ?? '',
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
          <h3 style="color:#1a365d;">Endere\u00e7o de Entrega</h3>
          <p>${order?.addressStreet ?? ''}, ${order?.addressNumber ?? ''} ${order?.addressComplement ?? ''}<br/>
          ${order?.addressNeighborhood ?? ''} - ${order?.addressCity ?? ''}/${order?.addressState ?? ''}<br/>
          CEP: ${order?.addressZip ?? ''}</p>
          <h3 style="color:#1a365d;">Itens</h3>
          <table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#1a365d;color:white;"><th style="padding:8px;text-align:left;">Livro</th><th style="padding:8px;">Qtd</th><th style="padding:8px;">Pre\u00e7o</th></tr></thead><tbody>${itemsList}</tbody></table>
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

    return NextResponse.json({ success: true, orderId: order?.id });
  } catch (error: any) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Erro ao confirmar pagamento' }, { status: 500 });
  }
}
