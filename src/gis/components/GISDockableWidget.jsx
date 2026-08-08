import { useEffect, useRef, useState } from 'react'
import { GripVertical, Maximize2, Minimize2, PanelBottom, PanelLeft, PanelRight, Pin, X } from 'lucide-react'
import { GISWindowManager } from './GISWindowManager'

const defaults = { left: { x: 16, y: 16 }, right: { x: null, y: 16 }, bottom: { x: 16, y: null }, float: { x: 28, y: 80 } }
export default function GISDockableWidget({ id, title, children, initialDock = 'float', initialSize = { width: 360, height: 'auto' }, initialPosition, className = '', onClose }) {
  const storageKey = `ndisp-gis-widget-${id}`; const elementRef = useRef(null)
  const [layout, setLayout] = useState(() => GISWindowManager.load(id, { dock: initialDock, size: initialSize, position: initialPosition, collapsed: false, pinned: true, zIndex: 40 }))
  const [dragging, setDragging] = useState(false)
  useEffect(() => { GISWindowManager.save(id, layout) }, [id, layout, storageKey])
  useEffect(() => {
    function move(event) { if (!dragging) return; setLayout((s) => ({ ...s, dock: 'float', position: { x: Math.max(0, event.clientX - dragging.x), y: Math.max(0, event.clientY - dragging.y) } })) }
    function up() { setDragging(false) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [dragging])
  const dock = layout.dock; const base = defaults[dock] || defaults.float; const pos = layout.position || base
  const style = dock === 'bottom' ? { left: 16, right: 16, bottom: layout.position?.bottom ?? 16, width: 'auto', height: layout.collapsed ? 36 : layout.size.height } : { left: dock === 'right' ? 'auto' : pos.x, right: dock === 'right' ? 16 : 'auto', top: pos.y, width: layout.size.width, height: layout.collapsed ? 36 : layout.size.height }
  return <section ref={elementRef} onPointerDown={() => setLayout((s) => ({ ...s, zIndex: GISWindowManager.bringToFront(id) }))} style={{ ...style, zIndex: layout.zIndex }} className={`absolute overflow-hidden rounded-xl border border-ink-200 bg-white/95 shadow-xl backdrop-blur transition-shadow ${dragging ? 'shadow-2xl ring-2 ring-saffron-300' : ''} ${className}`}>
    <header className="flex h-9 items-center gap-1 border-b border-ink-100 bg-ink-50/85 px-2 text-xs"><button aria-label={`Move ${title}`} onPointerDown={(event) => { const rect = elementRef.current.getBoundingClientRect(); setDragging({ x: event.clientX - rect.left, y: event.clientY - rect.top }) }} className="cursor-grab text-ink-400 active:cursor-grabbing"><GripVertical size={15}/></button><span className="min-w-0 flex-1 truncate font-semibold text-ink-800">{title}</span><button onClick={() => setLayout((s) => ({ ...s, pinned: !s.pinned }))} className={layout.pinned ? 'text-saffron-600' : 'text-ink-400'}><Pin size={13}/></button><button onClick={() => setLayout((s) => ({ ...s, dock: s.dock === 'left' ? 'right' : 'left' }))} title="Dock left/right" className="text-ink-400 hover:text-ink-800"><PanelLeft size={13}/></button><button onClick={() => setLayout((s) => ({ ...s, dock: 'bottom' }))} title="Dock bottom" className="text-ink-400 hover:text-ink-800"><PanelBottom size={13}/></button><button onClick={() => setLayout((s) => ({ ...s, dock: 'float' }))} title="Float" className="text-ink-400 hover:text-ink-800"><PanelRight size={13}/></button><button onClick={() => setLayout((s) => ({ ...s, collapsed: !s.collapsed }))} className="text-ink-400 hover:text-ink-800">{layout.collapsed ? <Maximize2 size={13}/> : <Minimize2 size={13}/>}</button>{onClose && <button onClick={onClose} className="text-ink-400 hover:text-ink-800"><X size={13}/></button>}</header>
    {!layout.collapsed && <div className="max-h-[calc(100vh-150px)] overflow-auto">{children}</div>}
    {dock === 'float' && !layout.collapsed && <div onPointerDown={(event) => { const rect = elementRef.current.getBoundingClientRect(); const start = { x: event.clientX, y: event.clientY, width: rect.width, height: rect.height }; const resize = (e) => setLayout((s) => ({ ...s, size: { width: Math.max(280, start.width + e.clientX - start.x), height: Math.max(120, start.height + e.clientY - start.y) } })); const stop = () => { window.removeEventListener('pointermove', resize); window.removeEventListener('pointerup', stop) }; window.addEventListener('pointermove', resize); window.addEventListener('pointerup', stop) }} className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize border-b-2 border-r-2 border-ink-300" />}
  </section>
}
