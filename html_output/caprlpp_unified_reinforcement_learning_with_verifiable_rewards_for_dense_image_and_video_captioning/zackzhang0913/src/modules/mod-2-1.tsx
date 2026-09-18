import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawScoreboard, drawScoreCell, drawHourglass, drawTimeBadge, drawBiasCoin,
  drawCurveAxis, drawCurve, drawBar, drawBars, drawLabel, drawLegend,
} from '../canvas-scene';

const W = 1080;
const H = 280;

// 2.1 讲解里能装哪几类信息：点击画面上的四类区域，看各能支撑什么问题。
const ZONES = [
  { key: 'object', x: 70, y: 60, w: 120, h: 70, label: '物体', q: '画面里有什么？' },
  { key: 'attribute', x: 210, y: 60, w: 120, h: 70, label: '属性', q: '它是什么颜色？' },
  { key: 'relation', x: 350, y: 60, w: 120, h: 70, label: '关系', q: '谁在谁的左边？' },
  { key: 'text', x: 490, y: 60, w: 120, h: 70, label: '文字', q: '招牌上写了什么？' },
] as const;

export const Mod21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ picked: string | null }>({ picked: null });
  const [picked, setPicked] = useState<string | null>(null);
  const [fb, setFb] = useState({ text: '先点一块区域，看它能支撑哪一类问题。一次只看一类。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const render = (s: { picked: string | null }) => {
      gameField(ctx, W, H);
      drawPictureCard(ctx, 60, 50, 570, 'clean');
      for (const z of ZONES) {
        const on = s.picked === z.key;
        ctx.save();
        ctx.strokeStyle = on ? C.blue : C.axis;
        ctx.lineWidth = on ? 3 : 2;
        ctx.setLineDash(on ? [] : [6, 5]);
        ctx.beginPath();
        ctx.rect(z.x, z.y, z.w, z.h);
        ctx.stroke();
        ctx.restore();
      }
      const slots = ['物体', '属性', '关系', '文字'];
      for (let i = 0; i < slots.length; i++) {
        const on = s.picked === ZONES[i].key;
        ctx.save();
        ctx.fillStyle = on ? '#ffffff' : C.bg;
        ctx.strokeStyle = on ? C.green : C.axis;
        ctx.lineWidth = on ? 3 : 2;
        ctx.setLineDash(on ? [] : [6, 5]);
        ctx.beginPath();
        ctx.rect(700, 40 + i * 54, 340, 44);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (on) drawLabel(ctx, ZONES[i].q.slice(0, 8), 716, 62 + i * 54, C.ink, 16);
      }
      for (let i = 0; i < 4; i++) drawScoreCell(ctx, 700 + i * 22, 250, 16, i < (s.picked ? 1 : 0), C.green);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (k: string) => {
    stateRef.current = { picked: k };
    setPicked(k);
    const text: Record<string, string> = {
      object: '物体：先说清「画面里有什么」，这是后面所有信息的地基。漏了它，学生连主体都认不出。',
      attribute: '属性：颜色、形状、材质。两个相似物体放一起时，只有属性能把它们分开。',
      relation: '关系：谁在谁左边、谁扶着谁。这类信息最容易漏，也最难靠常识补出来。',
      text: '文字：画面里的招牌、标签、数字，不写进讲解，学生就永远答不出这一整类问题。',
    };
    setFb({ text: text[k], cls: '' });
  };

  const hit = (evt: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = evt.currentTarget;
    const r = canvas.getBoundingClientRect();
    const x = ((evt.clientX - r.left) / r.width) * W;
    const y = ((evt.clientY - r.top) / r.height) * H;
    for (const z of ZONES) {
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
        pick(z.key);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={ref}
        width={W}
        height={H}
        onClick={hit}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <label>
          信息类别 <span className="val">{picked ? ZONES.find((z) => z.key === picked)?.label : '未选'}</span>
        </label>
        {ZONES.map((z) => (
          <button key={z.key} className={`chip ${picked === z.key ? 'selected' : ''}`} onClick={() => pick(z.key)}>
            {z.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod21;
