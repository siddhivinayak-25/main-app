import PublicNavbar from '../components/homepage/PublicNavbar';
import Hero from '../components/homepage/Hero';
import FeatureShowcase from '../components/homepage/FeatureShowcase';
import Footer from '../components/homepage/Footer';

export default function Homepage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <PublicNavbar />
      <main className="flex-1">
        <Hero />
        <FeatureShowcase />
      </main>
      <Footer />
    </div>
  );
}
