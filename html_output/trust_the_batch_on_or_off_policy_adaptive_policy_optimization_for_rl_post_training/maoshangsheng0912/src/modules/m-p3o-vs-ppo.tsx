import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';

// 第 7 章模块 2：P3O 与 PPO 在同一批数据上的逐 token 权重对照（P3 同步对比 + P8 结果竞赛）。
// 主体：一排 token 的权重条；动词：被两种规则分别裁剪；目标：对比谁保留得更合理。
// 语义色：红 = PPO 固定裁剪（传统方法）；绿 = P3O 自适应（本文方法）。
const W = 1080;
const H = 280;

// 每个 token 的 ρ 值（示意一批数据）
const RHOS = [0.55, 0.88, 1.04, 1.31, 1.72, 2.28, 0.71, 1.15, 3.05, 0.94, 1.48, 0.62];

const PPO_EPS = 0.2;

export function MP3oVsPpo() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ess, setEss] = useState(45);
  const essRef = useRef(ess);
  essRef.current = ess;
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    const render = () => {
      tRef.current += 1;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const eB = Math.max(0.05, essRef.current / 100);

      // P3O 权重：min{ρ, e_B}；PPO 权重：clip 到 [1-ε, 1+ε]
      const ppoW = (r: number) => Math.min(Math.max(r, 1 - PPO_EPS), 1 + PPO_EPS);
      const p3oW = (r: number) => Math.min(r, eB);

      const padL = 92;
      const padR = 40;
      const topY = 66;
      const rowH = 74;
      const plotW = W - padL - padR;
      const barW = plotW / RHOS.length;

      // 标题行
      ctx.fillStyle = '#21324a';
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('同一批 token，两种规则各自给出的梯度权重', padL, 28);

      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText(
        `PPO 固定裁剪 ε = ${PPO_EPS}  ·  P3O 自适应上限 min{ρ, e_B}，e_B = ${eB.toFixed(2)}`,
        padL,
        48
      );

      // 行标签
      const drawRowLabel = (y: number, text: string, color: string) => {
        ctx.fillStyle = color;
        ctx.font = '700 12px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(text, padL - 14, y + 22);
      };

      // —— PPO 行 ——
      const ppoY = topY + 6;
      drawRowLabel(ppoY, 'PPO', '#c43f52');
      RHOS.forEach((r, i) => {
        const x = padL + i * barW + barW * 0.16;
        const bw = barW * 0.68;
        const w = ppoW(r);
        const h = (w / 3.2) * rowH;
        const cut = r > 1 + PPO_EPS || r < 1 - PPO_EPS;
        const clipped = r > 1 + PPO_EPS;

        ctx.beginPath();
        ctx.rect(x, ppoY + rowH - h, bw, h);
        ctx.fillStyle = '#c43f52';
        ctx.globalAlpha = cut ? 0.42 : 0.9;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (clipped) {
          // 被切掉的顶部用斜线示意
          ctx.beginPath();
          ctx.moveTo(x, ppoY + rowH - h - 5);
          ctx.lineTo(x + bw, ppoY + rowH - h - 5);
          ctx.strokeStyle = '#c43f52';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = '#68778f';
        ctx.font = '500 10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(r.toFixed(2), x + bw / 2, ppoY + rowH + 14);
      });

      // —— P3O 行 ——
      const p3oY = topY + rowH + 44;
      drawRowLabel(p3oY, 'P3O', '#228d5c');
      RHOS.forEach((r, i) => {
        const x = padL + i * barW + barW * 0.16;
        const bw = barW * 0.68;
        const w = p3oW(r);
        const h = (w / 3.2) * rowH;
        const capped = r > eB;

        ctx.beginPath();
        ctx.rect(x, p3oY + rowH - h, bw, h);
        ctx.fillStyle = '#228d5c';
        ctx.globalAlpha = capped ? 0.55 : 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (capped) {
          ctx.beginPath();
          ctx.moveTo(x, p3oY + rowH - h - 5);
          ctx.lineTo(x + bw, p3oY + rowH - h - 5);
          ctx.strokeStyle = '#228d5c';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // 基准线 ρ=1
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padL, topY + rowH * 2 + 44);
      ctx.lineTo(padL + plotW, topY + rowH * 2 + 44);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 图例（最多 3 项）
      const lx = padL + plotW - 4;
      const ly = 28;
      ctx.textAlign = 'right';
      ctx.font = '500 11px system-ui, sans-serif';
      const legend = [
        { c: '#c43f52', s: 'PPO 固定阈值' },
        { c: '#228d5c', s: 'P3O 自适应' },
        { c: '#d7deea', s: '被压掉的部分' },
      ];
      legend.forEach((it, i) => {
        const y = ly + i * 17;
        ctx.fillStyle = it.c;
        ctx.fillRect(lx - 96, y - 9, 10, 10);
        ctx.fillStyle = '#68778f';
        ctx.fillText(it.s, lx, y);
      });
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      unobserve();
      stop();
    };
  }, []);

  const eB = Math.max(0.05, ess / 100);
  // 对比：谁把更多有效梯度保留下来，同时又有抑制极端值
  const ppoLost = RHOS.filter((r) => r > 1 + PPO_EPS).length;
  const ppoAdmitted = RHOS.filter((r) => r <= 1 + PPO_EPS).length;
  const p3oLost = RHOS.filter((r) => r > eB).length;

  const feedback =
    eB > 0.5
      ? {
          cls: 'good',
          t: `e_B = ${eB.toFixed(2)} 时，P3O 的上限相当宽松，${12 - p3oLost} / 12 个 token 完整保留——和 PPO 相比，它至少不会在数据干净的时候<b>无谓地砍掉</b>样本。`,
        }
      : {
          cls: 'bad',
          t: `e_B = ${eB.toFixed(2)} 时，P3O 收紧到 ${eB.toFixed(2)}，只保留 ${12 - p3oLost} / 12 个 token，却恰好把最危险的极端样本（ρ = 3.05 等）压住了；而 PPO 的固定阈值在这个批次上仍然按 1.2 放行——它<b>并不知道</b>这一批数据其实很脏。`,
        };

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-p3o-vs-ppo" width={W} height={H} />
      <div className="ctrl">
        <label>
          这批数据的 e_B <span className="val">{eB.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={5}
          max={96}
          value={ess}
          onChange={(e) => setEss(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.t }} />
    </div>
  );
}
