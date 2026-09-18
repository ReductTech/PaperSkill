import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawScoreboard, drawScoreCell, drawHourglass, drawTimeBadge, drawBiasCoin,
  drawCurveAxis, drawCurve, drawBar, drawBars, drawLabel, drawLegend,
} from '../canvas-scene';

const W = 1080;
const H = 280;

// 10.1 Prism 对抗赛：画布给四条跑道，DOM 表格补齐每个模型的名字与规模。
type Row = { name: string; size: string; v: number; color: string };
const SETS: Record<string, { title: string; max: number; rows: Row[]; note: string }> = {
  image: {
    title: '图像描述 · Prism 平均分（越高越好）',
    max: 48.3,
    note: '协议：Prism 解耦 VQA，阶段 2 作答模型固定为微调后的 Qwen2.5-3B-Instruct。',
    rows: [
      { name: 'Qwen2.5-VL-3B', size: '3B', v: 39.9, color: C.red },
      { name: 'Qwen2.5-VL-7B', size: '7B', v: 44.9, color: C.muted },
      { name: 'Qwen2.5-VL-72B', size: '72B', v: 48.3, color: C.blue },
      { name: 'CapRL++（基于 3B）', size: '3B + RL', v: 48.3, color: C.green },
    ],
  },
  video: {
    title: '视频描述 · Prism 平均分（越高越好）',
    max: 47.5,
    note: '协议：Prism 解耦 VQA，阶段 2 作答模型固定；与图像组题目不同，数值不可跨组比较。',
    rows: [
      { name: 'Qwen3-VL-4B', size: '4B', v: 41.2, color: C.red },
      { name: 'Qwen3-VL-32B', size: '32B', v: 46.9, color: C.muted },
      { name: 'Qwen3-VL-235B-A22B', size: '235B (A22B)', v: 46.0, color: C.blue },
      { name: 'CapRL++（基于 4B）', size: '4B + RL', v: 47.5, color: C.green },
    ],
  },
};

export const Mod101: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ set: 'image' as 'image' | 'video', running: false, prog: 0 });
  const [set, setSet] = useState<'image' | 'video'>('image');
  const [running, setRunning] = useState(false);
  const [fb, setFb] = useState({ text: '按「开始比较」，让四个模型从同一基线跑分。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    let t0 = 0;
    const loop = (now: number) => {
      const s = stateRef.current;
      if (s.running) {
        if (!t0) t0 = now;
        s.prog = clamp((now - t0) / 1800, 0, 1);
        if (s.prog >= 1) {
          s.running = false;
          t0 = 0;
          setRunning(false);
          setFb(
            s.set === 'image'
              ? { text: '同样 3B 规模，加上 CapRL++ 后 Prism 平均分从 39.9 升到 48.3，追平 72B。', cls: 'good' }
              : { text: '同样 4B 规模，加上 CapRL++ 后平均分 47.5，高于 32B（46.9）与 235B-A22B（46.0）。', cls: 'good' }
          );
        }
      }
      draw(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const draw = (ctx: CanvasRenderingContext2D, s: { set: 'image' | 'video'; running: boolean; prog: number }) => {
    gameField(ctx, W, H);
    const cfg = SETS[s.set];
    for (let i = 0; i < cfg.rows.length; i++) {
      const r = cfg.rows[i];
      const y = 26 + i * 58;
      drawBar(ctx, 420, y, 420, 30, (r.v / cfg.max) * s.prog, r.color);
    }
    // 终点线
    ctx.save();
    ctx.strokeStyle = C.frame;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(840, 16);
    ctx.lineTo(840, 254);
    ctx.stroke();
    ctx.restore();
    // 图例 + 序号（名称在下方表格里）
    drawLegend(
      ctx,
      [
        { label: '基线', color: C.red },
        { label: '更大模型', color: C.blue },
        { label: 'CapRL++', color: C.green },
      ],
      420,
      258
    );
  };

  const startRace = () => {
    stateRef.current.running = true;
    stateRef.current.prog = 0;
    setRunning(true);
    setFb({ text: '四条跑道共用同一横轴、同一套题目，从 0 一起填充。', cls: '' });
  };

  const cfg = SETS[set];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          基准组 <span className="val">{cfg.title}</span>
        </label>
        <div className="chip-row">
          <button
            className={`chip ${set === 'image' ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current = { set: 'image', running: false, prog: 0 };
              setSet('image');
              setRunning(false);
              setFb({ text: '图像组：题组与视频组不同，数字不能跨组比较。', cls: '' });
            }}
          >
            图像描述（Prism）
          </button>
          <button
            className={`chip ${set === 'video' ? 'selected' : ''}`}
            onClick={() => {
              stateRef.current = { set: 'video', running: false, prog: 0 };
              setSet('video');
              setRunning(false);
              setFb({ text: '视频组：题组与图像组不同，数字不能跨组比较。', cls: '' });
            }}
          >
            视频描述（Prism）
          </button>
        </div>
        <button className="chip selected" onClick={startRace} disabled={running}>
          {running ? '比较中…' : '开始比较'}
        </button>
      </div>
      <table className="paper">
        <thead>
          <tr>
            <th>模型</th>
            <th>规模</th>
            <th>Prism 平均分</th>
            <th>相对同规模基线</th>
          </tr>
        </thead>
        <tbody>
          {cfg.rows.map((r, i) => (
            <tr key={r.name}>
              <td style={{ color: r.color }}>{r.name}</td>
              <td>{r.size}</td>
              <td>{r.v.toFixed(1)}</td>
              <td>{i === 0 ? '—' : (r.v - cfg.rows[0].v >= 0 ? '+' : '') + (r.v - cfg.rows[0].v).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="module-desc" style={{ marginTop: 8 }}>
        {cfg.note}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod101;
