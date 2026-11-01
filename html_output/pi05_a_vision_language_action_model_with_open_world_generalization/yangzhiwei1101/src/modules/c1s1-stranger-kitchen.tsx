import { useCallback, useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';

const W = 1472;
const H = 420;
const COUNTER = 340;

const C = {
  bg: '#f7f3ec',
  wall: '#f7f3ec',
  counter: '#d8c7ad',
  wood: '#92400e',
  steel: '#cfd8e3',
  handle: '#9fb0c8',
  ink: '#21324a',
  muted: '#68778f',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  note: '#fdf6e6',
  skin: '#f6e3cf',
  cloth: '#eef3fb',
};

const DRAWERS = [
  { x: 860, w: 150 },
  { x: 1040, w: 150 },
  { x: 1220, w: 150 },
];
const SPOON = 1;

type Kitchen = 'home' | 'stranger';

function wall(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, W, H);
  // window
  ctx.fillStyle = '#e8eef7';
  ctx.strokeStyle = C.handle;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(56, 56, 210, 132, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(161, 56);
  ctx.lineTo(161, 188);
  ctx.moveTo(56, 122);
  ctx.lineTo(266, 122);
  ctx.stroke();
  // shelf with jars
  ctx.fillStyle = C.counter;
  ctx.fillRect(330, 176, 300, 12);
  ['#e9dcc4', '#dfe9ef', '#ead9d4'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = C.handle;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(352 + i * 84, 122, 54, 54, 6);
    ctx.fill();
    ctx.stroke();
  });
  // wall cabinet above the drawers so the right side reads as a kitchen
  ctx.fillStyle = '#e9eef5';
  ctx.strokeStyle = C.handle;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(860, 34, 530, 116, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1125, 34);
  ctx.lineTo(1125, 150);
  ctx.stroke();
  ctx.fillStyle = C.handle;
  ctx.fillRect(1050, 96, 34, 7);
  ctx.fillRect(1166, 96, 34, 7);
}

function counterSlab(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.counter;
  ctx.fillRect(0, COUNTER, W, H - COUNTER);
  ctx.fillStyle = C.wood;
  ctx.fillRect(0, COUNTER, W, 8);
}

function stove(ctx: CanvasRenderingContext2D, x: number) {
  ctx.fillStyle = '#dfe5ee';
  ctx.strokeStyle = C.handle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, 292, 190, 48, 6);
  ctx.fill();
  ctx.stroke();
  [0, 1].forEach((i) => {
    ctx.beginPath();
    ctx.arc(x + 52 + i * 86, 316, 18, 0, Math.PI * 2);
    ctx.stroke();
  });
  // pot
  ctx.fillStyle = '#c9d3e0';
  ctx.beginPath();
  ctx.roundRect(x + 22, 262, 62, 32, 5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 40, 262);
  ctx.lineTo(x + 66, 262);
  ctx.stroke();
}

function plateStack(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y - i * 11, 40, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawerUnit(
  ctx: CanvasRenderingContext2D,
  d: { x: number; w: number },
  kitchen: Kitchen,
  openK: number,
  isOpen: boolean,
) {
  const y = 160;
  const h = 172;
  const dy = openK * 26;
  ctx.fillStyle = C.steel;
  ctx.strokeStyle = C.handle;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(d.x, y + dy, d.w, h, 6);
  ctx.fill();
  ctx.stroke();
  // handle
  ctx.fillStyle = C.handle;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2.5;
  if (kitchen === 'home') {
    ctx.fillRect(d.x + 42, y + 56 + dy, d.w - 84, 9);
    ctx.strokeRect(d.x + 42, y + 56 + dy, d.w - 84, 9);
  } else {
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, y + 62 + dy, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(d.x + d.w / 2, y + 62 + dy, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (isOpen) {
    ctx.fillStyle = '#f2e9d8';
    ctx.fillRect(d.x + 6, y + h - 34 + dy, d.w - 12, 28);
    if (d === DRAWERS[SPOON]) {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(d.x + 40, y + h - 22 + dy);
      ctx.lineTo(d.x + 96, y + h - 16 + dy);
      ctx.stroke();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.ellipse(d.x + 102, y + h - 15 + dy, 9, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function apprentice(ctx: CanvasRenderingContext2D, x: number, handX: number, handY: number, mood: 'ok' | 'slip' | 'idle') {
  const y = COUNTER;
  // body
  ctx.fillStyle = C.cloth;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 38, y - 158, 76, 158, 18);
  ctx.fill();
  ctx.stroke();
  // apron
  ctx.fillStyle = '#fde8cf';
  ctx.strokeStyle = '#e8c9a8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 26, y - 104, 52, 104, 8);
  ctx.fill();
  ctx.stroke();
  // head
  ctx.fillStyle = C.skin;
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y - 196, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // eyes
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(x + 8, y - 200, 3.4, 0, Math.PI * 2);
  ctx.fill();
  // near arm (resting)
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 36, y - 132);
  ctx.lineTo(x - 56, y - 66);
  ctx.stroke();
  // working arm
  ctx.beginPath();
  ctx.moveTo(x + 34, y - 136);
  ctx.quadraticCurveTo((x + handX) / 2, Math.min(y - 136, handY) - 84, handX, handY);
  ctx.stroke();
  ctx.fillStyle = mood === 'slip' ? C.red : C.ink;
  ctx.beginPath();
  ctx.arc(handX, handY, 11, 0, Math.PI * 2);
  ctx.fill();
  if (mood === 'slip') {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(handX, handY, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: number, color: string) {
  ctx.strokeStyle = '#dfe5ee';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p, 0, 1));
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '700 24px "Segoe UI","PingFang SC",sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(p * 100)}%`, cx, cy + 9);
  ctx.fillStyle = C.muted;
  ctx.font = '500 16px "Segoe UI","PingFang SC",sans-serif';
  ctx.fillText('这一桌的完成度', cx, cy + 44);
  ctx.fillText('', cx, cy + 66);
  ctx.textAlign = 'left';
}

export function StrangerKitchen(_: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [kitchen, setKitchen] = useState<Kitchen>('home');
  const [tries, setTries] = useState(0);
  const [opened, setOpened] = useState<number[]>([]);
  const [slipped, setSlipped] = useState<number | null>(null);
  const [hand, setHand] = useState({ x: 400, y: 240 });
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState('拖动学徒的手，按到抽屉把手上再松手。');

  const progress =
    opened.length === 0 ? 0 : opened.includes(SPOON) ? (kitchen === 'home' ? 0.65 : tries > 1 ? 0.28 : 0.12) : 0.1;

  const draw = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = setupCanvas(cv, W, H);
    wall(ctx);
    counterSlab(ctx);
    stove(ctx, 600);
    plateStack(ctx, 480, COUNTER - 6);
    DRAWERS.forEach((d, i) => drawerUnit(ctx, d, kitchen, 0, opened.includes(i)));
    apprentice(ctx, 300, hand.x, hand.y, slipped !== null ? 'slip' : 'idle');

    // task note
    ctx.fillStyle = C.note;
    ctx.strokeStyle = '#e8d9b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(700, 40, 420, 54, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.font = '700 21px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillText('老板只说一句：把这桌收拾干净', 718, 74);

    ring(ctx, 1360, 110, progress, progress >= 0.6 ? C.green : progress > 0 ? C.blue : '#c8d0dc');

  }, [opened, kitchen, hand, slipped, progress]);

  useEffect(() => {
    draw();
  }, [draw]);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = ref.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - r.left) / r.width) * W, 0, W),
      y: clamp(((e.clientY - r.top) / r.height) * H, 0, H),
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    setDragging(true);
    setHand(toLocal(e));
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragging) setHand(toLocal(e));
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    setDragging(false);
    const p = toLocal(e);
    const hit = DRAWERS.findIndex((d) => p.x >= d.x - 10 && p.x <= d.x + d.w + 10 && p.y >= 150 && p.y <= 340);
    const nextTries = tries + 1;
    setTries(nextTries);
    if (hit < 0) {
      setMsg('手没按到把手上，重来一次。');
      return;
    }
    if (kitchen === 'home') {
      setOpened((prev) => (prev.includes(hit) ? prev : [...prev, hit]));
      setSlipped(null);
      setMsg(hit === SPOON ? '一次就拉开了：这个把手你在自家厨房见过，汤勺就在里面。' : '拉开了，但这个抽屉里没有汤勺。');
    } else if (nextTries === 1) {
      setSlipped(hit);
      setMsg('把手形状没见过，手滑开了。换一个厨房，连开抽屉都要重学一遍。');
    } else {
      setOpened((prev) => (prev.includes(hit) ? prev : [...prev, hit]));
      setSlipped(null);
      setMsg(hit === SPOON ? '第二次才拉开。找到了，但比在自家厨房多花了好几步。' : '第二次拉开，仍然不是汤勺。');
    }
  };

  const switchKitchen = (k: Kitchen) => {
    setKitchen(k);
    setOpened([]);
    setTries(0);
    setSlipped(null);
    setMsg(k === 'home' ? '熟悉的厨房：把手和你练过的一模一样。' : '陌生的厨房：抽屉位置和把手都变了。');
  };

  const tone = slipped !== null ? C.red : progress >= 0.6 ? C.green : C.blue;

  return (
    <div className="pi-col">
      <canvas
        ref={ref}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
        aria-label="拖动手臂去拉抽屉"
      />
      <div className="pi-row">
        <div className="pi-choice">
          <button className={kitchen === 'home' ? 'is-on' : ''} onClick={() => switchKitchen('home')}>
            自家厨房
          </button>
          <button className={kitchen === 'stranger' ? 'is-on' : ''} onClick={() => switchKitchen('stranger')}>
            陌生厨房
          </button>
        </div>
        <p className="pi-feedback" style={{ color: tone }}>{msg}</p>
      </div>
    </div>
  );
}
