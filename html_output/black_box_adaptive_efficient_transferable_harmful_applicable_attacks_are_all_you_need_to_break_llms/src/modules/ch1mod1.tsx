import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;
const C = {
  bg: '#f5f8f0',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

type Dim = {
  id: 'E' | 'K' | 'H' | 'A' | 'T' | 'AD';
  en: string;
  zh: string;
  core: string;
  plain: string;
  req: string[];
  metaphor: string;
};

const DIMS: Dim[] = [
  {
    id: 'E',
    en: 'Efficiency',
    zh: '效率',
    core: '攻击需要多少计算 / API 成本？',
    plain: '攻击贵不贵？',
    req: ['减少优化、查询、辅助训练与裁判成本'],
    metaphor: '试锁耗时耗材可控',
  },
  {
    id: 'K',
    en: 'Knowledge & Access',
    zh: '知识与访问',
    core: '攻击者能看到多少信息？',
    plain: '攻击者需要知道多少？',
    req: ['最好黑盒，不依赖参数与梯度'],
    metaphor: '只摸外壳不拆机',
  },
  {
    id: 'H',
    en: 'Harmfulness',
    zh: '有害性',
    core: '结果到底有多严重？',
    plain: '真的有多危险？',
    req: ['H.1 算力增加，效果持续提升', 'H.2 不只过拒答，要严重有害'],
    metaphor: '门要真开，且风险够重',
  },
  {
    id: 'A',
    en: 'Applicability',
    zh: '适用性',
    core: '实际部署麻不麻烦？',
    plain: '现实中好不好用？',
    req: ['A.1 少人工', 'A.2 少工程适配', 'A.3 少目标查询'],
    metaphor: '新柜不用重写攻略、少踩报警',
  },
  {
    id: 'T',
    en: 'Transferability',
    zh: '迁移性',
    core: '换地方还能不能用？',
    plain: '换模型 / 任务还能不能用？',
    req: ['T.1 跨模型', 'T.2 跨行为'],
    metaphor: '换另一只柜手法仍有效',
  },
  {
    id: 'AD',
    en: 'Adaptiveness',
    zh: '自适应性',
    core: '能否根据目标反馈调整？',
    plain: '目标变了，能不能自己调？',
    req: ['用目标信号自动调整', '适应不同防御与复杂流水线'],
    metaphor: '根据手感改手法',
  },
];

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const chars = text.split('');
  let line = '';
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [sel, setSel] = useState(0);
  const [imgReady, setImgReady] = useState(false);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ sel: 0 });

  useEffect(() => {
    const img = new Image();
    img.src = '/images/lock-checklist.png';
    img.onload = () => {
      imgRef.current = img;
      setImgReady(true);
    };
  }, []);

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
      const d = DIMS[s.sel];
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // left illustration
      const img = imgRef.current;
      const boxX = 16;
      const boxY = 16;
      const boxW = 200;
      const boxH = 208;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      if (img) {
        const pad = 10;
        const maxW = boxW - pad * 2;
        const maxH = boxH - pad * 2;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = boxX + (boxW - dw) / 2;
        const dy = boxY + (boxH - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('加载插图…', boxX + 60, boxY + 110);
      }

      // right checklist card
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.fillRect(232, 16, 312, 208);
      ctx.strokeRect(232, 16, 312, 208);

      ctx.fillStyle = C.blue;
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(`${d.id}  ${d.en}`, 248, 44);
      ctx.fillStyle = C.text;
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(d.zh, 248, 66);

      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('核心问题', 248, 92);
      ctx.fillStyle = C.text;
      wrapText(ctx, d.core, 248, 110, 278, 16);

      ctx.fillStyle = C.muted;
      ctx.fillText('简单理解', 248, 140);
      ctx.fillStyle = C.orange;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(d.plain, 248, 158);

      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('具体要求', 248, 180);
      ctx.fillStyle = C.green;
      ctx.font = '12px "Segoe UI", sans-serif';
      wrapText(ctx, d.req.join('；'), 248, 196, 278, 15);
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
  }, [imgReady]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl" style={{ flexWrap: 'wrap', gap: 8 }}>
        {DIMS.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              setSel(i);
              stateRef.current.sel = i;
            }}
            style={{
              fontWeight: sel === i ? 700 : 400,
              outline: sel === i ? `2px solid ${C.blue}` : undefined,
            }}
          >
            [{it.id}]
          </button>
        ))}
      </div>
    </div>
  );
};

export default Ch1Mod1;
