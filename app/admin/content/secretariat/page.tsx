import { asc } from 'drizzle-orm';
import { db, secretariat } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { saveMember, deleteMember } from '@/lib/actions/content';
import { RecordForm, Field, TextArea, Select, Toggle } from '@/components/admin/RecordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Secretariat' };

const DEPARTMENTS: Array<[string, string]> = [
  ['Executive Board', 'Executive Board'],
  ['Under-Secretaries General', 'Under-Secretaries General'],
  ['Organising Committee', 'Organising Committee'],
];

export default async function SecretariatAdminPage() {
  await requireStaffPage('superadmin');
  const rows = await db.select().from(secretariat).orderBy(asc(secretariat.sort));

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Site content</p>
          <h1 className="console__title">Secretariat</h1>
        </div>
        <span className="readout">{rows.length} MEMBERS</span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 24 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          The team page groups by department in the order these rows are sorted. A member with a
          photo path (e.g. <code>/img/team/name.jpg</code>) shows the portrait; without one, the
          hatched placeholder stays.
        </span>
      </div>

      {rows.map((m) => (
        <RecordForm
          key={m.id}
          action={saveMember}
          onDelete={deleteMember}
          deleteId={m.id}
          title={`${m.role}, ${m.name}`}
          subtitle={`${m.department.toUpperCase()}${m.published ? '' : ' · HIDDEN'}`}
        >
          <input type="hidden" name="id" value={m.id} />

          <div className="form-row">
            <Field label="Name" name="name" defaultValue={m.name} />
            <Field label="Role" name="role" defaultValue={m.role} />
          </div>

          <div className="form-row form-row--three">
            <Select label="Department" name="department" defaultValue={m.department} options={DEPARTMENTS} />
            <Field label="Photo path" name="photo" defaultValue={m.photo} placeholder="/img/team/name.jpg" />
            <Field label="Order" name="sort" defaultValue={m.sort} type="number" />
          </div>

          <TextArea label="Bio" name="bio" defaultValue={m.bio} rows={3} />
          <Field label="Email" name="email" defaultValue={m.email} type="email" />

          <Toggle label="Published on the site" name="published" defaultChecked={m.published} />
        </RecordForm>
      ))}

      <RecordForm action={saveMember} title="Add a member" saveLabel="Create">
        <input type="hidden" name="id" value={0} />
        <div className="form-row">
          <Field label="Name" name="name" placeholder="To be announced" />
          <Field label="Role" name="role" placeholder="USG · SOMETHING" />
        </div>
        <div className="form-row">
          <Select label="Department" name="department" options={DEPARTMENTS} />
          <Field label="Order" name="sort" type="number" defaultValue={rows.length + 1} />
        </div>
        <Toggle label="Published on the site" name="published" defaultChecked />
      </RecordForm>
    </>
  );
}
