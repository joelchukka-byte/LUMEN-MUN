'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { registerIndividual, registerSchool, type RegisterState } from '@/lib/actions/register';
import { GRADES, EXPERIENCE_LEVELS, DELEGATION_SIZES } from '@/lib/validation';
import { rupees } from '@/lib/format';
import { PaymentPanel } from './PaymentPanel';

type Committee = { id: number; slug: string; name: string; code: string };

type Props = {
  committees: Committee[];
  baseFee: number;
  accommodationFee: number;
  upiConfigured: boolean;
  preselected?: string;
  seatsLeft: number | null;
};

const initial: RegisterState = { ok: false };

function Submit({ label, busyLabel }: { label: string; busyLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn--primary" type="submit" disabled={pending}>
      {pending ? busyLabel : label}
    </button>
  );
}

/** Renders the field's server-side error, if it has one. */
function Err({ errors, name }: { errors: Record<string, string> | undefined; name: string }) {
  return errors?.[name] ? <span className="field__error">{errors[name]}</span> : null;
}

export function RegisterWizard({
  committees,
  baseFee,
  accommodationFee,
  upiConfigured,
  preselected,
  seatsLeft,
}: Props) {
  const [track, setTrack] = useState<'individual' | 'school'>('individual');
  const [accommodation, setAccommodation] = useState(false);

  const [indState, indAction] = useActionState(registerIndividual, initial);
  const [schoolState, schoolAction] = useActionState(registerSchool, initial);

  const total = baseFee + (accommodation ? accommodationFee : 0);

  /* Step 3 — individual delegates go to payment. */
  if (track === 'individual' && indState.ok && indState.ref) {
    return (
      <PaymentPanel
        reference={indState.ref}
        fee={indState.fee ?? total}
        upiConfigured={upiConfigured}
      />
    );
  }

  /* Step 3 — school delegations are invoiced rather than paying online. */
  if (track === 'school' && schoolState.ok && schoolState.ref) {
    return (
      <div className="seal">
        <div className="seal__ring" aria-hidden="true">✓</div>
        <h2 className="section-title">Delegation registered</h2>
        <p style={{ maxWidth: 540, color: 'var(--text-70)', lineHeight: 1.7 }}>
          Finance will review your request and issue one invoice against your final headcount. Your
          delegates should register individually and quote this reference so their seats group under
          your delegation.
        </p>
        <div className="ref-badge">
          <span className="ref-badge__label">DELEGATION REFERENCE</span>
          <span className="ref-badge__value" translate="no">{schoolState.ref}</span>
        </div>
        <p className="label">INDICATIVE TOTAL · {rupees(schoolState.fee ?? 0)}</p>
        <Link className="btn btn--ghost btn--sm" href="/forms">
          Read the mandatory forms
        </Link>
      </div>
    );
  }

  const state = track === 'individual' ? indState : schoolState;
  const errors = state.errors;

  return (
    <>
      {/* Step rail */}
      <ol className="wizard-steps">
        <li className="wizard-step" data-state="done">
          <p className="step__label">STEP 01: DONE</p>
          <p className="step__name">Choose your track</p>
        </li>
        <li className="wizard-step" data-state="active">
          <p className="step__label">STEP 02: ACTIVE</p>
          <p className="step__name">Details &amp; preferences</p>
        </li>
        <li className="wizard-step">
          <p className="step__label">STEP 03</p>
          <p className="step__name">
            {track === 'school' ? 'Invoice & confirmation' : 'Payment & confirmation'}
          </p>
        </li>
      </ol>

      <div className="step-counter">
        <p className="step-counter__label">STEP 02 / 03</p>
        <p className="step-counter__name">Details &amp; preferences</p>
        <div className="step-counter__bar">
          <span className="step-counter__fill" style={{ width: '66%' }} />
        </div>
      </div>

      {/* Track picker */}
      <div className="tracks">
        <button
          type="button"
          className="track"
          aria-pressed={track === 'individual'}
          onClick={() => setTrack('individual')}
        >
          <span className="track__top">
            <span className="track__tag">TRACK A</span>
            <span className="track__state">{track === 'individual' ? 'SELECTED' : 'SELECT'}</span>
          </span>
          <h2>Individual delegate</h2>
          <p>
            Apply on your own. Committee and portfolio preferences are submitted here; allocation is
            confirmed by email.
          </p>
        </button>

        <button
          type="button"
          className="track"
          aria-pressed={track === 'school'}
          onClick={() => setTrack('school')}
        >
          <span className="track__top">
            <span className="track__tag">TRACK B</span>
            <span className="track__state">{track === 'school' ? 'SELECTED' : 'SELECT'}</span>
          </span>
          <h2>School delegation</h2>
          <p>
            Five delegates or more, registered by a faculty coordinator. One invoice, one point of
            contact, priority allocation.
          </p>
        </button>
      </div>

      <div className="grid-2-48 stack-56" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <section className="form-panel">
          <div className="form-panel__head">
            <p className="label label--accent">{track === 'individual' ? 'FORM A' : 'FORM B'}</p>
            <span className="form-panel__rule" aria-hidden="true" />
          </div>

          {state.message && !state.ok && (
            <div className="alert" data-tone="error" role="alert" style={{ marginBottom: 22 }}>
              <span className="alert__mark" aria-hidden="true">!</span>
              <span>{state.message}</span>
            </div>
          )}

          {track === 'individual' ? (
            <form action={indAction} className="form" noValidate>
              <h2>Individual delegate application</h2>
              <p className="form-panel__lede">
                One delegate, one submission. You will set a password here: that is how you sign in
                to track your seat.
              </p>

              <fieldset className="fieldset">
                <legend className="fieldset__legend">WHO YOU ARE</legend>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">
                      Full name <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="name" autoComplete="name" placeholder="Aarav Reddy" required aria-invalid={!!errors?.name} />
                    <Err errors={errors} name="name" />
                  </label>

                  <label className="field">
                    <span className="field__label">
                      Email <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="email" type="email" autoComplete="email" spellCheck={false} placeholder="you@school.edu" required aria-invalid={!!errors?.email} />
                    <Err errors={errors} name="email" />
                  </label>
                </div>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">
                      Phone <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="phone" type="tel" autoComplete="tel" placeholder="+91 " required aria-invalid={!!errors?.phone} />
                    <Err errors={errors} name="phone" />
                  </label>

                  <label className="field">
                    <span className="field__label">
                      School / institution <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="school" autoComplete="organization" placeholder="Institution name" required aria-invalid={!!errors?.school} />
                    <Err errors={errors} name="school" />
                  </label>
                </div>

                <div className="form-row form-row--three">
                  <label className="field">
                    <span className="field__label">Grade / year</span>
                    <select className="select" name="grade" defaultValue={GRADES[3]}>
                      {GRADES.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                    <Err errors={errors} name="grade" />
                  </label>

                  <label className="field">
                    <span className="field__label">City</span>
                    <input className="input" name="city" placeholder="Guntur" />
                  </label>

                  <label className="field">
                    <span className="field__label">Gender</span>
                    <select className="select" name="gender" defaultValue="">
                      <option value="">Prefer not to say</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Other</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">
                    Emergency contact <span style={{ color: 'var(--text-72)', fontWeight: 400 }}>· a parent or guardian, name and number</span>
                  </span>
                  <input className="input" name="emergencyContact" placeholder="Name · +91 " />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset__legend">COMMITTEE PREFERENCES</legend>

                <div className="form-row form-row--three">
                  {([1, 2, 3] as const).map((n) => (
                    <label className="field" key={n}>
                      <span className="field__label">
                        {n === 1 ? '1st' : n === 2 ? '2nd' : '3rd'} preference
                        {n === 1 && <span className="req" aria-hidden="true"> *</span>}
                      </span>
                      <select
                        className="select"
                        name={`committee${n}`}
                        defaultValue={n === 1 ? preselected ?? committees[0]?.slug ?? '' : ''}
                        required={n === 1}
                        aria-invalid={!!errors?.[`committee${n}`]}
                      >
                        {n > 1 && <option value="">No preference</option>}
                        {committees.map((c) => (
                          <option value={c.slug} key={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <Err errors={errors} name={`committee${n}`} />
                    </label>
                  ))}
                </div>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">Portfolio preference (optional)</span>
                    <input className="input" name="countryPref1" placeholder="Country or character" />
                  </label>

                  <label className="field">
                    <span className="field__label">MUN experience</span>
                    <select className="select" name="experience" defaultValue={EXPERIENCE_LEVELS[0]}>
                      {EXPERIENCE_LEVELS.map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">Anything we should know</span>
                  <textarea className="textarea" name="notes" rows={3} placeholder="Accessibility needs, dietary requirements…" />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset__legend">YOUR ACCOUNT</legend>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">
                      Create password <span style={{ color: 'var(--text-72)', fontWeight: 400 }}>· min 8 characters</span>
                    </span>
                    <input className="input" name="password" type="password" autoComplete="new-password" required aria-invalid={!!errors?.password} />
                    <Err errors={errors} name="password" />
                  </label>

                  <label className="field">
                    <span className="field__label">Confirm password</span>
                    <input className="input" name="passwordConfirm" type="password" autoComplete="new-password" required aria-invalid={!!errors?.passwordConfirm} />
                    <Err errors={errors} name="passwordConfirm" />
                  </label>
                </div>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset__legend">BEFORE YOU PAY</legend>

                <label className="field">
                  <span className="doc-check">
                    <input
                      type="checkbox"
                      name="accommodation"
                      checked={accommodation}
                      onChange={(e) => setAccommodation(e.target.checked)}
                    />
                    <span>
                      Add the accommodation package: two nights, twin sharing, breakfast and venue
                      shuttle. <b>{rupees(accommodationFee)}</b> per delegate.
                    </span>
                  </span>
                </label>

                <div className="doc-gate">
                  <p className="label label--accent">
                    REQUIRED · READ AND AGREE TO ALL THREE
                  </p>
                  {[
                    ['agreeCoc', 'Code of Conduct'],
                    ['agreeLiability', 'Liability Release'],
                    ['agreeTechnology', 'Technology Release'],
                  ].map(([name, label]) => (
                    <label className="doc-check" key={name}>
                      <input type="checkbox" name={name} required />
                      <span>
                        I have read and agree to the{' '}
                        <Link href="/forms" target="_blank">
                          {label}
                        </Link>
                        .
                      </span>
                    </label>
                  ))}
                  {(errors?.agreeCoc || errors?.agreeLiability || errors?.agreeTechnology) && (
                    <span className="field__error">
                      {errors.agreeCoc || errors.agreeLiability || errors.agreeTechnology}
                    </span>
                  )}
                </div>
              </fieldset>

              <div className="form-actions form-actions--sticky">
                <span className="form-note">TOTAL {rupees(total)}</span>
                <Submit label="Continue to payment" busyLabel="Submitting…" />
                <span className="form-note">NO PAYMENT AT THIS STAGE</span>
              </div>
            </form>
          ) : (
            <form action={schoolAction} className="form" noValidate>
              <h2>School delegation registration</h2>
              <p className="form-panel__lede">
                Submitted by a faculty coordinator. One invoice, one point of contact, priority
                allocation.
              </p>

              <fieldset className="fieldset">
                <legend className="fieldset__legend">INSTITUTION</legend>

                <label className="field">
                  <span className="field__label">
                    Institution name <span className="req" aria-hidden="true">*</span>
                  </span>
                  <input className="input" name="institution" autoComplete="organization" placeholder="School or college name" required aria-invalid={!!errors?.institution} />
                  <Err errors={errors} name="institution" />
                </label>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">
                      Faculty coordinator <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="coordinatorName" autoComplete="name" placeholder="Full name" required aria-invalid={!!errors?.coordinatorName} />
                    <Err errors={errors} name="coordinatorName" />
                  </label>

                  <label className="field">
                    <span className="field__label">Designation</span>
                    <input className="input" name="designation" placeholder="e.g. MUN Faculty Advisor" />
                  </label>
                </div>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">
                      Official email <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="email" type="email" autoComplete="email" spellCheck={false} placeholder="coordinator@school.edu" required aria-invalid={!!errors?.email} />
                    <Err errors={errors} name="email" />
                  </label>

                  <label className="field">
                    <span className="field__label">
                      Phone <span className="req" aria-hidden="true">*</span>
                    </span>
                    <input className="input" name="phone" type="tel" autoComplete="tel" placeholder="+91 " required aria-invalid={!!errors?.phone} />
                    <Err errors={errors} name="phone" />
                  </label>
                </div>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset__legend">THE DELEGATION</legend>

                <div className="form-row form-row--three">
                  <label className="field">
                    <span className="field__label">Delegation size</span>
                    <select className="select" name="sizeBand" defaultValue={DELEGATION_SIZES[0]}>
                      {DELEGATION_SIZES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <Err errors={errors} name="sizeBand" />
                  </label>

                  <label className="field">
                    <span className="field__label">Accompanying faculty</span>
                    <select className="select" name="facultyCount" defaultValue="1">
                      <option>1</option>
                      <option>2</option>
                      <option>3 or more</option>
                    </select>
                  </label>

                  <label className="field">
                    <span className="field__label">Accommodation</span>
                    <select className="select" name="accommodation" defaultValue="none">
                      <option value="none">Not required</option>
                      <option value="partial">For part of the delegation</option>
                      <option value="full">Full delegation</option>
                    </select>
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">Committee spread requested</span>
                  <textarea className="textarea" name="committeeSpread" rows={2} placeholder="e.g. 6 in UNSC, 8 in UNHRC, 4 in AIPPM" />
                </label>

                <label className="field">
                  <span className="field__label">Invoicing &amp; other notes</span>
                  <textarea className="textarea" name="invoicingNotes" rows={3} placeholder="GST details, purchase order, dietary or accessibility needs…" />
                </label>
              </fieldset>

              <div className="form-actions form-actions--sticky">
                <span className="form-note">{rupees(baseFee)} PER DELEGATE</span>
                <Submit label="Submit delegation" busyLabel="Submitting…" />
                <span className="form-note">INVOICE ISSUED AFTER REVIEW</span>
              </div>
            </form>
          )}
        </section>

        {/* Fee rail */}
        <aside className="fee-summary">
          <div className="fee-summary__head">
            <p className="label label--accent">
              {track === 'school' ? 'INDICATIVE COST' : 'YOUR TOTAL'}
            </p>
          </div>
          <div className="fee-summary__rows">
            <div className="fee-line">
              <span>Delegate registration</span>
              <span>{rupees(baseFee)}</span>
            </div>

            {track === 'individual' && accommodation && (
              <div className="fee-line">
                <span>Accommodation, two nights</span>
                <span>{rupees(accommodationFee)}</span>
              </div>
            )}

            {track === 'school' ? (
              <div className="fee-line fee-line--muted">
                Invoiced against your final headcount after review.
              </div>
            ) : (
              <div className="fee-line fee-line--total">
                <span>Total</span>
                <span>{rupees(total)}</span>
              </div>
            )}

            <div className="fee-line fee-line--muted">
              Includes three days of sessions, delegate kit, lunch and refreshments, certificate and
              socials.
            </div>

            {seatsLeft !== null && (
              <div className="fee-line fee-line--muted">
                <span>Seats remaining</span>
                <span>{seatsLeft > 0 ? seatsLeft : 'Waitlist only'}</span>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
