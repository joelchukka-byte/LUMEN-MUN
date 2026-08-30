'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { submitContact, type FormState } from '@/lib/actions/contact';

const TOPICS = [
  'Delegate registration',
  'School delegation',
  'Sponsorship & partnerships',
  'Press & media',
  'Something else',
];

const initial: FormState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn--primary" type="submit" disabled={pending}>
      {pending ? 'Sending' : 'Send message'}
    </button>
  );
}

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, formAction] = useActionState(submitContact, initial);

  if (state.ok) {
    return (
      <div className="notice" data-tone="success" role="status">
        <CheckCircleIcon className="notice__icon" size={18} weight="fill" />
        <span>{state.message}</span>
      </div>
    );
  }

  return (
    <form className="form" action={formAction} noValidate>
      {state.message && (
        <div className="notice" data-tone="error" role="alert">
          <WarningCircleIcon className="notice__icon" size={18} weight="fill" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="form-row">
        <label className="field">
          <span className="field__label">
            Name <span className="req" aria-hidden="true">*</span>
          </span>
          <input
            className="input"
            name="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            required
            aria-invalid={!!state.errors?.name}
          />
          {state.errors?.name && <span className="field__error">{state.errors.name}</span>}
        </label>

        <label className="field">
          <span className="field__label">
            Email <span className="req" aria-hidden="true">*</span>
          </span>
          <input
            className="input"
            name="email"
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
          spellCheck={false}
            required
            aria-invalid={!!state.errors?.email}
          />
          {state.errors?.email && <span className="field__error">{state.errors.email}</span>}
        </label>
      </div>

      <label className="field">
        <span className="field__label">I am writing about</span>
        <select className="select" name="topic" defaultValue={defaultTopic ?? TOPICS[0]}>
          {TOPICS.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">
          Message <span className="req" aria-hidden="true">*</span>
        </span>
        <textarea
          className="textarea"
          name="message"
          rows={5}
          placeholder="How can we help?"
          required
          aria-invalid={!!state.errors?.message}
        />
        {state.errors?.message && <span className="field__error">{state.errors.message}</span>}
      </label>

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  );
}
