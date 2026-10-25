import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, drawStage, glow, rr, label, token, rgba, approach } from './stageKit';
import { ABLATION, ABL_BASE, BENCH } from './paperData';
import { clamp, easeOutCubic } from '../lib/canvasKit';
import { ChipGroup, CanvasPan } from './ui';

// 模块 7.1（P3 同步对比 + 策略切换）：选择剪法 -> 舞台上被移除的 token + 四项得分与完整模型同场增长。

const W = 1080;
const H = 340;

type Kind = 'sys' | 'img' | 'ins';
const ROW: Kind[] = [
  ...Array<Kind>(6).fill('sys'),
  ...Array<Kind>(22).fill('img'),
  ...Array<Kind>(6).fill('ins'),
];
const COLOR: Record<Kind, string> = { sys: C.sys, img: C.img, ins: C.ins };
const IMG_KEEP_ATTN = new Set([0, 2, 3, 5, 8, 9, 10, 13, 14, 17, 19]); // 示意：被关注较多的图像 token
const IMG_KEEP_RAND = new Set([1, 2, 4, 7, 9, 11, 12, 15, 16, 18, 21]);

/** 返回 token 在深层（第 3 层起）是否保留；train=true 表示训练时就只有一半图像 token */
function keep(id: string, i: number): boolean {
  const k = ROW[i];
  const imgIdx = i - 6;
  switch (id) {
    case 'b':
      return k !== 'img' || IMG_KEEP_ATTN.has(imgIdx);
    case 'c':
      return k !== 'img' || IMG_KEEP_RAND.has(imgIdx);
    case 'a':
      return k !== 'img' || imgIdx % 2 === 0;
    case 'f':
      return k !== 'ins' || i % 2 === 0;
    case 'd':
      return k !== 'sys' || i % 2 === 1 || i === 5;
    case 'e':
      return k !== 'sys' || i >= 3;
    case 'g':
      return i < 4 || i >= ROW.length - 4;
    default:
      return true;
  }
}

const FEED: Record<string, { text: string; cls: string }> = {
  b: { text: '按注意力剪掉 50% 图像 token：四项分数与完整模型几乎相同（100.1 / 70.0 / 78.4 / 34.6 对 100.3 / 70.2 / 78.5 / 34.5）。', cls: 'good' },
  c: { text: '随机剪掉 50% 图像 token：四项为 99.5 / 68.3 / 78.2 / 34.2。按注意力排序相对随机的差值是 +0.6、+1.7、+0.2、+0.4；但随机只运行了一次、没有方差，不能排除这些小差异来自噪声。', cls: '' },
  a: { text: '训练时就在 CLIP 之后加步长为 2 的平均池化，让图像 token 减半：四项都低于 FastV（如 Flickr30k 68.5 vs 70.0）。在这组对比中，推理时剪优于训练时池化。', cls: '' },
  f: { text: '把剪枝对象换成用户指令：Flickr30k 跌到 50.1、A-OKVQA 跌到 56.5——指令中的信息无法被替代。', cls: 'bad' },
  d: { text: '把剪枝对象换成系统提示：即使只剪掉很少的 token，Nocaps 也降到 89.2、A-OKVQA 降到 69.2。', cls: 'bad' },
  e: { text: '只剪掉系统提示的前一半，模型就彻底崩溃：Nocaps 17.5，选择题无法给出有效答案（Failed）。系统提示开头的位置对模型至关重要——这说明它们“不能剪”，并不说明视觉信息存在那里。', cls: 'bad' },
  g: { text: '照搬 LLM 的 StreamingLLM 稀疏注意力（开头的“注意力汇” + 局部窗口）：Nocaps 13.2，选择题 Failed——在这个设置下，LLM 的稀疏注意力方案不能直接搬到 LVLM。', cls: 'bad' },
};

export const PruneWhat: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('b');
  const st = useRef({ sel: 'b', last: '', t0: 0, vis: ROW.map(() => 1) });
  st.current.sel = sel;

  const canvasRef = useStage(W, H, (ctx, t, dt) => {
    const s = st.current;
    if (s.last !== s.sel) {
      s.last = s.sel;
      s.t0 = t;
    }
    const age = t - s.t0;
    const row = ABLATION.find((r) => r.id === s.sel) || ABLATION[0];
    drawStage(ctx, W, H, t, 0.96);

    // ---- 左：浅层 / 深层两排 token ----
    const x0 = 40;
    const step = 13;
    const y1 = 250;
    const y2 = 120;
    const train = s.sel === 'a';
    ROW.forEach((k, i) => {
      const x = x0 + i * step;
      const shallowKeep = train ? keep('a', i) : true;
      token(ctx, x, y1, 10, COLOR[k], shallowKeep ? 1 : 0.12, 0);
      const target = keep(s.sel, i) ? 1 : 0;
      s.vis[i] = approach(s.vis[i], target, dt, 6);
      const v = s.vis[i];
      const lit = s.sel === 'g' ? 0 : 0;
      token(ctx, x, y2, 10, COLOR[k], 0.12 + 0.88 * v, lit);
      if (v < 0.5) {
        const bad = k !== 'img';
        ctx.strokeStyle = rgba(bad ? C.bad : C.muted, 0.8 * (1 - v));
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 1, y2 + 1);
        ctx.lineTo(x + 9, y2 + 9);
        ctx.moveTo(x + 9, y2 + 1);
        ctx.lineTo(x + 1, y2 + 9);
        ctx.stroke();
      }
      // 层间连线
      ctx.strokeStyle = rgba(COLOR[k], 0.12 + 0.18 * v);
      ctx.beginPath();
      ctx.moveTo(x + 5, y1);
      ctx.lineTo(x + 5, y2 + 11);
      ctx.stroke();
    });
    label(ctx, 'L1–2', x0, y1 + 28, 12, C.muted, 'left', 700, true);
    label(ctx, 'L3+', x0, y2 - 18, 12, C.muted, 'left', 700, true);
    // 失败时舞台染红
    const failed = row.scores.some((v) => v === null);
    if (failed) {
      ctx.fillStyle = rgba(C.bad, 0.06 + 0.03 * Math.sin(t * 4));
      ctx.fillRect(0, 0, 470, H);
    }

    // ---- 右：四项任务，完整模型（虚线）与所选策略同时增长 ----
    const gx = 520;
    const gw = 520;
    const by = 300;
    const maxH = 220;
    const grow = easeOutCubic(clamp(age / 1.6, 0, 1));
    BENCH.forEach((name, j) => {
      const cx = gx + j * (gw / 4) + 24;
      const bw = 34;
      const baseH = maxH * 0.86 * grow;
      // 完整模型：虚线框
      ctx.strokeStyle = 'rgba(232,238,248,0.55)';
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(cx, by - baseH, bw, baseH);
      ctx.setLineDash([]);
      const v = row.scores[j];
      const vx = cx + bw + 8;
      if (v === null) {
        if (grow > 0.6) {
          glow(ctx, vx + bw / 2, by - 30, 30, C.bad, 0.6);
          label(ctx, '✕', vx + bw / 2, by - 30, 30, C.bad, 'center', 800);
        }
      } else {
        const ratio = v / ABL_BASE[j];
        const h = maxH * 0.86 * ratio * grow;
        const col = ratio >= 0.985 ? C.good : ratio >= 0.9 ? C.emph : C.bad;
        const g = ctx.createLinearGradient(0, by - h, 0, by);
        g.addColorStop(0, col);
        g.addColorStop(1, rgba(col, 0.35));
        ctx.fillStyle = g;
        rr(ctx, vx, by - h, bw, h, 5);
        ctx.fill();
        glow(ctx, vx + bw / 2, by - h, 22, col, 0.5);
        if (grow > 0.9) label(ctx, `${v}`, vx + bw / 2, by - h - 14, 13, C.text, 'center', 800, true);
      }
      if (grow > 0.9) label(ctx, `${ABL_BASE[j]}`, cx + bw / 2, by - baseH - 14, 12, C.muted, 'center', 700, true);
      label(ctx, name, cx + bw + 4, by + 18, 12, C.muted, 'center', 700);
    });
  });

  const fb = FEED[sel];
  return (
    <div>
      <ChipGroup label="剪枝策略" value={sel} onChange={setSel} options={ABLATION.map((r) => ({ key: r.id, label: `(${r.id}) ${r.short}` }))} />
      <CanvasPan><canvas ref={canvasRef} width={W} height={H} aria-label="不同剪法与完整模型的同场对比" /></CanvasPan>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
      <table className="paper">
        <thead>
          <tr>
            <th>Table 7 · 重新训练的 LLaVA-1.5-7B</th>
            {BENCH.map((b) => (
              <th key={b}>{b}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>完整模型</td>
            {ABL_BASE.map((v, i) => (
              <td key={i}>{v}</td>
            ))}
          </tr>
          {ABLATION.map((r) => (
            <tr
              key={r.id}
              onClick={() => setSel(r.id)}
              style={{
                cursor: 'pointer',
                background: r.id === sel ? 'var(--blue-soft)' : undefined,
                fontWeight: r.id === sel ? 700 : undefined,
              }}
            >
              <td>
                ({r.id}) {r.name}
              </td>
              {r.scores.map((v, i) => (
                <td key={i} style={{ color: v === null ? 'var(--red)' : undefined }}>
                  {v === null ? 'Failed' : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PruneWhat;
