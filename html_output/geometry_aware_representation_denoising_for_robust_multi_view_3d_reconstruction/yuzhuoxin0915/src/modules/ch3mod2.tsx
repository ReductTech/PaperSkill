import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第 3 章 Module 3.2：选择修复层面
// 内嵌显示论文 Fig. 9 整图 + 切换面板（几何保留评分条 + 当前说明）
// 对应"修底片（DA3 特征空间）/ 修压缩小样（DINOv2）/ 修表面（VAE 像素）"
const W = 1080;
const H = 520;

const LAYERS = [
  {
    name: 'DA3 (Ours)',
    shortName: '修底片（特征空间）',
    color: '#228d5c',
    desc: 'DA3 是几何感知特征。红色查询点对应准确：View 1/2/3 中绿色热点对齐到同一对应点，几何细节完全保留。这是 GARD 采用的去噪域。',
    detailScore: 0.95,
    cls: 'good',
  },
  {
    name: 'DINOv2',
    shortName: '修压缩小样（语义特征）',
    color: '#f07e47',
    desc: 'DINOv2 是语义特征。注意力区域较宽、出现偏移：跨视角大致能匹配但不够精确，几何细节部分丢失。',
    detailScore: 0.55,
    cls: '',
  },
  {
    name: 'VAE',
    shortName: '修表面（像素空间）',
    color: '#c43f52',
    desc: 'VAE 潜空间被压缩后再去噪。注意力热点极度散乱：蓝色噪点几乎覆盖整张图，多视角对应不可靠，几何丢失严重。',
    detailScore: 0.18,
    cls: 'bad',
  },
];

export const Ch3Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ layer: 0 });
  const rafRef = useRef<number | null>(null);
  const fig9Ref = useRef<HTMLImageElement | null>(null);
  const [layer, setLayer] = useState(0);
  const [feedback, setFeedback] = useState({ text: '切换三种"修复层面"，看几何细节保留能力（论文 Fig 9 整图嵌入下方）。', cls: '' });

  useEffect(() => {
    const img = new Image();
    img.src = './images/fig9_correspondence.webp';
    img.onload = () => { fig9Ref.current = img; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { layer: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const current = LAYERS[s.layer];
      const img = fig9Ref.current;

      // 顶部标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('论文 Fig. 9：三个 cost volume 在多视角中的几何对应可视化（红点是查询点）', W / 2, 32);
      ctx.textAlign = 'left';

      // ============== 上半：Fig 9 整图 ==============
      const lx = 30, ly = 50, lw = W - 60, lh = 280;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(lx, ly, lw, lh);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, ly, lw, lh);

      if (img) {
        const iw = img.width, ih = img.height;
        const scale = Math.min(lw / iw, lh / ih);
        const sw = iw * scale, sh = ih * scale;
        const x0 = lx + (lw - sw) / 2;
        const y0 = ly + (lh - sh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(lx, ly, lw, lh);
        ctx.clip();
        ctx.drawImage(img, x0, y0, sw, sh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#b0b8c4';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('加载论文 Fig. 9…', lx + lw / 2, ly + lh / 2);
        ctx.textAlign = 'left';
      }

      // ============== 下半：三卡片评分 + 说明 ==============
      const cardY = 350;
      const cardH = 150;
      const cardW = (W - 80) / 3;
      LAYERS.forEach((l, i) => {
        const isActive = l === current;
        const cx = 30 + i * (cardW + 10);

        ctx.fillStyle = isActive ? '#fafafa' : '#ffffff';
        ctx.fillRect(cx, cardY, cardW, cardH);
        ctx.strokeStyle = isActive ? l.color : '#d7deea';
        ctx.lineWidth = isActive ? 3 : 2;
        ctx.strokeRect(cx, cardY, cardW, cardH);

        // 顶部色带
        ctx.fillStyle = l.color;
        ctx.fillRect(cx, cardY, cardW, 6);

        // 名称
        ctx.fillStyle = l.color;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(l.shortName, cx + 14, cardY + 28);

        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('cost volume: ' + l.name, cx + 14, cardY + 48);

        // 评分条
        const barX = cx + 14, barY = cardY + 70, barW = cardW - 80, barH = 14;
        ctx.fillStyle = '#e8efe0';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = l.color;
        ctx.fillRect(barX, barY, barW * l.detailScore, barH);
        ctx.fillStyle = l.color;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(l.detailScore * 100) + '%', cx + cardW - 22, barY + 12);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#21324a';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('几何细节保留', cx + 14, barY + 28);

        // 当前激活卡片显示完整说明
        if (isActive) {
          ctx.fillStyle = '#21324a';
          ctx.font = '13px "Segoe UI", sans-serif';
          // 文字换行
          let line = '';
          let cy = cardY + 110;
          const maxW = cardW - 28;
          for (let ci = 0; ci < l.desc.length; ci++) {
            const ch = l.desc[ci];
            const test = line + ch;
            if (ctx.measureText(test).width > maxW) {
              ctx.fillText(line, cx + 14, cy);
              cy += 18;
              line = ch;
            } else {
              line = test;
            }
          }
          if (line) ctx.fillText(line, cx + 14, cy);
        } else {
          ctx.fillStyle = '#68778f';
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('点击下方按钮选中查看', cx + cardW / 2, cardY + 110);
          ctx.textAlign = 'left';
        }
      });

      // 底部脚注
      ctx.fillStyle = '#68778f';
      ctx.font = 'italic 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('红圈标记查询点；蓝/绿/黄色高温区域是模型给出的"对应像素位置"——越集中、越对齐，几何越保留', W / 2, H - 10);
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
  }, []);

  const select = (i: number) => {
    stateRef.current.layer = i;
    setLayer(i);
    setFeedback({ text: LAYERS[i].desc, cls: LAYERS[i].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {LAYERS.map((l, i) => (
          <button
            key={i}
            className={`chip ${layer === i ? 'selected' : ''}`}
            onClick={() => select(i)}
            style={layer === i ? { background: l.color, color: '#fff', borderColor: l.color } : undefined}
          >
            {l.shortName}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod2;
