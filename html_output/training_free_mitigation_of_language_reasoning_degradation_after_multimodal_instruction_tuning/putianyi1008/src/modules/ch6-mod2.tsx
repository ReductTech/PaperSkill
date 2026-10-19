import React, { useRef, useState } from 'react';
import { C, stage, rack, label, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

export const Ch6Mod2: React.FC = () => {
  const [attach, setAttach] = useState(false);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '合并只作用在语言模型权重上，此时还没有完整的视觉通路。',
    c: '',
  });
  // One-shot reveal timestamp: the five task squares light up once after
  // reattaching and then hold, so no ambient loop resets the chosen state.
  const litAt = useRef(0);

  const ref = useStudioCanvas(W, H, (ctx, now) => {
    stage(ctx, W, H);

    // merged language model block (always green)
    rack(ctx, 90, 88, 180, 96, C.green, true);

    // connection line
    ctx.strokeStyle = attach ? C.warm : C.axis;
    ctx.lineWidth = attach ? 2.6 : 1.4;
    if (!attach) ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(270, 136);
    ctx.lineTo(420, 136);
    ctx.stroke();
    ctx.setLineDash([]);

    // vision encoder + projection
    for (let i = 0; i < 2; i++) {
      rack(ctx, 420 + i * 140, 88, 120, 96, attach ? C.purple : C.axis);
      if (!attach) {
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // five vision-task squares light up once after reattaching, then hold
    let lit = 0;
    if (attach) {
      if (litAt.current === 0) litAt.current = now;
      lit = Math.min(5, 1 + Math.floor(((now - litAt.current) / 900) * 5));
    }
    for (let i = 0; i < 5; i++) {
      rack(ctx, 90 + i * 100, 210, 70, 40, i < lit ? C.green : C.axis);
      if (i >= lit) {
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    label(ctx, 90, 62, '组成');
  });

  const toggle = () => {
    const next = !attach;
    if (next) litAt.current = 0;
    setAttach(next);
    setFb(
      next
        ? {
            t: '评测视觉任务前必须重新接回标准视觉编码器，否则五个体检项目无法执行。',
            c: 'good',
          }
        : { t: '合并只作用在语言模型权重上，此时还没有完整的视觉通路。', c: '' }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button className={attach ? 'chip active' : 'chip'} onClick={toggle}>
          接回视觉编码器
        </button>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch6Mod2;
