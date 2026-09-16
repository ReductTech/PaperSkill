import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, drawCurve, label } from './sceneKit';
import type { WidgetProps } from './registry';

// §5 模块：读数 —— 只用「含义与数值都能完整读出」的内容画表/画图。
// 可完整读取的来源：Table 1（全部 12 行 × 5 列成绩 + 9 行资源列）、
// Table 2（4 行 × 4 列消融）、附录 A.2 的 LoCoMo 规模与四类题量、
// Figure 3(c) 的词元序列（10 点）、Figure 3(d) 的 K 序列（5 点，按刻度对齐读取）。
// 刻意不使用 Figure 3(a)（无逐点数值）与 Figure 3(b)（标注值无法归属到具体操作）。

const W = 1080;
const H = 280;

const NODES = ['实验设置', '总体成绩', '分类成绩', '消融对照', '资源开销', '检索与种子'];

interface Cell {
  t: string;
  c?: string;
  align?: 'left' | 'right' | 'center';
  bold?: boolean;
}

function table(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colW: number[],
  rows: Cell[][],
  rowH: number,
  hi: number[] = [],
): void {
  const total = colW.reduce((a, b) => a + b, 0);
  rows.forEach((row, ri) => {
    const ry = y + ri * rowH;
    const header = ri === 0;
    if (header) ctx.fillStyle = 'rgba(39, 68, 110, 0.12)';
    else if (hi.includes(ri)) ctx.fillStyle = 'rgba(34, 141, 92, 0.16)';
    else ctx.fillStyle = ri % 2 === 0 ? 'rgba(33, 50, 74, 0.035)' : 'rgba(255,255,255,0)';
    ctx.fillRect(x, ry, total, rowH);

    ctx.strokeStyle = 'rgba(104, 119, 143, 0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, ry);
    ctx.lineTo(x + total, ry);
    ctx.stroke();

    let cx = x;
    row.forEach((cell, ci) => {
      const al = cell.align ?? (ci === 0 ? 'left' : 'right');
      const tx = al === 'left' ? cx + 12 : al === 'right' ? cx + colW[ci] - 12 : cx + colW[ci] / 2;
      const col = cell.c ?? (header ? COL.blue : COL.ink);
      label(ctx, cell.t, tx, ry + rowH * 0.5 + (header ? 6 : 5), col, al, header ? 15 : cell.bold ? 15 : 14);
      cx += colW[ci];
    });

    cx = x;
    ctx.strokeStyle = 'rgba(104, 119, 143, 0.18)';
    for (let i = 1; i < colW.length; i += 1) {
      cx += colW[i - 1];
      ctx.beginPath();
      ctx.moveTo(cx, ry);
      ctx.lineTo(cx, ry + rowH);
      ctx.stroke();
    }
  });
  ctx.strokeStyle = 'rgba(104, 119, 143, 0.30)';
  ctx.beginPath();
  ctx.moveTo(x, y + rows.length * rowH);
  ctx.lineTo(x + total, y + rows.length * rowH);
  ctx.stroke();
}

/** 横向条形：名称 + 条 + 数值。 */
function hbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nameW: number,
  barW: number,
  valW: number,
  name: string,
  v: number,
  max: number,
  color: string,
  strong: boolean,
): void {
  label(ctx, name, x, y + 5, strong ? COL.green : COL.ink, 'left', strong ? 15 : 14);
  const bx = x + nameW;
  ctx.fillStyle = 'rgba(33, 50, 74, 0.06)';
  ctx.fillRect(bx, y - 8, barW, 12);
  ctx.fillStyle = color;
  ctx.fillRect(bx, y - 8, Math.max(2, (v / max) * barW), 12);
  label(ctx, v.toFixed(2), bx + barW + valW - 8, y + 5, strong ? COL.green : COL.muted, 'right', 14);
}

/** 纵向柱：带数值与 x 轴标签。 */
function vbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  w: number,
  v: number,
  lo: number,
  hi: number,
  maxH: number,
  color: string,
  vtxt: string,
  xtxt: string,
): void {
  const ratio = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  const bh = Math.max(3, ratio * maxH);
  ctx.fillStyle = color;
  ctx.fillRect(x, baseline - bh, w, bh);
  // 基线
  ctx.strokeStyle = COL.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 10, baseline);
  ctx.lineTo(x + w + 10, baseline);
  ctx.stroke();
  label(ctx, vtxt, x + w / 2, baseline - bh - 8, color, 'center', 14);
  label(ctx, xtxt, x + w / 2, baseline + 20, COL.muted, 'center', 14);
}

const STEPS = [
  {
    node: 0,
    tag: '实验设置',
    desc: '先把评测协议的规模摊开：这套成绩到底是在多大的题量上量出来的。',
    feedback:
      '语料是 LoCoMo：10 段长期对话，平均 588 轮、每段约 16,618 词元。全部方法统一用 gpt-4o-mini 作主干、text-embedding-3-small 作嵌入，用大模型裁判打分——同一套协议下比，成绩才可比。',
    cls: '' as const,
  },
  {
    node: 1,
    tag: 'Table 1 · 综合分',
    desc: '综合成绩（Overall）全部 12 个方法，从高到低。',
    feedback:
      '本文 76.82，是表内最高；Memobase 75.78、Zep 75.14 紧随其后；其余落在 58–74 之间。论文的原话是「在 LoCoMo 上取得 state-of-the-art 的综合表现」，并指出它在多跳与时序推理上有实质提升，同时降低了词元消耗与调用次数。',
    cls: 'good' as const,
  },
  {
    node: 2,
    tag: 'Table 1 · 分类成绩',
    desc: '「综合第一」不等于「每一类都第一」——按问题类型拆开看。',
    feedback:
      '综合第 1；时序 81.62 排第 2（Memobase 85.05 更高）；单跳 81.09 排第 3（FullContext 86.56、OpenAI 84.66 更高）；多跳 68.77 排第 5（Zep 74.11、Memobase 70.92、OpenAI 69.86、FullContext 68.79 均更高）；开放域 46.88 与 Memobase 并列，但远低于 Zep 66.04。四类的名次各不相同，不能把「综合第一」外推成「全面领先」。',
    cls: '' as const,
  },
  {
    node: 3,
    tag: 'Table 2 · 同族消融',
    desc: '换成同族对照再看一次——四行四列。',
    feedback:
      '以扁平记忆为基线：图记忆在单跳（78.83→80.50）和开放域（46.88→48.96）上更好，但时序反而回落（78.50→76.64）；也就是说「连成图」本身并不自动带来时序收益。去掉跨事件结构后落到 66.31、46.88、80.86、79.44——多跳掉 2.46、时序掉 2.18，正好退回扁平记忆的水平，这是跨事件结构在起作用的直接证据。',
    cls: 'good' as const,
  },
  {
    node: 4,
    tag: 'Table 1 · 构建开销',
    desc: '效果之外看构建成本：词元、调用次数、耗时（原表只给这一部分方法披露了数字）。',
    feedback:
      '本文合计 1.937M（输入 1.501M + 输出 0.436M）、1056 次调用、22854 秒。对比之下 Mem0g 合计 35.825M（输入 33.512M + 输出 2.313M）、53514 次调用；LightRAG 合计 11.931M、13576 次调用。论文把这归因于「渐进式结构组织避免了事后昂贵的图构建」。OpenAI / FullContext 不产生构建成本，Zep / Memobase 未披露，因此原表是短横线。',
    cls: 'good' as const,
  },
  {
    node: 5,
    tag: 'Figure 3(c) · 取回条目数',
    desc: '把取回的条目数从 10 加到 100：柱子是构建词元，折线是有效性。',
    feedback:
      '构建词元（柱，左轴）依次是 1.19、1.68、2.17、2.67、3.16、3.65、4.14、4.64、5.13、5.62（百万），近似线性增长——条目越多，构建越贵。同一子图的有效性（折线，右轴 70–76）则是 70.91、73.31、74.29、75.58、75.26、75.78、75.39、75.13、75.32、75.71：在 60 条处达到峰值 75.78，此后在 75.1–75.7 之间徘徊不再上升。论文据此指出，单纯增加原子条目无法提升有效性，瓶颈在「知识推理」而不是「覆盖面」——两条线因此背道而驰：成本继续涨，收益已经到顶。',
    cls: 'bad' as const,
  },
  {
    node: 5,
    tag: 'Figure 3(d) · 种子数 K',
    desc: '换语义种子数 K：0、5、10、15、20。',
    feedback:
      '对应的有效性依次是 75.71、76.43、76.49、76.82、76.23（K = 0/5/10/15/20），五个数值全部可读。论文的做法是拿 K = 0 与扁平检索的水平作比：K = 0 即没有跨事件连接，成绩落在扁平检索的平台上；一旦引入跨事件综合便有实质增益，在 K = 15 达到峰值 76.82——与 Table 1 的综合分一致，而 K = 20 回落到 76.23。也就是说种子数并非越多越好。',
    cls: 'good' as const,
  },
];

export const C5Results: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<number>(0);
  const [step, setStep] = useState(0);

  const cur = STEPS[Math.min(step, STEPS.length - 1)];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const s = STEPS[Math.min(stateRef.current, STEPS.length - 1)];
      clearScene(ctx, W, H, true);
      label(ctx, s.tag, 40, 34, COL.blue, 'left', 20);

      if (s.node === 0) {
        table(
          ctx,
          40,
          56,
          [150, 130, 120],
          [
            [{ t: '问题类型', c: COL.blue }, { t: '题量', c: COL.blue, align: 'right' }, { t: '占比', c: COL.blue, align: 'right' }],
            [{ t: '单跳 Single' }, { t: '841', align: 'right' }, { t: '54.6%', align: 'right' }],
            [{ t: '多跳 Multi' }, { t: '282', align: 'right' }, { t: '18.3%', align: 'right' }],
            [{ t: '时序 Temporal' }, { t: '321', align: 'right' }, { t: '20.8%', align: 'right' }],
            [{ t: '开放域 Open' }, { t: '96', align: 'right' }, { t: '6.2%', align: 'right' }],
            [{ t: '合计', bold: true }, { t: '1540', align: 'right', bold: true }, { t: '100%', align: 'right', bold: true }],
          ],
          26,
          [5],
        );
        const lines = [
          '语料：LoCoMo，10 段长期对话',
          '平均 588 轮 / 每段约 16,618 词元',
          '主干：gpt-4o-mini（所有方法一致）',
          '嵌入：text-embedding-3-small',
          '评测：LLM-as-a-judge 打分',
        ];
        lines.forEach((t, i) => label(ctx, t, 520, 82 + i * 30, COL.ink, 'left', 15));
      }

      if (s.node === 1) {
        const rows: { n: string; v: number }[] = [
          { n: 'StructMem', v: 76.82 },
          { n: 'Memobase', v: 75.78 },
          { n: 'Zep', v: 75.14 },
          { n: 'FullContext', v: 73.83 },
          { n: 'OpenAI', v: 71.82 },
          { n: 'LightRAG', v: 68.83 },
          { n: 'Mem0g', v: 68.44 },
          { n: 'Mem0', v: 66.88 },
          { n: 'A-Mem', v: 64.16 },
          { n: 'MiniRAG', v: 63.51 },
          { n: 'MemoryOS', v: 58.25 },
          { n: 'LangMem', v: 58.10 },
        ];
        rows.forEach((r, i) => {
          const col = i < 6 ? 40 : 560;
          const row = i % 6;
          const y = 72 + row * 29;
          const strong = r.n === 'StructMem';
          hbar(ctx, col, y, 116, 262, 62, r.n, r.v, 80, strong ? COL.green : COL.blue, strong);
        });
        label(ctx, '综合成绩（Overall，越大越好，满分 100）', 40, 246, COL.muted, 'left', 14);
      }

      if (s.node === 2) {
        table(
          ctx,
          40,
          52,
          [200, 170, 170, 240, 140],
          [
            [
              { t: '类型', c: COL.blue },
              { t: 'StructMem', c: COL.blue, align: 'right' },
              { t: '表内最高', c: COL.blue, align: 'right' },
              { t: '该列第一', c: COL.blue },
              { t: '名次', c: COL.blue, align: 'right' },
            ],
            [
              { t: '综合 Overall', bold: true },
              { t: '76.82', align: 'right', c: COL.green, bold: true },
              { t: '76.82', align: 'right', c: COL.green },
              { t: 'StructMem' },
              { t: '第 1', align: 'right', c: COL.green, bold: true },
            ],
            [
              { t: '时序 Temporal' },
              { t: '81.62', align: 'right' },
              { t: '85.05', align: 'right' },
              { t: 'Memobase' },
              { t: '第 2', align: 'right' },
            ],
            [
              { t: '单跳 Single' },
              { t: '81.09', align: 'right' },
              { t: '86.56', align: 'right' },
              { t: 'FullContext' },
              { t: '第 3', align: 'right' },
            ],
            [
              { t: '多跳 Multi' },
              { t: '68.77', align: 'right' },
              { t: '74.11', align: 'right' },
              { t: 'Zep' },
              { t: '第 5', align: 'right' },
            ],
            [
              { t: '开放域 Open' },
              { t: '46.88', align: 'right' },
              { t: '66.04', align: 'right' },
              { t: 'Zep' },
              { t: '靠后', align: 'right', c: COL.red },
            ],
          ],
          28,
          [1],
        );
        label(ctx, '数据源：论文 Table 1「Performance by Type」五列', 40, 244, COL.muted, 'left', 14);
      }

      if (s.node === 3) {
        table(
          ctx,
          60,
          54,
          [260, 160, 160, 160, 160],
          [
            [
              { t: '实验设置', c: COL.blue },
              { t: '多跳', c: COL.blue, align: 'right' },
              { t: '开放域', c: COL.blue, align: 'right' },
              { t: '单跳', c: COL.blue, align: 'right' },
              { t: '时序', c: COL.blue, align: 'right' },
            ],
            [{ t: '扁平记忆 Flat Memory' }, { t: '66.31', align: 'right' }, { t: '46.88', align: 'right' }, { t: '78.83', align: 'right' }, { t: '78.50', align: 'right' }],
            [{ t: '图记忆 Graph Memory' }, { t: '66.67', align: 'right' }, { t: '48.96', align: 'right' }, { t: '80.50', align: 'right' }, { t: '76.64', align: 'right', c: COL.red }],
            [{ t: '去掉跨事件结构' }, { t: '66.31', align: 'right', c: COL.red }, { t: '46.88', align: 'right' }, { t: '80.86', align: 'right' }, { t: '79.44', align: 'right' }],
            [{ t: 'StructMem（完整）', bold: true }, { t: '68.77', align: 'right', bold: true, c: COL.green }, { t: '46.88', align: 'right', bold: true }, { t: '81.09', align: 'right', bold: true, c: COL.green }, { t: '81.62', align: 'right', bold: true, c: COL.green }],
          ],
          29,
          [4],
        );
        label(ctx, '数据源：论文 Table 2「Paradigm comparison and ablation study」', 60, 240, COL.muted, 'left', 14);
      }

      if (s.node === 4) {
        table(
          ctx,
          50,
          40,
          [190, 130, 130, 130, 150, 150],
          [
            [
              { t: '方法', c: COL.blue },
              { t: '输入(M)', c: COL.blue, align: 'right' },
              { t: '输出(M)', c: COL.blue, align: 'right' },
              { t: '合计(M)', c: COL.blue, align: 'right' },
              { t: '调用次数', c: COL.blue, align: 'right' },
              { t: '耗时(s)', c: COL.blue, align: 'right' },
            ],
            [{ t: 'MiniRAG' }, { t: '9.022', align: 'right' }, { t: '1.081', align: 'right' }, { t: '10.103', align: 'right' }, { t: '2,508', align: 'right' }, { t: '2,566', align: 'right' }],
            [{ t: 'LightRAG' }, { t: '10.014', align: 'right' }, { t: '1.916', align: 'right' }, { t: '11.931', align: 'right' }, { t: '13,576', align: 'right' }, { t: '60,469', align: 'right' }],
            [{ t: 'LangMem' }, { t: '9.873', align: 'right' }, { t: '1.192', align: 'right' }, { t: '11.066', align: 'right' }, { t: '5,990', align: 'right' }, { t: '26,281', align: 'right' }],
            [{ t: 'A-Mem' }, { t: '9.126', align: 'right' }, { t: '2.368', align: 'right' }, { t: '11.494', align: 'right' }, { t: '11,754', align: 'right' }, { t: '60,607', align: 'right' }],
            [{ t: 'Mem0' }, { t: '10.958', align: 'right' }, { t: '1.239', align: 'right' }, { t: '12.196', align: 'right' }, { t: '9,181', align: 'right' }, { t: '30,057', align: 'right' }],
            [{ t: 'MemoryOS' }, { t: '1.889', align: 'right' }, { t: '0.939', align: 'right' }, { t: '2.868', align: 'right' }, { t: '5,534', align: 'right' }, { t: '24,220', align: 'right' }],
            [{ t: 'Mem0g' }, { t: '33.512', align: 'right' }, { t: '2.313', align: 'right' }, { t: '35.825', align: 'right', c: COL.red }, { t: '53,514', align: 'right' }, { t: '115,670', align: 'right' }],
            [{ t: 'StructMem', bold: true }, { t: '1.501', align: 'right', bold: true }, { t: '0.436', align: 'right', bold: true }, { t: '1.937', align: 'right', bold: true, c: COL.green }, { t: '1,056', align: 'right', bold: true, c: COL.green }, { t: '22,854', align: 'right', bold: true, c: COL.green }],
          ],
          19,
          [8],
        );
        label(ctx, 'OpenAI / FullContext 无构建成本，Zep / Memobase 未披露 → 原表为“–”，此处不列', 50, 244, COL.muted, 'left', 13);
      }

      if (s.node === 5 && s.tag.indexOf('3(c)') >= 0) {
        // 双轴：柱=构建词元总量（百万，左轴），折线=Performance（右轴）
        const token = [1.19, 1.68, 2.17, 2.67, 3.16, 3.65, 4.14, 4.64, 5.13, 5.62];
        const perf = [70.91, 73.31, 74.29, 75.58, 75.26, 75.78, 75.39, 75.13, 75.32, 75.71];
        const bw = 54;
        const gap = (900 - token.length * bw) / (token.length - 1);
        const maxH = 118;
        const baseline = 212;
        const x0 = 70;
        const cx = (i: number): number => x0 + i * (bw + gap) + bw / 2;

        token.forEach((v, i) => {
          vbar(ctx, x0 + i * (bw + gap), baseline, bw, v, 0, 6, maxH, 'rgba(124, 58, 237, 0.30)', v.toFixed(2), String((i + 1) * 10));
        });

        // Performance 折线，右轴 70–76
        const pTop = 76;
        const pBot = 70;
        const pts = perf.map((v, i) => ({ x: cx(i), y: baseline - ((v - pBot) / (pTop - pBot)) * maxH }));
        drawCurve(ctx, pts, COL.orange, 3);
        pts.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = i === 5 ? COL.red : COL.orange;
          ctx.fill();
        });

        // 60 条峰值标注（折线在此达到最高）
        const peak = pts[5];
        label(ctx, '峰值 75.78', peak.x, peak.y - 14, COL.red, 'center', 14);
        label(ctx, 'Performance ↑ (70–76)', 1020, 60, COL.orange, 'right', 14);
        label(ctx, '构建词元总量（百万）', 70, 60, COL.purple, 'left', 14);
        label(ctx, '横轴：取回条目数 10 → 100（步长 10）', 1020, 34, COL.muted, 'right', 14);
      }

      if (s.node === 5 && s.tag.indexOf('3(d)') >= 0) {
        // 按 x 轴刻度对齐读取：K=0→75.71、5→76.43、10→76.49、15→76.82（峰值）、20→76.23
        const vals = [75.71, 76.43, 76.49, 76.82, 76.23];
        const ks = ['K=0', 'K=5', 'K=10', 'K=15', 'K=20'];
        const bw = 96;
        const gap = (860 - vals.length * bw) / (vals.length - 1);
        vals.forEach((v, i) => {
          // 峰值 K=15 用绿色，回落点 K=20 用红色
          const c = i === 3 ? COL.green : i === 4 ? COL.red : COL.blue;
          vbar(ctx, 110 + i * (bw + gap), 218, bw, v, 75, 77, 140, c, v.toFixed(2), ks[i]);
        });
        label(ctx, '有效性（Overall，纵轴自 75 起）↑', 110, 60, COL.muted, 'left', 14);
        label(ctx, '横轴：语义种子数 K = 0 / 5 / 10 / 15 / 20', 1020, 34, COL.muted, 'right', 14);
        label(ctx, '峰值', 110 + 3 * (bw + gap) + bw / 2, 62, COL.green, 'center', 14);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (n: number): void => {
    const c = Math.max(0, Math.min(STEPS.length - 1, n));
    stateRef.current = c;
    setStep(c);
  };

  return (
    <div>
      <div className="chip-row">
        {NODES.map((n, i) => (
          <span key={n} className={`chip${i === cur.node ? ' selected' : ''}`}>
            {n}
          </span>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="step-label">
          第 {step + 1} 步 / 共 {STEPS.length} 步
        </span>
        <button
          type="button"
          className="tiny"
          disabled={step === STEPS.length - 1}
          onClick={() => go(step + 1)}
        >
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
      </div>
      <div className="step-desc" aria-live="polite">
        {cur.desc}
      </div>
      <div className={`feedback ${cur.cls}`}>{cur.feedback}</div>
    </div>
  );
};

export default C5Results;
