import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 第 6 章模块（洞见核心）：e_B 怎么把“这批数据有多同策略”量出来（P1 + 联动）。
// 主体：一组 ρ 样本条；动词：随分布变宽而失配；目标：读出 e_B 的塌缩。
// 语义色：蓝 = 数据；绿 = e_B 高（可信）；红 = e_B 低（不可信）；橙 = 用户推动的分布宽度。
const W = 1080;
const H = 280;

export function MEssMeasure() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(30); // 分布宽度（0-100）
  const widthRef = useRef(width);
  widthRef.current = width;
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    const N = 32;

    const render = () => {
      tRef.current += 1;
      ctx.clearRect(0, 0, W, H);

      const w = widthRef.current / 100; // 0 - 1
      const sigma = 0.06 + w * 1.15;

      // 生成 ρ 样本（确定性伪随机）
      const rhos: number[] = [];
      for (let i = 0; i < N; i++) {
        // Box-Muller 的确定性版
        const u1 = (((i * 7919) % 1000) / 1000) * 0.94 + 0.03;
        const u2 = (((i * 104729) % 1000) / 1000) * 0.94 + 0.03;
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        rhos.push(Math.max(0.02, Math.exp(sigma * z)));
      }

      // e_B = (Σρ)² / (N · Σρ²)
      const sum = rhos.reduce((a, b) => a + b, 0);
      const sumSq = rhos.reduce((a, b) => a + b * b, 0);
      const eB = (sum * sum) / (N * sumSq);

      // —— 左区：ρ 条形 ——
      const padL = 56;
      const barAreaW = 470;
      const barW = barAreaW / N;
      const baseY = 226;
      const topY = 56;

      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('这一批数据的 ρ = π_θ / π_old 分布', padL, 34);

      // 基准 y=1 的参考线
      const maxRho = Math.max(...rhos, 2.2);
      const rhoToY = (r: number) => baseY - (Math.min(r, maxRho) / maxRho) * (baseY - topY);
      const y1 = rhoToY(1);

      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(padL, y1);
      ctx.lineTo(padL + barAreaW, y1);
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#27446e';
      ctx.font = '600 11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('ρ = 1', padL + 4, y1 - 6);

      rhos.forEach((r, i) => {
        const x = padL + i * barW + barW * 0.15;
        const bw = barW * 0.7;
        const y = rhoToY(r);
        const h = baseY - y;
        // 离 1 越远越红
        const dev = Math.min(Math.abs(r - 1) / 1.6, 1);
        ctx.beginPath();
        ctx.rect(x, y, bw, h);
        ctx.fillStyle = dev > 0.66 ? '#c43f52' : dev > 0.28 ? '#f07e47' : '#27446e';
        ctx.fill();
      });

      ctx.beginPath();
      ctx.moveTo(padL, baseY);
      ctx.lineTo(padL + barAreaW, baseY);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // —— 右区：e_B 表盘 ——
      const rx = 660;
      const cx = rx + 92;
      const cy = 132;
      const R = 66;

      // 外弧
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25);
      ctx.strokeStyle = '#e6ecdf';
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.stroke();

      // 已填充弧
      const ang = Math.PI * 0.75 + Math.PI * 1.5 * eB;
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.75, ang);
      ctx.strokeStyle = eB > 0.5 ? '#228d5c' : '#c43f52';
      ctx.lineWidth = 13;
      ctx.stroke();

      // 指针
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * (R - 16), cy + Math.sin(ang) * (R - 16));
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#21324a';
      ctx.fill();

      // 读数
      ctx.textAlign = 'center';
      ctx.fillStyle = '#68778f';
      ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText('归一化有效样本量 e_B', cx, cy + R + 26);
      ctx.fillStyle = eB > 0.5 ? '#228d5c' : '#c43f52';
      ctx.font = '700 30px ui-monospace, monospace';
      ctx.fillText(eB.toFixed(3), cx, cy + 12);

      // 下界提示
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.fillText(`取值范围 [1/${N} = ${(1 / N).toFixed(3)}, 1]`, cx, cy + R + 44);

      // 右侧文字结论
      const tx = rx + 200;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#21324a';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(eB > 0.5 ? '这批数据很可信' : eB > 0.2 ? '可信度中等' : '这批数据很不靠谱', tx, 76);
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      const lines =
        eB > 0.5
          ? ['ρ 集中，样本权重均衡，', '整体信息量几乎没损失。']
          : eB > 0.2
          ? ['少数样本吃掉了大部分权重，', '实际有效样本比 |B| 少得多。']
          : ['个别 ρ 极大的样本垄断了权重，', '整批数据几乎只剩下几个样本在说话。'];
      lines.forEach((l, i) => ctx.fillText(l, tx, 100 + i * 17));
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

  const w = width / 100;
  const eBApprox = 1 / (1 + w * w * 6.5);
  const feedback =
    eBApprox > 0.5
      ? { cls: 'good', t: 'ρ 聚在 1 附近时，e_B 接近 1：整批 |B| 个样本都在贡献有效信息，权重也很均衡。' }
      : eBApprox > 0.2
      ? { cls: '', t: '分开始变宽，e_B 明显下滑。注意它是<b>指数级</b>塌缩的——分布宽度只加倍，有效样本量可能掉到几分之一。' }
      : { cls: 'bad', t: 'ρ 的尾巴一长，e_B 就塌到底部。此时 |B|=32 个样本，真正说话的可能不到 3 个。这个数字，正是我们接下来要用的那把尺子。' };

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-ess-measure" width={W} height={H} />
      <div className="ctrl">
        <label>
          ρ 分布宽度 <span className="val">{w.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.t }} />
    </div>
  );
}
