import React, { useEffect, useMemo, useRef, useState } from 'react';
import { C, FONT, T, S, fmt, Slider } from './ewcKit';

// Task recognition as a Hidden Markov Model (Appendix 4.2). The three generative models are fixed here
// (in the paper they are learned Dirichlet-multinomials); observations are one of six "screen features".
const GAMES = ['拳击', '打砖块', '地鼠'];
const GCOLOR = [C.blue, C.orange, C.purple];
const MODELS: number[][] = [
  [0.55, 0.35, 0.04, 0.02, 0.02, 0.02],
  [0.03, 0.04, 0.55, 0.34, 0.02, 0.02],
  [0.02, 0.02, 0.04, 0.03, 0.34, 0.55],
];
const MAXN = 90;
const W = 900, H = 520, PL = 70, PW = 790, PT = 30, PH = 270, BAND_Y = 330;

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
interface Obs { o: number; g: number; }
const sample = (rng: () => number, g: number): number => {
  let r = rng(), acc = 0;
  for (let k = 0; k < 6; k++) { acc += MODELS[g][k]; if (r < acc) return k; }
  return 5;
};

/** p(c,t+1) = Σ_c' p(c',t) Γ(c,c');  p(c|o_1..t) ∝ Σ_c' Γ(c,c') p(c',t−1) p(o|c)  (Appendix 4.2), normalised each step. */
function posteriors(obs: Obs[], alpha: number): number[][] {
  const K = 3;
  let p = [1 / 3, 1 / 3, 1 / 3];
  const out: number[][] = [];
  for (const { o } of obs) {
    const q = p.map((_, c) => p.reduce((s, pc, c2) => s + pc * (c === c2 ? 1 - alpha : alpha), 0));
    const post = q.map((qc, c) => qc * MODELS[c][o]);
    const z = post.reduce((a, b) => a + b, 0) || 1;
    p = post.map(x => x / z);
    out.push(p);
  }
  return out.length ? out : [Array(K).fill(1 / K)];
}

export function EwcFmn() {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rng = useRef<() => number>(mulberry(11));
  const gameRef = useRef(0);
  const [game, setGame] = useState(0);
  const [alpha, setAlpha] = useState(0.1);
  const [obs, setObs] = useState<Obs[]>(() => {
    const r = mulberry(5);
    return Array.from({ length: 30 }, () => ({ o: sample(r, 0), g: 0 }));
  });
  const step = (n: number) => setObs(prev => {
    const next = prev.slice();
    for (let i = 0; i < n; i++) next.push({ o: sample(rng.current, gameRef.current), g: gameRef.current });
    return next.slice(-MAXN);
  });
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => step(1), 240);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);
  const choose = (g: number) => { gameRef.current = g; setGame(g); if (reduced) step(10); };
  const post = useMemo(() => posteriors(obs, alpha), [obs, alpha]);
  const last = post[post.length - 1];
  const best = last.indexOf(Math.max(...last));
  // delay since the most recent switch of the true game
  let switchAt = 0;
  for (let i = obs.length - 1; i > 0; i--) if (obs[i].g !== obs[i - 1].g) { switchAt = i; break; }
  let delay: number | null = null;
  if (switchAt > 0) { for (let i = switchAt; i < obs.length; i++) if (post[i].indexOf(Math.max(...post[i])) === obs[i].g) { delay = i - switchAt + 1; break; } }
  const sx = (i: number) => PL + (i / (MAXN - 1)) * PW;
  const sy = (v: number) => PT + PH * (1 - v);
  return <div className="ewc-page">
    <div className="ewc-scene" style={{ width: W, height: H + 40 }}>
      <svg width={W} height={H + 40} viewBox={`0 0 ${W} ${H + 40}`} role="img" aria-label={`三个游戏任务的后验概率曲线，当前识别为${GAMES[best]}`}>
        <rect x={PL} y={PT} width={PW} height={PH} fill="#fbfdf8" stroke={C.border} strokeWidth="2" />
        {[0, 0.5, 1].map(v => <g key={v}>
          <line x1={PL} x2={PL + PW} y1={sy(v)} y2={sy(v)} stroke={C.border} strokeWidth="1.5" strokeDasharray="6 6" />
          <text x={PL - 12} y={sy(v) + 10} textAnchor="end" fontSize={T.body} fill={C.muted} fontFamily={FONT}>{v}</text>
        </g>)}
        {GAMES.map((g, c) => <path key={g} fill="none" stroke={GCOLOR[c]} strokeWidth={c === best ? 7 : 4} strokeLinejoin="round"
          d={post.map((p, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)} ${sy(p[c]).toFixed(1)}`).join('')} />)}
        <text x={PL} y={PT + PH + 44} fontSize={T.body} fill={C.muted} fontFamily={FONT}>后验概率 p(c | 观测) · 时间 →</text>
        {obs.map((ob, i) => <rect key={i} x={sx(i) - 4} y={BAND_Y + 28} width="9" height="34" fill={GCOLOR[ob.g]} aria-hidden="true" />)}
        <text x={PL} y={BAND_Y + 100} fontSize={T.body} fill={C.muted} fontFamily={FONT}>色带：此刻真正在玩的游戏</text>
        {GAMES.map((g, c) => <g key={g} transform={`translate(${PL + c * 230} ${H - 12})`}>
          <rect y="-22" width="30" height="14" rx="3" fill={GCOLOR[c]} />
          <text x="40" y="-6" fontSize={T.body} fontWeight="700" fill={C.text} fontFamily={FONT}>{g}</text>
        </g>)}
      </svg>
    </div>
    <div className="ewc-side">
      <div className="ewc-big" style={{ color: GCOLOR[best] }}>识别为 {GAMES[best]}</div>
      <div className="ewc-btns" role="group" aria-label="选择真正在玩的游戏">
        {GAMES.map((g, c) => <button key={g} className={`ewc-btn ${game === c ? 'is-on' : ''}`} onClick={() => choose(c)}
          style={game === c ? { background: GCOLOR[c], borderColor: GCOLOR[c] } : undefined}>{g}</button>)}
        {reduced && <button className="ewc-btn" onClick={() => step(10)}>再看 10 帧</button>}
      </div>
      <Slider label={<span><S m="α：每一帧切换到另一个任务的概率；α 越大越容易切换，也越容易被噪声带偏。">α</S> 切换概率</span>} value={alpha} min={0.02} max={0.4} step={0.01} onChange={setAlpha} display={fmt(alpha)} />
      <div className="ewc-kpi">切换后识别延迟 <b>{switchAt === 0 ? '—' : delay === null ? '识别中' : `${delay} 帧`}</b></div>
      <p className="ewc-muted">任务标签用来选择各任务的短期记忆缓冲区，以及游戏专属的增益与偏置。</p>
    </div>
  </div>;
}
