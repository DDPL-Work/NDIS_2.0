import { Camera, Circle, Crosshair, Download, Expand, Flame, Layers, LocateFixed, Map, Maximize, Navigation, Printer, Ruler, Settings2, Triangle } from 'lucide-react'
const tools = [
  ['Layers', Layers], ['Locate', LocateFixed], ['Measure', Ruler], ['Buffer', Circle], ['Polygon', Triangle], ['Route', Navigation], ['Heatmap', Flame], ['Snapshot', Camera], ['Print', Printer], ['Export', Download], ['Settings', Settings2], ['Fullscreen', Expand],
]
export default function GISMapTools({ onTool, activeTool }) {
  return <div className="grid grid-cols-3 gap-1 p-2">{tools.map(([label, Icon]) => <button key={label} title={label} onClick={() => onTool?.(label.toLowerCase())} className={`group grid aspect-square place-items-center rounded-lg border text-ink-600 transition hover:border-saffron-300 hover:bg-saffron-50 hover:text-saffron-700 ${activeTool === label.toLowerCase() ? 'border-saffron-400 bg-saffron-50 text-saffron-700' : 'border-transparent'}`}><Icon size={17}/><span className="sr-only">{label}</span></button>)}</div>
}
