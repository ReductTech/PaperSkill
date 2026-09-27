import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawArm,
  drawTokenString,
  drawCheckMark,
  drawSceneLabel,
  drawLegend,
} from './flatKit';
import type { WidgetProps } from './registry';

// §9 module 9.2 — 语言接地步进 (P2 stepper): step through a multi-object
// tabletop instruction. Step 1 shows the instruction card, step 2 locks the
// green attention box onto the corn (distractor cup excluded), step 3 emits
// the action token string and the arm carries the corn to the pink plate.
const W = 1080;
const H = 280;
const CORN0 = { x: 400, y: 226 };
const CORN1 = { x: 744, y: 226 };
const PLATE = { x: 770, y: 238 };
const CUP = { x: 560, y: 234 };

const STEPS = [
  {
    text: '指令进门：桌面上玉米、干扰杯、粉色盘混在一起——认错目标就全盘皆输，先看 OpenVLA 的眼睛怎么读这张卡。',
    cls: '',
  },
  {
    text: '绿色注意框锁定黄色玉米、排除干扰杯——语言接地靠的正是双眼里的语义尺（SigLIP）。',
    cls: 'good',
  },
  {
    text: '语言接地是多物体场景的生死线——这正是双眼里<b>语义尺</b>的功劳；但纯语义任务仍输 RT-2-X：OpenVLA 只用机器人数据微调，没有网页共练来保鲜知识。',
    cls: 'good',
  },
];

export const Ch9Grounding: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const [fb, setFb] = useState({ text: STEPS[0].text, cls: STEPS[0].cls });
  const stepRef = useRef(1);

  useEffect(() => {
    stepRef.current = step;
    setFb({ text: STEPS[step - 1].text, cls: STEPS[step - 1].cls });
  }, [step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const drawCard = (x: number, y: number, w: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 24, w, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('把黄色玉米放到粉色盘', x, y + 1);
      ctx.restore();
    };

    const drawCorn = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      // husk leaves
      ctx.strokeStyle = '#5f8f3e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-2, -12);
      ctx.quadraticCurveTo(-14, -20, -18, -8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, -12);
      ctx.quadraticCurveTo(12, -22, 17, -10);
      ctx.stroke();
      // cob
      ctx.fillStyle = '#f2c53d';
      ctx.strokeStyle = '#b98a1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 5, 9, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // kernels
      ctx.fillStyle = '#d9a72a';
      for (let r = 0; r < 3; r++) {
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          ctx.arc(-3 + k * 6, -3 + r * 6, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const drawCup = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#cfe0ef';
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-13, -26);
      ctx.lineTo(13, -26);
      ctx.lineTo(10, 0);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#9db8d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-11, -14);
      ctx.lineTo(11, -14);
      ctx.stroke();
      ctx.restore();
    };

    const drawPlate = (x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#f3c6d6';
      ctx.strokeStyle = '#d88aab';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 36, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#e7a8c2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y - 1, 24, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const attentionBox = (x: number, y: number, t: number) => {
      const s = 1 + 0.05 * Math.sin(t * Math.PI * 2);
      ctx.save();
      ctx.translate(x, y - 10);
      ctx.scale(s, s);
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-22, -22, 44, 52);
      ctx.setLineDash([]);
      // solid corner accents
      ctx.lineWidth = 3.5;
      const c = 8;
      ctx.beginPath();
      ctx.moveTo(-22, -22 + c);
      ctx.lineTo(-22, -22);
      ctx.lineTo(-22 + c, -22);
      ctx.moveTo(22 - c, -22);
      ctx.lineTo(22, -22);
      ctx.lineTo(22, -22 + c);
      ctx.moveTo(22, 30 - c);
      ctx.lineTo(22, 30);
      ctx.lineTo(22 - c, 30);
      ctx.moveTo(-22 + c, 30);
      ctx.lineTo(-22, 30);
      ctx.lineTo(-22, 30 - c);
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const stepNow = stepRef.current;
      const t = (ms % 3400) / 3400;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // objects (faint on step 1, full from step 2)
      const sceneAlpha = stepNow === 1 ? 0.3 : 1;
      ctx.save();
      ctx.globalAlpha = sceneAlpha;
      drawPlate(PLATE.x, PLATE.y);
      drawCup(CUP.x, CUP.y);
      ctx.restore();

      // instruction card: big & centered on step 1, docked small afterwards
      if (stepNow === 1) {
        drawCard(540, 96, 260, 1);
      } else {
        drawCard(160, 64, 236, 1);
      }

      // corn position: static until step 3, then carried to the plate
      let corn = { ...CORN0 };
      let moving = false;
      if (stepNow === 3) {
        const move = easeInOutQuad(clamp((t - 0.15) / 0.55, 0, 1));
        corn = {
          x: lerp(CORN0.x, CORN1.x, move),
          y: lerp(CORN0.y, CORN1.y, move) - 30 * Math.sin(move * Math.PI),
        };
        moving = move > 0 && move < 1;
      }
      drawCorn(corn.x, corn.y);

      // attention box: step 2 static lock, step 3 follows the corn
      const done = stepNow === 3 && !moving && corn.x === CORN1.x;
      if (stepNow === 2 || (stepNow === 3 && !done)) {
        attentionBox(corn.x, corn.y, ms / 500);
      }
      if (done) drawCheckMark(ctx, PLATE.x, PLATE.y - 44, 10);

      // action token string + arm on step 3
      if (stepNow === 3) {
        const hi = Math.floor(t * 5) % 5;
        drawTokenString(ctx, 462, 44, ['143', '087', '012', '205', '034'], 40, hi);
        drawArm(ctx, 300, 246, {
          scale: 1.7,
          angle: 0.15 + 0.3 * Math.sin(ms / 480),
          grip: moving ? 0.15 : 0.8,
          color: C.blue,
        });
      }

      drawSceneLabel(ctx, '多物体场景', 24, 28, { color: C.muted });
      drawLegend(
        ctx,
        [
          ['目标·玉米', C.green],
          ['干扰·杯子', C.blue],
        ],
        24,
        H - 14
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          步进 <span className="val">{step} / 3</span>
        </label>
        <button className="tiny" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          上一步
        </button>
        <button className="tiny" disabled={step === 3} onClick={() => setStep((s) => s + 1)}>
          下一步
        </button>
      </div>
      <div
        style={{
          marginTop: 10,
          border: `2px solid ${step === 3 ? '#c43f52' : '#d7deea'}`,
          borderRadius: 10,
          padding: '10px 14px',
          background: '#fdf6f6',
          opacity: step === 3 ? 1 : 0.55,
          transition: 'opacity 0.3s, border-color 0.3s',
        }}
      >
        <div style={{ fontSize: 12, color: '#68778f' }}>Google Robot · 语义任务</div>
        <div style={{ fontSize: 14, color: '#21324a', margin: '4px 0 6px' }}>
          「把可乐拿给泰勒·斯威夫特」
        </div>
        <span
          style={{
            display: 'inline-block',
            fontSize: 12,
            color: '#c43f52',
            border: '1.5px solid #c43f52',
            borderRadius: 999,
            padding: '2px 10px',
          }}
        >
          语义任务：RT-2-X 更强（网页共练）
        </span>
      </div>
      <div
        className={`feedback ${fb.cls}`}
        dangerouslySetInnerHTML={{ __html: fb.text }}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

export default Ch9Grounding;
