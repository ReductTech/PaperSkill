import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const AnalogyWidget: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    let raf: number | null = null;
    let t = 0;

    const label = (text: string, x = 14, y = 24) => {
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(text, x, y);
    };
    const card = (x: number, y: number, w: number, h: number, color: string, text: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(text, x + 8, y + h / 2 + 5);
    };
    const dot = (x: number, y: number) => {
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 118, W, 22);
      const p = (Math.sin(t) + 1) / 2;

      if (chapterId === 'chap-1') {
        label('菜单：三道菜');
        ['菜 A', '菜 B', '菜 C'].forEach((s, i) => card(20, 38 + i * 24, 90, 20, '#27446e', s));
        ctx.strokeStyle = '#c43f52';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(140, 38, 90, 68);
        ctx.setLineDash([]);
        label('菜单外', 150, 92);
        dot(120 + p * 40, 72);
      } else if (chapterId === 'chap-2') {
        label('照片与名字卡写成同一种编号');
        card(40, 55, 100, 40, '#27446e', '照片');
        card(300, 55, 130, 40, '#228d5c', '名字卡');
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, 75);
        ctx.lineTo(300, 75);
        ctx.stroke();
        dot(140 + p * 160, 75);
        ctx.fillStyle = '#68778f';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('编号越接近', 430, 75);
      } else if (chapterId === 'chap-3') {
        label('两座塔在顶层对望');
        card(80, 40, 60, 70, '#27446e', '图像');
        card(300, 40, 60, 70, '#228d5c', '文本');
        dot(110, 105 - p * 60);
        ctx.strokeStyle = '#92400e';
        ctx.beginPath();
        ctx.moveTo(140, 55);
        ctx.lineTo(300, 55);
        ctx.stroke();
      } else if (chapterId === 'chap-4') {
        label('逐字点名与互选同桌');
        for (let i = 0; i < 5; i++) card(30 + i * 90, 55, 60, 28, '#27446e', '词' + (i + 1));
        dot(50 + p * 420, 105);
      } else if (chapterId === 'chap-5') {
        label('配对表：对角线为正');
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            ctx.fillStyle = i === j ? '#228d5c' : '#d7deea';
            ctx.fillRect(40 + j * 26, 40 + i * 20, 22, 16);
          }
        }
        dot(52 + p * 70, 48 + p * 60);
      } else if (chapterId === 'chap-6') {
        label('评分标准：逐条比对');
        ['标准 1', '标准 2', '标准 3'].forEach((s, i) => card(40, 40 + i * 26, 160, 20, '#27446e', s));
        dot(240, 50 + p * 55);
      } else if (chapterId === 'chap-7') {
        label('自我介绍：补足语境');
        card(40, 50, 90, 50, '#27446e', '名字');
        card(160, 50, 180, 50, '#228d5c', '名字 + 一句说明');
        dot(140 + p * 20, 75);
      } else if (chapterId === 'chap-8') {
        label('换更大的画布');
        ctx.strokeStyle = '#27446e';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, 200 + p * 200, 70);
        dot(60 + p * 160, 105);
      } else if (chapterId === 'chap-9') {
        const zones = [
          { bg: '#f5f8f0', text: '原图' },
          { bg: '#e6edf7', text: '换光线' },
          { bg: '#f7eee6', text: '换背景' },
        ];
        zones.forEach((z, i) => {
          ctx.fillStyle = z.bg;
          ctx.fillRect(i * 186, 0, 186, 118);
          ctx.fillStyle = '#68778f';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(z.text, i * 186 + 10, 18);
        });
        const x = 56 + p * 430;
        const zone = Math.min(2, Math.floor(x / 186));
        const angle = zone === 0 ? -0.12 : zone === 1 ? 0 : 0.12;
        ctx.save();
        ctx.translate(x, 74);
        ctx.rotate(angle);
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 18, -10);
          ctx.lineTo(s * 8, -32);
          ctx.lineTo(s * 2, -14);
          ctx.fill();
        });
        ctx.fillStyle = '#f5f8f0';
        ctx.beginPath();
        ctx.arc(-7, -3, 3, 0, Math.PI * 2);
        ctx.arc(7, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f5f8f0';
        ctx.lineWidth = 2;
        [-1, 1].forEach((s) => {
          ctx.beginPath();
          ctx.moveTo(s * 12, 6);
          ctx.lineTo(s * 28, 2);
          ctx.moveTo(s * 12, 10);
          ctx.lineTo(s * 28, 12);
          ctx.stroke();
        });
        ctx.restore();
        ctx.fillStyle = '#c43f52';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('模型可能误判', 400, 108);
      } else {
        ['贡献：规模与系统评测', '边界：追平而非领先', '局限：评测与协议'].forEach((s, i) => {
          ctx.fillStyle = i === 0 ? '#27446e' : i === 1 ? '#c43f52' : '#92400e';
          ctx.fillRect(40, 26 + i * 34, 300, 26);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px "Segoe UI", sans-serif';
          ctx.fillText(s, 50, 44 + i * 34);
        });
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('三层结论，逐层对应原文', 40, 132);
      }

      if (chapterId !== 'chap-10') {
        t += 0.025;
        raf = requestAnimationFrame(draw);
      }
    };

    const disconnect = observeCanvas(c, () => { if (!raf) raf = requestAnimationFrame(draw); }, () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    });
    return () => { if (raf) cancelAnimationFrame(raf); disconnect(); };
  }, [chapterId]);

  return <canvas id={`ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default AnalogyWidget;
