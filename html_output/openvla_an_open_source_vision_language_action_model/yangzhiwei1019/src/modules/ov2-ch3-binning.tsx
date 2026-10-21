import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field } from './ov2-analogy';

const W = 1080;
const H = 280;

export const Ov2Ch3Binning: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ out: false });
  const [out, setOut] = useState(false);
  const [fb, setFb] = useState({ text: '先不注入异常值：两种定标都能用满 256 档。', cls: '' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const injected = stateRef.current.out;
      field(ctx, W, H);
      const panels = [
        { x: 50, name: 'min-max', usable: injected ? 12 : 256, frac: injected ? 2 / 41 : 1, color: injected ? V.red : V.blue },
        { x: 560, name: '分位数', usable: 256, frac: 1, color: V.green },
      ];
      panels.forEach((p) => {
        const w = 460;
        // 分布
        for (let i = 0; i < 24; i++) {
          const v = Math.exp(-Math.pow((i - 11) / 5, 2));
          ctx.fillStyle = i < 22 ? '#c9d3bd' : V.dark;
          ctx.fillRect(p.x + 8 + i * (w / 26), 188 - v * 116, w / 30, v * 116);
        }
        if (injected) {
          ctx.fillStyle = V.red;
          ctx.fillRect(p.x + w - 14, 56, 12, 132);
        }
        // 刻度槽
        const y = 212;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = V.line;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(p.x, y, w, 28);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(p.x, y, w * p.frac, 28);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        for (let i = 1; i < 32; i++) {
          const xx = p.x + (w * p.frac * i) / 32;
          ctx.beginPath();
          ctx.moveTo(xx, y + 4);
          ctx.lineTo(xx, y + 24);
          ctx.stroke();
        }
        ctx.fillStyle = V.ink;
        ctx.font = '600 16px "Segoe UI", sans-serif';
        ctx.fillText(p.name, p.x, 44);
        ctx.font = '700 28px "Segoe UI", sans-serif';
        ctx.fillText(String(p.usable), p.x + w - 66, 44);
      });
    });
  }, []);

  const toggle = () => {
    const next = !out;
    stateRef.current.out = next;
    setOut(next);
    setFb(
      next
        ? { text: '一个异常动作把区间拉到 [-1, 40]：min-max 只剩 12 档可用（红），分位数把它挡在框外，仍 256 档（绿）。此处的 12 是这一组数值的算术结果，用于说明机制。', cls: 'good' }
        : { text: '没有异常值时两种定标差不多；差别只在数据脏的时候暴露。', cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={toggle}>
          {out ? '移除离群动作' : '注入离群动作'}
        </button>
        <label>
          有效档位 <span className="val">{out ? '12 / 256' : '256 / 256'}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch3Binning;
