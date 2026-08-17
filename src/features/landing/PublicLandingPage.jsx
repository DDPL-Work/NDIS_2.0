import { useRef, useState } from 'react'
import './landing.css'
import useScrollReveal from './useScrollReveal'
import PublicHeader from './sections/PublicHeader'
import HeroSection from './sections/HeroSection'
import TrustSection from './sections/TrustSection'
import ServicesSection from './sections/ServicesSection'
import HowItWorksSection from './sections/HowItWorksSection'
import DistrictExplorerSection from './sections/DistrictExplorerSection'
import ComplaintSection from './sections/ComplaintSection'
import SchemesSection from './sections/SchemesSection'
import WhyNdisSection from './sections/WhyNdisSection'
import FinalCtaSection from './sections/FinalCtaSection'
import PublicFooter from './sections/PublicFooter'
import PublicLandingTour, { hasCompletedTour } from './PublicLandingTour'

// Public entry page — works fully unauthenticated. Auth-aware header shows
// "Continue to Citizen Portal" for signed-in users; the hero search uses the
// public spatial-query API; the map visual is a lightweight illustration (the
// real GIS engine stays on /citizen/map).
export default function PublicLandingPage() {
  const pageRef = useRef(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStarted, setTourStarted] = useState(false)
  useScrollReveal(pageRef)

  const startTour = () => { setTourStarted(true); setTourOpen(true) }

  return (
    <div ref={pageRef} className="bg-white font-body text-ink-900">
      <PublicHeader onStartTour={startTour} />
      <main id="main">
        <HeroSection />
        <TrustSection />
        <ServicesSection />
        <HowItWorksSection />
        <DistrictExplorerSection />
        <ComplaintSection />
        <SchemesSection />
        <WhyNdisSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
      {tourStarted && <PublicLandingTour open={tourOpen} onClose={() => setTourOpen(false)} />}
      {!hasCompletedTour() && !tourStarted && <PublicLandingTour open onClose={() => setTourOpen(false)} />}
    </div>
  )
}