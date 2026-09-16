import { useMemo, useState } from 'react'
import { evidenceItems, type EvidenceStatus } from '../data/paper'
import { Icon } from './Icon'

const filters: Array<{ id: 'all' | EvidenceStatus; label: string }> = [
  { id: 'all', label: '全部主张' },
  { id: 'supported', label: '证据充分' },
  { id: 'partial', label: '部分支持' },
  { id: 'unsupported', label: '尚未证明' },
]

const statusMeta: Record<EvidenceStatus, { label: string; icon: 'check' | 'warning' | 'x' }> = {
  supported: { label: 'SUPPORTED', icon: 'check' },
  partial: { label: 'PARTIAL', icon: 'warning' },
  unsupported: { label: 'UNSUPPORTED', icon: 'x' },
}

export function EvidenceMatrix() {
  const [filter, setFilter] = useState<'all' | EvidenceStatus>('all')
  const [expandedId, setExpandedId] = useState(evidenceItems[0].id)

  const items = useMemo(
    () => evidenceItems.filter((item) => filter === 'all' || item.status === filter),
    [filter],
  )

  return (
    <div className="evidence-shell">
      <div className="evidence-toolbar">
        <div className="segmented-control segmented-control--wrap">
          {filters.map((item) => (
            <button
              className={filter === item.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="evidence-count">{items.length} 条主张</span>
      </div>

      <div className="evidence-list">
        {items.map((item) => {
          const isExpanded = expandedId === item.id
          const meta = statusMeta[item.status]
          return (
            <article className={`evidence-card evidence-card--${item.status} ${isExpanded ? 'is-expanded' : ''}`} key={item.id}>
              <button
                aria-expanded={isExpanded}
                className="evidence-card__head"
                onClick={() => setExpandedId(isExpanded ? '' : item.id)}
                type="button"
              >
                <span className="evidence-id">{item.id}</span>
                <span className={`status-pill status-pill--${item.status}`}>
                  <Icon name={meta.icon} size={14} />
                  {meta.label}
                </span>
                <strong>{item.claim}</strong>
                <Icon className={`evidence-chevron ${isExpanded ? 'is-open' : ''}`} name="chevron" size={18} />
              </button>

              {isExpanded ? (
                <div className="evidence-card__body">
                  <div className="evidence-field">
                    <span>证据位置</span>
                    <div className="evidence-tokens">
                      {item.evidence.map((source) => <b key={source}>{source}</b>)}
                    </div>
                  </div>
                  <div className="evidence-field">
                    <span>适用范围</span>
                    <p>{item.scope}</p>
                  </div>
                  <div className="evidence-field evidence-field--insight">
                    <span>分析结论</span>
                    <p>{item.insight}</p>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}
