import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 8 章类比卡：修正环节的时机（560x150）
// 语境对齐：类比文案讲"在显影/定影/晾干的哪一步加修正液"，
// 因此动画改为暗房流程时间轴——修正液逐站滴落，越早加细节保留越多。
// （旧版画的是"镜头微调+光束"，与文案不符，且文字画出画布外/压在光束上。）
const W = 560;
const H = 150;

// 时间轴节点：x 位置、名称、细节保留程度与颜色
const STAGES = [
  { x: 320, label: '显影', keep: '保留多', color: '#228d5c' },
  { x: 410, label: '定影', keep: '保留中', color: '#e0a33e' },
  { x: 500, label: '晾干', keep: '保留少', color: '#c43f52' },
];
const AXIS_Y = 100;      // 时间轴 y
const NODE_R = 13;
const STAGE_MS = 1800;   // 每站停留时长
const DROP_FROM = 58;    // 液滴起始 y
const DROP_TO = AXIS_Y - NODE_R - 2;

export const Ch9Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = './images/analogy_lens.png';
    img.onload = () => { imgRef.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 左：放大机实拍图（暗房场景锚点）
      const ix = 20, iy = 14, iw = 220, ih = 104;
      if (imgRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
        ctx.clip();
        const iwid = imgRef.current.width, ihgt = imgRef.current.height;
        const scale = Math.max(iw / iwid, ih / ihgt);
        const sw = iw / scale, sh = ih / scale;
        const sx = (iwid - sw) / 2, sy = (ihgt - sh) / 2;
        ctx.drawImage(imgRef.current, sx, sy, sw, sh, ix, iy, iw, ih);
        ctx.restore();
      }
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('放大机（暗房修正）', ix + 6, iy + ih + 20);

      // 右：标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('修正时机 → 细节保留', 272, 30);

      // 时间轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(STAGES[0].x - 20, AXIS_Y);
      ctx.lineTo(STAGES[STAGES.length - 1].x + 20, AXIS_Y);
      ctx.stroke();

      // 当前站（循环：显影→定影→晾干）
      const stageIdx = Math.floor(t / (STAGE_MS / 1000)) % STAGES.length;
      const local = (t % (STAGE_MS / 1000));
      const active = STAGES[stageIdx];

      // 节点：当前站高亮描边，其余淡色
      STAGES.forEach((st, i) => {
        const isOn = i === stageIdx;
        ctx.beginPath();
        ctx.arc(st.x, AXIS_Y, NODE_R, 0, Math.PI * 2);
        ctx.fillStyle = isOn ? st.color : '#ffffff';
        ctx.globalAlpha = isOn ? 0.18 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = isOn ? st.color : '#c3ccd9';
        ctx.lineWidth = isOn ? 2.5 : 2;
        ctx.stroke();
        // 名称 + 保留程度（分两行，避开时间轴与液滴）
        ctx.textAlign = 'center';
        ctx.fillStyle = '#21324a';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(st.label, st.x, AXIS_Y + 26);
        ctx.fillStyle = st.color;
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillText(st.keep, st.x, AXIS_Y + 42);
        ctx.textAlign = 'left';
      });

      // 修正液滴落：前 0.5s 下落（ease-in），随后涟漪扩散
      const dropP = Math.min(1, local / 0.5);
      if (local < 0.5) {
        const dy = DROP_FROM + (DROP_TO - DROP_FROM) * dropP * dropP;
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.moveTo(active.x, dy - 10);
        ctx.lineTo(active.x + 5, dy - 1);
        ctx.lineTo(active.x - 5, dy - 1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(active.x, dy + 1, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (local < 1.3) {
        const rp = (local - 0.5) / 0.8;
        ctx.strokeStyle = '#f07e47';
        ctx.globalAlpha = 0.45 * (1 - rp);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(active.x, AXIS_Y, NODE_R + rp * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const tick = (time: number) => {
      render(time / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch9Ana;
