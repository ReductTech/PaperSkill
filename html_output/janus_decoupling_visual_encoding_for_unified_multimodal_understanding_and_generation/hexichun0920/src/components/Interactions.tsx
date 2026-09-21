import { useMemo, useState } from 'react'
import {
  ablations,
  generationMetrics,
  trainingStages,
  understandingMetrics,
  type BenchmarkRow,
} from '../data'

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function ConflictLab() {
  const [semanticNeed, setSemanticNeed] = useState(82)
  const [detailNeed, setDetailNeed] = useState(86)
  const sharedPoint = (semanticNeed + (100 - detailNeed)) / 2
  const understandingFit = clamp(100 - Math.abs(sharedPoint - semanticNeed))
  const generationFit = clamp(100 - Math.abs(sharedPoint - (100 - detailNeed)))
  const sharedScore = Math.round((understandingFit + generationFit) / 2)
  const dualScore = Math.round((semanticNeed + detailNeed) / 2)

  return (
    <div className="interactive conflict-lab" aria-label="单编码器表征冲突实验">
      <div className="lab-head">
        <div>
          <span className="eyebrow">可操作实验 01</span>
          <h3>一条视觉通道，能同时看“意义”和“像素”吗？</h3>
        </div>
        <span className="lab-tag">概念模型 · 非论文指标</span>
      </div>
      <p className="muted">拖动两类任务的需求。单编码器只能选一个折中位置；双路径可以各自对准目标。</p>
      <div className="slider-grid">
        <label>
          <span>理解需要的语义抽象</span><b>{semanticNeed}%</b>
          <input type="range" min="50" max="100" value={semanticNeed} onChange={(e) => setSemanticNeed(+e.target.value)} />
        </label>
        <label>
          <span>生成需要的细节保真</span><b>{detailNeed}%</b>
          <input type="range" min="50" max="100" value={detailNeed} onChange={(e) => setDetailNeed(+e.target.value)} />
        </label>
      </div>
      <div className="spectrum" aria-label="抽象语义到像素细节的连续轴">
        <span>抽象语义</span><span>像素细节</span>
        <i className="target semantic" style={{ left: `${semanticNeed}%` }}><em>理解</em></i>
        <i className="target detail" style={{ left: `${100 - detailNeed}%` }}><em>生成</em></i>
        <i className="shared" style={{ left: `${sharedPoint}%` }}><em>共享折中</em></i>
      </div>
      <div className="score-pair">
        <article>
          <span>单编码器平均适配</span><strong>{sharedScore}</strong>
          <div className="meter"><i style={{ width: `${sharedScore}%` }} /></div>
          <small>一个表征位置同时服务两种相反需求</small>
        </article>
        <article className="accent-card">
          <span>双路径平均适配</span><strong>{dualScore}</strong>
          <div className="meter"><i style={{ width: `${dualScore}%` }} /></div>
          <small>SigLIP 保留语义，VQ Tokenizer 保留可重建细节</small>
        </article>
      </div>
      <p className="lab-foot">这只是帮助理解“表征粒度冲突”的教学模拟；论文证据请看后面的真实消融表。</p>
    </div>
  )
}

type RouteMode = 'text' | 'understanding' | 'generation'

const routeInfo: Record<RouteMode, { label: string; input: string; encoder: string; adaptor: string; head: string; output: string }> = {
  text: { label: '纯文本', input: '文本', encoder: 'LLM Tokenizer', adaptor: '词嵌入', head: '文本预测头', output: '下一个文本 token' },
  understanding: { label: '看图理解', input: '图像 + 问题', encoder: 'SigLIP', adaptor: '理解适配器', head: '文本预测头', output: '文本回答' },
  generation: { label: '文生图', input: '文本提示', encoder: 'VQ Tokenizer（训练目标）', adaptor: '生成适配器', head: '图像预测头', output: '离散图像 ID' },
}

export function ArchitectureRouter() {
  const [mode, setMode] = useState<RouteMode>('understanding')
  const current = routeInfo[mode]
  return (
    <div className={`interactive architecture ${mode}`}>
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 02</span><h3>切换任务，追踪数据走哪条路</h3></div>
        <div className="segmented" role="tablist">
          {(Object.keys(routeInfo) as RouteMode[]).map((key) => (
            <button key={key} className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{routeInfo[key].label}</button>
          ))}
        </div>
      </div>
      <div className="route-map">
        <div className="route-node input"><small>输入</small><b>{current.input}</b></div>
        <span className="route-arrow">→</span>
        <div className="route-node encoder"><small>{mode === 'generation' ? '离散视觉目标' : '编码器'}</small><b>{current.encoder}</b></div>
        <span className="route-arrow">→</span>
        <div className="route-node adaptor"><small>映射</small><b>{current.adaptor}</b></div>
        <span className="route-arrow">→</span>
        <div className="route-node brain"><small>始终共享</small><b>统一自回归 Transformer</b></div>
        <span className="route-arrow">→</span>
        <div className="route-node output"><small>{current.head}</small><b>{current.output}</b></div>
      </div>
      <div className="insight-callout">
        <b>关键边界：</b>Janus 解耦的是视觉编码，不是把整个模型拆成两个。两条视觉路径最终都进入同一个 Transformer。
      </div>
    </div>
  )
}

export function TokenWorkbench() {
  const [mode, setMode] = useState<'understand' | 'generate'>('understand')
  const [step, setStep] = useState(3)
  const understandTokens = ['<BOS>', '[连续视觉特征 × 576]', '问题：图中是什么？', '一', '只', '红', '色', '的', '鸟', '<EOS>']
  const generateTokens = ['<BOS>', '提示：雪中的灯塔', '<SOI>', 'v₁₂', 'v₄₀₉', 'v₈₈', 'v₁₀₂₄', '…', 'v₅₇₆', '<EOI>']
  const tokens = mode === 'understand' ? understandTokens : generateTokens
  const visible = tokens.slice(0, Math.min(step + 3, tokens.length))
  return (
    <div className="interactive token-workbench">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 03</span><h3>同一个“下一个 token”游戏</h3></div>
        <div className="segmented">
          <button className={mode === 'understand' ? 'active' : ''} onClick={() => { setMode('understand'); setStep(3) }}>图 → 文</button>
          <button className={mode === 'generate' ? 'active' : ''} onClick={() => { setMode('generate'); setStep(3) }}>文 → 图</button>
        </div>
      </div>
      <div className="token-strip">
        {visible.map((token, index) => <span key={`${token}-${index}`} className={index === visible.length - 1 ? 'next' : ''}>{token}</span>)}
        {visible.length < tokens.length && <span className="ghost-token">?</span>}
      </div>
      <div className="step-control">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>← 回退</button>
        <div><b>预测步 {step + 1}</b><small>{mode === 'generate' ? '图像 token 由独立图像头预测' : '文本 token 由 LLM 原生文本头预测'}</small></div>
        <button onClick={() => setStep((s) => Math.min(tokens.length - 3, s + 1))} disabled={visible.length >= tokens.length}>继续 →</button>
      </div>
      <p className="lab-foot">384×384 图像经 16 倍下采样得到 24×24＝576 个离散位置（由论文配置计算）。理解路径输入的是 SigLIP 连续特征；二者不能混为同一种视觉 token。</p>
    </div>
  )
}

export function TrainingConsole() {
  const [stageId, setStageId] = useState(1)
  const stage = trainingStages[stageId - 1]
  const modules = ['SigLIP', 'VQ Tokenizer', '理解适配器', '生成适配器', 'LLM', '文本预测头', '图像预测头']
  return (
    <div className="interactive training-console">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 04</span><h3>三阶段训练控制台</h3></div>
        <span className="lab-tag">论文表 1</span>
      </div>
      <div className="stage-tabs">
        {trainingStages.map((item) => <button key={item.id} className={stageId === item.id ? 'active' : ''} onClick={() => setStageId(item.id)}><i>0{item.id}</i><span>{item.name}</span></button>)}
      </div>
      <div className="stage-panel">
        <div>
          <span className="eyebrow">Stage {stage.id}</span>
          <h4>{stage.subtitle}</h4>
          <p>{stage.description}</p>
          <div className="module-status">
            {modules.map((module) => {
              const trainable = stage.trainable.includes(module) || (module === '文本预测头' && stage.id > 1)
              const frozen = stage.frozen.includes(module)
              return <span key={module} className={trainable ? 'hot' : frozen ? 'cold' : 'neutral'}>{trainable ? '●' : '❄'} {module}</span>
            })}
          </div>
        </div>
        <dl className="config-grid">
          <div><dt>训练步数</dt><dd>{stage.steps}</dd></div>
          <div><dt>Batch size</dt><dd>{stage.batch}</dd></div>
          <div><dt>学习率</dt><dd>{stage.lr}</dd></div>
          <div className="wide"><dt>三类数据比例</dt><dd>{stage.ratio}</dd><small>{stage.ratioLabels}</small></div>
        </dl>
      </div>
    </div>
  )
}

export function LossMaskLab() {
  const [task, setTask] = useState<'understanding' | 'generation'>('understanding')
  const sequence = task === 'understanding'
    ? [
        ['系统提示', false], ['用户问题', false], ['图像特征', false], ['Assistant:', false], ['这', true], ['是', true], ['一只', true], ['猫', true],
      ] as const
    : [
        ['文本提示', false], ['<SOI>', false], ['v₁', true], ['v₂', true], ['v₃', true], ['v₄', true], ['…', true], ['v₅₇₆', true],
      ] as const
  return (
    <div className="interactive loss-lab">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 05</span><h3>损失到底算在哪些 token 上？</h3></div>
        <div className="segmented">
          <button className={task === 'understanding' ? 'active' : ''} onClick={() => setTask('understanding')}>理解</button>
          <button className={task === 'generation' ? 'active' : ''} onClick={() => setTask('generation')}>生成</button>
        </div>
      </div>
      <div className="formula">ℒ = − Σᵢ log P<sub>θ</sub>(xᵢ | x&lt;ᵢ)</div>
      <div className="mask-strip">
        {sequence.map(([token, active], index) => <span key={`${token}-${index}`} className={active ? 'supervised' : 'masked'}><b>{token}</b><small>{active ? '计入 loss' : 'mask'}</small></span>)}
      </div>
      <p className="lab-foot">作者没有为不同任务设计不同损失权重：理解任务只对文本答案计算交叉熵；生成任务只对图像序列计算交叉熵。</p>
    </div>
  )
}

export function CFGLab() {
  const [scale, setScale] = useState(5)
  const conditional = 1.25
  const unconditional = 0.42
  const guided = unconditional + scale * (conditional - unconditional)
  const alignment = clamp(42 + scale * 8)
  const variety = clamp(100 - Math.max(0, scale - 1) * 8)
  return (
    <div className="interactive cfg-lab">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 06</span><h3>CFG：把提示词的方向放大多少？</h3></div>
        <span className="lab-tag">论文默认 s = 5</span>
      </div>
      <div className="cfg-layout">
        <div>
          <label className="range-label"><span>引导尺度 s</span><b>{scale.toFixed(1)}</b></label>
          <input type="range" min="0" max="10" step="0.5" value={scale} onChange={(e) => setScale(+e.target.value)} />
          <div className="formula small">l<sub>g</sub> = l<sub>u</sub> + s(l<sub>c</sub> − l<sub>u</sub>) = <b>{guided.toFixed(2)}</b></div>
          <p className="muted">示例 logit：无条件 {unconditional}，有条件 {conditional}。训练时有 10% 概率用 pad token 替换文本条件，以学会无条件生成。</p>
        </div>
        <div className="cfg-gauges">
          <div><span>示意：提示对齐</span><div className="meter"><i style={{ width: `${alignment}%` }} /></div><b>{alignment}%</b></div>
          <div><span>示意：采样多样性</span><div className="meter inverse"><i style={{ width: `${variety}%` }} /></div><b>{variety}%</b></div>
        </div>
      </div>
      <p className="lab-foot">两条百分比曲线是教学示意，不是论文报告的测量结果；真实论文只给出公式、10% 条件丢弃概率与默认 s=5。</p>
    </div>
  )
}

function MetricChart({ row }: { row: BenchmarkRow }) {
  const all = [{ name: 'Janus 1.3B', value: row.janus }, ...row.peers]
  const max = Math.max(...all.map((x) => x.value), 1)
  return (
    <div className="metric-chart">
      {all.map((item, index) => {
        const missing = item.value === 0
        return (
          <div className={index === 0 ? 'janus bar-row' : 'bar-row'} key={item.name}>
            <span>{item.name}</span>
            <div><i style={{ width: missing ? 0 : `${Math.max(7, item.value / max * 100)}%` }} /></div>
            <b>{missing ? '未报告' : item.value}</b>
          </div>
        )
      })}
    </div>
  )
}

export function BenchmarkExplorer() {
  const [family, setFamily] = useState<'understanding' | 'generation'>('understanding')
  const rows = family === 'understanding' ? understandingMetrics : generationMetrics
  const [index, setIndex] = useState(0)
  const safeIndex = Math.min(index, rows.length - 1)
  const row = rows[safeIndex]
  return (
    <div className="interactive benchmark-lab">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 07</span><h3>基准不是排行榜：先看方向，再看口径</h3></div>
        <div className="segmented">
          <button className={family === 'understanding' ? 'active' : ''} onClick={() => { setFamily('understanding'); setIndex(0) }}>理解</button>
          <button className={family === 'generation' ? 'active' : ''} onClick={() => { setFamily('generation'); setIndex(0) }}>生成</button>
        </div>
      </div>
      <div className="metric-tabs">
        {rows.map((metric, i) => <button className={safeIndex === i ? 'active' : ''} onClick={() => setIndex(i)} key={metric.metric}>{metric.metric}<small>{metric.direction === 'up' ? '↑ 越高越好' : '↓ 越低越好'}</small></button>)}
      </div>
      <MetricChart row={row} />
      <div className="insight-callout"><b>读数：</b>{row.note}</div>
    </div>
  )
}

export function AblationLab() {
  const [selected, setSelected] = useState(['B', 'C'])
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 2 ? [current[1], id] : [...current, id])
  const rows = selected.map((id) => ablations.find((row) => row.id === id)!).filter(Boolean)
  const conclusion = useMemo(() => {
    const key = [...selected].sort().join('')
    if (key === 'BC') return 'B 与 C 使用同一个语义 Tokenizer；移除生成训练后，MMBench 52.7→62.1、SEED 54.9→60.8，直接暴露单表征的多任务权衡。'
    if (key === 'AD') return 'A 与 D 都做理解+生成；从单一 VQ 改为 SigLIP+VQ 双路径后，理解指标大幅提升，而 COCO-FID 8.72→8.53 并未恶化。'
    if (key === 'DE') return 'D 的统一训练与 E 的纯理解训练总体接近：双路径让加入生成任务后，理解能力不再出现系统性崩塌。'
    if (key === 'DF') return 'D 的统一模型 COCO-FID 8.53，F 的纯生成模型为 8.92；至少在该设置下，统一训练没有牺牲生成质量。'
    return '选择一对只改变关键因素的实验，才更接近因果判断。推荐比较 B↔C、A↔D、D↔E 或 D↔F。'
  }, [selected])
  return (
    <div className="interactive ablation-lab">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 08</span><h3>六组消融：哪一对真正回答问题？</h3></div>
        <span className="lab-tag">最多选择 2 组</span>
      </div>
      <div className="ablation-picker">
        {ablations.map((row) => <button key={row.id} onClick={() => toggle(row.id)} className={selected.includes(row.id) ? 'active' : ''}><b>Exp-{row.id}</b><span>{row.encoder}</span><small>{row.task}</small></button>)}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>实验</th><th>视觉编码</th><th>任务</th><th>POPE ↑</th><th>MMB ↑</th><th>SEED ↑</th><th>MMMU ↑</th><th>COCO-FID ↓</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}><td>Exp-{row.id}</td><td>{row.encoder}</td><td>{row.task}</td><td>{row.pope ?? '—'}</td><td>{row.mmb ?? '—'}</td><td>{row.seed ?? '—'}</td><td>{row.mmmu ?? '—'}</td><td>{row.fid ?? '—'}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="insight-callout"><b>当前结论：</b>{conclusion}</div>
    </div>
  )
}

export function ComputeAudit() {
  const [nodes, setNodes] = useState(16)
  const [gpus, setGpus] = useState(8)
  const [days, setDays] = useState(7)
  const totalGpu = nodes * gpus
  const gpuHours = totalGpu * days * 24
  return (
    <div className="interactive compute-lab">
      <div className="lab-head">
        <div><span className="eyebrow">可操作实验 09</span><h3>“1.3B 很小”不等于训练便宜</h3></div>
        <span className="lab-tag">由论文配置计算</span>
      </div>
      <div className="compute-grid">
        <label><span>节点数</span><input type="number" min="1" max="128" value={nodes} onChange={(e) => setNodes(+e.target.value)} /></label>
        <span>×</span>
        <label><span>每节点 GPU</span><input type="number" min="1" max="16" value={gpus} onChange={(e) => setGpus(+e.target.value)} /></label>
        <span>×</span>
        <label><span>训练天数</span><input type="number" min="1" max="60" value={days} onChange={(e) => setDays(+e.target.value)} /></label>
      </div>
      <div className="compute-result"><div><strong>{totalGpu}</strong><span>张 A100 40GB</span></div><div><strong>{gpuHours.toLocaleString()}</strong><span>GPU·小时（理论占用）</span></div></div>
      <p className="lab-foot">论文报告：16 个节点，每节点 8 张 A100 40GB，整个训练约 7 天。21,504 GPU·小时是简单乘法，不代表实际计费或有效利用率。</p>
    </div>
  )
}

const claims = [
  { text: 'Janus 用同一个视觉编码器同时做理解与生成。', answer: false, why: '错误。核心贡献正是把理解编码器 SigLIP 与生成编码器 VQ Tokenizer 分开。' },
  { text: 'Janus 把理解和生成拆成了两个完全独立的 Transformer。', answer: false, why: '错误。视觉编码解耦，但两条路径共享同一个自回归 Transformer。' },
  { text: '论文表明 Janus 在所有生成指标上都是最佳模型。', answer: false, why: '错误。例如 MJHQ-30K 中 VILA-U (384) 的 FID 7.69 低于 Janus 的 10.10。' },
  { text: 'Stage III 保留三类数据，并没有为理解、生成分别微调两个模型。', answer: true, why: '正确。作者混合纯文本、理解与生成数据，维持一个统一模型。' },
  { text: 'Janus 的图像输出分辨率是 384×384。', answer: true, why: '正确。论文实现细节与定性图均说明使用 384×384。' },
]

export function ClaimAudit() {
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const answered = Object.keys(answers).length
  const correct = claims.filter((item, index) => answers[index] === item.answer).length
  return (
    <div className="interactive claim-audit">
      <div className="lab-head">
        <div><span className="eyebrow">理解验收</span><h3>五个判断，守住论文边界</h3></div>
        <span className="score-chip">{answered === claims.length ? `${correct}/5` : `${answered}/5 已答`}</span>
      </div>
      <div className="claim-list">
        {claims.map((item, index) => {
          const hasAnswer = index in answers
          const isCorrect = hasAnswer && answers[index] === item.answer
          return <article className={hasAnswer ? (isCorrect ? 'correct' : 'wrong') : ''} key={item.text}>
            <div><span>{String(index + 1).padStart(2, '0')}</span><p>{item.text}</p></div>
            <div className="choice"><button onClick={() => setAnswers((a) => ({ ...a, [index]: true }))}>正确</button><button onClick={() => setAnswers((a) => ({ ...a, [index]: false }))}>错误</button></div>
            {hasAnswer && <small>{item.why}</small>}
          </article>
        })}
      </div>
    </div>
  )
}
