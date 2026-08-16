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
function drawShelfRow(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number) {
  ctx.fillStyle = C.shelf; ctx.fillRect(x0, y - 6, x1 - x0, 8);
  ctx.fillStyle = C.shelfDark; ctx.fillRect(x0, y + 1, x1 - x0, 2);
  ctx.fillStyle = 'rgba(118,144,106,0.25)'; ctx.fillRect(x1 - 4, y - 8, 4, 10);
}
function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, color: string) {
  ctx.fillStyle = color; rr(ctx, x, y - bh, bw, bh, 2); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(33,50,74,0.35)'; ctx.fillRect(x + bw / 2 - 0.5, y - bh + 3, 1, bh - 6);
}
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, color: string) {
  const bob = Math.sin(t * 6) * 1.2;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  rr(ctx, -16, -22, 32, 24, 9); ctx.fill(); ctx.stroke();
  rr(ctx, -12, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  rr(ctx, 3, -34, 9, 16, 4); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawBookmark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 9); ctx.closePath(); ctx.fill();
}
function drawEndStop(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.wood;
  ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 12, y); ctx.lineTo(x - 12, y); ctx.closePath(); ctx.fill();
}
function drawNote(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string) {
  ctx.fillStyle = '#ffffff'; rr(ctx, x, y, 96, 30, 5); ctx.fill();
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + 8, y + 13);
  ctx.fillStyle = C.ink; ctx.font = 'bold 14px "Segoe UI", sans-serif'; ctx.fillText(value, x + 8, y + 25);
}
function drawTargetMark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.font = 'bold 20px "Segoe UI", sans-serif'; ctx.fillText('✓', x, y);
}
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}
function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<[string, string]>) {
  items.forEach(([color, label], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + i * 90, y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + i * 90 + 9, y + 8);
  });
}

const W = 560, H = 240;

type Identity = 'keep' | 'full';
type Residual = 'on' | 'off';
type Scan = 'one' | 'bi';

function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string, stroke: string, label: string, sub: string | null
) {
  rr(ctx, x, y, w, h, 6);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.ink;
  ctx.font = 'bold 12px "Segoe UI", sans-serif';
  const cy = y + h / 2 - (sub ? 6 : 0);
  ctx.fillText(label, x + w / 2, cy);
  if (sub) {
    ctx.fillStyle = C.muted;
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(sub, x + w / 2, cy + 10);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawLineArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 5 * Math.cos(ang - 0.4), y2 - 5 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 5 * Math.cos(ang + 0.4), y2 - 5 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

export const Ch8M2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ identity: 'keep' as Identity, residual: 'on' as Residual, scan: 'one' as Scan });
  const rafRef = useRef<number | null>(null);
  const [identity, setIdentity] = useState<Identity>('keep');
  const [residual, setResidual] = useState<Residual>('on');
  const [scan, setScan] = useState<Scan>('one');
  const [feedback, setFeedback] = useState<{ text: string; cls: string; color?: string }>({ text: '默认：恒等保留、残差开、单向扫描。切换三组开关，观察参数计量与输出稳定性如何变化。', cls: '', color: undefined });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { identity: Identity; residual: Residual; scan: Scan }) => {
      clearScene(ctx, W, H);

      // ---------- top: block schematic ----------
      // input
      drawBox(ctx, 10, 44, 58, 26, '#ffffff', C.line, '输入 x', 'C×H×W');
      // a-branch (Mamba)
      const aFill = s.scan === 'bi' ? 'rgba(124,58,237,0.12)' : 'rgba(39,68,110,0.08)';
      const aStroke = s.scan === 'bi' ? C.purple : C.blue;
      drawBox(ctx, 110, 16, 118, 40, aFill, aStroke, 'a：Mamba', s.scan === 'bi' ? '↔ 双向' : '→ 单向');
      // b-branch (identity / full)
      if (s.identity === 'keep') {
        drawBox(ctx, 110, 62, 118, 40, 'rgba(34,141,92,0.12)', C.green, 'b：恒等', '原样通过');
      } else {
        drawBox(ctx, 110, 62, 118, 40, 'rgba(217,119,6,0.14)', C.orange, 'b：全加工', '参数 ↑');
      }
      // concat + output
      drawBox(ctx, 276, 44, 64, 26, '#ffffff', C.line, '拼接', '1×1 投影');
      drawBox(ctx, 374, 44, 70, 26, '#ffffff', C.line, '输出', 'C×H×W');

      // branch arrows
      drawLineArrow(ctx, 68, 50, 108, 38, C.muted, 1.5);
      drawLineArrow(ctx, 68, 62, 108, 80, C.muted, 1.5);
      drawLineArrow(ctx, 228, 36, 274, 50, C.muted, 1.5);
      drawLineArrow(ctx, 228, 82, 274, 64, C.muted, 1.5);
      drawLineArrow(ctx, 340, 57, 372, 57, C.ink, 1.6);

      // residual connection (input bottom -> output bottom) only when ON
      if (s.residual === 'on') {
        const path: Array<[number, number]> = [[39, 70], [39, 110], [409, 110], [409, 70]];
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
        ctx.stroke();
        const x1 = path[2][0], y1 = path[2][1], x2 = path[3][0], y2 = path[3][1];
        const ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 5 * Math.cos(ang - 0.4), y2 - 5 * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - 5 * Math.cos(ang + 0.4), y2 - 5 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
        drawSceneLabel(ctx, 230, 104, '残差：开（输出≈输入）', C.green);
      } else {
        drawSceneLabel(ctx, 230, 104, '残差：关（输出会漂移）', C.red);
      }

      // ---------- bottom left: 参数计量 ----------
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('参数计量（相对 C2PSA）', 12, 132);
      if (s.identity === 'keep') {
        rr(ctx, 10, 140, 258, 26, 6);
        ctx.fillStyle = 'rgba(34,141,92,0.12)'; ctx.fill();
      } else {
        rr(ctx, 10, 166, 258, 26, 6);
        ctx.fillStyle = 'rgba(217,119,6,0.14)'; ctx.fill();
      }
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(20, 153, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('恒等保留', 30, 157);
      ctx.fillStyle = C.green; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('≈ 持平（中性）', 150, 157);
      ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(20, 179, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.ink; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('全部加工', 30, 183);
      ctx.fillStyle = C.orange; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('参数 ↑ 明显变重', 150, 183);
      drawSceneLabel(ctx, 12, 210, '恒等路径 b 决定一半是否原样通过', C.muted);

      // ---------- bottom right: 输出稳定性 ----------
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('输出稳定性', 292, 132);
      // input baseline
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(296, 185);
      ctx.lineTo(544, 185);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('输入基准', 300, 178);
      // drift curve
      const curveColor = s.residual === 'on' ? C.green : C.red;
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        const cx = 296 + u * 248;
        let cyy: number;
        if (s.residual === 'on') {
          cyy = 185 + 10 * Math.sin(u * Math.PI * 3);
        } else {
          cyy = 185 - 60 * u * u;
        }
        if (i === 0) ctx.moveTo(cx, cyy);
        else ctx.lineTo(cx, cyy);
      }
      ctx.stroke();
      // legend
      ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(302, 224, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText('残差开：贴近基准', 312, 228);
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(418, 224, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('残差关：漂移', 428, 228);
    };
    const tick = () => {
      render(stateRef.current);
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

  const setState = (patch: Partial<typeof stateRef.current>, fb?: { text: string; cls: string; color?: string }) => {
    stateRef.current = { ...stateRef.current, ...patch };
    const s = stateRef.current;
    setIdentity(s.identity);
    setResidual(s.residual);
    setScan(s.scan);
    if (fb) setFeedback(fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-2)' }}>恒等路径 b</span>
          <button className={`chip ${identity === 'keep' ? 'selected' : ''}`} onClick={() => setState({ identity: 'keep' }, { text: 'b 原样通过：整体块参数几乎不增加，相对 C2PSA 近似参数中性（绿）。', cls: 'good' })}>保留</button>
          <button className={`chip ${identity === 'full' ? 'selected' : ''}`} onClick={() => setState({ identity: 'full' }, { text: '两半都进 Mamba：参数与计算明显变重，偏离论文的轻量设计（橙）。', cls: '', color: '#d97706' })}>全部加工</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-2)' }}>残差连接</span>
          <button className={`chip ${residual === 'on' ? 'selected' : ''}`} onClick={() => setState({ residual: 'on' }, { text: '输出贴近输入，训练更稳（蓝）。BiViM 使用 dstate=16、e=2 并带残差。', cls: '', color: '#27446e' })}>开</button>
          <button className={`chip ${residual === 'off' ? 'selected' : ''}`} onClick={() => setState({ residual: 'off' }, { text: '输出容易漂移，训练变难（红）。', cls: 'bad' })}>关</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-2)' }}>扫描方向</span>
          <button className={`chip ${scan === 'one' ? 'selected' : ''}`} onClick={() => setState({ scan: 'one' }, { text: '单向扫描：只走一遍，最轻量的配置（与 MambaPSA 的 dstate=8、e=1 一致）。', cls: '', color: '#27446e' })}>单向</button>
          <button className={`chip ${scan === 'bi' ? 'selected' : ''}`} onClick={() => setState({ scan: 'bi' }, { text: '正反各扫一遍再相加，两个方向上下文互补（紫）。', cls: '', color: '#7c3aed' })}>双向</button>
        </div>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        style={feedback.color ? { color: feedback.color, borderLeftColor: feedback.color, background: feedback.color + '1f' } : undefined}
      >
        {feedback.text}
      </div>
    </div>
  );
};
