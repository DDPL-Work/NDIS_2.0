import * as Lucide from 'lucide-react'

// Lets nav/config files reference icons by string name (data, not code) —
// same "configuration not code" pattern used for departments/roles.
export default function Icon({ name, size = 16, className }) {
  const Cmp = Lucide[name] || Lucide.Circle
  return <Cmp size={size} className={className} />
}
