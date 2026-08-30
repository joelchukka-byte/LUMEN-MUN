export const dynamic = 'force-dynamic';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, registrations } from '@/db';
import { currentStaff, currentDelegate, atLeast } from '@/lib/auth';

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.pdf': 'application/pdf',
};

/**
 * Serves a payment screenshot.
 *
 * Proofs live outside /public so they are never publicly reachable. Access is
 * limited to staff who review payments, and to the delegate who uploaded it.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  // Reject anything that is not a filename this app generated.
  if (!/^(LM1|LMD)-[0-9A-Z]{5}-[0-9a-f]{12}\.(jpg|png|webp|heic|pdf)$/.test(file)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [staff, delegate] = await Promise.all([currentStaff(), currentDelegate()]);

  let permitted = !!staff && atLeast(staff.role, 'admin');

  if (!permitted && delegate) {
    const [row] = await db
      .select({ proofFile: registrations.proofFile })
      .from(registrations)
      .where(eq(registrations.ref, delegate.ref))
      .limit(1);
    permitted = row?.proofFile === file;
  }

  if (!permitted) return NextResponse.json({ error: 'Not permitted' }, { status: 403 });

  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

  try {
    // The upload directory is operator-configured, so the path cannot be static.
    // The filename is already validated against a strict pattern above.
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ dir, file));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
