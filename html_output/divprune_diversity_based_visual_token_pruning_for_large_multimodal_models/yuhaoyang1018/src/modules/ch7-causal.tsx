import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useReducedMotion } from '../lib/hooks';
import { C, FONT_SANS } from '../lib/palette';
import { Btn, Feedback, Seg } from '../ui/kit';

// 7.2 因果注意力示意：位置 = [前缀 2][视觉 8][问题 4]，5 层。
// 第 ℓ 层每个位置只汇聚“自己及之前、且在该层仍存在”的位置的信息（不能倒流）。
// 在第 K 层之后剪枝：第 1…K 层所有视觉 token 都在；第 K+1 层起只剩保留的 3 个。

const P = 2;
const V = 8;
const Q = 4;
const L = 5;
const KEEP = new Set([1, 4, 6]);
const TOK = [...Array(P).fill('p'), ...Array(V).fill('v'), ...Array(Q).fill('q')] as ('p' | 'v' | 'q')[];

function simulate(K: number) {
  const n = TOK.length;
  const alive = (l: number, pos: number) => {
    if (TOK[pos] !== 'v') return true;
    const vi = pos - P;
    return l === 0 || l <= K || KEEP.has(vi);
  };
  const info: number[][] = [];
  info.push(TOK.map((t, pos) => (t === 'v' ? 1 << (pos - P) : 0)));
  for (let l = 1; l <= L; l++) {
    const row: number[] = [];
    for (let pos = 0; pos < n; pos++) {
      if (!alive(l, pos)) {
        row.push(-1);
        continue;
      }
      let m = 0;
      for (let q = 0; q <= pos; q++) if (alive(l, q) && info[l - 1][q] >= 0) m |= info[l - 1][q];
      row.push(m);
    }
    info.push(row);
  }
  return { info, alive };
}

const popcount = (m: number) => {
  let c = 0;
  for (let i = 0; i < V; i++) if (m & (1 << i)) c++;
  return c;
};

export const Ch7Causal: React.FC<WidgetProps> = () => {
  const [K, setK] = useState(0);
  const [shown, setShown] = useState(L);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const sim = useMemo(() => simulate(K), [K]);

  useEffect(() => {
    if (!playing) return;
    if (shown >= L) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setShown((s) => s + 1), reduced ? 250 : 650);
    return () => window.clearTimeout(id);
  }, [playing, shown, reduced]);

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => {
    const cell = Math.min(34, (W - 54) / TOK.length);
    return 30 + (L + 1) * (cell + 14) + 20;
  });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const left = 48;
    const cell = Math.min(34, (w - left - 6) / TOK.length);
    const gap = 14;
    const rowY = (l: number) => h - 26 - (l + 1) * (cell + gap) + gap;
    const colX = (pos: number) => left + pos * cell;
    // 层标签
    ctx.font = `600 11px ${FONT_SANS}`;
    ctx.fillStyle = C.muted;
    for (let l = 0; l <= L; l++) ctx.fillText(l === 0 ? '输入' : `第${l}层`, 2, rowY(l) + cell * 0.65);
    // 剪枝线
    const ky = rowY(K) - gap / 2;
    ctx.strokeStyle = C.vermD;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left - 4, ky);
    ctx.lineTo(w - 2, ky);
    ctx.stroke();
    ctx.setLineDash([]);
    const kt = K === 0 ? '剪枝（进入第 1 层前）' : `剪枝（第 ${K} 层之后）`;
    const tw = ctx.measureText(kt).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(left - 2, ky - 15, tw + 6, 14);
    ctx.fillStyle = C.vermD;
    ctx.fillText(kt, left, ky - 4);

    // 当前动画层：画指向最后一个问题 token 的注意力来源（只来自之前的位置）
    const cur = Math.min(shown, L);
    if (cur >= 1) {
      const target = TOK.length - 1;
      const tx = colX(target) + cell / 2;
      const ty = rowY(cur) + cell / 2;
      for (let q = 0; q < TOK.length; q++) {
        if (!sim.alive(cur, q) || sim.info[cur - 1][q] < 0) continue;
        const sx = colX(q) + cell / 2;
        const sy = rowY(cur - 1) + cell / 2;
        ctx.strokeStyle = TOK[q] === 'v' ? 'rgba(59, 91, 255, 0.4)' : 'rgba(20, 28, 52, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo((sx + tx) / 2, sy - cell * 0.2, tx, ty + cell / 2);
        ctx.stroke();
      }
    }

    for (let l = 0; l <= Math.min(shown, L); l++) {
      for (let pos = 0; pos < TOK.length; pos++) {
        const x = colX(pos) + 1;
        const y = rowY(l);
        const s = cell - 3;
        const m = sim.info[l][pos];
        const t = TOK[pos];
        if (m < 0) {
          ctx.strokeStyle = C.faint;
          ctx.setLineDash([2, 3]);
          ctx.strokeRect(x + 0.5, y + 0.5, s, s);
          ctx.setLineDash([]);
          continue;
        }
        ctx.fillStyle = t === 'p' ? '#e3e7f0' : t === 'v' ? (KEEP.has(pos - P) ? C.vermSoft : C.cobaltSoft) : '#f4f6fb';
        ctx.fillRect(x, y, s, s);
        ctx.strokeStyle = t === 'q' ? C.ink2 : C.rule;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, s, s);
        // 信息槽：8 个视觉 token 的信息是否已到达这里
        if (t !== 'p') {
          const cols = 4;
          const dot = Math.max(2, (s - 6) / cols - 1);
          for (let i = 0; i < V; i++) {
            if (!(m & (1 << i))) continue;
            const dx = x + 3 + (i % cols) * (dot + 1);
            const dy = y + 3 + Math.floor(i / cols) * (dot + 1);
            ctx.fillStyle = KEEP.has(i) ? C.verm : C.cobalt;
            ctx.fillRect(dx, dy, dot, dot);
          }
        }
      }
    }
    // 底部分组标签
    ctx.fillStyle = C.muted;
    ctx.font = `600 11px ${FONT_SANS}`;
    const by = h - 8;
    ctx.fillText('前缀', colX(0), by);
    ctx.fillText('视觉 token（浅红底 = 保留）', colX(P), by);
    if (w > 380) ctx.fillText('问题', colX(P + V), by);
  }, [w, h, sim, shown, K, canvasRef]);

  const q = sim.info[L][TOK.length - 1];
  const got = popcount(q);
  const fromPruned = popcount(q & ~[...KEEP].reduce((a, i) => a | (1 << i), 0));

  const fb =
    K === 0
      ? `K = 0：被剪掉的 5 个视觉 token 从未进入 LLM。最后一个问题 token 在第 5 层只含 ${got} / 8 个视觉 token 的信息（全部来自保留的 3 个）。`
      : `K = ${K}：前 ${K} 层里所有视觉 token 都在，问题 token 已经从它们那里读到了信息；第 ${K} 层之后被剪掉的 5 个 token 不再更新，但它们的信息（蓝色小格，${fromPruned} 个）已经混在问题 token 里。最后一个问题 token 含 ${got} / 8 个视觉 token 的信息。`;

  return (
    <div className="w">
      <div className="ctl-row">
        <Seg label="剪枝位置" options={[{ value: 0, label: 'Layer 0（进入前）' }, { value: 2, label: '第 2 层之后' }, { value: 4, label: '第 4 层之后' }]} value={K} onChange={(v) => { setK(v); setShown(L); setPlaying(false); }} />
        <Btn primary onClick={() => { setShown(0); setPlaying(true); }}>▶ 逐层播放</Btn>
      </div>
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`因果注意力示意：剪枝在第 ${K} 层，最后一个问题 token 含 ${got}/8 个视觉 token 的信息`} />
      </div>
      <div className="cv-legend">
        <span><i className="dot" style={{ background: C.verm }} />来自保留 token 的信息</span>
        <span><i className="dot" style={{ background: C.cobalt }} />来自被剪 token 的信息</span>
        <span><i className="line" style={{ background: 'rgba(59, 91, 255, 0.5)' }} />当前层流向最后一个问题 token 的来源（只来自它之前的位置）</span>
      </div>
      <Feedback tone={K === 0 ? 'info' : 'warn'}>
        {fb} 信息只能从前往后流：视觉 token 排在问题之前，所以在任何一层都看不到问题。
      </Feedback>
      <p className="w-note">教学示意：用“信息集合的并集”粗略代表注意力的混合作用，真实模型中信息的强弱由注意力权重决定。</p>
    </div>
  );
};

export default Ch7Causal;
