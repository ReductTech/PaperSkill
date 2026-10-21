import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const SKY = '#0b1830';
const GLOW = '#122346';
const DIM = '#7f8db0';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const PURPLE = '#7c3aed';
const ORANGE = '#f07e47';
const BORDER = '#d7deea';

type Comp = 'shared-conv' | 'rpn' | 'roipool' | 'fc' | 'clsreg';

const DETAILS: Record<Comp, { name: string; zf: string; vgg: string }> = {
  'shared-conv': {
    name: '共享卷积',
    zf: 'ZF：5 层可共享卷积',
    vgg: 'VGG-16：13 层可共享卷积，末层步长 16',
  },
  rpn: {
    name: 'RPN 头',
    zf: '3×3 滑窗 → 256 维 → cls 2k / reg 4k',
    vgg: '3×3 滑窗 → 512 维 → cls 2k / reg 4k',
  },
  roipool: {
    name: 'RoI 池化',
    zf: '任意大小提案 → 固定尺寸特征',
    vgg: '任意大小提案 → 固定尺寸特征',
  },
  fc: {
    name: '全连接层',
    zf: 'RoI 特征 → 4096 维（ZF 3 个 FC）',
    vgg: 'RoI 特征 → 4096 维（VGG 3 个 FC）',
  },
  clsreg: {
    name: '分类 + 回归',
    zf: '输出类别分数与边框精修',
    vgg: '输出类别分数与边框精修',
  },
};

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backbone, setBackbone] = useState<'zf' | 'vgg16'>('vgg16');
  const [sel, setSel] = useState<Comp>('shared-conv');
  const [feedback, setFeedback] = useState({ text: '共享卷积：VGG-16 有 13 层可共享，末层步长 16。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const active = (c: Comp) => (sel === c ? ORANGE : c === 'rpn' ? PURPLE : c === 'shared-conv' ? BLUE : GREEN);
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GLOW;
    ctx.fillRect(0, H - 50, W, 50);
    const box = (x: number, y: number, w: number, h: number, c: Comp, label: string) => {
      ctx.fillStyle = sel === c ? active(c) : '#122346';
      ctx.strokeStyle = sel === c ? active(c) : BORDER;
      ctx.lineWidth = sel === c ? 4 : 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#dfe7f5';
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h / 2 + 5);
      ctx.textAlign = 'left';
    };
    box(60, 40, 120, 70, 'shared-conv', '共享卷积');
    box(260, 30, 130, 44, 'rpn', 'RPN：cls / reg');
    box(260, 90, 130, 44, 'rpn', '9 锚框');
    box(470, 60, 110, 60, 'roipool', 'RoI 池化');
    box(650, 60, 120, 60, 'fc', '全连接');
    box(840, 50, 140, 80, 'clsreg', '分类+回归');
    // arrows
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 2;
    const arrow = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    arrow(180, 75, 260, 52);
    arrow(180, 75, 260, 112);
    arrow(390, 60, 470, 85);
    arrow(580, 90, 650, 88);
    arrow(770, 90, 840, 88);
    // detail
    const d = DETAILS[sel];
    ctx.fillStyle = '#122346';
    ctx.fillRect(40, 150, W - 80, 70);
    ctx.fillStyle = '#dfe7f5';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(d.name, 60, 184);
    ctx.fillStyle = DIM;
    ctx.font = '16px sans-serif';
    ctx.fillText(backbone === 'zf' ? d.zf : d.vgg, 60, 210);
    ctx.fillStyle = '#21324a';
    ctx.font = '15px sans-serif';
    ctx.fillText(`主干：${backbone === 'zf' ? 'ZF' : 'VGG-16'}`, 800, 30);
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, [sel, backbone]);

  const select = (c: Comp) => {
    setSel(c);
    const d = DETAILS[c];
    setFeedback({
      text: `${d.name}：${backbone === 'zf' ? d.zf : d.vgg}。`,
      cls: c === 'rpn' ? '' : 'good',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {(Object.keys(DETAILS) as Comp[]).map((c) => (
          <button key={c} type="button" className={sel === c ? 'active' : ''} onClick={() => select(c)}>
            {DETAILS[c].name}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <button type="button" className={backbone === 'zf' ? 'active' : ''} onClick={() => setBackbone('zf')}>
          ZF
        </button>
        <button type="button" className={backbone === 'vgg16' ? 'active' : ''} onClick={() => setBackbone('vgg16')}>
          VGG-16
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
