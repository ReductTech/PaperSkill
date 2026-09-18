import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS, drawLegend } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const REGIONS = [
  { name: '正文文字', x: 60, y: 40, w: 280, h: 60, color: COLORS.blue, desc: '密集文本行，字符级细节决定识别准确率' },
  { name: '表格', x: 60, y: 110, w: 280, h: 70, color: COLORS.green, desc: '行列结构与单元格边界，需要版式感知' },
  { name: '公式', x: 360, y: 40, w: 200, h: 60, color: COLORS.purple, desc: '上下标、分式、根号，空间关系复杂' },
  { name: '手写文字', x: 360, y: 110, w: 200, h: 70, color: COLORS.orange, desc: '笔画不规则，风格差异大' },
];
export const Mod2_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState(-1);
  const sRef = useRef(-1);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      clearScene(ctx, W, H);
      // Document layout
      ctx.fillStyle = COLORS.paper; ctx.fillRect(40, 30, 540, 220);
      ctx.strokeStyle = COLORS.border; ctx.strokeRect(40, 30, 540, 220);
      REGIONS.forEach((r, i) => {
        ctx.fillStyle = i === sRef.current ? r.color + '33' : 'transparent';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = i === sRef.current ? r.color : COLORS.border;
        ctx.lineWidth = i === sRef.current ? 2.5 : 1;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = COLORS.inkLight; ctx.font = '11px sans-serif';
        ctx.fillText(r.name, r.x + 5, r.y + 15);
        // Mini content
        if (r.name === '正文文字') { for (let j = 0; j < 4; j++) { ctx.fillStyle = COLORS.ink; ctx.fillRect(r.x + 10, r.y + 25 + j * 10, r.w - 20 - j * 15, 4); } }
        else if (r.name === '表格') { for (let j = 0; j < 3; j++) { ctx.strokeStyle = COLORS.ink; ctx.beginPath(); ctx.moveTo(r.x, r.y + 20 + j * 16); ctx.lineTo(r.x + r.w, r.y + 20 + j * 16); ctx.stroke(); } for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.moveTo(r.x + j * 70, r.y + 20); ctx.lineTo(r.x + j * 70, r.y + r.h - 5); ctx.stroke(); } }
        else if (r.name === '公式') { ctx.fillStyle = COLORS.ink; ctx.font = '18px serif'; ctx.fillText('∫f(x)dx = Σ', r.x + 20, r.y + 45); }
        else { ctx.fillStyle = COLORS.ink; ctx.font = '14px cursive'; ctx.fillText('手写示例', r.x + 30, r.y + 45); }
      });
      // Detail panel
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('区域特征统计', 620, 50);
      if (sRef.current >= 0) {
        const r = REGIONS[sRef.current];
        ctx.fillStyle = r.color; ctx.font = 'bold 16px sans-serif';
        ctx.fillText(r.name, 620, 80);
        ctx.fillStyle = COLORS.ink; ctx.font = '13px sans-serif';
        ctx.fillText(r.desc, 620, 105);
        // Fake stats
        ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
        ctx.fillText('笔画密度: ' + (sRef.current * 15 + 30) + '%', 620, 135);
        ctx.fillText('空间复杂度: ' + (['低','中','高','极高'][sRef.current]), 620, 155);
      } else {
        ctx.fillStyle = COLORS.inkLight; ctx.font = '13px sans-serif';
        ctx.fillText('点击左侧文档中的不同区域', 620, 80);
        ctx.fillText('查看该区域的视觉特征差异', 620, 100);
      }
      drawLegend(ctx, 620, 190, REGIONS.map(r => ({ color: r.color, label: r.name })));
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    let found = -1;
    REGIONS.forEach((r, i) => { if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) found = i; });
    sRef.current = found; setSel(found);
  };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer' }} />
    <div className="feedback">{sel >= 0 ? `已选择「${REGIONS[sel].name}」：${REGIONS[sel].desc}` : '点击文档中的不同区域，对比正文、表格、公式和手写文字的视觉统计差异。'}</div></div>);
};
export default Mod2_1;
