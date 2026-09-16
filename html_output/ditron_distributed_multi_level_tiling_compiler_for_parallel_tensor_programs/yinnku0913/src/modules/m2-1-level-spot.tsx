import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  KIT,
  dTileGround,
  dGrid,
  dTile,
  dHand,
  dRule,
  dBar,
  dLabel,
  dLegend,
  type TileState,
} from './ditron-theme-kit';

// §2 module 2.1 — click one of the three level hotspots (or their DOM chips) and
// switch the granularity with two chips. Every legal combination shows the tiling
// unit of that hardware domain; an illegal one is refused with the reason in the
// feedback line instead of being drawn silently.

const W = 1080;
const H = 280;

const BAND = { x: 48, y: 40, w: 984, h: 84 };
const SEG_W = 328;
const GRAN_ZONE = { x: 48, y: 140, w: 420, h: 110 };
const LINK_ZONE = { x: 508, y: 140, w: 524, h: 110 };

type Level = 'core' | 'device' | 'task';
type Gran = 'fine' | 'coarse';
type LinkId = 'hbm' | 'nvlink' | 'nic';
type Cls = '' | 'good' | 'bad';
type Notice = 'none' | 'core-coarse' | 'task-fine';

interface SpotState {
  level: Level;
  granularity: Gran;
}

const LEVELS: { id: Level; name: string }[] = [
  { id: 'core', name: '核级' },
  { id: 'device', name: '设备级' },
  { id: 'task', name: '任务级' },
];

const LEVEL_NAME: Record<Level, string> = { core: '核级', device: '设备级', task: '任务级' };
const GRAN_NAME: Record<Gran, string> = { fine: '细粒度', coarse: '粗粒度' };
const LINK_OF: Record<Level, LinkId> = { core: 'hbm', device: 'nvlink', task: 'nic' };
const LINK_COLOR: Record<LinkId, string> = {
  hbm: KIT.success,
  nvlink: KIT.guidance,
  nic: KIT.muted,
};
// Bandwidth magnitudes only (HBM: several TB/s; NVLink: 200 GB/s unidirectional;
// inter-node: 50 GB/s unidirectional per GPU on the 8-NIC H800 nodes).
const LINK_BAR: Record<LinkId, { value: string; note: string; frac: number }> = {
  hbm: { value: '数 TB/s', note: '（设备内）', frac: 1 },
  nvlink: { value: '200 GB/s', note: '（单向）', frac: 0.42 },
  nic: { value: '50 GB/s', note: '（单向 · 8 NIC）', frac: 0.12 },
};

const STACK_STATE: TileState = 'local';

function feedbackFor(level: Level, granularity: Gran, notice: Notice): { text: string; cls: Cls } {
  if (notice === 'core-coarse') {
    return {
      text: '核级 tiling 只处理静态形状的砖（例如 128×128），粗粒度的 chunk 不适用；请切到设备级或任务级。',
      cls: 'bad',
    };
  }
  if (notice === 'task-fine') {
    return {
      text: '任务级 tiling 面向整个算子的任务 DAG，没有单块砖的粒度；请切到粗粒度。',
      cls: 'bad',
    };
  }
  if (level === 'task') {
    return {
      text: '任务级 tiling：整个分布式负载是一个任务 DAG，通信与计算核会融合成一个 MegaKernel，由编译期记分板调度。',
      cls: 'good',
    };
  }
  if (level === 'device' && granularity === 'coarse') {
    return {
      text: '设备级支持运行时动态 shape：AllToAll 的 chunk 大小由 token 路由结果决定。',
      cls: '',
    };
  }
  if (level === 'device') {
    return {
      text: '设备级 tiling：以 chunk 为单位、DMA 语义，putmem/getmem 直接映射到异步 DMA 引擎与 NIC，绕过 SM。',
      cls: '',
    };
  }
  return {
    text: '核级 tiling：静态形状的砖（例如 128×128）直通张量核心与 TMA，并可用 wait/notify 做信号控制。',
    cls: '',
  };
}

/** Directed edge of the task-level DAG (the kit has no arrow helper). */
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = KIT.support;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = KIT.support;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

export const M21LevelSpot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const stateRef = useRef<SpotState>({ level: 'device', granularity: 'fine' });
  const [level, setLevel] = useState<Level>('device');
  const [granularity, setGranularity] = useState<Gran>('fine');
  const [notice, setNotice] = useState<Notice>('none');
  const [forced, setForced] = useState<Gran | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const bare = (text: string, x: number, y: number, color: string, align: CanvasTextAlign) => {
      ctx.fillStyle = color;
      ctx.font = '600 14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      ctx.textAlign = 'left';
    };

    const render = (state: SpotState, time: number) => {
      const link = LINK_OF[state.level];
      const linkColor = LINK_COLOR[link];
      const selIdx = LEVELS.findIndex((item) => item.id === state.level);
      const selX = BAND.x + selIdx * SEG_W;
      const illegal =
        (state.level === 'core' && state.granularity === 'coarse') ||
        (state.level === 'task' && state.granularity === 'fine');

      dTileGround(ctx, W, H);

      // ---- levelBand: the three hardware domains, side by side ---------------
      LEVELS.forEach((item, i) => {
        const sx = BAND.x + i * SEG_W;
        if (item.id === state.level) {
          ctx.fillStyle = 'rgba(39, 68, 110, 0.06)'; // KIT.guidance at 6%
          ctx.fillRect(sx, BAND.y, SEG_W, BAND.h);
          ctx.strokeStyle = KIT.guidance;
          ctx.lineWidth = 3;
          ctx.strokeRect(sx + 1.5, BAND.y + 1.5, SEG_W - 3, BAND.h - 3);
        } else {
          ctx.strokeStyle = KIT.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(sx + 1, BAND.y + 1, SEG_W - 2, BAND.h - 2);
        }
      });
      dRule(ctx, BAND.x + SEG_W, BAND.y, BAND.x + SEG_W, BAND.y + BAND.h, KIT.support);
      dRule(ctx, BAND.x + 2 * SEG_W, BAND.y, BAND.x + 2 * SEG_W, BAND.y + BAND.h, KIT.support);

      // depth of the separator colour = the link the selected level talks over
      ctx.strokeStyle = linkColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(selX + 12, BAND.y + BAND.h - 6);
      ctx.lineTo(selX + SEG_W - 12, BAND.y + BAND.h - 6);
      ctx.stroke();

      // ---- granularityZone: the tiling unit of the selected level ------------
      if (state.level === 'core') {
        // static 128×128 tiles straight into Tensor Cores / TMA
        dGrid(ctx, 126, 148, 3, 3, 32, { frame: false, gap: 2, stateAt: () => STACK_STATE }, time);
      } else if (state.level === 'device') {
        // one chunk (the device-level unit) …
        ctx.strokeStyle = KIT.guidance;
        ctx.lineWidth = 2;
        ctx.strokeRect(128, 160, 74, 74);
        if (state.granularity === 'fine') {
          // … holding four fine tiles
          dGrid(ctx, 140, 172, 2, 2, 24, { frame: false, gap: 2, stateAt: () => STACK_STATE }, time);
        } else {
          // coarse granularity: fewer, bigger tiles inside the same chunk
          dTile(ctx, 137, 169, 56, STACK_STATE, time);
        }
      } else {
        // task level: whole operators wired into a task DAG
        dBar(ctx, 170, 148, 84, 40, 1, KIT.guidance);
        dBar(ctx, 128, 202, 84, 40, 1, KIT.guidance);
        dBar(ctx, 252, 202, 84, 40, 1, KIT.guidance);
        arrow(ctx, 204, 188, 176, 200);
        arrow(ctx, 224, 188, 276, 200);
      }

      if (illegal) {
        // refused combination: fade the stack and put a red bar through it
        ctx.fillStyle = KIT.quiet;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(GRAN_ZONE.x, GRAN_ZONE.y, GRAN_ZONE.w, GRAN_ZONE.h);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = KIT.failure;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(GRAN_ZONE.x + 26, GRAN_ZONE.y + GRAN_ZONE.h - 18);
        ctx.lineTo(GRAN_ZONE.x + 170, GRAN_ZONE.y + 14);
        ctx.stroke();
      }

      // the hand keeps working: it points at the stack of the selected level
      const handX = state.level === 'task' ? 400 : state.level === 'core' ? 286 : 268;
      ctx.save();
      ctx.translate(handX, 160);
      ctx.scale(-1, 1);
      dHand(ctx, 0, 0, time * 0.3, KIT.text);
      ctx.restore();

      // ---- linkZone: bandwidth magnitude of that level's link ---------------
      const bar = LINK_BAR[link];
      dBar(ctx, LINK_ZONE.x + 32, LINK_ZONE.y + 52, LINK_ZONE.w - 64, 22, bar.frac, linkColor);
      bare(bar.value, LINK_ZONE.x + LINK_ZONE.w - 32, LINK_ZONE.y + 44, KIT.text, 'right');
      bare(bar.note, LINK_ZONE.x + LINK_ZONE.w - 32, LINK_ZONE.y + 96, KIT.muted, 'right');

      // ---- labels (exactly two) + one legend -------------------------------
      dLabel(ctx, LEVEL_NAME[state.level], selX + SEG_W / 2, BAND.y + 52, KIT.guidance, 'center');
      dLabel(ctx, GRAN_NAME[state.granularity], GRAN_ZONE.x, GRAN_ZONE.y - 6, KIT.text);
      dLegend(
        ctx,
        [
          { color: LINK_COLOR.hbm, text: '设备内' },
          { color: LINK_COLOR.nvlink, text: '机内' },
          { color: LINK_COLOR.nic, text: '机间' },
        ],
        GRAN_ZONE.x,
        GRAN_ZONE.y + GRAN_ZONE.h + 16
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number) => {
      if (!t0Ref.current) t0Ref.current = now;
      render(stateRef.current, (now - t0Ref.current) / 1000);
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

  const pickLevel = (next: Level) => {
    let nextGran = granularity;
    if (next === 'core' && granularity === 'coarse') {
      nextGran = 'fine';
      setForced('fine');
      setNotice('core-coarse');
    } else if (next === 'task' && granularity === 'fine') {
      nextGran = 'coarse';
      setForced('coarse');
      setNotice('task-fine');
    } else {
      setForced(null);
      setNotice('none');
    }
    setLevel(next);
    if (nextGran !== granularity) setGranularity(nextGran);
    stateRef.current.level = next;
    stateRef.current.granularity = nextGran;
  };

  const pickGranularity = (next: Gran) => {
    if (next === 'coarse' && level === 'core') {
      setNotice('core-coarse');
      return;
    }
    if (next === 'fine' && level === 'task') {
      setNotice('task-fine');
      return;
    }
    setGranularity(next);
    setNotice('none');
    setForced(null);
    stateRef.current.granularity = next;
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    if (x < BAND.x || x > BAND.x + BAND.w || y < BAND.y || y > BAND.y + BAND.h) return;
    const idx = clamp(Math.floor((x - BAND.x) / SEG_W), 0, LEVELS.length - 1);
    pickLevel(LEVELS[idx].id);
  };

  const coarseBlocked = level === 'core';
  const fineBlocked = level === 'task';
  const fb = feedbackFor(level, granularity, notice);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onCanvasPointerDown}
      />
      <div className="chip-row">
        {LEVELS.map((item) => (
          <button
            key={item.id}
            className={item.id === level ? 'chip selected' : 'chip'}
            aria-pressed={item.id === level}
            onClick={() => pickLevel(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button
          className={granularity === 'fine' ? 'chip selected' : 'chip'}
          aria-pressed={granularity === 'fine'}
          aria-disabled={fineBlocked}
          disabled={fineBlocked}
          title={fineBlocked ? '任务级 tiling 面向整个算子的任务 DAG，没有单块砖的粒度。' : undefined}
          style={fineBlocked ? { borderColor: KIT.failure } : forced === 'fine' ? { borderColor: KIT.emphasis } : undefined}
          onClick={() => pickGranularity('fine')}
        >
          细粒度
        </button>
        <button
          className={granularity === 'coarse' ? 'chip selected' : 'chip'}
          aria-pressed={granularity === 'coarse'}
          aria-disabled={coarseBlocked}
          disabled={coarseBlocked}
          title={coarseBlocked ? '核级 tiling 只处理静态形状的砖（例如 128×128），粗粒度的 chunk 不适用。' : undefined}
          style={coarseBlocked ? { borderColor: KIT.failure } : forced === 'coarse' ? { borderColor: KIT.emphasis } : undefined}
          onClick={() => pickGranularity('coarse')}
        >
          粗粒度
        </button>
      </div>
      <div className="ctrl">
        <label>
          当前层级 <span className="val">{LEVEL_NAME[level]}</span>
        </label>
        <label>
          粒度 <span className="val">{GRAN_NAME[granularity]}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default M21LevelSpot;
