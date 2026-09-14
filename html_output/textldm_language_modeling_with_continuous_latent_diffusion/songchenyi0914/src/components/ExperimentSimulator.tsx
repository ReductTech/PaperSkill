import { useState, type CSSProperties } from 'react'
import { Icon } from './Icon'

type DatasetId = 'wikisource' | 'wikipedia' | 'tinystories' | 'onebillionwords'
type DitSize = 114 | 328 | 768
type VaeSize = 350 | 502 | 690
type ChannelSize = 32 | 64 | 128 | 192
type TrainingSteps = 1 | 2
type Schedule = 'uniform' | 'logit12' | 'logit15'
type MetricKey = 'r1' | 'r2' | 'rl' | 'bert' | 'mauve'

type Metrics = Record<MetricKey, number>

type SimulationConfig = {
  dataset: DatasetId
  vaeSize: VaeSize
  channel: ChannelSize
  repa: boolean
  repaLayer: 'last' | 'thirdLast'
  ditSize: DitSize
  trainingSteps: TrainingSteps
  schedule: Schedule
  cfg: number
  inferenceSteps: 10 | 20 | 50
}

type SimulationResult = {
  metrics: Metrics
  ranges: Metrics
  qualityScore: number
  generalizationRisk: number
  computeIndex: number
  nfe: number
  findings: string[]
}

const metricKeys: MetricKey[] = ['r1', 'r2', 'rl', 'bert', 'mauve']
const metricLabels: Record<MetricKey, string> = {
  r1: 'Surrogate ROUGE-1',
  r2: 'Surrogate ROUGE-2',
  rl: 'Surrogate ROUGE-L',
  bert: 'Surrogate BERTScore',
  mauve: 'Surrogate MAUVE',
}

const datasetMeta: Record<DatasetId, { label: string; note: string; risk: number }> = {
  wikisource: { label: 'WikiSource', note: '长篇开放域 · 明显域外', risk: 64 },
  wikipedia: { label: 'Wikipedia', note: '百科文本 · 域外泛化', risk: 60 },
  tinystories: { label: 'TinyStories', note: '较短 · 分布较接近', risk: 22 },
  onebillionwords: { label: 'One Billion Words', note: '短句 · 相对域内', risk: 16 },
}

const anchors: Record<DatasetId, Record<DitSize, Metrics>> = {
  wikisource: {
    114: { r1: 33.0, r2: 6.6, rl: 16.6, bert: 80.3, mauve: 21.6 },
    328: { r1: 33.1, r2: 6.8, rl: 16.9, bert: 80.7, mauve: 27.6 },
    768: { r1: 37.5, r2: 16.5, rl: 25.7, bert: 84.3, mauve: 32.7 },
  },
  wikipedia: {
    114: { r1: 27.5, r2: 5.9, rl: 15.9, bert: 81.0, mauve: 8.9 },
    328: { r1: 27.6, r2: 6.2, rl: 16.2, bert: 81.3, mauve: 10.5 },
    768: { r1: 38.9, r2: 8.1, rl: 17.6, bert: 82.7, mauve: 10.1 },
  },
  tinystories: {
    114: { r1: 36.7, r2: 7.8, rl: 20.7, bert: 84.8, mauve: 1.0 },
    328: { r1: 37.1, r2: 8.3, rl: 21.1, bert: 85.2, mauve: 1.13 },
    768: { r1: 39.7, r2: 10.4, rl: 23.4, bert: 85.8, mauve: 1.51 },
  },
  onebillionwords: {
    114: { r1: 10.3, r2: 0.73, rl: 9.4, bert: 83.1, mauve: 0.77 },
    328: { r1: 10.8, r2: 0.88, rl: 9.8, bert: 83.4, mauve: 0.79 },
    768: { r1: 21.4, r2: 3.6, rl: 17.4, bert: 85.0, mauve: 0.8 },
  },
}

const factor = (values: Metrics, key: MetricKey) => values[key]

const repaOff: Metrics = { r1: 0.853, r2: 0.677, rl: 0.864, bert: 0.964, mauve: 0.123 }
const layerLast: Metrics = { r1: 1.015, r2: 0.969, rl: 0.994, bert: 0.999, mauve: 0.809 }
const channelFactors: Record<ChannelSize, Metrics> = {
  32: { r1: 0.95, r2: 0.958, rl: 0.965, bert: 1.0, mauve: 0.982 },
  64: { r1: 1.0, r2: 1.0, rl: 1.0, bert: 1.0, mauve: 1.0 },
  128: { r1: 0.95, r2: 0.928, rl: 0.988, bert: 0.995, mauve: 0.747 },
  192: { r1: 0.985, r2: 0.943, rl: 1.018, bert: 0.995, mauve: 0.645 },
}
const vaeFactors: Record<VaeSize, Metrics> = {
  350: { r1: 1.0, r2: 1.0, rl: 1.0, bert: 1.0, mauve: 1.0 },
  502: { r1: 0.985, r2: 0.969, rl: 0.964, bert: 1.0, mauve: 1.064 },
  690: { r1: 1.018, r2: 1.015, rl: 0.988, bert: 1.0, mauve: 1.074 },
}
const scheduleFactors: Record<Schedule, Metrics> = {
  uniform: { r1: 0.939, r2: 0.914, rl: 0.965, bert: 0.996, mauve: 0.85 },
  logit12: { r1: 0.86, r2: 0.671, rl: 0.895, bert: 0.984, mauve: 0.458 },
  logit15: { r1: 1.0, r2: 1.0, rl: 1.0, bert: 1.0, mauve: 1.0 },
}
const stepFactors: Record<1 | 2, Metrics> = {
  1: { r1: 0.96, r2: 0.96, rl: 0.97, bert: 0.99, mauve: 0.9 },
  2: { r1: 1.0, r2: 1.0, rl: 1.0, bert: 1.0, mauve: 1.0 },
}
const inferenceFactors: Record<10 | 20 | 50, Metrics> = {
  10: { r1: 0.9, r2: 0.9, rl: 0.91, bert: 0.97, mauve: 0.88 },
  20: { r1: 0.96, r2: 0.96, rl: 0.97, bert: 0.99, mauve: 0.95 },
  50: { r1: 1.0, r2: 1.0, rl: 1.0, bert: 1.0, mauve: 1.0 },
}
const cfgFactors: Record<number, Metrics> = {
  3: { r1: 0.978, r2: 0.827, rl: 0.935, bert: 0.996, mauve: 1.04 },
  4: { r1: 0.989, r2: 0.901, rl: 0.958, bert: 0.996, mauve: 1.08 },
  5: { r1: 0.992, r2: 0.938, rl: 0.986, bert: 0.998, mauve: 1.06 },
  6: { r1: 1.003, r2: 0.975, rl: 0.981, bert: 1.0, mauve: 1.02 },
  7: { r1: 1.0, r2: 1.0, rl: 1.0, bert: 1.0, mauve: 1.0 },
  8: { r1: 0.978, r2: 0.951, rl: 0.991, bert: 0.999, mauve: 0.96 },
}

const defaultConfig: SimulationConfig = {
  dataset: 'wikisource',
  vaeSize: 350,
  channel: 64,
  repa: true,
  repaLayer: 'thirdLast',
  ditSize: 768,
  trainingSteps: 2,
  schedule: 'logit15',
  cfg: 7,
  inferenceSteps: 50,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const calculate = (config: SimulationConfig): SimulationResult => {
  const base = anchors[config.dataset][config.ditSize]
  const metrics = {} as Metrics
  const ranges = {} as Metrics

  metricKeys.forEach((key) => {
    let value = base[key]
    if (!config.repa) value *= factor(repaOff, key)
    if (config.repa && config.repaLayer === 'last') value *= factor(layerLast, key)
    value *= factor(channelFactors[config.channel], key)
    value *= factor(vaeFactors[config.vaeSize], key)
    value *= factor(scheduleFactors[config.schedule], key)
    value *= factor(stepFactors[config.trainingSteps], key)
    value *= factor(inferenceFactors[config.inferenceSteps], key)
    value *= factor(cfgFactors[config.cfg], key)
    metrics[key] = key === 'mauve' ? Math.max(0.02, value) : Math.max(0, value)
  })

  const reference = anchors[config.dataset][768]
  const weights: Metrics = { r1: 0.3, r2: 0.15, rl: 0.15, bert: 0.2, mauve: 0.2 }
  const qualityScore = clamp(
    metricKeys.reduce((score, key) => score + (metrics[key] / reference[key]) * weights[key] * 100, 0),
    5,
    125,
  )

  let risk = datasetMeta[config.dataset].risk
  if (!config.repa) risk += 20
  if (config.repa && config.repaLayer === 'last') risk += 5
  if (config.channel === 32 || config.channel === 192) risk += 7
  if (config.schedule !== 'logit15') risk += 5
  if (config.trainingSteps === 1) risk += 8
  if (config.inferenceSteps === 10) risk += 7
  if (config.channel === 64) risk -= 3
  if (config.trainingSteps === 2) risk -= 5
  risk = clamp(risk, 5, 96)

  const ditFactor = config.ditSize === 114 ? 0.35 : config.ditSize === 328 ? 0.6 : 1
  const vaeFactor = config.vaeSize === 350 ? 1 : config.vaeSize === 502 ? 1.18 : 1.35
  const inferenceFactor = config.inferenceSteps === 10 ? 0.2 : config.inferenceSteps === 20 ? 0.4 : 1
  const trainingFactor = config.trainingSteps === 1 ? 0.8 : 1
  const computeIndex = Math.round(
    ((18 + 46 * ditFactor * inferenceFactor + 10 * vaeFactor + 8 * trainingFactor) / 82) * 100,
  )
  const uncertainty = 0.025 + (risk / 100) * 0.075

  metricKeys.forEach((key) => {
    ranges[key] = metrics[key] * uncertainty
  })

  const findings: string[] = []
  if (!config.repa) findings.push('关闭 REPA 会显著削弱开放域生成，尤其会压低 MAUVE 与 ROUGE-2 的预期水平。')
  if (config.cfg >= 8) findings.push('CFG=8 通常带来轻微退化，可能是条件约束增强后生成多样性下降。')
  if (config.cfg <= 4) findings.push('较低 CFG 更接近未引导生成，通常有利于多样性，但条件一致性可能不足。')
  if (config.inferenceSteps === 10) findings.push('10 步推理预计产生明显采样误差；若做效率实验，应与 50 步主设置同时回报质量。')
  if (config.trainingSteps === 1) findings.push('1M steps 主要适合消融比较，不应直接与 2M steps 主结果做等预算结论。')
  if ((config.dataset === 'wikisource' || config.dataset === 'wikipedia') && config.channel >= 128) findings.push('域外长文本上，较大 latent channel 没有稳定收益，并可能降低多样性指标。')
  if (findings.length === 0) findings.push('该组合接近论文的稳定配置区间；仍需用真实训练与多随机种子验证。')

  return {
    metrics,
    ranges,
    qualityScore,
    generalizationRisk: risk,
    computeIndex,
    nfe: config.inferenceSteps,
    findings,
  }
}

const formatMetric = (key: MetricKey, value: number) => (key === 'mauve' ? value.toFixed(2) : value.toFixed(1))

export function ExperimentSimulator() {
  const [draft, setDraft] = useState<SimulationConfig>(defaultConfig)
  const [result, setResult] = useState<SimulationResult>(() => calculate(defaultConfig))
  const [isRunning, setIsRunning] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const update = <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setIsDirty(true)
  }

  const run = () => {
    setIsRunning(true)
    window.setTimeout(() => {
      setResult(calculate(draft))
      setIsRunning(false)
      setIsDirty(false)
    }, 720)
  }

  const reset = () => {
    setDraft(defaultConfig)
    setResult(calculate(defaultConfig))
    setIsDirty(false)
    setIsRunning(false)
  }

  return (
    <div className="simulator-shell">
      <div className="simulator-head">
        <div>
          <p className="eyebrow">Paper-anchored surrogate</p>
          <h3>参数化代理趋势实验台</h3>
          <p>
            参数变化会先映射为论文 Table 1-4 中的相对趋势，再生成代理指标。结果用于理解变量方向和权衡，
            不是作者实验的复现值，也不能当作真实训练结果。
          </p>
        </div>
        <span className="surrogate-badge"><Icon name="flask" size={15} />Heuristic simulation</span>
      </div>

      <div className="simulator-layout">
        <div className="simulator-controls">
          <div className="sim-control sim-control--wide">
            <label>评测数据集</label>
            <div className="segmented-control segmented-control--wrap">
              {(Object.keys(datasetMeta) as DatasetId[]).map((id) => (
                <button className={draft.dataset === id ? 'is-active' : ''} key={id} onClick={() => update('dataset', id)} type="button">
                  {datasetMeta[id].label}
                </button>
              ))}
            </div>
            <small>{datasetMeta[draft.dataset].note}</small>
          </div>

          <div className="sim-grid">
            <label className="sim-control">
              <span>VAE 规模</span>
              <select value={draft.vaeSize} onChange={(event) => update('vaeSize', Number(event.target.value) as VaeSize)}>
                <option value={350}>350M</option>
                <option value={502}>502M</option>
                <option value={690}>690M</option>
              </select>
            </label>
            <label className="sim-control">
              <span>Latent channel</span>
              <select value={draft.channel} onChange={(event) => update('channel', Number(event.target.value) as ChannelSize)}>
                <option value={32}>32</option>
                <option value={64}>64</option>
                <option value={128}>128</option>
                <option value={192}>192</option>
              </select>
            </label>
            <label className="sim-control">
              <span>DiT 规模</span>
              <select value={draft.ditSize} onChange={(event) => update('ditSize', Number(event.target.value) as DitSize)}>
                <option value={114}>114M</option>
                <option value={328}>328M</option>
                <option value={768}>768M</option>
              </select>
            </label>
            <label className="sim-control">
              <span>训练步数</span>
              <select value={draft.trainingSteps} onChange={(event) => update('trainingSteps', Number(event.target.value) as TrainingSteps)}>
                <option value={1}>1M steps</option>
                <option value={2}>2M steps</option>
              </select>
            </label>
            <label className="sim-control">
              <span>时间步调度</span>
              <select value={draft.schedule} onChange={(event) => update('schedule', event.target.value as Schedule)}>
                <option value="uniform">Uniform</option>
                <option value="logit12">Logit-normal 1.2</option>
                <option value="logit15">Logit-normal 1.5</option>
              </select>
            </label>
            <label className="sim-control">
              <span>推理步数</span>
              <select value={draft.inferenceSteps} onChange={(event) => update('inferenceSteps', Number(event.target.value) as 10 | 20 | 50)}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className="sim-switches">
            <button className={draft.repa ? 'is-active' : ''} onClick={() => update('repa', !draft.repa)} type="button">
              <span>REPA</span><strong>{draft.repa ? '启用' : '关闭'}</strong>
            </button>
            <label className="sim-control">
              <span>REPA 对齐层</span>
              <select disabled={!draft.repa} value={draft.repaLayer} onChange={(event) => update('repaLayer', event.target.value as 'last' | 'thirdLast')}>
                <option value="last">倒数第一层</option>
                <option value="thirdLast">倒数第三层</option>
              </select>
            </label>
          </div>

          <label className="sim-range">
            <div><span>CFG scale</span><strong>{draft.cfg}</strong></div>
            <input min="3" max="8" step="1" type="range" value={draft.cfg} onChange={(event) => update('cfg', Number(event.target.value))} />
            <div className="range-labels"><span>3 更自由</span><span>7 推荐</span><span>8 更强约束</span></div>
          </label>

          <div className="sim-actions">
            <button className="button button--primary" disabled={isRunning} onClick={run} type="button">
              <Icon name="play" size={15} />{isRunning ? '模拟计算中…' : '运行模拟'}
            </button>
            <button className="button button--ghost" onClick={reset} type="button">恢复论文默认</button>
            {isDirty ? <span>参数已变化，结果尚未更新</span> : <span>结果与当前参数同步</span>}
          </div>
        </div>

        <div className={`simulator-results ${isRunning ? 'is-running' : ''}`}>
          <div className="sim-score-row">
            <div className="sim-score" style={{ '--score': `${Math.min(result.qualityScore, 100) * 3.6}deg` } as CSSProperties}>
              <div><strong>{Math.round(result.qualityScore)}</strong><span>QUALITY</span></div>
            </div>
            <div className="sim-score-copy">
              <p className="eyebrow">Surrogate quality index</p>
              <h4>{result.qualityScore >= 90 ? '接近论文最优区间' : result.qualityScore >= 72 ? '具有竞争力的配置' : result.qualityScore >= 55 ? '需要谨慎权衡' : '存在明显退化风险'}</h4>
              <p>综合代理 ROUGE、BERTScore 与 MAUVE 相对于论文 768M 默认结果的编者评分；不是论文指标。</p>
            </div>
          </div>

          <div className="sim-metrics">
            {metricKeys.map((key) => {
              const anchor = anchors[draft.dataset][draft.ditSize][key]
              const delta = ((result.metrics[key] - anchor) / Math.max(anchor, 0.01)) * 100
              return (
                <article key={key}>
                  <span>{metricLabels[key]}</span>
                  <strong>{formatMetric(key, result.metrics[key])}</strong>
                  <small>± {formatMetric(key, result.ranges[key])}</small>
                  <div className={`metric-delta ${delta >= 0 ? 'is-positive' : 'is-negative'}`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs size anchor
                  </div>
                </article>
              )
            })}
          </div>

          <div className="sim-diagnostics">
            <div><span>编者泛化风险</span><strong>{Math.round(result.generalizationRisk)}</strong><small>/ 100</small></div>
            <div><span>编者计算指数</span><strong>{result.computeIndex}</strong><small>/ 100</small></div>
            <div><span>Euler steps</span><strong>{result.nfe}</strong><small>selected inference steps</small></div>
          </div>

          <div className="sim-findings">
            <div className="sim-findings__title"><Icon name="target" size={17} /><strong>代理趋势结论</strong></div>
            <ul>
              {result.findings.map((finding) => <li key={finding}>{finding}</li>)}
            </ul>
          </div>

          <p className="sim-disclaimer">
            模型假设：以论文 114M/328M/768M 的主结果为锚点，乘入 Table 2-4 的消融比例；部分没有直接报告的组合采用局部插值。
            模拟值不含随机种子、数据噪声和实现差异，仅用于教学与实验设计。
          </p>
          <div className="sim-evidence-key">
            <span><b>论文锚点</b>Table 1 主结果；Table 2-4 中直接报告的消融比例。</span>
            <span><b>编者启发式</b>10/20-step 衰减、MAUVE-CFG 关系、泛化风险和计算指数均为网页定义，不是作者结果。</span>
          </div>
        </div>
      </div>
    </div>
  )
}



