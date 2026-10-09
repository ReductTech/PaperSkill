import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox } from './birdKit';

// m8-1 (arch-map) — 交互式整机图：点哪讲哪；支路芯片切换高亮。

const W = 1080;
const H = 280;

const DUTY: Record<string, { text: string; cls: string }> = {
  backbone: { text: '骨干：提取多尺度特征。', cls: '' },
  pan: { text: 'PAN：P3/P4/P5 融合大小目标。', cls: '' },
  reg: { text: '回归头：预测每个锚点的框。', cls: '' },
  seg: { text: '分割头：生成原型掩码与系数（YOLACT 路线）。', cls: '' },
  emb: { text: '嵌入头：输出锚点嵌入 O，通道数=嵌入维度 D。', cls: 'good' },
  reprta: { text: 'RepRTA：文本→增强提示嵌入（推理零开销）。', cls: '' },
  savpe: { text: 'SAVPE：视觉提示→提示嵌入，双支路低维。', cls: '' },
  lrpc: { text: 'LRPC 专用嵌入：先找物体，再查词表命名。', cls: '' },
};
const ROUTE_BRANCH: Record<string, string> = { text: 'reprta', visual: 'savpe', free: 'lrpc' };

export const M8_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'none', route: 'text' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('none');
  const [route, setRoute] = useState('text');
  const [feedback, setFeedback] = useState({ text: '点击整机图的组件查看职责；切换芯片看三条提示支路。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const block = (key: string, x: number, y: number, w: number, h: number, label: string, branchKey?: string) => {
      const s = stateRef.current;
      const cur = s.sel === key;
      const isBranch = branchKey !== undefined;
      const lit = isBranch && ROUTE_BRANCH[s.route] === branchKey;
      const dim = isBranch && !lit;
      ctx.save();
      if (dim) ctx.globalAlpha = 0.38;
      ctx.fillStyle = cur ? '#eef4ff' : lit ? '#eef8f1' : '#fff';
      ctx.strokeStyle = cur ? PALETTE.blue : lit ? PALETTE.green : PALETTE.border;
      ctx.lineWidth = cur || lit ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = cur ? PALETTE.blue : lit ? PALETTE.green : PALETTE.ink;
      ctx.font = (cur ? 'bold ' : '') + '13px sans-serif';
      ctx.textAlign = 'center';
      label.split('\n').forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + h / 2 - 5 + i * 16));
      ctx.textAlign = 'left';
      ctx.restore();
    };
    const arrowTo = (x1: number, y1: number, x2: number, y2: number, strong: boolean, color?: string) => {
      ctx.save();
      ctx.strokeStyle = color || (strong ? PALETTE.blue : PALETTE.muted);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = strong ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 9 * Math.cos(a - 0.42), y2 - 9 * Math.sin(a - 0.42));
      ctx.lineTo(x2 - 9 * Math.cos(a + 0.42), y2 - 9 * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = (t: number) => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 支路（顶部）
      block('reprta', 240, 14, 110, 36, 'RepRTA\n文本', 'reprta');
      block('savpe', 390, 14, 110, 36, 'SAVPE\n视觉', 'savpe');
      block('lrpc', 540, 14, 130, 36, 'LRPC 嵌入\n无提示', 'lrpc');

      // 主链路
      block('img', 24, 150, 56, 44, '图像');
      block('backbone', 110, 144, 84, 56, '骨干');
      block('pan', 224, 144, 92, 56, 'PAN\nP3/P4/P5');
      block('reg', 380, 84, 96, 40, '回归头');
      block('seg', 380, 144, 96, 40, '分割头');
      block('emb', 380, 204, 96, 40, '嵌入头');

      // 对比点
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.green;
      ctx.lineWidth = 2.5 + pulse;
      ctx.beginPath();
      ctx.arc(570, 168, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.green;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('O·Pᵀ', 570, 172);
      ctx.textAlign = 'left';
      ctx.restore();

      block('out', 640, 146, 76, 44, '标签');

      // 主链路箭头
      arrowTo(80, 172, 110, 172, false);
      arrowTo(194, 172, 224, 172, false);
      arrowTo(316, 162, 380, 104, s.sel === 'reg');
      arrowTo(316, 172, 380, 164, s.sel === 'seg');
      arrowTo(316, 182, 380, 224, s.sel === 'emb');
      arrowTo(476, 224, 552, 184, true, PALETTE.green);
      arrowTo(596, 168, 640, 168, false);
      // 支路汇入
      const litKey = ROUTE_BRANCH[s.route];
      arrowTo(295, 50, 552, 152, litKey === 'reprta', litKey === 'reprta' ? PALETTE.green : undefined);
      arrowTo(445, 50, 558, 144, litKey === 'savpe', litKey === 'savpe' ? PALETTE.green : undefined);
      arrowTo(605, 50, 580, 142, litKey === 'lrpc', litKey === 'lrpc' ? PALETTE.green : undefined);

      // 分割头紫色标注
      drawSceneLabel(ctx, '原型+系数', 382, 202, PALETTE.purple);

      // 右侧 inset
      insetBox(ctx, 790, 44, 250, 200);
      if (s.sel === 'none' || !DUTY[s.sel]) {
        drawSceneLabel(ctx, '点击组件查看职责', 814, 110, PALETTE.muted);
        drawSceneLabel(ctx, '（或点下方芯片）', 814, 140, PALETTE.muted);
      } else {
        drawSceneLabel(ctx, '组件职责', 814, 80, PALETTE.muted);
        ctx.save();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = '13px sans-serif';
        const txt = DUTY[s.sel].text;
        let line = '';
        let y = 112;
        for (const ch of txt) {
          line += ch;
          if (ctx.measureText(line).width > 200) {
            ctx.fillText(line, 814, y);
            y += 22;
            line = '';
          }
        }
        if (line) ctx.fillText(line, 814, y);
        ctx.restore();
      }
    };

    const tick = () => {
      render(performance.now() / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onPart = (key: string) => {
    stateRef.current.sel = key;
    setSel(key);
    setFeedback(DUTY[key]);
  };
  const onRoute = (key: string) => {
    stateRef.current.route = key;
    setRoute(key);
    const branch = ROUTE_BRANCH[key];
    stateRef.current.sel = branch;
    setSel(branch);
    setFeedback(DUTY[branch]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={route === 'text' ? 'chip selected' : 'chip'} onClick={() => onRoute('text')}>
          文本支路
        </button>
        <button type="button" className={route === 'visual' ? 'chip selected' : 'chip'} onClick={() => onRoute('visual')}>
          视觉支路
        </button>
        <button type="button" className={route === 'free' ? 'chip selected' : 'chip'} onClick={() => onRoute('free')}>
          无提示支路
        </button>
        <span style={{ width: 12 }} />
        {[
          ['backbone', '骨干'],
          ['pan', 'PAN'],
          ['reg', '回归头'],
          ['seg', '分割头'],
          ['emb', '嵌入头'],
        ].map(([k, name]) => (
          <button key={k} type="button" className={sel === k ? 'chip selected' : 'chip'} onClick={() => onPart(k)}>
            {name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M8_1;
