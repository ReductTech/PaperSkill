import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCar, sceneLabel, inset } from './scene-kit';

const W = 560;
const H = 260;

type Teacher = 'motion' | 'percept' | 'joint';

// §7 M7.1 — P4 chips: motion-only teacher (precise path, flattened textures),
// perceptual-only (rich scene, missed cones), joint JDMD (both). Schematic
// rendering of the paper's qualitative conclusions (§2, §3.3).
export const M7Teachers: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ teacher: 'motion' as Teacher });
  const rafRef = useRef<number | null>(null);
  const [teacher, setTeacher] = useState<Teacher>('motion');
  const [feedback, setFeedback] = useState({
    text: '合成数据教出的动作很准，但画面「塑料感」——这就是论文说的纹理平滑、感知退化。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const targetPath = (t: number) => ({
      x: 32 + t * 300,
      y: 130 + Math.sin(t * Math.PI * 3) * 34,
    });

    const render = (s: { teacher: Teacher }, time: number) => {
      const mode = s.teacher;
      const rich = mode !== 'motion';
      clearScene(ctx, W, H);
      // course area
      ctx.fillStyle = rich ? C.road : '#eceae4';
      ctx.fillRect(16, 70, 344, 130);
      ctx.strokeStyle = C.border;
      ctx.strokeRect(16, 70, 344, 130);
      if (!rich) {
        sceneLabel(ctx, '纹理被抹平', 250, 88, false, 11);
      } else {
        // richer scenery dots
        ctx.fillStyle = C.hillDark;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.arc(36 + i * 44, 78 + ((i * 13) % 12), 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // target S-path
      ctx.strokeStyle = C.border;
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.02) {
        const p = targetPath(t);
        if (t === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // cones
      for (let i = 0; i < 3; i++) {
        const cx = 96 + i * 100;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.moveTo(cx - 7, 140);
        ctx.lineTo(cx, 120);
        ctx.lineTo(cx + 7, 140);
        ctx.closePath();
        ctx.fill();
      }
      // actual path per mode
      const dev = mode === 'percept' ? 1 : 0;
      ctx.strokeStyle = dev ? C.red : C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.02) {
        const p = targetPath(t);
        const y = dev ? 130 + Math.sin(t * Math.PI * 3) * 14 : p.y;
        if (t === 0) ctx.moveTo(p.x, y);
        else ctx.lineTo(p.x, y);
      }
      ctx.stroke();
      if (dev) sceneLabel(ctx, '切内线，漏过第 2 桩', 130, 190, false, 11);
      const tt = (time % 3000) / 3000;
      const cp = targetPath(tt);
      const cy = dev ? 130 + Math.sin(tt * Math.PI * 3) * 14 : cp.y;
      ctx.globalAlpha = rich ? 1 : 0.75;
      drawCar(ctx, cp.x, cy, 0.7, dev ? C.red : C.blue, 0);
      ctx.globalAlpha = 1;
      // twin bars
      inset(ctx, 388, 40, 156, 180);
      sceneLabel(ctx, '控制精度', 400, 60, true, 11);
      sceneLabel(ctx, '画面保真', 472, 60, true, 11);
      const ctrl = mode === 'percept' ? 0.35 : 0.92;
      const fid = mode === 'motion' ? 0.35 : 0.92;
      const bar = (x: number, v: number) => {
        ctx.strokeStyle = C.border;
        ctx.strokeRect(x, 70, 34, 130);
        ctx.fillStyle = v > 0.7 ? C.green : C.red;
        ctx.fillRect(x, 70 + 130 * (1 - v), 34, 130 * v);
      };
      bar(406, ctrl);
      bar(478, fid);
      sceneLabel(
        ctx,
        mode === 'motion' ? '配置：只跟动作教练' : mode === 'percept' ? '配置：只跟画质教练' : '配置：JDMD 双教师',
        20,
        30,
        false,
        12
      );
      sceneLabel(ctx, '（柱状值为示意）', 396, 236, true, 10);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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

  const pick = (m: Teacher) => {
    stateRef.current.teacher = m;
    setTeacher(m);
    if (m === 'motion') {
      setFeedback({
        text: '合成数据教出的动作很准，但画面「塑料感」——这就是论文说的纹理平滑、感知退化。',
        cls: 'bad',
      });
    } else if (m === 'percept') {
      setFeedback({
        text: '真实数据的画面很美，但指令跟不准——控制与保真变成零和游戏。',
        cls: 'bad',
      });
    } else {
      setFeedback({
        text: 'JDMD：共享权重交替上两门课，真实分布做正则引导，控制与画质同时在线。',
        cls: 'good',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${teacher === 'motion' ? 'selected' : ''}`} onClick={() => pick('motion')}>
          只跟动作教练 (V2V)
        </button>
        <button className={`chip ${teacher === 'percept' ? 'selected' : ''}`} onClick={() => pick('percept')}>
          只跟画质教练 (T2V)
        </button>
        <button className={`chip ${teacher === 'joint' ? 'selected' : ''}`} onClick={() => pick('joint')}>
          两位都跟 (JDMD)
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M7Teachers;
