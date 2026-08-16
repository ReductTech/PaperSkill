import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconPlay, IconReset, PsButton, PsChip, PsFeedback } from '../components/ps-controls';
import { DOMINO_MODELS, NAV_R2R, NAV_RXR } from './ch6EvidenceData';
import type { WidgetProps } from './registry';

type Mode = 'nav' | 'dynamic';
type NavSet = 'r2r' | 'rxr';
type Point = { x: number; y: number };

const R2R_POINTS: Point[] = [
  { x: 11, y: 73 },
  { x: 25, y: 58 },
  { x: 41, y: 62 },
  { x: 56, y: 46 },
  { x: 73, y: 38 },
  { x: 88, y: 23 },
];

const RXR_POINTS: Point[] = [
  { x: 10, y: 77 },
  { x: 22, y: 63 },
  { x: 35, y: 68 },
  { x: 47, y: 52 },
  { x: 60, y: 57 },
  { x: 72, y: 43 },
  { x: 84, y: 36 },
  { x: 92, y: 21 },
];

const R2R_ROOMS = [
  { x: 6, y: 8, w: 25, h: 20 },
  { x: 36, y: 8, w: 24, h: 30 },
  { x: 65, y: 10, w: 27, h: 22 },
  { x: 14, y: 45, w: 68, h: 9 },
  { x: 64, y: 59, w: 27, h: 20 },
];

const RXR_ROOMS = [
  { x: 5, y: 7, w: 20, h: 18 },
  { x: 30, y: 7, w: 18, h: 27 },
  { x: 53, y: 9, w: 17, h: 18 },
  { x: 75, y: 9, w: 18, h: 20 },
  { x: 10, y: 42, w: 76, h: 9 },
  { x: 58, y: 57, w: 31, h: 20 },
];

const NAV_INSTRUCTION: Record<NavSet, string> = {
  r2r: '穿过走廊，在右侧房间的入口处结束导航。',
  rxr: '沿多转折路线经过多个观察窗口，抵达远端目标。',
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function pointOnPolyline(points: Point[], progress: number) {
  const p = clamp01(progress);
  const segments = Math.max(1, points.length - 1);
  const scaled = p * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const local = scaled - index;
  const a = points[index];
  const b = points[Math.min(index + 1, points.length - 1)];
  const x = lerp(a.x, b.x, local);
  const y = lerp(a.y, b.y, local);
  const heading = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return { x, y, heading, index, local };
}

function pathD(points: Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function partialPathD(points: Point[], progress: number) {
  const pos = pointOnPolyline(points, progress);
  const reached = points.slice(0, pos.index + 1);
  const parts = reached.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`);
  parts.push(`L ${pos.x} ${pos.y}`);
  return parts.join(' ');
}

function MetricBars({ navSet }: { navSet: NavSet }) {
  const metrics =
    navSet === 'r2r'
      ? [
          { label: 'OS', value: NAV_R2R.os, max: 100, hint: 'Oracle Success' },
          { label: 'SR', value: NAV_R2R.sr, max: 100, hint: 'Success Rate' },
          { label: 'SPL', value: NAV_R2R.spl, max: 100, hint: 'Success weighted by Path Length' },
          { label: 'NE↓', value: NAV_R2R.ne, max: 10, hint: 'Navigation Error · 越低越好', invert: true },
        ]
      : [
          { label: 'SR', value: NAV_RXR.sr, max: 100, hint: 'Success Rate' },
          { label: 'SPL', value: NAV_RXR.spl, max: 100, hint: 'Success weighted by Path Length' },
          { label: 'nDTW', value: NAV_RXR.ndtw, max: 100, hint: 'normalized Dynamic Time Warping' },
          { label: 'NE↓', value: NAV_RXR.ne, max: 10, hint: 'Navigation Error · 越低越好', invert: true },
        ];

  return (
    <div className="xfer-metrics">
      {metrics.map((m) => {
        const pct = m.invert ? 100 - (m.value / m.max) * 100 : (m.value / m.max) * 100;
        return (
          <div className="xfer-metric" key={m.label} title={m.hint}>
            <div className="xfer-metric-head">
              <span>{m.label}</span>
              <strong>{m.value}</strong>
            </div>
            <div className="xfer-metric-track">
              <span className="xfer-metric-fill" style={{ width: `${Math.max(4, pct)}%` }} />
              <span className="xfer-metric-cap" style={{ left: `${Math.max(2, Math.min(98, pct))}%` }} />
            </div>
            <small>{m.hint}</small>
          </div>
        );
      })}
    </div>
  );
}

function NavScene({ navSet, progress }: { navSet: NavSet; progress: number }) {
  const points = navSet === 'r2r' ? R2R_POINTS : RXR_POINTS;
  const rooms = navSet === 'r2r' ? R2R_ROOMS : RXR_ROOMS;
  const pos = pointOnPolyline(points, progress);
  const windowStart = Math.min(points.length - 1, Math.floor(progress * (points.length - 1)));
  const visible = points.slice(windowStart, windowStart + 5);

  return (
    <div className="xfer-nav-stage">
      <div className="xfer-stage-topline">
        <span className="xfer-kicker">滑动观察窗口</span>
        <span className="xfer-status-dot"><i /> 当前窗口 {windowStart + 1}–{Math.min(points.length, windowStart + 5)}</span>
      </div>
      <svg viewBox="0 0 100 84" className="xfer-nav-map" aria-label="视觉-语言导航教学示意">
        <defs>
          <linearGradient id={`fov-${navSet}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--viz-navy)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--viz-sky)" stopOpacity="0.04" />
          </linearGradient>
          <filter id={`glow-${navSet}`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="1.5" y="1.5" width="97" height="81" rx="5" fill="#f8faf7" stroke="var(--line)" strokeWidth="0.7" />
        {rooms.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx="2.2" fill="#ffffff" stroke="#dbe2ea" strokeWidth="0.6" />
        ))}
        <path d={pathD(points)} fill="none" stroke="var(--viz-navy)" strokeWidth="1.1" strokeDasharray="2.8 2" opacity="0.28" />
        <path d={partialPathD(points, progress)} fill="none" stroke="var(--viz-green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((wp, i) => {
          const inWindow = i >= windowStart && i < windowStart + 5;
          const active = i === Math.min(points.length - 1, windowStart + 1);
          const goal = i === points.length - 1;
          return (
            <g key={`${wp.x}-${wp.y}`}>
              {goal ? <circle cx={wp.x} cy={wp.y} r="6.8" fill="none" stroke="var(--viz-amber)" strokeWidth="1.6" opacity="0.45" /> : null}
              {active ? <circle cx={wp.x} cy={wp.y} r="5" fill="var(--viz-green)" opacity="0.12" className="xfer-pulse" /> : null}
              <circle
                cx={wp.x}
                cy={wp.y}
                r={goal ? 3.2 : inWindow ? 2.6 : 1.8}
                fill={goal ? 'var(--viz-amber)' : inWindow ? 'var(--viz-green)' : '#d3dae4'}
                opacity={inWindow || goal ? 0.95 : 0.7}
              />
              {inWindow ? <text x={wp.x} y={wp.y - 4.2} textAnchor="middle" fontSize="3.1" fontWeight="800" fill="var(--viz-navy)">{i + 1}</text> : null}
            </g>
          );
        })}

        <g transform={`translate(${pos.x},${pos.y}) rotate(${pos.heading})`} filter={`url(#glow-${navSet})`}>
          <path d="M0 0 L21 -7 L21 7 Z" fill={`url(#fov-${navSet})`} />
          <circle r="4.2" fill="#ffffff" stroke="var(--viz-navy)" strokeWidth="1.2" />
          <path d="M-1.3 -2.5 L3.2 0 L-1.3 2.5 Z" fill="var(--viz-navy)" />
        </g>
      </svg>
      <div className="xfer-window-strip">
        {Array.from({ length: 5 }).map((_, i) => {
          const idx = windowStart + i;
          const wp = visible[i];
          return (
            <div key={i} className={`xfer-window-cell${i === 0 ? ' is-current' : ''}${wp ? '' : ' is-empty'}`}>
              <span>{wp ? String(idx + 1).padStart(2, '0') : '—'}</span>
              <small>{i === 0 ? '当前帧' : wp ? `未来窗口 +${i}` : '窗口外'}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrossTaskSpine({ mode }: { mode: Mode }) {
  return (
    <div className="xfer-spine">
      <div className="xfer-spine-side">
        <span className="xfer-spine-label">输入条件</span>
        <div className="xfer-token-row">
          <i className="xfer-token is-image" />
          <i className="xfer-token is-text" />
          <i className="xfer-token is-emb" />
        </div>
        <small>{mode === 'nav' ? '视觉观测 + 语言指令 + 导航本体描述' : '当前帧观测 + 语言指令 + 操纵本体描述'}</small>
      </div>
      <div className="xfer-spine-arrow">→</div>
      <div className="xfer-core-lock">
        <span className="xfer-core-halo" />
        <strong>Qwen-VLA</strong>
        <small>共享模型结构</small>
      </div>
      <div className="xfer-spine-arrow">→</div>
      <div className="xfer-spine-side is-output">
        <span className="xfer-spine-label">输出语义</span>
        {mode === 'nav' ? (
          <div className="xfer-waypoint-glyph" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
        ) : (
          <div className="xfer-action-glyph" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => <i key={i} style={{ height: `${8 + (i % 3) * 5}px` }} />)}
          </div>
        )}
        <small>{mode === 'nav' ? '滑动窗口航点预测' : '连续 H-step 动作块'}</small>
      </div>
    </div>
  );
}

function DynamicScene({ progress }: { progress: number }) {
  const phase = clamp01(progress);
  const targetX = 63 + phase * 25;
  const targetY = 34 + Math.sin(phase * Math.PI * 2) * 7;
  const gripX = 24 + phase * 42;
  const gripY = 68 - Math.sin(phase * Math.PI) * 21;
  const trail = Array.from({ length: 8 }, (_, i) => {
    const p = Math.max(0, phase - (7 - i) * 0.035);
    return { x: 63 + p * 25, y: 34 + Math.sin(p * Math.PI * 2) * 7, opacity: 0.12 + i * 0.1 };
  });

  return (
    <div className="xfer-dynamic-stage">
      <div className="xfer-stage-topline">
        <span className="xfer-kicker">当前帧闭环执行</span>
        <span className="xfer-status-dot"><i /> 目标持续运动 · 动作块滚动执行</span>
      </div>
      <svg viewBox="0 0 120 82" className="xfer-dom-scene" aria-label="动态操纵教学示意">
        <defs>
          <filter id="dom-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect x="3" y="3" width="114" height="76" rx="5" fill="#fbfcfa" stroke="var(--line)" strokeWidth="0.7" />
        <rect x="10" y="62" width="100" height="8" rx="3" fill="#aeb7c5" />
        <rect x="88" y="51" width="17" height="9" rx="2" fill="none" stroke="var(--viz-green)" strokeWidth="1.4" strokeDasharray="2.2 1.8" />
        <text x="96.5" y="49" textAnchor="middle" fontSize="3.2" fontWeight="700" fill="var(--viz-green)">目标区域</text>

        {trail.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="var(--viz-amber)" opacity={p.opacity} />
        ))}
        <path d={`M 62 34 C 74 25, 91 47, 108 34`} fill="none" stroke="var(--viz-amber)" strokeWidth="1" strokeDasharray="2 2" opacity="0.38" />
        <circle cx={targetX} cy={targetY} r="4" fill="var(--viz-amber)" filter="url(#dom-glow)" />

        <path d={`M 20 63 C 34 57, ${Math.max(46, gripX - 12)} ${Math.max(37, gripY - 8)}, ${gripX} ${gripY}`} fill="none" stroke="var(--viz-green)" strokeWidth="1.4" strokeLinecap="round" />
        <g transform={`translate(${gripX},${gripY})`}>
          <circle r="5" fill="#fff" stroke="var(--viz-navy)" strokeWidth="1.2" />
          <path d="M-2 -3 L0 0 L2 -3 M0 0 V4" fill="none" stroke="var(--viz-navy)" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        <g transform="translate(12,11)">
          <rect x="0" y="0" width="26" height="18" rx="3" fill="#fff" stroke="var(--line)" strokeWidth="0.7" />
          <rect x="3" y="3" width="20" height="9" rx="2" fill="#eef3f8" />
          <circle cx="9" cy="8" r="2.4" fill="var(--viz-navy)" opacity="0.75" />
          <circle cx="17" cy="8" r="2.4" fill="var(--viz-amber)" opacity="0.75" />
          <text x="13" y="16" textAnchor="middle" fontSize="3" fontWeight="700" fill="var(--ps-muted)">CURRENT FRAME</text>
        </g>

        <g transform="translate(43,11)">
          <circle cx="8" cy="8" r="7" fill="var(--viz-navy-soft)" stroke="var(--viz-navy)" strokeWidth="0.9" />
          <circle cx="8" cy="8" r="9.5" fill="none" stroke="var(--viz-green)" strokeWidth="0.8" opacity="0.35" className="xfer-core-pulse" />
          <text x="8" y="9" textAnchor="middle" fontSize="3.2" fontWeight="800" fill="var(--viz-navy)">Qwen</text>
        </g>
        <path d="M38 19 H42" stroke="var(--viz-navy)" strokeWidth="0.8" />

        <g transform="translate(64,12)">
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={i} transform={`translate(${i * 6},0)`}>
              <rect x="0" y="0" width="4.4" height={5 + (i % 3) * 2.4} rx="1" fill={i <= Math.floor(phase * 7) ? 'var(--viz-green)' : '#d7dde7'} />
            </g>
          ))}
          <text x="18" y="17" textAnchor="middle" fontSize="3.2" fontWeight="700" fill="var(--ps-muted)">ACTION CHUNK</text>
        </g>
      </svg>
      <div className="xfer-dom-flow">
        <span>当前帧观测</span><b>→</b><span>共享 Qwen-VLA</span><b>→</b><span>动作块</span><b>→</b><span>环境新帧</span>
      </div>
    </div>
  );
}

function DominoEvidence({ selectedIdx, onSelect }: { selectedIdx: number; onSelect: (i: number) => void }) {
  const selected = DOMINO_MODELS[selectedIdx];
  const maxSr = Math.max(...DOMINO_MODELS.map((m) => m.sr));
  const maxMs = Math.max(...DOMINO_MODELS.map((m) => m.ms));

  return (
    <div className="xfer-dom-evidence">
      <div className="xfer-dom-head">
        <div>
          <span className="xfer-kicker">DOMINO 零样本动态操纵</span>
          <strong>{selected.name}</strong>
        </div>
        {selected.badge ? <span className="xfer-zs-badge">{selected.badge}</span> : <span className="xfer-zs-badge is-muted">Zero-shot</span>}
      </div>
      <div className="xfer-dom-hero-metrics">
        <div><span>SR</span><strong>{selected.sr}</strong><small>%</small></div>
        <div><span>MS</span><strong>{selected.ms}</strong><small>↑</small></div>
      </div>
      <div className="xfer-dom-ranking">
        {DOMINO_MODELS.map((m, i) => (
          <button type="button" key={m.id} className={`xfer-dom-row${i === selectedIdx ? ' is-selected' : ''}`} onClick={() => onSelect(i)}>
            <span className="xfer-dom-rank">{i + 1}</span>
            <span className="xfer-dom-name">{m.name.replace('Qwen-VLA-', 'Qwen-')}</span>
            <span className="xfer-dom-dualbar">
              <i className="is-sr" style={{ width: `${Math.max(3, (m.sr / maxSr) * 100)}%` }} />
              <i className="is-ms" style={{ width: `${Math.max(3, (m.ms / maxMs) * 100)}%` }} />
            </span>
            <span className="xfer-dom-values"><b>{m.sr}</b><em>{m.ms}</em></span>
          </button>
        ))}
      </div>
      <div className="xfer-dom-legend"><span><i className="is-sr" /> SR</span><span><i className="is-ms" /> MS</span></div>
      <p>指标来自 DOMINO zero-shot 评测；上方运动仅用于解释“当前帧 → 动作块 → 新帧”的闭环机制，并非由分数反推轨迹。</p>
    </div>
  );
}

export const Ch6Mod3V2: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('nav');
  const [navSet, setNavSet] = useState<NavSet>('r2r');
  const [navProgress, setNavProgress] = useState(0);
  const [domProgress, setDomProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [domIdx, setDomIdx] = useState(1);
  const rafRef = useRef<number>(0);

  const points = navSet === 'r2r' ? R2R_POINTS : RXR_POINTS;
  const navWindow = Math.min(points.length - 1, Math.floor(navProgress * (points.length - 1)));

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  };

  const animate = (kind: Mode) => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(true);
    const start = performance.now();
    const duration = kind === 'nav' ? 6200 : 5000;
    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / duration);
      const eased = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      if (kind === 'nav') setNavProgress(eased);
      else setDomProgress(eased);
      if (raw < 1) rafRef.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    stop();
    if (mode === 'nav') setNavProgress(0);
    else setDomProgress(0);
  };

  const stepNav = () => {
    stop();
    const denom = Math.max(1, points.length - 1);
    const next = Math.min(points.length - 1, navWindow + 1);
    setNavProgress(next / denom);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setNavProgress(0);
  }, [navSet]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }, [mode]);

  const navSummary = useMemo(() => {
    if (navSet === 'r2r') return `R2R · OS ${NAV_R2R.os} · SR ${NAV_R2R.sr} · SPL ${NAV_R2R.spl} · NE ${NAV_R2R.ne}`;
    return `RxR · SR ${NAV_RXR.sr} · SPL ${NAV_RXR.spl} · nDTW ${NAV_RXR.ndtw} · NE ${NAV_RXR.ne}`;
  }, [navSet]);

  return (
    <div className="xfer-lab">
      <div className="xfer-modebar">
        <div className="ps-controls-row">
          <PsChip selected={mode === 'nav'} onClick={() => setMode('nav')}>视觉-语言导航</PsChip>
          <PsChip selected={mode === 'dynamic'} onClick={() => setMode('dynamic')}>动态操纵</PsChip>
        </div>
        <span className="xfer-mode-note">同一共享模型，切换任务后只改变条件与输出语义</span>
      </div>

      <CrossTaskSpine mode={mode} />

      {mode === 'nav' ? (
        <div className="xfer-main-grid">
          <div className="xfer-main-scene">
            <div className="xfer-instruction"><span>教学指令</span><strong>{NAV_INSTRUCTION[navSet]}</strong></div>
            <NavScene navSet={navSet} progress={navProgress} />
            <div className="xfer-controls">
              <div className="ps-controls-row">
                <PsChip selected={navSet === 'r2r'} onClick={() => setNavSet('r2r')}>R2R</PsChip>
                <PsChip selected={navSet === 'rxr'} onClick={() => setNavSet('rxr')}>RxR</PsChip>
              </div>
              <div className="ps-controls-row">
                <PsButton variant="primary" onClick={() => animate('nav')} disabled={playing}><IconPlay /> 模拟导航</PsButton>
                <PsButton onClick={stepNav} disabled={playing}>下一观察窗口</PsButton>
                <PsButton onClick={reset}><IconReset /> 重置</PsButton>
              </div>
            </div>
          </div>
          <aside className="xfer-side-panel">
            <div className="xfer-side-head">
              <span>Val-Unseen · VLN-CE</span>
              <strong>{navSet === 'r2r' ? 'R2R' : 'RxR'}</strong>
            </div>
            <MetricBars navSet={navSet} />
            <div className="xfer-nav-explain">
              <span className="xfer-kicker">窗口机制</span>
              <p>模型每次只基于当前可见观察继续预测一小段未来航点；演示时窗口沿路径滑动，已走路径与待预测路径分色。</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="xfer-main-grid xfer-main-grid--dynamic">
          <div className="xfer-main-scene">
            <div className="xfer-instruction"><span>教学指令</span><strong>持续跟随移动目标，并把物体送入目标区域。</strong></div>
            <DynamicScene progress={domProgress} />
            <div className="xfer-controls">
              <div className="ps-controls-row">
                <PsButton variant="primary" onClick={() => animate('dynamic')} disabled={playing}><IconPlay /> 播放闭环</PsButton>
                <PsButton onClick={reset}><IconReset /> 重置</PsButton>
              </div>
              <span className="xfer-progress-readout">动作块执行 {Math.round(domProgress * 100)}%</span>
            </div>
          </div>
          <DominoEvidence selectedIdx={domIdx} onSelect={setDomIdx} />
        </div>
      )}

      <PsFeedback tone="neutral">
        {mode === 'nav'
          ? `${navSummary} · 视觉-语言导航输出为滑动窗口航点。`
          : `DOMINO zero-shot · 当前选择 ${DOMINO_MODELS[domIdx].name}：SR ${DOMINO_MODELS[domIdx].sr}% / MS ${DOMINO_MODELS[domIdx].ms}。`}
      </PsFeedback>
    </div>
  );
};

export default Ch6Mod3V2;
