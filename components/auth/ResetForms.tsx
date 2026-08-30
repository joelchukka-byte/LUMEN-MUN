'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { requestPasswordReset, resetPassword, type AuthState } from '@/lib/actions/auth';

const initial: AuthState = { ok: false };

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn--primary" type="submit" disabled={pending} style={{ width: '100%' }}>
      {pending ? busy : label}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initial);

  if (state.ok) {
    return (
      <>
        <div className="alert" data-tone="success" role="status">
          <span className="alert__mark" aria-hidden="true">✓</span>
          <span>{state.message}</span>
        </div>
        <p className="auth-switch">
          <Link href="/login">Back to sign in</Link>
        </p>
      </>
    );
  }

  return (
    <form className="form" action={action} noValidate>
      <label className="field">
        <span className="field__label">Email</span>
        <input
          className="input"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@school.edu"
          required
          aria-invalid={!!state.errors?.email}
        />
        {state.errors?.email && <span className="field__error">{state.errors.email}</span>}
      </label>

      <Submit label="Send reset link" busy="Sending…" />

      <p className="auth-switch">
        <Link href="/login">Back to sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, initial);

  if (state.ok) {
    return (
      <>
        <div className="alert" data-tone="success" role="status">
          <span className="alert__mark" aria-hidden="true">✓</span>
          <span>{state.message}</span>
        </div>
        <p className="auth-switch">
          <Link className="btn btn--ghost btn--sm" href="/login">
            Sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <form className="form" action={action} noValidate>
      <input type="hidden" name="token" value={token} />

      {state.message && (
        <div className="alert" data-tone="error" role="alert">
          <span className="alert__mark" aria-hidden="true">!</span>
          <span>{state.message}</span>
        </div>
      )}

      <label className="field">
        <span className="field__label">New password</span>
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!state.errors?.password}
        />
        {state.errors?.password && <span className="field__error">{state.errors.password}</span>}
      </label>

      <label className="field">
        <span className="field__label">Confirm new password</span>
        <input
          className="input"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={!!state.errors?.passwordConfirm}
        />
        {state.errors?.passwordConfirm && (
          <span className="field__error">{state.errors.passwordConfirm}</span>
        )}
      </label>

      <Submit label="Set new password" busy="Saving…" />
    </form>
  );
}
