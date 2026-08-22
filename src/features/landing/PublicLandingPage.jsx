import { useCallback, useRef, useState } from 'react'
import './landing.css'
import useScrollReveal from './useScrollReveal'
import PublicHeader from './sections/PublicHeader'
import HeroSection from './sections/HeroSection'
import ServicesSection from './sections/ServicesSection'
import DistrictExplorerSection from './sections/DistrictExplorerSection'
import ComplaintSection from './sections/ComplaintSection'
import OnePlatformSection from './sections/OnePlatformSection'
import ScenarioSection from './sections/ScenarioSection'
import SchemesSection from './sections/SchemesSection'
import WhyNdisSection from './sections/WhyNdisSection'
import TrustSection from './sections/TrustSection'
import FinalCtaSection from './sections/FinalCtaSection'
import PublicFooter from './sections/PublicFooter'
import PublicLandingTour from './PublicLandingTour'

// Public entry page — works fully unauthenticated. Auth-aware header shows
// "Continue to Citizen Portal" for signed-in users; the hero search uses the
// public spatial-query API; the map visual is a lightweight illustration (the
// real GIS engine stays on /citizen/map). Section order follows the landing
// rhythm: hero → services → explorer → complaint journey → one platform →
// scenarios → schemes → why → trust → final CTA.
export default function PublicLandingPage() {
  const pageRef = useRef(null)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourStarted, setTourStarted] = useState(false)
  const [pendingSearch, setPendingSearch] = useState(null)
  useScrollReveal(pageRef)

  const startTour = () => { setTourStarted(true); setTourOpen(true) }

  // Funnels every "find something" action (quick action, marker, scenario)
  // into the single public search engine, scrolling the hero into view first.
  const requestSearch = useCallback((query) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    document.getElementById('top')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    setPendingSearch(query)
  }, [])

  return (
    <div ref={pageRef} className="bg-white font-body text-ink-900">
      <PublicHeader onStartTour={startTour} />
      <main id="main">
        <HeroSection requestSearch={requestSearch} externalQuery={pendingSearch} />
        <ServicesSection />
        <DistrictExplorerSection requestSearch={requestSearch} />
        <ComplaintSection />
        <OnePlatformSection />
        <ScenarioSection onFindHospital={() => requestSearch('Nearest hospital')} />
        <SchemesSection />
        <WhyNdisSection />
        <TrustSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
      {tourStarted && <PublicLandingTour open={tourOpen} onClose={() => setTourOpen(false)} />}
    </div>
  )
}
