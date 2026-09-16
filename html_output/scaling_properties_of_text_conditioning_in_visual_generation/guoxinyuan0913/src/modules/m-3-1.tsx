import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clearScene, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

// §3 模块 3.1：重建探针 P3 同步前后对比（Figure 3 实测 DINOv3 数值）
const W = 1080, H = 280;
const RUNGS = ['L5', 'L6', 'L8', 'L10'];
const NL = [0.51, 0.48, 0.46, 0.51];   // NL 行 DINOv3（flat）
const SP = [0.41, 0.60, 0.61, 0.65];   // SP 行 DINOv3（上升）
const DUR = 2.4; // 秒，全程

export const M311: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const startT = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [rung, setRung] = useState(0);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const draw = (k: number) => {
      clearScene(ctx, W, H);
      const cur = Math.min(RUNGS.length - 1, Math.floor(k * RUNGS.length));
      drawPanel(ctx, 20, '散文 NL（同内容拉长）', NL, cur, false);
      drawPanel(ctx, 560, '结构化 SP（逐级恢复字段）', SP, cur, true);
      drawSceneLabel(ctx, `当前档位：${RUNGS[cur]}`, 20, 20);
    };
    draw(0);
    const step = (ts: number) => {
      if (startT.current === null) startT.current = ts;
      const k = Math.min(1, (ts - startT.current) / (DUR * 1000));
      setRung(Math.min(RUNGS.length - 1, Math.floor(k * RUNGS.length)));
      draw(k);
      if (k < 1 && running) raf.current = requestAnimationFrame(step);
    };
    if (running) {
      startT.current = null;
      raf.current = requestAnimationFrame(step);
    }
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [running]);

  return (
    <div className="widget">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W }} />
      <div className="ctrl-row">
        <button className="chip chip-on" disabled={running} onClick={() => setRunning(true)}>开始</button>
        <button className="chip" onClick={() => { setRunning(false); setRung(0); }}>重置</button>
      </div>
      <div className={`feedback ${running ? 'fb-green' : 'fb-blue'}`}>
        {!running
          ? '两侧都停在 L5——按「开始」同时走向 L10。'
          : rung >= 3
            ? 'NL：加长到 2130 tokens，重建几乎不动（0.51→0.51）｜SP：逐级恢复字段，DINOv3 0.41→0.65'
            : '进行中：左面板指标持平（灰），右面板逐级上升（绿）。'}
      </div>
    </div>
  );
};

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  title: string,
  vals: number[],
  cur: number,
  isSP: boolean
) {
  ctx.strokeStyle = isSP ? C.green : C.red;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, 40, 500, 210);
  ctx.fillStyle = C.text; ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
  ctx.fillText(title, x + 14, 66);
  // 迷你画布：临摹完成度
  const fill = isSP ? (vals[cur] - vals[0]) / (vals[vals.length - 1] - vals[0]) : 0.05;
  ctx.fillStyle = isSP ? C.green : C.muted;
  ctx.fillRect(x + 20, 160, 60 + fill * 60, 50);
  ctx.fillStyle = C.sheet;
  ctx.fillRect(x + 100, 160, 60, 50);
  // 指标数字（DINOv3）
  ctx.fillStyle = isSP ? C.green : C.red;
  ctx.font = 'bold 26px monospace';
  ctx.fillText(vals[cur].toFixed(2), x + 200, 200);
  ctx.fillStyle = C.muted; ctx.font = '12px "Microsoft YaHei", sans-serif';
  ctx.fillText('DINOv3 余弦（越高越好）', x + 200, 224);
  ctx.font = '12px monospace';
  vals.forEach((v, i) => {
    ctx.fillStyle = i <= cur ? (isSP ? C.green : C.red) : C.border;
    ctx.fillText(v.toFixed(2), x + 200 + i * 64, 250);
  });
}
