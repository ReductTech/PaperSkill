import { useState } from 'react'
import { methodStages } from '../data/paper'
import { Icon } from './Icon'

export function MethodLab() {
  const [activeId, setActiveId] = useState(methodStages[0].id)
  const active = methodStages.find((stage) => stage.id === activeId) ?? methodStages[0]

  return (
    <div className="method-lab">
      <div className="method-rail" role="tablist" aria-label="TextLDM 方法阶段">
        {methodStages.map((stage, index) => (
          <button
            aria-selected={stage.id === active.id}
            className={`method-rail__item ${stage.id === active.id ? 'is-active' : ''}`}
            key={stage.id}
            onClick={() => setActiveId(stage.id)}
            role="tab"
            type="button"
          >
            <span className="method-rail__index">{stage.index}</span>
            <span className="method-rail__copy">
              <strong>{stage.title.split('：')[0]}</strong>
              <small>{stage.eyebrow}</small>
            </span>
            {index < methodStages.length - 1 ? <span className="method-rail__connector" /> : null}
          </button>
        ))}
      </div>

      <article className={`method-detail method-detail--${active.accent}`}>
        <div className="method-detail__topline">
          <p className="eyebrow">{active.eyebrow}</p>
          <span className="method-detail__badge">
            <Icon name="flow" size={16} />
            Minimal modification
          </span>
        </div>
        <h3>{active.title}</h3>
        <p className="method-detail__summary">{active.summary}</p>

        <div className="method-detail__grid">
          <ul className="method-bullets">
            {active.bullets.map((bullet) => (
              <li key={bullet}>
                <span><Icon name="check" size={15} /></span>
                {bullet}
              </li>
            ))}
          </ul>

          <div className="formula-card">
            <span>{active.formulaLabel}</span>
            <code>{active.formula}</code>
            <p>公式用于表达结构与训练目标，详细符号定义以论文为准。</p>
          </div>
        </div>
      </article>
    </div>
  )
}
