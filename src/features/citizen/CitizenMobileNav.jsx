import { NavLink } from 'react-router-dom'
import { FileText, Home, MapPinned, MoreHorizontal, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useI18n } from '../../i18n/i18n'

// Mobile bottom navigation (citizen portal only, < lg).  Five destinations:
// Home, Explore, Complaints, Schemes and "More" — everything else stays in the
// off-canvas sidebar opened by the hamburger and by "More".
const ITEMS = [
  { to: '/citizen', label: 'Home', icon: Home, end: true, tour: 'citizen-dashboard' },
  { to: '/citizen/map', label: 'Explore', icon: MapPinned, tour: 'citizen-explore-map' },
  { to: '/citizen/complaints', label: 'Complaints', icon: FileText, tour: 'citizen-my-complaints' },
  { to: '/citizen/schemes', label: 'Schemes', icon: Sparkles, tour: 'citizen-schemes' },
]

export default function CitizenMobileNav({ onOpenNav = () => {} }) {
  const { t } = useI18n()

  return (
    <nav
      aria-label="Mobile navigation"
      className="ndisp-bottom-nav lg:hidden fixed inset-x-0 bottom-0 z-[160] border-t border-ink-100 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-tour={item.tour}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium transition-colors',
                  isActive ? 'text-saffron-700' : 'text-ink-500 hover:text-ink-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={clsx('grid h-7 w-7 place-items-center rounded-full transition-colors', isActive && 'bg-saffron-50')}>
                    <Icon size={18} />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
        <button
          onClick={onOpenNav}
          className="flex flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium text-ink-500 transition-colors hover:text-ink-800"
          aria-label="More options"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full">
            <MoreHorizontal size={18} />
          </span>
          {t('bottomNav.more')}
        </button>
      </div>
    </nav>
  )
}