import { asc } from 'drizzle-orm';
import { db, feeTiers } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { getRegistrationSettings, getHomeContent, getContactSettings } from '@/lib/content';
import {
  saveRegistrationSettings,
  saveHomeContent,
  saveContactSettings,
  saveFeeTier,
  deleteFeeTier,
} from '@/lib/actions/content';
import { RecordForm, Field, TextArea, Select, Toggle } from '@/components/admin/RecordForm';
import { rupees } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings & fees' };

const APPLIES: Array<[string, string]> = [
  ['both', 'Individuals and schools'],
  ['individual', 'Individual delegates only'],
  ['school', 'School delegations only'],
];

export default async function SettingsAdminPage() {
  await requireStaffPage('superadmin');

  const [registration, home, contact, tiers] = await Promise.all([
    getRegistrationSettings(),
    getHomeContent(),
    getContactSettings(),
    db.select().from(feeTiers).orderBy(asc(feeTiers.sort)),
  ]);

  const stats = home.stats ?? {};

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Site content</p>
          <h1 className="console__title">Settings &amp; fees</h1>
        </div>
        <span className="pill" data-tone={registration.open ? 'approved' : 'rejected'}>
          {registration.open ? 'Registration open' : 'Registration closed'}
        </span>
      </div>

      <RecordForm
        action={saveRegistrationSettings}
        title="Registration window"
        subtitle="CONTROLS WHETHER THE FORM ACCEPTS SUBMISSIONS"
        defaultOpen
      >
        <Toggle label="Registration is open" name="open" defaultChecked={registration.open} />

        <div className="form-row">
          <Field
            label="Opens at"
            name="opensAt"
            defaultValue={registration.opensAt ?? ''}
            type="datetime-local"
            hint="optional"
          />
          <Field
            label="Closes at"
            name="closesAt"
            defaultValue={registration.closesAt ?? ''}
            type="datetime-local"
            hint="optional"
          />
        </div>

        <div className="form-row">
          <Field label="Status message" name="message" defaultValue={registration.message} />
          <Field label="Seat cap" name="seatsCap" defaultValue={registration.seatsCap} type="number" />
        </div>
      </RecordForm>

      <h2 className="section-title section-title--sm stack-36" style={{ marginBottom: 18 }}>
        Fee tiers
      </h2>

      {tiers.map((tier) => (
        <RecordForm
          key={tier.id}
          action={saveFeeTier}
          onDelete={deleteFeeTier}
          deleteId={tier.id}
          title={`${tier.name}, ${rupees(tier.amount)}`}
          subtitle={`${tier.code.toUpperCase()}${tier.isAddon ? ' · ADD-ON' : ''}${tier.active ? '' : ' · INACTIVE'}`}
        >
          <input type="hidden" name="id" value={tier.id} />

          <div className="form-row form-row--three">
            <Field label="Name" name="name" defaultValue={tier.name} />
            <Field label="Code" name="code" defaultValue={tier.code} hint="lowercase, no spaces" />
            <Field label="Amount (₹)" name="amount" defaultValue={tier.amount} type="number" />
          </div>

          <TextArea label="Description" name="description" defaultValue={tier.description} rows={2} />

          <div className="form-row">
            <Select label="Applies to" name="appliesTo" defaultValue={tier.appliesTo} options={APPLIES} />
            <Field label="Order" name="sort" defaultValue={tier.sort} type="number" />
          </div>

          <Toggle label="This is an add-on, not the base rate" name="isAddon" defaultChecked={tier.isAddon} />
          <Toggle label="Active" name="active" defaultChecked={tier.active} />
        </RecordForm>
      ))}

      <RecordForm action={saveFeeTier} title="Add a fee tier" saveLabel="Create">
        <input type="hidden" name="id" value={0} />
        <div className="form-row form-row--three">
          <Field label="Name" name="name" placeholder="Early bird" />
          <Field label="Code" name="code" placeholder="early" />
          <Field label="Amount (₹)" name="amount" type="number" defaultValue={1200} />
        </div>
        <Select label="Applies to" name="appliesTo" options={APPLIES} />
        <Field label="Order" name="sort" type="number" defaultValue={tiers.length + 1} />
        <Toggle label="Active" name="active" defaultChecked />
      </RecordForm>

      <h2 className="section-title section-title--sm stack-36" style={{ marginBottom: 18 }}>
        Homepage
      </h2>

      <RecordForm action={saveHomeContent} title="Hero &amp; readouts">
        <Field label="Eyebrow" name="eyebrow" defaultValue={home.eyebrow} />

        <div className="form-row">
          <Field label="Title lead" name="titleLead" defaultValue={home.titleLead} />
          <Field label="Title accent" name="titleAccent" defaultValue={home.titleAccent} />
        </div>

        <Field label="Tagline" name="tagline" defaultValue={home.tagline} />
        <TextArea label="Lede" name="lede" defaultValue={home.lede} rows={3} />

        <div className="form-row">
          <Field label="Dates" name="statDates" defaultValue={String(stats.dates?.value ?? '')} />
          <Field label="Dates note" name="statDatesNote" defaultValue={stats.dates?.note} />
        </div>
        <div className="form-row">
          <Field label="Venue" name="statVenue" defaultValue={String(stats.venue?.value ?? '')} />
          <Field label="Venue note" name="statVenueNote" defaultValue={stats.venue?.note} />
        </div>
        <div className="form-row">
          <Field label="Delegates" name="statDelegates" defaultValue={String(stats.delegates?.value ?? '')} type="number" />
          <Field label="Delegates note" name="statDelegatesNote" defaultValue={stats.delegates?.note} />
        </div>
        <div className="form-row">
          <Field label="Committees" name="statCommittees" defaultValue={String(stats.committees?.value ?? '')} type="number" />
          <Field label="Committees note" name="statCommitteesNote" defaultValue={stats.committees?.note} />
        </div>
      </RecordForm>

      <h2 className="section-title section-title--sm stack-36" style={{ marginBottom: 18 }}>
        Contact
      </h2>

      <RecordForm action={saveContactSettings} title="Inboxes &amp; socials">
        <div className="form-row form-row--three">
          <Field label="Delegate Affairs" name="delegates" defaultValue={contact.delegates} type="email" />
          <Field label="Sponsorship" name="partners" defaultValue={contact.partners} type="email" />
          <Field label="Press" name="press" defaultValue={contact.press} type="email" />
        </div>

        <TextArea
          label="Socials"
          name="socials"
          defaultValue={contact.socials.map((s) => `${s.label} | ${s.url}`).join('\n')}
          rows={4}
          hint="one per line, as: Label | https://url"
        />
      </RecordForm>
    </>
  );
}
