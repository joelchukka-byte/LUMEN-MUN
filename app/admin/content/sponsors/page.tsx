import { asc } from 'drizzle-orm';
import { db, sponsors } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { saveSponsor, deleteSponsor } from '@/lib/actions/content';
import { RecordForm, Field, TextArea, Select, Toggle } from '@/components/admin/RecordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sponsors' };

const TIERS: Array<[string, string]> = [
  ['title', 'Tier 01: Presenting'],
  ['gold', 'Tier 02: Gold'],
  ['silver', 'Tier 03: Silver'],
  ['community', 'Tier 04: Community'],
];

export default async function SponsorsAdminPage() {
  await requireStaffPage('superadmin');
  const rows = await db.select().from(sponsors).orderBy(asc(sponsors.sort));

  const confirmed = rows.filter((r) => r.confirmed).length;

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Site content</p>
          <h1 className="console__title">Sponsors &amp; partners</h1>
        </div>
        <span className="readout">
          {rows.length - confirmed} TIERS OFFERED · {confirmed} CONFIRMED
        </span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 24 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          Rows without <b>Confirmed</b> render as purchasable tiers with their price and perks. Tick
          Confirmed once a partner signs and the row moves into the logo wall instead.
        </span>
      </div>

      {rows.map((s) => (
        <RecordForm
          key={s.id}
          action={saveSponsor}
          onDelete={deleteSponsor}
          deleteId={s.id}
          title={s.name}
          subtitle={`${s.tier.toUpperCase()}${s.price ? ` · ${s.price}` : ''}${s.confirmed ? ' · CONFIRMED PARTNER' : ' · TIER'}`}
        >
          <input type="hidden" name="id" value={s.id} />

          <div className="form-row">
            <Field label="Name" name="name" defaultValue={s.name} />
            <Select label="Tier" name="tier" defaultValue={s.tier} options={TIERS} />
          </div>

          <div className="form-row form-row--three">
            <Field label="Price" name="price" defaultValue={s.price} hint="e.g. ₹50,000 or In kind" />
            <Field label="Logo path" name="logo" defaultValue={s.logo} placeholder="/img/partners/x.png" />
            <Field label="Order" name="sort" defaultValue={s.sort} type="number" />
          </div>

          <TextArea label="Blurb" name="blurb" defaultValue={s.blurb} rows={2} />
          <TextArea label="Perks" name="perks" defaultValue={s.perks.join('\n')} rows={5} hint="one per line" />

          <Field label="Website" name="url" defaultValue={s.url} placeholder="https://" />
          <Toggle label="Confirmed partner (shows in the logo wall)" name="confirmed" defaultChecked={s.confirmed} />
        </RecordForm>
      ))}

      <RecordForm action={saveSponsor} title="Add a tier or partner" saveLabel="Create">
        <input type="hidden" name="id" value={0} />
        <div className="form-row">
          <Field label="Name" name="name" />
          <Select label="Tier" name="tier" options={TIERS} />
        </div>
        <div className="form-row">
          <Field label="Price" name="price" />
          <Field label="Order" name="sort" type="number" defaultValue={rows.length + 1} />
        </div>
        <TextArea label="Perks" name="perks" rows={4} hint="one per line" />
        <Toggle label="Confirmed partner" name="confirmed" />
      </RecordForm>
    </>
  );
}
