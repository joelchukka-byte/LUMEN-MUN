import type { Metadata } from 'next';
import Link from 'next/link';
import { DownloadSimpleIcon, FilePdfIcon } from '@phosphor-icons/react/dist/ssr';
import { getMandatoryForms, getPublicDocuments } from '@/lib/content';
import { Reveal } from '@/components/ui/Reveal';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Forms & documents',
  description:
    'The mandatory forms every LUMEN MUN delegate must read and agree to, plus public conference documents.',
};

function formatDate(value: Date | string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fileSize(bytes: number | null) {
  if (!bytes) return null;
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export default async function FormsPage() {
  const [forms, documents] = await Promise.all([getMandatoryForms(), getPublicDocuments()]);

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1 className="h1">Forms &amp; documents</h1>
          <p className="lede page-head__lede">
            Every delegate reads and agrees to these three during registration. Print, sign and bring
            the signed copies to check-in.
          </p>
        </div>
      </section>

      <section className="section--sm" style={{ paddingTop: 0 }}>
        <div className="container">
          {forms.length > 0 ? (
            <div className="docs">
              {forms.map((form) => (
                <Reveal key={form.id}>
                  <article className="doc">
                    <FilePdfIcon className="doc__icon" size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="doc__title">{form.title}</p>
                      <p className="doc__meta">
                        {[formatDate(form.updatedAt) && `Updated ${formatDate(form.updatedAt)}`,
                          fileSize(form.sizeBytes)]
                          .filter(Boolean)
                          .join(' · ') || 'PDF document'}
                      </p>
                    </div>
                    <a className="btn btn--ghost btn--sm" href={form.file} target="_blank" rel="noopener">
                      View
                    </a>
                    <a className="btn btn--ghost btn--sm" href={form.file} download>
                      <DownloadSimpleIcon size={15} />
                      Download
                    </a>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="empty">
              <FilePdfIcon className="empty__icon" size={26} />
              <h3 className="h4">Forms publish before registration opens</h3>
              <p className="body-sm">
                You will also agree to all three inside the{' '}
                <Link className="link" href="/register">
                  registration form
                </Link>
                .
              </p>
            </div>
          )}

          <Reveal>
            <p className="notice" data-tone="accent" style={{ marginTop: '1.75rem' }}>
              <span>
                <strong>For parents and guardians:</strong> the liability and technology releases
                need a parent or guardian signature for delegates who are minors.
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {documents.length > 0 && (
        <section className="section--sm" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="section-head">
                <h2 className="h2 section-head__title">Conference documents</h2>
              </div>
            </Reveal>

            <div className="docs">
              {documents.map((doc) => (
                <Reveal key={doc.id}>
                  <a className="doc" href={doc.file} target="_blank" rel="noopener">
                    <FilePdfIcon className="doc__icon" size={24} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="doc__title">{doc.title}</span>
                      <span className="doc__meta">
                        {[doc.kind.replace(/_/g, ' '), fileSize(doc.sizeBytes)]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    <span className="doc__action">Open</span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
