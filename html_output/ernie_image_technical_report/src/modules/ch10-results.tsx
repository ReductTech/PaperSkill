import React, { useState } from 'react'
import type { WidgetProps } from './registry'

type Protocol = 'geneval' | 'longtext' | 'oneig-en' | 'oneig-zh' | 'human'
type QualitativeFigure = 'photo' | 'instruction' | 'text'

type ResultRow = {
  name: string
  value: string
}

type ResultSet = {
  label: string
  metric: string
  evidence: string
  boundary: string
  rows: ResultRow[]
  conclusion: string
}

const RESULT_SETS: Record<Protocol, ResultSet> = {
  geneval: {
    label: 'GenEval',
    metric: '总体得分 ↑',
    evidence: '公开基准',
    boundary: '这里选取论文 GenEval 表中与总体结论直接相关的条目。',
    rows: [
      { name: 'ERNIE-Image（不使用 PE）', value: '0.89' },
      { name: 'Qwen-Image', value: '0.87' },
    ],
    conclusion: 'ERNIE-Image（不使用 PE）在论文 GenEval 表中的总体得分为 0.89，高于 Qwen-Image 的 0.87。',
  },
  longtext: {
    label: 'LongText',
    metric: '总体得分 ↑',
    evidence: '公开基准',
    boundary: '这里选取论文 LongText-Bench 表中总体得分最高项及 ERNIE-Image 对应项。',
    rows: [
      { name: 'Seedream 4.5', value: '0.988' },
      { name: 'ERNIE-Image（使用 PE）', value: '0.973' },
    ],
    conclusion: 'LongText-Bench 中 Seedream 4.5 为 0.988；ERNIE-Image（使用 PE）为 0.973。',
  },
  'oneig-en': {
    label: 'OneIG-EN',
    metric: '英文总体得分 ↑',
    evidence: '公开基准',
    boundary: '这里选取论文 OneIG-EN 表中的领先项与 ERNIE-Image 两种 PE 设置。',
    rows: [
      { name: 'Nano Banana 2.0', value: '0.578' },
      { name: 'Seedream 4.5', value: '0.576' },
      { name: 'ERNIE-Image（使用 PE）', value: '0.575' },
      { name: 'ERNIE-Image（不使用 PE）', value: '0.554' },
    ],
    conclusion: 'OneIG-EN 中 ERNIE-Image（使用 PE）为 0.575，接近 Nano Banana 2.0 的 0.578 与 Seedream 4.5 的 0.576。',
  },
  'oneig-zh': {
    label: 'OneIG-ZH',
    metric: '中文总体得分 ↑',
    evidence: '公开基准',
    boundary: '这里选取论文 OneIG-ZH 表中的领先项与 ERNIE-Image 两种 PE 设置。',
    rows: [
      { name: 'Nano Banana 2.0', value: '0.567' },
      { name: 'Seedream 4.0', value: '0.554' },
      { name: 'ERNIE-Image（使用 PE）', value: '0.554' },
      { name: 'ERNIE-Image（不使用 PE）', value: '0.521' },
    ],
    conclusion: 'OneIG-ZH 中 ERNIE-Image（使用 PE）为 0.554，与 Seedream 4.0 相同，低于 Nano Banana 2.0 的 0.567。',
  },
  human: {
    label: '内部人评',
    metric: '综合得分 ↑',
    evidence: '内部评测',
    boundary: '',
    rows: [
      { name: 'Nano Banana 2.0', value: '5.39' },
      { name: 'ERNIE-Image', value: '5.07' },
      { name: 'Seedream 5.0', value: '5.03' },
      { name: 'ERNIE-Image-Turbo', value: '4.65' },
    ],
    conclusion: '论文内部人评中 Nano Banana 2.0 为 5.39，ERNIE-Image 为 5.07，Seedream 5.0 为 5.03，Turbo 为 4.65。',
  },
}

const QUALITATIVE_FIGURES: Record<QualitativeFigure, { label: string; src: string; alt: string; caption: string }> = {
  photo: {
    label: '人像摄影',
    src: '/images/result-photo.png',
    alt: '论文中的人像摄影生成结果对比',
    caption: '人像摄影对比：比较面部细节、皮肤质感、姿态与整体真实感。',
  },
  instruction: {
    label: '复杂指令',
    src: '/images/result-instruction.png',
    alt: '论文中的复杂指令遵循结果对比',
    caption: '复杂指令对比：九个角色需要同时满足动作、服装与对应文字要求。',
  },
  text: {
    label: '中文文字',
    src: '/images/result-text.png',
    alt: '论文中的中文文字渲染结果对比',
    caption: '中文文字对比：观察标题、配料、步骤和页面布局是否准确、完整。',
  },
}

const PROTOCOLS = Object.entries(RESULT_SETS) as [Protocol, ResultSet][]
const QUALITATIVE_OPTIONS = Object.entries(QUALITATIVE_FIGURES) as [QualitativeFigure, (typeof QUALITATIVE_FIGURES)[QualitativeFigure]][]

export function Ch10ResultsWidget({ chapterId, moduleId }: WidgetProps) {
  const [figure, setFigure] = useState<QualitativeFigure>('photo')
  const [protocol, setProtocol] = useState<Protocol>('geneval')
  const selectedFigure = QUALITATIVE_FIGURES[figure]
  const selectedResult = RESULT_SETS[protocol]

  return (
    <section className="result-reader" aria-label="论文原始评测结果" data-chapter={chapterId} data-module={moduleId}>
      <div className="result-section-head">
        <strong>定性结果图</strong>
        <span>切换查看论文中的三组原始模型对比。</span>
      </div>
      <div className="chip-row" role="radiogroup" aria-label="选择论文定性结果图">
        {QUALITATIVE_OPTIONS.map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`chip ${figure === key ? 'selected' : ''}`}
            role="radio"
            aria-checked={figure === key}
            onClick={() => setFigure(key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <figure className="paper-figure result-original-figure">
        <img src={selectedFigure.src} alt={selectedFigure.alt} />
        <figcaption>{selectedFigure.caption}</figcaption>
      </figure>

      <div className="result-section-head result-quant-head">
        <strong>量化评测</strong>
      </div>
      <div className="chip-row" role="radiogroup" aria-label="选择量化评测协议">
        {PROTOCOLS.map(([key, data]) => (
          <button
            key={key}
            type="button"
            className={`chip ${protocol === key ? 'selected' : ''}`}
            role="radio"
            aria-checked={protocol === key}
            onClick={() => setProtocol(key)}
          >
            {data.label}
          </button>
        ))}
      </div>

      <div className="result-summary">
        <div><span>当前协议</span><strong>{selectedResult.label}</strong></div>
        <div><span>指标</span><strong>{selectedResult.metric}</strong></div>
        <div><span>来源</span><strong>{selectedResult.evidence}</strong></div>
      </div>
      <div className="paper-figure result-table-wrap">
        <table className="paper">
          <thead><tr><th>模型</th><th>{selectedResult.metric}</th></tr></thead>
          <tbody>
            {selectedResult.rows.map((row) => (
              <tr key={row.name}><td>{row.name}</td><td>{row.value}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="result-conclusion">{selectedResult.conclusion}</p>
      {selectedResult.boundary ? <p className="result-boundary">{selectedResult.boundary}</p> : null}
    </section>
  )
}

export default Ch10ResultsWidget
