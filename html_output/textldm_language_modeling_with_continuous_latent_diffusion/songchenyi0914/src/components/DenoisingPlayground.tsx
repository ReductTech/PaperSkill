import { useEffect, useState, type CSSProperties } from 'react'
import { denoisingExample } from '../data/paper'
import { Icon } from './Icon'

const clarityByStep: Record<number, number> = {
  0: 0,
  10: 8,
  20: 29,
  30: 42,
  40: 61,
  50: 74,
}

export function DenoisingPlayground() {
  const [snapshotIndex, setSnapshotIndex] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const snapshot = denoisingExample.snapshots[snapshotIndex]
  const lastIndex = denoisingExample.snapshots.length - 1

  useEffect(() => {
    if (!isPlaying) return undefined
    const timer = window.setInterval(() => {
      setSnapshotIndex((current) => {
        if (current >= lastIndex) {
          setIsPlaying(false)
          return current
        }
        return current + 1
      })
    }, 1050)
    return () => window.clearInterval(timer)
  }, [isPlaying, lastIndex])

  const selectStep = (value: number) => {
    setSnapshotIndex(Math.round(value / 10))
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      return
    }
    if (snapshotIndex === lastIndex) setSnapshotIndex(1)
    setIsPlaying(true)
  }

  return (
    <div className="denoising-lab">
      <div className="denoising-head">
        <div>
          <p className="eyebrow">Appendix D · Progressive denoising</p>
          <h3>同一 prompt 的去噪步数可视化</h3>
          <p>拖动滑块查看论文 Table 7 在同一条件下的逐步输出。文字保持原文，不做润色或语义补全。</p>
        </div>
        <div className="denoising-head__actions">
          <span><Icon name="book" size={14} />{denoisingExample.source}</span>
          <button className={isPlaying ? 'is-active' : ''} onClick={togglePlay} type="button">
            <Icon name={isPlaying ? 'pause' : 'play'} size={14} />
            {isPlaying ? '暂停播放' : '自动播放'}
          </button>
        </div>
      </div>

      <div className="prompt-lock">
        <div className="prompt-lock__label"><Icon name="layers" size={15} /><span>Fixed prompt</span></div>
        <p>{denoisingExample.prompt}</p>
      </div>

      <div className="denoising-timeline">
        <div className="denoising-timeline__line">
          <span style={{ width: `${(snapshot.step / 50) * 100}%` }} />
        </div>
        {denoisingExample.snapshots.map((item, index) => (
          <button
            aria-current={index === snapshotIndex ? 'step' : undefined}
            className={`${index === snapshotIndex ? 'is-active' : ''} ${index < snapshotIndex ? 'is-complete' : ''}`}
            key={item.step}
            onClick={() => selectStep(item.step)}
            type="button"
          >
            <span>{item.step}</span>
            <small>{item.step === 0 ? 'init' : item.label}</small>
          </button>
        ))}
      </div>

      <div className="denoising-control">
        <div className="denoising-control__value">
          <span>Denoising step</span>
          <strong>{snapshot.step}</strong>
          <small>/ 50</small>
        </div>
        <input
          aria-label="Denoising step"
          min="0"
          max="50"
          step="10"
          type="range"
          value={snapshot.step}
          onChange={(event) => selectStep(Number(event.target.value))}
        />
        <div className="denoising-control__labels">
          <span>0 噪声</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50 最终快照</span>
        </div>
      </div>

      <div className="denoising-grid">
        <section className="denoising-output">
          <div className="denoising-output__head">
            <div>
              <span>Decoded text at step {snapshot.step}</span>
              <small>{snapshot.step === 0 ? 'No paper text sample' : 'Exact paper excerpt'}</small>
            </div>
            <span className={`denoising-state denoising-state--${snapshot.step}`}>
              {snapshot.step === 0 ? '初始化' : snapshot.label}
            </span>
          </div>

          {snapshot.text ? (
            <p className="denoising-text" key={snapshot.step}>{snapshot.text}</p>
          ) : (
            <div className="noise-placeholder" key="noise">
              <div className="noise-glyphs" aria-hidden="true">
                {Array.from({ length: 90 }, (_, index) => <span key={index}>{index % 7 === 0 ? '10' : index % 4 === 0 ? '×' : '·'}</span>)}
              </div>
              <strong>潜在噪声，尚未解码</strong>
              <p>论文未提供 Step 0 文本。此处仅表示扩散起点，不对应任何作者输出。</p>
            </div>
          )}

          <div className="denoising-output__foot">
            <Icon name="shield" size={14} />
            {snapshot.step === 0 ? '该状态为初始化示意，不引用论文文本。' : '文本原样引自 Appendix D，Table 7，未进行纠正或改写。'}
          </div>
        </section>

        <aside className="denoising-diagnosis">
          <div className="denoising-diagnosis__title">
            <p className="eyebrow">Editorial reading guide</p>
            <h4>{snapshot.label}</h4>
            <span>编者阅读标注，不是论文指标</span>
          </div>

          <div className="denoising-facts">
            <div><span>连贯性</span><strong>{snapshot.coherence}</strong></div>
            <div><span>事实可靠性</span><strong>{snapshot.factual}</strong></div>
          </div>

          <div className="clarity-meter">
            <div><span>阅读可理解度</span><strong>{clarityByStep[snapshot.step]}%</strong></div>
            <div className="clarity-meter__track">
              <span style={{ width: `${clarityByStep[snapshot.step]}%` }} />
            </div>
            <small>主观阅读诊断，仅用于比较同一样例的步数变化。</small>
          </div>

          <div className="denoising-diagnosis__copy">
            <Icon name="target" size={17} />
            <p>{snapshot.diagnosis}</p>
          </div>
        </aside>
      </div>

      <div className="denoising-notes">
        <article><span>TEXT · LOW</span><strong>低步数：语义混乱</strong><p>词块尚未形成稳定句法和实体关系。</p></article>
        <article><span>TEXT · HIGH</span><strong>高步数：连贯性提升</strong><p>句子结构和重复模式逐步稳定。</p></article>
        <article className="denoising-notes__warning"><span>FACT CHECK</span><strong>通顺不等于事实正确</strong><p>Table 7 的 Step 50 仍包含事实错误，不能仅凭流畅度判真。</p></article>
      </div>

      <p className="denoising-source-note">{denoisingExample.note}</p>
    </div>
  )
}
