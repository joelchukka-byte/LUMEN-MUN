export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

/**
 * Renders the UPI payment QR for a registration.
 *
 * Encodes a standard UPI intent URL so any Indian payment app can read it, with
 * the amount and the delegate's reference pre-filled — which is what makes the
 * transaction traceable back to a seat when Finance reviews it.
 *
 * With no UPI_ID configured this returns 503 and the payment step falls back to
 * "bank details to be announced" rather than showing a QR that goes nowhere.
 */
export async function GET(request: Request) {
  const upiId = process.env.UPI_ID;
  if (!upiId) {
    return NextResponse.json({ error: 'UPI is not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get('amount') || 0);
  const ref = (searchParams.get('ref') || '').replace(/[^A-Z0-9-]/gi, '').slice(0, 20);

  if (!amount || amount <= 0 || !ref) {
    return NextResponse.json({ error: 'amount and ref are required' }, { status: 400 });
  }

  const payee = process.env.UPI_PAYEE_NAME || 'LUMEN MUN';
  const intent =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(payee)}` +
    `&am=${amount.toFixed(2)}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(`LUMEN MUN ${ref}`)}`;

  const png = await QRCode.toBuffer(intent, {
    type: 'png',
    width: 640,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#14090C', light: '#FFFFFF' },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Per-delegate and per-amount, so it can be cached hard but never shared.
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
