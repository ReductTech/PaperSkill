import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 380;
const H = 230;
const BG = '#fffaf1';
const INK = '#222222';
const PINK = '#ff3366';
const BLUE = '#33ccff';
const YELLOW = '#ffcc00';
const PURPLE = '#9933ff';

type RobotKind = 'understand' | 'generate' | 'edit';

const robots: Array<{ x: number; kind: RobotKind; title: string; note: string; color: string }> = [
  { x: 70, kind: 'understand', title: '理解', note: '只负责看懂', color: BLUE },
  { x: 190, kind: 'generate', title: '生成', note: '只负责造图', color: PINK },
  { x: 310, kind: 'edit', title: '编辑', note: '只负责修改', color: PURPLE },
];

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selectedRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const line = (x1: number, y1: number, x2: number, y2: number, width = 4) => {
      ctx.strokeStyle = INK; ctx.lineWidth = width; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    };

    const drawHead = (x: number, y: number, color: string) => {
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(x - 29 + 5, y - 25 + 5, 58, 48, 12); ctx.fill();
      ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(x - 29, y - 25, 58, 48, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x - 18, y - 12, 36, 17, 7); ctx.fill();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 8, y - 4, 3, 0, Math.PI * 2); ctx.arc(x + 8, y - 4, 3, 0, Math.PI * 2); ctx.fill();
      line(x, y - 25, x, y - 34, 3);
      ctx.fillStyle = YELLOW; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 37, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    };

    const drawRobot = (robot: typeof robots[number], index: number, t: number) => {
      const selected = selectedRef.current === index;
      const bounce = selected ? Math.sin(t / 220) * 3 : 0;
      const x = robot.x; const y = 89 + bounce;

      ctx.fillStyle = selected ? YELLOW : '#ffffff';
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(x - 42, 142, 84, 18, 9); ctx.fill(); ctx.stroke();
      drawHead(x, y, robot.color);
      line(x - 14, y + 24, x - 18, y + 45, 4); line(x + 14, y + 24, x + 18, y + 45, 4);
      line(x - 18, y + 45, x - 27, y + 45, 4); line(x + 18, y + 45, x + 27, y + 45, 4);

      if (robot.kind === 'understand') {
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 31, y + 18, 12, 0, Math.PI * 2); ctx.stroke();
        line(x + 39, y + 27, x + 48, y + 37, 5); line(x + 19, y + 9, x + 11, y + 19, 4);
      } else if (robot.kind === 'generate') {
        line(x + 19, y + 8, x + 32, y + 19, 4);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 24, y + 13, 28, 24, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = BLUE; ctx.beginPath(); ctx.moveTo(x + 27, y + 34); ctx.lineTo(x + 36, y + 24); ctx.lineTo(x + 42, y + 30); ctx.lineTo(x + 49, y + 21); ctx.lineTo(x + 49, y + 34); ctx.fill();
        ctx.fillStyle = YELLOW; ctx.beginPath(); ctx.arc(x + 43, y + 20, 3, 0, Math.PI * 2); ctx.fill();
      } else {
        line(x + 18, y + 9, x + 31, y + 20, 4);
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 39, y + 22, 8, .7, 5.6); ctx.stroke();
        line(x + 34, y + 29, x + 47, y + 41, 5);
        ctx.strokeStyle = YELLOW; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 50, y + 12); ctx.lineTo(x - 50, y + 27); ctx.lineTo(x - 35, y + 27); ctx.moveTo(x - 43, y + 5); ctx.lineTo(x - 43, y + 20); ctx.lineTo(x - 28, y + 20); ctx.stroke();
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = INK; ctx.font = '800 14px "Segoe UI", sans-serif'; ctx.fillText(robot.title, x, 176);
      ctx.fillStyle = '#49434c'; ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillText(robot.note, x, 193);
    };

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
      robots.forEach((robot, index) => drawRobot(robot, index, t));

      // 放到机器人上方的间隙，避免与编辑机器人的裁剪工具重叠。
      [130, 250].forEach((x) => {
        ctx.strokeStyle = PINK; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 7, 39); ctx.lineTo(x + 7, 53); ctx.moveTo(x + 7, 39); ctx.lineTo(x - 7, 53); ctx.stroke();
      });

      const active = robots[selectedRef.current];
      ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(67, 207, 246, 18, 9); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${active.title}机器人无法调用另外两种能力`, W / 2, 216);
    };

    const onClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * W / rect.width;
      selectedRef.current = x < 130 ? 0 : x < 250 ? 1 : 2;
    };
    canvas.addEventListener('click', onClick);

    const tick = () => { render(performance.now()); canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); canvas.removeEventListener('click', onClick); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ cursor: 'pointer' }} aria-label="点击三台彼此断联的任务机器人" />;
};

export default HeroOld;
