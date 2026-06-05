import nodemailer from 'nodemailer';

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASS ausentes); email não será enviado.');
    return null;
  }

  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true para 465 (SSL), false para 587/25 (STARTTLS)
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

/**
 * Envia o email de notificação de novo pedido para o administrador da loja.
 * Não lança erro: falhas são logadas para não interromper o fluxo de pagamento.
 */
export async function sendOrderNotification(order: any): Promise<void> {
  try {
    const transporter = getTransporter();
    if (!transporter) return;

    const itemsList = (order?.items ?? []).map((i: any) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i?.book?.title ?? 'Livro'}</td><td style="padding:8px;border-bottom:1px solid #eee;">${i?.quantity ?? 0}</td><td style="padding:8px;border-bottom:1px solid #eee;">R$ ${(i?.price ?? 0)?.toFixed?.(2) ?? '0.00'}</td></tr>`
    ).join('');

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

    const recipient = process.env.ORDER_NOTIFICATION_EMAIL || process.env.SMTP_USER || '';
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

    await transporter.sendMail({
      from,
      to: recipient,
      subject: `Novo Pedido #${order?.id?.slice(-6)?.toUpperCase() ?? ''} - ${order?.customerName ?? ''}`,
      html: htmlBody,
    });
  } catch (emailErr: any) {
    console.error('Email notification failed:', emailErr?.message ?? emailErr);
  }
}
