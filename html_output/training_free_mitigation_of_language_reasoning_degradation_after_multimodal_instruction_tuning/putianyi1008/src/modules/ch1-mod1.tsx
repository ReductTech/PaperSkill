import React, { useCallback, useEffect, useRef, useState } from 'react';
import { C, stage, guitar, dial, target, label, legend, num, useStudioCanvas } from './studiokit';

const W = 1080;
const H = 280;

// The tuning peg the learner drags sits here; dragging is hit-tested against it.
const PEG_X = 520;
const PEG_Y = 78;
const HIT = 130;

export const Ch1Mod1: React.FC = () => {
  const [adapt, setAdapt] = useState(0);
  const dragging = useRef(false);
  const [fb, setFb] = useState<{ t: string; c: string }>({
    t: '两边都还在基准线上。在画布上按住弦钮上下拖动，开始加视觉适配。',
    c: '',
  });

  const apply = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setAdapt(clamped);
    if (clamped === 0) {
      setFb({ t: '回到基准：未做多模态适配时，语言成绩就是基线。', c: 'good' });
    } else if (clamped < 25) {
      setFb({ t: '两边都还在基准线附近。继续往上拖，开始加视觉适配。', c: '' });
    } else if (clamped < 70) {
      setFb({ t: '视觉能力在上升，语言指针已经开始下沉——这就是语言推理退化。', c: 'bad' });
    } else {
      setFb({ t: '视觉适配很充分，但语言能力掉得更多，退化不是免费的。', c: 'bad' });
    }
  }, []);

  const ref = useStudioCanvas(W, H, (ctx) => {
    stage(ctx, W, H);
    const a = adapt / 100;

    guitar(ctx, 200, 200, 1.0, C.light, C.dark, a * 1.15);

    // tuning head: one peg, drawn as the draggable target
    ctx.strokeStyle = C.warm;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(PEG_X, PEG_Y - 36);
    ctx.lineTo(PEG_X, PEG_Y + 36);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PEG_X, PEG_Y, 20, 0, Math.PI * 2);
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.save();
    ctx.translate(PEG_X, PEG_Y);
    ctx.rotate(-1.4 + a * 2.8);
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.restore();

    // the two level dials separate as adaptation grows
    dial(ctx, 700, 120, 76, -0.5 + a * 1.15, a > 0.25 ? C.red : C.blue);
    dial(ctx, 930, 120, 76, -0.7 + a * 0.95, a > 0.25 ? C.green : C.blue);
    target(ctx, 672, 48, C.green);
    target(ctx, 902, 48, C.green);

    // Both readings are a schematic trend, not paper measurements.
    // The language needle interpolates between two means WE computed from paper
    // Table 2 (p.9). The paper reports no average row, so both are spelled out
    // cell by cell here so they can be re-derived:
    //   Mistral `Mistral 0.2 LM` row:
    //     .6602+.5901+.6683+.7371+.8130+.4612+.3560+.3950 = 4.6809 / 8 = 0.585113
    //   unmerged LLaVA-1.6-Mistral (`Llava 1.6 Mistral` alpha=0) row:
    //     .5971+.5783+.7215+.7120+.7820+.4459+.3140+.3282 = 4.4790 / 8 = 0.559875
    //   (for reference, the Vicuna `Vicuna 1.5 LM` row:
    //     .5648+.4862+.5986+.7000+.7554+.4162+.3300+.2010 = 4.0522 / 8 = 0.506525)
    // The vision needle starts at zero because the plain LLM has no visual ability
    // at all, and its maximum is a unitless schematic (it does not map onto any
    // single Table 3 quantity, whose columns differ in scale).
    const langMean = 0.5851;
    const langEnd = 0.5599;
    num(ctx, 700, 224, langMean + (langEnd - langMean) * a, a > 0.25 ? C.red : C.text, 17, 'center');
    num(ctx, 930, 224, a * 0.82, a > 0.25 ? C.green : C.text, 17, 'center');

    label(ctx, 700, 30, '语言', C.text, 'center');
    label(ctx, 930, 30, '视觉', C.text, 'center');
    legend(ctx, 90, 254, [
      ['基准', C.blue],
      ['退化', C.red],
      ['提升', C.green],
    ]);
  });

  // Direct manipulation on the canvas itself (P6): pointer events with a
  // CSS-pixel to intrinsic-coordinate conversion, clamped to the valid range.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - r.left) * (W / (r.width || W)),
        y: (e.clientY - r.top) * (H / (r.height || H)),
      };
    };
    const down = (e: PointerEvent) => {
      const p = toLocal(e);
      if (Math.hypot(p.x - PEG_X, p.y - PEG_Y) > HIT) return;
      dragging.current = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const p = toLocal(e);
      apply(((PEG_Y + HIT - p.y) / (2 * HIT)) * 100);
    };
    const up = () => {
      dragging.current = false;
      canvas.style.cursor = 'grab';
    };
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  }, [ref, apply]);

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          多模态适配强度 <span className="val">{adapt}</span>
        </label>
        <button className="chip" onClick={() => apply(adapt - 5)}>
          减小
        </button>
        <button className="chip" onClick={() => apply(adapt + 5)}>
          增大
        </button>
      </div>
      <div className="ctrl" style={{ display: 'block', color: 'var(--slate)' }}>
        指针的起止水平按论文端点标定：语言端从 Mistral 基座的 8 项均值 0.5851 走到未合并 LLaVA-1.6-Mistral 的 0.5599
        （两个均值都是本教程按论文 Table 2 对应行逐格求和后除以 8 得到的：4.6809/8 与 4.4790/8；论文没有平均行）。
        视觉端是无量纲示意（0→0.82），不对应 Table 3 的任何单一量纲。中间为插值示意，不是论文表格中的数值，两路也不相加。
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
    </div>
  );
};

export default Ch1Mod1;
