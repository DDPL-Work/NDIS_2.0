import { Link } from 'react-router-dom'
import { Sparkles, UserPlus } from 'lucide-react'
import Button from '../../../components/ui/Button'
import AnimatedDistrictVisual from './AnimatedDistrictVisual'
import HeroSearch from './HeroSearch'

export default function HeroSection() {
  return (
    <section id="top" className="ndisp-gradient-pan bg-gradient-to-br from-ink-50 via-white to-saffron-50/50 pt-28 pb-14 sm:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div className="text-center lg:text-left">
          <p className="ndisp-fade-in mx-auto inline-flex items-center gap-1.5 rounded-full border border-saffron-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-saffron-700 lg:mx-0">
            <Sparkles size={13} />Government services, made simple
          </p>
          <h1 className="ndisp-reveal mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-5xl xl:text-6xl">
            Your District. Your Services. <span className="text-ink-900">Your Voice.</span>
          </h1>
          <p className="ndisp-scroll-reveal mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-600 lg:mx-0">
            Access public services, discover facilities, raise complaints, track requests and stay connected with your district — all in one place.
          </p>

          <div className="ndisp-scroll-reveal mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link to="/register"><Button size="lg" variant="saffron">Get Started</Button></Link>
            <a href="#services"><Button size="lg" variant="outline">Explore Services</Button></a>
            <span className="mx-1 hidden h-5 w-px bg-ink-200 sm:block" aria-hidden="true" />
            <Link to="/login" className="text-[13.5px] font-semibold text-ink-700 underline-offset-4 hover:underline">Login</Link>
            <Link to="/register" className="flex items-center gap-1 text-[13.5px] font-semibold text-saffron-700 underline-offset-4 hover:underline"><UserPlus size={14} />Create Account</Link>
          </div>

          <div className="ndisp-scroll-reveal mx-auto mt-9 max-w-2xl lg:mx-0" data-tour-target="hero-search">
            <HeroSearch />
          </div>
        </div>

        <div className="ndisp-scroll-reveal hidden sm:block" data-tour-target="hero-map">
          <AnimatedDistrictVisual />
        </div>
      </div>
    </section>
  )
}