import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ===== Shared drawing kit (paperKit) =====
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
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}
function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<[string, string]>) {
  items.forEach(([color, label], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + i * 108, y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + i * 108 + 9, y + 8);
  });
}

const W = 560, H = 240;

// ---- BiViM 扫描场景 ----
const N = 12, FOCUS = 6;                 // 12 个 token，聚焦第 7 个（下标 6）
const TW = 30, TH = 22, GAP = 4, X0 = 16;
const focusLeft = X0 + FOCUS * (TW + GAP);
const focusRight = focusLeft + TW;
const endX = X0 + N * (TW + GAP) - GAP;
const LANE_Y_F = 82, LANE_Y_B = 102;
const CYCLE = 1600;                       // 单次扫描周期

type Mode = 'fwd' | 'bwd' | 'both';
type Variant = 'p3' | 'p4' | 'p5';

const VARIANTS: Record<Variant, {
  label: string; where: string; params: string; flops: string; map: string; verdict: string; cls: string;
}> = {
  p3: { label: 'BiViM·P3', where: 'N3 之后（80×80）', params: '+2.1%', flops: '+12.1%', map: '−1.5', verdict: '参数最省，但精度反而下降', cls: 'bad' },
  p4: { label: 'BiViM·P4', where: 'N4 之后（40×40）', params: '+9.6%', flops: '+6.9%', map: '+0.9', verdict: '性价比最高：精度收益最大', cls: 'good' },
  p5: { label: 'BiViM·P5', where: 'N5 之后（20×20）', params: '+43.8%', flops: '+5.2%', map: '+0.7', verdict: '最贵，精度提升有限', cls: '' },
};

export const BivimM1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mode: 'both' as Mode, variant: 'p4' as Variant });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('both');
  const [variant, setVariant] = useState<Variant>('p4');
  const [feedback, setFeedback] = useState<{ text: string; cls: string; color?: string }>(() => {
    const V = VARIANTS.p4;
    return { text: `BiViM·P4（${V.where}）：参数 ${V.params}、FLOPs ${V.flops}、mAP ${V.map} —— ${V.verdict}。`, cls: 'good', color: undefined };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { mode: Mode }, t: number) => {
      clearScene(ctx, W, H);
      drawSceneLabel(ctx, 16, 18, 'BiViM 块内部：一行 token，正反各扫一遍，聚焦第 7 个', C.ink);

      const p = (t % CYCLE) / CYCLE;
      const fcount = (s.mode === 'fwd' || s.mode === 'both') ? Math.floor(p * FOCUS) : 0;          // 左侧已读
      const bcount = (s.mode === 'bwd' || s.mode === 'both') ? Math.floor(p * (N - 1 - FOCUS)) : 0; // 右侧已读

      // ---- token 行 ----
      for (let i = 0; i < N; i++) {
        const x = X0 + i * (TW + GAP), y = 34;
        let fill = '#ffffff';
        if (i < FOCUS && i < fcount) fill = 'rgba(39,68,110,0.18)';               // 蓝：正向可见
        else if (i > FOCUS && (N - 1 - i) < bcount) fill = 'rgba(217,119,6,0.18)'; // 橙：反向可见
        if (i === FOCUS) fill = 'rgba(124,58,237,0.18)';                          // 紫：聚焦 token
        rr(ctx, x, y, TW, TH, 5);
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = i === FOCUS ? C.purple : C.line;
        ctx.lineWidth = i === FOCUS ? 2.2 : 1;
        ctx.stroke();
        ctx.fillStyle = i === FOCUS ? C.purple : C.muted;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), x + TW / 2, y + TH / 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }

      // ---- 正向/反向扫描道 ----
      const fwdX = X0 + p * (focusLeft - X0);
      const bwdX = endX - p * (endX - focusRight);
      const activeF = s.mode === 'fwd' || s.mode === 'both';
      const activeB = s.mode === 'bwd' || s.mode === 'both';

      // 正向道
      ctx.strokeStyle = activeF ? C.blue : '#c3cbd6';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(X0, LANE_Y_F); ctx.lineTo(endX, LANE_Y_F); ctx.stroke();
      if (activeF) {
        ctx.fillStyle = C.blue;
        ctx.beginPath(); ctx.moveTo(endX, LANE_Y_F - 4); ctx.lineTo(endX + 6, LANE_Y_F); ctx.lineTo(endX, LANE_Y_F + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(39,68,110,0.30)';
        ctx.beginPath(); ctx.arc(fwdX, LANE_Y_F, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.blue;
        ctx.beginPath(); ctx.arc(fwdX, LANE_Y_F, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = activeF ? C.blue : '#c3cbd6';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('正向 →', X0, LANE_Y_F - 8);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(`h_f = ${fcount}/${FOCUS}`, endX + 8, LANE_Y_F + 4);

      // 反向道
      ctx.strokeStyle = activeB ? C.orange : '#c3cbd6';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(endX, LANE_Y_B); ctx.lineTo(X0, LANE_Y_B); ctx.stroke();
      if (activeB) {
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.moveTo(X0, LANE_Y_B - 4); ctx.lineTo(X0 - 6, LANE_Y_B); ctx.lineTo(X0, LANE_Y_B + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(217,119,6,0.30)';
        ctx.beginPath(); ctx.arc(bwdX, LANE_Y_B, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.orange;
        ctx.beginPath(); ctx.arc(bwdX, LANE_Y_B, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = activeB ? C.orange : '#c3cbd6';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText('← 反向', X0, LANE_Y_B - 8);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(`h_b = ${bcount}/${N - 1 - FOCUS}`, endX + 8, LANE_Y_B + 4);

      // ---- 动态说明 ----
      const note =
        s.mode === 'fwd'
          ? `聚焦 token 只看到左侧 ${fcount}/${FOCUS} 个（蓝色）—— 右边发生了什么它不知道`
          : s.mode === 'bwd'
            ? `聚焦 token 只看到右侧 ${bcount}/${N - 1 - FOCUS} 个（橙色）—— 左边发生了什么它不知道`
            : `聚焦 token 两侧都看到：左 ${fcount}/${FOCUS} + 右 ${bcount}/${N - 1 - FOCUS} —— 双向互补`;
      drawSceneLabel(ctx, 16, 126, note, s.mode === 'both' ? C.purple : s.mode === 'fwd' ? C.blue : C.orange);

      // ---- 块结构条 ----
      drawSceneLabel(ctx, 16, 152, '块结构（配置 dstate=16 · e=2）：', C.ink);
      const boxes: Array<[string, string]> = [
        ['输入 x', '颈部特征'],
        ['双向扫描', '正 + 反'],
        ['线性投影', '投影'],
        ['残差 ⊕x', '加回输入'],
        ['输出 y', '送检测头'],
      ];
      const BW = 92, BH = 30, STEP = BW + 6, BY = 168;
      boxes.forEach(([label, sub], i) => {
        const bx = 16 + i * STEP;
        rr(ctx, bx, BY, BW, BH, 6);
        ctx.fillStyle = i === 1 ? 'rgba(124,58,237,0.14)' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = i === 1 ? C.purple : C.line;
        ctx.lineWidth = i === 1 ? 1.6 : 1;
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + BW / 2, BY + BH / 2 - 5);
        ctx.fillStyle = C.muted;
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.fillText(sub, bx + BW / 2, BY + BH / 2 + 7);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        if (i < boxes.length - 1) {
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(bx + BW + 2, BY + BH / 2); ctx.lineTo(bx + BW + STEP - 2, BY + BH / 2); ctx.stroke();
          ctx.fillStyle = C.line;
          ctx.beginPath(); ctx.moveTo(bx + BW + STEP - 2, BY + BH / 2 - 3); ctx.lineTo(bx + BW + STEP + 1, BY + BH / 2); ctx.lineTo(bx + BW + STEP - 2, BY + BH / 2 + 3); ctx.closePath(); ctx.fill();
        }
      });

      // ---- 图例 ----
      drawLegend(ctx, 16, 218, [
        [C.blue, '正向可见'],
        [C.orange, '反向可见'],
        [C.purple, '聚焦 token'],
      ]);
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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

  const setState = (s: Partial<typeof stateRef.current>) => {
    stateRef.current = { ...stateRef.current, ...s };
    setMode(stateRef.current.mode);
    setVariant(stateRef.current.variant);
  };

  const feedbackFor = (v: Variant): { text: string; cls: string; color?: string } => {
    const V = VARIANTS[v];
    const base = `BiViM·${v.toUpperCase()}（${V.where}）：参数 ${V.params}、FLOPs ${V.flops}、mAP ${V.map} —— ${V.verdict}。`;
    if (v === 'p3') return { text: base + ' 低层插入，双向扫描的成本没换来精度，反而下降。', cls: 'bad' };
    if (v === 'p4') return { text: base + ' 论文评测里性价比最高的位置。', cls: 'good' };
    return { text: base + ' 高层插入最贵，提升有限。', cls: '' };
  };

  const changeMode = (m: Mode) => {
    setState({ mode: m });
    setFeedback(feedbackFor(stateRef.current.variant));
  };
  const changeVariant = (v: Variant) => {
    setState({ variant: v });
    setFeedback(feedbackFor(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mode === 'fwd' ? 'selected' : ''}`} onClick={() => changeMode('fwd')}>仅正向</button>
        <button className={`chip ${mode === 'bwd' ? 'selected' : ''}`} onClick={() => changeMode('bwd')}>仅反向</button>
        <button className={`chip ${mode === 'both' ? 'selected' : ''}`} onClick={() => changeMode('both')}>双向</button>
      </div>
      <div className="step-desc" style={{ marginTop: 0, marginBottom: 6 }}>
        单向 Mamba 只能拿到一侧的上下文；BiViM 正反各扫一遍、把两个方向相加，聚焦 token 两侧的信息就都补上了。
      </div>
      <div className="chip-row" style={{ marginTop: 0 }}>
        <button className={`chip ${variant === 'p3' ? 'selected' : ''}`} onClick={() => changeVariant('p3')}>插在 P3</button>
        <button className={`chip ${variant === 'p4' ? 'selected' : ''}`} onClick={() => changeVariant('p4')}>插在 P4</button>
        <button className={`chip ${variant === 'p5' ? 'selected' : ''}`} onClick={() => changeVariant('p5')}>插在 P5</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

