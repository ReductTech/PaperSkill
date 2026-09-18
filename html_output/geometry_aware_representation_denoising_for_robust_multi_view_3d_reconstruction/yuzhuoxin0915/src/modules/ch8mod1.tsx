import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 8 章 Module 8.1：交互式架构图（数学/技术视图，P5）
// 设计说明：底部 chip 排与流程图信息重复，已移除；改为"点框看详情"面板。
// 新增注释层：阶段编号、功能副标题、箭头数据标注、GARD 插入位置标签、编码器层数轴。
const W = 1080;
const H = 330;
const FLOW_Y = 150;   // 主流程中线
const BOX_H = 84;     // 框高
const BOX_TOP = FLOW_Y - BOX_H / 2;   // 108
const BOX_BOT = BOX_TOP + BOX_H;      // 192
const RULER_Y = 256;  // 层数轴 y

interface Comp {
  name: string;
  sub: string;        // 框内功能副标题
  x: number;
  w: number;
  color: string;      // 描边/主色
  fill: string;       // 填充色
  dark?: boolean;     // 深色填充（文字用白）
  tag?: string;       // 框上方悬浮标签
  desc: string;       // 点击详情
}

// 架构组件（数据流从左到右）
const COMPONENTS: Comp[] = [
  { name: '输入图像', sub: 'V 视角退化 RGB', x: 30, w: 110, color: '#2e8b6e', fill: '#e6f4ee',
    desc: 'V 张退化多视角图像，尺寸 V×3×H×W，是整个流程的输入。' },
  { name: '编码器 1–17', sub: '提取浅层特征', x: 180, w: 130, color: '#27446e', fill: '#eef2f9',
    desc: '多视角编码器前 17 层，从退化图像中提取早期（浅层）特征。' },
  { name: 'GARD 去噪器', sub: 'DiT+全局注意力', x: 350, w: 150, color: '#d96a33', fill: '#f07e47', dark: true, tag: '插在第 18 层',
    desc: '插在第 18 层，DiT^DH + 全局注意力，在编码中途精修退化特征。' },
  { name: '编码器 19–40', sub: '传播深层特征', x: 540, w: 130, color: '#27446e', fill: '#eef2f9',
    desc: '编码器剩余层（19–40），继续传播恢复后的特征。' },
  { name: '特征层级 M', sub: '4 尺度特征', x: 710, w: 120, color: '#27446e', fill: '#eef2f9',
    desc: '从第 {20, 28, 34, 40} 层取出 4 个多尺度特征，供解码器使用。' },
  { name: '几何/RGB 解码器', sub: '几何 + 图像恢复', x: 870, w: 150, color: '#1f3a5f', fill: '#1f3a5f', dark: true,
    desc: '几何解码器输出三维几何（点云），RGB 解码器输出恢复后的图像。' },
];

// 箭头上方的数据标注（x 为相邻两框间隙中心）
const ARROW_LABELS = [
  { x: 160, text: 'V×3×H×W' },
  { x: 330, text: '浅层特征' },
  { x: 520, text: '去噪后特征' },
  { x: 690, text: '深层特征' },
  { x: 850, text: 'F20/F28/F34/F40' },
];

const NUMS = '①②③④⑤⑥';

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ node: 2 });
  const rafRef = useRef<number | null>(null);
  const [detail, setDetail] = useState({ name: COMPONENTS[2].name, text: COMPONENTS[2].desc });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    // 圆角矩形路径
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const render = (s: { node: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // —— 数据流线 + 箭头 ——
      for (let i = 0; i < COMPONENTS.length - 1; i++) {
        const a = COMPONENTS[i], b = COMPONENTS[i + 1];
        ctx.strokeStyle = '#c3ccd9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(a.x + a.w, FLOW_Y);
        ctx.lineTo(b.x - 8, FLOW_Y);
        ctx.stroke();
        ctx.fillStyle = '#c3ccd9';
        ctx.beginPath();
        ctx.moveTo(b.x, FLOW_Y);
        ctx.lineTo(b.x - 11, FLOW_Y - 6);
        ctx.lineTo(b.x - 11, FLOW_Y + 6);
        ctx.closePath();
        ctx.fill();
      }

      // —— 箭头数据标注 ——
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8a94a6';
      ARROW_LABELS.forEach((l) => ctx.fillText(l.text, l.x, 62));

      // —— GARD 悬浮标签 ——
      const gard = COMPONENTS[2];
      if (gard.tag) {
        const cx = gard.x + gard.w / 2;
        ctx.fillStyle = '#f07e47';
        rr(cx - 54, 76, 108, 22, 11);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillText(gard.tag, cx, 88);
      }

      // —— 组件框 ——
      COMPONENTS.forEach((c, i) => {
        const active = s.node === i;
        ctx.fillStyle = c.fill;
        rr(c.x, BOX_TOP, c.w, BOX_H, 8);
        ctx.fill();
        ctx.strokeStyle = active ? c.color : '#d7deea';
        ctx.lineWidth = active ? 4 : 2;
        ctx.stroke();
        // 阶段编号
        ctx.fillStyle = c.dark ? 'rgba(255,255,255,0.9)' : c.color;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(NUMS[i], c.x + 8, BOX_TOP + 20);
        // 名称
        ctx.fillStyle = c.dark ? '#ffffff' : '#21324a';
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(c.name, c.x + c.w / 2, BOX_TOP + 40);
        // 功能副标题
        ctx.fillStyle = c.dark ? 'rgba(255,255,255,0.82)' : '#66738a';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(c.sub, c.x + c.w / 2, BOX_TOP + 62);
      });

      // —— 编码器层数轴（框 → 轴的虚线对应） ——
      const seg = [
        { x1: 180, x2: 310, c: '#a9bad6', label: '第 1–17 层', cx: 245, link: '#c3ccd9' },
        { x1: 350, x2: 500, c: '#f07e47', label: '第 18 层 · 插入 GARD', cx: 425, link: '#f0b28f' },
        { x1: 540, x2: 670, c: '#a9bad6', label: '第 19–40 层', cx: 605, link: '#c3ccd9' },
      ];
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      seg.forEach((sg) => {
        ctx.strokeStyle = sg.link;
        ctx.beginPath();
        ctx.moveTo(sg.cx, BOX_BOT + 4);
        ctx.lineTo(sg.cx, RULER_Y - 4);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // 轴条：三段着色，间隙用浅灰连接
      ctx.fillStyle = '#dde3ec';
      ctx.fillRect(180, RULER_Y, 490, 8);
      seg.forEach((sg) => {
        ctx.fillStyle = sg.c;
        ctx.fillRect(sg.x1, RULER_Y, sg.x2 - sg.x1, 8);
      });
      // 轴标签
      ctx.textAlign = 'left';
      ctx.fillStyle = '#8a94a6';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('编码器层数轴', 30, RULER_Y + 8);
      ctx.textAlign = 'center';
      seg.forEach((sg) => {
        ctx.fillStyle = sg.c === '#f07e47' ? '#d96a33' : '#5a6b87';
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText(sg.label, sg.cx, RULER_Y + 26);
      });
      ctx.textAlign = 'left';
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const select = (i: number) => {
    stateRef.current.node = i;
    setDetail({ name: COMPONENTS[i].name, text: COMPONENTS[i].desc });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < COMPONENTS.length; i++) {
      const c = COMPONENTS[i];
      if (x >= c.x && x <= c.x + c.w && y >= BOX_TOP && y <= BOX_BOT) {
        select(i);
        return;
      }
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div style={{ fontSize: 12, color: '#8a94a6', margin: '6px 0 2px' }}>
        点击流程图中的任意组件，下方显示该阶段的详细说明。
      </div>
      <div className="feedback good">
        <strong>{detail.name}</strong>：{detail.text}
      </div>
    </div>
  );
};

export default Ch8Mod1;
