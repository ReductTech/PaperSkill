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
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.35), y2 - 9 * Math.sin(ang - 0.35));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.35), y2 - 9 * Math.sin(ang + 0.35));
  ctx.closePath(); ctx.fill();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string, lw: number) {
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

const W = 560, H = 240;

const STEPS = [
  {
    key: 'input',
    title: '输入 a 分支的特征',
    desc: 'Bottleneck 的输入是 C3k2 拆分后的一半，尺寸 (C/2)×H×W，通道数保持、空间尺寸不变。',
    box: 0,
    strip: '输入 a：(C/2)×H×W',
  },
  {
    key: 'conv1',
    title: '第一个 3×3 卷积：通道收窄',
    desc: '3×3 卷积在局部窗口内加权求和、提炼特征，把通道从 C/2 收窄到 C/4，计算量随之下降。',
    box: 1,
    strip: '3×3 卷积 · 通道 C/2 → C/4',
  },
  {
    key: 'conv2',
    title: '第二个 3×3 卷积：通道复原',
    desc: '再过一个 3×3 卷积，把通道从 C/4 复原到 C/2，输出与输入通道一致，便于残差相加。',
    box: 2,
    strip: '3×3 卷积 · 通道 C/4 → C/2',
  },
  {
    key: 'res',
    title: '残差捷径：输入直接加回',
    desc: '一条残差捷径把最开始的输入直接加到输出上：信息不丢、梯度好传，深层网络也不易退化。',
    box: 3,
    strip: '输出 = 卷积结果 + 输入（残差 ⊕）',
  },
] as const;

export const Yolo26Bottleneck: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: 'Bottleneck 由两次 3×3 卷积（先收窄、后复原）和一条残差捷径组成。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { step: number }) => {
      clearScene(ctx, W, H);
      const BW = 108, BH = 44, BY = 78, midY = BY + BH / 2;
      const XS = [14, 148, 282];   // 输入、conv1、conv2
      const ADD_X = 414;           // ⊕ 节点中心
      const OUT_X = 452, OUT_W = 96;
      const items = [
        { label: '输入 a', sub: 'C/2×H×W' },
        { label: '3×3 卷积', sub: '收窄 → C/4' },
        { label: '3×3 卷积', sub: '复原 → C/2' },
      ];
      const act = s.step;
      const isAdd = act === 3;
      items.forEach((it, i) => {
        const x = XS[i];
        const conv = i === 1 || i === 2;
        const isAct = i === act;
        box(
          ctx, x, BY, BW, BH,
          isAct ? 'rgba(39,68,110,0.16)' : conv ? 'rgba(39,68,110,0.08)' : '#fff',
          isAct ? C.blue : conv ? C.blue : C.line,
          isAct ? 2.4 : conv ? 1.6 : 1.2
        );
        ctx.fillStyle = isAct ? C.blue : C.ink;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(it.label, x + 12, BY + 19);
        ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(it.sub, x + 12, BY + 35);
      });
      // 输出框
      box(
        ctx, OUT_X, BY, OUT_W, BH,
        isAdd ? 'rgba(34,141,92,0.14)' : '#fff',
        isAdd ? C.green : C.line,
        isAdd ? 2.4 : 1.2
      );
      ctx.fillStyle = isAdd ? C.green : C.ink;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('输出 a', OUT_X + 14, BY + 19);
      ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('C/2×H×W', OUT_X + 14, BY + 35);
      // 主线箭头：输入→conv1、conv1→conv2、conv2→⊕、⊕→输出
      arrow(ctx, XS[0] + BW, midY, XS[1], midY, C.line);
      arrow(ctx, XS[1] + BW, midY, XS[2], midY, C.line);
      arrow(ctx, XS[2] + BW, midY, ADD_X - 11, midY, C.line);
      arrow(ctx, ADD_X + 11, midY, OUT_X, midY, C.line);
      // ⊕ 节点：conv2 与残差在此汇合，再进输出
      ctx.fillStyle = isAdd ? '#fff3ec' : '#ffffff';
      ctx.beginPath(); ctx.arc(ADD_X, midY, 11, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isAdd ? C.red : C.line;
      ctx.lineWidth = isAdd ? 2.4 : 1.5;
      ctx.stroke();
      ctx.fillStyle = isAdd ? C.red : C.ink;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('+', ADD_X, midY + 1);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = isAdd ? C.red : C.muted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('相加', ADD_X, midY + 24);
      ctx.textAlign = 'left';
      // 残差捷径弧线：输入框顶部绕到 ⊕ 节点上方
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = isAdd ? C.red : 'rgba(196,63,82,0.55)';
      ctx.lineWidth = isAdd ? 2.6 : 1.6;
      ctx.beginPath();
      ctx.moveTo(XS[0] + BW / 2, BY - 4);
      ctx.quadraticCurveTo(210, 14, ADD_X, midY - 11);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('残差捷径：输入直接加回', 150, 20);
      // 底部说明条
      ctx.fillStyle = '#ffffff'; rr(ctx, 14, 196, W - 28, 34, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.ink; ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(STEPS[s.step].strip, 28, 218);
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

  const go = (i: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, i));
    stateRef.current.step = s; setStep(s);
    setFeedback(
      s === 3
        ? { text: '残差让信息不丢、梯度好传——这是 Bottleneck 能堆得很深而不退化的关键。', cls: 'good' }
        : { text: STEPS[s].desc, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>上一步</button>
        <div className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步
        </div>
        <button className="tiny" disabled={step === STEPS.length - 1} onClick={() => go(step + 1)}>下一步</button>
      </div>
      <div className="step-desc">{STEPS[step].title}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
