import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  drawBackground,
  drawTable,
  drawScale,
  drawWeight,
  drawTarget,
  drawLabel,
} from './scaleKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

// 每个章节的类比卡：同一"天平/砝码"主题下的一种简单生活化动作，自动循环。
export const AnalogyScale: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (t: number) => {
      const p = (t % 3000) / 3000; // 3 秒一个循环
      drawBackground(ctx, W, H);
      drawTable(ctx, W, H, 116);

      switch (chapterId) {
        case 'chap-1': {
          // 旧方法：直接四舍五入，砝码被削掉一块 → 天平倾斜
          const shave = 0.3 + 0.7 * Math.abs(Math.sin(p * Math.PI));
          const tilt = 0.22 * Math.abs(Math.sin(p * Math.PI));
          drawScale(ctx, W / 2, 72, 170, tilt, C.red);
          drawWeight(ctx, W / 2 - 170, 104, 34, Math.round(26 * (1 - shave * 0.4)), C.red);
          drawWeight(ctx, W / 2 + 170, 104, 34, 26, C.red);
          break;
        }
        case 'chap-2': {
          // 表示：查看秤臂刻度，远离支点的位置更"敏感"
          drawScale(ctx, W / 2, 72, 170, 0, C.blue);
          const markX = W / 2 - 170 + p * 340;
          const sens = Math.abs(markX - W / 2) / 170; // 离支点越远越敏感
          ctx.strokeStyle = C.axis;
          ctx.lineWidth = 2;
          for (let i = 0; i <= 8; i++) {
            const x = W / 2 - 170 + (i / 8) * 340;
            ctx.beginPath();
            ctx.moveTo(x, 68);
            ctx.lineTo(x, 76);
            ctx.stroke();
          }
          ctx.fillStyle = sens > 0.6 ? C.red : C.blue;
          ctx.beginPath();
          ctx.arc(markX, 72, 7, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'chap-3': {
          // 洞察：另一侧补一个砝码 → 天平回平
          const tilt = Math.sin(p * Math.PI) * 0.24;
          const restored = p > 0.55 ? 0 : tilt; // 后半段补上砝码后回平
          drawScale(ctx, W / 2, 72, 170, restored, p > 0.55 ? C.green : C.red);
          drawWeight(ctx, W / 2 - 170, 104, 34, 26, p > 0.55 ? C.green : C.red);
          drawWeight(ctx, W / 2 + 170, 104, 30, 20, p > 0.55 ? C.green : C.red);
          if (p > 0.55) drawWeight(ctx, W / 2 - 170, 82, 24, 16, C.green);
          break;
        }
        case 'chap-4': {
          // 数学：砝码离支点越远，杠杆作用越大（对应 Hessian 敏感度）
          const dist = Math.abs(Math.sin(p * Math.PI)); // 0~1 靠近/远离
          const x = W / 2 - 40 - dist * 120;
          const tilt = 0.05 + dist * 0.22;
          drawScale(ctx, W / 2, 72, 170, tilt, dist > 0.5 ? C.orange : C.blue);
          drawWeight(ctx, x, 108, 30, 22, dist > 0.5 ? C.orange : C.blue);
          drawWeight(ctx, W / 2 + 170, 104, 34, 26, C.envDark);
          break;
        }
        case 'chap-5': {
          // 方法：一次只配平一组（左侧三个砝码分组出现）
          const group = Math.floor(p * 4) % 4;
          drawScale(ctx, W / 2, 72, 170, group === 3 ? 0 : 0.16, group === 3 ? C.green : C.blue);
          for (let i = 0; i < 3; i++) {
            const on = i <= group;
            drawWeight(ctx, W / 2 - 190 + i * 22, 104, 18, 18, on ? C.green : C.envLight);
          }
          drawWeight(ctx, W / 2 + 170, 104, 34, 26, C.envDark);
          break;
        }
        case 'chap-6': {
          // 执行：固定顺序从左到右逐个配平
          const step = Math.floor(p * 5) % 5;
          drawScale(ctx, W / 2, 72, 170, 0, C.blue);
          for (let i = 0; i < 4; i++) {
            const on = i < step;
            drawWeight(ctx, W / 2 - 190 + i * 26, 102, 22, 20, on ? C.green : C.red);
          }
          drawWeight(ctx, W / 2 + 170, 104, 34, 26, C.envDark);
          break;
        }
        case 'chap-7': {
          // 算法：一张"配平对照表"逐格填满（预先算好补偿量）
          drawTable(ctx, W, H, 116);
          const cols = 6;
          const filled = Math.floor(p * (cols * 2));
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < cols; c++) {
              const idx = r * cols + c;
              const x = 90 + c * 66;
              const y = 52 + r * 36;
              ctx.fillStyle = idx < filled ? C.green : C.axis;
              ctx.fillRect(x, y, 48, 26);
              if (idx < filled) {
                ctx.fillStyle = '#fff';
                ctx.font = '16px "Segoe UI", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✓', x + 24, y + 18);
              }
            }
          }
          break;
        }
        case 'chap-8': {
          // 结果：三架天平比对 4-bit / 3-bit / 2-bit
          const xs = [120, 280, 440];
          const tilts = [0, 0.1, 0.26];
          const colors = [C.green, C.orange, C.red];
          xs.forEach((x, i) => {
            drawScale(ctx, x, 72, 74, tilts[i], colors[i]);
            drawWeight(ctx, x - 74, 100, 20, 18, colors[i]);
            drawWeight(ctx, x + 74, 100, 20, 18, colors[i]);
          });
          drawLabel(ctx, '4bit', 120, 128, C.green, 16);
          drawLabel(ctx, '3bit', 280, 128, C.orange, 16);
          drawLabel(ctx, '2bit', 440, 128, C.red, 16);
          break;
        }
        default:
          drawScale(ctx, W / 2, 72, 170, 0, C.blue);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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
  }, [chapterId]);

  return <canvas ref={canvasRef} width={W} height={H} aria-label="天平类比动画" />;
};

export default AnalogyScale;
