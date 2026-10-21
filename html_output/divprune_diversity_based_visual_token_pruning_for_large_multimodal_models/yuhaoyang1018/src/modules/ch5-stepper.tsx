import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { approach, useCanvasBox, useReducedMotion, useStageLoop } from '../lib/hooks';
import { C, FONT_SANS, FONT_MONO } from '../lib/palette';
import { Btn, Feedback, ScrollX, Seg } from '../ui/kit';
import { euclidOf, greedyMaxMinSteps, makeCloud, type Pt } from '../lib/maxmin';

// 5.1 Algorithm 1 分步演示。每一轮拆成两步：①计算数组 D ②取 argmax 并移入 Ẽv。
// 伪代码逐行照抄论文 Algorithm 1（第 1–22 行），高亮与当前步骤对应的行。

const N = 24;
const K = 6;
const AR = 1.6;

const CODE: { n: number; t: string; ind: number }[] = [
  { n: 1, t: 'M̃: subset size; Ev: visual tokens; Ẽv: selected subset', ind: 0 },
  { n: 2, t: 'Initialize Ẽv=[] and R = Ev', ind: 0 },
  { n: 3, t: '// First stage: add the first token', ind: 0 },
  { n: 4, t: 'D = [] initialize the distance array', ind: 0 },
  { n: 5, t: 'for i in R do', ind: 0 },
  { n: 6, t: 'dmin = +inf', ind: 1 },
  { n: 7, t: 'for j in R do', ind: 1 },
  { n: 8, t: 'If (i ≠ j & d(i, j) ≤ dmin) then dmin = d(i, j)', ind: 2 },
  { n: 9, t: 'Add dmin to D', ind: 1 },
  { n: 10, t: 'k = R[arg max (D)]', ind: 0 },
  { n: 11, t: 'move k from R to Ẽv', ind: 0 },
  { n: 12, t: '// Second stage: iteratively add the subsequent tokens', ind: 0 },
  { n: 13, t: 'while |Ẽv| < M̃ do', ind: 0 },
  { n: 14, t: 'D = [] initialize the distance array', ind: 1 },
  { n: 15, t: 'for i in R do', ind: 1 },
  { n: 16, t: 'dmin = +inf', ind: 2 },
  { n: 17, t: 'for j in Ẽv do', ind: 2 },
  { n: 18, t: 'If d(i, j) ≤ dmin then dmin = d(i, j)', ind: 3 },
  { n: 19, t: 'Add dmin to D', ind: 2 },
  { n: 20, t: 'k = R[arg max (D)]', ind: 1 },
  { n: 21, t: 'move k from R to Ẽv', ind: 1 },
  { n: 22, t: 'Return Ẽv', ind: 0 },
];

const SEEDS: { id: string; label: string; pts: () => Pt[] }[] = [
  {
    id: 'a',
    label: '点集 A（成簇）',
    pts: () =>
      makeCloud(11, [
        { cx: 0.25, cy: 0.35, sx: 0.08, sy: 0.08, n: 8 },
        { cx: 0.7, cy: 0.3, sx: 0.07, sy: 0.07, n: 7 },
        { cx: 0.5, cy: 0.75, sx: 0.12, sy: 0.07, n: 7 },
        { cx: 0.92, cy: 0.85, sx: 0.02, sy: 0.02, n: 2 },
      ]),
  },
  { id: 'b', label: '点集 B（较均匀）', pts: () => makeCloud(23, [{ cx: 0.5, cy: 0.5, sx: 0.28, sy: 0.26, n: N }]) },
  {
    id: 'c',
    label: '点集 C（一大一小）',
    pts: () =>
      makeCloud(5, [
        { cx: 0.35, cy: 0.5, sx: 0.12, sy: 0.14, n: 19 },
        { cx: 0.85, cy: 0.25, sx: 0.04, sy: 0.04, n: 5 },
      ]),
  },
];

interface View {
  kind: 'init' | 'calc' | 'pick' | 'done';
  round: number;
}

export const Ch5Stepper: React.FC<WidgetProps> = () => {
  const [seed, setSeed] = useState('a');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fullCode, setFullCode] = useState(false);
  // “先猜下一点”挑战模式：计算步里先隐藏 D 柱，读者点出预测的点后才揭晓
  const [guessMode, setGuessMode] = useState<'demo' | 'guess'>('demo');
  const [guesses, setGuesses] = useState<Record<number, number>>({});
  const reduced = useReducedMotion();
  const pts = useMemo(() => SEEDS.find((s) => s.id === seed)!.pts(), [seed]);
  const d = useMemo(() => euclidOf(pts.map((p) => ({ ...p, x: p.x * AR }))), [pts]);
  const steps = useMemo(() => greedyMaxMinSteps(N, K, d), [d]);
  const total = 1 + 2 * K + 1;
  const view: View = step === 0 ? { kind: 'init', round: 0 } : step === total - 1 ? { kind: 'done', round: K - 1 } : { kind: (step - 1) % 2 === 0 ? 'calc' : 'pick', round: Math.floor((step - 1) / 2) };

  const lines = useMemo(() => {
    if (view.kind === 'init') return [1, 2];
    if (view.kind === 'done') return [13, 22];
    if (view.round === 0) return view.kind === 'calc' ? [3, 4, 5, 6, 7, 8, 9] : [10, 11];
    return view.kind === 'calc' ? [13, 14, 15, 16, 17, 18, 19] : [20, 21];
  }, [view.kind, view.round]);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
    setGuesses({});
  }, [seed, guessMode]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), reduced ? 700 : 900);
    return () => window.clearTimeout(id);
  }, [playing, step, total, reduced]);

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => (W < 560 ? Math.round(W / AR) + 150 : 380));
  const curGuess = view.kind === 'calc' || view.kind === 'pick' ? guesses[view.round] : undefined;
  const awaiting = guessMode === 'guess' && view.kind === 'calc' && curGuess === undefined;
  const candidates = view.kind === 'calc' ? steps[view.round].D.map((v, i) => (Number.isNaN(v) || steps[view.round].selectedBefore.includes(i) ? -1 : i)).filter((i) => i >= 0) : [];
  // 画布与点击共用的几何
  const geom = (W: number, H: number) => {
    const barH = 120;
    const plotH = H - barH - 14;
    const sc = Math.min((W - 24) / AR, plotH - 20);
    const ox = (W - sc * AR) / 2;
    const oy = 10 + (plotH - 20 - sc) / 2;
    return { barH, plotH, P: (i: number) => ({ x: ox + pts[i].x * AR * sc, y: oy + pts[i].y * sc }) };
  };
  const makeGuess = (i: number) => {
    if (!awaiting || !candidates.includes(i)) return;
    setGuesses((g) => ({ ...g, [view.round]: i }));
  };
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!awaiting) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const { P } = geom(w, h);
    let best = -1;
    let bd = 18;
    for (const i of candidates) {
      const p = P(i);
      const dd = Math.hypot(p.x - x, p.y - y);
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    if (best >= 0) makeGuess(best);
  };

  const selectedNow = useMemo(() => {
    if (view.kind === 'init') return [] as number[];
    if (view.kind === 'done') return steps.map((s) => s.pick);
    const st = steps[view.round];
    return view.kind === 'pick' ? [...st.selectedBefore, st.pick] : st.selectedBefore;
  }, [view.kind, view.round, steps]);

  // 动画状态：每一步开始时计时；连线沿方向“长出来”，D 的柱子依次升起，被选中的点放大并发出涟漪。
  const animRef = useRef<{ wt: Float32Array; since: number; key: string }>({ wt: new Float32Array(N), since: 0, key: '' });

  useStageLoop(canvasRef, w, h, (ctx, t, dt) => {
    const a = animRef.current;
    const key = `${seed}:${step}:${curGuess ?? ''}`;
    if (a.key !== key) {
      a.key = key;
      a.since = 0;
    }
    a.since += dt;
    const final = t > 900;
    const since = final ? 99 : a.since;
    const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

    ctx.clearRect(0, 0, w, h);
    const { barH, P } = geom(w, h);
    const st = view.kind === 'calc' || view.kind === 'pick' ? steps[view.round] : null;
    const sel = new Set(selectedNow);
    const before = st ? new Set(st.selectedBefore) : sel;
    for (let i = 0; i < N; i++) a.wt[i] = final ? (sel.has(i) ? 1 : 0) : approach(a.wt[i], sel.has(i) ? 1 : 0, dt, 9);

    // 最近者连线（第一阶段：最近邻；第二阶段：最近的已选点）——计算步里从各点向外“长出来”
    if (st) {
      const grow = view.kind === 'calc' ? ease(since / 0.7) : 1;
      for (let i = 0; i < N; i++) {
        const j = st.nearest[i];
        if (j < 0 || before.has(i)) continue;
        const p1 = P(i);
        const p2 = P(j);
        const isPick = view.kind === 'pick' && i === st.pick;
        ctx.save();
        if (isPick) {
          ctx.shadowColor = C.verm;
          ctx.shadowBlur = 12;
        }
        ctx.strokeStyle = isPick ? C.verm : 'rgba(59, 91, 255, 0.4)';
        ctx.lineWidth = isPick ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x + (p2.x - p1.x) * grow, p1.y + (p2.y - p1.y) * grow);
        ctx.stroke();
        ctx.restore();
      }
    }
    // 读者的预测：蓝色虚线圈；等待作答时，候选点外有轻微的呼吸环提示“可以点”
    if (curGuess !== undefined) {
      const p = P(curGuess);
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.cobalt;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (awaiting) {
      const k2 = final ? 0.5 : 0.5 + 0.5 * Math.sin(t * 3);
      ctx.strokeStyle = `rgba(59,91,255,${0.15 + 0.25 * k2})`;
      ctx.lineWidth = 1;
      for (const i of candidates) {
        const p = P(i);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9 + 2 * k2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // 被选中点的涟漪
    if (st && view.kind === 'pick' && since < 1.6) {
      const p = P(st.pick);
      for (let r = 0; r < 2; r++) {
        const k2 = (since - r * 0.25) / 1.1;
        if (k2 <= 0 || k2 >= 1) continue;
        ctx.strokeStyle = `rgba(255,106,77,${0.8 * (1 - k2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 + ease(k2) * 34, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    // 点
    for (let i = 0; i < N; i++) {
      const p = P(i);
      const on = a.wt[i];
      const isPick = st && view.kind === 'pick' && i === st.pick;
      if (on > 0.03) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20 * on);
        g.addColorStop(0, 'rgba(255,106,77,0.55)');
        g.addColorStop(1, 'rgba(255,106,77,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x - 20, p.y - 20, 40, 40);
      }
      const twinkle = final ? 1 : 0.85 + 0.15 * Math.sin(t * 2.2 + i * 1.7);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5 + 2.5 * on, 0, Math.PI * 2);
      ctx.fillStyle = on > 0.5 ? C.verm : C.paper2;
      ctx.strokeStyle = on > 0.5 ? C.vermD : `rgba(74,84,112,${0.75 * twinkle})`;
      ctx.lineWidth = isPick ? 3 : 1.3;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isPick ? C.vermD : C.muted;
      ctx.font = `${isPick ? 700 : 500} 9px ${FONT_MONO}`;
      ctx.fillText(String(i + 1), p.x + 8, p.y - 6);
      if (on > 0.5) {
        ctx.fillStyle = '#fff';
        ctx.font = `700 9px ${FONT_SANS}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(selectedNow.indexOf(i) + 1), p.x, p.y + 3);
        ctx.textAlign = 'left';
      }
    }
    // 数组 D（柱状）：计算步里依次升起
    const by = h - 14;
    const bw = (w - 8) / N;
    ctx.strokeStyle = C.rule;
    ctx.beginPath();
    ctx.moveTo(0, by + 0.5);
    ctx.lineTo(w, by + 0.5);
    ctx.stroke();
    ctx.font = `600 11px ${FONT_SANS}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(st ? (view.round === 0 ? 'D：到最近邻的距离' : 'D：到已选集合的最近距离') : 'D（尚未计算）', 2, by - barH + 10);
    if (st && awaiting) {
      ctx.fillStyle = C.cobaltD;
      ctx.font = `600 12px ${FONT_SANS}`;
      ctx.fillText(w < 520 ? 'D 柱作答后揭晓：哪条细线最长？' : 'D 的柱子在你作答后揭晓——先看细线：谁离“最近者”最远？', 2, by - barH / 2);
    } else if (st) {
      const vals = st.D.filter((v) => !Number.isNaN(v));
      const mx = Math.max(...vals);
      for (let i = 0; i < N; i++) {
        const v = st.D[i];
        const x = 4 + i * bw;
        if (Number.isNaN(v) || before.has(i)) {
          ctx.fillStyle = '#e4e9f3';
          ctx.fillRect(x + 1, by - 4, bw - 2, 4);
          continue;
        }
        const rise = view.kind === 'calc' ? ease((since - i * 0.025) / 0.45) : 1;
        const hh = (v / mx) * (barH - 30) * rise;
        const isPick = view.kind === 'pick' && i === st.pick;
        ctx.save();
        if (isPick) {
          ctx.shadowColor = C.verm;
          ctx.shadowBlur = 14;
        }
        const g = ctx.createLinearGradient(0, by - hh, 0, by);
        g.addColorStop(0, isPick ? '#ffb39f' : '#9db1ff');
        g.addColorStop(1, isPick ? C.verm : C.cobalt);
        ctx.fillStyle = g;
        ctx.globalAlpha = isPick ? 1 : 0.6;
        ctx.fillRect(x + 1, by - hh, bw - 2, hh);
        ctx.restore();
      }
      if (view.kind === 'pick') {
        const x = 4 + st.pick * bw + bw / 2;
        ctx.globalAlpha = ease(since / 0.4);
        ctx.fillStyle = C.vermD;
        ctx.font = `600 11px ${FONT_MONO}`;
        ctx.textAlign = 'center';
        ctx.fillText(`max ${st.D[st.pick].toFixed(3)}`, Math.min(w - 34, Math.max(34, x)), by - barH + 26);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }
    }
  }, [seed, step, pts, steps, selectedNow, curGuess, awaiting]);

  let fb = '初始化：已选集合 Ẽv 为空，候选集合 R 包含全部 24 个点。目标是选出 M̃ = 6 个。';
  let tone: 'info' | 'good' | 'warn' = 'info';
  let fbMore: string | null = null;
  if (view.kind === 'calc') {
    const st = steps[view.round];
    fb = view.round === 0
      ? '第一阶段：对每个候选，找它最近的邻居（i ≠ j），把这个距离记进 D。细线连向各自的最近邻。'
      : `第二阶段第 ${view.round} 轮：对每个剩余候选，计算它到已选集合（${st.selectedBefore.length} 个）的最近距离，记进 D。细线连向各自最近的已选点。`;
  }
  if (awaiting) {
    fb = `挑战：先在图上点出你认为本轮会被选中的点（也可以用下方列表选编号）。提示：${view.round === 0 ? '第一阶段选“最孤立”的点——它到最近邻的细线最长' : '第二阶段选离已选集合最远的点——它连向最近已选点的细线最长'}。`;
  } else if (view.kind === 'calc' && curGuess !== undefined) {
    fb += ` 你预测的是第 ${curGuess + 1} 号点，按“下一步”揭晓。`;
  }
  if (view.kind === 'pick') {
    const st = steps[view.round];
    fb = view.round === 0
      ? `取 argmax(D)：第 ${st.pick + 1} 号点的最近邻距离最大（${st.D[st.pick].toFixed(3)}），它是“最孤立”的点，移入 Ẽv。`
      : `取 argmax(D)：第 ${st.pick + 1} 号点离已选集合最远（${st.D[st.pick].toFixed(3)}），填补当前最大的空洞，移入 Ẽv（已选 ${view.round + 1} / ${K}）。`;
    tone = 'good';
    const g = guesses[view.round];
    if (guessMode === 'guess' && g !== undefined) {
      if (g === st.pick) fb = `✓ 猜对了！${fb}`;
      else {
        fbMore = fb;
        fb = `✗ ${g + 1} 号 D = ${st.D[g].toFixed(3)} ＜ ${st.pick + 1} 号 ${st.D[st.pick].toFixed(3)}；${g + 1} 号${
          view.round === 0 ? '附近还有更近的邻居，不够“孤立”' : '靠近某个已选点，这片区域已部分覆盖'
        }。`;
        tone = 'warn';
      }
    }
  } else if (view.kind === 'done') {
    const nG = Object.keys(guesses).length;
    const nOk = Object.entries(guesses).filter(([r, g]) => steps[+r]?.pick === g).length;
    fb = `${guessMode === 'guess' && nG ? `挑战结果：${nOk} / ${nG} 轮猜对。` : ''}|Ẽv| = ${K} = M̃，while 条件不再满足，返回 Ẽv。选择顺序见圆点内的编号。第一阶段的 D 是“到其他候选的最近距离”，第二阶段的 D 是“到已选集合的最近距离”，两者定义不同，不能直接比大小；在第二阶段里，每轮被选点的 D 不会增加（可能相等）——空洞越填越小。`;
    tone = 'good';
  }

  return (
    <div className="w stepper-w">
      <div className="ctl-stack">
        <Seg label="点集" options={SEEDS.map((s) => ({ value: s.id, label: s.label }))} value={seed} onChange={setSeed} />
        <Seg
          small
          label="演示方式"
          options={[
            { value: 'demo', label: '直接演示' },
            { value: 'guess', label: '先猜下一点（挑战）' },
          ]}
          value={guessMode}
          onChange={(v) => {
            setPlaying(false);
            setGuessMode(v);
          }}
        />
      </div>
      <div className="stepper">
        <div ref={wrapRef} className={`cv stepper-cv ${awaiting ? 'cv-tap is-awaiting' : ''}`}>
          <canvas ref={canvasRef} role="img" aria-label={`Algorithm 1 第 ${step + 1} / ${total} 步${awaiting ? '：请选择你预测的点' : ''}`} onClick={onCanvasClick} />
        </div>
        <div className={`code-box ${fullCode ? 'is-full' : ''}`} aria-label="Algorithm 1 伪代码（论文原文）">
          <div className="code-cap">
            Algorithm 1（论文原文，第 1–22 行）
            {/* 手机端默认只显示本步高亮的几行 */}
            <button type="button" className="code-toggle" aria-expanded={fullCode} onClick={() => setFullCode((v) => !v)}>
              {fullCode ? '只看本步' : '展开完整伪代码'}
            </button>
          </div>
          <ScrollX label="伪代码">
            <ol className="code">
              {CODE.map((l) => (
                <li key={l.n} className={lines.includes(l.n) ? 'is-on' : ''} aria-current={lines.includes(l.n) ? 'step' : undefined}>
                  <span className="code-n">{l.n}</span>
                  <span className="code-t" style={{ paddingLeft: `${l.ind * 1.1}em` }}>{l.t}</span>
                </li>
              ))}
            </ol>
          </ScrollX>
        </div>
      </div>
      <div className="ctl-row">
        <Btn onClick={() => { setStep(0); setPlaying(false); setGuesses({}); }}>⟲ 重置</Btn>
        <Btn onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0}>‹ 上一步</Btn>
        <Btn primary onClick={() => { setPlaying(false); setStep((s) => Math.min(total - 1, s + 1)); }} disabled={step === total - 1 || awaiting}>
          {awaiting ? '先在图上选一个点' : '下一步 ›'}
        </Btn>
        {guessMode === 'demo' ? (
          <Btn onClick={() => { if (step >= total - 1) setStep(0); setPlaying((p) => !p); }}>{playing ? '❚❚ 暂停' : '▶ 自动播放'}</Btn>
        ) : null}
        {awaiting ? (
          <label className="sel sel-inline">
            <span>或选编号</span>
            <select value="" onChange={(e) => makeGuess(Number(e.target.value))}>
              <option value="" disabled>
                —
              </option>
              {candidates.map((i) => (
                <option key={i} value={i}>
                  第 {i + 1} 号
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <span className="w-note inline">第 {step + 1} / {total} 步</span>
      </div>
      <Feedback tone={tone}>
        {fb}
        {fbMore ? (
          <details className="fb-more">
            <summary>完整解释</summary>
            {fbMore}
          </details>
        ) : null}
      </Feedback>
      <p className="w-note">D 的柱高按本轮最大值缩放，不同轮之间请比较柱顶标出的数值。教学示意：二维欧氏距离代替 4096 维余弦距离；选择逻辑与 Algorithm 1 一致（并列时取编号最小者）。</p>
    </div>
  );
};

export default Ch5Stepper;
