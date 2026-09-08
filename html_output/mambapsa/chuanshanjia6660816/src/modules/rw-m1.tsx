import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const chars = text.split('');
  const lines: string[] = [];
  let line = '';
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const W = 560, H = 250;

type Route = 'conv' | 'attn' | 'mamba' | 'ours';
interface RouteMeta {
  label: string;
  color: string;
  idea: string;
  methods: string[];
  pos: string;
  bars: { cost: number; ctx: number; param: number }; // 0..1，越大越高
  text: string;
  cls: string;
}
const ROUTES: Record<Route, RouteMeta> = {
  conv: {
    label: '轻量卷积',
    color: C.blue,
    idea: '用「更便宜的卷积」替代普通卷积，把 FLOPs 与参数压下来',
    methods: ['深度可分离卷积 · MobileNet', '分组卷积 · ShuffleNet', '重参数化 · RepVGG', '廉价卷积 · GhostNet'],
    pos: '通用主干各层（不动结构，只换算子）',
    bars: { cost: 0.18, ctx: 0.2, param: 0.12 },
    text: '轻量卷积：MobileNet 用深度可分离卷积、ShuffleNet 用分组卷积、RepVGG 用重参数化、GhostNet 用廉价卷积，把普通卷积的 FLOPs 与参数大幅压低。代价是感受野仍是局部的——拿不到全局上下文，而全局聚合恰恰是主干末尾需要的。',
    cls: 'good',
  },
  attn: {
    label: '注意力混合',
    color: C.red,
    idea: '把少量自注意力塞进检测器主干做全局聚合，精度更高',
    methods: ['PSA 位置敏感自注意力', 'C2PSA（YOLO11 / YOLO26）', '主干末尾全局聚合'],
    pos: '主干末尾 C2PSA（a 分支自注意力）',
    bars: { cost: 0.95, ctx: 1, param: 0.5 },
    text: '注意力混合：在主干末尾加位置敏感自注意力（PSA→C2PSA）做全局聚合，比单纯加深主干精度更高。但自注意力要打 N×N 个分数，计算量随 token 数平方增长（O(N²)）——轻量边缘设备带不动，这正是本论文要解决的问题。',
    cls: '',
  },
  mamba: {
    label: '状态空间模型',
    color: C.purple,
    idea: '用线性时间的选择性扫描读长序列，全局上下文一步到位',
    methods: ['S4 · 结构化 SSM', 'Mamba · 选择性扫描', 'Vision Mamba · 双向/四向'],
    pos: '视觉主干 / 序列建模（尚未高效接入检测主干末尾）',
    bars: { cost: 0.5, ctx: 1, param: 0.5 },
    text: '状态空间模型：S4 打底，Mamba 引入选择性扫描，线性时间建模长序列；Vision Mamba 与 VMamba 用双向/四向扫描把它带到图像。代价是视觉里要补扫描方向，且还没有一套高效接进检测器主干末尾、替换 C2PSA 的成熟方案。',
    cls: 'good',
  },
  ours: {
    label: '本文·MambaPSA',
    color: C.orange,
    idea: '保留 CSP 外壳，把 C2PSA 里 a 分支的自注意力换成 Mamba',
    methods: ['CSP 外壳保留（拆 a、b）', 'a 分支 → 单向 Mamba', 'b 分支恒等'],
    pos: 'YOLO26 主干末尾 C2PSA——此前无人替换',
    bars: { cost: 0.2, ctx: 1, param: 0.15 },
    text: '本文：保留 C2PSA 的 CSP 外壳，把 a 分支的自注意力换成单向 Mamba 核心（d_state=8、expansion=1）。整网参数 −2.9%、FLOPs −12.1%、CPU FPS +17.6%，mAP 几乎不变（−0.1）——第一次在 NMS-free 的 YOLO26 上动 C2PSA。',
    cls: '',
  },
};
const ORDER: Route[] = ['conv', 'attn', 'mamba', 'ours'];

export const RwM1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ r: Route }>({ r: 'ours' });
  const rafRef = useRef<number | null>(null);
  const [route, setRoute] = useState<Route>('ours');
  const [feedback, setFeedback] = useState(ROUTES.ours);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { r: Route }) => {
      clearScene(ctx, W, H);
      const m = ROUTES[s.r];
      const color = m.color;
      // 标题 + 核心思路
      ctx.fillStyle = color; ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(m.label, 18, 26);
      ctx.fillStyle = C.ink; ctx.font = '13px "Segoe UI", sans-serif';
      const ideaLines = wrapLines(ctx, m.idea, 524);
      ideaLines.forEach((ln, i) => ctx.fillText(ln, 18, 46 + i * 18));
      const ideaBottom = 46 + ideaLines.length * 18;
      // 左：代表性方法（长文本自动换行，避免超出框）
      const methodLines: string[] = [];
      m.methods.forEach((t) => methodLines.push(...wrapLines(ctx, '· ' + t, 200)));
      const L = methodLines.length;
      const my = Math.max(ideaBottom + 12, 92);
      ctx.fillStyle = '#ffffff'; rr(ctx, 18, my, 220, Math.max(118, 12 + 18 + L * 18 + 12), 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('代表性方法', 32, my + 18);
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      methodLines.forEach((ln, i) => ctx.fillText(ln, 32, my + 40 + i * 18));
      // 右：三条量级条
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('量级示意', 254, 88);
      const metrics: Array<{ key: keyof RouteMeta['bars']; label: string; mc: string }> = [
        { key: 'cost', label: '计算开销', mc: C.orange },
        { key: 'ctx', label: '全局上下文', mc: C.blue },
        { key: 'param', label: '参数开销', mc: C.purple },
      ];
      const trackX0 = 350, trackX1 = 546;
      metrics.forEach((met, i) => {
        const y = 114 + i * 34;
        ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(met.label, 254, y + 4);
        ctx.strokeStyle = C.line; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(trackX0, y); ctx.lineTo(trackX1, y); ctx.stroke();
        const v = m.bars[met.key];
        ctx.fillStyle = met.mc;
        rr(ctx, trackX0, y - 5, Math.max(2, (trackX1 - trackX0) * v), 10, 5); ctx.fill();
      });
      // 底部：插入位置
      ctx.fillStyle = color; ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('插在哪：', 18, H - 22);
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(m.pos, 18 + ctx.measureText('插在哪：').width + 4, H - 22);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const setState = (r: Route) => {
    stateRef.current.r = r;
    setRoute(r);
    setFeedback(ROUTES[r]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((r) => (
          <button type="button" key={r} className={`chip ${route === r ? 'selected' : ''}`} onClick={() => setState(r)}>
            {ROUTES[r].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
