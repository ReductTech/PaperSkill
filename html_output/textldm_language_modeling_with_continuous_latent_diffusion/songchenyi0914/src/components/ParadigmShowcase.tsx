import { useEffect, useState } from 'react'
import { Icon } from './Icon'

type Mode = 'ar' | 'discrete' | 'latent'

const tokens = ['The', 'latent', 'space', 'supports', 'text', 'generation']
const revealOrder = [0, 3, 5, 1, 4, 2]
const modes: Array<{ id: Mode; short: string; label: string; kicker: string; description: string; icon: 'layers' | 'flow' | 'orbit' }> = [
  {
    id: 'ar',
    short: 'AR',
    label: 'Autoregressive',
    kicker: 'Sequential token prediction',
    description: '每次依赖前文生成一个 token，生成过程严格从左到右。',
    icon: 'layers',
  },
  {
    id: 'discrete',
    short: 'MASK',
    label: 'Discrete diffusion',
    kicker: 'LLaDA-style masked denoising',
    description: '全序列先被 mask，再迭代选择并替换 mask token。',
    icon: 'flow',
  },
  {
    id: 'latent',
    short: 'LATENT',
    label: 'TextLDM',
    kicker: 'Continuous latent flow matching',
    description: '噪声潜变量经过连续去噪形成 latent，再并行解码成完整文本。',
    icon: 'orbit',
  },
]

export function ParadigmShowcase() {
  const [mode, setMode] = useState<Mode>('ar')
  const [progress, setProgress] = useState(0)
  const [runId, setRunId] = useState(0)
  const duration = mode === 'latent' ? 3400 : 2700
  const activeMode = modes.find((item) => item.id === mode) ?? modes[0]

  useEffect(() => {
    setProgress(0)
    const start = performance.now()
    const timer = window.setInterval(() => {
      const next = Math.min((performance.now() - start) / duration, 1)
      setProgress(next)
      if (next >= 1) window.clearInterval(timer)
    }, 55)
    return () => window.clearInterval(timer)
  }, [duration, mode, runId])

  const visibleTokens = Math.min(Math.ceil(progress * tokens.length), tokens.length)
  const revealedMasks = Math.min(Math.floor(progress * tokens.length), tokens.length)
  const latentStage = progress < 0.45 ? 0 : progress < 0.78 ? 1 : 2

  return (
    <div className="paradigm-showcase">
      <div className="paradigm-showcase__head">
        <div>
          <p className="eyebrow">Text generation paradigms</p>
          <h2>三种生成路径，一次看懂</h2>
          <p>切换生成范式，观察 token、mask 和连续 latent 分别如何从条件走向完整输出。</p>
        </div>
        <button className="paradigm-replay" onClick={() => setRunId((value) => value + 1)} type="button">
          <Icon name="play" size={14} />重播动画
        </button>
      </div>

      <div className="paradigm-tabs" role="tablist" aria-label="文本生成范式">
        {modes.map((item) => (
          <button
            aria-selected={mode === item.id}
            className={mode === item.id ? 'is-active' : ''}
            key={item.id}
            onClick={() => setMode(item.id)}
            role="tab"
            type="button"
          >
            <span className="paradigm-tabs__icon"><Icon name={item.icon} size={19} /></span>
            <span><small>{item.short}</small><strong>{item.label}</strong></span>
          </button>
        ))}
      </div>

      <div className={`paradigm-stage paradigm-stage--${mode}`}>
        <div className="paradigm-stage__top">
          <div>
            <span>{activeMode.kicker}</span>
            <strong>{activeMode.label}</strong>
          </div>
          <span className="paradigm-progress-label">{Math.round(progress * 100)}%</span>
        </div>
        <div className="paradigm-progress"><span style={{ width: `${progress * 100}%` }} /></div>

        {mode === 'ar' && (
          <div className="ar-animation">
            <div className="sequence-label"><span>Token-by-token decoding</span><small>past tokens → next token</small></div>
            <div className="ar-tokens">
              {tokens.map((token, index) => (
                <span className={index < visibleTokens ? 'is-visible' : ''} key={token} style={{ transitionDelay: `${index * 45}ms` }}>
                  {token}
                </span>
              ))}
              <i className={visibleTokens < tokens.length ? 'is-visible' : ''} />
            </div>
            <div className="animation-caption">
              <Icon name="arrow" size={16} />
              <span>每一步只能看到已经生成的左侧前缀</span>
              <code>{'xₜ = p(xₜ | x₁, …, xₜ₋₁)'}</code>
            </div>
          </div>
        )}

        {mode === 'discrete' && (
          <div className="discrete-animation">
            <div className="sequence-label"><span>Iterative mask replacement</span><small>all positions start masked</small></div>
            <div className="discrete-tokens">
              {tokens.map((token, index) => {
                const revealIndex = revealOrder.indexOf(index)
                const revealed = revealIndex < revealedMasks
                return (
                  <span className={revealed ? 'is-revealed' : 'is-masked'} key={token}>
                    <b>{revealed ? token : 'MASK'}</b>
                    <small>p{index + 1}</small>
                  </span>
                )
              })}
            </div>
            <div className="animation-caption">
              <Icon name="spark" size={16} />
              <span>每轮可以并行更新多个被选择的 mask 位置</span>
              <code>iterative unmasking · discrete states</code>
            </div>
          </div>
        )}

        {mode === 'latent' && (
          <div className="latent-animation">
            <div className="latent-stages">
              <span className={latentStage === 0 ? 'is-active' : latentStage > 0 ? 'is-complete' : ''}><b>01</b>Gaussian noise</span>
              <i />
              <span className={latentStage === 1 ? 'is-active' : latentStage > 1 ? 'is-complete' : ''}><b>02</b>Latent field</span>
              <i />
              <span className={latentStage === 2 ? 'is-active' : ''}><b>03</b>Text decode</span>
            </div>
            <div className="latent-cells" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => {
                const local = Math.max(0, Math.min((progress - index * 0.035) / 0.55, 1))
                return (
                  <span
                    className={`latent-cell ${latentStage === 1 ? 'is-latent' : ''} ${latentStage === 2 ? 'is-decoded' : ''}`}
                    key={index}
                    style={{ opacity: 0.3 + local * 0.7, transform: `translateY(${(1 - local) * 5}px)` }}
                  />
                )
              })}
            </div>
            <div className="latent-decode">
              {tokens.map((token, index) => (
                <span className={(progress > 0.78 + index * 0.025) ? 'is-visible' : ''} key={token}>{token}</span>
              ))}
            </div>
            <div className="animation-caption">
              <Icon name="flow" size={16} />
              <span>连续 latent 先收敛，再一次性解码整个目标文本段</span>
              <code>noise → latent flow → parallel decode</code>
            </div>
          </div>
        )}

        <p className="paradigm-stage__description">{activeMode.description}</p>
      </div>

      <div className="paradigm-summary">
        <div><span>AR</span><strong>顺序生成</strong><p>质量依赖前缀，NFE 随生成长度增长。</p></div>
        <div><span>MASK</span><strong>离散迭代</strong><p>token 始终处于离散词表，通过 unmask 逐步显形。</p></div>
        <div><span>LATENT</span><strong>连续潜扩散</strong><p>先塑造连续表示，再并行解码为完整文本。</p></div>
      </div>
    </div>
  )
}
