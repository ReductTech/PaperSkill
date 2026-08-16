import React, { useMemo, useState } from 'react';
import { PsFeedback } from '../components/ps-controls';
import type { WidgetProps } from './registry';

const SOURCES = [
  { id: 'robot', name: '机器人操纵轨迹', pct: 74.2, color: '#34476f', short: 'Robot' },
  { id: 'human', name: '人体第一视角轨迹', pct: 6.0, color: '#5A8F68', short: 'Ego' },
  { id: 'nav', name: '导航轨迹', pct: 7.5, color: '#4f7fb5', short: 'Nav' },
  { id: 'synth', name: '合成仿真轨迹', pct: 3.7, color: '#68778f', short: 'Synth' },
  { id: 'vl', name: '通用视觉-语言数据', pct: 3.4, color: '#7c6ba8', short: 'VL' },
  { id: 'spatial', name: '空间视觉落地（2D）', pct: 2.5, color: '#c48434', short: 'Spatial' },
  { id: 'drive', name: '自动驾驶 VQA', pct: 2.4, color: '#92400e', short: 'Drive' },
  { id: 'caption', name: '细粒度具身动作描述', pct: 0.2, color: '#9fb0c8', short: 'Caption' },
] as const;

type SourceId = (typeof SOURCES)[number]['id'];

const AFFINITY: Record<SourceId, [number, number, number]> = {
  robot: [1, .56, .92], human: [.62, .48, .9], nav: [.54, 1, .48], synth: [.5, .56, .68],
  vl: [1, .62, .35], spatial: [.88, 1, .36], drive: [.72, .86, .42], caption: [.68, .35, .76],
};

export const Ch5Mod3V2: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<SourceId>('robot');
  const [locked, setLocked] = useState(true);
  const source = SOURCES.find((s) => s.id === active)!;

  const segments = useMemo(() => {
    let left = 0;
    return SOURCES.map((s) => { const out = { ...s, left }; left += s.pct; return out; });
  }, []);

  const affinity = AFFINITY[active];

  return (
    <div className="c5m3x-lab">
      <section className="c5m3x-mixture">
        <div className="c5m3x-title"><span>Table 1 · 预训练数据混合</span><strong>八类数据被送入同一个预训练“混合器”</strong></div>
        <div className="c5m3x-bar" onMouseLeave={() => { if (!locked) setActive('robot'); }}>
          {segments.map((s) => (
            <button key={s.id} type="button" className={active === s.id ? 'is-active' : ''} style={{ left: `${s.left}%`, width: `${s.pct}%`, background: s.color }} onMouseEnter={() => { if (!locked) setActive(s.id); }} onClick={() => { setActive(s.id); setLocked(true); }} aria-label={`${s.name} ${s.pct}%`}>
              {s.pct >= 5 ? <span>{s.pct}%</span> : null}
            </button>
          ))}
        </div>
        <div className="c5m3x-legend">{SOURCES.map((s) => <button type="button" key={s.id} className={active === s.id ? 'is-active' : ''} onClick={() => { setActive(s.id); setLocked(true); }}><i style={{ background: s.color }} /><span>{s.name}</span><b>{s.pct}%</b></button>)}</div>
      </section>

      <div className="c5m3x-stage">
        <section className="c5m3x-source-card">
          <span className="c5m3x-kicker">当前数据源</span>
          <div className="c5m3x-source-big"><i style={{ background: source.color }} /><div><strong>{source.name}</strong><b>{source.pct}%</b></div></div>
          <p>点击其它来源可观察它们以不同权重汇入同一预训练过程。比例来自论文 Table 1。</p>
          <button type="button" onClick={() => setLocked((v) => !v)}>{locked ? '点击已锁定 · 改为悬停查看' : '悬停查看中 · 点击锁定'}</button>
        </section>

        <section className="c5m3x-reactor">
          <div className="c5m3x-streams" aria-hidden="true">
            {SOURCES.map((s, i) => <span key={s.id} className={active === s.id ? 'is-hot' : ''} style={{ '--i': i, '--c': s.color } as React.CSSProperties}><i /></span>)}
          </div>
          <div className="c5m3x-core"><i /><strong>Qwen‑VLA</strong><span>统一预训练</span><small>不同来源 · 同一参数空间</small></div>
          <div className="c5m3x-outlet" aria-hidden="true">{Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ animationDelay: `${i * 80}ms` }} />)}</div>
        </section>

        <section className="c5m3x-capabilities">
          <span className="c5m3x-kicker">教学观察 · 数据来源与能力侧重</span>
          {[['视觉落地', affinity[0]], ['空间推理', affinity[1]], ['连续控制', affinity[2]]].map(([name, v], i) => <div className="c5m3x-cap" key={String(name)}><span>{name}</span><i><b style={{ width: `${Number(v) * 100}%` }} /></i><em>{['perception', 'spatial', 'control'][i]}</em></div>)}
          <p>此处只做教学映射，不能把某一数据源机械地等同于某一种能力。</p>
        </section>
      </div>

      <PsFeedback tone="neutral">八类数据按论文给出的比例混合；机器人操纵轨迹占主导，但预训练同时保留导航、第一视角、视觉语言与空间数据。</PsFeedback>
    </div>
  );
};

export default Ch5Mod3V2;
