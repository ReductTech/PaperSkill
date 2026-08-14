import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap2Mod1 — Modality chip switch (P4, life metaphor).
// Click RGB / SAR / IR chip; the desk highlights the chosen book and shows a
// real instruction/response sample from the paper.

const W = 560;
const H = 260;

const SAMPLES: Record<'RGB' | 'SAR' | 'IR', { instruction: string; response: string; sub: string; from: string }> = {
  RGB: {
    sub: 'Million-AID · VQA',
    from: 'Million-AID (Long et al., 2021)',
    instruction: '请在以下类别中选出最匹配的一张：工业用地｜公共设施｜未利用地｜农业用地｜居住用地｜交通用地｜商业用地｜水域。',
    response: '这是一张俯视的四向道路交叉口图像。路面为沥青，状况良好，车流较少。两侧有树木和灌木，背景有建筑。综合判断：交通用地。',
  },
  SAR: {
    sub: 'SAR Sentinel · Classification',
    from: 'SAR Sentinel (Tiwari, 2025)',
    instruction: '请从以下类别中选出最匹配的一张：农业用地｜草地｜裸地｜城市。',
    response: '农业用地。',
  },
  IR: {
    sub: 'MMRS-1M · VG + 计数',
    from: 'MMRS-1M (Zhang et al., 2024a)',
    instruction: '请检测这张红外图像中所有目标，并使用水平边界框描述。如同一类别出现多次，仅输出数量。',
    response: '图中共十个目标，包括七辆小汽车、一辆卡车 [box][550,340,750,530][/box]、以及两个人。',
  },
};

export const Chap2Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mod: 'RGB' as 'RGB' | 'SAR' | 'IR', anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [mod, setMod] = useState<'RGB' | 'SAR' | 'IR'>('RGB');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const drawBook = (x: number, y: number, color: string, label: string, isActive: boolean) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - 38, y - 32, 76, 64);
      ctx.strokeStyle = isActive ? '#d97706' : '#21324a';
      ctx.lineWidth = isActive ? 2.4 : 1.0;
      ctx.strokeRect(x - 38, y - 32, 76, 64);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y - 6);
      ctx.fillStyle = isActive ? '#fff7d6' : 'rgba(255,255,255,0.4)';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('指令 ↗ 响应', x, y + 14);
    };

    const render = () => {
      const s = stateRef.current;
      s.anim = Math.min(1, s.anim + 0.05);
      const e = easeOutCubic(s.anim);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 50, W, 50);
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, H - 26); ctx.lineTo(W, H - 26);
      ctx.stroke();

      const colors: Record<string, string> = {
        RGB: '#c43f52', SAR: '#228d5c', IR: '#7c3aed',
      };
      const labels: Array<[string, number]> = [
        ['RGB', 100],
        ['SAR', 200],
        ['IR', 300],
      ];
      labels.forEach(([lab, x]) => {
        const active = lab === s.mod;
        // soft glow
        if (active) {
          const grad = ctx.createRadialGradient(x, H - 50, 8, x, H - 50, 80);
          grad.addColorStop(0, 'rgba(217, 119, 6, 0.35)');
          grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x - 80, H - 130, 160, 120);
        }
        drawBook(x, H - 50, colors[lab], lab, active);
      });

      // sample panel on the right
      const panelX = 380, panelY = 30, panelW = 160, panelH = 200;
      ctx.fillStyle = '#fff7d6';
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      const sample = SAMPLES[s.mod];
      ctx.fillStyle = '#27446e';
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('子数据集：' + sample.sub, panelX + 8, panelY + 8);

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.fillText('指令：', panelX + 8, panelY + 30);
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#21324a';
      const wrap = (text: string, x: number, y: number, maxW: number, lineH: number) => {
        let line = '';
        let cy = y;
        for (let i = 0; i < text.length; i++) {
          line += text[i];
          if (ctx.measureText(line).width > maxW) {
            ctx.fillText(line.slice(0, -1), x, cy);
            line = text[i];
            cy += lineH;
          }
        }
        ctx.fillText(line, x, cy);
        return cy + lineH;
      };
      let yy = wrap(sample.instruction, panelX + 8, panelY + 48, panelW - 16, 14);

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      ctx.fillText('响应：', panelX + 8, yy + 4);
      ctx.font = '10px "Segoe UI", sans-serif';
      wrap(sample.response, panelX + 8, yy + 20, panelW - 16, 14);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const switchMod = (m: 'RGB' | 'SAR' | 'IR') => {
    setMod(m);
    stateRef.current.mod = m;
    stateRef.current.anim = 0;
  };

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${mod === 'RGB' ? 'selected' : ''}`} onClick={() => switchMod('RGB')}>RGB · 形状颜色</button>
        <button className={`chip ${mod === 'SAR' ? 'selected' : ''}`} onClick={() => switchMod('SAR')}>SAR · 散射回波</button>
        <button className={`chip ${mod === 'IR' ? 'selected' : ''}`} onClick={() => switchMod('IR')}>红外 · 热辐射</button>
      </div>
      <div className="feedback">
        当前展示：<b>{SAMPLES[mod].sub}</b>（来源：{SAMPLES[mod].from}，对应论文附录 D 样例）
      </div>
    </div>
  );
};

export default Chap2Mod1;
