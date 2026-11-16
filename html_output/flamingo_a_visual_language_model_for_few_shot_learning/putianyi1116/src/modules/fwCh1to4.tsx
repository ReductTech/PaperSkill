import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useWidgetCanvas, C, box, label } from './fwKit';

const W = 1080;
const H = 300;

/* ---------------- 1.1 适配谱系坐标 ---------------- */

const SPECTRUM = [
  {
    k: '对比模型',
    point: { x: 0.14, y: 0.16 },
    label: '数据少 · 不能生成',
    note: '只输出文图相似度分数，无法生成语言，只能处理事先给定有限结果集的分类（L252–L258）。',
    cls: 'bad' as const,
  },
  {
    k: '视觉条件生成',
    point: { x: 0.55, y: 0.42 },
    label: '数据中 · 能生成',
    note: '能够生成语言，但低数据情形下的性能尚未达到可用水平（L257–L258）。',
    cls: 'bad' as const,
  },
  {
    k: '微调',
    point: { x: 0.88, y: 0.86 },
    label: '数据多 · 能生成',
    note: '精度最高，但往往需要数千乃至上万个标注，并要逐任务调参与反复训练（L249–L251）。',
    cls: '' as const,
  },
  {
    k: 'Flamingo（目标）',
    point: { x: 0.16, y: 0.86 },
    label: '数据少 · 能生成',
    note: '同一套权重，32 个示例，16 项任务取得少样本新最优，其中 6 项超过微调 SotA（L325–L329）。',
    cls: 'good' as const,
  },
];

export const FwSpectrum: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(3);
  const canvasRef = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const x0 = 110;
    const y0 = 250;
    const pw = 860;
    const ph = 190;
    const t = performance.now() / 1000;

    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, 30);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + pw, y0);
    ctx.stroke();
    label(ctx, '能否生成语言', x0 - 8, 24, 15, C.muted, 'left');
    label(ctx, '↑', x0 - 6, 44, 16, C.muted);
    label(ctx, '数据需求 →', x0 + pw - 110, y0 + 24, 15, C.muted);

    // 目标象限：数据少 + 能生成
    ctx.setLineDash([7, 6]);
    ctx.strokeStyle = C.green;
    box(ctx, x0 + 1, 40, pw * 0.34, ph * 0.42, 'rgba(34,141,92,0.06)', C.green);
    ctx.strokeStyle = C.green;
    ctx.strokeRect(x0 + 1, 40, pw * 0.34, ph * 0.42);
    ctx.setLineDash([]);
    label(ctx, '空白象限', x0 + 14, 62, 14, C.green);

    SPECTRUM.forEach((s, idx) => {
      const px = x0 + s.point.x * pw;
      const py = y0 - s.point.y * ph;
      const on = idx === i;
      if (on) {
        const r = 12 + Math.sin(t * 3) * 4;
        ctx.strokeStyle = s.cls === 'good' ? C.green : s.cls === 'bad' ? C.red : C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = s.cls === 'good' ? C.green : s.cls === 'bad' ? C.red : C.blue;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, s.k, px + 14, py - 8, 15, on ? C.ink : C.muted);
      label(ctx, s.label, px + 14, py + 13, 12, C.muted);
    });
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {SPECTRUM.map((s, idx) => (
          <button key={s.k} className={'chip' + (idx === i ? ' selected' : '')} onClick={() => setI(idx)}>
            {s.k}
          </button>
        ))}
      </div>
      <div className={'feedback ' + SPECTRUM[i].cls}>{SPECTRUM[i].note}</div>
    </div>
  );
};

/* ---------------- 2.1 冻结开关面板 ---------------- */

export const FwFreeze: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [vision, setVision] = useState(false);
  const [bridge, setBridge] = useState(true);
  const [lm, setLm] = useState(false);
  const canvasRef = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    const t = performance.now() / 1000;
    const nodes = [
      { name: '图像/视频', sub: '输入序列', train: false, x: 30, ev: '' },
      { name: '视觉编码器', sub: 'NFNet-F6', train: vision, x: 205, ev: 'L399–L400' },
      { name: 'Resampler', sub: '→ 64 个 token', train: bridge, x: 380, ev: 'L438–L439' },
      { name: '门控交叉注意力', sub: 'GATED XATTN', train: bridge, x: 555, ev: 'L438–L439' },
      { name: '语言模型', sub: 'Chinchilla', train: lm, x: 730, ev: 'L419–L422' },
      { name: '文本输出', sub: '续写答案', train: false, x: 905, ev: '' },
    ];
    const nw = 145;
    const nh = 66;
    const ny = 62;
    const stopX = bridge ? 1010 : 380;

    nodes.forEach((n, idx) => {
      const frozen = idx > 0 && idx < 5 && !n.train;
      const active = idx > 0 && idx < 5;
      box(ctx, n.x, ny, nw, nh, active && n.train ? '#e8f0e2' : '#ffffff', active && n.train ? C.green : active ? C.blue : C.border);
      label(ctx, n.name, n.x + 10, ny + 26, 15, C.ink);
      label(ctx, n.sub, n.x + 10, ny + 46, 12, C.muted);
      if (active) {
        label(ctx, n.train ? '★ 训练' : '❄ 冻结', n.x + 10, ny + 62, 13, n.train ? C.green : C.blue);
        if (n.ev) label(ctx, n.ev, n.x + 74, ny + 62, 10, C.muted);
      }
      if (idx < nodes.length - 1) {
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(n.x + nw, ny + nh / 2);
        ctx.lineTo(n.x + nw + 30, ny + nh / 2);
        ctx.stroke();
      }
    });

    // 数据流：穿越各节点时按状态改变形态
    // 桥冻结 → 堵在 Resampler 前；视觉塔训练 → 特征被改写（紫）；语言塔训练 → 表示被覆盖（红、衰减）
    for (let i = 0; i < 14; i++) {
      const total = 890;
      const p = ((t * 95 + i * (total / 14)) % total) + 40;
      const jammed = p >= stopX;
      const jam = jammed ? (i % 5) * 11 : 0;
      const x = Math.min(p, stopX) - jam;
      let color = C.orange;
      let r = 3.4;
      let alpha = 1;
      if (jammed) {
        color = C.red;
      } else {
        if (vision && x > 350) {
          color = C.purple;
          r = 3.9;
        }
        if (lm && x > 730) {
          color = C.red;
          r = 2.5;
          alpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 3 + i));
        }
      }
      const jitter = vision && x > 350 && !lm ? Math.sin(t * 6 + i) * 2.2 : 0;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, ny + nh / 2 + (jammed ? ((i % 3) - 1) * 7 : 0) + jitter, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 梯度回流：只在训练段下方画箭头
    const grads = [
      { on: vision, x: 205 },
      { on: bridge, x: 380 },
      { on: bridge, x: 555 },
      { on: lm, x: 730 },
    ];
    grads.forEach((g) => {
      if (!g.on) return;
      const y = ny + nh + 26;
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(t * 2));
      ctx.strokeStyle = C.green;
      ctx.globalAlpha = pulse;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(g.x + 100, y);
      ctx.lineTo(g.x + 45, y);
      ctx.lineTo(g.x + 55, y - 6);
      ctx.moveTo(g.x + 45, y);
      ctx.lineTo(g.x + 55, y + 6);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    const legend: { t: string; c: string; w: number }[] = [{ t: '● 数据流', c: C.orange, w: 92 }];
    if (!bridge) legend.push({ t: '● 流动中断', c: C.red, w: 104 });
    if (bridge && vision) legend.push({ t: '● 视觉特征被改写', c: C.purple, w: 160 });
    if (bridge && lm) legend.push({ t: '● 语言表示被覆盖', c: C.red, w: 160 });
    legend.push({ t: '∇ 梯度回流（仅训练段）', c: C.green, w: 200 });
    let lx = 40;
    legend.forEach((g) => {
      label(ctx, g.t, lx, 180, 13, g.c);
      lx += g.w;
    });

    const msg = !bridge
      ? { t: '数据流在 Resampler 处中断：没有可训练参数，模型学不会把视觉接进语言模型', c: C.red, bg: '#fdecee' }
      : lm
      ? { t: '语言模型被更新，预训练能力被新目标覆盖：Overall −8.0 分（L724–L725）', c: C.red, bg: '#fdecee' }
      : vision
      ? { t: '解冻视觉主干属于 §3.2 的微调设定（L678–L680），少样本主设定并不解冻它', c: C.orange, bg: '#fdf0e6' }
      : { t: '两塔冻结、只训桥：梯度只流过 Resampler 与门控层，预训练知识完整保留（L438–L439）', c: C.green, bg: '#e8f0e2' };
    box(ctx, 30, 206, 1020, 58, msg.bg, msg.c);
    label(ctx, msg.t, 48, 242, 17, msg.c);
  });
  const feedback = !bridge
    ? { t: '桥冻结后梯度无处可走，右侧流动随之堵死。', c: 'bad' }
    : lm
    ? { t: '让语言塔一起训练会触发灾难性遗忘，微调预训练语言模型即掉 8.0 分（L724–L725）。', c: 'bad' }
    : vision
    ? { t: '解冻视觉主干只出现在 §3.2 的微调设定里，用于适配更高分辨率（L678–L680）。', c: 'bad' }
    : { t: '两塔冻结、只训桥，是本文的主设定（L273–L276）。', c: 'good' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={'chip' + (vision ? ' selected' : '')} onClick={() => setVision(!vision)}>
          视觉塔 {vision ? '训练' : '冻结'}
        </button>
        <button className={'chip' + (bridge ? ' selected' : '')} onClick={() => setBridge(!bridge)}>
          桥 {bridge ? '训练' : '冻结'}
        </button>
        <button className={'chip' + (lm ? ' selected' : '')} onClick={() => setLm(!lm)}>
          语言塔 {lm ? '训练' : '冻结'}
        </button>
      </div>
      <div className={'feedback ' + feedback.c}>{feedback.t}</div>
    </div>
  );
};

/* ---------------- 2.2 规模滑块 ---------------- */

const SCALES = [
  { name: 'Flamingo-3B', base: 'Chinchilla 1.4B', total: 3.2, freq: '每层', ev: 'L431–L432、表 3 (v)' },
  { name: 'Flamingo-9B', base: 'Chinchilla 7B', total: 9, freq: '每 4 层', ev: 'L432、L714' },
  { name: 'Flamingo-80B', base: 'Chinchilla 70B', total: 80, freq: '每 7 层', ev: 'L432–L436、L714–L715' },
];

export const FwScale: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(2);
  const s = SCALES[i];
  const canvasRef = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    label(ctx, s.name + '　基础语言模型：' + s.base, 40, 52, 22, C.blue);
    const maxW = 700;
    const totalW = (s.total / 80) * maxW;
    const trainW = Math.max(10, totalW * 0.04);
    box(ctx, 40, 96, totalW, 34, '#dfe7d8');
    label(ctx, '总参数 ' + s.total + 'B（含冻结两塔）', 40, 156, 17, C.muted);
    box(ctx, 40, 186, trainW, 34, C.green);
    label(ctx, '可训练：桥（占比很小）', 40 + trainW + 14, 210, 17, C.green);
    label(ctx, '门控层插入频率：' + s.freq, 40, 268, 18, C.ink);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {SCALES.map((x, idx) => (
          <button key={x.name} className={'chip' + (idx === i ? ' selected' : '')} onClick={() => setI(idx)}>
            {x.name}
          </button>
        ))}
      </div>
      <div className="feedback">
        名称里的数字是总参数量，可训练部分只占很小一角（{s.ev}）。单说「Flamingo」时指 80B（L436）。
      </div>
    </div>
  );
};

/* ---------------- 3.1 压缩沙盘 ---------------- */

export const FwCompress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [frames, setFrames] = useState(8);
  const [cell, setCell] = useState(16);
  const features = frames * cell * cell;
  const ratio = features / 64;
  const canvasRef = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    label(ctx, '视觉编码器输出：' + frames + ' 帧 × ' + cell * cell + ' 格 = ' + features + ' 个特征', 40, 56, 21, C.blue);
    const len = Math.min(880, 60 + Math.sqrt(features) * 4);
    box(ctx, 40, 92, len, 26, C.light);
    const t = performance.now() / 1000;
    for (let i = 0; i < 18; i++) {
      const x = 44 + ((t * 120 + i * (len / 18)) % len);
      ctx.fillStyle = i % 3 === 0 ? C.route : C.dark;
      ctx.beginPath();
      ctx.arc(x, 105, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    label(ctx, '可变长特征序列（流速示意）', 40, 142, 16, C.muted);
    box(ctx, 40, 176, 120, 26, C.green);
    label(ctx, 'Perceiver Resampler → 恒为 64 个视觉 token', 176, 196, 17, C.ink);
    label(ctx, '键值长度缩短 ' + ratio.toFixed(1) + ' 倍，交叉注意力矩阵随之缩小同等倍数', 40, 258, 18, C.orange);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          帧数 <span className="val">{frames}</span>
        </label>
        <input type="range" min={1} max={32} value={frames} onChange={(e) => setFrames(Number(e.target.value))} />
        {[8, 16, 32].map((c) => (
          <button key={c} className={'chip' + (c === cell ? ' selected' : '')} onClick={() => setCell(c)}>
            网格 {c}×{c}
          </button>
        ))}
      </div>
      <div className="feedback">
        视觉特征数随帧数与分辨率增长，出口恒为 64（L409–L410）。这里的倍数是按注意力矩阵长度平方做的估算，不是论文实测值。
      </div>
    </div>
  );
};

/* ---------------- 3.2 三种压缩器对比 ---------------- */

const COMPRESSORS = [
  { k: 'Perceiver Resampler', overall: 70.7, time: 1.74, ok: true },
  { k: '朴素 Transformer', overall: 66.7, time: 1.81, ok: false },
  { k: 'MLP', overall: 66.6, time: 1.85, ok: false },
];

export const FwCompressors: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(0);
  const canvasRef = useWidgetCanvas(W, H, (ctx) => {
    box(ctx, 0, 0, W, H, C.field);
    COMPRESSORS.forEach((c, idx) => {
      const y = 50 + idx * 74;
      const on = idx === i;
      const w = ((c.overall - 60) / 15) * 720;
      label(ctx, c.k, 40, y + 22, 19, on ? C.blue : C.ink);
      box(ctx, 300, y, Math.max(20, w), 30, on ? (c.ok ? C.green : C.orange) : C.border);
      label(ctx, 'Overall ' + c.overall.toFixed(1) + '｜步时 ' + c.time.toFixed(2) + 's', 300 + Math.max(20, w) + 14, y + 21, 16, C.muted);
    });
    label(ctx, '同参数预算下（3.2B）对比；基准行为 Resampler（L636、L716–L717）', 40, 278, 15, C.muted);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {COMPRESSORS.map((c, idx) => (
          <button key={c.k} className={'chip' + (idx === i ? ' selected' : '')} onClick={() => setI(idx)}>
            {c.k}
          </button>
        ))}
      </div>
      <div className="feedback">
        {COMPRESSORS[i].ok
          ? 'Resampler 最好，也最快（L717）。'
          : '这个替代方案既更差、也更慢——「压长度」不是它胜出的唯一原因（L716–L717）。'}
      </div>
    </div>
  );
};

/* ---------------- 4.1 α 旋钮 ---------------- */

const GW = 1080;
const GH = 330;

export const FwGate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [a1, setA1] = useState(0);
  const [a2, setA2] = useState(0);
  const t1 = Math.tanh(a1);
  const t2 = Math.tanh(a2);
  const canvasRef = useWidgetCanvas(GW, GH, (ctx) => {
    box(ctx, 0, 0, GW, GH, C.field);

    /* 左：残差相加 */
    box(ctx, 20, 14, 500, 300, '#ffffff', C.border);
    label(ctx, '残差相加', 36, 42, 15, C.muted);
    const bx = 40;
    const bw = 150;
    const by = 66;
    const bh = 32;
    const w1 = t1 * 115;
    const w2 = t2 * 115;
    box(ctx, bx, by, bw, bh, C.blue, C.blue);
    label(ctx, 'y', bx + 12, by + 22, 15, '#ffffff');
    if (w1 > 1) {
      box(ctx, bx + bw, by, w1, bh, C.green, C.green);
    }
    if (w2 > 1) {
      box(ctx, bx + bw + Math.max(w1, 0), by, w2, bh, C.orange, C.orange);
    }
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.muted;
    ctx.beginPath();
    ctx.moveTo(bx + bw, by + bh + 6);
    ctx.lineTo(bx + bw, by + bh + 16);
    ctx.moveTo(bx, by + bh + 6);
    ctx.lineTo(bx, by + bh + 16);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '原始表示宽度', bx, by + bh + 34, 12, C.muted);

    const pct = (w1 + w2) / bw;
    label(ctx, '新增项 = tanh(α₁)·attn + tanh(α₂)·ffw', 40, 176, 13, C.ink);
    label(ctx, 'tanh(α₁) = ' + t1.toFixed(3), 40, 206, 14, C.green);
    label(ctx, 'tanh(α₂) = ' + t2.toFixed(3), 240, 206, 14, C.orange);
    label(ctx, '新增量占原始表示的 ' + (pct * 100).toFixed(1) + '%', 40, 240, 14, pct === 0 ? C.green : C.ink);
    label(ctx, pct === 0 ? 'α 全为 0：新层贡献为零，与原始语言模型等价' : '两项各自被 tanh 压回 −1 至 1', 40, 266, 13, pct === 0 ? C.green : C.muted);

    /* 右：tanh 与线性对照 */
    box(ctx, 540, 14, 520, 300, '#ffffff', C.border);
    const x0 = 590;
    const y0 = 268;
    const pw = 430;
    const ph = 196;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    [0, 0.5, 1, 1.5, 2].forEach((v) => {
      const x = x0 + (v / 2) * pw;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 - ph);
      ctx.stroke();
      label(ctx, String(v), x - 6, y0 + 18, 11, C.muted);
    });
    [0, 0.5, 1].forEach((v) => {
      const y = y0 - v * ph;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + pw, y);
      ctx.stroke();
      label(ctx, String(v), x0 - 26, y + 4, 11, C.muted);
    });
    label(ctx, 'α', x0 + pw - 4, y0 + 18, 12, C.muted);
    label(ctx, '门控值', x0 - 40, y0 - ph - 6, 12, C.muted);

    // 饱和区
    ctx.fillStyle = 'rgba(240,126,71,0.10)';
    ctx.fillRect(x0 + (1.5 / 2) * pw, y0 - ph, (0.5 / 2) * pw, ph);
    label(ctx, '饱和区', x0 + (1.5 / 2) * pw + 8, y0 - ph + 16, 11, C.orange);

    // 线性对照
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (Math.min(1, 2) / 2) * pw, y0 - Math.min(1, 1) * ph);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '线性 α（出界）', x0 + 118, y0 - ph + 34, 11, C.muted);

    // tanh 曲线
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k <= 100; k++) {
      const av = (k / 100) * 2;
      const px = x0 + (av / 2) * pw;
      const py = y0 - Math.tanh(av) * ph;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const mark = (av: number, gv: number, color: string, txt: string) => {
      const px = x0 + (av / 2) * pw;
      const py = y0 - gv * ph;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, y0);
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, txt, px + 10, py - 10, 12, color);
    };
    mark(a1, t1, C.green, 'α₁');
    mark(a2, t2, C.orange, 'α₂');
  });
  const pct = ((t1 + t2) * 115) / 150;
  const fb =
    t1 === 0 && t2 === 0
      ? { t: 'α₁ 与 α₂ 皆为 0，两项贡献为 0，模型与原语言模型逐层等价（L423–L427）。', c: 'good' }
      : { t: '两条门控相互独立，新增项合计占原始表示的 ' + (pct * 100).toFixed(1) + '%，全程被 tanh 限制在 −1 至 1（伪代码 L373–L375）。', c: '' };
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={GW} height={GH} />
      <div className="ctrl">
        <label>
          α₁ 交叉注意力 <span className="val">{a1.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={200} value={Math.round(a1 * 100)} onChange={(e) => setA1(Number(e.target.value) / 100)} />
        <label>
          α₂ 稠密前馈 <span className="val">{a2.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={200} value={Math.round(a2 * 100)} onChange={(e) => setA2(Number(e.target.value) / 100)} />
      </div>
      <div className={'feedback ' + fb.c}>{fb.t}</div>
    </div>
  );
};

/* ---------------- 4.2 插入频率权衡 ---------------- */

const FW = 1080;
const FH = 340;

const FREQ = [
  { k: '每层（基准）', overall: 70.7, time: 1.74, note: '效果最好，参数与时耗最高（表 3 第 (v) 行）。' },
  { k: '每 2 层', overall: 68.2, time: 1.24, note: 'Overall 68.2、步时 1.24s（表 3 第 (v) 行）。' },
  { k: '每 4 层', overall: 68.8, time: 1.02, note: '9B 采用的档位，训练时耗最低（L712–L715、表 3 第 (v) 行）。' },
  { k: '每 7 层', overall: null, time: null, note: '80B 采用的档位（L714–L715），表 3 未列其数值。' },
];

export const FwFrequency: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [i, setI] = useState(2);
  const f = FREQ[i];
  const canvasRef = useWidgetCanvas(FW, FH, (ctx) => {
    box(ctx, 0, 0, FW, FH, C.field);
    const base = 70.7;
    const baseT = 1.74;
    const rowY = (idx: number) => 62 + idx * 56;

    box(ctx, 20, 16, 512, 264, '#ffffff', C.border);
    box(ctx, 548, 16, 512, 264, '#ffffff', C.border);
    label(ctx, 'Overall 分数（分）', 36, 40, 14, C.muted);
    label(ctx, '单步时间（秒）', 564, 40, 14, C.muted);

    const bx0 = 150;
    const bw = 300;
    const bxBase = bx0 + ((base - 66) / 6) * bw;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = C.muted;
    ctx.beginPath();
    ctx.moveTo(bxBase, 52);
    ctx.lineTo(bxBase, 272);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, '基准 70.7', bxBase - 30, 286, 11, C.muted);

    FREQ.forEach((r, idx) => {
      const y = rowY(idx);
      const on = idx === i;
      if (on) {
        box(ctx, 28, y - 22, 496, 46, '#eef4e8', '#eef4e8');
        box(ctx, 556, y - 22, 496, 46, '#eef4e8', '#eef4e8');
      }
      label(ctx, r.k, 36, y + 4, 15, on ? C.ink : C.muted);

      if (r.overall !== null) {
        const w = Math.max(8, ((r.overall - 66) / 6) * bw);
        box(ctx, bx0, y - 14, w, 26, on ? C.blue : '#cfd8e6', on ? C.blue : C.border);
        label(ctx, r.overall.toFixed(1), bx0 + w + 10, y + 4, 14, on ? C.ink : C.muted);
        const d = r.overall - base;
        if (idx > 0) {
          label(ctx, (d > 0 ? '+' : '') + d.toFixed(1) + ' 分', bx0 + bw + 46, y + 4, 13, d < 0 ? C.red : C.green);
        }
      } else {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = C.border;
        ctx.strokeRect(bx0, y - 14, 120, 26);
        ctx.setLineDash([]);
        label(ctx, '表 3 未列', bx0 + 132, y + 4, 13, C.muted);
      }

      if (r.time !== null) {
        const tw = Math.max(8, (r.time / 2.0) * 300);
        box(ctx, 564, y - 14, tw, 26, on ? C.orange : '#e8dcd2', on ? C.orange : C.border);
        label(ctx, r.time.toFixed(2) + 's', 564 + tw + 10, y + 4, 14, on ? C.ink : C.muted);
        if (idx > 0) {
          const cut = ((baseT - r.time) / baseT) * 100;
          label(ctx, '−' + cut.toFixed(0) + '%', 564 + 300 + 46, y + 4, 13, C.green);
        }
      }
    });

    const msg = f.overall === null
      ? '该档出自 80B 的配置说明，表 3 的消融未覆盖，故无分数与步时可比。'
      : '相对基准：Overall ' + (f.overall - base).toFixed(1) + ' 分，单步时间 ' + ((baseT - f.time!) / baseT * 100).toFixed(0) + '% 更短。';
    box(ctx, 20, 288, 1040, 40, '#fbf7ef', C.border);
    label(ctx, msg, 36, 314, 14, C.ink);
  });
  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={FW} height={FH} />
      <div className="ctrl">
        {FREQ.map((r, idx) => (
          <button key={r.k} className={'chip' + (idx === i ? ' selected' : '')} onClick={() => setI(idx)}>
            {r.k}
          </button>
        ))}
      </div>
      <div className="feedback">{f.note}</div>
    </div>
  );
};
