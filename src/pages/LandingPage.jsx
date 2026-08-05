import { lazy, Suspense } from 'react';
import Hero from '../components/Hero';
import { useLenis } from '../hooks/useLenis';

const Download = lazy(() => import('../components/Download'));
const Footer = lazy(() => import('../components/Footer'));

function SectionLoader() {
  return <div className="section-loader" aria-hidden="true" />;
}

export default function LandingPage() {
  useLenis();

  return (
    <>
      <main>
        <Hero />
        <Suspense fallback={<SectionLoader />}>
          <Download />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
