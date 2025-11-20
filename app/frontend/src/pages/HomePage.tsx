import { HeroSection } from '../components/home/HeroSection';
import { JourneySection } from '../components/home/JourneySection';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { CTASection } from '../components/home/CTASection';

export function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <JourneySection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
