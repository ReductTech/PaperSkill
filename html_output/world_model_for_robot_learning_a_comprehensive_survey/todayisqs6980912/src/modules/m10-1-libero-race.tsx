import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { PALETTE, drawScene, drawLegend, drawSceneLabel } from './theme-kit';
import type { WidgetProps } from './registry';

// 模块 10.1 LIBERO 成功率竞速（P8 结果竞速）：六方法同协议平均成功率
// 竞速条 + 长时程放大镜（TriVLA 平均 87.0 → Long 73.2）。
// 数字为原论文标准协议下直接报告值，不作跨协议比较。

const W = 760;
const H = 340;

const METHODS = [
  { name: 'Cosmos Policy', v: 98.5, d: 2.6 },
  { name: 'LingBot-VA', v: 98.5, d: 2.2 },
  { name: 'Say-Dream-ACT', v: 98.1, d: 2.9 },
  { name: 'Motus', v: 97.7, d: 2.4 },
  { name: 'VLA-JEPA', v: 97.2, d: 3.1 },
  { name: 'TriVLA', v: 87.0, d: 1.8 },
];
const MAG = [
  { name: 'TriVLA 平均', v: 87.0, color: PALETTE.orange },
  { name: 'TriVLA Long', v: 73.2, color: PALETTE.red },
  { name: 'Cosmos 平均', v: 98.5, color: PALETTE.blue },
  { name: 'Cosmos Long', v: 97.6, color: PALETTE.blue },
];
const RUN_S = 3.4; // 竞速总时长（含最长者）

export const M101LiberoRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as 'idle' | 'run' | 'done', t: 0, last: 0, mag: 0 });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'run' | 'done'>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const TX = 158;
    const TW = 404;
    const VX = TX + TW + 10;

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 10 });
      drawLegend(ctx, 28, 28, [
        { color: PALETTE.blue, text: '平均' },
        { color: PALETTE.red, text: 'Long' },
      ]);

      // 六条赛道
      METHODS.forEach((m, i) => {
        const y = 56 + i * 21;
        const u = clamp(s.t / m.d, 0, 1);
        const val = m.v * easeOutCubic(u);
        const isFocus = m.name === 'TriVLA';
        drawSceneLabel(ctx, TX - 10, y + 7, m.name, {
          size: 12,
          align: 'right',
          color: isFocus ? PALETTE.orange : PALETTE.ink,
        });
        ctx.fillStyle = PALETTE.grid;
        ctx.fillRect(TX, y, TW, 13);
        ctx.fillStyle = isFocus ? PALETTE.orange : PALETTE.blue;
        ctx.fillRect(TX, y, TW * (val / 100), 13);
        if (isFocus) {
          ctx.save();
          ctx.strokeStyle = PALETTE.orange;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(TX - 0.5, y - 2, TW + 1, 17);
          ctx.restore();
        }
        drawSceneLabel(ctx, VX, y + 7, u >= 1 ? m.v.toFixed(1) : val.toFixed(1), {
          size: 12,
          color: isFocus ? PALETTE.orange : PALETTE.muted,
        });
      });

      // 长时程放大镜（done 后点亮）
      const magOn = s.phase === 'done';
      drawSceneLabel(ctx, 158, 196, magOn ? '长时程放大镜：Long 套件' : '长时程放大镜（竞速后点亮）', {
        size: 13,
        color: magOn ? PALETTE.ink : PALETTE.grid,
      });
      MAG.forEach((g, i) => {
        const y = 212 + i * 24;
        const val = g.v * easeOutCubic(s.mag);
        drawSceneLabel(ctx, 252, y + 7, g.name, {
          size: 12,
          align: 'right',
          color: magOn ? PALETTE.ink : PALETTE.grid,
        });
        ctx.fillStyle = PALETTE.grid;
        ctx.fillRect(260, y, TW - 60, 12);
        ctx.fillStyle = magOn ? g.color : PALETTE.grid;
        ctx.fillRect(260, y, (TW - 60) * (val / 100), 12);
        drawSceneLabel(ctx, 260 + TW - 60 + 10, y + 7, magOn ? g.v.toFixed(1) : '—', {
          size: 12,
          color: magOn ? g.color : PALETTE.grid,
        });
        if (g.name === 'TriVLA Long' && magOn && s.mag > 0.95) {
          drawSceneLabel(ctx, 260 + TW - 60 + 52, y + 7, '↓ 13.8', {
            size: 12,
            color: PALETTE.red,
          });
        }
      });

      // 协议注记
      drawSceneLabel(
        ctx,
        40,
        H - 14,
        'LIBERO 4 套件任务成功率，原论文标准协议下报告，越高越好；不同组别方法不完全互斥，不作跨协议比较。',
        { size: 11 }
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (ms: number) => {
      const s = stateRef.current;
      if (s.last === 0) s.last = ms;
      const dt = (ms - s.last) / 1000;
      s.last = ms;
      if (s.phase === 'run') {
        s.t += dt;
        if (s.t >= RUN_S) {
          s.phase = 'done';
          setPhase('done');
        }
      } else if (s.phase === 'done') {
        s.mag = clamp(s.mag + dt / 0.7, 0, 1);
      }
      render();
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

  const onRun = () => {
    const s = stateRef.current;
    if (s.phase === 'run') return;
    s.phase = 'run';
    s.t = 0;
    s.last = 0;
    s.mag = 0;
    setPhase('run');
  };

  const fb =
    phase === 'idle'
      ? { text: '点击开始：同一张考卷，六位考生。', cls: '' }
      : phase === 'run'
      ? { text: '竞速中……', cls: '' }
      : {
          text: '平均分咬得很紧——范式没有唯一赢家；真正的分水岭在长时程 Long：TriVLA 平均 87.0，Long 只剩 73.2。',
          cls: 'good',
        };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={onRun} disabled={phase === 'run'}>
          {phase === 'run' ? '竞速中……' : phase === 'done' ? '重新竞速' : '开始竞速'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M101LiberoRace;
