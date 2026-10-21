import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox, bar } from './birdKit';

// m7-2 (data-cards) — 数据家底：检测 + Grounding + 伪掩码（附录 A Tab 8）。

const W = 1080;
const H = 280;

interface DataCard {
  key: string;
  name: string;
  kind: 'detect' | 'ground' | 'mask';
  images: string;
  annos: string;
  imgFrac: number;
  annFrac: number;
  role: string;
}
const CARDS: DataCard[] = [
  { key: 'o365', name: 'Objects365', kind: 'detect', images: '609k 图', annos: '853 万框', imgFrac: 609 / 650, annFrac: 8.53 / 9, role: 'Objects365：检测主力，609k 图、853 万框。' },
  { key: 'gqa', name: 'GQA', kind: 'ground', images: '621k 图', annos: '366 万对', imgFrac: 621 / 650, annFrac: 3.66 / 9, role: 'GQA：Grounding 数据，提供图文区域对。' },
  { key: 'flickr', name: 'Flickr30k', kind: 'ground', images: '149k 图', annos: '63.8 万对', imgFrac: 149 / 650, annFrac: 0.638 / 9, role: 'Flickr30k：Grounding 补充，149k 图。' },
  { key: 'sam', name: 'SAM-2.1 伪掩码', kind: 'mask', images: '框→掩码', annos: '零人工描边', imgFrac: 0, annFrac: 0, role: 'SAM-2.1 用真值框生成伪掩码，分割监督零人工描边。' },
];
const KIND_COLOR = { detect: PALETTE.green, ground: PALETTE.purple, mask: PALETTE.orange } as const;
const KIND_NAME = { detect: '检测', ground: 'Grounding', mask: '伪掩码' } as const;

export const M7_2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'none' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('none');
  const [feedback, setFeedback] = useState({ text: '点击卡片查看每份数据在训练中的角色。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 上方四张卡片
      CARDS.forEach((c, i) => {
        const x = 50 + i * 255;
        const y = 40;
        const cur = s.sel === c.key;
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = cur ? PALETTE.blue : PALETTE.border;
        ctx.lineWidth = cur ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, 225, 86, 10);
        ctx.fill();
        ctx.stroke();
        // 类型色条
        ctx.fillStyle = KIND_COLOR[c.kind];
        ctx.fillRect(x, y, 8, 86);
        ctx.fillStyle = PALETTE.ink;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(c.name, x + 20, y + 30);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = '12px sans-serif';
        ctx.fillText(KIND_NAME[c.kind], x + 20, y + 54);
        ctx.fillText(c.images + ' · ' + c.annos, x + 20, y + 74);
        ctx.restore();
      });

      // 下方详情带
      insetBox(ctx, 50, 150, 980, 106);
      if (s.sel === 'none') {
        drawSceneLabel(ctx, '点击上方卡片，查看规模与角色', 80, 210, PALETTE.muted);
      } else {
        const c = CARDS.find((x) => x.key === s.sel)!;
        drawSceneLabel(ctx, c.name, 80, 182, PALETTE.ink);
        if (c.kind === 'mask') {
          // 框→SAM-2.1→掩码 小流程
          ctx.save();
          ctx.strokeStyle = PALETTE.orange;
          ctx.lineWidth = 2;
          ctx.strokeRect(80, 200, 34, 26);
          ctx.font = '13px sans-serif';
          ctx.fillStyle = PALETTE.muted;
          ctx.fillText('框', 92, 218);
          ctx.fillText('→', 128, 218);
          ctx.fillStyle = PALETTE.orange;
          ctx.fillText('SAM-2.1', 150, 218);
          ctx.fillStyle = PALETTE.muted;
          ctx.fillText('→', 226, 218);
          ctx.fillStyle = PALETTE.purple;
          ctx.beginPath();
          ctx.ellipse(268, 213, 18, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = PALETTE.muted;
          ctx.fillText('掩码', 300, 218);
          ctx.restore();
        } else {
          drawSceneLabel(ctx, '图像数', 80, 208, PALETTE.muted);
          bar(ctx, 150, 196, 300, 16, c.imgFrac, KIND_COLOR[c.kind], c.images);
          drawSceneLabel(ctx, '标注数', 80, 240, PALETTE.muted);
          bar(ctx, 150, 228, 300, 16, c.annFrac, KIND_COLOR[c.kind], c.annos);
        }
      }
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChip = (key: string) => {
    stateRef.current.sel = key;
    setSel(key);
    const c = CARDS.find((x) => x.key === key)!;
    setFeedback({ text: c.role, cls: key === 'sam' ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {CARDS.map((c) => (
          <button
            key={c.key}
            type="button"
            className={sel === c.key ? 'chip selected' : 'chip'}
            onClick={() => onChip(c.key)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M7_2;
