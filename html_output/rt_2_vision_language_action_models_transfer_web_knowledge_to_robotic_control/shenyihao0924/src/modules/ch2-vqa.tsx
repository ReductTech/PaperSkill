import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawChef, drawSceneLabel } from './chefKit';
import type { WidgetProps } from './registry';

// Module 2.1 「看图问答工作台」 — P5 hotspots. Three clickable photo cards on the
// canvas (fruit plate / number icon sign / two customers) + DOM question chips;
// the chef (VLM) on the right answers with one natural-language sentence in a
// blue bubble (short) and in the feedback bar (full).
const W = 1080;
const H = 280;

interface SceneDef {
  name: string;
  qs: string[];
  ans: string[];
}

const SCENES: SceneDef[] = [
  {
    name: '水果盘',
    qs: ['盘里有什么水果？', '哪个是番茄？'],
    ans: ['番茄和柠檬', '红色那个'],
  },
  {
    name: '数字牌',
    qs: ['牌子上是数字几？', '下面的图标是什么？'],
    ans: ['数字 3', '一颗心'],
  },
  {
    name: '两位顾客',
    qs: ['谁戴着眼镜？', '一共有几位顾客？'],
    ans: ['戴眼镜的女士', '两位'],
  },
];

const CARD_W = 175;
const CARD_H = 164;
const CARD_Y = 44;
const CARD_X = [38, 233, 428];

const drawFruitPlate = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const cx = x + w / 2;
  const base = y + h - 26;
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, base, 58, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // tomato
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.arc(cx - 26, base - 18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.ellipse(cx - 26, base - 32, 6, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // lemon
  ctx.fillStyle = '#e8c547';
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx + 4, base - 16, 16, 11, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // grapes
  ctx.fillStyle = C.purple;
  const dots: [number, number][] = [
    [cx + 32, base - 20],
    [cx + 42, base - 14],
    [cx + 32, base - 8],
  ];
  dots.forEach(([gx, gy]) => {
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawNumberSign = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number) => {
  const cx = x + w / 2;
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, y + 156);
  ctx.lineTo(cx, y + 70);
  ctx.stroke();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(cx - 44, y + 18, 88, 48, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.blue;
  ctx.font = 'bold 30px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('3', cx, y + 43);
  // heart icon below the sign
  const hy = y + 92;
  const r = 13;
  ctx.beginPath();
  ctx.moveTo(cx, hy + r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.5, hy - r * 0.1, cx - r * 0.7, hy - r * 1.2, cx, hy - r * 0.4);
  ctx.bezierCurveTo(cx + r * 0.7, hy - r * 1.2, cx + r * 1.5, hy - r * 0.1, cx, hy + r * 0.9);
  ctx.closePath();
  ctx.fillStyle = C.red;
  ctx.fill();
};

const drawCustomers = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const base = y + h - 18;
  const x1 = x + w * 0.32;
  const x2 = x + w * 0.68;
  const body = (bx: number, color: string) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx - 15, base - 36, 30, 36, 8);
    ctx.fill();
    ctx.stroke();
  };
  body(x1, C.blue);
  body(x2, C.muted);
  const head = (hx: number) => {
    ctx.fillStyle = '#f2e3cf';
    ctx.strokeStyle = C.deep;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, base - 48, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.beginPath();
    ctx.arc(hx - 4, base - 50, 1.4, 0, Math.PI * 2);
    ctx.arc(hx + 4, base - 50, 1.4, 0, Math.PI * 2);
    ctx.fill();
  };
  head(x1);
  head(x2);
  // the left customer is the lady: glasses + longer hair
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x1 - 4, base - 50, 4.5, 0, Math.PI * 2);
  ctx.moveTo(x1 + 8.5, base - 50);
  ctx.arc(x1 + 4, base - 50, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1 - 0.5, base - 50);
  ctx.lineTo(x1 + 0.5, base - 50);
  ctx.stroke();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1 - 11, base - 52);
  ctx.lineTo(x1 - 12, base - 40);
  ctx.moveTo(x1 + 11, base - 52);
  ctx.lineTo(x1 + 12, base - 40);
  ctx.stroke();
};

const CARD_ART = [drawFruitPlate, drawNumberSign, drawCustomers];

export const Ch2Vqa: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ scene: 0, qIdx: 0 });
  const [scene, setScene] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [feedback, setFeedback] = useState({
    text: `「${SCENES[0].qs[0]}」——厨师答：「${SCENES[0].ans[0]}」。VLM 的输出是自由文本——离『电机指令』还差一步，但知识已经全在这颗大脑里。`,
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.cursor = 'pointer';

    const render = (s: { scene: number; qIdx: number }, ms: number) => {
      const t = ms / 1000;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);
      // left 55% — three clickable photo cards
      CARD_ART.forEach((fn, i) => {
        const x = CARD_X[i];
        ctx.fillStyle = C.white;
        ctx.strokeStyle = i === s.scene ? C.green : C.border;
        ctx.lineWidth = i === s.scene ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, CARD_Y, CARD_W, CARD_H, 10);
        ctx.fill();
        ctx.stroke();
        fn(ctx, x, CARD_Y, CARD_W, CARD_H);
      });
      // link the selected photo to the chef
      const sx = CARD_X[s.scene] + CARD_W / 2;
      ctx.save();
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, CARD_Y + CARD_H + 8);
      ctx.quadraticCurveTo(sx, 230, 664, 230);
      ctx.stroke();
      ctx.restore();
      // right 45% — the chef (VLM) and its answer bubble
      drawChef(ctx, 700, 246, 1.5, { mode: 'read', t });
      drawSceneLabel(ctx, 'VLM', 700, 150, { align: 'center', color: C.blue });
      const answer = SCENES[s.scene].ans[s.qIdx];
      const by = 88 + Math.sin(t * 2 * Math.PI) * 2;
      ctx.font = '14px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      const bw = ctx.measureText(answer).width + 30;
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.roundRect(898 - bw / 2, by - 18, bw, 36, 9);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(898 - 12, by + 15);
      ctx.lineTo(898 - 22, by + 30);
      ctx.lineTo(898 + 2, by + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.white;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(answer, 898, by + 1);
    };

    const tick = () => {
      render(stateRef.current, performance.now());
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

  const applySelection = (next: { scene: number; qIdx: number }) => {
    stateRef.current = next;
    if (next.scene !== scene) setScene(next.scene);
    if (next.qIdx !== qIdx) setQIdx(next.qIdx);
    setFeedback({
      text: `「${SCENES[next.scene].qs[next.qIdx]}」——厨师答：「${SCENES[next.scene].ans[next.qIdx]}」。VLM 的输出是自由文本——离『电机指令』还差一步，但知识已经全在这颗大脑里。`,
      cls: '',
    });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (let i = 0; i < CARD_ART.length; i++) {
      if (x >= CARD_X[i] && x <= CARD_X[i] + CARD_W && y >= CARD_Y && y <= CARD_Y + CARD_H) {
        applySelection({ scene: i, qIdx: 0 });
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <span>场景</span>
        {SCENES.map((s, i) => (
          <button
            key={s.name}
            className={`chip ${scene === i ? 'selected' : ''}`}
            onClick={() => applySelection({ scene: i, qIdx: 0 })}
          >
            {s.name}
          </button>
        ))}
        <span>问题</span>
        {SCENES[scene].qs.map((q, i) => (
          <button
            key={q}
            className={`chip ${qIdx === i ? 'selected' : ''}`}
            onClick={() => applySelection({ scene, qIdx: i })}
          >
            {q}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Vqa;
