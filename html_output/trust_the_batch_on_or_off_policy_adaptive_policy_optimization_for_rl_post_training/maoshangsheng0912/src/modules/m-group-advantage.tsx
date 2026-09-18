import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 第 4 章模块：组相对优势从哪来（P6 拖拽探索）。
// 主体：一组同一 prompt 的候选回答条。动词：被拖动重排/比较。目标：找出组内相对位置。
// 语义色：绿 = 高于组均值；红 = 低于组均值；蓝 = 组均值线。
const W = 1080;
const H = 280;

// 五个候选回答的奖励分数
const REWARDS = [0.82, 0.35, 0.64, 0.18, 0.71];

export function MGroupAdvantage() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
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
      ctx.clearRect(0, 0, W, H);

      const mean = REWARDS.reduce((a, b) => a + b, 0) / REWARDS.length;
      const std =
        Math.sqrt(REWARDS.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / REWARDS.length) || 1e-6;

      const padL = 90;
      const padR = 90;
      const baseY = 232;
      const topY = 44;
      const barW = 90;
      const gap = (W - padL - padR - barW * REWARDS.length) / (REWARDS.length - 1);

      // 组均值线
      const meanY = baseY - ((mean - 0) / 1.0) * (baseY - topY);
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(padL - 20, meanY);
      ctx.lineTo(W - padR + 20, meanY);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#27446e';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`组均值 ${mean.toFixed(2)}`, padL - 20, meanY - 8);

      REWARDS.forEach((r, i) => {
        const x = padL + i * (barW + gap);
        const h = ((r - 0) / 1.0) * (baseY - topY);
        const y = baseY - h;
        const above = r > mean;
        const isPicked = pickedRef.current === i;

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, barW, h, 8) : ctx.rect(x, y, barW, h);
        ctx.fillStyle = above ? '#228d5c' : '#c43f52';
        ctx.fill();
        if (isPicked) {
          ctx.strokeStyle = '#f07e47';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }

        // 分数
        ctx.fillStyle = '#21324a';
        ctx.font = '700 13px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(r.toFixed(2), x + barW / 2, y - 9);

        // 优势值
        const adv = (r - mean) / std;
        ctx.fillStyle = above ? '#228d5c' : '#c43f52';
        ctx.font = '600 11px ui-monospace, monospace';
        ctx.fillText(`${adv >= 0 ? '+' : ''}${adv.toFixed(2)}`, x + barW / 2, baseY + 20);

        ctx.fillStyle = '#68778f';
        ctx.font = '500 11px system-ui, sans-serif';
        ctx.fillText(`回答 ${i + 1}`, x + barW / 2, baseY + 40);
      });

      // 轴标签
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.save();
      ctx.translate(30, (baseY + topY) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('奖励分数', 0, 0);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#21324a';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText('同一个 prompt 的 5 个回答', W / 2, 26);
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

    // 悬停拾取
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mx = (e.clientX - rect.left) * scaleX;
      const padL = 90;
      const padR = 90;
      const barW = 90;
      const gap = (W - padL - padR - barW * REWARDS.length) / (REWARDS.length - 1);
      let hit: number | null = null;
      REWARDS.forEach((_r, i) => {
        const x = padL + i * (barW + gap);
        if (mx >= x && mx <= x + barW) hit = i;
      });
      setPicked(hit);
    };
    const onLeave = () => setPicked(null);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      unobserve();
      stop();
    };
  }, []);

  const mean = REWARDS.reduce((a, b) => a + b, 0) / REWARDS.length;
  const std = Math.sqrt(REWARDS.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / REWARDS.length) || 1e-6;

  const feedback =
    picked === null
      ? {
          cls: '',
          text: '把鼠标移到任意一根柱子上。注意：真正送进梯度的是<b>优势值</b>（柱子下方那个带正负号的数），而不是奖励分数本身。',
        }
      : {
          cls: REWARDS[picked] > mean ? 'good' : 'bad',
          text:
            REWARDS[picked] > mean
              ? `回答 ${picked + 1} 的奖励 ${REWARDS[picked].toFixed(2)} 高于组均值 ${mean.toFixed(2)}，优势值为正（${(((REWARDS[picked] - mean) / std) >= 0 ? '+' : '') + ((REWARDS[picked] - mean) / std).toFixed(2)}），这一步会被<b>鼓励</b>。`
              : `回答 ${picked + 1} 的奖励 ${REWARDS[picked].toFixed(2)} 低于组均值 ${mean.toFixed(2)}，优势值为负（${((REWARDS[picked] - mean) / std).toFixed(2)}），这一步会被<b>抑制</b>。注意：它的绝对分数并不低，只是在这组里相对靠后。`,
        };

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-group-adv" width={W} height={H} />
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
}
