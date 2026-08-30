import { requireStaffPage } from '@/lib/auth';
import { getScheduleDays } from '@/lib/content';
import { saveDay, deleteDay, saveSession, deleteSession } from '@/lib/actions/content';
import { RecordForm, Field, TextArea, Select, Toggle } from '@/components/admin/RecordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Schedule' };

const KINDS: Array<[string, string]> = [
  ['committee', 'Committee session'],
  ['ceremony', 'Ceremony'],
  ['break', 'Break / meal'],
  ['social', 'Social'],
  ['check', 'Registration / check-in'],
];

export default async function ScheduleAdminPage() {
  await requireStaffPage('superadmin');
  const days = await getScheduleDays();

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Site content</p>
          <h1 className="console__title">Schedule</h1>
        </div>
        <span className="readout">
          {days.length} DAYS · {days.reduce((n, d) => n + d.sessions.length, 0)} SESSIONS
        </span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 24 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          Leave a day&rsquo;s date blank while calendar dates are under embargo: the public page
          shows &ldquo;Date to be announced&rdquo; and the timings still publish.
        </span>
      </div>

      {days.map((day) => (
        <div key={day.id} style={{ marginBottom: 34 }}>
          <RecordForm
            action={saveDay}
            onDelete={deleteDay}
            deleteId={day.id}
            title={`${day.label}, ${day.title}`}
            subtitle={`${day.sessions.length} SESSIONS${day.date ? ` · ${day.date}` : ' · DATE TBA'}`}
          >
            <input type="hidden" name="id" value={day.id} />
            <div className="form-row form-row--three">
              <Field label="Label" name="label" defaultValue={day.label} hint="e.g. DAY 01" />
              <Field label="Date" name="date" defaultValue={day.date} type="date" />
              <Field label="Order" name="sort" defaultValue={day.sort} type="number" />
            </div>
            <Field label="Title" name="title" defaultValue={day.title} />
            <TextArea label="Summary" name="note" defaultValue={day.note} rows={2} />
            <Toggle label="Published on the site" name="published" defaultChecked={day.published} />
          </RecordForm>

          <div style={{ paddingLeft: 20, borderLeft: '1px solid var(--line-gold)' }}>
            {day.sessions.map((session) => (
              <RecordForm
                key={session.id}
                action={saveSession}
                onDelete={deleteSession}
                deleteId={session.id}
                title={session.title}
                subtitle={`${session.startsAt ?? 'TBA'}-${session.endsAt ?? ''} · ${session.kind.toUpperCase()}`}
              >
                <input type="hidden" name="id" value={session.id} />
                <input type="hidden" name="dayId" value={day.id} />

                <div className="form-row form-row--three">
                  <Field label="Starts" name="startsAt" defaultValue={session.startsAt} hint="09:00" />
                  <Field label="Ends" name="endsAt" defaultValue={session.endsAt} hint="11:30" />
                  <Select label="Kind" name="kind" defaultValue={session.kind} options={KINDS} />
                </div>

                <Field label="Title" name="title" defaultValue={session.title} />
                <TextArea label="Detail" name="detail" defaultValue={session.detail} rows={2} />

                <div className="form-row">
                  <Field label="Venue" name="venue" defaultValue={session.venue} />
                  <Field label="Order" name="sort" defaultValue={session.sort} type="number" />
                </div>
              </RecordForm>
            ))}

            <RecordForm
              action={saveSession}
              title={`Add a session to ${day.label}`}
              saveLabel="Add session"
            >
              <input type="hidden" name="id" value={0} />
              <input type="hidden" name="dayId" value={day.id} />
              <div className="form-row form-row--three">
                <Field label="Starts" name="startsAt" placeholder="09:00" />
                <Field label="Ends" name="endsAt" placeholder="11:30" />
                <Select label="Kind" name="kind" options={KINDS} />
              </div>
              <Field label="Title" name="title" />
              <Field label="Venue" name="venue" />
              <Field label="Order" name="sort" type="number" defaultValue={day.sessions.length + 1} />
            </RecordForm>
          </div>
        </div>
      ))}

      <RecordForm action={saveDay} title="Add a day" saveLabel="Create">
        <input type="hidden" name="id" value={0} />
        <div className="form-row form-row--three">
          <Field label="Label" name="label" placeholder="DAY 04" />
          <Field label="Date" name="date" type="date" />
          <Field label="Order" name="sort" type="number" defaultValue={days.length + 1} />
        </div>
        <Field label="Title" name="title" />
        <Toggle label="Published on the site" name="published" defaultChecked />
      </RecordForm>
    </>
  );
}
