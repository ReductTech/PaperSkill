import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { prepCanvas, useCanvasBox, useTween } from '../lib/hooks';
import { C, FONT_MONO, FONT_SANS } from '../lib/palette';
import { Btn, Feedback } from '../ui/kit';
import { bruteBest, euclidOf, greedyMaxMin, makeUniform, minPair } from '../lib/maxmin';

// 5.2 贪心（Algorithm 1）vs 穷举：12 个随机点选 4 个。

const N = 12;
const K = 4;
const AR = 1.6;

function solve(seed: number) {
  const pts = makeUniform(seed, N, 0.06);
  const d = euclidOf(pts.map((p) => ({ ...p, x: p.x * AR })));
  const g = greedyMaxMin(N, K, d);
  const gv = minPair(g, d);
  const b = bruteBest(N, K, d);
  const bv = minPair(b.set, d);
  return { pts, d, g, gv, b: b.set, bv, ratio: gv.v / b.v };
}

export const Ch5Exact: React.FC<WidgetProps> = () => {
  const [seed, setSeed] = useState(1);
  const [batch, setBatch] = useState<{ ratios: number[] } | null>(null);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const res = useMemo(() => solve(seed), [seed]);
  const ratioT = useTween(res.ratio * 100, 320);

  const { wrapRef, canvasRef, w, h } = useCanvasBox((W) => Math.min(320, Math.max(220, W / AR + 20)));

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !w) return;
    const ctx = prepCanvas(c, w, h);
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    const sc = Math.min((w - 30) / AR, h - 30);
    const ox = (w - sc * AR) / 2;
    const oy = (h - sc) / 2;
    const P = (i: number) => ({ x: ox + res.pts[i].x * AR * sc, y: oy + res.pts[i].y * sc });
    const line = (a: number, b: number, color: string, dash: number[], wdt: number) => {
      const p = P(a);
      const q = P(b);
      ctx.strokeStyle = color;
      ctx.lineWidth = wdt;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    line(res.bv.a, res.bv.b, C.cobalt, [5, 4], 2);
    line(res.gv.a, res.gv.b, C.verm, [], 2.5);
    for (let i = 0; i < N; i++) {
      const p = P(i);
      const inG = res.g.includes(i);
      const inB = res.b.includes(i);
      if (inB) {
        ctx.strokeStyle = C.cobalt;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, inG ? 6.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = inG ? C.verm : C.paper;
      ctx.strokeStyle = inG ? C.vermD : C.ink2;
      ctx.lineWidth = 1.3;
      ctx.fill();
      ctx.stroke();
      if (inG) {
        ctx.fillStyle = '#fff';
        ctx.font = `700 9px ${FONT_SANS}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(res.g.indexOf(i) + 1), p.x, p.y + 3);
        ctx.textAlign = 'left';
      }
    }
    ctx.font = `600 11px ${FONT_MONO}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(`seed ${seed}`, 6, h - 6);
  }, [w, h, res, seed, canvasRef]);

  const findCounter = () => {
    for (let s = seed + 1; s < seed + 400; s++) {
      const r = solve(s);
      if (r.ratio < 0.999) {
        setSeed(s);
        setSearchMsg(`从 seed ${seed + 1} 开始往后找，seed ${s} 是第一个贪心不是最优的例子。`);
        return;
      }
    }
    setSearchMsg('往后 400 组都恰好最优，换一个起点再试。');
  };

  const runBatch = () => {
    const ratios: number[] = [];
    for (let s = 1000; s < 1200; s++) ratios.push(solve(s).ratio);
    setBatch({ ratios });
  };

  const opt = res.ratio > 0.999;
  const stats = batch
    ? {
        optimal: batch.ratios.filter((r) => r > 0.999).length,
        worst: Math.min(...batch.ratios),
        mean: batch.ratios.reduce((a, b) => a + b, 0) / batch.ratios.length,
        bins: [0, 0.5, 0.6, 0.7, 0.8, 0.9, 0.999].map((lo, i, arr) => {
          const hi = i === arr.length - 1 ? 1.01 : arr[i + 1];
          return { lo, hi, n: batch.ratios.filter((r) => r >= lo && r < hi).length };
        }),
      }
    : null;

  return (
    <div className="w">
      <div ref={wrapRef} className="cv">
        <canvas ref={canvasRef} role="img" aria-label={`贪心得分 ${res.gv.v.toFixed(3)}，穷举最优 ${res.bv.v.toFixed(3)}`} />
      </div>
      <div className="cv-legend">
        <span><i className="dot" style={{ background: C.verm }} />贪心选中（编号 = 选择顺序）</span>
        <span><i className="ring" style={{ borderColor: C.cobalt }} />穷举最优</span>
        <span><i className="line" style={{ background: C.verm }} />贪心的短板</span>
        <span><i className="line dashed" style={{ borderColor: C.cobalt }} />最优解的短板</span>
      </div>
      <div className="readouts">
        <div className="ro ro-verm"><span>贪心（Algorithm 1）</span><b>{res.gv.v.toFixed(3)}</b></div>
        <div className="ro ro-cobalt"><span>穷举最优（495 种）</span><b>{res.bv.v.toFixed(3)}</b></div>
        <div className={`ro ${opt ? 'ro-green' : 'ro-amber'}`}><span>贪心 / 最优</span><b>{ratioT.toFixed(1)}%</b></div>
      </div>
      <div className="ctl-row">
        <Btn onClick={() => { setSearchMsg(null); setSeed((s) => s + 1); }}>换一组点</Btn>
        <Btn primary onClick={findCounter}>找一个反例</Btn>
        <Btn onClick={runBatch}>批量统计 200 组</Btn>
      </div>
      <Feedback tone={opt ? 'good' : 'warn'}>
        {searchMsg ? <>{searchMsg} </> : null}
        {opt
          ? `这一组贪心恰好达到最优（${res.bv.v.toFixed(3)}）。但这不是必然的——点“找一个反例”。`
          : `这一组贪心只达到最优值的 ${(res.ratio * 100).toFixed(1)}%：第一阶段先选了“最孤立”的点，之后每一步都只看眼前，没有回头调整，最终的短板比最优解短。`}
      </Feedback>
      {stats ? (
        <div className="batch">
          <div className="batch-head">
            200 组随机点（seed 1000–1199）：贪心恰好最优 <b>{stats.optimal}</b> 组（{((stats.optimal / 200) * 100).toFixed(0)}%），平均达到最优的 <b>{(stats.mean * 100).toFixed(1)}%</b>，最差 <b>{(stats.worst * 100).toFixed(1)}%</b>。
          </div>
          <div className="hist" role="img" aria-label="贪心 / 最优 比值的分布">
            {stats.bins.map((b) => (
              <div className="hist-col" key={b.lo}>
                <div className="hist-bar-wrap">
                  <div className="hist-bar" style={{ transform: `scaleY(${b.n / 200})` }} />
                </div>
                <div className="hist-n">{b.n}</div>
                <div className="hist-l">{b.lo === 0.999 ? '最优' : b.lo === 0 ? '<50%' : `${Math.round(b.lo * 100)}–${Math.round(b.hi * 100)}%`}</div>
              </div>
            ))}
          </div>
          <p className="w-note">本页外推：这个比例只针对“12 个二维均匀随机点选 4 个”的玩具问题，不能直接推广到 576 个 4096 维 token；它只说明贪心不保证最优。</p>
        </div>
      ) : null}
    </div>
  );
};

export default Ch5Exact;
