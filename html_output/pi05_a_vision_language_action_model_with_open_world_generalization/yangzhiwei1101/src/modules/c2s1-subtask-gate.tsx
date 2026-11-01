import { useCallback, useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import { SymbolHint } from '../components/SymbolHint';

const W = 980;
const H = 420;
const COUNTER = 320;

const C = {
  bg: '#f7f3ec',
  counter: '#d8c7ad',
  wood: '#92400e',
  steel: '#cfd8e3',
  handle: '#9fb0c8',
  ink: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  water: '#dbe7f2',
  skin: '#f6e3cf',
  cloth: '#eef3fb',
};

const SLOTS = [380, 500, 620];

type Cand = { id: string; label: string; target: { x: number; y: number }; score: number };

function scores(slot: number, drawerOpen: boolean): Cand[] {
  const salience = [1, 0.6, 0.25][slot];
  const drawerClosed = drawerOpen ? 0 : 1;
  return [
    { id: 'plate', label: '把盘子放进水槽', target: { x: 230, y: 286 }, score: 2.2 * salience + 1.0 * drawerClosed },
    { id: 'close', label: '先把抽屉关上', target: { x: 700, y: 282 }, score: 1.8 * (drawerOpen ? 1 : 0) + 0.4 },
    { id: 'cup', label: '把杯子放进水槽', target: { x: 300, y: 286 }, score: 0.9 },
    { id: 'spoon', label: '把勺子放回抽屉', target: { x: 690, y: 288 }, score: 0.6 + 0.5 * (drawerOpen ? 1 : 0) },
    { id: 'wipe', label: '擦一下台面', target: { x: 480, y: 288 }, score: 0.5 },
  ];
}

function softmax(list: Cand[], T = 0.7) {
  const mx = Math.max(...list.map((c) => c.score));
  const ex = list.map((c) => Math.exp((c.score - mx) / T));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
}

function post(ctx: CanvasRenderingContext2D, x: number, handX: number, handY: number) {
  ctx.fillStyle = C.cloth;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 34, COUNTER - 144, 68, 144, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fdf6e6';
  ctx.strokeStyle = '#e8d9b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 23, COUNTER - 96, 46, 96, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.skin;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, COUNTER - 178, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x + 7, COUNTER - 182, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 32, COUNTER - 122);
  ctx.lineTo(x - 52, COUNTER - 62);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 30, COUNTER - 126);
  ctx.quadraticCurveTo((x + handX) / 2, Math.min(COUNTER - 126, handY) - 74, handX, handY);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(handX, handY, 10, 0, Math.PI * 2);
  ctx.fill();
}

function headCook(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = C.skin;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, 96, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(x - 24, 118, 48, 84, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,126,71,0.25)';
  ctx.beginPath();
  ctx.roundRect(x - 17, 150, 34, 52, 6);
  ctx.fill();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 24, 132);
  ctx.lineTo(x - 52, 150);
  ctx.stroke();
}

export function SubtaskGate(_: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [slot, setSlot] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragPlate, setDragPlate] = useState(false);
  const [hand, setHand] = useState({ x: 190, y: 240 });
  const handRef = useRef(hand);
  handRef.current = hand;

  const cands = scores(slot, drawerOpen);
  const probs = softmax(cands);
  const best = probs.indexOf(Math.max(...probs));
  const chosen = cands[best];

  useEffect(() => {
    const from = { ...handRef.current };
    const to = chosen.target;
    const t0 = performance.now();
    const dur = 620;
    let raf = 0;
    const step = (t: number) => {
      const k = clamp((t - t0) / dur, 0, 1);
      const e = easeOutCubic(k);
      setHand({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [best, slot, drawerOpen]);

  const draw = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = setupCanvas(cv, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    // wall shelf
    ctx.strokeStyle = 'rgba(159,176,200,0.4)';
    ctx.lineWidth = 1;
    for (let x = 30; x < W; x += 62) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, COUNTER);
      ctx.stroke();
    }
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, COUNTER, W, 16);
    ctx.fillStyle = C.wood;
    ctx.fillRect(0, COUNTER, W, 7);

    // sink
    ctx.fillStyle = C.water;
    ctx.strokeStyle = C.handle;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(160, 262, 140, 50, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(230, 262);
    ctx.lineTo(230, 234);
    ctx.lineTo(262, 234);
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = '500 14px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('水槽', 210, 340);

    // cup
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(316, 276, 24, 32, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = '500 14px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('杯子', 306, 340);

    // drawer
    const dy = drawerOpen ? 28 : 0;
    ctx.fillStyle = C.steel;
    ctx.strokeStyle = C.handle;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(670, 168 + dy, 160, 146, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.handle;
    ctx.fillRect(712, 218 + dy, 76, 9);
    ctx.fillStyle = drawerOpen ? C.red : C.muted;
    ctx.font = '500 14px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText(drawerOpen ? '抽屉敞着（点一下关）' : '抽屉关着（点一下开）', 662, 340);

    // plate
    const px = SLOTS[slot];
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = dragPlate ? C.green : C.ink;
    ctx.lineWidth = dragPlate ? 4 : 2.5;
    ctx.beginPath();
    ctx.ellipse(px, 302, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(px, 292, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = '500 14px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('盘子（可拖）', px - 36, 340);

    post(ctx, 90, hand.x, hand.y);
    headCook(ctx, 900);

    // bubble
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(470, 26, 300, 48, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.font = '700 19px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText(chosen.label, 490, 58);
    ctx.beginPath();
    ctx.moveTo(770, 60);
    ctx.lineTo(882, 74);
    ctx.stroke();
  }, [slot, drawerOpen, hand, dragPlate, chosen]);

  useEffect(() => {
    draw();
  }, [draw]);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = ref.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    if (Math.abs(p.x - SLOTS[slot]) < 60 && Math.abs(p.y - 297) < 46) {
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      setDragPlate(true);
    } else if (p.x > 660 && p.x < 840 && p.y > 160 && p.y < 330) {
      setDrawerOpen((v) => !v);
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragPlate) return;
    const p = toLocal(e);
    let bestSlot = 0;
    let bestD = Infinity;
    SLOTS.forEach((sx, i) => {
      const d = Math.abs(p.x - sx);
      if (d < bestD) {
        bestD = d;
        bestSlot = i;
      }
    });
    setSlot(bestSlot);
  };

  const onUp = () => setDragPlate(false);
  const tone = chosen.id === 'plate' || chosen.id === 'cup' ? C.green : C.blue;

  return (
    <div className="pi-split">
      <div className="pi-left">
        <canvas
          ref={ref}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ touchAction: 'none', cursor: dragPlate ? 'grabbing' : 'default' }}
          aria-label="拖动盘子或点击抽屉，观察子任务如何改变"
        />
        <p className="pi-note">拖动盘子换位置，点抽屉切换开合；师傅那句话会跟着变。</p>
      </div>
      <div className="pi-right">
        <p className="pi-body">
          <SymbolHint meaning="t 时刻观测：多路相机图像与机器人本体状态。">o</SymbolHint> 变了，子任务分布就变。
        </p>
        <p className="pi-formula">
          π<sub>θ</sub>(
            <SymbolHint meaning="动作块 a 的简写，完整为 a_{t:t+H}：连续预测的 50 步动作，H = 49。">a</SymbolHint>, ℓ̂ | o, ℓ) = π<sub>θ</sub>(
            <SymbolHint meaning="以当前子任务 ℓ̂ 为条件生成的动作块。">a</SymbolHint> | o,{' '}
          <SymbolHint meaning="模型输出的文本 token 序列，此处即预测出的下一步子任务。">ℓ̂</SymbolHint>) · π
          <sub>θ</sub>(<SymbolHint meaning="模型输出的文本 token 序列，此处即预测出的下一步子任务。">ℓ̂</SymbolHint> | o,{' '}
          <SymbolHint meaning="高层任务指令，例如“把盘子收进抽屉”。">ℓ</SymbolHint>)
        </p>
        <ul className="pi-weights">
          {cands.map((c, i) => (
            <li key={c.id} className={i === best ? 'is-best' : ''}>
              <span className="pi-w-label">{c.label}</span>
              <span className="pi-w-bar">
                <span style={{ width: `${Math.round(probs[i] * 100)}%` }} />
              </span>
              <span className="pi-w-val">{Math.round(probs[i] * 100)}%</span>
            </li>
          ))}
        </ul>
        <p className="pi-feedback" style={{ color: tone }}>
          {chosen.id === 'plate'
            ? '子任务对了：拿起盘子，动作块直接照着这一步生成。'
            : chosen.id === 'close'
            ? '盘子被挪远了、抽屉又敞着，模型先报「关抽屉」——子任务换了，手也跟着换。'
            : `此刻报的是「${chosen.label}」，盘子的事被排到后面。`}
        </p>
        <p className="pi-note">权重是教学用玩具打分，不是论文模型的真实输出。</p>
      </div>
    </div>
  );
}
