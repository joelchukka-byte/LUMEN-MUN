import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, documents, committees } from '@/db';
import { currentDelegate } from '@/lib/auth';
import { delegateSignOut } from '@/lib/actions/auth';
import { getMandatoryForms, getAnnouncements } from '@/lib/content';
import { rupees, formatDateTime, STATUS_LABEL, STATUS_STEP } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Delegate dashboard',
  robots: { index: false },
};

const STAGES = [
  { key: 1, title: 'Application submitted', note: 'Your details are with Delegate Affairs.' },
  { key: 2, title: 'Payment verified', note: 'Finance checks your proof within 48 hours.' },
  { key: 3, title: 'Committee allocated', note: 'Academics assign committee and portfolio.' },
];

export default async function DashboardPage() {
  const delegate = await currentDelegate();
  if (!delegate) redirect('/login');

  const step = STATUS_STEP[delegate.status];

  // Committee documents unlock once a delegate has been allocated.
  const allocatedSlug = delegate.assignedCommittee;
  const [allocated] = allocatedSlug
    ? await db.select().from(committees).where(eq(committees.slug, allocatedSlug)).limit(1)
    : [];

  const guides = allocated
    ? await db.select().from(documents).where(eq(documents.committeeId, allocated.id))
    : [];

  const [forms, announcements] = await Promise.all([getMandatoryForms(), getAnnouncements()]);

  const needsPayment = delegate.status === 'submitted' || delegate.status === 'rejected';

  return (
    <div className="page">
      <div className="page-head">
        <div className="head-row">
          <h1 className="h1">{delegate.name.split(' ')[0]}</h1>
          <div className="row-actions">
            <span className="pill" data-tone={delegate.status}>
              {STATUS_LABEL[delegate.status]}
            </span>
            <form action={delegateSignOut}>
              <button className="btn-mini" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="page-body">
        {!delegate.emailVerified && (
          <div className="alert stack-20" data-tone="info">
            <span className="alert__mark" aria-hidden="true">i</span>
            <span>
              Your email is not confirmed yet. Check your inbox for the confirmation link: it keeps
              you on the list for agenda and allocation announcements.
            </span>
          </div>
        )}

        {delegate.status === 'rejected' && delegate.reviewNote && (
          <div className="alert stack-20" data-tone="error">
            <span className="alert__mark" aria-hidden="true">!</span>
            <span>
              <b>Payment needs attention.</b> {delegate.reviewNote}: re-submit your proof below.
            </span>
          </div>
        )}

        <div className="dash-grid stack-36">
          <div>
            {/* Allocation */}
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Your allocation</h2>
                {delegate.allocationLocked && <span className="pill" data-tone="locked">Locked</span>}
              </div>
              <div className="dash-card__body">
                {allocated || delegate.assignedCommittee ? (
                  <div className="allocation">
                    <p className="label label--accent">ALLOCATED</p>
                    <p className="allocation__committee">
                      {allocated?.name ?? delegate.assignedCommittee}
                    </p>
                    <p className="allocation__country">
                      {delegate.assignedCountry || 'PORTFOLIO TO BE ANNOUNCED'}
                    </p>
                    {allocated && (
                      <p style={{ marginTop: 18 }}>
                        <Link className="btn btn--ghost btn--sm" href={`/committees/${allocated.slug}`}>
                          Committee brief →
                        </Link>
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-70)', lineHeight: 1.7 }}>
                      Allocation happens once payment is verified and registration closes. Your
                      preferences are recorded: you will get an email the moment it lands.
                    </p>
                    <dl className="kv" style={{ marginTop: 20 }}>
                      <dt>1ST CHOICE</dt>
                      <dd>{delegate.committee1}</dd>
                      {delegate.committee2 && (
                        <>
                          <dt>2ND CHOICE</dt>
                          <dd>{delegate.committee2}</dd>
                        </>
                      )}
                      {delegate.committee3 && (
                        <>
                          <dt>3RD CHOICE</dt>
                          <dd>{delegate.committee3}</dd>
                        </>
                      )}
                    </dl>
                  </>
                )}
              </div>
            </section>

            {/* Progress */}
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Where you are</h2>
              </div>
              <div className="dash-card__body">
                <ol className="stage-list">
                  {STAGES.map((stage) => {
                    const state =
                      step > stage.key ? 'done' : step === stage.key ? 'current' : 'todo';
                    return (
                      <li className="stage" data-state={state} key={stage.key}>
                        <span className="stage__dot" aria-hidden="true">
                          {state === 'done' ? '✓' : stage.key}
                        </span>
                        <span>
                          <span className="stage__title">{stage.title}</span>
                          <span className="stage__note">{stage.note}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                {needsPayment && (
                  <p style={{ marginTop: 24 }}>
                    <Link className="btn btn--primary btn--sm" href={`/dashboard/pay`}>
                      {delegate.status === 'rejected' ? 'Re-submit payment proof' : 'Pay and confirm your seat'}
                    </Link>
                  </p>
                )}
              </div>
            </section>

            {/* Documents */}
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Your documents</h2>
              </div>
              <div className="dash-card__body">
                <div className="doc-list">
                  {guides.map((doc) => (
                    <a className="doc-row" href={doc.file} key={doc.id} target="_blank" rel="noopener">
                      <span className="doc-row__icon">PDF</span>
                      <span>
                        <span className="doc-row__title">{doc.title}</span>
                        <span className="doc-row__meta">
                          {allocated?.name.toUpperCase()} · {doc.kind.replace('_', ' ').toUpperCase()}
                        </span>
                      </span>
                      <span className="doc-row__action">DOWNLOAD →</span>
                    </a>
                  ))}

                  {forms.map((form) => (
                    <a className="doc-row" href={form.file} key={form.id} target="_blank" rel="noopener">
                      <span className="doc-row__icon">PDF</span>
                      <span>
                        <span className="doc-row__title">{form.title}</span>
                        <span className="doc-row__meta">MANDATORY FORM</span>
                      </span>
                      <span className="doc-row__action">DOWNLOAD →</span>
                    </a>
                  ))}
                </div>

                {guides.length === 0 && (
                  <p className="label" style={{ marginTop: 18 }}>
                    BACKGROUND GUIDE UNLOCKS ON ALLOCATION
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Rail */}
          <aside>
            <section className="dash-card">
              <div className="dash-card__head">
                <h2 className="dash-card__title">Your registration</h2>
              </div>
              <div className="dash-card__body">
                <div className="ref-badge" style={{ width: '100%' }}>
                  <span className="ref-badge__label">DELEGATE REFERENCE</span>
                  <span className="ref-badge__value" translate="no">{delegate.ref}</span>
                </div>

                <dl className="kv" style={{ marginTop: 22 }}>
                  <dt>NAME</dt>
                  <dd>{delegate.name}</dd>
                  <dt>SCHOOL</dt>
                  <dd>{delegate.school}</dd>
                  <dt>GRADE</dt>
                  <dd>{delegate.grade}</dd>
                  <dt>FEE</dt>
                  <dd>{rupees(delegate.fee)}</dd>
                  <dt>STAY</dt>
                  <dd>{delegate.accommodation ? 'Accommodation added' : 'Not required'}</dd>
                  <dt>REGISTERED</dt>
                  <dd>{formatDateTime(delegate.createdAt)}</dd>
                  {delegate.checkedInAt && (
                    <>
                      <dt>CHECKED IN</dt>
                      <dd>{formatDateTime(delegate.checkedInAt)}</dd>
                    </>
                  )}
                </dl>
              </div>
            </section>

            {delegate.status === 'approved' && (
              <section className="dash-card">
                <div className="dash-card__head">
                  <h2 className="dash-card__title">Check-in pass</h2>
                </div>
                <div className="dash-card__body">
                  <div className="qr-plate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/delegate-qr?ref=${encodeURIComponent(delegate.ref)}`}
                      alt={`Check-in QR code for ${delegate.ref}`}
                      width={220}
                      height={220}
                    />
                  </div>
                  <p className="label" style={{ marginTop: 14, textAlign: 'center' }}>
                    SHOW THIS AT THE REGISTRATION DESK
                  </p>
                </div>
              </section>
            )}

            {announcements.length > 0 && (
              <section className="dash-card">
                <div className="dash-card__head">
                  <h2 className="dash-card__title">Announcements</h2>
                </div>
                <div className="dash-card__body">
                  {announcements.map((a) => (
                    <article key={a.id} style={{ marginBottom: 18 }}>
                      <p className="label label--accent">{formatDateTime(a.createdAt)}</p>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 6px' }}>{a.title}</h3>
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-62)' }}>{a.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
