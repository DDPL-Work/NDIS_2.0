// RevenueHeader — Top command header matching tax_revenue.html
import { useState, useRef, useEffect } from 'react'
import { Button, Input, Badge } from '../../../components/ui'
import {
  Compass, Layers, MapPin, Filter,
  MessageCircle, Camera, Building, FileText,
  List, Search, ChevronRight, User, Power,
  LayoutDashboard, Layers as LayersIcon, LogIn
} from 'lucide-react'

const HEADER_ACTIONS = [
  { id: 'dmDashboard', label: 'DM Dashboard', icon: LayoutDashboard, className: 'bg-blue-600/20 border-blue-500 text-blue-400' },
  { id: 'spatialQuery', label: 'Spatial Query', icon: Layers, className: 'bg-emerald-600/20 border-emerald-500 text-emerald-400' },
  { id: 'citizenFeedback', label: 'Citizen Feedback', icon: MessageCircle, className: 'bg-amber-600/20 border-amber-500 text-amber-400' },
  { id: 'geotagExif', label: 'Geotag EXIF', icon: Camera, className: 'bg-purple-600/20 border-purple-500 text-purple-400' },
  { id: 'facilitiesDirectory', label: 'Facilities Directory', icon: Building, className: 'bg-sky-600/20 border-sky-500 text-sky-400', isLink: true, href: '/facilities/' },
]

export function RevenueHeader({
  totalLayers = 0,
  activeLayers = 0,
  onAction,
  user = null,
  className = '',
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchContainerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Handle click outside to close expanded search
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    onAction?.('search', searchQuery.trim())
    setShowSearch(false)
  }

  const handleSearchFocus = () => setShowSearch(true)
  const handleSearchBlur = () => setTimeout(() => setShowSearch(false), 200)

  return (
    <header className={`h-16 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-50 ${className}`}>
      {/* Brand */}
      <div className="brand-container flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block">
          <div className="font-bold text-white text-lg font-heading tracking-tight">NALANDA DDSS</div>
          <div className="text-[11px] text-slate-400">District Geospatial Decision Support System</div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="hidden lg:flex items-center gap-4 ml-6 border-l border-slate-800 pl-6">
        <Badge variant="outline" className="gap-1.5 bg-slate-900/50 border-slate-700 text-slate-300">
          <LayersIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Layers: <strong className="text-blue-400">{totalLayers}</strong></span>
        </Badge>
        <Badge variant="outline" className="gap-1.5 bg-slate-900/50 border-slate-700 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Loaded: <strong className="text-emerald-400">{activeLayers}</strong></span>
        </Badge>
        <button
          onClick={() => onAction?.('dmDashboard')}
          className="badge gap-1.5 bg-slate-900/50 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
          title="Open DM Decision Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
          <span>DM Dashboard: <strong className="text-blue-400">Active</strong></span>
        </button>
        <button
          onClick={() => onAction?.('spatialQuery')}
          className="badge gap-1.5 bg-slate-900/50 border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
          title="Open Multi-Layer Spatial Query Builder"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>GIS Analytics: <strong className="text-emerald-400">Multi-Layer</strong></span>
        </button>
      </div>

      {/* Header Actions */}
      <div className="header-actions flex items-center gap-2 ml-auto flex-wrap">
        {/* Integrated Search */}
        <div ref={searchContainerRef} className={`relative flex items-center ${showSearch ? 'w-72' : 'w-auto'}`}>
          <form onSubmit={handleSearch} className="flex items-center w-full">
            <div className={`search-container flex items-center bg-slate-800/50 border border-slate-700 rounded-full px-3 py-1.5 transition-all duration-200 ${showSearch ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/20' : ''}`}>
              <Search className={`w-4 h-4 transition-colors ${showSearch ? 'text-blue-600' : 'text-slate-400'}`} />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search by name / mobile..."
                className={`bg-transparent border-none outline-none text-sm ${showSearch ? 'w-56 text-slate-900 placeholder:text-slate-400' : 'w-40 md:w-52 text-white placeholder:text-slate-400'}`}
                style={{ minWidth: showSearch ? '220px' : '180px' }}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className={`search-action-btn w-7 h-7 rounded-full flex items-center justify-center transition-all ${searchQuery.trim() ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                title="Search Property"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-1.5">
          {HEADER_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => action.isLink ? undefined : onAction?.(action.id)}
              className={`btn-header-nav px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all border ${action.className} hover:shadow-md`}
              title={action.label}
            >
              <action.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Pay Tax - Prominent */}
        <button
          onClick={() => onAction?.('payTax')}
          className="btn-header-nav btn-header-tax px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border border-emerald-500/30 shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-emerald-500/40 transition-all"
          title="Pay Property Tax Online"
        >
          <FileText className="w-4 h-4" />
          <span>Pay Tax</span>
        </button>

        {/* Tax List - Cyan/Blue */}
        <button
          onClick={() => onAction?.('taxList')}
          className="btn-header-nav px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 bg-sky-600/20 border-sky-500 text-sky-400 hover:bg-sky-600/30 hover:border-sky-400 transition-all"
          title="View Complete Paid & Unpaid Properties List"
        >
          <List className="w-4 h-4" />
          <span>Tax List</span>
        </button>

        {/* User / Auth */}
        {user ? (
          <div className="user-header-badge flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-full">
            <div className="user-avatar-sm w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="font-medium text-white hidden sm:inline">{user.name || 'User'}</span>
            <button onClick={() => onAction?.('logout')} className="text-red-400 hover:text-red-300 p-1" title="Logout">
              <Power className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <a href="/login/" className="btn-header-login px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all">
            <LogIn className="w-4 h-4" />
            Sign In / Register
          </a>
        )}
      </div>
    </header>
  )
}

export default RevenueHeader