import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PsButton, PsChip } from '../components/ps-controls';
import { TEACHING_FIELD, TEACHING_NOTE, eulerPath, fieldArrows, referenceCurvePoints, velocityField } from './flowTeachingField';
import type { WidgetProps } from './registry';

const { Y_goal: Y0, Y_start: Y1 } = TEACHING_FIELD;
const STEPS = [2, 4, 8];
const COLORS = ['#34476f', '#5A8F68', '#c48434'];

function pathD(pts: Array<{ x: number; y: number }> ) { return pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '); }

export const Ch4Mod3V2: React.FC<WidgetProps> = () => {
  const [steps, setSteps] = useState(4);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [compare, setCompare] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const timer = useRef<number>(0);

  const path = useMemo(() => eulerPath(steps), [steps]);
  const comparePaths = useMemo(() => STEPS.map((n) => ({ n, pts: eulerPath(n) })), []);
  const ref = useMemo(() => pathD(referenceCurvePoints(60)), []);
  const field = useMemo(() => fieldArrows(13, 7, 14, 12, 212, 108, .5, .048), []);
  const current = path[idx];
  const prev = idx > 0 ? path[idx - 1] : null;
  const velocity = prev ? velocityField({ x: prev.x, y: prev.y }, prev.s) : { x: 0, y: 0 };
  const stepLen = prev && current ? Math.hypot(current.x - prev.x, current.y - prev.y) : 0;

  const reset = () => { window.clearInterval(timer.current); setIdx(0); setPlaying(false); setCompare(false); };
  const next = () => { if (!playing && idx < steps) setIdx((i) => i + 1); };
  const autoplay = () => {
    if (playing) return;
    setCompare(false); setIdx(0); setPlaying(true);
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1; setIdx(i);
      if (i >= steps) { window.clearInterval(timer.current); setPlaying(false); }
    }, 680);
  };
  useEffect(() => () => window.clearInterval(timer.current), []);

  return (
    <div className="c4m3x-lab">
      <div className="c4m3x-toolbar">
        <div className="c4m3x-step-tabs">{STEPS.map((n) => <PsChip key={n} selected={steps === n && !compare} onClick={() => { setSteps(n); setIdx(0); setCompare(false); }}>{n} 步</PsChip>)}</div>
        <div className="c4m3x-actions">
          <PsButton variant="primary" onClick={autoplay} disabled={playing}>{playing ? '积分中…' : '▶ 自动积分'}</PsButton>
          <PsButton variant="ghost" onClick={next} disabled={idx >= steps || playing}>下一步</PsButton>
          <PsButton variant="ghost" active={compare} onClick={() => { setCompare((v) => !v); setPlaying(false); }}>比较 2 / 4 / 8 步</PsButton>
          <PsButton variant="ghost" onClick={reset}>重置</PsButton>
        </div>
      </div>

      <div className="c4m3x-workbench">
        <section className="c4m3x-stage">
          <div className="c4m3x-stage-title"><span>速度场中的欧拉积分</span><strong>{compare ? '相同步长规则，不同步数的离散轨迹' : `当前：第 ${idx}/${steps} 步`}</strong></div>
          <svg viewBox="0 0 240 130" className="c4m3x-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="c4m3x-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#c48434" /></marker>
              <marker id="c4m3x-vf" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#34476f" /></marker>
            </defs>
            {field.map((a, i) => <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} className="c4m3x-vf" markerEnd="url(#c4m3x-vf)" />)}
            <path d={ref} className="c4m3x-reference" />
            <circle cx={Y0.x} cy={Y0.y} r="13" className="c4m3x-goal-halo" />
            <circle cx={Y0.x} cy={Y0.y} r="4" className="c4m3x-goal" />
            <text x={Y0.x} y={Y0.y - 17} className="c4m3x-label">τ=0 · 目标动作</text>
            <circle cx={Y1.x} cy={Y1.y} r="4" className="c4m3x-start" />
            <text x={Y1.x} y={Y1.y + 18} className="c4m3x-label">τ=1 · 噪声</text>

            {compare ? comparePaths.map(({ n, pts }, ci) => <g key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)} className={hover && hover !== n ? 'is-dim' : ''}>
              <path d={pathD(pts)} fill="none" stroke={COLORS[ci]} strokeWidth={hover === n ? 3 : 2} strokeLinecap="round" className="c4m3x-compare-path" />
              {pts.map((p) => <circle key={p.step} cx={p.x} cy={p.y} r={hover === n ? 3.2 : 2.3} fill={COLORS[ci]} />)}
            </g>) : (
              <>
                <path d={pathD(path.slice(0, idx + 1))} className="c4m3x-current-path" />
                {path.slice(0, idx + 1).map((p) => <g key={p.step}><circle cx={p.x} cy={p.y} r={p.step === idx ? 6 : 3.2} className={p.step === idx ? 'c4m3x-node is-current' : 'c4m3x-node'} /><text x={p.x + 8} y={p.y - 7} className="c4m3x-step-label">{p.step}</text></g>)}
                {prev && current && idx > 0 ? <line x1={prev.x} y1={prev.y} x2={prev.x + velocity.x * .043} y2={prev.y + velocity.y * .043} className="c4m3x-local-velocity" markerEnd="url(#c4m3x-arr)" /> : null}
              </>
            )}
          </svg>
          <div className="c4m3x-note">{TEACHING_NOTE}</div>
        </section>

        <aside className="c4m3x-console">
          {compare ? (
            <>
              <span className="c4m3x-console-kicker">步数比较</span>
              <strong>离散点越密，数值轨迹越细</strong>
              <div className="c4m3x-compare-bars">{STEPS.map((n, i) => <div key={n} className={hover === n ? 'is-hot' : ''} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(null)}><span>{n} 步</span><i>{Array.from({ length: n + 1 }).map((_, j) => <b key={j} style={{ background: COLORS[i] }} />)}</i></div>)}</div>
              <p>这里比较的是同一教学速度场上的数值积分离散化，不改变模型本身。</p>
            </>
          ) : (
            <>
              <span className="c4m3x-console-kicker">当前积分状态</span>
              <div className="c4m3x-readout"><span>Step</span><b>{idx} / {steps}</b></div>
              <div className="c4m3x-readout"><span>τ</span><b>{current?.tau.toFixed(2) ?? '1.00'}</b></div>
              <div className="c4m3x-readout"><span>本步位移</span><b>{stepLen.toFixed(1)}</b></div>
              <div className="c4m3x-timeline">{Array.from({ length: steps + 1 }).map((_, i) => <i key={i} className={i < idx ? 'is-done' : i === idx ? 'is-now' : ''} />)}</div>
              <div className="c4m3x-equation">z<sub>i+1</sub> = z<sub>i</sub> + Δs · g(z<sub>i</sub>, s<sub>i</sub>)</div>
              <p>{idx === 0 ? '从 τ=1 的噪声动作状态开始。' : idx >= steps ? '积分结束，得到 τ≈0 的动作状态。' : '当前位置的速度方向决定下一次欧拉更新。'}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Ch4Mod3V2;
