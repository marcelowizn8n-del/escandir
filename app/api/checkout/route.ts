export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2024-06-20' as any });

export async function POST(request: Request) {
  try {
    const { items, customer, addressZip, shipping } = await request.json();
    const origin = request.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    if (!items?.length || !customer?.name || !customer?.email || !addressZip || !shipping) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Fetch books from DB
    const bookIds = items?.map((i: any) => i?.bookId)?.filter(Boolean) ?? [];
    const books = await prisma.book.findMany({ where: { id: { in: bookIds } } });

    if (books?.length !== bookIds?.length) {
      return NextResponse.json({ error: 'Livro(s) não encontrado(s)' }, { status: 400 });
    }

    // Check stock
    for (const item of items ?? []) {
      const book = books?.find((b: any) => b?.id === item?.bookId);
      if (!book || (book?.stock ?? 0) < (item?.quantity ?? 0)) {
        return NextResponse.json({ error: `Estoque insuficiente para ${book?.title ?? 'livro'}` }, { status: 400 });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const lineItems: any[] = [];

    for (const item of items ?? []) {
      const book = books?.find((b: any) => b?.id === item?.bookId);
      if (!book) continue;
      const qty = item?.quantity ?? 1;
      subtotal += (book?.price ?? 0) * qty;
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: { name: book?.title ?? 'Livro' },
          unit_amount: Math.round((book?.price ?? 0) * 100),
        },
        quantity: qty,
      });
    }

    // Add shipping as line item
    const shippingCost = Number(shipping?.price ?? 0);
    lineItems.push({
      price_data: {
        currency: 'brl',
        product_data: { name: `Frete ${shipping?.name ?? ''}` },
        unit_amount: Math.round(shippingCost * 100),
      },
      quantity: 1,
    });

    const total = subtotal + shippingCost;

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        customerName: customer?.name ?? '',
        customerEmail: customer?.email ?? '',
        customerPhone: customer?.phone ?? '',
        addressStreet: customer?.street ?? '',
        addressNumber: customer?.number ?? '',
        addressComplement: customer?.complement ?? '',
        addressNeighborhood: customer?.neighborhood ?? '',
        addressCity: customer?.city ?? '',
        addressState: customer?.state ?? '',
        addressZip: addressZip ?? '',
        shippingCost,
        shippingMethod: shipping?.name ?? '',
        subtotal,
        total,
        status: 'pending',
        items: {
          create: (items ?? []).map((i: any) => {
            const book = books?.find((b: any) => b?.id === i?.bookId);
            return {
              bookId: i?.bookId,
              quantity: i?.quantity ?? 1,
              price: book?.price ?? 0,
            };
          }),
        },
      },
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/loja/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/loja/cancelado`,
      customer_email: customer?.email ?? '',
      metadata: { orderId: order?.id ?? '' },
    });

    // Update order with stripe session
    await prisma.order.update({
      where: { id: order?.id },
      data: { stripeSessionId: session?.id ?? '' },
    });

    return NextResponse.json({ url: session?.url ?? '' });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
