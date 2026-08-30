'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { submitPaymentReference, type PaymentState } from '@/lib/actions/register';
import { rupees } from '@/lib/format';

const initial: PaymentState = { ok: false };

function SubmitRef() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn--primary" type="submit" disabled={pending}>
      {pending ? 'Submitting…' : 'Submit reference'}
    </button>
  );
}

/**
 * Step 3 — pay and prove it.
 *
 * Two routes to the same place: a UPI transaction reference typed in, or a
 * screenshot uploaded. Either one moves the registration to `pending_review`
 * for Finance to verify.
 */
export function PaymentPanel({
  reference,
  fee,
  upiConfigured,
}: {
  reference: string;
  fee: number;
  upiConfigured: boolean;
}) {
  const [method, setMethod] = useState<'reference' | 'screenshot'>('reference');
  const [state, formAction] = useActionState(submitPaymentReference, initial);

  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<{ busy: boolean; error?: string; done?: string }>({
    busy: false,
  });
  const fileInput = useRef<HTMLInputElement>(null);

  const settled = state.ok || !!uploadState.done;

  async function upload() {
    if (!file) {
      setUploadState({ busy: false, error: 'Choose a screenshot first.' });
      return;
    }
    setUploadState({ busy: true });

    const body = new FormData();
    body.set('ref', reference);
    body.set('file', file);

    try {
      const response = await fetch('/api/proof', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed.');
      setUploadState({ busy: false, done: data.message });
    } catch (error) {
      setUploadState({ busy: false, error: (error as Error).message });
    }
  }

  if (settled) {
    return (
      <div className="seal">
        <div className="seal__ring" aria-hidden="true">✓</div>
        <h2 className="section-title">You are one step from a confirmed seat</h2>
        <p style={{ maxWidth: 520, color: 'var(--text-70)', lineHeight: 1.7 }}>
          {state.message || uploadState.done}
        </p>
        <div className="ref-badge">
          <span className="ref-badge__label">DELEGATE REFERENCE</span>
          <span className="ref-badge__value" translate="no">{reference}</span>
        </div>
        <div className="row-actions">
          <Link className="btn btn--primary" href="/dashboard">
            Go to your dashboard
          </Link>
          <Link className="btn btn--ghost btn--sm" href="/forms">
            Read the mandatory forms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="form-panel">
      <div className="form-panel__head">
        <p className="label label--accent">STEP 03</p>
        <span className="form-panel__rule" aria-hidden="true" />
      </div>
      <h2>Pay and confirm</h2>
      <p className="form-panel__lede">
        Your place is held while Finance verifies payment. Reference{' '}
        <b style={{ color: 'var(--gold)' }}>{reference}</b>: keep it, you need it at check-in.
      </p>

      <div className="pay-grid">
        <div>
          {upiConfigured ? (
            <>
              <div className="qr-plate">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/upi-qr?amount=${fee}&ref=${encodeURIComponent(reference)}`}
                  alt={`UPI QR code to pay ${rupees(fee)} for registration ${reference}`}
                  width={240}
                  height={240}
                />
              </div>
              <p className="label" style={{ marginTop: 14, textAlign: 'center' }}>
                SCAN WITH ANY UPI APP
              </p>
            </>
          ) : (
            <div className="alert" data-tone="info">
              <span className="alert__mark" aria-hidden="true">i</span>
              <span>Bank and UPI details are published with the conference announcement.</span>
            </div>
          )}

          <div className="fee-summary" style={{ marginTop: 20, position: 'static' }}>
            <div className="fee-summary__rows">
              <div className="fee-line fee-line--total">
                <span>Amount due</span>
                <span>{rupees(fee)}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="label" style={{ marginBottom: 14 }}>
            THEN TELL US HOW YOU PAID
          </p>

          <div className="pay-method">
            <label className="pay-option" data-selected={method === 'reference'}>
              <input
                type="radio"
                name="method"
                checked={method === 'reference'}
                onChange={() => setMethod('reference')}
              />
              <span>
                <span className="pay-option__title">UPI transaction reference</span>
                <span className="pay-option__note">
                  The 12-digit UTR or reference your payment app shows after the transfer.
                </span>
              </span>
            </label>

            <label className="pay-option" data-selected={method === 'screenshot'}>
              <input
                type="radio"
                name="method"
                checked={method === 'screenshot'}
                onChange={() => setMethod('screenshot')}
              />
              <span>
                <span className="pay-option__title">Payment screenshot</span>
                <span className="pay-option__note">JPG, PNG, HEIC or PDF, up to 5 MB.</span>
              </span>
            </label>
          </div>

          {method === 'reference' ? (
            <form action={formAction} className="form" style={{ marginTop: 22 }}>
              <input type="hidden" name="ref" value={reference} />

              {state.message && !state.ok && (
                <div className="alert" data-tone="error" role="alert">
                  <span className="alert__mark" aria-hidden="true">!</span>
                  <span>{state.message}</span>
                </div>
              )}

              <label className="field">
                <span className="field__label">
                  Transaction reference <span className="req" aria-hidden="true">*</span>
                </span>
                <input
                  className="input"
                  name="upiTxnId"
                  placeholder="e.g. 402913476621"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  aria-invalid={!!state.errors?.upiTxnId}
                />
                {state.errors?.upiTxnId && (
                  <span className="field__error">{state.errors.upiTxnId}</span>
                )}
              </label>

              <div className="form-actions">
                <SubmitRef />
                <span className="form-note">VERIFIED WITHIN 48 HOURS</span>
              </div>
            </form>
          ) : (
            <div style={{ marginTop: 22 }}>
              {uploadState.error && (
                <div className="alert" data-tone="error" role="alert" style={{ marginBottom: 16 }}>
                  <span className="alert__mark" aria-hidden="true">!</span>
                  <span>{uploadState.error}</span>
                </div>
              )}

              <label className="upload-drop" data-has-file={!!file}>
                <span>{file ? file.name : 'Tap to choose a screenshot of your payment'}</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <div className="form-actions" style={{ marginTop: 18 }}>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={upload}
                  disabled={uploadState.busy}
                >
                  {uploadState.busy ? 'Uploading…' : 'Upload proof'}
                </button>
                <span className="form-note">VERIFIED WITHIN 48 HOURS</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
