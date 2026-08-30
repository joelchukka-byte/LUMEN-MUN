import { asc } from 'drizzle-orm';
import { db, committees } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { saveCommittee, deleteCommittee } from '@/lib/actions/content';
import { RecordForm, Field, TextArea, Select, Toggle } from '@/components/admin/RecordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Committees' };

const LEVELS: Array<[string, string]> = [
  ['BEGINNER FRIENDLY', 'Beginner friendly'],
  ['INTERMEDIATE', 'Intermediate'],
  ['ADVANCED', 'Advanced'],
];

const AGENDA: Array<[string, string]> = [
  ['classified', 'Classified: under embargo'],
  ['released', 'Released: visible on the site'],
];

export default async function CommitteesAdminPage() {
  await requireStaffPage('superadmin');
  const rows = await db.select().from(committees).orderBy(asc(committees.sort));

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Site content</p>
          <h1 className="console__title">Committees</h1>
        </div>
        <span className="readout">{rows.length} COMMITTEES · EDITS GO LIVE IMMEDIATELY</span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 24 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          Switching an agenda to <b>Released</b> replaces &ldquo;Classified&rdquo; on the public
          committee page and unlocks its items. Delegates are not emailed automatically: post an
          announcement when you are ready to tell them.
        </span>
      </div>

      {rows.map((c) => (
        <RecordForm
          key={c.id}
          action={saveCommittee}
          onDelete={deleteCommittee}
          deleteId={c.id}
          title={c.name}
          subtitle={`${c.code} · ${c.level} · ${c.agendaStatus.toUpperCase()}${c.published ? '' : ' · HIDDEN'}`}
        >
          <input type="hidden" name="id" value={c.id} />

          <div className="form-row">
            <Field label="Name" name="name" defaultValue={c.name} />
            <Field label="Code" name="code" defaultValue={c.code} hint="e.g. GA / 1ST" />
          </div>

          <div className="form-row form-row--three">
            <Select label="Level" name="level" defaultValue={c.level} options={LEVELS} />
            <Field label="Seats" name="seats" defaultValue={c.seats} type="number" />
            <Field label="Order" name="sort" defaultValue={c.sort} type="number" />
          </div>

          <TextArea label="Card blurb" name="blurb" defaultValue={c.blurb} rows={2} />
          <TextArea
            label="Overview"
            name="overview"
            defaultValue={c.overview}
            rows={5}
            hint="shown on the committee page; blank line separates paragraphs"
          />

          <div className="form-row">
            <Select label="Agenda status" name="agendaStatus" defaultValue={c.agendaStatus} options={AGENDA} />
            <Field label="Agenda title" name="agendaTitle" defaultValue={c.agendaTitle} />
          </div>

          <TextArea
            label="Agenda items"
            name="agendaItems"
            defaultValue={c.agendaItems.join('\n')}
            rows={4}
            hint="one per line"
          />

          <div className="form-row">
            <Field label="Chair name" name="chairName" defaultValue={c.chairName} />
            <Field label="Chair title" name="chairRole" defaultValue={c.chairRole} />
          </div>
          <TextArea label="Chair bio" name="chairBio" defaultValue={c.chairBio} rows={3} />

          <div className="form-row">
            <Field label="Vice-chair name" name="viceChairName" defaultValue={c.viceChairName} />
            <Field label="Vice-chair title" name="viceChairRole" defaultValue={c.viceChairRole} />
          </div>
          <TextArea label="Vice-chair bio" name="viceChairBio" defaultValue={c.viceChairBio} rows={3} />

          <Toggle label="Published on the site" name="published" defaultChecked={c.published} />
        </RecordForm>
      ))}

      <RecordForm
        action={saveCommittee}
        title="Add a committee"
        subtitle="CREATES A NEW COUNCIL"
        saveLabel="Create"
      >
        <input type="hidden" name="id" value={0} />
        <div className="form-row">
          <Field label="Name" name="name" placeholder="e.g. UN Environment Assembly" />
          <Field label="Code" name="code" placeholder="GA / 2ND" />
        </div>
        <div className="form-row form-row--three">
          <Select label="Level" name="level" options={LEVELS} />
          <Field label="Seats" name="seats" type="number" defaultValue={0} />
          <Field label="Order" name="sort" type="number" defaultValue={rows.length + 1} />
        </div>
        <TextArea label="Card blurb" name="blurb" rows={2} />
        <Toggle label="Published on the site" name="published" defaultChecked />
      </RecordForm>
    </>
  );
}
