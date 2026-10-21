import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawSort,
  drawPress,
  drawLink,
  drawLabel,
  drawLegend,
  drawKitchenCounter,
  drawPot,
  drawFlame,
  drawChefHand,
} from './letterpressKit';

const LAY = {
  headX: 40,
  headW: 580,
  bandY: 196,
  bandH: 78,
  pressY: 40,
  pressH: 34,
  legendY: 320,
};

const LP_ROWS = 5;
const D = 768;
/** 主干约 8600 万：这是 ViT-B/16 的规格，也和论文那两个百分比大致对得上；论文正文并没有印这个数。 */
const BACKBONE = 86000000;
/** 论文 §5.2 印的两种设置下的 prompt 参数量：CIFAR-100 系列（M=10, L_p=5）与 5-datasets（M=20, L_p=5）。 */
const REF_A = 46080;
const REF_B = 92160;

/** prompt 参数 = M·L_p·D（可训练的调料）+ M·D_k（检索用的 key；论文取 D_k = D）。 */
function promptParams(k: number): number {
  return k * LP_ROWS * D + k * D;
}

function rowLayout(k: number): { promptH: number; classH: number; bandTop: number } {
  const promptH = 10;
  const classH = 10;
  const promptTop = LAY.pressY + LAY.pressH + 10 + (LP_ROWS - k) * (promptH + 3);
  const classTop = promptTop + k * (promptH + 3);
  return { promptH, classH, bandTop: classTop + classH + 8 };
}

function renderNormal(ctx: CanvasRenderingContext2D, k: number): void {
  drawField(ctx, 0, 0, 1080, 360);
  const { promptH, classH } = rowLayout(k);

  // 压印机机体
  drawPress(ctx, LAY.headX, LAY.pressY, LAY.headW, LAY.pressH, { press: k > 0 ? 0.25 : 0, active: k > 0 });

  // 版框导轨
  ctx.save();
  ctx.strokeStyle = LP.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(LAY.headX, LAY.pressY + LAY.pressH + 4);
  ctx.lineTo(LAY.headX, LAY.bandY + LAY.bandH);
  ctx.moveTo(LAY.headX + LAY.headW, LAY.pressY + LAY.pressH + 4);
  ctx.lineTo(LAY.headX + LAY.headW, LAY.bandY + LAY.bandH);
  ctx.stroke();
  ctx.restore();

  const promptTop = LAY.pressY + LAY.pressH + 10 + (LP_ROWS - k) * (promptH + 3);
  const classTop = promptTop + k * (promptH + 3);

  // 空的调料位
  if (k < LP_ROWS) {
    for (let i = 0; i < LP_ROWS; i++) {
      const y = LAY.pressY + LAY.pressH + 10 + i * (promptH + 3);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = LP.axis;
      ctx.lineWidth = 1;
      lpRoundRect(ctx, LAY.headX + 6, y, LAY.headW - 12, promptH, 3, false, true);
      ctx.restore();
    }
  }
  // 可训练的调料（一行 = 一条 prompt 的一行调料）
  for (let i = 0; i < k; i++) {
    const y = promptTop + i * (promptH + 3);
    drawTypeCase(ctx, LAY.headX + 6, y, LAY.headW - 12, promptH, {
      cols: 6,
      rows: 1,
      gap: 3,
      radius: 2,
      fill: () => LP.accent,
    });
  }

  // 记录员那一行（紫色，不可训练）
  drawTypeCase(ctx, LAY.headX + 6, classTop, LAY.headW - 12, classH, {
    cols: 6,
    rows: 1,
    gap: 3,
    radius: 2,
    fill: () => LP.aux,
  });
  drawSort(ctx, LAY.headX + LAY.headW + 8, classTop - 2, 26, classH + 4, { fill: LP.aux, emphasis: true });

  // 冻结的 patch 区
  drawTypeCase(ctx, LAY.headX + 6, LAY.bandY, LAY.headW - 12, LAY.bandH, {
    cols: 28,
    rows: 7,
    gap: 2,
    radius: 1,
    fill: (r: number, c: number) => ((r + c) % 2 === 0 ? LP.light : LP.dark),
  });
  drawLink(ctx, LAY.headX + LAY.headW + 8, classTop + 6, LAY.headX + LAY.headW + 8, LAY.bandY + 8, {
    color: LP.support,
    dashed: true,
  });
  drawLegend(
    ctx,
    [
      { label: '可训练', color: LP.accent },
      { label: '冻结', color: LP.dark },
    ],
    LAY.headX,
    LAY.legendY,
  );
  drawLabel(ctx, '调味', LAY.headX, 34, { size: 12, weight: 600, color: LP.ink });
}

function renderAna(ctx: CanvasRenderingContext2D, t: number): void {
  drawField(ctx, 0, 0, 560, 140);
  const phase = clamp(t, 0, 1);
  // 下面：灶台和锅（冻结不变）
  drawKitchenCounter(ctx, 80, 110, 400);
  drawPot(ctx, 200, 55, 160, 55, { fill: LP.support, withSteam: true, time: t });
  // 火苗
  for (let i = 0; i < 3; i++) {
    drawFlame(ctx, 240 + i * 40, 112, 12, t + i * 0.5);
  }
  // 上面：厨师的手在撒调料
  const handX = 280 + Math.sin(phase * Math.PI * 2) * 60;
  const handY = 25 + Math.sin(phase * Math.PI * 4) * 5;
  drawChefHand(ctx, handX, handY, { action: 'sprinkle', time: t });
  // 撒下的调料颗粒
  ctx.save();
  ctx.fillStyle = LP.accent;
  for (let i = 0; i < 8; i++) {
    const fall = (phase * 2 + i * 0.12) % 1;
    const px = handX + (Math.sin(i * 3 + t) * 15);
    const py = handY + 20 + fall * 50;
    ctx.globalAlpha = 1 - fall * 0.5;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  drawLabel(ctx, '灶台冻结', 200, 48, { size: 11, weight: 600, color: LP.muted });
  drawLabel(ctx, '只撒调料', 80, 20, { size: 12, weight: 600, color: LP.accent });
}

export const ComposeHead: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? 560 : 1080;
  const H = isAna ? 140 : 360;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const stRef = useRef({ k: 1, ana: 0 });

  const [chips, setChips] = useState<boolean[]>([true, false, false, false, false]);
  const k = chips.filter(Boolean).length;

  useEffect(() => {
    stRef.current.k = k;
  }, [k]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const draw = () => {
      try {
        if (isAna) renderAna(ctx, stRef.current.ana);
        else renderNormal(ctx, stRef.current.k);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      } catch {
        /* 单帧绘制失败不应中断循环 */
      }
    };
    const start = () => {
      cancelAnimationFrame(rafRef.current);
      const loop = () => {
        if (isAna) {
          stRef.current.ana = (stRef.current.ana + 0.004) % 1;
        }
        draw();
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    };
    const stop = () => cancelAnimationFrame(rafRef.current);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [W, H, isAna]);

  const params = promptParams(k);
  const pct = ((params / BACKBONE) * 100).toFixed(2);

  const feedback = useMemo(() => {
    if (k === 0) {
      return {
        tone: 'bad' as const,
        text: '没有 prompt，这就是普通微调模型，主干（ViT-B/16，约 8600 万个旋钮）照样要改。',
      };
    }
    if (k === 1) {
      return {
        tone: 'good' as const,
        text: `新增 5×768 = 3,840 行调料，再加 1×768 = 768 个 key，共 ${promptParams(1).toLocaleString()} 个参数；主干一个没动。`,
      };
    }
    if (k === 5) {
      return {
        tone: 'good' as const,
        text: `新增 25×768 = 19,200 行调料 + 5×768 = 3,840 个 key，共 ${promptParams(
          5
        ).toLocaleString()} 个可训练参数。`,
      };
    }
    return {
      tone: 'good' as const,
      text: `新增 ${k * LP_ROWS}×768 = ${(k * LP_ROWS * D).toLocaleString()} 行调料 + ${k}×768 = ${(
        k * D
      ).toLocaleString()} 个 key，共 ${promptParams(k).toLocaleString()} 个；主干一个没动。`,
    };
  }, [k]);

  const toggle = (i: number) => {
    setChips((prev) => prev.map((v, j) => (j === i ? !v : v)));
  };

  return (
    <div className="widget">
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />

      {!isAna && (
        <>
          <div className="chip-row">
            {chips.map((on, i) => (
              <button
                key={i}
                type="button"
                className={`chip${on ? ' selected' : ''}`}
                onClick={() => toggle(i)}
              >
                调料 {i + 1}
              </button>
            ))}
          </div>

          <div className="chip-row">
            <button
              type="button"
              className="chip ghost"
              onClick={() => setChips([true, false, false, false, false])}
            >
              重置
            </button>
          </div>

          <div className="metrics">
            <div className="metric">
              <span className="l">可训练参数</span>
              <span className="v">{params.toLocaleString()}</span>
            </div>
            <div className="metric">
              <span className="l">占主干(约)</span>
              <span className="v">{pct}%</span>
            </div>
            <div className="metric">
              <span className="l">主干被改动</span>
              <span className="v">0 个零件</span>
            </div>
            <div className="metric">
              <span className="l">单条 prompt</span>
              <span className="v">
                {LP_ROWS}×{D} = {LP_ROWS * D} + {D} key
              </span>
            </div>
          </div>

          <div className="step-desc">
            一条 prompt 是 {LP_ROWS} 行可训练调料，行宽和 patch 一样是 {D}，所以能直接拼在最前面。编码器自己的输入 x_e 是{' '}
            <b>197</b> 行 = 1 行 <b>[class]</b> 记录员 + 196 行冻结的 patch；最前面再插上 {k * LP_ROWS} 行 prompt 调料，
            本次共 {k * LP_ROWS + 197} 行，顺序是 prompt → [class] → patch。CIFAR-100 设置用 N=5、L_p=5，即 25 + 1 + 196 ={' '}
            <b>222</b> 行。
          </div>

          <div className="step-desc">
            两种设置的 prompt 参数量：CIFAR-100 系列（M=10、L_p=5）共 <b>{REF_A.toLocaleString()}</b> 个，约占{' '}
            <b>0.05%</b>；5-datasets（M=20、L_p=5）共 <b>{REF_B.toLocaleString()}</b> 个，约占 <b>0.11%</b>。主干是预训练
            ViT-B/16，约 8600 万参数，和这两个百分比大致对得上。本页只摆 5 瓶调料示意（池子是
            M=10 或 20）；按本页这条公式，5 瓶调料共 <b>{promptParams(5).toLocaleString()}</b> 个。
          </div>

          <div className={`feedback ${feedback.tone}`}>{feedback.text}</div>
        </>
      )}
    </div>
  );
};

export default ComposeHead;
