import { Ambient } from '@/components/site/Ambient';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* Rendered here, not per page, so it stays continuous across routes. */}
      <Ambient />

      <Header />

      <main id="main">{children}</main>

      <Footer />
    </>
  );
}
