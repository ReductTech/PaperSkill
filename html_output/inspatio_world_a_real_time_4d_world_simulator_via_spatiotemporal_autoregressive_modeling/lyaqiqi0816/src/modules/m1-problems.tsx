import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawRoadH,
  drawCar,
  drawLighthouse,
  sceneLabel,
  inset,
} from './scene-kit';

const W = 560;
const H = 270;

type ProbId = 'memory' | 'control' | 'realtime';

interface Prob {
  id: ProbId;
  chip: string;
  title: string;
  feedback: string;
  solved: string;
}

const PROBS: Prob[] = [
  {
    id: 'memory',
    chip: '① 记不住走过的空间',
    title: '难题一：走回去，世界却变了',
    feedback:
      '往前走再折返，本该原地不动的灯塔却换了位置和样子——模型没有把「已经生成的世界」记住。→ 第 4、5 章：隐式时空缓存。',
    solved: '第 4、5 章 · 隐式时空缓存',
  },
  {
    id: 'control',
    chip: '② 操作对不上相机',
    title: '难题二：让你转 30°，它只转 12°',
    feedback:
      '你给的是明确的相机指令，模型却只能「大概往那边」——轨迹误差随时间累积，精确取景无从谈起。→ 第 6 章：显式空间约束。',
    solved: '第 6 章 · 显式空间约束',
  },
  {
    id: 'realtime',
    chip: '③ 实时与真实二选一',
    title: '难题三：又快又真，为何不可兼得',
    feedback:
      '要实时就得用合成数据教出的小模型，画面发假；要真实就得慢慢算，交互就断了。→ 第 7 章：JDMD 双教师蒸馏。',
    solved: '第 7 章 · JDMD 双教师蒸馏',
  },
];

export const M1Problems: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ prob: 'memory' as ProbId });
  const rafRef = useRef<number | null>(null);
  const [prob, setProb] = useState<ProbId>('memory');
  const [feedback, setFeedback] = useState(PROBS[0].feedback);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // --- ① spatial memory: drive out past a landmark, come back, it changed ---
    const drawMemory = (time: number) => {
      const p = (time % 5200) / 5200;
      clearScene(ctx, W, H);
      const roadY = 192;
      drawRoadH(ctx, roadY, 16, 544, 26);
      const outbound = p < 0.42;
      const back = p >= 0.5;
      const changed = p >= 0.58;
      // landmark: original pose (ghost) and the drifted regenerated one
      if (changed) {
        ctx.globalAlpha = 0.3;
        drawLighthouse(ctx, 420, roadY - 16, 1);
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(0, -28);
        drawLighthouse(ctx, 478, roadY - 16, 0.72);
        ctx.restore();
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(396, roadY - 84, 122, 72);
        ctx.setLineDash([]);
        sceneLabel(ctx, '同一个地标，位置和样子都变了', 286, roadY - 96, false, 12);
        sceneLabel(ctx, '淡色＝出发时它本来的位置', 286, roadY + 42, true, 11);
      } else {
        drawLighthouse(ctx, 420, roadY - 16, 1);
        sceneLabel(ctx, '出发时看到的地标', 362, roadY - 62, true, 11);
      }
      // car: go right, pause, come back
      let carX: number;
      let facing = 1;
      if (outbound) {
        carX = 60 + easeInOutQuad(p / 0.42) * 300;
      } else if (!back) {
        carX = 360;
      } else {
        carX = 360 - easeInOutQuad(clamp((p - 0.5) / 0.42, 0, 1)) * 300;
        facing = -1;
      }
      ctx.save();
      if (facing < 0) {
        ctx.translate(carX * 2, 0);
        ctx.scale(-1, 1);
      }
      drawCar(ctx, carX, roadY - 2, 0.95, changed ? C.red : C.blue, Math.sin(time * 0.008) * 0.8);
      ctx.restore();
      // direction hint
      sceneLabel(ctx, outbound ? '① 向前漫游' : back ? '② 原路返回' : '', 24, 40, false, 13);
      if (changed) {
        ctx.fillStyle = C.red;
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillText('空间持久性丢失', 24, 62);
      }
    };

    // --- ② control precision: commanded pose vs actual pose ---
    // The two angles stay fixed so every frame is readable; only the car moves.
    const drawControl = (time: number) => {
      const p = (time % 3600) / 3600;
      const wanted = 30;
      const actual = 12;
      clearScene(ctx, W, H);
      sceneLabel(ctx, '你要的相机转角 vs 模型实际转角', 20, 28, false, 13);
      // camera fan on the left; labels live in a fixed legend so they never collide
      const cx = 120;
      const cy = 214;
      const R = 104;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - R - 8);
      ctx.stroke();
      // the gap between commanded and actual, as a filled wedge
      ctx.fillStyle = 'rgba(217,119,6,0.2)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(
        cx,
        cy,
        R * 0.68,
        -Math.PI / 2 + (actual * Math.PI) / 180,
        -Math.PI / 2 + (wanted * Math.PI) / 180
      );
      ctx.closePath();
      ctx.fill();
      const ray = (deg: number, color: string, dash: boolean) => {
        const a = -Math.PI / 2 + (deg * Math.PI) / 180;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (dash) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      ray(actual, C.red, false);
      ray(wanted, C.blue, true);
      // camera body at the pivot
      ctx.fillStyle = C.text;
      ctx.fillRect(cx - 11, cy - 6, 22, 13);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = C.bg;
      ctx.fill();
      // fixed legend
      const legend = (y: number, color: string, dash: boolean, text: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (dash) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(50, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.fillText(text, 56, y + 4);
      };
      legend(56, C.blue, true, `指令：转 ${wanted}°`);
      legend(78, C.red, false, `实际：只转 ${actual}°`);
      ctx.fillStyle = C.orange;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText(`偏差 ${wanted - actual}°`, 20, 104);
      // road view on the right: intended path vs the path actually taken
      inset(ctx, 250, 48, 294, 190);
      ctx.save();
      ctx.beginPath();
      ctx.rect(250, 48, 294, 190);
      ctx.clip();
      const bx = 306;
      const by = 226;
      const bendOf = (deg: number) => (deg / 30) * 118;
      const path = (deg: number, color: string, dash: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        if (dash) ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 34, by - 92, bx + bendOf(deg), by - 152);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      // red (actual) first so the blue intended path always stays visible on top
      path(actual, C.red, false);
      path(wanted, C.blue, true);
      const wEnd = bx + bendOf(wanted);
      const aEnd = bx + bendOf(actual);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(aEnd, by - 152);
      ctx.lineTo(wEnd, by - 152);
      ctx.stroke();
      ctx.fillStyle = C.orange;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('轨迹误差', (aEnd + wEnd) / 2 - 26, by - 160);
      // the car travels along the red path each loop
      const t = easeInOutQuad(p);
      const mt = 1 - t;
      const carX = mt * mt * bx + 2 * mt * t * (bx + 34) + t * t * aEnd;
      const carY = mt * mt * by + 2 * mt * t * (by - 92) + t * t * (by - 152);
      drawCar(ctx, carX, carY, 0.6, C.red, 0);
      ctx.restore();
      sceneLabel(ctx, '蓝色虚线＝你要的轨迹　　红色＝实际走出的轨迹', 252, 256, true, 11);
    };

    // --- ③ real-time vs realism trade-off ---
    const drawRealtime = (time: number) => {
      const p = (time % 3600) / 3600;
      clearScene(ctx, W, H);
      const TOP = 68;
      const BOT = 216;
      const panel = (x0: number, fast: boolean) => {
        ctx.fillStyle = C.text;
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.fillText(fast ? '快，但画面发假' : '真，但跟不上手', x0 + 6, TOP - 10);
        inset(ctx, x0, TOP, 232, BOT - TOP);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, TOP, 232, BOT - TOP);
        ctx.clip();
        if (fast) {
          // posterized: a few flat bands instead of a smooth, detailed hill
          const bands = ['#dfe4da', '#d3dacd', '#c8d1c2'];
          for (let i = 0; i < bands.length; i++) {
            ctx.fillStyle = bands[i];
            ctx.fillRect(x0, TOP + 42 + i * 14, 232, 14);
          }
        } else {
          ctx.fillStyle = C.hill;
          ctx.beginPath();
          ctx.moveTo(x0, TOP + 56);
          ctx.quadraticCurveTo(x0 + 116, TOP + 26, x0 + 232, TOP + 54);
          ctx.lineTo(x0 + 232, BOT);
          ctx.lineTo(x0, BOT);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = C.hillDark;
          for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(x0 + 14 + i * 20, TOP + 64 + ((i * 17) % 16), 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        drawRoadH(ctx, BOT - 22, x0, x0 + 232, 18);
        const carX = x0 + 24 + ((fast ? p : (p * 0.28) % 1) % 1) * 180;
        drawCar(ctx, carX, BOT - 24, 0.62, fast ? C.blue : C.green, 0);
        ctx.restore();
        // fps gauge under the panel
        const fps = fast ? 24 : 2;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 6, BOT + 12, 220, 12);
        ctx.fillStyle = fast ? C.green : C.red;
        ctx.fillRect(x0 + 6, BOT + 12, 220 * (fps / 24), 12);
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(`${fps} FPS`, x0 + 6, BOT + 40);
        ctx.fillStyle = fast ? C.red : C.green;
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillText(fast ? '纹理被抹平' : '纹理真实', x0 + 152, BOT + 40);
      };
      sceneLabel(ctx, '现有方案里，实时与真实是一场零和游戏', 20, 28, false, 13);
      panel(20, true);
      panel(308, false);
      // the "pick one" marker between panels
      ctx.fillStyle = C.red;
      ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
      ctx.fillText('⇄', 265, 142);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('二选一', 255, 166);
    };

    const render = (s: { prob: ProbId }, time: number) => {
      if (s.prob === 'memory') drawMemory(time);
      else if (s.prob === 'control') drawControl(time);
      else drawRealtime(time);
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

  const pick = (p: Prob) => {
    stateRef.current.prob = p.id;
    setProb(p.id);
    setFeedback(p.feedback);
  };

  const current = PROBS.find((p) => p.id === prob) as Prob;

  return (
    <div>
      <div className="chip-row">
        {PROBS.map((p) => (
          <button
            key={p.id}
            className={`chip ${prob === p.id ? 'selected' : ''}`}
            onClick={() => pick(p)}
          >
            {p.chip}
          </button>
        ))}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="prob-title">{current.title}</div>
      <div className="feedback bad">{feedback}</div>
      <div className="prob-solved">
        本文的解法：<b>{current.solved}</b>
      </div>
    </div>
  );
};

export default M1Problems;
