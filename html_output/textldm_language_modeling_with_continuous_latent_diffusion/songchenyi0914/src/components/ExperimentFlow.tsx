import { useEffect, useState } from 'react'
import { experimentSteps } from '../data/paper'
import { Icon } from './Icon'

export function ExperimentFlow() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const active = experimentSteps[activeIndex]
  const progress = experimentSteps.length > 1 ? (activeIndex / (experimentSteps.length - 1)) * 100 : 0

  useEffect(() => {
    if (!isPlaying) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % experimentSteps.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [isPlaying])

  const selectStep = (index: number) => {
    setActiveIndex(index)
    setIsPlaying(false)
  }

  const move = (offset: number) => {
    setActiveIndex((current) => {
      const next = current + offset
      if (next < 0) return experimentSteps.length - 1
      if (next >= experimentSteps.length) return 0
      return next
    })
    setIsPlaying(false)
  }

  return (
    <div className={`experiment-flow experiment-flow--${active.tone}`}>
      <div className="flow-toolbar">
        <div className="flow-toolbar__copy">
          <span>Experiment runner</span>
          <strong>从数据准备到证据归因的完整闭环</strong>
        </div>
        <div className="flow-toolbar__controls">
          <button onClick={() => move(-1)} type="button">
            <Icon name="chevron" size={16} />
            上一步
          </button>
          <button
            aria-pressed={isPlaying}
            className={isPlaying ? 'is-active' : ''}
            onClick={() => setIsPlaying((playing) => !playing)}
            type="button"
          >
            <Icon name={isPlaying ? 'pause' : 'play'} size={15} />
            {isPlaying ? '暂停流程' : '播放流程'}
          </button>
          <button onClick={() => move(1)} type="button">
            下一步
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </div>

      <div className="flow-map">
        <div className="flow-map__track">
          <span className="flow-map__progress" style={{ width: `${progress}%` }} />
        </div>
        {experimentSteps.map((step, index) => (
          <button
            aria-current={index === activeIndex ? 'step' : undefined}
            className={`flow-node ${index === activeIndex ? 'is-active' : ''} ${index < activeIndex ? 'is-complete' : ''}`}
            key={step.id}
            onClick={() => selectStep(index)}
            type="button"
          >
            <span className="flow-node__index">
              {index < activeIndex ? <Icon name="check" size={13} /> : step.index}
            </span>
            <span className="flow-node__copy">
              <small>{step.phase}</small>
              <strong>{step.short}</strong>
            </span>
          </button>
        ))}
      </div>

      <article className="flow-detail" aria-live="polite">
        <div className="flow-detail__head">
          <div>
            <p className="eyebrow">Step {active.index} / {active.phase}</p>
            <h3>{active.title}</h3>
            <p>{active.objective}</p>
          </div>
          <span className="flow-evidence">
            <Icon name="book" size={15} />
            {active.evidence}
          </span>
        </div>

        <div className="flow-detail__grid">
          <section>
            <div className="flow-column-title"><span>01</span><strong>实验输入</strong></div>
            <ul>
              {active.inputs.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section className="flow-detail__operation">
            <div className="flow-column-title"><span>02</span><strong>执行操作</strong></div>
            <ul>
              {active.operations.map((item) => (
                <li key={item}><Icon name="check" size={14} />{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <div className="flow-column-title"><span>03</span><strong>阶段产物</strong></div>
            <ul>
              {active.outputs.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>

        <div className="flow-note">
          <Icon name="spark" size={18} />
          <div><span>试验口径与边界</span><p>{active.note}</p></div>
        </div>

        <div className="flow-explanation">
          <section>
            <p className="eyebrow">Detailed explanation</p>
            <h4>这一步为什么这样设计</h4>
            <p>{active.explanation}</p>
          </section>
          <section>
            <p className="eyebrow">Watch points</p>
            <h4>审阅或复现时应重点检查</h4>
            <ul>
              {active.watchpoints.map((point) => (
                <li key={point}><Icon name="warning" size={14} />{point}</li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </div>
  )
}

