import { asc } from 'drizzle-orm';
import { db, faqs } from '@/db';
import { requireStaffPage } from '@/lib/auth';
import { saveFaq, deleteFaq } from '@/lib/actions/content';
import { RecordForm, Field, TextArea, Toggle } from '@/components/admin/RecordForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'FAQs' };

export default async function FaqsAdminPage() {
  await requireStaffPage('superadmin');
  const rows = await db.select().from(faqs).orderBy(asc(faqs.sort));

  const categories = [...new Set(rows.map((r) => r.category))];

  return (
    <>
      <div className="console__head">
        <div>
          <p className="label">Site content</p>
          <h1 className="console__title">FAQs</h1>
        </div>
        <span className="readout">
          {rows.length} QUESTIONS · {categories.length} CATEGORIES
        </span>
      </div>

      <div className="alert" data-tone="info" style={{ marginBottom: 24 }}>
        <span className="alert__mark" aria-hidden="true">i</span>
        <span>
          Questions group by category on the public page, in sort order. Existing categories:{' '}
          {categories.join(', ')}.
        </span>
      </div>

      {rows.map((f) => (
        <RecordForm
          key={f.id}
          action={saveFaq}
          onDelete={deleteFaq}
          deleteId={f.id}
          title={f.question}
          subtitle={`${f.category.toUpperCase()}${f.published ? '' : ' · HIDDEN'}`}
        >
          <input type="hidden" name="id" value={f.id} />

          <Field label="Question" name="question" defaultValue={f.question} />
          <TextArea label="Answer" name="answer" defaultValue={f.answer} rows={4} />

          <div className="form-row">
            <Field label="Category" name="category" defaultValue={f.category} />
            <Field label="Order" name="sort" defaultValue={f.sort} type="number" />
          </div>

          <Toggle label="Published on the site" name="published" defaultChecked={f.published} />
        </RecordForm>
      ))}

      <RecordForm action={saveFaq} title="Add a question" saveLabel="Create">
        <input type="hidden" name="id" value={0} />
        <Field label="Question" name="question" />
        <TextArea label="Answer" name="answer" rows={4} />
        <div className="form-row">
          <Field label="Category" name="category" defaultValue="General" />
          <Field label="Order" name="sort" type="number" defaultValue={rows.length + 1} />
        </div>
        <Toggle label="Published on the site" name="published" defaultChecked />
      </RecordForm>
    </>
  );
}
