import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { clearScene, COLORS, drawLegend, drawSubText } from './calligraphyKit';
import type { WidgetProps } from './registry';
const W = 1080, H = 280;
export const Mod4_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [lam, setLam] = useState(1.0);
  const sRef = useRef({ lam: 1.0 });
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = setupCanvas(c, W, H);
    c.classList.add('is-ready');
    let raf = 0;
    const tick = () => {
      const l = sRef.current.lam;
      clearScene(ctx, W, H);
      // Semantic accuracy (decreases as lambda increases)
      const semAcc = clamp(95 - l * 12, 60, 95);
      // Stroke fidelity (increases as lambda increases)
      const strokeFid = clamp(50 + l * 35, 50, 95);
      ctx.fillStyle = COLORS.ink; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('重建损失权重 λ 对两个目标的权衡', 40, 35);
      // Two bars
      const bx = 80, by = 70, bh = 160, bw = 100;
      // Semantic bar
      ctx.fillStyle = COLORS.blue; ctx.fillRect(bx, by + bh - (semAcc / 100) * bh, bw, (semAcc / 100) * bh);
      ctx.strokeStyle = COLORS.border; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = COLORS.blue; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(semAcc.toFixed(0) + '%', bx + 25, by - 8);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('语义准确率', bx + 15, by + bh + 20);
      // Stroke fidelity bar
      ctx.fillStyle = COLORS.green; ctx.fillRect(bx + 160, by + bh - (strokeFid / 100) * bh, bw, (strokeFid / 100) * bh);
      ctx.strokeStyle = COLORS.border; ctx.strokeRect(bx + 160, by, bw, bh);
      ctx.fillStyle = COLORS.green; ctx.font = 'bold 14px sans-serif';
      ctx.fillText(strokeFid.toFixed(0) + '%', bx + 185, by - 8);
      ctx.fillStyle = COLORS.inkLight; ctx.font = '12px sans-serif';
      ctx.fillText('笔画保真度', bx + 175, by + bh + 20);
      // Formula display
      drawSubText(ctx, 'L_pretrain = L_text + ' + l.toFixed(1) + ' × L_rec', 400, 80, 16, COLORS.ink);
      // Explanation
      ctx.fillStyle = COLORS.inkLight; ctx.font = '13px sans-serif';
      ctx.fillText('λ 越大，像素重建权重越高，编码器越关注笔画细节', 400, 110);
      ctx.fillText('λ 越小，文本生成权重越高，编码器更关注语义内容', 400, 130);
      ctx.fillText('论文默认 λ = 1.0，两个目标均衡优化', 400, 150);
      // Optimal marker
      if (Math.abs(l - 1.0) < 0.15) {
        ctx.fillStyle = COLORS.green; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('✓ 论文推荐区间 (λ≈1.0)', 400, 180);
      } else if (l > 1.5) {
        ctx.fillStyle = COLORS.orange; ctx.font = '13px sans-serif';
        ctx.fillText('⚠ 重建权重过高可能挤压语义学习', 400, 180);
      } else if (l < 0.5) {
        ctx.fillStyle = COLORS.red; ctx.font = '13px sans-serif';
        ctx.fillText('⚠ 重建权重过低，笔画细节易丢失', 400, 180);
      }
      drawLegend(ctx, 400, 210, [
        { color: COLORS.blue, label: '文本生成损失' },
        { color: COLORS.green, label: '像素重建损失' },
      ]);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(c, start, stop);
    return () => { stop(); disconnect(); };
  }, []);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100 * 2; sRef.current.lam = v; setLam(v);
  };
  return (<div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
    <div className="ctrl"><label>重建权重 λ <span className="val">{lam.toFixed(2)}</span></label>
      <input type="range" min={0} max={200} value={Math.round(lam * 100)} onChange={onChange} /></div>
    <div className="feedback">调整 λ 观察语义准确率与笔画保真度的权衡关系。论文默认 λ=1.0，在两个目标间取得均衡。</div></div>);
};
export default Mod4_1;
