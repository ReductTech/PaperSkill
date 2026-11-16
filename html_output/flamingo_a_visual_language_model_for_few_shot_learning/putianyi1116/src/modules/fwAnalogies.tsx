import React from 'react';
import type { WidgetProps } from './registry';
import { useWidgetCanvas, C, box, label } from './fwKit';

// Analogy cards render at 560x140 (see components/AnalogyCard.tsx).
const W = 560;
const H = 140;

const now = () => performance.now() / 1000;

/* 1 三种修车方式 → 标注需求与生成能力的两个维度 */
export const AnaSpectrum: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const cursor = 70 + (0.5 + 0.5 * Math.sin(t * 0.9)) * 420;
    const lanes = [
      { x: 60, k: '微调', need: 130, gen: true },
      { x: 230, k: '对比模型', need: 8, gen: false },
      { x: 400, k: '视觉生成', need: 40, gen: true },
    ];
    lanes.forEach((l) => {
      box(ctx, l.x, 40, 120, 44, '#ffffff', C.border);
      label(ctx, l.k, l.x + 60, 68, 15, C.ink, 'center');
      box(ctx, l.x, 94, l.need, 8, l.need > 100 ? C.red : C.light);
      label(ctx, l.gen ? '能生成' : '不能生成', l.x + 60, 122, 13, l.gen ? C.green : C.red, 'center');
    });
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.moveTo(cursor, 26);
    ctx.lineTo(cursor - 7, 14);
    ctx.lineTo(cursor + 7, 14);
    ctx.closePath();
    ctx.fill();
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 2 两位老师与一位翻译 → 冻结双塔 + 可训练桥 */
export const AnaFreeze: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.2);
    const blocks = [
      { x: 50, k: '视觉塔', frozen: true },
      { x: 230, k: '桥', frozen: false },
      { x: 410, k: '语言塔', frozen: true },
    ];
    blocks.forEach((b) => {
      const fill = b.frozen ? '#eef3ea' : `rgba(34,141,92,${pulse.toFixed(2)})`;
      box(ctx, b.x, 44, 110, 56, fill, b.frozen ? C.blue : C.green);
      label(ctx, b.k, b.x + 55, 78, 16, b.frozen ? C.blue : '#ffffff', 'center');
      label(ctx, b.frozen ? '❄ 冻结' : '★ 训练', b.x + 55, 118, 13, b.frozen ? C.muted : C.green, 'center');
    });
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    const x = 120 + ((t * 60) % 300);
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x + 16, 20);
    ctx.stroke();
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 3 清单摘要进格子 → 可变长输入压缩为 64 个 token */
export const AnaCompress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    for (let i = 0; i < 26; i++) {
      const x = ((t * 90 + i * 22) % 300) + 20;
      const y = 30 + (i % 5) * 18;
      ctx.fillStyle = C.light;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = C.route;
    ctx.beginPath();
    ctx.moveTo(330, 20);
    ctx.lineTo(390, 70);
    ctx.lineTo(330, 120);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 64; i++) {
      const gx = 410 + (i % 8) * 17;
      const gy = 26 + Math.floor(i / 8) * 15;
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(gx, gy, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    label(ctx, '可变长', 40, 132, 12, C.muted);
    label(ctx, '64 个', 470, 132, 12, C.green, 'center');
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 4 新音响先拧到 0 → tanh 门控自 0 起 */
export const AnaGate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const cycle = (t * 0.35) % 1;
    const a = cycle < 0.6 ? cycle / 0.6 : 1;
    const g = Math.tanh(a * 1.6);
    const cx = 120;
    const cy = 74;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * a);
    ctx.stroke();
    const ang = Math.PI * 0.75 + Math.PI * 1.5 * a;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * 30, cy + Math.sin(ang) * 30);
    ctx.stroke();
    const bw = 60 + g * 300;
    box(ctx, 220, 56, bw, 34, g < 0.02 ? '#eef3ea' : C.green, g < 0.02 ? C.border : C.green);
    label(ctx, 'tanh(α) = ' + g.toFixed(2), 220, 122, 14, C.muted);
    label(ctx, g < 0.02 ? 'α≈0：新层等于不存在' : '训练把 α 拧上去', 300, 34, 14, g < 0.02 ? C.green : C.ink);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 5 给新同事看两张样例 → 提示即适配 */
export const AnaPrompt: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const phase = Math.floor((t * 0.6) % 3);
    const cards = ['示例 1', '示例 2', '查询'];
    cards.forEach((k, i) => {
      const targetX = 40 + i * 130;
      const drop = i <= phase ? 0 : -60;
      box(ctx, targetX, 50 + drop, 110, 46, i === 2 && phase >= 2 ? '#e8f0e2' : '#ffffff', i === 2 && phase >= 2 ? C.green : C.border);
      label(ctx, k, targetX + 55, 78 + drop, 15, C.ink, 'center');
    });
    if (phase >= 2) label(ctx, '→ 续写答案', 440, 78, 15, C.green);
    label(ctx, '权重不动，只拼提示', 40, 126, 13, C.muted);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 6 接力只交给下一棒 → 逐图像掩码 */
export const AnaMask: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const active = Math.floor((t * 1.2) % 4);
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 128;
      box(ctx, x, 34, 100, 40, i === active ? '#e8f0e2' : '#ffffff', i === active ? C.green : C.border);
      label(ctx, '图 ' + (i + 1), x + 50, 60, 14, C.ink, 'center');
      box(ctx, x, 86, 100, 26, i === active ? '#e8f0e2' : '#ffffff', i === active ? C.green : C.border);
      label(ctx, '文本 ' + String.fromCharCode(65 + i), x + 50, 104, 12, C.muted, 'center');
      ctx.strokeStyle = i === active ? C.green : C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 50, 74);
      ctx.lineTo(x + 50, 86);
      ctx.stroke();
    }
    label(ctx, '每次只直连最近一张图', 40, 130, 12, C.muted);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 7 杂志版式翻成朗读稿 → M3W 序列 */
export const AnaWebpage: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    box(ctx, 30, 20, 150, 96, '#ffffff', C.border);
    label(ctx, '段落 P1', 46, 44, 12, C.muted);
    box(ctx, 46, 50, 40, 24, C.light, C.border);
    box(ctx, 96, 50, 70, 24, C.light, C.border);
    label(ctx, '两张图', 46, 96, 12, C.muted);
    const seq = ['P1', '<EOC>', '<image>', 'P2', '<EOC>', '<image>', 'P3'];
    seq.forEach((s, i) => {
      const x = 200 + i * 50;
      const appear = t * 0.8 > i ? 1 : 0;
      box(ctx, x, 60, 44, 30, s.startsWith('<') ? '#fdeee3' : '#ffffff', s.startsWith('<') ? C.orange : C.border);
      label(ctx, appear ? s : '·', x + 22, 80, 11, appear ? C.ink : C.border, 'center');
    });
    label(ctx, '标签定位置：EOC 在图前', 200, 116, 12, C.muted);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 8 三种乐器合练 → 加权损失 */
export const AnaLoss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const level = 34 + 60 * (0.5 + 0.5 * Math.sin(t * 0.8));
    ['交错 M3W', '图文对', '视频对'].forEach((k, i) => {
      const x = 60 + i * 90;
      label(ctx, k, x, 26, 12, C.muted, 'center');
      const flow = ((t * 70 + i * 20) % 40) / 40;
      ctx.fillStyle = C.blue;
      ctx.globalAlpha = 0.25 + flow * 0.55;
      ctx.fillRect(x - 6, 34, 12, 26 + flow * 14);
      ctx.globalAlpha = 1;
    });
    box(ctx, 360, 30, 120, 96, '#ffffff', C.border);
    ctx.fillStyle = C.green;
    ctx.fillRect(362, 124 - level, 116, level);
    label(ctx, 'λ 加权求和', 420, 22, 12, C.green, 'center');
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 9 高 17 厘米还是高 24% → 分差口径 */
export const AnaDelta: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    const k = 0.5 + 0.5 * Math.sin(t * 0.9);
    const h1 = 104;
    const h2 = 60 + k * 26;
    box(ctx, 90, 124 - h1, 46, h1, C.light, C.border);
    box(ctx, 190, 124 - h2, 46, h2, C.orange, C.orange);
    label(ctx, '基线 70.7', 113, 138, 11, C.muted, 'center');
    label(ctx, '本行', 213, 138, 11, C.muted, 'center');
    const d = (h1 - h2) / 1.6;
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(250, 124 - h1);
    ctx.lineTo(262, 124 - h1);
    ctx.lineTo(262, 124 - h2);
    ctx.lineTo(250, 124 - h2);
    ctx.stroke();
    label(ctx, d.toFixed(1) + ' 分', 272, (124 - h1 + 124 - h2) / 2 + 5, 15, C.red);
    label(ctx, '分差口径，不是相对百分比', 360, 132, 12, C.muted);
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

/* 10 会即兴的乐手 → 分工而非替代 */
export const AnaMatch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = now();
    box(ctx, 40, 40, 180, 70, '#ffffff', C.blue);
    label(ctx, '对比模型', 130, 70, 15, C.blue, 'center');
    label(ctx, '检索 / 分类', 130, 94, 12, C.muted, 'center');
    box(ctx, 340, 40, 180, 70, '#e8f0e2', C.green);
    label(ctx, 'Flamingo', 430, 70, 15, C.green, 'center');
    label(ctx, '开放式生成', 430, 94, 12, C.muted, 'center');
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.5 + i / 6) % 1;
      const left = i % 2 === 0;
      const x = left ? 280 - p * 90 : 280 + p * 90;
      ctx.fillStyle = left ? C.blue : C.green;
      ctx.beginPath();
      ctx.arc(x, 75 + (i % 3) * 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    label(ctx, '分工，不是替代', 280, 132, 12, C.muted, 'center');
  });
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};
