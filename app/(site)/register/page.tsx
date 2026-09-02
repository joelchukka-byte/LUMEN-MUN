import type { Metadata } from 'next';
import Link from 'next/link';
import { getCommittees, getPricing, registrationState, getRegistrationSettings } from '@/lib/content';
import { seatsTaken } from '@/lib/actions/register';
import { RegisterWizard } from '@/components/register/RegisterWizard';
import { rupees } from '@/lib/format';

/** Seat counts and the open/closed window are live, so never cache this page. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Register',
  description:
    'Register as an individual delegate or a school delegation for LUMEN MUN Edition I.',
};

type Props = { searchParams: Promise<{ committee?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const [{ committee }, committees, pricing, state, settings, taken] = await Promise.all([
    searchParams,
    getCommittees(),
    getPricing(),
    registrationState(),
    getRegistrationSettings(),
    seatsTaken(),
  ]);

  const seatsLeft = settings.seatsCap ? Math.max(0, settings.seatsCap - taken) : null;

  return (
    <div className="page">
      <div className="page-head">
        <div className="head-row">
          <h1 className="h1">Register</h1>
          <p className="chip" data-state={state.reason}>
            {state.open ? state.message || 'REGISTRATION IS OPEN' : state.message}
          </p>
        </div>
      </div>

      <div className="page-body">
        {!state.open ? (
          <div className="empty-state stack-48">
            <p className="empty-state__mark">[ CLOSED ]</p>
            <h2 className="section-title" style={{ marginBottom: 12 }}>
              {state.reason === 'before' ? 'Registration has not opened yet' : 'Registration is closed'}
            </h2>
            <p style={{ maxWidth: 520, margin: '0 auto 24px' }}>
              {state.reason === 'before'
                ? 'Applications open with the conference announcement. Follow the socials or write to Delegate Affairs to be told first.'
                : 'Seats for Edition I are no longer being accepted. Write to Delegate Affairs if you believe this is an error.'}
            </p>
            <div className="row-actions" style={{ justifyContent: 'center' }}>
              <Link className="btn btn--ghost btn--sm" href="/contact">
                Contact Delegate Affairs
              </Link>
              <Link className="btn btn--ghost btn--sm" href="/committees">
                View committees
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Fee tiers, straight from the database */}
            <div className="fee-grid stack-48">
              <div className="fee-card">
                <p className="label label--accent">
                  {pricing.base?.name?.toUpperCase() ?? 'REGULAR REGISTRATION'}
                </p>
                <p className="fee-card__amount">
                  <b>{rupees(pricing.baseAmount)}</b> <span>/ delegate</span>
                </p>
                <p className="fee-card__note">
                  {pricing.base?.description ??
                    'One rate for individual delegates and school delegations alike.'}
                </p>
              </div>

              <div className="included">
                <p className="label">INCLUDED</p>
                <ul>
                  <li>Three days of committee sessions</li>
                  <li>Delegate kit, placard and study guide</li>
                  <li>Lunch and refreshments, all three days</li>
                  <li>Certificate of participation</li>
                  <li>Socials and closing ceremony access</li>
                </ul>
              </div>
            </div>

            {pricing.accommodation && (
              <div className="addon">
                <div className="addon__body">
                  <p className="label label--accent">ADD-ON</p>
                  <h3>{pricing.accommodation.name}</h3>
                  <p>{pricing.accommodation.description}</p>
                </div>
                <p className="addon__price">
                  <b>{rupees(pricing.accommodationAmount)}</b>
                  <span className="label">PER DELEGATE</span>
                </p>
              </div>
            )}

            <div className="stack-72">
              <RegisterWizard
                committees={committees.map((c) => ({
                  id: c.id,
                  slug: c.slug,
                  name: c.name,
                  code: c.code,
                }))}
                baseFee={pricing.baseAmount}
                accommodationFee={pricing.accommodationAmount}
                upiConfigured={!!process.env.UPI_ID}
                preselected={committee}
                seatsLeft={seatsLeft}
              />
            </div>

            <p className="alert stack-36" data-tone="info">
              <span className="alert__mark" aria-hidden="true">i</span>
              <span>
                Already registered? <Link href="/login">Sign in</Link> to track your payment,
                allocation and committee documents.
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
