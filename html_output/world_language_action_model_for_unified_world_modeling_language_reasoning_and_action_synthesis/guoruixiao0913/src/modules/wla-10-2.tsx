import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawSceneLabel,
  SUCCESS,
  FAIL,
  EMPHASIS,
  TEXT,
  TEXT_MUTED,
} from './billiardsKit';

// §10 module 10.2「从视频学新任务，以及它还没学会的」(1080×280)。
// 五档训练设置用「上一个 / 下一个」切换；柱高固定为论文数值，
// 切换只改变橙色顶饰、非当前档的透明度、当前档的柱顶数字与反馈句。
// 第 5 档（人类第一视角视频）该组柱转红。

interface Row {
  label: string;
  clean: number;
  rand: number;
  red: boolean;
  feedback: string;
  cls: string;
}

const ROWS: Row[] = [
  {
    label: '只用已见任务的动作监督',
    clean: 13.0,
    rand: 11.6,
    red: false,
    feedback: '只用已见任务的动作监督：平均 13.0%（Clean）/ 11.6%（Rand）。',
    cls: '',
  },
  {
    label: '加已见任务视频监督',
    clean: 11.8,
    rand: 12.6,
    red: false,
    feedback: '再加上已见任务的视频监督：11.8% / 12.6%，几乎没变。',
    cls: '',
  },
  {
    label: '加同构型未见任务视频',
    clean: 34.4,
    rand: 30.0,
    red: false,
    feedback:
      '加进同构型未见任务的视频：34.4% / 30.0%，接近基线的三倍——模型从视频里学会了新的「敲」这个动作。',
    cls: 'good',
  },
  {
    label: '加跨构型未见任务视频',
    clean: 28.8,
    rand: 27.4,
    red: false,
    feedback: '换成跨构型机器人的未见任务视频：28.8% / 27.4%，仍然远高于基线。',
    cls: 'good',
  },
  {
    label: '加人类第一视角视频',
    clean: 7.8,
    rand: 7.8,
    red: true,
    feedback:
      '换成人类第一视角视频：7.8% / 7.8%，比什么都不加还低。论文推测是真实人类视频与仿真环境之间的域差导致。',
    cls: 'bad',
  },
];

const W = 1080;
const H = 280;
const BAND_TOP = 66;
const BAND_BOTTOM = 234;
const BASE_Y = 234;
const GROUPS_X = 90;
const GROUP_W = 180;
const BAR_W = 34;
const BAR_GAP = 10;
const MAX_VALUE = 40;
const MAX_H = 164;
const CAP_H = 6;
const PULSE_SECONDS = 2.8;

const fmt = (v: number) =>
  Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? v.toFixed(1) : v.toFixed(2);

const groupCenter = (i: number) => GROUPS_X + GROUP_W * (i + 0.5);
const hOf = (v: number) => (v / MAX_VALUE) * MAX_H;

interface Scene {
  /** 当前档位（立即生效：顶饰、透明度、数字） */
  current: number;
  /** 橙色游标所在位置的浮点档位（用来平滑滑动） */
  capPos: number;
  /** 橙色游标的目标档位 */
  capTarget: number;
  /** 环境脉冲相位 0→1 */
  pulse: number;
}

export const Wla102: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Scene>({ current: 0, capPos: 0, capTarget: 0, pulse: 0 });
  const rafRef = useRef<number | null>(null);
  const [setting, setSetting] = useState(0);
  const [feedback, setFeedback] = useState({ text: ROWS[0].feedback, cls: ROWS[0].cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const renderScene = (c: CanvasRenderingContext2D, s: Scene) => {
      clearScene(c, W, H);
      drawTable(c, W, H, { bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      const current = clamp(Math.round(s.current), 0, ROWS.length - 1);

      // 基线
      c.save();
      c.fillStyle = TEXT_MUTED;
      c.fillRect(GROUPS_X - 6, BASE_Y, GROUP_W * ROWS.length + 12, 1.5);
      c.restore();

      ROWS.forEach((row, i) => {
        const cx = groupCenter(i);
        const left = cx - (BAR_W * 2 + BAR_GAP) / 2;
        const cleanX = left;
        const randX = left + BAR_W + BAR_GAP;
        const hClean = hOf(row.clean);
        const hRand = hOf(row.rand);
        const isCurrent = i === current;

        const cleanColor = row.red ? FAIL : SUCCESS;
        const randColor = lerpColor(row.red ? FAIL : SUCCESS, '#ffffff', 0.42);

        c.save();
        c.globalAlpha = isCurrent ? 1 : 0.45;
        c.fillStyle = cleanColor;
        c.fillRect(cleanX, BASE_Y - hClean, BAR_W, hClean);
        c.fillStyle = randColor;
        c.fillRect(randX, BASE_Y - hRand, BAR_W, hRand);
        c.restore();

        if (isCurrent) {
          // 橙色顶饰
          c.save();
          c.fillStyle = EMPHASIS;
          c.fillRect(cleanX, BASE_Y - hClean - CAP_H, BAR_W, CAP_H);
          c.fillRect(randX, BASE_Y - hRand - CAP_H, BAR_W, CAP_H);
          c.restore();

          // 只有当前档写柱顶裸数字
          drawSceneLabel(c, fmt(row.clean), cleanX + BAR_W / 2, BASE_Y - hClean - CAP_H - 14, {
            size: 12,
            color: TEXT,
            align: 'center',
          });
          drawSceneLabel(c, fmt(row.rand), randX + BAR_W / 2, BASE_Y - hRand - CAP_H - 14, {
            size: 12,
            color: TEXT,
            align: 'center',
          });
        }
      });

      // 滑动中的橙色游标（环境微光，不改变任何数值）
      const pulseAlpha = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(s.pulse * Math.PI * 2));
      const icx = groupCenter(s.capPos);
      c.save();
      c.globalAlpha = clamp(pulseAlpha, 0.15, 0.6);
      c.fillStyle = EMPHASIS;
      c.fillRect(icx - (BAR_W * 2 + BAR_GAP) / 2, BASE_Y + 6, BAR_W * 2 + BAR_GAP, 5);
      c.restore();

      // 最多两个短标签
      drawSceneLabel(c, '成功率', 48, 88, { size: 12, color: TEXT_MUTED });
      drawSceneLabel(c, '越高越好', 990, 250, { size: 12, color: TEXT_MUTED });
    };

    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const s = stateRef.current;
      s.pulse = (s.pulse + dt / PULSE_SECONDS) % 1;
      if (Math.abs(s.capPos - s.capTarget) > 0.002) {
        s.capPos = lerp(s.capPos, s.capTarget, Math.min(1, dt * 9));
      } else {
        s.capPos = s.capTarget;
      }

      renderScene(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) {
        last = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applySetting = (next: number) => {
    const i = clamp(next, 0, ROWS.length - 1);
    stateRef.current.current = i;
    stateRef.current.capTarget = i;
    setSetting(i);
    setFeedback({ text: ROWS[i].feedback, cls: ROWS[i].cls });
  };

  const row = ROWS[setting];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button
          className="tiny ghost"
          type="button"
          onClick={() => applySetting(setting - 1)}
          disabled={setting === 0}
        >
          上一个
        </button>
        <span className="step-label">
          第 <b>{setting + 1}</b> / 5 档
        </span>
        <button
          className="tiny"
          type="button"
          onClick={() => applySetting(setting + 1)}
          disabled={setting === ROWS.length - 1}
        >
          {setting === ROWS.length - 1 ? '已是最后一档' : '下一个'}
        </button>
      </div>
      <div className="step-desc">{row.label}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla102;
