import React, { useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, drawStage, glow, token, label, rgba, approach, rand, rr } from './stageKit';
import { clamp } from '../lib/canvasKit';
import { ChipGroup, useIsMobile, CanvasPan } from './ui';
import { E, T } from './glossary';

// 模块 4.1（P2 分步）：把“观察 / 作者解释 / 因果约束 / 剪枝证据”分开呈现。
// 序列从左到右：系统提示 → 图像 → 指令 → 输出。因果注意力下信息只能向右流动；
// 本模块不画任何从图像流向系统提示的信息流，“被高度关注”只画成光晕，不画成“储存”。

type Kind = 'sys' | 'img' | 'ins' | 'out';
const COL: Record<Kind, string> = { sys: C.sys, img: C.img, ins: C.ins, out: C.out };

function buildLayout(mobile: boolean) {
  const W = mobile ? 420 : 1080;
  const H = mobile ? 330 : 320;
  const counts: Record<Kind, number> = mobile ? { sys: 3, img: 8, ins: 2, out: 2 } : { sys: 5, img: 22, ins: 4, out: 3 };
  const x0 = mobile ? 26 : 60;
  const x1 = mobile ? 394 : 1020;
  const gapGroup = mobile ? 12 : 28;
  const total = counts.sys + counts.img + counts.ins + counts.out;
  const step = (x1 - x0 - gapGroup * 3) / (total - 1);
  const cols: { x: number; kind: Kind; i: number }[] = [];
  let x = x0;
  (['sys', 'img', 'ins', 'out'] as Kind[]).forEach((k, gi) => {
    if (gi > 0) x += gapGroup;
    for (let i = 0; i < counts[k]; i++) {
      cols.push({ x, kind: k, i });
      x += step;
    }
  });
  const seqY = mobile ? 262 : 262;
  const qY = mobile ? 56 : 54; // 深层查询（最后一个输出 token 的深层状态）
  const last = cols[cols.length - 1];
  return { W, H, cols, seqY, qY, q: { x: last.x, y: qY }, tok: mobile ? 13 : 14, counts };
}

const STEPS = [
  { key: 0, label: '① 观察到什么' },
  { key: 1, label: '② 作者的解释' },
  { key: 2, label: '③ 因果允许的流向' },
  { key: 3, label: '④ 剪枝支持到哪' },
];

const TEXT: { title: string; body: string; cls: string }[] = [
  {
    title: '论文实际观察到的：深层注意力集中在系统提示位置',
    body: `生成回答时，输出 token 在深层把约 85% 的注意力投向${T('系统提示')}位置，图像 token 合计只分到约 3%；注意力图里系统提示的开头出现贯穿解码过程的竖直亮线 ${E('fig3', 'fig4')}。这是统计观察，不涉及“信息存在哪里”。`,
    cls: '',
  },
  {
    title: '作者的解释（假设）：少数“锚点”聚合了信息',
    body: `作者推测：视觉信号冗余，浅层把与图像、指令相关的特征聚合到少数“锚点” token（论文强调它们不是图像 token），深层再偏好关注这些锚点 ${E('sec34')}。论文没有逐层追踪锚点里存了什么，这是解释而不是测量。`,
    cls: '',
  },
  {
    title: '因果注意力只允许信息向后流动',
    body: `在 ${T('因果注意力')} 下，每个位置只能读取排在它前面的位置。系统提示排在图像之前，它的隐藏状态<b>读不到图像</b>；图像信息只能流向后面的图像、指令与输出 token。因此“系统提示位置被高度关注”不等于“视觉信息存进了系统提示”。这些位置也可能更像 ${T('注意力汇')}——这是本页的解读，论文未下此结论。`,
    cls: 'bad',
  },
  {
    title: '剪枝实验支持到哪一步',
    body: `在第 2 层后剪掉一半视觉 token，四项任务几乎不变；只剪系统提示前一半，模型就崩溃 ${E('tab7')}。它支持：在所测设置下，深层不需要一半视觉 token，而系统提示开头的位置很关键。它<b>不支持</b>：锚点储存了视觉信息，或“注意力低＝不重要”。`,
    cls: 'good',
  },
];

export const AnchorFlow: React.FC<WidgetProps> = () => {
  const mobile = useIsMobile();
  const L = useMemo(() => buildLayout(mobile), [mobile]);
  const [step, setStep] = useState(0);
  const st = useRef({ step: 0, beam: 0, hypo: 0, causal: 0, prune: 0 });
  st.current.step = step;

  // 第 3 步要剪掉的图像列（固定、示意）
  const pruned = useMemo(() => {
    const imgs = L.cols.filter((c) => c.kind === 'img');
    return new Set(imgs.filter((c) => rand(c.i * 3.7 + 1) < 0.5).map((c) => c.i));
  }, [L]);

  const canvasRef = useStage(L.W, L.H, (ctx, t, dt) => {
    const s = st.current;
    s.beam = approach(s.beam, 1, dt, 3);
    s.hypo = approach(s.hypo, s.step === 1 ? 1 : 0, dt, 5);
    s.causal = approach(s.causal, s.step >= 2 ? 1 : 0, dt, 4);
    s.prune = approach(s.prune, s.step === 3 ? 1 : 0, dt, 4);
    drawStage(ctx, L.W, L.H, t, 0.98);
    const { cols, seqY, q } = L;

    // 序列方向提示：一条细箭头轴
    ctx.strokeStyle = 'rgba(150,175,220,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cols[0].x - 10, seqY + 26);
    ctx.lineTo(cols[cols.length - 1].x + 10, seqY + 26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cols[cols.length - 1].x + 10, seqY + 26);
    ctx.lineTo(cols[cols.length - 1].x + 3, seqY + 22);
    ctx.moveTo(cols[cols.length - 1].x + 10, seqY + 26);
    ctx.lineTo(cols[cols.length - 1].x + 3, seqY + 30);
    ctx.stroke();

    // ① 深层查询的注意力光束（所有步骤都保留，强度按 Fig. 3 的深层分配）
    const share: Record<Kind, number> = { sys: 0.85, img: 0.03, ins: 0.02, out: 0.1 };
    cols.forEach((c, n) => {
      if (c.kind === 'out' && c.i === L.counts.out - 1) return;
      if (c.kind === 'img' && pruned.has(c.i) && s.prune > 0.5) return;
      let w = share[c.kind] / L.counts[c.kind];
      if (c.kind === 'sys') w = c.i === 0 ? 0.55 : c.i === 1 ? 0.2 : 0.1 / (L.counts.sys - 2);
      const a = clamp(Math.sqrt(w) * 1.25, 0.08, 0.95) * s.beam * (s.step === 2 ? 0.45 : 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(COL[c.kind], a);
      ctx.lineWidth = c.kind === 'sys' ? 1.5 + 9 * w : 1;
      ctx.setLineDash(c.kind === 'sys' ? [] : [2, 4]);
      ctx.lineDashOffset = -t * 18 - n;
      ctx.beginPath();
      ctx.moveTo(q.x, q.y + 8);
      ctx.quadraticCurveTo((q.x + c.x) / 2, q.y - 4, c.x, seqY - 14);
      ctx.stroke();
      ctx.restore();
    });

    // ③ 因果约束：图像信息只能向右流动（向后面的指令 / 输出 token）
    if (s.causal > 0.02) {
      const imgs = cols.filter((c) => c.kind === 'img' && !(pruned.has(c.i) && s.prune > 0.5));
      const later = cols.filter((c) => c.kind === 'ins' || c.kind === 'out');
      for (let k = 0; k < (L.W > 700 ? 26 : 16); k++) {
        const a = imgs[Math.floor(rand(k * 3 + 1) * imgs.length)];
        const b = later[Math.floor(rand(k * 7 + 2) * later.length)];
        if (!a || !b) continue;
        const u = (t * 0.35 + rand(k)) % 1;
        const e = u * u * (3 - 2 * u);
        const x = a.x + (b.x - a.x) * e;
        const y = seqY - 18 - Math.sin(e * Math.PI) * (40 + 30 * rand(k + 5));
        glow(ctx, x, y, 7, C.img, 0.7 * s.causal * Math.sin(u * Math.PI));
      }
      // 被因果掩码挡住的方向：图像 → 系统提示（红色虚线 + ✕，止于中途）
      const from = cols.find((c) => c.kind === 'img' && c.i === 2) || cols[0];
      const to = cols.find((c) => c.kind === 'sys' && c.i === 0) || cols[0];
      const midX = (from.x + to.x) / 2;
      ctx.save();
      ctx.strokeStyle = rgba(C.bad, 0.85 * s.causal);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(from.x, seqY - 16);
      ctx.quadraticCurveTo((from.x + midX) / 2, seqY - 70, midX, seqY - 62);
      ctx.stroke();
      ctx.restore();
      label(ctx, '✕', midX - 4, seqY - 62, 22, rgba(C.bad, s.causal), 'center', 800);
    }

    // ② 作者的假设：在高关注位置画一个带问号的虚线括号（不画信息流）
    const sysCols = cols.filter((c) => c.kind === 'sys');
    const sx0 = sysCols[0].x - 14;
    const sx1 = sysCols[sysCols.length - 1].x + 14;
    if (s.hypo > 0.02) {
      ctx.save();
      ctx.strokeStyle = rgba(C.sys, 0.8 * s.hypo);
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -t * 12;
      ctx.lineWidth = 1.6;
      rr(ctx, sx0, seqY - 30, sx1 - sx0, 50, 10);
      ctx.stroke();
      ctx.restore();
      label(ctx, '锚点？', (sx0 + sx1) / 2, seqY - 44, 15, rgba(C.sys, s.hypo), 'center', 800);
    }

    // 序列 token
    cols.forEach((c) => {
      const isPruned = c.kind === 'img' && pruned.has(c.i);
      const a = isPruned ? 1 - 0.75 * s.prune : 1;
      const halo = c.kind === 'sys' ? (c.i === 0 ? 1 : c.i === 1 ? 0.6 : 0.25) : 0;
      if (halo > 0) glow(ctx, c.x, seqY, 22 + 10 * halo + 3 * Math.sin(t * 3 + c.i), C.sys, 0.35 * halo * s.beam);
      token(ctx, c.x - L.tok / 2, seqY - L.tok / 2, L.tok, COL[c.kind], a, 0);
      if (isPruned && s.prune > 0.3) {
        ctx.strokeStyle = rgba(C.muted, s.prune);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(c.x - 4, seqY - 4);
        ctx.lineTo(c.x + 4, seqY + 4);
        ctx.moveTo(c.x + 4, seqY - 4);
        ctx.lineTo(c.x - 4, seqY + 4);
        ctx.stroke();
      }
    });
    // 深层查询点
    glow(ctx, q.x, q.y, 24 + 4 * Math.sin(t * 4), C.out, 0.7);
    token(ctx, q.x - 9, q.y - 9, 18, C.out, 1, 0.6);
    // 分配读数（Fig. 3 深层）
    label(ctx, '85%', (sx0 + sx1) / 2, seqY + 44, 15, C.sys, 'center', 800, true);
    const imgCols = cols.filter((c) => c.kind === 'img');
    label(ctx, '3%', (imgCols[0].x + imgCols[imgCols.length - 1].x) / 2, seqY + 44, 15, C.img, 'center', 800, true);
  });

  const cur = TEXT[step];
  return (
    <div>
      <ChipGroup label="分步查看" value={step} onChange={setStep} options={STEPS} />
      <CanvasPan fit>
        <canvas ref={canvasRef} width={L.W} height={L.H} aria-label="深层注意力、因果流向与剪枝证据的分步演示" />
      </CanvasPan>
      <div className="seq-legend" aria-hidden="true">
        <span><i style={{ background: C.sys }} />系统提示</span>
        <span><i style={{ background: C.img }} />图像</span>
        <span><i style={{ background: C.ins }} />指令</span>
        <span><i style={{ background: C.out }} />输出</span>
        <span className="seq-legend-dir">序列方向 →（因果：只能读左边）</span>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / 4 步
        </span>
        <button className="tiny" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={step === 3}>
          {step === 3 ? '已完成' : '下一步 →'}
        </button>
      </div>
      <div className={`feedback ${cur.cls}`}>
        <b>{cur.title}。</b>
        <span dangerouslySetInnerHTML={{ __html: cur.body }} />
      </div>
      {step === 3 ? (
        <div className="audit-table-wrap">
          <table className="paper">
            <thead>
              <tr>
                <th>重训 LLaVA-1.5-7B · Table 7</th>
                <th>Nocaps</th>
                <th>Flickr30k</th>
                <th>A-OKVQA</th>
                <th>MMMU</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>完整模型</td>
                <td>100.3</td>
                <td>70.2</td>
                <td>78.5</td>
                <td>34.5</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--green)' }}>(b) 第 2 层后剪 50% 视觉 token</td>
                <td>100.1</td>
                <td>70.0</td>
                <td>78.4</td>
                <td>34.6</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--red)' }}>(e) 剪掉系统提示的前一半</td>
                <td>17.5</td>
                <td>27.8</td>
                <td>Failed</td>
                <td>Failed</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default AnchorFlow;
