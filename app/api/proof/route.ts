export const dynamic = 'force-dynamic';

import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, registrations } from '@/db';
import { writeAudit } from '@/lib/audit';

/**
 * Payment-proof upload.
 *
 * Files are written to ./uploads (outside /public, so they are never served
 * statically) and only the generated filename is stored on the registration.
 * Reading one back goes through /api/proof/[file], which checks the caller is
 * either the owning delegate or staff.
 *
 * NOTE FOR DEPLOYMENT: this needs a persistent disk. On a platform with an
 * ephemeral filesystem, point UPLOAD_DIR at a mounted volume or swap this
 * handler for Supabase Storage — the rest of the flow is unchanged.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/heic', 'heic'],
  ['application/pdf', 'pdf'],
]);

export async function POST(request: Request) {
  const form = await request.formData();
  const ref = String(form.get('ref') ?? '').trim();
  const file = form.get('file');

  if (!ref || !(file instanceof File)) {
    return NextResponse.json({ error: 'A reference and a file are required.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That file is larger than 5 MB.' }, { status: 413 });
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: 'Upload a JPG, PNG, WebP, HEIC or PDF.' },
      { status: 415 }
    );
  }

  const [row] = await db.select().from(registrations).where(eq(registrations.ref, ref)).limit(1);
  if (!row) {
    return NextResponse.json({ error: 'We could not find that registration.' }, { status: 404 });
  }

  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
  await mkdir(dir, { recursive: true });

  const filename = `${ref}-${randomBytes(6).toString('hex')}.${extension}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  await db
    .update(registrations)
    .set({
      proofFile: filename,
      payMethod: 'screenshot',
      status: 'pending_review',
      reviewNote: null,
      updatedAt: new Date(),
    })
    .where(eq(registrations.ref, ref));

  await writeAudit({
    actor: ref,
    role: 'delegate',
    action: 'payment.screenshot',
    target: ref,
    detail: filename,
  });

  return NextResponse.json({
    ok: true,
    message:
      'Screenshot received. Finance verifies within 48 hours and you will get an email either way.',
  });
}
