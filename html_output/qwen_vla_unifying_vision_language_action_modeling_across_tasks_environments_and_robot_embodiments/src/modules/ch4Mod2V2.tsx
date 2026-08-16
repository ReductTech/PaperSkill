import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PsButton, PsSegmented, PsSliderRow } from '../components/ps-controls';
import {
  TEACHING_FIELD,
  TEACHING_NOTE,
  fieldArrows,
  referenceCurvePoints,
  referencePath,
  sFromTau,
  velocityField,
} from './flowTeachingField';
import type { WidgetProps } from './registry';

const { Y_goal: Y0, Y_start: Y1 } = TEACHING_FIELD;
const N = 6;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

const PAIRS = Array.from({ length: N }, (_, i) => {
  const a = -0.55 + i * 0.31;
  return {
    x0: Y0.x + Math.cos(a) * (10 + (i % 3) * 4),
    y0: Y0.y + Math.sin(a) * (10 + (i % 3) * 4),
    x1: Y1.x + Math.cos(a + 1.1) * (22 + (i % 4) * 5),
    y1: Y1.y + Math.sin(a + 1.1) * (22 + (i % 4) * 5),
  };
});

export const Ch4Mod2V2: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'train' | 'infer'>('train');
  const [tau, setTau] = useState(0.45);
  const [showVel, setShowVel] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [playTau, setPlayTau] = useState(1);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  const rafRef = useRef<number>(0);

  const shownTau = mode === 'infer' && playing ? playTau : tau;
  const inferS = sFromTau(shownTau);
  const inferPos = referencePath(inferS);
  const inferVel = velocityField(inferPos, inferS);
  const fieldGrid = useMemo(() => fieldArrows(12, 6, 16, 13, 208, 106, 0.5, 0.05), []);
  const refCurve = useMemo(() => referenceCurvePoints(55).map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '), []);

  const trainPoints = PAIRS.map((p) => ({ ...p, x: lerp(p.x0, p.x1, shownTau), y: lerp(p.y0, p.y1, shownTau) }));

  const playInfer = () => {
    if (playing) return;
    setMode('infer');
    setPlaying(true);
    setPlayTau(1);
    setTrail([]);
    const start = performance.now();
    const duration = 3200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const nextTau = 1 - t;
      setPlayTau(nextTau);
      const p = referencePath(sFromTau(nextTau));
      setTrail((prev) => [p, ...prev].slice(0, 10));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else { setPlaying(false); setTau(0); }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const setModeSafe = (next: 'train' | 'infer') => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setTrail([]);
    setMode(next);
    setTau(next === 'infer' ? 1 : 0.45);
  };

  return (
    <div className="c4m2x-lab">
      <div className="c4m2x-toolbar">
        <PsSegmented value={mode} onChange={setModeSafe} ariaLabel="流匹配观察模式" options={[
          { value: 'train', label: '训练 · 构造直线概率路径' },
          { value: 'infer', label: '推理 · 沿速度场生成动作' },
        ]} />
        <div className="c4m2x-tau"><span>连续时间</span><b>τ = {shownTau.toFixed(2)}</b></div>
      </div>

      <div className="c4m2x-workbench">
        <section className={`c4m2x-field-stage is-${mode}`}>
          <div className="c4m2x-stage-head">
            <div><span>二维教学投影</span><strong>{mode === 'train' ? '从干净动作到噪声的连续插值' : '从噪声沿学到的速度场回到动作'}</strong></div>
            <em>{TEACHING_NOTE}</em>
          </div>
          <svg viewBox="0 0 240 130" className="c4m2x-svg" preserveAspectRatio="xMidYMid meet" aria-label="流匹配二维教学示意">
            <defs>
              <marker id="c4m2x-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#c48434" /></marker>
              <marker id="c4m2x-vf" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#34476f" /></marker>
              <radialGradient id="c4m2x-goal"><stop offset="0" stopColor="#5A8F68" stopOpacity=".22"/><stop offset="1" stopColor="#5A8F68" stopOpacity="0"/></radialGradient>
            </defs>

            {mode === 'infer' ? fieldGrid.map((a, i) => <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} className="c4m2x-field-arrow" markerEnd="url(#c4m2x-vf)" />) : null}
            {mode === 'infer' ? <path d={refCurve} className="c4m2x-ref" /> : null}
            <circle cx={Y0.x} cy={Y0.y} r="28" fill="url(#c4m2x-goal)" />
            <ellipse cx={Y0.x} cy={Y0.y} rx="28" ry="17" className="c4m2x-goal-ring" />
            <text x={Y0.x} y={Y0.y - 22} className="c4m2x-label is-goal">Y₀ · 动作</text>
            <ellipse cx={Y1.x} cy={Y1.y} rx="32" ry="20" className="c4m2x-noise-ring" />
            <text x={Y1.x} y={Y1.y + 27} className="c4m2x-label is-noise">Y₁ · 噪声</text>

            {mode === 'train' ? PAIRS.map((p, i) => {
              const q = trainPoints[i];
              return <g key={i}>
                <line x1={p.x0} y1={p.y0} x2={p.x1} y2={p.y1} className="c4m2x-pair-line" />
                <circle cx={p.x0} cy={p.y0} r="2.5" className="c4m2x-end is-clean" />
                <circle cx={p.x1} cy={p.y1} r="2.5" className="c4m2x-end is-noise" />
                <circle cx={q.x} cy={q.y} r="4.5" className="c4m2x-state-dot" />
                {showVel ? <line x1={q.x} y1={q.y} x2={q.x + (p.x1 - p.x0) * .11} y2={q.y + (p.y1 - p.y0) * .11} className="c4m2x-target-vec" markerEnd="url(#c4m2x-arr)" /> : null}
              </g>;
            }) : (
              <>
                {trail.slice().reverse().map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={1.8 + i * .22} className="c4m2x-trail" style={{ opacity: .08 + i * .055 }} />)}
                <path d={trail.length > 1 ? trail.slice().reverse().map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ') : ''} className="c4m2x-trail-line" />
                <circle cx={inferPos.x} cy={inferPos.y} r="6" className="c4m2x-runner" />
                <line x1={inferPos.x} y1={inferPos.y} x2={inferPos.x + inferVel.x * .042} y2={inferPos.y + inferVel.y * .042} className="c4m2x-target-vec is-live" markerEnd="url(#c4m2x-arr)" />
              </>
            )}
          </svg>
        </section>

        <aside className="c4m2x-console">
          <div className="c4m2x-console-title"><span>{mode === 'train' ? 'TRAINING VIEW' : 'INFERENCE VIEW'}</span><b>{mode === 'train' ? '学习速度目标' : '数值积分读数'}</b></div>
          {mode === 'train' ? (
            <>
              <div className="c4m2x-eq"><span>路径</span><b>Yτ = (1−τ)Y₀ + τY₁</b></div>
              <div className="c4m2x-eq"><span>目标</span><b>v* = Y₁ − Y₀</b></div>
              <div className="c4m2x-meter"><span>插值位置</span><i><b style={{ width: `${shownTau * 100}%` }} /></i><em>{Math.round(shownTau * 100)}%</em></div>
              <div className="c4m2x-vector-demo">{Array.from({ length: 5 }).map((_, i) => <i key={i} style={{ transform: `rotate(${-20 + i * 9}deg)` }} />)}</div>
              <p>训练时从已知的清晰动作样本与噪声样本构造直线路径，让网络学习沿路径的速度方向。</p>
            </>
          ) : (
            <>
              <div className="c4m2x-eq"><span>起点</span><b>τ = 1 · 噪声动作块</b></div>
              <div className="c4m2x-eq"><span>当前</span><b>τ = {shownTau.toFixed(2)}</b></div>
              <div className="c4m2x-meter"><span>去噪进度</span><i><b style={{ width: `${(1 - shownTau) * 100}%` }} /></i><em>{Math.round((1 - shownTau) * 100)}%</em></div>
              <div className="c4m2x-pulse-orbit"><i /><i /><i /><b>vθ</b></div>
              <p>推理只需要网络给出当前位置的条件速度，再通过数值积分逐步更新动作状态。</p>
            </>
          )}
        </aside>
      </div>

      <div className="c4m2x-controls">
        <PsSliderRow label="τ" value={shownTau} min={0} max={1} step={0.01} display={shownTau.toFixed(2)} onChange={playing ? () => undefined : setTau} />
        <div className="ps-controls-row">
          {mode === 'train' ? <PsButton variant="ghost" active={showVel} onClick={() => setShowVel((v) => !v)}>{showVel ? '隐藏速度目标' : '显示速度目标'}</PsButton> : <PsButton variant="primary" disabled={playing} onClick={playInfer}>{playing ? '生成中…' : '▶ 从噪声生成动作'}</PsButton>}
        </div>
      </div>
    </div>
  );
};

export default Ch4Mod2V2;
