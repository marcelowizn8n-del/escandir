export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { prisma } from '@/lib/prisma';

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '' });

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
    const mpItems: any[] = [];

    for (const item of items ?? []) {
      const book = books?.find((b: any) => b?.id === item?.bookId);
      if (!book) continue;
      const qty = item?.quantity ?? 1;
      subtotal += (book?.price ?? 0) * qty;
      mpItems.push({
        id: book?.id,
        title: book?.title ?? 'Livro',
        quantity: qty,
        unit_price: book?.price ?? 0,
        currency_id: 'BRL',
      });
    }

    // Add shipping as item
    const shippingCost = Number(shipping?.price ?? 0);
    mpItems.push({
      id: 'shipping',
      title: `Frete ${shipping?.name ?? ''}`,
      quantity: 1,
      unit_price: shippingCost,
      currency_id: 'BRL',
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

    // Create Mercado Pago preference
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          name: customer?.name ?? '',
          email: customer?.email ?? '',
        },
        back_urls: {
          success: `${origin}/loja/sucesso?order_id=${order?.id}`,
          failure: `${origin}/loja/cancelado`,
          pending: `${origin}/loja/sucesso?order_id=${order?.id}&status=pending`,
        },
        auto_return: 'approved',
        external_reference: order?.id ?? '',
        notification_url: `${origin}/api/checkout/webhook`,
      },
    });

    // Update order with MP preference id
    await prisma.order.update({
      where: { id: order?.id },
      data: { mpPreferenceId: result?.id ?? '' },
    });

    return NextResponse.json({ url: result?.init_point ?? '' });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Erro ao processar checkout' }, { status: 500 });
  }
}
