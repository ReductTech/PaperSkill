import { useEffect, useRef, useState } from 'react';
import { setupCanvas, clamp } from '../lib/canvasKit';

const W = 1472;
const H = 430;
const COUNTER = 340;

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
  note: '#fdf6e6',
  skin: '#f6e3cf',
  cloth: '#eef3fb',
};

export function DrawerLoop(_: { chapterId: string; moduleId: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [interference, setInterference] = useState(80);
  const [richer, setRicher] = useState(false);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  const eff = richer ? interference * 0.45 : interference;
  const stuck = eff > 25;
  const progress = stuck ? clamp(0.34 - (eff - 25) / 320, 0.05, 0.34) : 0.86;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = setupCanvas(cv, W, H);
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      tRef.current += dt / 1000;
      const t = tRef.current;

      const speed = stuck ? 0.32 + eff / 110 : 0.1;
      const openK = stuck ? clamp(Math.sin(t * Math.PI * 2 * speed), 0, 1) : 0;

      // wall
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(159,176,200,0.4)';
      ctx.lineWidth = 1;
      for (let x = 40; x < W; x += 74) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, COUNTER);
        ctx.stroke();
      }
      // window
      ctx.fillStyle = '#e8eef7';
      ctx.strokeStyle = C.handle;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(60, 56, 200, 126, 8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(160, 56);
      ctx.lineTo(160, 182);
      ctx.moveTo(60, 119);
      ctx.lineTo(260, 119);
      ctx.stroke();
      // shelf
      ctx.fillStyle = C.counter;
      ctx.fillRect(300, 170, 240, 12);
      ['#e9dcc4', '#dfe9ef', '#ead9d4'].forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.strokeStyle = C.handle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(318 + i * 70, 120, 46, 48, 6);
        ctx.fill();
        ctx.stroke();
      });
      // counter
      ctx.fillStyle = C.counter;
      ctx.fillRect(0, COUNTER, W, H - COUNTER);
      ctx.fillStyle = C.wood;
      ctx.fillRect(0, COUNTER, W, 8);

      // drawer
      const dy = openK * 30;
      ctx.fillStyle = C.steel;
      ctx.strokeStyle = C.handle;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(700, 170 + dy, 180, 160, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.handle;
      ctx.fillRect(748, 222 + dy, 84, 9);
      if (openK > 0.15) {
        ctx.fillStyle = '#f2e9d8';
        ctx.fillRect(706, 170 + 126 + dy, 168, 28);
      }

      // apprentice
      const jitter = stuck ? Math.sin(t * 24) * 10 : 0;
      const handX = (stuck ? 660 + 30 * openK : 700) + jitter;
      const handY = (stuck ? 232 + 24 * openK : 250) - 6;
      ctx.fillStyle = C.cloth;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(300, COUNTER - 176, 76, 176, 16);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.note;
      ctx.strokeStyle = '#e8d9b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(313, COUNTER - 116, 50, 116, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.skin;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(338, COUNTER - 218, 29, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(348, COUNTER - 222, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(344, COUNTER - 152);
      ctx.quadraticCurveTo((344 + handX) / 2, Math.min(COUNTER - 152, handY) - 86, handX, handY);
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(handX, handY, 11, 0, Math.PI * 2);
      ctx.fill();

      // head chef
      ctx.fillStyle = C.skin;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(1000, 106, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(975, 130, 50, 90, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(240,126,71,0.25)';
      ctx.beginPath();
      ctx.roundRect(983, 164, 34, 54, 6);
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(975, 146);
      ctx.lineTo(944, 166);
      ctx.stroke();

      // bubble
      const sayStuck = ['再打开抽屉看看', '关上看看', '再打开一次'];
      const say = stuck ? sayStuck[Math.floor(t * 1.4) % sayStuck.length] : '先把杯子放进去';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = stuck ? C.red : C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(560, 30, 380, 52, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = stuck ? C.red : C.green;
      ctx.font = '700 21px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText(say, 582, 64);
      ctx.beginPath();
      ctx.moveTo(940, 62);
      ctx.lineTo(972, 84);
      ctx.stroke();

      // ring
      const cx = 1330;
      const cy = 130;
      ctx.strokeStyle = '#dfe5ee';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = stuck ? C.red : C.green;
      ctx.beginPath();
      ctx.arc(cx, cy, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(progress, 0, 1));
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = '700 24px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(progress * 100)}%`, cx, cy + 9);
      ctx.fillStyle = C.muted;
      ctx.font = '500 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText('这一桌的完成度', cx, cy + 74);
      ctx.textAlign = 'left';

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [eff, stuck, progress]);

  return (
    <div className="pi-col">
      <canvas ref={ref} aria-label="高层推理被抽屉反复干扰的动画" />
      <div className="pi-row pi-row-tight">
        <label className="pi-slider">
          <span>干扰强度</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={interference}
            onChange={(e) => setInterference(Number(e.target.value))}
          />
          <b>{interference}</b>
        </label>
        <div className="pi-choice">
          <button className={!richer ? 'is-on' : ''} onClick={() => setRicher(false)}>
            当前上下文
          </button>
          <button className={richer ? 'is-on' : ''} onClick={() => setRicher(true)}>
            更丰富的上下文
          </button>
        </div>
      </div>
      <p className="pi-feedback" style={{ color: stuck ? C.red : C.green }}>
        {stuck
          ? '高层子任务被场景细节牵着走：抽屉开了关、关了开，动作块一直在做无用功。'
          : '干扰被压住之后，高层能稳定报出下一步，动作块才有意义。'}
      </p>
      <p className="pi-note">
        「更丰富的上下文」是论文 §VI 提出的未来方向，不是本文已验证的修复手段；论文自述的失败还包括陌生抽屉把手与机械臂挡住污渍。
      </p>
    </div>
  );
}
