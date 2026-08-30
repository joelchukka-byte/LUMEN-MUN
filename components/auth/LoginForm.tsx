'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { delegateSignIn, staffSignIn, type AuthState } from '@/lib/actions/auth';

const initial: AuthState = { ok: false };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn--primary" type="submit" disabled={pending} style={{ width: '100%' }}>
      {pending ? 'Signing in…' : label}
    </button>
  );
}

export function DelegateLoginForm() {
  const [state, action] = useActionState(delegateSignIn, initial);

  return (
    <form className="form" action={action} noValidate>
      {state.message && (
        <div className="alert" data-tone="error" role="alert">
          <span className="alert__mark" aria-hidden="true">!</span>
          <span>{state.message}</span>
        </div>
      )}

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

      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state.errors?.password}
        />
        {state.errors?.password && <span className="field__error">{state.errors.password}</span>}
      </label>

      <Submit label="Sign in" />

      <p className="auth-switch">
        <Link href="/forgot-password">Forgotten your password?</Link>
        <br />
        No account yet? <Link href="/register">Register as a delegate</Link>.
      </p>
    </form>
  );
}

export function StaffLoginForm() {
  const [state, action] = useActionState(staffSignIn, initial);

  return (
    <form className="form" action={action} noValidate>
      {state.message && (
        <div className="alert" data-tone="error" role="alert">
          <span className="alert__mark" aria-hidden="true">!</span>
          <span>{state.message}</span>
        </div>
      )}

      <label className="field">
        <span className="field__label">Username</span>
        <input
          className="input"
          name="username"
          autoComplete="username"
          required
          aria-invalid={!!state.errors?.username}
        />
        {state.errors?.username && <span className="field__error">{state.errors.username}</span>}
      </label>

      <label className="field">
        <span className="field__label">Password</span>
        <input
          className="input"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!state.errors?.password}
        />
        {state.errors?.password && <span className="field__error">{state.errors.password}</span>}
      </label>

      <Submit label="Sign in" />
    </form>
  );
}
