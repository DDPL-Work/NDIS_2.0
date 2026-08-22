import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, MapPin, Building2, Users, Target, FolderGit2, Lightbulb, ExternalLink } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import GapScoreRing from '../../../components/ui/GapScoreRing'
import PriorityDisplay from './PriorityDisplay'

const LEVEL_CONFIG = {
  district: { label: 'District', icon: MapPin, key: 'districtId', nameKey: 'districtName' },
  block: { label: 'Block', icon: MapPin, key: 'blockId', nameKey: 'blockName' },
  village: { label: 'Village', icon: MapPin, key: 'villageId', nameKey: 'villageName' },
  facility: { label: 'Facility', icon: Building2, key: 'id', nameKey: 'name' },
}

function DrilldownNode({ node, level, depth = 0, onSelect, onExplain, onAction, expandedKeys }) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.facility
  const isExpanded = expandedKeys.has(node.id || node[config.key])
  const hasChildren = node.children && node.children.length > 0
  const priority = node.priority || (node.score != null ? scoreToPriority(node.score) : 'P4')
  const score = node.score ?? node.gapScore ?? node.priorityScore ?? null

  const priorityMeta = {
    P1: { tone: 'alert', color: '#c0392b' },
    P2: { tone: 'saffron', color: '#e07a2c' },
    P3: { tone: 'sky', color: '#0b3558' },
    P4: { tone: 'leaf', color: '#1f7a54' },
  }
  const meta = priorityMeta[priority] || priorityMeta.P4

  const indent = depth * 24

  return (
    <div className="border-l border-ink-100 pl-4" style={{ marginLeft: indent }}>
      <div className="relative">
        <div className="flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-ink-50/50 transition cursor-pointer"
             onClick={() => hasChildren && toggleExpanded(node.id || node[config.key])}>
          {/* Expand/collapse */}
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id || node[config.key]) }}
              className="p-1 rounded text-ink-400 hover:text-ink-700 shrink-0"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Priority indicator */}
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: meta.color }} />

          {/* Icon + Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <config.icon className="text-sky-600 shrink-0" size={14} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-ink-950 truncate">{node[config.nameKey] || node.name || 'Unnamed'}</span>
                <Badge tone={meta.tone} className="text-[9px]">{priority}</Badge>
                {node.departmentName && <Badge tone="ink" className="text-[9px]">{node.departmentName}</Badge>}
              </div>
              <div className="flex items-center gap-2 text-[10.5px] text-ink-500 mt-0.5">
                {score != null && (
                  <GapScoreRing score={Number(score)} size={24} strokeWidth={3} />
                )}
                {node.population && (
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {Number(node.population).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onExplain && (
              <button onClick={(e) => { e.stopPropagation(); onExplain(node) }} className="p-1.5 rounded text-ink-400 hover:text-ink-700 hover:bg-ink-100" title="Explain score">
                <Target size={13} />
              </button>
            )}
            {onAction && (
              <button onClick={(e) => { e.stopPropagation(); onAction(node) }} className="p-1.5 rounded text-sky-600 hover:text-sky-900 hover:bg-sky-50" title="Recommended action">
                <Lightbulb size={13} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onSelect?.(node) }} className="p-1.5 rounded text-ink-400 hover:text-ink-700 hover:bg-ink-100" title="View details">
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {node.children.map((child, idx) => (
              <DrilldownNode
                key={child.id || child[config.key] || idx}
                node={child}
                level={getChildLevel(level)}
                depth={depth + 1}
                onSelect={onSelect}
                onExplain={onExplain}
                onAction={onAction}
                expandedKeys={expandedKeys}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function scoreToPriority(score) {
  const s = Number(score)
  if (s >= 0.75) return 'P1'
  if (s >= 0.5) return 'P2'
  if (s >= 0.25) return 'P3'
  return 'P4'
}

function getChildLevel(parentLevel) {
  if (parentLevel === 'district') return 'block'
  if (parentLevel === 'block') return 'village'
  if (parentLevel === 'village') return 'facility'
  return 'facility'
}

function toggleExpanded(key) {
  // This will be handled by parent state
}

export default function Drilldown({ drilldownData, onSelect, onExplain, onAction }) {
  const [expandedKeys, setExpandedKeys] = useState(new Set())

  const toggleExpanded = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!drilldownData) {
    return (
      <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-8 text-center">
        <MapPin className="mx-auto text-ink-300 mb-2" size={32} />
        <p className="text-ink-500">No drilldown data available.</p>
        <p className="text-ink-400 text-sm mt-1">The backend did not return hierarchy data.</p>
      </div>
    )
  }

  // Drilldown data can be an array (multiple districts) or single district object
  const districts = Array.isArray(drilldownData) ? drilldownData : [drilldownData]

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-[14px] font-semibold text-ink-950">Hierarchical Drilldown</h3>
        <p className="text-[11px] text-ink-500">District → Block → Village → Facility</p>
      </div>

      <div className="space-y-3">
        {districts.map((district, idx) => (
          <DrilldownNode
            key={district.id || district.districtId || idx}
            node={district}
            level="district"
            depth={0}
            onSelect={onSelect}
            onExplain={onExplain}
            onAction={onAction}
            expandedKeys={expandedKeys}
          />
        ))}
      </div>
    </div>
  )
}