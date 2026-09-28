import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.1：切换四种采样策略，看各自的取法与结论。
const W = 1080, H = 280;
const C = { bg: '#f5f8f0', field: '#b8c9a7', border: '#d7deea', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f', blue: '#27446e' };
type Strat = 'knn' | 'random' | 'filtered' | 'sim';
const INFO: Record<Strat, { fb: string; cls: string; note: string }> = {
  knn: { fb: '连续邻域上按序号取带：难度可控、正负不碰撞。', cls: 'good', note: 'KNN 环带：绿带 5 个正样本，红带 2 个难负样本，远端易负样本' },
  random: { fb: '纯随机大多是很远的易负样本，正样本没有来源。', cls: '', note: '纯随机：整个语料库均匀撒点，几乎全是远处的易负样本' },
  filtered: { fb: '过滤随机只用作易负样本——与 KNN 搭配最好。', cls: 'good', note: '过滤随机：排除 KNN 检索到的近邻后随机取（最终方案）' },
  sim: { fb: '相似度阈值下，超过 40% 的查询找不到正样本邻居（附录 F.6）。', cls: 'bad', note: '相似度阈值：40% 以上的查询在阈值内没有正样本候选' },
};

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ strategy: 'knn' as Strat });
  const [strategy, setStrategy] = useState<Strat>('knn');
  const [fb, setFb] = useState({ text: INFO.knn.fb, cls: INFO.knn.cls });

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const cx = 260, cy = 150;
    const seeded = (i: number) => { const v = Math.sin(i * 127.1) * 43758.5453; return v - Math.floor(v); };
    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.field; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      for (const f of [1, 0.66, 0.33]) { ctx.beginPath(); ctx.arc(cx, cy, 130 * f, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
      if (s.strategy === 'knn') {
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(cx, cy, 66, 0, Math.PI * 2); ctx.arc(cx, cy, 40, 0, Math.PI * 2, true); ctx.fill();
        ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(cx, cy, 112, 0, Math.PI * 2); ctx.arc(cx, cy, 94, 0, Math.PI * 2, true); ctx.fill();
        ctx.globalAlpha = 1;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 + 0.3;
          const r = i < 5 ? 42 + (i % 5) * 5 : i < 7 ? 96 + (i - 5) * 8 : 122 + (i - 7) * 6;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.6;
          ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
          if (i < 5) { ctx.fillStyle = C.green; ctx.fill(); }
          else if (i < 7) { ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.stroke(); }
          else { ctx.fillStyle = C.muted; ctx.fill(); }
        }
      } else {
        const n = s.strategy === 'random' ? 14 : 10;
        for (let i = 0; i < n; i++) {
          const a = seeded(i) * Math.PI * 2;
          const r = s.strategy === 'random' ? 40 + seeded(i + 40) * 86
            : s.strategy === 'filtered' ? 132 + seeded(i + 80) * 26
            : (i < 3 ? 46 + i * 8 : 118 + seeded(i + 120) * 24);
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.6;
          ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
          if (s.strategy === 'sim' && i < 3) { ctx.fillStyle = C.green; ctx.fill(); }
          else if (s.strategy === 'filtered') { ctx.fillStyle = C.muted; ctx.fill(); }
          else { ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.stroke(); }
        }
      }
      // 说明条
      ctx.fillStyle = '#fff'; ctx.strokeStyle = C.border; ctx.lineWidth = 2;
      ctx.fillRect(470, 60, 570, 150); ctx.strokeRect(470, 60, 570, 150);
      ctx.fillStyle = C.text; ctx.font = '17px sans-serif'; ctx.textAlign = 'left';
      wrapText(ctx, INFO[s.strategy].note, 496, 100, 520, 26);
    };
    let raf = 0;
    const tick = () => { render(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const stop = observeCanvas(canvas, () => { if (!raf) raf = requestAnimationFrame(tick); }, () => { cancelAnimationFrame(raf); raf = 0; });
    return () => { cancelAnimationFrame(raf); stop(); };
  }, []);

  const switchTo = (m: Strat) => {
    stateRef.current.strategy = m;
    setStrategy(m);
    setFb({ text: INFO[m].fb, cls: INFO[m].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        {(['knn', 'random', 'filtered', 'sim'] as Strat[]).map((m, i) => (
          <button key={m} className={`chip ${strategy === m ? 'active' : ''}`} onClick={() => switchTo(m)}>
            {['KNN 环带', '纯随机', '过滤随机', '相似度阈值'][i]}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = '', yy = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  ctx.fillText(line, x, yy);
}
export default M51;
