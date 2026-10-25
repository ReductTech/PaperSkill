import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad, easeOutCubic, lerp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawCrew,
  drawHome,
  drawVerdict,
  drawCrossMark,
  drawCheckMark,
  drawSceneLabel,
  drawLegend,
} from './movingKit';
import type { WidgetProps } from './registry';

// Ch.1 module 1.1 — synchronized two-lane comparison (P3).
// One shared clock (~2.2 s): TOP = the old route (in-lab-only VLA: spotless
// training room, red cross on the new-home door, shrugging crew); BOTTOM =
// π0.5 (unseen home tidies 0 → 0.9 with coach+worker and a 10-15 分钟 badge).
const W = 1080;
const H = 280;
const DUR = 2200;

type Phase = 'idle' | 'run' | 'done';

const FEEDBACK: Record<Phase, { text: string; cls: string }> = {
  idle: { text: '按开始，看两种队伍推开门的表现。', cls: '' },
  run: {
    text: '同一声哨响同时出发：旧路线在新家门口摊手，π0.5 已经推门开扫。',
    cls: '',
  },
  done: {
    text: '此前所有 VLA 评测都发生在『像训练环境』的地方——π0.5 第一次把<b>端到端评测</b>搬进从未见过的真实家庭。',
    cls: 'good',
  },
};

export const Ch1Openworld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>('idle');
  const startRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const pill = (x: number, y: number, text: string, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '12px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - 9, y - 11, tw + 18, 22, 11);
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.restore();
    };

    const render = (ms: number) => {
      // shared clock for both lanes
      let p = 0;
      if (phaseRef.current !== 'idle' && startRef.current !== null) {
        p = clamp((ms - startRef.current) / DUR, 0, 1);
        if (p >= 1 && phaseRef.current === 'run') {
          phaseRef.current = 'done';
          setPhase('done');
        }
      }
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // lane divider + lane labels
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 140);
      ctx.lineTo(W, 140);
      ctx.stroke();
      drawSceneLabel(ctx, '旧路线', 16, 22, { color: C.red });
      drawSceneLabel(ctx, 'π0.5', 16, 162, { color: C.green });
      drawLegend(ctx, [['熟悉=满分', C.green], ['新家=失灵', C.red]], 480, 22);

      const walk = easeInOutQuad(clamp(p / 0.45, 0, 1));

      // ---- TOP lane: old route ----
      drawHome(ctx, 60, 46, 150, 88, { familiar: true, tidy01: 0.95 });
      for (let k = 0; k < 3; k++) drawCheckMark(ctx, 100 + k * 42, 34, 7);
      drawHome(ctx, 770, 38, 165, 96, { familiar: false, tidy01: 0.15 });
      const crossA = clamp((p - 0.6) / 0.25, 0, 1);
      if (crossA > 0) {
        ctx.save();
        ctx.globalAlpha = crossA;
        drawCrossMark(ctx, 852, 88, 15);
        ctx.restore();
      }
      const oldX = lerp(250, 690, walk);
      drawCrew(ctx, oldX, 126, 1.5, {
        mode: walk >= 1 ? 'shrug' : 'work',
        t: ms / 300,
        color: C.red,
      });
      const vTop = clamp((p - 0.85) / 0.15, 0, 1);
      if (vTop > 0) {
        ctx.save();
        ctx.globalAlpha = vTop;
        drawVerdict(ctx, 1010, 90, false, { pulse: ms / 500 });
        ctx.restore();
      }

      // ---- BOTTOM lane: π0.5 ----
      const tidy = 0.9 * easeOutCubic(clamp((p - 0.35) / 0.6, 0, 1));
      drawHome(ctx, 800, 178, 160, 92, { familiar: false, tidy01: tidy });
      const badgeA = clamp((p - 0.62) / 0.2, 0, 1);
      if (badgeA > 0) pill(880, 152, '10-15 分钟', C.green, badgeA);
      const newX = lerp(230, 700, walk);
      drawCrew(ctx, newX, 266, 1.45, { mode: 'coach', t: ms / 300, color: C.green });
      drawCrew(ctx, newX + 44, 266, 1.45, { mode: 'work', t: ms / 260, color: C.green });
      const vBot = clamp((p - 0.85) / 0.15, 0, 1);
      if (vBot > 0) {
        ctx.save();
        ctx.globalAlpha = vBot;
        drawVerdict(ctx, 1015, 226, true, { pulse: ms / 500 });
        ctx.restore();
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    startRef.current = performance.now();
    phaseRef.current = 'run';
    setPhase('run');
  };

  const fb = FEEDBACK[phase];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="step-ctrl">
          <span className="step-label">
            两条队伍 · <b>同一时钟</b>
          </span>
          <button className="tiny" onClick={onStart}>
            {phase === 'idle' ? '开始' : '重放'}
          </button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`} dangerouslySetInnerHTML={{ __html: fb.text }} />
    </div>
  );
};

export default Ch1Openworld;
