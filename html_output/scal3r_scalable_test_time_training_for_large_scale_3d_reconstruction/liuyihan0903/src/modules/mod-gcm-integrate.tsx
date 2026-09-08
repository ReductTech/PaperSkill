import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 模块 3.2 —— GCM 怎么接进主干（论文 4.1 的式 1/2/3）。
// 主干是 VGGT 的交替注意力：帧内 fattn → 帧间 gattn，再做残差（式 2）。
// 接入 GCM 后，用一个可学习门控向量 α 把 GCM(X) 的长程上下文增量融合回残差
// （式 3）。拖动 α：α=0 退化为原始交替注意力（式 2，只有块内上下文），
// α 越大，越多“全局上下文”流入，输出的全局一致性越好。
const W = 560;
const H = 250;
const PIPE_Y = 150;
const K_CHUNKS = 6; // 示意：整段被切成 6 块，用于“全局上下文覆盖”读数

interface GState {
  t: number;
  a: number; // 门控强度 α（0..1，示意标量）
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  label: string,
  sub?: string
) {
  roundRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = stroke;
  ctx.textAlign = 'center';
  ctx.font = '12px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(label, x + w / 2, y + (sub ? h / 2 - 3 : h / 2 + 4));
  if (sub) {
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#68778f';
    ctx.fillText(sub, x + w / 2, y + h / 2 + 12);
  }
  ctx.textAlign = 'left';
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const s = 5 + width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - s * Math.cos(ang - 0.4), y1 - s * Math.sin(ang - 0.4));
  ctx.lineTo(x1 - s * Math.cos(ang + 0.4), y1 - s * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

export const ModGcmIntegrate: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GState>({ t: 0, a: 0.7 });
  const rafRef = useRef<number | null>(null);
  const [a, setA] = useState(0.7);
  const [feedback, setFeedback] = useState({
    text: 'α>0：GCM 分支接通（式 3），长程上下文按门控比例融合回主干，全局一致性变好。',
    cls: '',
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

    // 主干管线各站点 x 坐标
    const xIn = 34;
    const xF = 96;
    const xG = 190;
    const boxW = 74;
    const boxH = 40;
    const xPlus = 320; // 残差 ⊕
    const xOut = 372;

    const render = (s: GState) => {
      const alpha = clamp(s.a, 0, 1);
      const pulse = (Math.sin(s.t * 0.09) + 1) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 标题
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#21324a';
      ctx.textAlign = 'left';
      ctx.fillText('VGGT 交替注意力主干 + GCM 门控残差', xIn, 26);

      // 输入 token X^i_k（一小摞方块）
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#dbe6f2';
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 1;
        const yy = PIPE_Y - 18 + i * 12;
        ctx.fillRect(xIn - 6 + i * 3, yy, 22, 22);
        ctx.strokeRect(xIn - 6 + i * 3, yy, 22, 22);
      }
      ctx.fillStyle = '#27446e';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('X ', xIn + 4, PIPE_Y + 34);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText('第k块·第i层', xIn + 4, PIPE_Y + 46);

      // fattn / gattn 主干（式 2）
      box(ctx, xF, PIPE_Y - 20, boxW, boxH, '#eef3ec', '#3a7d44', 'fattn', '帧内');
      box(ctx, xG, PIPE_Y - 20, boxW, boxH, '#eef3ec', '#3a7d44', 'gattn', '帧间/全局');

      // 主干箭头
      arrow(ctx, xIn + 20, PIPE_Y, xF, PIPE_Y, '#7d8ca0', 2);
      arrow(ctx, xF + boxW, PIPE_Y, xG, PIPE_Y, '#7d8ca0', 2);
      arrow(ctx, xG + boxW, PIPE_Y, xPlus - 12, PIPE_Y, '#7d8ca0', 2);

      // 残差 ⊕
      ctx.beginPath();
      ctx.arc(xPlus, PIPE_Y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = '#21324a';
      ctx.beginPath();
      ctx.moveTo(xPlus - 6, PIPE_Y);
      ctx.lineTo(xPlus + 6, PIPE_Y);
      ctx.moveTo(xPlus, PIPE_Y - 6);
      ctx.lineTo(xPlus, PIPE_Y + 6);
      ctx.stroke();

      // 残差 skip 连接（原 token 直连到 ⊕，式 2/3 都有的 + X）
      ctx.strokeStyle = '#c7d0c0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xIn + 8, PIPE_Y + 24);
      ctx.lineTo(xIn + 8, PIPE_Y + 60);
      ctx.lineTo(xPlus, PIPE_Y + 60);
      ctx.lineTo(xPlus, PIPE_Y + 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#9aa7b8';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('+ X（残差）', xIn + 14, PIPE_Y + 74);

      // GCM 模块 + 门控 α（上方分支）
      const gcmLit = alpha > 0.001;
      const gcmStroke = gcmLit ? '#6b4fa0' : '#b9b2cf';
      const gcmFill = gcmLit ? '#efe9f8' : '#f3f1f8';
      box(
        ctx,
        xG,
        44,
        boxW,
        boxH,
        gcmFill,
        gcmStroke,
        'GCM',
        'AMU 记忆'
      );
      // 门控节点 α⊗
      const gateX = xPlus - 8;
      const gateY = 64;
      roundRect(ctx, gateX - 22, gateY - 14, 44, 28, 6);
      ctx.fillStyle = gcmLit ? '#f3e7c8' : '#f0eee6';
      ctx.fill();
      ctx.strokeStyle = gcmLit ? '#b8860b' : '#c9c3b3';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = gcmLit ? '#8a6400' : '#9a957f';
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('α ⊗', gateX, gateY + 4);

      // GCM → 门控 → ⊕ 的通路，粗细/透明度随 α
      const flow = 0.6 + pulse * 0.4;
      const gw = 1 + alpha * 4;
      const gcol = gcmLit
        ? `rgba(107,79,160,${0.35 + alpha * 0.55 * flow})`
        : 'rgba(180,178,200,0.5)';
      arrow(ctx, xG + boxW / 2, 84, gateX, gateY - 14, gcol, Math.max(1.2, gw * 0.7));
      arrow(ctx, gateX, gateY + 14, xPlus, PIPE_Y - 12, gcol, Math.max(1.2, gw));
      // GCM 也从主干取 token（gattn 输出→GCM）
      ctx.strokeStyle = 'rgba(107,79,160,0.35)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xG + boxW / 2, PIPE_Y - 20);
      ctx.lineTo(xG + boxW / 2, 84);
      ctx.stroke();
      ctx.setLineDash([]);

      // 输出 token X̄
      ctx.fillStyle = gcmLit ? '#e7dcff' : '#dbe6f2';
      ctx.strokeStyle = gcmLit ? '#6b4fa0' : '#27446e';
      ctx.lineWidth = 1.5;
      arrow(ctx, xPlus + 12, PIPE_Y, xOut - 4, PIPE_Y, '#7d8ca0', 2);
      ctx.fillStyle = gcmLit ? '#e7dcff' : '#dbe6f2';
      ctx.fillRect(xOut, PIPE_Y - 12, 24, 24);
      ctx.strokeRect(xOut, PIPE_Y - 12, 24, 24);
      ctx.fillStyle = gcmLit ? '#6b4fa0' : '#27446e';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('X̄', xOut + 12, PIPE_Y + 30);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText('送输出头', xOut + 12, PIPE_Y + 42);

      // 当前生效的公式高亮
      ctx.textAlign = 'right';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = alpha < 0.001 ? '#c43f52' : '#b8b8b8';
      ctx.fillText('α=0 → 式(6) 原始交替注意力', W - 20, 26);
      ctx.fillStyle = alpha >= 0.001 ? '#6b4fa0' : '#b8b8b8';
      ctx.fillText('α>0 → 式(7) 接入 GCM', W - 20, 42);
      ctx.textAlign = 'left';

      // 全局上下文覆盖读数条
      const barX = 430;
      const barY = 150;
      const barW = 110;
      const barH = 14;
      const cover = lerp(1 / K_CHUNKS, 1, alpha); // α=0 只有本块，α=1 覆盖全序列
      ctx.fillStyle = '#eef1f5';
      roundRect(ctx, barX, barY, barW, barH, 7);
      ctx.fill();
      ctx.fillStyle = gcmLit ? '#6b4fa0' : '#9aa7b8';
      roundRect(ctx, barX, barY, Math.max(6, barW * cover), barH, 7);
      ctx.fill();
      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('全局上下文覆盖', barX + barW / 2, barY - 6);
      ctx.fillText(`${Math.round(cover * 100)}%`, barX + barW / 2, barY + barH + 14);
      ctx.textAlign = 'left';
    };

    const tick = () => {
      stateRef.current.t += 1;
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

  const onA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.a = v;
    setA(v);
    if (v < 0.001) {
      setFeedback({
        text:
          'α=0：门控关闭，GCM 增量为 0，整套运算退化为原始 VGGT 交替注意力（式 2）——' +
          '只有块内上下文，跨块长程信息进不来。',
        cls: 'bad',
      });
    } else {
      const cover = Math.round(lerp(1 / K_CHUNKS, 1, v) * 100);
      setFeedback({
        text:
          `α=${v.toFixed(2)}：GCM 分支接通（式 3），α⊗GCM(X) 按比例把长程上下文残差写回主干；` +
          `全局上下文覆盖 ≈ ${cover}%，跨块一致性变好。`,
        cls: '',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          门控强度 α <span className="val">{a.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(a * 100)} onChange={onA} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModGcmIntegrate;
