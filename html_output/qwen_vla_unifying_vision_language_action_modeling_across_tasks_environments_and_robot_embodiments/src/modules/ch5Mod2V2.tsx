import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconReset, PsButton } from '../components/ps-controls';
import type { WidgetProps } from './registry';

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const PHASE_LABELS = ['就绪', '语义压缩', '进入 DiT', '动作种子', '沿时间轴展开', '沿控制通道展开', '抽取连续轨迹'];
const H = 8;
const C = 5;

export const Ch5Mod2V2: React.FC<WidgetProps> = () => {
  const [phase, setPhase] = useState<Phase>(0);
  const [auto, setAuto] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setAuto(false);
  }, []);

  const reset = useCallback(() => { stop(); setPhase(0); }, [stop]);
  const step = useCallback(() => setPhase((p) => Math.min(6, p + 1) as Phase), []);

  const startAuto = () => {
    reset();
    setAuto(true);
    let p = 0;
    timerRef.current = window.setInterval(() => {
      p += 1;
      setPhase(Math.min(6, p) as Phase);
      if (p >= 6) stop();
    }, 620);
  };

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="c5m2x">
      <div className="c5m2x-stage">
        <svg className="c5m2x-plumbing" viewBox="0 0 1180 410" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="c5m2xArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="var(--viz-navy)"/></marker></defs>
          <path d="M265 205 C330 205 350 205 405 205" className={phase >= 2 ? 'is-live' : ''} markerEnd="url(#c5m2xArrow)" />
          <path d="M665 205 C724 205 740 205 795 205" className={phase >= 4 ? 'is-live' : ''} markerEnd="url(#c5m2xArrow)" />
          {phase >= 2 ? <circle r="5" fill="var(--viz-amber)"><animateMotion dur="1.2s" repeatCount="indefinite" path="M265 205 C330 205 350 205 405 205" /></circle> : null}
          {phase >= 4 ? <circle r="5" fill="var(--viz-green)"><animateMotion dur="1.15s" repeatCount="indefinite" path="M665 205 C724 205 740 205 795 205" /></circle> : null}
        </svg>

        <section className="c5m2x-seed">
          <div className="c5m2x-kicker">01 · 压缩语义种子</div>
          <div className="c5m2x-input-row"><span>语言</span><b>抓起红色杯子</b></div>
          <div className="c5m2x-input-row"><span>本体</span><b>单臂 · 末端控制</b></div>
          <div className={`c5m2x-compressor${phase >= 1 ? ' is-active' : ''}`}>
            <div className="c5m2x-chip-stack">
              {['抓', '红杯', '单臂', '末端'].map((t, i) => <i key={t} style={{ '--i': i } as React.CSSProperties}>{t}</i>)}
            </div>
            <span className="c5m2x-seed-orb" />
          </div>
          <p>一句高层指令不会逐维描述动作，而是提供紧凑条件。</p>
        </section>

        <section className={`c5m2x-decoder${phase >= 2 ? ' is-active' : ''}`}>
          <div className="c5m2x-kicker">02 · DiT 动作解码</div>
          <div className="c5m2x-reactor">
            <div className="c5m2x-reactor-shell">
              {Array.from({ length: 10 }).map((_, i) => <span key={i} style={{ '--i': i } as React.CSSProperties} />)}
              <div className="c5m2x-scan" />
            </div>
            <div className="c5m2x-reactor-label"><b>DiT Action Expert</b><span>条件化解码器</span></div>
            {phase >= 3 ? <div className="c5m2x-action-seed"><i />动作种子</div> : null}
          </div>
          <div className="c5m2x-decoder-foot"><span>共享语义条件</span><b>→</b><span>高维动作变量</span></div>
        </section>

        <section className="c5m2x-fabric">
          <div className="c5m2x-kicker">03 · H × c 动作展开</div>
          <div className="c5m2x-fabric-head">
            <span>{phase < 4 ? '等待动作种子' : phase < 5 ? '时间轴已展开' : '时间 × 控制通道已展开'}</span>
            <b>H={H} · c={C}</b>
          </div>
          <div className="c5m2x-grid-wrap">
            <div className="c5m2x-y-axis">{Array.from({ length: C }).map((_, i) => <span key={i}>a{i + 1}</span>)}</div>
            <div className="c5m2x-grid">
              {Array.from({ length: C }).flatMap((_, row) =>
                Array.from({ length: H }).map((__, col) => {
                  const onTime = phase >= 4 && row === 0;
                  const onFull = phase >= 5;
                  return <i key={`${row}-${col}`} className={`${onTime || onFull ? 'is-live' : ''}${onFull && row > 0 ? ' is-channel' : ''}`} style={{ '--d': row * H + col } as React.CSSProperties} />;
                })
              )}
            </div>
            <div className="c5m2x-x-axis">{Array.from({ length: H }).map((_, i) => <span key={i}>{i === 0 ? 't+1' : i === H - 1 ? 't+H' : `+${i + 1}`}</span>)}</div>
          </div>
          <div className={`c5m2x-trajectory${phase >= 6 ? ' is-live' : ''}`}>
            <svg viewBox="0 0 420 92" aria-hidden="true">
              <path d="M14 70 C75 20 118 74 178 45 S282 64 405 18" className="ghost" />
              {phase >= 6 ? <path d="M14 70 C75 20 118 74 178 45 S282 64 405 18" className="live" /> : null}
              {phase >= 6 ? <g className="gripper"><path d="M-8 5 L0 -7 L8 5"/><rect x="-3" y="4" width="6" height="8" rx="1"/></g> : null}
            </svg>
            <span>从动作矩阵抽取连续控制轨迹</span>
          </div>
        </section>
      </div>

      <div className="c5m2x-progress">
        {PHASE_LABELS.map((label, i) => <span key={label} className={phase >= i ? 'is-done' : ''}><i />{label}</span>)}
      </div>
      <div className="ps-controls-row c5m2x-controls">
        <PsButton variant="primary" onClick={startAuto} disabled={auto}>▶ 解压动作</PsButton>
        <PsButton variant="ghost" onClick={step} disabled={phase >= 6 || auto}>单步</PsButton>
        <PsButton variant="ghost" onClick={reset}><IconReset /> 重置</PsButton>
      </div>
      <div className="c5m2x-hint">{phase === 0 ? '点击“解压动作”，观察一句指令如何逐步展开为 H×c 高维动作序列。' : `阶段 ${phase}/6 · ${PHASE_LABELS[phase]}`}</div>
    </div>
  );
};

export default Ch5Mod2V2;
