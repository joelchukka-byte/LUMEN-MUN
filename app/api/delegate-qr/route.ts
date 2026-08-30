export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { currentDelegate } from '@/lib/auth';
import { currentStaff } from '@/lib/auth';
import { normaliseRef } from '@/lib/ref';

/**
 * The delegate's check-in QR.
 *
 * Encodes only the reference code — the OC scanner looks the delegate up
 * server-side, so a photographed badge leaks nothing beyond a code that is
 * already printed on it.
 *
 * A delegate may only fetch their own; staff may fetch any (for reprinting a
 * lost badge at the desk).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = normaliseRef(searchParams.get('ref') ?? '');

  const [delegate, staff] = await Promise.all([currentDelegate(), currentStaff()]);

  const allowed = staff ? !!requested : delegate?.ref === requested;
  if (!allowed) {
    return NextResponse.json({ error: 'Not permitted' }, { status: 403 });
  }

  const png = await QRCode.toBuffer(requested, {
    type: 'png',
    width: 560,
    margin: 1,
    errorCorrectionLevel: 'Q',
    color: { dark: '#14090C', light: '#FFFFFF' },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=600',
    },
  });
}
