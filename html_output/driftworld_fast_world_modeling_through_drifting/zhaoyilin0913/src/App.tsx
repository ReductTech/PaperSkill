import { Component, useEffect, useRef, useState, type ReactNode } from 'react'
import paperData from './data/paper.json'

const data = paperData as any
const terms: any[] = data.terms || []
const CHART_COLORS = ['#4f6ef7', '#7a5cff', '#38a3f5', '#2fbf71', '#f2a33c', '#e55353', '#19c2c0', '#b66cff']

function esc(s: any): string {
  return String(s ?? '').replace(/[&<>"']/g, (c: string) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any
  )[c])
}

function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

function highlightTerms(text: string): string {
  if (!terms.length) return esc(text)
  const sorted = terms.map((t, i) => ({ term: t.term, i })).sort((a, b) => b.term.length - a.term.length)
  let work = text
  sorted.forEach((o) => {
    let p = escRe(o.term)
    if (/[A-Za-z0-9]/.test(o.term)) p = '(?<![A-Za-z0-9])' + p + '(?![A-Za-z0-9])'
    work = work.replace(new RegExp(p, 'gi'), `@@T${o.i}@@`)
  })
  work = esc(work)
  work = work.replace(/@@T(\d+)@@/g, (_, i) => `<span class="term" data-term="${i}">${esc(terms[Number(i)].term)}</span>`)
  return work
}

function linkRefs(text: string): string {
  text = text.replace(/\b(Figure|Fig\.?)\s*(\d+)/gi, (m, a, b) => `<span class="xref" data-ref="fig-${b}">${esc(m)}</span>`)
  text = text.replace(/\[(\d+)\]/g, (m, n) => `<span class="xref" data-ref="ref-${n}">${esc(m)}</span>`)
  return text
}

function rich(text: string): string {
  return linkRefs(highlightTerms(text))
}

let lastScroll = 0
function jumpTo(id: string, setBack: (b: boolean) => void, block: ScrollLogicalPosition = 'center', showBack = true) {
  const el = document.getElementById(id)
  if (!el) return
  if (showBack) {
    lastScroll = window.scrollY
    setBack(true)
  }
  el.scrollIntoView({ behavior: 'smooth', block })
  el.classList.add('flash')
  setTimeout(() => el.classList.remove('flash'), 3000)
}

function BarChart({ c }: { c: any }) {
  const values = (c.values || []).map(Number) as number[]
  const labels = (c.labels || []) as string[]
  const max = Math.max(1, ...values)
  return (
    <svg viewBox="0 0 560 260" className="chart-svg">
      {values.map((v: number, i: number) => {
        const bw = 40, gap = 16, x = 48 + i * (bw + gap), h = (v / max) * 170, y = 224 - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill={CHART_COLORS[i % CHART_COLORS.length]} rx="4" />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="11">{v}</text>
            <text x={x + bw / 2} y={238} textAnchor="middle" fontSize="11">{labels[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ c }: { c: any }) {
  const values = (c.values || []).map(Number) as number[]
  const labels = (c.labels || []) as string[]
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const range = max - min || 1
  const W = 560, H = 260, pl = 44, pb = 32
  const pts = values.map((v, i) => {
    const x = pl + i * ((W - pl - 16) / Math.max(values.length - 1, 1))
    const y = H - pb - ((v - min) / range) * (H - pb - 20)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg">
      <polyline points={pts} fill="none" stroke="#4f6ef7" strokeWidth="2.5" />
      {values.map((v, i) => {
        const x = pl + i * ((W - pl - 16) / Math.max(values.length - 1, 1))
        const y = H - pb - ((v - min) / range) * (H - pb - 20)
        return <g key={i}><circle cx={x} cy={y} r="3.5" fill="#4f6ef7" /><text x={x} y={H - pb + 16} textAnchor="middle" fontSize="11">{labels[i]}</text><text x={x} y={y - 7} textAnchor="middle" fontSize="11">{v}</text></g>
      })}
    </svg>
  )
}

function PieChart({ c }: { c: any }) {
  const values = (c.values || []).map(Number) as number[]
  const labels = (c.labels || []) as string[]
  const total = values.reduce((a: number, b: number) => a + b, 0) || 1
  let acc = 0
  return (
    <div>
      <svg viewBox="0 0 240 240" width="240" height="240" style={{ display: 'block', margin: '0 auto' }}>
        {values.map((v, i) => {
          const frac = v / total
          const start = acc
          acc += frac
          const large = frac > 0.5 ? 1 : 0
          const x1 = 120 + 90 * Math.cos(start * Math.PI * 2 - Math.PI / 2)
          const y1 = 120 + 90 * Math.sin(start * Math.PI * 2 - Math.PI / 2)
          const x2 = 120 + 90 * Math.cos(acc * Math.PI * 2 - Math.PI / 2)
          const y2 = 120 + 90 * Math.sin(acc * Math.PI * 2 - Math.PI / 2)
          return <path key={i} d={`M120 120 L${x1} ${y1} A90 90 0 ${large} 1 ${x2} ${y2} Z`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
        })}
      </svg>
      <div className="res-row" style={{ justifyContent: 'center' }}>{labels.map((l: string, i: number) => <span key={i} style={{ fontSize: '.88rem' }}><i style={{ display: 'inline-block', width: 10, height: 10, background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 2, marginRight: 4 }} />{esc(l)}</span>)}</div>
    </div>
  )
}

function ChartBox({ c, i }: { c: any; i: number }) {
  return (
    <div className="card" key={i}>
      <h4>{esc(c.title)}</h4>
      {c.type === 'line' ? <LineChart c={c} /> : c.type === 'pie' ? <PieChart c={c} /> : <BarChart c={c} />}
      {c.note ? <p className="muted">{esc(c.note)}</p> : null}
    </div>
  )
}

function Rich({ text, onTerm, onRef }: { text: string; onTerm: (i: number, e: any) => void; onRef: (id: string) => void }) {
  const html = rich(text)
  function onClick(e: any) {
    const t = (e.target as HTMLElement).closest('.term, .xref')
    if (!t) return
    if (t.classList.contains('term')) onTerm(Number(t.getAttribute('data-term')), e)
    else onRef(t.getAttribute('data-ref') || '')
  }
  return <div className="orig" dangerouslySetInnerHTML={{ __html: html }} onClick={onClick} />
}

function Guide() {
  const m = data.metadata || {}
  const r = data.resources || {}
  const p = data.problem || {}
  return (
    <div>
      <div className="card"><h2>{esc(m.title || data.title)}</h2>
        {(m.authors || []).length ? <p className="muted">{(m.authors || []).join('、')}</p> : null}
        {data.one_liner ? <p>{esc(data.one_liner)}</p> : null}
        {m.abstract ? <p>{esc(m.abstract)}</p> : null}
      </div>
      {(p.what || p.why) ? <div className="card"><h3>论文要解决什么问题？</h3><p>{esc(p.what)}</p><p>{esc(p.why)}</p></div> : null}
      {(data.core_questions || []).length ? <div className="card"><h3>核心问题</h3><ol>{(data.core_questions || []).map((q: string, i: number) => <li key={i}>{esc(q)}</li>)}</ol></div> : null}
      {(data.contributions || []).length ? (
        <div className="card"><h3>核心贡献</h3><ol>{(data.contributions || []).map((c: string, i: number) => <li key={i}>{esc(c)}</li>)}</ol></div>
      ) : null}
      {(r.paper || r.code || r.dataset || r.demo || r.video1 || r.video2) ? (
        <div className="card"><h3>资源</h3><div className="res-row">
          {r.paper ? <a className="res-link" href={esc(r.paper)} target="_blank" rel="noreferrer">论文原文</a> : null}
          {r.code ? <a className="res-link" href={esc(r.code)} target="_blank" rel="noreferrer">代码</a> : null}
          {r.dataset ? <a className="res-link" href={esc(r.dataset)} target="_blank" rel="noreferrer">数据集</a> : null}
          {r.demo ? <a className="res-link" href={esc(r.demo)} target="_blank" rel="noreferrer">Demo</a> : null}
          {r.video1 ? <a className="res-link" href={esc(r.video1)} target="_blank" rel="noreferrer">演示视频 1</a> : null}
          {r.video2 ? <a className="res-link" href={esc(r.video2)} target="_blank" rel="noreferrer">演示视频 2</a> : null}
        </div></div>
      ) : null}
      <VideoShare />
    </div>
  )
}

function Outline() {
  return (
    <div className="card"><h3>论文提纲</h3><div className="tree2">
      {(data.sections || []).map((s: any, i: number) => (
        <div key={i} className={s.level <= 1 ? 'tree2-top' : 'tree2-sub'}>
          <div className="tree2-node"><strong>{esc((s.number ? s.number + ' ' : '') + s.heading)}</strong>{s.explanation ? <div className="o-sum">{esc(s.explanation)}</div> : null}</div>
        </div>
      ))}
    </div></div>
  )
}

function Diagram() {
  const concepts = data.concepts || []
  const rels = data.relations || []
  if (!concepts.length) return null
  const byName: any = {}
  concepts.forEach((c: any) => { byName[c.name] = c })
  const children: any = {}
  concepts.forEach((c: any) => { children[c.name] = [] })
  rels.forEach((r: any) => { if (children[r.from]) children[r.from].push(r) })
  const pointed: any = {}
  rels.forEach((r: any) => { pointed[r.to] = true })
  const roots = concepts.filter((c: any) => !pointed[c.name])
  const root = roots.length ? roots : [concepts[0]]
  function node(c: any, depth: number, visited: Set<string>): any {
    const kids = children[c.name] || []
    return (
      <div key={c.name} style={{ marginLeft: depth * 22 }}>
        <div className="dnode"><div className="dbox"><strong>{esc(c.name)}</strong>{c.paper_approach ? <span className="drole">{esc(c.paper_approach)}</span> : null}</div></div>
        {kids.map((r: any) => {
          if (visited.has(r.to)) return null
          const next = new Set(visited)
          next.add(r.to)
          return (
            <div key={r.to} className="dchild" style={{ marginLeft: (depth + 1) * 22 }}>
              {r.label ? <span className="dedge">{esc(r.label)}</span> : null}
              {node(byName[r.to] || { name: r.to }, depth + 1, next)}
            </div>
          )
        })}
      </div>
    )
  }
  return <div className="card"><h3>模型结构</h3><div className="net-tree">{root.map((r: any) => node(r, 0, new Set([r.name])))}</div></div>
}

function FormulaNote({ f }: { f: any }) {
  return (
    <div className="card"><h3>公式讲解</h3>
      <div className="formula">{esc(f.formula)}</div>
      <p><strong>含义：</strong>{esc(f.meaning)}</p>
      {(f.variables || []).length ? (
        <table className="data-table"><thead><tr><th>符号</th><th>含义</th><th>示例值</th></tr></thead><tbody>
          {(f.variables || []).map((v: any, i: number) => <tr key={i}><td>{esc(v.symbol)}</td><td>{esc(v.meaning)}</td><td>{esc(v.example)}</td></tr>)}
        </tbody></table>
      ) : null}
      {f.example ? <div className="plain"><strong>代入示例：</strong>{esc(f.example)}</div> : null}
      {f.table && f.table.headers?.length ? (
        <table className="data-table"><thead><tr>{(f.table.headers || []).map((h: string, i: number) => <th key={i}>{esc(h)}</th>)}</tr></thead><tbody>
          {(f.table.rows || []).map((row: any, i: number) => <tr key={i}>{row.map((cell: any, j: number) => <td key={j}>{esc(cell)}</td>)}</tr>)}
        </tbody></table>
      ) : null}
      {f.note ? <div className="fig-expl"><strong>说明：</strong>{esc(f.note)}</div> : null}
    </div>
  )
}

function Original({ onTerm, onRef }: { onTerm: (i: number, e: any) => void; onRef: (id: string) => void }) {
  return (
    <div>
      <Outline />
      {(data.sections || []).map((s: any, i: number) => (
        <section className="sec" key={i} id={`sec-${i}`}>
          {s.level >= 2 ? <h4>{esc((s.number ? s.number + ' ' : '') + s.heading)}</h4> : <h3>{esc((s.number ? s.number + ' ' : '') + s.heading)}</h3>}
          {s.explanation ? <div className="sec-expl">{esc(s.explanation)}</div> : null}
          {(s.paragraphs || []).map((p: any, j: number) => (
            <div key={j}>
              <div className="para-pair">
                {p.text ? <Rich text={p.text} onTerm={onTerm} onRef={onRef} /> : null}
                {p.translation ? <div className="trans">{esc(p.translation)}</div> : null}
              </div>
              {p.plain ? <div className="plain"><strong>直白解释：</strong>{esc(p.plain)}</div> : null}
            </div>
          ))}
          {(data.figures || []).filter((f: any) => f.section === i).map((f: any) => (
            <figure className="fig" key={`fig-${f.index}`} id={`fig-${f.number}`}><img src={f.file} alt="" /><figcaption className="fig-cap">{esc(f.caption)}</figcaption>{f.explanation ? <div className="fig-expl"><strong>讲解：</strong>{esc(f.explanation)}</div> : null}</figure>
          ))}
          {(data.tables || []).filter((t: any) => t.section === i).map((t: any) => (
            <figure className="table" key={`table-${t.index}`}><img src={t.file} alt="表格" /><figcaption className="fig-cap">论文表格（第 {t.page} 页）</figcaption></figure>
          ))}
          {(data.formulas || []).filter((f: any) => f.section === i).map((f: any, k: number) => <FormulaNote f={f} key={`f-${k}`} />)}
          {(data.charts || []).filter((c: any) => c.section === i).map((c: any, k: number) => <ChartBox c={c} i={k} key={`c-${k}`} />)}
        </section>
      ))}
      <Diagram />
      {(data.comparison || []).length ? (
        <div className="card"><h3>对比与整理</h3><table className="data-table"><thead><tr><th>维度</th><th>传统 / 其他方法</th><th>论文方案</th></tr></thead><tbody>
          {(data.comparison || []).map((x: any, i: number) => <tr key={i}><td>{esc(x.aspect)}</td><td>{esc(x.baseline)}</td><td>{esc(x.paper)}</td></tr>)}
        </tbody></table></div>
      ) : null}
      {terms.length ? <div className="card"><h3>术语表</h3>{terms.map((t: any, i: number) => <div key={i}><strong>{esc(t.term)}</strong>：{esc(t.explanation)}</div>)}</div> : null}
      {(data.references || []).length ? (
        <div className="card"><h3>参考文献</h3><ol>{(data.references || []).map((r: any) => <li key={r.id} id={`ref-${r.id.slice(1, -1)}`}><strong>{esc(r.id)}</strong> {esc(r.text)}</li>)}</ol></div>
      ) : null}
    </div>
  )
}

function Concepts() {
  const [depth, setDepth] = useState(0)
  return (
    <div>
      <div className="depth-box"><label>理解深度 <input type="range" min={0} max={2} value={depth} onChange={(e) => setDepth(Number(e.target.value))} /> {['直觉', '机制', '细节'][depth]}</label></div>
      {(data.concepts || []).map((c: any, i: number) => (
        <div className="card" key={i} id={`c${i}`}><h3>{esc(c.name)}</h3>
          {c.location ? <div className="c-loc">原文位置：{esc(c.location)}</div> : null}
          {c.excerpt ? <div className="c-ex"><strong>论文文段：</strong>{esc(c.excerpt)}</div> : null}
          <div className="layer"><strong>生活类比：</strong>{esc(c.life_analogy)}</div>
          <div className="layer"><strong>解决什么问题：</strong>{esc(c.solves)}</div>
          {depth >= 1 ? <><div className="layer"><strong>什么时候用：</strong>{esc(c.when_to_use)}</div><div className="layer"><strong>局限：</strong>{esc(c.limitations)}</div><div className="layer"><strong>论文方案：</strong>{esc(c.paper_approach)}</div></> : null}
          {depth >= 2 ? <><div className="layer"><strong>公式：</strong>{esc(c.formula)}</div><div className="layer"><strong>实现：</strong>{esc(c.implementation)}</div></> : null}
        </div>
      ))}
      {(data.relations || []).length ? (
        <div className="card"><h3>概念关系</h3><ul>{(data.relations || []).map((r: any, i: number) => <li key={i}><strong>{esc(r.from)}</strong> → <strong>{esc(r.to)}</strong>：{esc(r.label)}</li>)}</ul></div>
      ) : null}
    </div>
  )
}

function QuizItem({ q, i, onRef }: { q: any; i: number; onRef: (id: string) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div className="card">
      {q.section != null && q.section >= 0 ? <button className="chip" onClick={() => onRef(`sec-${q.section}`)}>回到原文</button> : null}
      <strong>{i + 1}. {esc(q.question)}</strong>
      <div className="opts">{(q.options || []).map((o: string, j: number) => (
        <button key={j} className={picked === null ? '' : (j === q.answer ? 'correct' : (picked === j ? 'wrong' : ''))} onClick={() => setPicked(j)}>{esc(o)}</button>
      ))}</div>
      {picked !== null ? <p>{picked === q.answer ? '正确。' : '错误。'} {esc(q.explanation)}</p> : null}
    </div>
  )
}

function Quiz({ onRef }: { onRef: (id: string) => void }) {
  return <div>{(data.quiz || []).map((q: any, i: number) => <QuizItem q={q} i={i} key={i} onRef={onRef} />)}</div>
}

function QnA() {
  const key = 'qa-' + (data.title || 'paper')
  const [comments, setComments] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] } })
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const r = data.resources || {}
  function submit(e: any) {
    e.preventDefault()
    if (!text.trim()) return
    const next = [...comments, { name, text, time: new Date().toLocaleString() }]
    setComments(next); setName(''); setText('')
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
  }
  return (
    <div className="card"><h3>评论问答</h3>
      <div className="res-row" style={{ marginBottom: 12 }}>
        {r.paper ? <a className="res-link" href={esc(r.paper)} target="_blank" rel="noreferrer">论文原文</a> : null}
        {r.video1 ? <a className="res-link" href={esc(r.video1)} target="_blank" rel="noreferrer">演示视频 1</a> : null}
        {r.video2 ? <a className="res-link" href={esc(r.video2)} target="_blank" rel="noreferrer">演示视频 2</a> : null}
      </div>
      {comments.length ? comments.map((c, i) => <div className="comment" key={i}><div className="comment-meta">{esc(c.name || '匿名')} · {esc(c.time)}</div><div>{esc(c.text)}</div></div>) : <p className="muted">暂无评论。</p>}
      <form id="comment-form" onSubmit={submit}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="昵称（可选）" /><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="写下问题或评论…" required /><button type="submit">发布</button></form>
    </div>
  )
}

function Roadmap() {
  const [done, setDone] = useState<any>(() => { try { return JSON.parse(localStorage.getItem('roadmap-done') || '{}') } catch { return {} } })
  const total = (data.learning_roadmap || []).length
  const count = (data.learning_roadmap || []).filter((_: any, i: number) => done[i]).length
  return (
    <div className="card">
      <h3>学习路线（{count}/{total}）</h3>
      <div className="progress"><div className="progress-in" style={{ width: (total ? count / total * 100 : 0) + '%' }} /></div>
      {(data.learning_roadmap || []).map((r: any, i: number) => (
        <div className="card" key={i}><h4>{esc(r.stage)}</h4><p>{esc(r.goal)}</p><ul>{(r.key_points || []).map((p: string, j: number) => <li key={j}>{esc(p)}</li>)}</ul>
          <label className="road-done"><input type="checkbox" checked={!!done[i]} onChange={(e) => { const d = { ...done, [i]: e.target.checked ? 1 : 0 }; setDone(d); try { localStorage.setItem('roadmap-done', JSON.stringify(d)) } catch {} }} /> 标记完成</label>
        </div>
      ))}
    </div>
  )
}

function Chat() {
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  async function send() {
    const text = input.trim()
    if (!text || thinking) return
    const next = [...msgs, { role: 'user', content: text }]
    setMsgs(next); setInput(''); setThinking(true)
    try {
      const res = await fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) })
      if (!res.ok) throw new Error(await res.text())
      const d = await res.json()
      setMsgs([...next, { role: 'assistant', content: d.reply || '(无回复)' }])
    } catch (e: any) {
      setMsgs([...next, { role: 'assistant', content: '请求失败：请确认已启动 python serve.py（127.0.0.1:8000）。' + (e?.message ? ' ' + e.message : '') }])
    } finally {
      setThinking(false)
    }
  }
  return (
    <div>
      <h3>论文助教</h3>
      <div className="chat-box">
        {msgs.map((m, i) => <div className={'msg ' + m.role} key={i}>{m.content}</div>)}
        {thinking ? <div className="msg bot typing"><span></span><span></span><span></span></div> : null}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send() }} style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="提问…" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #e6eaf2' }} />
        <button style={{ background: '#4f6ef7', color: '#fff', border: 0, borderRadius: 10, padding: '10px 16px', cursor: 'pointer' }}>发送</button>
      </form>
    </div>
  )
}

function biliEmbed(url: string): string | null {
  const m = url.match(/BV[0-9A-Za-z]+/)
  if (!m) return null
  return `//player.bilibili.com/player.html?bvid=${m[0]}&page=1&high_quality=1`
}

function VideoShare() {
  const vids = (data.resources?.videos || []) as any[]
  const [open, setOpen] = useState<Record<number, boolean>>({})
  if (!vids.length) return null
  return (
    <div className="card"><h3>视频分享</h3>
      {vids.map((v: any, i: number) => {
        const embed = biliEmbed(v.url || '')
        return (
          <div key={i} style={{ marginBottom: 12 }}>
            {v.title ? <p><strong>{esc(v.title)}</strong></p> : null}
            {embed ? (open[i] ? <iframe src={embed} scrolling="no" frameBorder="0" allowFullScreen style={{ width: '100%', height: 360, border: 0, borderRadius: 10 }} /> : <button className="chip" onClick={() => setOpen({ ...open, [i]: true })}>播放视频</button>) : <a className="res-link" href={esc(v.url)} target="_blank" rel="noreferrer">打开视频</a>}
          </div>
        )
      })}
    </div>
  )
}

function Walkthrough({ onRef }: { onRef: (id: string) => void }) {
  const steps = (data.sections || []).map((s: any, idx: number) => ({ ...s, idx })).filter((s: any) => s.level <= 1)
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setI((p) => (p + 1) % Math.max(steps.length, 1)), 6000)
    return () => clearInterval(id)
  }, [playing, steps.length])
  const s = steps[i]
  if (!s) return <div className="card">暂无内容</div>
  const content = s.explanation || (s.paragraphs?.[0]?.translation || s.paragraphs?.[0]?.plain || '')
  const subs = (data.sections || []).filter((x: any) => x.level === 2 && s.number && (x.number || '').startsWith(s.number + '.'))
  const paras = (s.paragraphs || []).filter((p: any) => p.translation).slice(0, 3)
  return (
    <div className="card walkthrough">
      <div className="muted">{i + 1} / {steps.length}</div>
      <h3>{esc((s.number ? s.number + ' ' : '') + s.heading)}</h3>
      {content ? <p>{esc(content)}</p> : <p className="muted">本节暂无概括，可进入原文查看。</p>}
      {subs.length ? (
        <div style={{ marginTop: 8 }}>
          {subs.map((sub: any) => (
            <div key={sub.number} style={{ marginBottom: 8 }}>
              <strong>{esc((sub.number ? sub.number + ' ' : '') + sub.heading)}</strong>
              {sub.explanation ? <p className="muted" style={{ margin: '2px 0 0' }}>{esc(sub.explanation)}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {paras.length ? (
        <ul style={{ marginTop: 8 }}>
          {paras.map((p: any, j: number) => <li key={j}>{esc(p.translation)}</li>)}
        </ul>
      ) : null}
      <button className="chip" onClick={() => onRef(`sec-${s.idx}`)}>进入原文</button>
      <div className="progress"><div className="progress-in" style={{ width: ((i + 1) / steps.length * 100) + '%' }} /></div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="chip" onClick={() => setI(Math.max(0, i - 1))}>上一页</button>
        <button className="chip" onClick={() => setI(Math.min(steps.length - 1, i + 1))}>下一页</button>
        <button className="chip" onClick={() => setPlaying(!playing)}>{playing ? '暂停' : '播放'}</button>
        <button className="chip" onClick={() => { setI(0); setPlaying(false) }}>从头开始</button>
      </div>
    </div>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: any }> {
  state = { error: null as any }
  static getDerivedStateFromError(error: any) { return { error } }
  render() {
    if (this.state.error) {
      return <div className="card" style={{ margin: 40 }}><h2>页面加载出错</h2><p>{String(this.state.error)}</p></div>
    }
    return this.props.children
  }
}

export default function App() {
  const [tab, setTab] = useState('guide')
  const [back, setBack] = useState(false)
  const [pop, setPop] = useState<{ x: number; y: number; text: string } | null>(null)
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const [active, setActive] = useState(0)
  const scrollPos = useRef<Record<string, number>>({})

  const tabs = [['guide', '导读'], ['walk', '导览'], ['original', '原文阅读'], ['concepts', '核心概念'], ['quiz', '自测'], ['qa', '问答']]

  function onTerm(i: number, e: any) {
    const t = terms[i]
    if (!t) return
    setPop({ x: e.clientX, y: e.clientY + 14, text: t.term + '：' + t.explanation })
  }

  function onRef(id: string) {
    switchTab('original')
    setTimeout(() => jumpTo(id, setBack, 'center', true), 40)
  }

  function switchTab(id: string) {
    if (id !== tab) {
      scrollPos.current[tab] = window.scrollY
      setTab(id)
      requestAnimationFrame(() => window.scrollTo(0, scrollPos.current[id] || 0))
    }
  }

  function goBack() {
    window.scrollTo({ top: lastScroll, behavior: 'smooth' })
    setBack(false)
  }

  useEffect(() => {
    function onScroll() {
      if (tab !== 'original') return
      let cur = 0
      ;(data.sections || []).forEach((_: any, i: number) => {
        const el = document.getElementById(`sec-${i}`)
        if (el && el.getBoundingClientRect().top <= 140) cur = i
      })
      setActive(cur)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [tab])

  function tocClick(i: number) {
    switchTab('original')
    setTimeout(() => jumpTo(`sec-${i}`, setBack, 'start', false), 40)
  }

  return (
    <ErrorBoundary>
    <div onClick={() => setPop(null)}>
      <header><div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}><h1>{esc(data.title)}</h1>{data.one_liner ? <p className="oneliner">{esc(data.one_liner)}</p> : null}</div></header>
      <div className="layout">
        <aside className="toc">
          <h4>论文结构</h4>
          {(data.sections || []).map((s: any, i: number) => (
            <a key={i} className={(s.level >= 2 ? 'l2 ' : '') + (active === i ? 'active' : '')} onClick={() => tocClick(i)}>{(s.number ? s.number + ' ' : '') + esc(s.heading)}</a>
          ))}
        </aside>
        <div className="content">
          <nav className="tabs">{tabs.map(([id, name]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => switchTab(id)}>{name}</button>)}</nav>
          {tab === 'guide' ? <Guide /> : null}
          {tab === 'walk' ? <Walkthrough onRef={onRef} /> : null}
          {tab === 'original' ? <Original onTerm={onTerm} onRef={onRef} /> : null}
          {tab === 'concepts' ? <Concepts /> : null}
          {tab === 'quiz' ? <Quiz onRef={onRef} /> : null}
          {tab === 'qa' ? <QnA /> : null}
        </div>
        <div className="right-col">
          <aside id="roadmap-panel">
            <div className="rp-head" onClick={() => setRoadmapOpen(!roadmapOpen)}><strong>学习路线</strong><span className="rp-status">{roadmapCount()}</span></div>
            {roadmapOpen ? <div className="rp-body"><Roadmap /></div> : null}
          </aside>
          <aside id="chat-sidebar"><Chat /></aside>
        </div>
      </div>
      {pop ? <div className="term-pop" style={{ left: Math.min(pop.x, window.innerWidth - 330), top: pop.y }} onClick={(e) => e.stopPropagation()}>{esc(pop.text)}</div> : null}
      {back ? <button className="back-pos" onClick={goBack}>返回原位置</button> : null}
    </div>
    </ErrorBoundary>
  )

  function roadmapCount() {
    const key = 'roadmap-done'
    let done: any = {}
    try { done = JSON.parse(localStorage.getItem(key) || '{}') } catch {}
    const total = (data.learning_roadmap || []).length
    const count = (data.learning_roadmap || []).filter((_: any, i: number) => done[i]).length
    return `${count}/${total}`
  }
}
