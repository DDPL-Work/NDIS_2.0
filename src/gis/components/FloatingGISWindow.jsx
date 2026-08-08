import GISDockableWidget from './GISDockableWidget'

/** Enterprise map-window public API. Kept separate so all GIS overlays share one contract. */
export default function FloatingGISWindow({ title, defaultPosition, defaultWidth, defaultHeight, children, ...props }) {
  const initialDock = defaultPosition?.dock || props.initialDock || 'float'
  const initialPosition = defaultPosition?.position || props.initialPosition
  return <GISDockableWidget title={title} initialDock={initialDock} initialPosition={initialPosition} initialSize={{ width: defaultWidth || 340, height: defaultHeight || 'auto' }} {...props}>{children}</GISDockableWidget>
}
