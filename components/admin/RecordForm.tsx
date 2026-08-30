'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionResult } from '@/lib/actions/content';

function SaveButton({ label = 'Save' }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-mini" data-tone="approve" type="submit" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

/**
 * One editable record.
 *
 * A plain form posting to a server action, so it works before hydration and
 * without JavaScript. The only client-side part is showing the result and
 * confirming a delete — feedback the operator needs immediately.
 */
export function RecordForm({
  action,
  onDelete,
  deleteId,
  title,
  subtitle,
  children,
  saveLabel,
  defaultOpen = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  onDelete?: (id: number) => Promise<ActionResult>;
  deleteId?: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  saveLabel?: string;
  defaultOpen?: boolean;
}) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section className="dash-card" style={{ marginBottom: 16 }}>
      <div className="dash-card__head">
        <div>
          <h2 className="dash-card__title">{title}</h2>
          {subtitle && (
            <p className="readout" style={{ marginTop: 6 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="row-actions">
          {result && (
            <span className="pill" data-tone={result.ok ? 'approved' : 'rejected'}>
              {result.ok ? 'Saved' : 'Failed'}
            </span>
          )}
          <button className="btn-mini" type="button" onClick={() => setOpen((v) => !v)}>
            {open ? 'Collapse' : 'Edit'}
          </button>
        </div>
      </div>

      {open && (
        <div className="dash-card__body">
          {result && (
            <div
              className="alert"
              data-tone={result.ok ? 'success' : 'error'}
              role="status"
              style={{ marginBottom: 18 }}
            >
              <span className="alert__mark" aria-hidden="true">{result.ok ? '✓' : '!'}</span>
              <span>{result.message}</span>
            </div>
          )}

          <form
            className="form"
            action={async (formData) => {
              setResult(await action(formData));
            }}
          >
            {children}

            <div className="row-actions" style={{ marginTop: 8 }}>
              <SaveButton label={saveLabel} />

              {onDelete && deleteId ? (
                confirming ? (
                  <>
                    <button
                      className="btn-mini"
                      data-tone="reject"
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          setResult(await onDelete(deleteId));
                          setConfirming(false);
                        })
                      }
                    >
                      Confirm delete
                    </button>
                    <button className="btn-mini" type="button" onClick={() => setConfirming(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-mini"
                    data-tone="reject"
                    type="button"
                    onClick={() => setConfirming(true)}
                  >
                    Delete
                  </button>
                )
              ) : null}
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

/** Small labelled field helpers, so the editors stay readable. */
export function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {hint && <span style={{ color: 'var(--text-72)', fontWeight: 400 }}> · {hint}</span>}
      </span>
      <input
        className="input"
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  hint,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {hint && <span style={{ color: 'var(--text-72)', fontWeight: 400 }}> · {hint}</span>}
      </span>
      <textarea
        className="textarea"
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ''}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: Array<[string, string]>;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="select" name={name} defaultValue={defaultValue ?? options[0][0]}>
        {options.map(([value, text]) => (
          <option value={value} key={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="doc-check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}
