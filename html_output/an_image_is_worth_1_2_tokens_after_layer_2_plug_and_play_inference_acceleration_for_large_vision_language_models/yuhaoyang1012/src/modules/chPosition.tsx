import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, useStage, drawStage, glow, rr, label, rgba, approach, sceneCanvas, rand, GRID, syntheticAttention, rankOrder } from './stageKit';
import { ADVICE } from './paperData';
import { clamp } from '../lib/canvasKit';
import { ChipGroup, Num, CanvasPan } from './ui';

// ============================================================================
//  模块 10.1（P4 切换）：方法地图——各类加速方法“动”的是计算流程的哪一段
//  归类依据：论文 §2 相关工作。
// ============================================================================
const W1 = 1080;
const H1 = 330;

type MKey = 'mem' | 'sparse' | 'train' | 'vit' | 'fastv';
const METHODS: { key: MKey; name: string; where: string; train: string; saves: string; paper: string; cls: string }[] = [
  {
    key: 'mem',
    name: 'FlashAttention / vLLM / RingAttention',
    where: '注意力模块的显存与实现',
    train: '否',
    saves: '显存与访存开销；token 数不变',
    paper: '优化注意力的显存占用，保证结果不会大幅改变；与 FastV 关注的“冗余计算”是两条路线。',
    cls: '',
  },
  {
    key: 'sparse',
    name: 'StreamingLLM / FastGen',
    where: '语言模型的注意力计算',
    train: '否',
    saves: '冗余的注意力计算（FFN 仍按全部 token 计算）',
    paper: '为纯文本 LLM 设计，迁移到 LVLM 的效果此前未被研究；本文消融中照搬 StreamingLLM 在 LVLM 上失效（Nocaps 13.2）。',
    cls: 'bad',
  },
  {
    key: 'train',
    name: 'LLaMA-VID',
    where: '视觉 token 进入语言模型之前',
    train: '是（需额外微调阶段）',
    saves: '视觉 token 数（交叉注意力把每帧压成 2 个 token）',
    paper: '需要额外的微调阶段，限制了它在不同 LVLM 上的通用性。',
    cls: '',
  },
  {
    key: 'vit',
    name: 'EViT / SPViT / PuMer / PYRA',
    where: '视觉 Transformer（ViT）内部',
    train: '因方法而异',
    saves: 'ViT 中的图像 token',
    paper: '大模型时代之前、面向 ViT 的 token 剪枝 / 合并方法。',
    cls: '',
  },
  {
    key: 'fastv',
    name: 'FastV（本文）',
    where: '语言模型内部，第 K 层之后',
    train: '否',
    saves: '被剪图像 token 在后续层的注意力 + FFN 计算',
    paper: '论文自述为首个面向 LVLM 的视觉 token 剪枝：用语言模型自身的注意力信号决定剪谁，无需训练即可插入基于 token 的 LVLM。',
    cls: 'good',
  },
];

const LAYER_N = 8;
const LX0 = 400;
const LX1 = 1030;
const ROWS = [
  { kind: 'sys', y: 92 },
  ...Array.from({ length: 6 }, (_, i) => ({ kind: 'img', y: 116 + i * 22 })),
  { kind: 'ins', y: 256 },
] as { kind: 'sys' | 'img' | 'ins'; y: number }[];

export const MethodMap: React.FC<WidgetProps> = () => {
  const [mk, setMk] = useState<MKey>('fastv');
  const st = useRef({ mk: 'fastv' as MKey, mem: 0, sparse: 0, train: 0, vit: 0, fastv: 1 });
  st.current.mk = mk;

  const canvasRef = useStage(W1, H1, (ctx, t, dt) => {
    const s = st.current;
    (['mem', 'sparse', 'train', 'vit', 'fastv'] as MKey[]).forEach((k) => {
      s[k] = approach(s[k], s.mk === k ? 1 : 0, dt, 6);
    });
    drawStage(ctx, W1, H1, t, 0.99);
    const img = sceneCanvas();
    // 输入图像
    ctx.drawImage(img, 30, 118, 110, 110);
    ctx.strokeStyle = 'rgba(150,175,220,0.35)';
    ctx.strokeRect(30, 118, 110, 110);

    // ViT 块
    const vx = 175;
    const vw = 130;
    ctx.fillStyle = 'rgba(91,156,240,0.08)';
    rr(ctx, vx, 80, vw, 190, 14);
    ctx.fill();
    ctx.strokeStyle = rgba(C.img, 0.35 + 0.6 * s.vit);
    ctx.lineWidth = 1.5 + 1.5 * s.vit;
    rr(ctx, vx, 80, vw, 190, 14);
    ctx.stroke();
    if (s.vit > 0.05) glow(ctx, vx + vw / 2, 175, 90, C.img, 0.25 * s.vit);
    // ViT 内部 patch：选中 ViT 方法时逐列变稀
    for (let c = 0; c < 6; c++) {
      for (let r = 0; r < 8; r++) {
        const keepP = 1 - (c / 6) * 0.6 * s.vit;
        const on = rand(c * 31 + r * 7) < keepP;
        ctx.fillStyle = rgba(C.img, on ? 0.75 : 0.12);
        ctx.fillRect(vx + 14 + c * 18, 100 + r * 20, 12, 12);
      }
    }
    label(ctx, 'ViT', vx + vw / 2, 66, 13, C.muted, 'center', 800);

    // 压缩器（LLaMA-VID 式）
    const px = 322;
    ctx.fillStyle = rgba(C.emph, 0.08 + 0.2 * s.train);
    rr(ctx, px, 110, 56, 130, 10);
    ctx.fill();
    ctx.strokeStyle = rgba(C.emph, 0.2 + 0.7 * s.train);
    rr(ctx, px, 110, 56, 130, 10);
    ctx.stroke();
    if (s.train > 0.3) {
      label(ctx, '微调', px + 28, 96, 12, rgba(C.emph, s.train), 'center', 800);
      glow(ctx, px + 28, 175, 50, C.emph, 0.3 * s.train);
    }

    // LLM 层
    const lw = (LX1 - LX0) / LAYER_N;
    for (let l = 0; l < LAYER_N; l++) {
      const x = LX0 + l * lw;
      // 注意力子块（上）与 FFN 子块（下）
      const attnHot = s.mem + s.sparse * 0.8;
      ctx.fillStyle = rgba(s.sparse > 0.5 ? C.bad : C.ins, 0.07 + 0.18 * attnHot);
      rr(ctx, x + 6, 74, lw - 12, 98, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(79,209,224,0.06)';
      rr(ctx, x + 6, 178, lw - 12, 98, 8);
      ctx.fill();
      if (s.mem > 0.05) {
        // 显存优化：注意力块内的分块（tiling）纹理
        ctx.strokeStyle = rgba(C.ins, 0.5 * s.mem);
        for (let q = 1; q < 4; q++) {
          ctx.beginPath();
          ctx.moveTo(x + 6 + (q * (lw - 12)) / 4, 78);
          ctx.lineTo(x + 6 + (q * (lw - 12)) / 4, 168);
          ctx.stroke();
        }
      }
      if (s.sparse > 0.05) {
        // 稀疏注意力：只保留开头“注意力汇”列与对角局部窗口
        const m0x = x + 14;
        const m0y = 86;
        const ms = lw - 28;
        const n = 8;
        for (let i = 0; i < n; i++) {
          for (let j = 0; j <= i; j++) {
            const keep = j === 0 || i - j <= 1;
            ctx.fillStyle = keep ? rgba(C.bad, 0.8 * s.sparse) : rgba(C.dim, 0.4 * s.sparse);
            ctx.fillRect(m0x + (j * ms) / n, m0y + (i * ms) / n, ms / n - 1, ms / n - 1);
          }
        }
      }
    }
    label(ctx, 'LLM', (LX0 + LX1) / 2, 58, 13, C.muted, 'center', 800);
    // FastV 剪枝门（第 2 层之后）
    const gateX = LX0 + 2 * lw;
    if (s.fastv > 0.05) {
      ctx.save();
      ctx.strokeStyle = rgba(C.good, s.fastv);
      ctx.lineWidth = 2.5;
      ctx.shadowColor = C.good;
      ctx.shadowBlur = 14;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -t * 20;
      ctx.beginPath();
      ctx.moveTo(gateX, 66);
      ctx.lineTo(gateX, 286);
      ctx.stroke();
      ctx.restore();
    }

    // token 流（从左往右穿过各层）
    ROWS.forEach((row, ri) => {
      const col = row.kind === 'sys' ? C.sys : row.kind === 'img' ? C.img : C.ins;
      const isImg = row.kind === 'img';
      const imgIdx = ri - 1;
      // LLaMA-VID：只剩 2 条图像流；FastV：第 2 层后剪掉一半（第 1,3,5 条）
      const compressed = isImg && imgIdx >= 2 ? s.train : 0;
      const prunedAfter = isImg && imgIdx % 2 === 1 ? s.fastv : 0;
      const baseA = 0.55 * (1 - compressed);
      ctx.strokeStyle = rgba(col, baseA);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 56, row.y);
      ctx.lineTo(prunedAfter > 0.5 ? gateX : LX1, row.y);
      ctx.stroke();
      if (prunedAfter > 0.02) {
        ctx.strokeStyle = rgba(col, baseA * (1 - prunedAfter));
        ctx.beginPath();
        ctx.moveTo(gateX, row.y);
        ctx.lineTo(LX1, row.y);
        ctx.stroke();
        ctx.strokeStyle = rgba(C.bad, 0.8 * prunedAfter);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(gateX + 4, row.y - 5);
        ctx.lineTo(gateX + 12, row.y + 5);
        ctx.moveTo(gateX + 12, row.y - 5);
        ctx.lineTo(gateX + 4, row.y + 5);
        ctx.stroke();
      }
      // 流动光点
      const end = prunedAfter > 0.5 ? gateX : LX1;
      if (baseA > 0.1) {
        for (let q = 0; q < 2; q++) {
          const u = (t * 0.22 + q * 0.5 + rand(ri) * 0.3) % 1;
          const x = px + 56 + (end - px - 56) * u;
          glow(ctx, x, row.y, 10, col, 0.7 * baseA);
        }
      }
    });
  });

  const m = METHODS.find((x) => x.key === mk) || METHODS[4];
  return (
    <div>
      <ChipGroup
        label="加速方法"
        value={mk}
        onChange={setMk}
        options={METHODS.map((x) => ({ key: x.key, label: x.key === 'fastv' ? 'FastV' : x.name.split(' / ')[0] + (x.name.includes('/') ? ' 等' : '') }))}
      />
      <CanvasPan><canvas ref={canvasRef} width={W1} height={H1} aria-label="各类加速方法在计算流程中的作用位置" /></CanvasPan>
      <div className={`feedback ${m.cls}`}>
        <b>{m.name}</b>：{m.paper}
      </div>
      <table className="paper">
        <thead>
          <tr>
            <th>方法（按论文 §2 归类）</th>
            <th>作用位置</th>
            <th>需要训练</th>
            <th>省掉了什么</th>
          </tr>
        </thead>
        <tbody>
          {METHODS.map((x) => (
            <tr key={x.key} onClick={() => setMk(x.key)} className={x.key === mk ? 'row-on' : ''} style={{ cursor: 'pointer' }}>
              <td>{x.name}</td>
              <td>{x.where}</td>
              <td>{x.train}</td>
              <td>{x.saves}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
//  模块 10.2（P4 双组切换）：配置顾问——按任务与目标给出 (K, R) 与论文证据
// ============================================================================
const W2 = 1080;
const H2 = 300;
type Task = 'caption' | 'ocr' | 'video' | 'qformer';
type Goal = 'safe' | 'fast';
const TASKS: { key: Task; label: string }[] = [
  { key: 'caption', label: '图像描述 / 通用问答' },
  { key: 'ocr', label: '细粒度 OCR' },
  { key: 'video', label: '视频问答' },
  { key: 'qformer', label: 'Q-Former 类模型' },
];
const order = rankOrder(syntheticAttention());
const rankOf = new Uint16Array(GRID * GRID);
order.forEach((idx, r) => (rankOf[idx] = r));

export const ConfigAdvisor: React.FC<WidgetProps> = () => {
  const [task, setTask] = useState<Task>('caption');
  const [goal, setGoal] = useState<Goal>('safe');
  const adv = ADVICE[task][goal];
  const st = useRef({ R: 0.5, Rv: 0.5, flops: 0.55, fv: 0.55, perf: 1, pv: 1, K: 2, Kv: 2 });
  st.current.R = adv.R;
  st.current.flops = adv.flopsRatio;
  st.current.perf = adv.perfRatio;
  st.current.K = adv.K;

  const canvasRef = useStage(W2, H2, (ctx, t, dt) => {
    const s = st.current;
    s.Rv = approach(s.Rv, s.R, dt, 6);
    s.fv = approach(s.fv, s.flops < 0 ? 0 : s.flops, dt, 6);
    s.pv = approach(s.pv, s.perf, dt, 6);
    s.Kv = approach(s.Kv, s.K, dt, 6);
    drawStage(ctx, W2, H2, t, 0.99);
    // 左：保留下来的图像 token 马赛克
    const img = sceneCanvas();
    const ps = 9.5;
    const x0 = 40;
    const y0 = 34;
    for (let i = 0; i < GRID * GRID; i++) {
      const r = (i / GRID) | 0;
      const c = i % GRID;
      const kept = rankOf[i] < GRID * GRID * (1 - s.Rv);
      ctx.globalAlpha = kept ? 1 : 0.12;
      ctx.drawImage(img, c * 14, r * 14, 14, 14, x0 + c * ps, y0 + r * ps, ps - 0.8, ps - 0.8);
    }
    ctx.globalAlpha = 1;
    // 中：K / R 大字
    label(ctx, `K = ${Math.round(s.Kv)}`, 330, 110, 44, C.text, 'left', 800, true);
    label(ctx, `R = ${Math.round(s.Rv * 100)}%`, 330, 176, 44, C.emph, 'left', 800, true);
    glow(ctx, 400, 140, 120, C.sys, 0.08);

    // 右：两个半圆仪表（FLOPs 比例 / 相对性能）
    const dial = (cx: number, v: number, col: string, text: string, unknown: boolean) => {
      const cy = 190;
      const R = 86;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI, 0);
      ctx.stroke();
      if (!unknown) {
        ctx.save();
        ctx.strokeStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, R, Math.PI, Math.PI + clamp(v, 0, 1) * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
      ctx.lineCap = 'butt';
      label(ctx, text, cx, cy - 18, 26, unknown ? C.muted : col, 'center', 800, true);
    };
    dial(700, s.fv, C.good, s.flops < 0 ? '—' : `${Math.round(s.fv * 100)}%`, s.flops < 0);
    label(ctx, 'FLOPs', 700, 216, 12, C.muted, 'center', 700);
    const pcol = s.pv >= 0.995 ? C.good : s.pv >= 0.97 ? C.emph : C.bad;
    dial(930, clamp((s.pv - 0.9) / 0.15, 0, 1), pcol, `${(s.pv * 100).toFixed(1)}%`, false);
    label(ctx, '相对性能', 930, 216, 12, C.muted, 'center', 700);
  });

  const perfPct = adv.perfRatio * 100;
  return (
    <div>
      <ChipGroup label="任务类型" value={task} onChange={setTask} options={TASKS} />
      <ChipGroup
        label="优化目标"
        value={goal}
        onChange={setGoal}
        options={[
          { key: 'safe', label: '稳妥：尽量不掉分' },
          { key: 'fast', label: '激进：更省计算' },
        ]}
      />
      <CanvasPan><canvas ref={canvasRef} width={W2} height={H2} aria-label="按任务和目标推荐的 FastV 配置" /></CanvasPan>
      <div className="metrics">
        <div className="metric">
          <div className="l">推荐配置</div>
          <div className="v">
            K=<Num value={adv.K} /> · R=<Num value={adv.R * 100} format={(v) => `${Math.round(v)}%`} />
          </div>
        </div>
        <div className="metric">
          <div className="l">论文报告的理论 FLOPs</div>
          <div className="v">{adv.flopsText}</div>
        </div>
        <div className="metric">
          <div className="l">论文报告得分（FastV / 完整）</div>
          <div className="v" style={{ fontSize: '1.15rem' }}>
            {adv.perfText}
          </div>
        </div>
      </div>
      <div className={`feedback ${perfPct >= 99.5 ? 'good' : perfPct >= 97 ? '' : 'bad'}`}>
        {adv.why}（这是基于论文实测结果整理的使用建议，属于解读，并非论文给出的规则。）
      </div>
    </div>
  );
};
