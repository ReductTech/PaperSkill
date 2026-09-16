import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 3 章 Module 3.1：三个 cost-volume 表示的 PCK 对比（P3 同步对比，数学/技术视图）
// 左：极简 PCK 柱状图（DA3 / DINOv2 / VAE）；右：论文 Fig 4 真图（PCK @ 1/3/5 + 退化鲁棒性）
const W = 1080;
const H = 320;

const SPACES = [
  { name: 'DA3 (Ours)', pck: 0.62, color: '#c43f52' }, // 顶
  { name: 'DINOv2', pck: 0.59, color: '#27446e' }, // 中
  { name: 'VAE', pck: 0.08, color: '#228d5c' }, // 底（VAE 桶色）
];

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ progress: 1 }); // 默认满状态显示（参考 §10 之前修的坑）
  const rafRef = useRef<number | null>(null);
  const fig4Ref = useRef<HTMLImageElement | null>(null);
  const fig9Ref = useRef<HTMLImageElement | null>(null);
  const [showFig9, setShowFig9] = useState(false); // 切换：默认显示 Fig 4 (PCK)，点击"看几何保留效果"切到 Fig 9 (几何对应可视化)
  const [feedback, setFeedback] = useState({
    text: '左侧柱状图：DA3 > DINOv2 > VAE 的 PCK@1/3/5；右侧为论文 Figure 4(b) 在 mild→moderate→heavy 退化下三个表示的鲁棒性。',
    cls: '',
  });

  useEffect(() => {
    const a = new Image();
    a.src = './images/fig4_pck.webp';
    a.onload = () => { fig4Ref.current = a; };
    const b = new Image();
    b.src = './images/fig9_correspondence.webp';
    b.onload = () => { fig9Ref.current = b; };
    // Some browsers fire onload after image is in cache — set immediately too.
    if (a.complete) fig4Ref.current = a;
    if (b.complete) fig9Ref.current = b;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { progress: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // ============== 左半：极简 PCK 柱状图 ==============
      const leftPanelW = 360;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(20, 30, leftPanelW, H - 80);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 30, leftPanelW, H - 80);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PCK@5 平均 (HQ)', 20 + leftPanelW / 2, 52);

      const barX = 50;
      const barW = 70;
      const barMaxH = 170;
      const barY = 70;
      SPACES.forEach((sp, i) => {
        const cx = barX + i * 100;
        const h = barMaxH * sp.pck * s.progress;
        const y0 = barY + (barMaxH - h);
        ctx.fillStyle = sp.color;
        ctx.fillRect(cx, y0, barW, h);
        // 数值标签
        if (s.progress > 0.7) {
          ctx.fillStyle = '#21324a';
          ctx.font = 'bold 14px "Segoe UI", sans-serif';
          ctx.fillText((sp.pck * 100).toFixed(1) + '%', cx + barW / 2, y0 - 6);
        }
        // 名称标签
        ctx.fillStyle = '#68778f';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(sp.name, cx + barW / 2, barY + barMaxH + 18);
      });
      ctx.textAlign = 'left';

      // 左下角小字：图例
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#b0b8c4';
      ctx.fillText('数值来自 ETH3D 数据集', 32, H - 50);
      ctx.fillText('图源：论文 Fig. 4(a)', 32, H - 34);

      // ============== 右半：论文 Fig 4（默认）或 Fig 9（可选） ==============
      const rightX = 410;
      const rightW = W - rightX - 30;
      const rightH = H - 80;
      const rightY = 30;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rightX, rightY, rightW, rightH);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(rightX, rightY, rightW, rightH);

      const img = showFig9 ? fig9Ref.current : fig4Ref.current;
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rightX, rightY, rightW, rightH);
        ctx.clip();
        const iw = img.width, ih = img.height;
        const scale = Math.min(rightW / iw, rightH / ih);
        const sw = iw * scale;
        const sh = ih * scale;
        const dx = rightX + (rightW - sw) / 2;
        const dy = rightY + (rightH - sh) / 2;
        ctx.drawImage(img, dx, dy, sw, sh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#b0b8c4';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(showFig9 ? '加载论文 Fig 9…' : '加载论文 Fig 4…', rightX + rightW / 2, rightY + rightH / 2);
        ctx.textAlign = 'left';
      }

      // 右侧图标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        showFig9
          ? '论文 Fig. 9：三表示在多视角中的几何对应可视化（红点是查询点）'
          : '论文 Fig. 4：PCK 性能对照 + 退化鲁棒性（mild→heavy）',
        rightX + rightW / 2,
        rightY - 8
      );
      ctx.textAlign = 'left';

      // ============== 顶部对比说明横幅 ==============
      ctx.fillStyle = showFig9 ? '#228d5c' : '#27446e';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      const bannerTxt = showFig9
        ? '【几何层】DA3 注意力聚焦同一对应点 · DINOv2 较散 · VAE 几乎无对应 → 这是"几何细节丢失"的真正视觉证据'
        : '【数值层】DA3 (Ours) 在三档退化下持续领先 DINOv2 与 VAE → GARD 选 DA3 特征空间的理由';
      ctx.fillText(bannerTxt, W / 2, H - 26);
      ctx.textAlign = 'left';
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [showFig9]);

  const toggle = (toFig9: boolean) => {
    setShowFig9(toFig9);
    setFeedback(
      toFig9
        ? { text: '切换到论文 Fig. 9：看红查询点在三视角图中的对应热度。DA3 热点集中（清晰几何对应），DINOv2 较散，VAE 完全噪声——这就是"几何细节丢失"在特征层的肉眼证据。', cls: 'good' }
        : { text: '切换到论文 Fig. 4：看三表示在 HQ + 退化下的 PCK 性能与鲁棒性。DA3 持续领先 DINOv2，更显著领先 VAE。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${!showFig9 ? 'selected' : ''}`} onClick={() => toggle(false)}>看 PCK 数值</button>
        <button className={`chip ${showFig9 ? 'selected' : ''}`} onClick={() => toggle(true)}>看几何对应</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
