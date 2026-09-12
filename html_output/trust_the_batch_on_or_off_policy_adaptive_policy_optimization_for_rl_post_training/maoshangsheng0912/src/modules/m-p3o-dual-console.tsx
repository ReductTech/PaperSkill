import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 第 7 章模块 1（全文核心）：一个 e_B 同时驱动两件事的联动台（P1 双通道联动）。
// 主体：一只 e_B 表盘 + 两条联动通道。动词：被滑块推动。目标：两通道同时反向变化。
// 语义色：绿 = 本文方法/梯度上限；紫 = KL 正则；橙 = 用户推动的 e_B。
const W = 1080;
const H = 280;

export function MP3oDualConsole() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [ess, setEss] = useState(48); // e_B * 100
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

      const eB = Math.max(0.04, essRef.current / 100);

      // —— 左：e_B 表盘 ——
      const cx = 150;
      const cy = 134;
      const R = 68;

      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = '#e6ecdf';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      const ang = Math.PI * 0.75 + Math.PI * 1.5 * eB;
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.75, ang);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * (R - 18), cy + Math.sin(ang) * (R - 18));
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#21324a';
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#f07e47';
      ctx.font = '700 28px ui-monospace, monospace';
      ctx.fillText(eB.toFixed(2), cx, cy + 10);
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText('e_B', cx, cy + R + 26);
      ctx.fillText('唯一输入', cx, cy + R + 44);

      // —— 中：分叉箭头 ——
      const forkX = 268;
      const topY = 84;
      const botY = 196;

      const pulse = (Math.sin(t * 0.09) + 1) / 2;

      const drawFork = (targetY: number, color: string) => {
        ctx.beginPath();
        ctx.moveTo(forkX, cy);
        ctx.bezierCurveTo(forkX + 44, cy, forkX + 44, targetY, forkX + 96, targetY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.6;
        ctx.setLineDash([]);
        ctx.stroke();

        // 沿路径流动的亮点
        const px = forkX + 96 * pulse;
        const py = cy + (targetY - cy) * (pulse * pulse * (3 - 2 * pulse));
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      drawFork(topY, '#228d5c');
      drawFork(botY, '#7c3aed');

      // —— 右上：梯度上限通道 ——
      const rx = 400;
      const capVal = eB;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#228d5c';
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.fillText('通道一 · 梯度权重上限', rx, 62);
      ctx.fillStyle = '#21324a';
      ctx.font = '500 13px ui-monospace, monospace';
      ctx.fillText('min{ ρ_t , e_B }', rx, 84);

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rx, 96, 560, 20, 10) : ctx.rect(rx, 96, 560, 20);
      ctx.fillStyle = '#eef2e8';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(rx, 96, Math.max(6, 560 * capVal), 20, 10)
        : ctx.rect(rx, 96, Math.max(6, 560 * capVal), 20);
      ctx.fillStyle = '#228d5c';
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(capVal.toFixed(2), rx + 560, 88);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText(
        capVal > 0.5 ? '上限很宽：数据可信，放开梯度让它学' : '上限收紧：数据不可信，只让最可靠的样本说话',
        rx,
        136
      );

      // —— 右下：KL 正则通道 ——
      const klVal = 1 - eB;
      ctx.fillStyle = '#7c3aed';
      ctx.font = '700 14px system-ui, sans-serif';
      ctx.fillText('通道二 · KL 正则系数', rx, 174);
      ctx.fillStyle = '#21324a';
      ctx.font = '500 13px ui-monospace, monospace';
      ctx.fillText('( 1 − e_B )', rx, 196);

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rx, 208, 560, 20, 10) : ctx.rect(rx, 208, 560, 20);
      ctx.fillStyle = '#f0ebfa';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(rx, 208, Math.max(6, 560 * klVal), 20, 10)
        : ctx.rect(rx, 208, Math.max(6, 560 * klVal), 20);
      ctx.fillStyle = '#7c3aed';
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '700 13px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(klVal.toFixed(2), rx + 560, 200);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText(
        klVal < 0.5 ? '正则很轻：数据可信，不必把模型拴太紧' : '正则加重：数据不可信，把模型拉住别让它跑偏',
        rx,
        248
      );

      // 顶注
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText('同一个 e_B，同时决定两件事 —— 此消彼长，无需人工调参', 400, 34);
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

  const eB = Math.max(0.04, ess / 100);
  const feedback =
    eB > 0.62
      ? {
          cls: 'good',
          t: `e_B = ${eB.toFixed(2)}，数据很干净：梯度上限放到 ${eB.toFixed(2)}，几乎不裁任何样本；KL 只剩 ${(1 - eB).toFixed(2)}，模型可以放心大胆地往前学。传统做法在这里往往会用过强的正则，白白拖慢训练。`,
        }
      : eB > 0.3
      ? {
          cls: '',
          t: `e_B = ${eB.toFixed(2)}，中等可信：梯度上限收到 ${eB.toFixed(2)}，KL 提到 ${(1 - eB).toFixed(2)}。两个通道同时向中间靠——注意它们是<b>一条曲线上的两个点</b>，不是两个独立的旋钮。`,
        }
      : {
          cls: 'bad',
          t: `e_B = ${eB.toFixed(2)}，数据很不靠谱：梯度上限压到 ${eB.toFixed(2)}，只有极少数样本还能贡献梯度；同时 KL 拉到 ${(1 - eB).toFixed(2)}，把模型牢牢拴住。代价是学得慢，但避免了被高方差带崩。`,
        };

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-p3o-console" width={W} height={H} />
      <div className="ctrl">
        <label>
          这一批数据的 e_B <span className="val">{eB.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={4}
          max={96}
          value={ess}
          onChange={(e) => setEss(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.t }} />
    </div>
  );
}
