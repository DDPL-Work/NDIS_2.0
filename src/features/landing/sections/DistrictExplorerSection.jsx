import { Link } from 'react-router-dom'
import { Compass, MapPinned, Navigation } from 'lucide-react'
import Button from '../../../components/ui/Button'
import AnimatedDistrictVisual from './AnimatedDistrictVisual'

// The district explorer reuses the same lightweight SVG visual as the hero —
// the full GIS engine (43 MB facilities collection, Leaflet, plugins) is NOT
// loaded on the public landing page. "Explore Map" opens the existing citizen
// map where the real engine lives.
export default function DistrictExplorerSection() {
  return (
    <section id="explore" className="bg-white py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div className="ndisp-scroll-reveal">
          <p className="eyebrow">Explore Your District</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Know What’s Around You</h2>
          <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-ink-500">
            Discover hospitals, schools, public facilities, infrastructure and other important places around you — mapped for your district.
          </p>
          <ul className="mt-6 space-y-3">
            {['Find facilities nearest to you', 'See which department looks after what', 'Locate water, health and education services', 'Check public projects in your area'].map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[13.5px] text-ink-700">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-50 text-leaf-600"><Navigation size={11} /></span>
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/citizen/map"><Button size="lg" variant="primary" icon={MapPinned}>Explore Map</Button></Link>
            <Link to="/citizen/map"><Button size="lg" variant="outline" icon={Compass}>Find Nearby</Button></Link>
          </div>
        </div>

        <div className="ndisp-scroll-reveal stagger-1">
          <AnimatedDistrictVisual />
        </div>
      </div>
    </section>
  )
}