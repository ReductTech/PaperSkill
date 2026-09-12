import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';

// 第 9 章模块 1：裁剪阈值压力测试（P1 连续压力 + 修复）。
// 主体：两条训练曲线；动词：阈值被推动后曲线分岔；目标：找出稳健区间。
// 语义色：红 = PPO 固定阈值；绿 = P3O 自适应；橙 = 用户推动的阈值。
const W = 1080;
const H = 280;

// 模拟“给定裁剪阈值下，训练曲线末端的表现”（示意，构造为单峰）
const perf = (eps: number) => {
  // eps 在 0.02 - 0.6 之间；最佳区间约 0.15-0.25
  const peak = 0.19;
  const width = 0.13;
  const base = 0.18;
  const g = Math.exp(-Math.pow((eps - peak) / width, 2));
  return base + 0.76 * g;
};

export function MStressClip() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [eps, setEps] = useState(20);
  const epsRef = useRef(eps);
  epsRef.current = eps;
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

      const padL = 76;
      const padR = 54;
      const baseY = 224;
      const topY = 46;
      const plotW = W - padL - padR;

      // 轴
      ctx.beginPath();
      ctx.moveTo(padL, topY);
      ctx.lineTo(padL, baseY);
      ctx.lineTo(padL + plotW, baseY);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('扫遍裁剪阈值 ε，看最终成绩', padL, 30);

      const epsToX = (e: number) => padL + ((e - 0.02) / 0.58) * plotW;
      const pToY = (p: number) => baseY - p * (baseY - topY);

      // 曲线
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const e = 0.02 + (i / 300) * 0.58;
        const x = epsToX(e);
        const y = pToY(perf(e));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2.8;
      ctx.stroke();

      // 曲线下方浅填充
      ctx.lineTo(epsToX(0.6), baseY);
      ctx.lineTo(epsToX(0.02), baseY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(34,141,92,0.10)';
      ctx.fill();

      // PPO 在论文里实际扫描过的三个固定值 ε = 0.2 / 0.4 / 0.6（Table 3）
      const SWEPT = [0.2, 0.4, 0.6];
      SWEPT.forEach((e) => {
        const x = epsToX(e);
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, baseY);
        ctx.strokeStyle = 'rgba(196,63,82,0.75)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x, baseY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#c43f52';
        ctx.fill();
      });
      const fixedX = epsToX(0.4);
      ctx.fillStyle = '#c43f52';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PPO 扫描 0.2 / 0.4 / 0.6', fixedX, baseY + 34);

      // 当前位置（用户推动的橙点）
      const curEps = 0.02 + (epsRef.current / 100) * 0.58;
      const cx = epsToX(curEps);
      const cy = pToY(perf(curEps));
      const pulse = (Math.sin(t * 0.11) + 1) / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, 11 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,126,71,0.20)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f07e47';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#f07e47';
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.textAlign = cx > W - 180 ? 'right' : 'left';
      ctx.fillText(`ε = ${curEps.toFixed(2)}`, cx > W - 180 ? cx - 14 : cx + 14, cy - 12);

      // 刻度
      [0.05, 0.2, 0.35, 0.5].forEach((e) => {
        const x = epsToX(e);
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY + 5);
        ctx.strokeStyle = '#d7deea';
        ctx.stroke();
        ctx.fillStyle = '#68778f';
        ctx.font = '500 10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(e.toFixed(2), x, baseY + 20);
      });

      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('裁剪阈值 ε', W / 2, baseY + 52);

      // 纵轴
      ctx.save();
      ctx.translate(26, (baseY + topY) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText('最终成绩（示意）', 0, 0);
      ctx.restore();

      // 图例
      const lx = padL + plotW - 4;
      ctx.textAlign = 'right';
      ctx.font = '500 11px system-ui, sans-serif';
      const legend = [
        { c: '#228d5c', s: '不同 ε 的成绩' },
        { c: '#c43f52', s: 'PPO 固定点' },
        { c: '#f07e47', s: '当前选择' },
      ];
      legend.forEach((it, i) => {
        const y = 30 + i * 17;
        ctx.fillStyle = it.c;
        ctx.fillRect(lx - 108, y - 9, 10, 10);
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

  const curEps = 0.02 + (eps / 100) * 0.58;
  const p = perf(curEps);
  const feedback =
    p > 0.78
      ? {
          cls: 'good',
          t: `ε = ${curEps.toFixed(2)} 落在最优点附近。但这张图的横轴是<b>固定阈值下的最优值</b>——换句话说，只有当你恰好知道这一批数据该配哪个 ε 时，才能落在这里。PPO 做不到这件事，因为它只有一个固定值。`,
        }
      : p > 0.55
      ? {
          cls: '',
          t: `ε = ${curEps.toFixed(2)} 已经偏离最优区间，成绩开始下滑。真实训练里你无法事先知道最优点在哪，只能靠反复试。`,
        }
      : {
          cls: 'bad',
          t: `ε = ${curEps.toFixed(2)} 明显失配：要么把有效梯度切得太狠（学不动），要么放过极端样本（训不稳）。这正是论文 Fig.1 展示的现象——PPO 的曲线对 ε 极其敏感。`,
        };

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-stress-clip" width={W} height={H} />
      <div className="ctrl">
        <label>
          裁剪阈值 ε <span className="val">{curEps.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={eps}
          onChange={(e) => setEps(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.t }} />
    </div>
  );
}
