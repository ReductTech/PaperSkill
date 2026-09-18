import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, COLORS, drawLegend } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
const TYPES = [
  { name: '页级文档', count: '800万', numValue: 8000000, desc: '整页扫描/拍照文档，含复杂版式', color: COLORS.blue },
  { name: '裁剪元素', count: '1.05亿', numValue: 105000000, desc: '文本行、公式、表格等局部裁剪', color: COLORS.green },
  { name: '真实样本', count: '54%', numValue: 54, desc: '来自公开数据集和真实文档', color: COLORS.orange },
  { name: '合成样本', count: '46%', numValue: 46, desc: '渲染合成，覆盖稀有语言和场景', color: COLORS.purple },
];
export const Mod5_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState(0);
  const sRef = useRef(0);
  const animRef = useRef({ progress: 0, countUp: 0, lastSel: 0 });
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0, t = 0;
    const tick = () => {
      t += 0.02;
      const anim = animRef.current;
      // Animate progress when selection changes
      if (anim.lastSel !== sRef.current) {
        anim.lastSel = sRef.current;
        anim.progress = 0;
        anim.countUp = 0;
      }
      anim.progress = Math.min(1, anim.progress + 0.025);
      const easeProgress = 1 - Math.pow(1 - anim.progress, 3); // easeOutCubic
      clearScene(ctx, W, H);
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('MonkeyDoc v2 数据构成 · 1.13亿样本 · 17种语言', 40, 35);
      // Animated pie chart
      const cx = 180, cy = 150, r = 80;
      const segs = [
        { frac: 0.07, color: COLORS.blue, label: '页级 7%' },
        { frac: 0.93, color: COLORS.green, label: '裁剪 93%' },
      ];
      let start = -Math.PI / 2;
      segs.forEach((s, idx) => {
        const endAngle = start + s.frac * Math.PI * 2 * easeProgress;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, endAngle);
        ctx.closePath(); ctx.fillStyle = s.color; ctx.fill();
        // Segment label with fade-in
        if (easeProgress > 0.5) {
          const midAngle = start + s.frac * Math.PI;
          const isSmall = s.frac < 0.15;
          const labelRadius = isSmall ? r * 1.2 : r * 0.65;
          const lx = cx + Math.cos(midAngle) * labelRadius;
          const ly = cy + Math.sin(midAngle) * labelRadius;
          ctx.fillStyle = isSmall ? COLORS.ink : '#fff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(s.label, lx, ly);
          ctx.textAlign = 'left';
        }
        start = endAngle;
      });
      // Center text with count-up
      const centerNum = Math.floor(113000000 * easeProgress);
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      if (centerNum >= 100000000) {
        ctx.fillText((centerNum / 100000000).toFixed(2) + '亿', cx, cy + 5);
      } else {
        ctx.fillText(Math.floor(centerNum / 10000) + '万', cx, cy + 5);
      }
      ctx.textAlign = 'left';
      // Detail panel with animated count
      const d = TYPES[sRef.current];
      const displayNum = Math.floor(d.numValue * easeProgress);
      ctx.fillStyle = d.color; ctx.font = 'bold 18px sans-serif';
      ctx.fillText(d.name, 320, 70);
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 24px sans-serif';
      if (d.numValue > 1000000) {
        ctx.fillText((displayNum / 100000000).toFixed(2) + '亿', 320, 105);
      } else if (d.numValue > 10000) {
        ctx.fillText(Math.floor(displayNum / 10000) + '万', 320, 105);
      } else {
        ctx.fillText(displayNum + '%', 320, 105);
      }
      ctx.fillStyle = COLORS.inkLight; ctx.font = '13px sans-serif';
      ctx.fillText(d.desc, 320, 130);
      // Language bar with staggered appearance
      ctx.fillStyle = COLORS.ink; ctx.font = '13px sans-serif';
      ctx.fillText('语言覆盖 (17种):', 320, 165);
      const langs = ['简中','繁中','英','阿','德','西','法','印地','印尼','意','日','韩','荷','葡','俄','泰','越'];
      langs.forEach((l, i) => {
        const appearThreshold = i * 0.04;
        if (easeProgress > appearThreshold) {
          const x = 320 + (i % 9) * 55, y = 185 + Math.floor(i / 9) * 20;
          const alpha = Math.min(1, (easeProgress - appearThreshold) * 5);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = i === 0 ? COLORS.orange : COLORS.inkLight;
          ctx.font = '11px sans-serif'; ctx.fillText(l, x, y);
          ctx.globalAlpha = 1;
        }
      });
      drawLegend(ctx, 750, 60, TYPES.map(t => ({ color: t.color, label: t.name })));
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('点击下方按钮切换数据类型', 750, 150);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl">
      {TYPES.map((t, i) => (<button key={i} className={sel === i ? 'chip selected' : 'chip'} onClick={() => { sRef.current = i; setSel(i); animRef.current.progress = 0; }}>{t.name}</button>))}
    </div>
    <div className="feedback">{TYPES[sel].name}：{TYPES[sel].count}。{TYPES[sel].desc}。MonkeyDoc v2 是据作者所知最大规模的文档视觉预训练语料。</div></div>);
};
export default Mod5_1;