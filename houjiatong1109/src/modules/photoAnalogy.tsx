import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

export const PhotoAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    let ctx: CanvasRenderingContext2D | null = null;
    const resize = () => {
      const cssW = Math.max(1, Math.min(W, parent.clientWidth || W));
      const ratio = cssW / W;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${H * ratio}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(H * ratio * dpr);
      ctx = canvas.getContext('2d');
      ctx?.setTransform(dpr * ratio, 0, 0, dpr * ratio, 0, 0);
      draw();
    };

    let frame = 0;
    let raf = 0;
    const draw = () => {
      if (!ctx) return;
      const t = (frame % 180) / 180;
      const scene = Number(chapterId.replace('chap-', ''));
      ctx!.clearRect(0, 0, W, H);
      ctx!.fillStyle = '#fff5ef';
      ctx!.fillRect(0, 0, W, H);

      if (scene > 1 && scene < 5) {
        ctx!.fillStyle = '#21324a';
        ctx!.font = 'bold 17px Segoe UI, sans-serif';
        const labels = [
          ['', ''],
          ['叠放 RGB 透明片', '三层颜色共同表示一张输入图'],
          ['补上一笔残差', '在原有轮廓上只画变化部分'],
          ['擦去归一化步骤', '为低层视觉保留特征范围'],
          ['换用更宽画笔', '增加通道以扩展模型容量'],
          ['轻压笔尖', '缩小残差幅度让训练更稳'],
          ['借用 ×2 底稿', '再适配 ×3 或 ×4 放大'],
          ['共用底稿再选倍率', '只启用对应的放大分支'],
          ['翻转后对齐叠合', '满足对称退化时再平均'],
          ['并排核对成绩单', '只在相同协议内比较'],
        ][Math.max(1, Math.min(9, scene - 1))];
        ctx!.fillText(labels[0], 260, 50);
        ctx!.font = '14px Segoe UI, sans-serif'; ctx!.fillStyle = '#68778f';
        ctx!.fillText(labels[1], 260, 76);
        if (scene === 2) {
          ctx!.font = 'bold 15px Segoe UI, sans-serif';
          ctx!.fillStyle = '#c43f52'; ctx!.fillText('R', 48, 34);
          ctx!.fillStyle = '#228d5c'; ctx!.fillText('G', 108, 34);
          ctx!.fillStyle = '#27446e'; ctx!.fillText('B', 168, 34);
          [['#c43f52', 24, 43], ['#228d5c', 44, 63], ['#27446e', 64, 83]].forEach(([color, x, y]) => {
            ctx!.fillStyle = String(color); ctx!.fillRect(Number(x), Number(y), 168, 28);
            ctx!.strokeStyle = '#ffffff'; ctx!.lineWidth = 2; ctx!.strokeRect(Number(x), Number(y), 168, 28);
          });
        } else if (scene === 3) {
          ctx!.fillStyle = '#b8c9a7'; ctx!.fillRect(28, 32, 200, 76);
          ctx!.fillStyle = '#21324a'; ctx!.font = 'bold 14px Segoe UI, sans-serif'; ctx!.fillText('原图', 102, 76);
          ctx!.strokeStyle = '#f07e47'; ctx!.lineWidth = 7; ctx!.beginPath(); ctx!.moveTo(42, 115); ctx!.lineTo(95, 94); ctx!.lineTo(144, 115); ctx!.lineTo(214, 89); ctx!.stroke();
        } else if (scene === 4) {
          ctx!.fillStyle = '#27446e'; ctx!.fillRect(28, 50, 54, 42); ctx!.fillStyle = '#c43f52'; ctx!.fillRect(102, 50, 54, 42); ctx!.fillStyle = '#27446e'; ctx!.fillRect(176, 50, 54, 42);
          ctx!.strokeStyle = '#c43f52'; ctx!.lineWidth = 5; ctx!.beginPath(); ctx!.moveTo(97, 42); ctx!.lineTo(162, 101); ctx!.moveTo(162, 42); ctx!.lineTo(97, 101); ctx!.stroke();
        } else if (scene === 5) {
          for(let i=0;i<6;i++){ctx!.fillStyle='#27446e';ctx!.fillRect(28+i*34, 98-i*7, 22, 18+i*7);}
        } else if (scene === 6) {
          ctx!.strokeStyle='#228d5c';ctx!.lineWidth=8;ctx!.beginPath();ctx!.moveTo(28,105);ctx!.lineTo(70,80);ctx!.lineTo(112,96);ctx!.lineTo(158,70);ctx!.lineTo(224,91);ctx!.stroke();
          ctx!.fillStyle='#f07e47';ctx!.beginPath();ctx!.arc(130,87,7,0,Math.PI*2);ctx!.fill();
        } else if (scene === 7) {
          ctx!.fillStyle='#b8c9a7';ctx!.fillRect(28,44,78,62);ctx!.fillStyle='#27446e';ctx!.fillRect(48,30,78,62);ctx!.fillStyle='#228d5c';ctx!.fillRect(68,16,78,62);
        } else if (scene === 8) {
          ctx!.fillStyle='#27446e';ctx!.fillRect(25,52,90,38);ctx!.fillStyle='#228d5c';ctx!.fillRect(150,30,82,28);ctx!.fillStyle='#7c3aed';ctx!.fillRect(150,78,82,28);
          ctx!.strokeStyle='#27446e';ctx!.lineWidth=3;ctx!.beginPath();ctx!.moveTo(115,71);ctx!.lineTo(150,44);ctx!.moveTo(115,71);ctx!.lineTo(150,92);ctx!.stroke();
        } else if (scene === 9) {
          ctx!.fillStyle='#b8c9a7';ctx!.fillRect(28,36,88,68);ctx!.save();ctx!.translate(172,70);ctx!.scale(-1,1);ctx!.fillStyle='#228d5c';ctx!.fillRect(-44,-34,88,68);ctx!.restore();
          ctx!.fillStyle='#21324a';ctx!.font='bold 18px Segoe UI';ctx!.fillText('＋',127,78);
        } else if (scene === 10) {
          [42,58,76,98].forEach((h,i)=>{ctx!.fillStyle=i===3?'#228d5c':'#b8c9a7';ctx!.fillRect(28+i*48,118-h,30,h);});
        }
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        frame += 1; raf = requestAnimationFrame(draw); return;
      }

      if (scene >= 5) {
        ctx!.fillStyle = '#21324a'; ctx!.font = 'bold 17px Segoe UI, sans-serif';
        const labels = [
          '', '', '', '', '',
          '加宽通道扩展容量', '轻压笔尖', '借用 ×2 底稿', '共享底稿后选倍率', '翻转后再对齐', '并排核对真实成绩',
        ];
        const subtitles = ['', '', '', '', '', '增加特征通道', '残差缩放系数 0.1', '迁移权重初始化', '倍率分支单独启用', '对称退化时平均', '同协议内比较'];
        ctx!.fillText(labels[scene], 280, 50);
        ctx!.fillStyle = '#526178'; ctx!.font = '15px Segoe UI, sans-serif'; ctx!.fillText(subtitles[scene], 280, 76);
        if (scene === 5) {
          for (let i = 0; i < 6; i++) { ctx!.fillStyle = '#27446e'; ctx!.fillRect(34 + i * 30, 102 - i * 8, 20, 18 + i * 8); }
        } else if (scene === 6) {
          ctx!.strokeStyle = '#228d5c'; ctx!.lineWidth = 7; ctx!.beginPath(); ctx!.moveTo(34, 106); ctx!.lineTo(86, 89); ctx!.lineTo(138, 101); ctx!.lineTo(206, 72); ctx!.stroke();
          ctx!.fillStyle = '#f07e47'; ctx!.beginPath(); ctx!.arc(84 + 10 * Math.sin(t * Math.PI * 2), 92, 7, 0, Math.PI * 2); ctx!.fill();
        } else if (scene === 7) {
          ctx!.fillStyle = '#b8c9a7'; ctx!.fillRect(32, 57, 62, 55); ctx!.fillStyle = '#27446e'; ctx!.fillRect(76, 42, 62, 55); ctx!.fillStyle = '#228d5c'; ctx!.fillRect(120, 27, 62, 55);
        } else if (scene === 8) {
          ctx!.fillStyle = '#27446e'; ctx!.fillRect(28, 55, 92, 40); ctx!.fillStyle = '#228d5c'; ctx!.fillRect(163, 31, 76, 27); ctx!.fillStyle = '#7c3aed'; ctx!.fillRect(163, 79, 76, 27);
          ctx!.strokeStyle = '#27446e'; ctx!.lineWidth = 3; ctx!.beginPath(); ctx!.moveTo(120, 75); ctx!.lineTo(163, 45); ctx!.moveTo(120, 75); ctx!.lineTo(163, 92); ctx!.stroke();
        } else if (scene === 9) {
          ctx!.fillStyle = '#b8c9a7'; ctx!.fillRect(30, 38, 82, 66); ctx!.save(); ctx!.translate(184, 71); ctx!.rotate(Math.sin(t * Math.PI * 2) * .12); ctx!.strokeStyle = '#27446e'; ctx!.lineWidth = 4; ctx!.strokeRect(-42, -30, 84, 60); ctx!.restore();
          ctx!.fillStyle = '#21324a'; ctx!.font = 'bold 18px Segoe UI'; ctx!.fillText('→', 129, 78);
        } else {
          [38, 55, 74, 96].forEach((h, i) => { ctx!.fillStyle = i === 3 ? '#228d5c' : '#b8c9a7'; ctx!.fillRect(30 + i * 49, 119 - h, 31, h); });
        }
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        frame += 1; raf = requestAnimationFrame(draw); return;
      }

      ctx!.fillStyle = '#d7deea';
      ctx!.fillRect(28, 16, 214, 108);
      ctx!.fillStyle = '#b8c9a7';
      ctx!.fillRect(36, 22, 198, 96);
      ctx!.fillStyle = '#76906a';
      ctx!.fillRect(48, 34, 174, 72);

      ctx!.strokeStyle = '#c43f52';
      ctx!.lineWidth = 5;
      ctx!.beginPath();
      ctx!.moveTo(59, 93);
      ctx!.lineTo(89, 66);
      ctx!.lineTo(122, 86);
      ctx!.lineTo(154, 55);
      ctx!.lineTo(205, 82);
      ctx!.stroke();

      const endX = 70 + t * 140;
      ctx!.strokeStyle = '#228d5c';
      ctx!.lineWidth = 4;
      ctx!.beginPath();
      ctx!.moveTo(70, 98);
      ctx!.lineTo(Math.min(endX, 89), 82);
      if (endX > 89) ctx!.lineTo(Math.min(endX, 122), 94);
      if (endX > 122) ctx!.lineTo(Math.min(endX, 154), 74);
      if (endX > 154) ctx!.lineTo(Math.min(endX, 205), 91);
      ctx!.stroke();

      ctx!.fillStyle = '#21324a';
      ctx!.font = 'bold 17px Segoe UI, sans-serif';
      const labels = [
        ['模糊的照片边缘', '沿边缘描出清楚轮廓'],
        ['放大观察', '像素变多不等于细节变真'],
        ['残差轮廓', '主干在输入基础上补充变化'],
        ['移除多余步骤', '保留特征范围的灵活性'],
        ['增加可用笔尖', '加宽模型提升容量'],
        ['控制笔触幅度', '残差缩放帮助稳定训练'],
        ['借用×2底稿', '作为×3 / ×4初始化'],
        ['共享底稿', '倍率分支各自完成放大'],
        ['翻转再对齐', '对称退化时平均预测'],
        ['按条件比较', '数据集与协议需要一致'],
      ][Math.max(0, Math.min(9, scene - 1))];
      ctx!.fillText(labels[0], 274, 52);
      ctx!.font = '15px Segoe UI, sans-serif';
      ctx!.fillStyle = '#68778f';
      ctx!.fillText(labels[1], 274, 80);
      if (scene === 5) {
        ctx!.fillStyle = '#27446e';
        for (let i = 0; i < 5; i++) ctx!.fillRect(280 + i * 26, 92 - i * 5, 14, 18 + i * 5);
      } else if (scene === 8) {
        ctx!.fillStyle = '#27446e'; ctx!.fillRect(282, 91, 90, 20);
        ctx!.fillStyle = '#228d5c'; ctx!.fillRect(380, 91, 42, 12);
        ctx!.fillStyle = '#7c3aed'; ctx!.fillRect(380, 106, 42, 12);
      } else if (scene === 9) {
        ctx!.save(); ctx!.translate(355, 108); ctx!.rotate(Math.sin(t * Math.PI * 2) * 0.15);
        ctx!.strokeStyle = '#27446e'; ctx!.lineWidth = 3; ctx!.strokeRect(-30, -12, 60, 24); ctx!.restore();
      } else if (scene === 10) {
        ctx!.fillStyle = '#228d5c'; ctx!.fillRect(280, 101, 32, 16); ctx!.fillRect(322, 88, 32, 29); ctx!.fillRect(364, 70, 32, 47);
      }
      ctx!.fillStyle = '#228d5c';
      ctx!.beginPath();
      ctx!.arc(endX, endX > 154 ? 74 : 82, 5, 0, Math.PI * 2);
      ctx!.fill();

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      frame += 1;
      raf = requestAnimationFrame(draw);
    };
    const stop = () => cancelAnimationFrame(raf);
    const start = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);
    resize();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      resizeObserver.disconnect();
    };
  }, [chapterId]);

  return <canvas ref={canvasRef} width={W} height={H} aria-label="旧照片边缘修复比喻动画" />;
};

