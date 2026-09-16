import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawLogbook,
  drawBars,
  drawLegend,
  drawSceneLabel,
} from './lighthouseKit';
import type { WidgetProps } from './registry';

// Module 6.1 — 把信任变成检索时的判断（P1 实时滑块）。
// 距上次核验 0–180 天，默认 7 天；实时更新 Canvas 与反馈。

const W = 1080;
const H = 300;

const fmt = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

export const Mod61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ days: 7 });
  const rafRef = useRef<number | null>(null);
  const [days, setDays] = useState(7);
  const [feedback, setFeedback] = useState({ text: '拖动滑块，看检索排序分如何随核验间隔变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { days: number }) => {
      clearScene(ctx, W, H);

      // 左侧：航海日志记录，当前条目按新鲜/临界/过期着色
      const lx = 20, ly = 24, lw = 300, lh = 200, rows = 3;
      drawLogbook(ctx, lx, ly, lw, lh, rows);
      const gap = lh / (rows + 1);
      const rowY = ly + gap * 1;
      const st = s.days <= 30 ? C.hit : s.days <= 90 ? C.mark : C.miss;
      ctx.fillStyle = st;
      ctx.fillRect(lx, rowY - 12, 5, 14);

      // 右侧三条证据条
      const rel = 0.85;
      const decay = 0.85 * Math.exp(-s.days / 90);
      const conf = 0.9 * (1 - 0.5 * Math.min(1, s.days / 120));
      drawBars(ctx, 360, 30, 690, [
        { label: '相关性得分', value: rel, color: C.beam },
        { label: '过期惩罚后', value: decay, color: C.mark },
        { label: '置信度风险项', value: conf, color: C.miss },
      ]);

      // 底部：合成最终排序分横条 + C.mark 阈值线（对应 days=90）
      const score = Math.min(decay, conf);
      const THRESHOLD = 0.85 * Math.exp(-90 / 90);
      const bx = 360, by = 200, bw = 690, bh = 16;
      ctx.fillStyle = C.line;
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = score >= THRESHOLD ? C.hit : C.miss;
      ctx.fillRect(bx, by, bw * Math.min(1, Math.max(0, score)), bh);
      ctx.strokeStyle = C.mark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + bw * THRESHOLD, by - 6);
      ctx.lineTo(bx + bw * THRESHOLD, by + bh + 6);
      ctx.stroke();
      drawSceneLabel(ctx, bx, by + bh + 18, '最终排序分');
      drawSceneLabel(ctx, bx + bw * THRESHOLD - 28, by - 12, '阈值线');

      // 图例：日志当前条目的三种状态
      drawLegend(ctx, lx, 244, [
        { color: C.hit, label: '新鲜' },
        { color: C.mark, label: '临界' },
        { color: C.miss, label: '过期' },
      ]);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = Number(e.target.value);
    stateRef.current.days = d;
    setDays(d);
    if (d <= 30) setFeedback({ text: '刚核验过，可以直接当作可信输入。', cls: 'good' });
    else if (d <= 90) setFeedback({ text: '开始进入可疑区间：建议把取回内容当作假设。', cls: '' });
    else setFeedback({ text: '已越过阈值：必须对照当前环境重新核验，否则就是在用**过时却自信**的记录。', cls: 'bad' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          距上次核验 <span className="val">{days} 天</span>
        </label>
        <input type="range" min={0} max={180} value={days} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: fmt(feedback.text) }} />
    </div>
  );
};

export default Mod61;
