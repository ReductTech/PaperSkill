import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 Module 3.1 — 同步对照：两条依赖链从同一状态、同一时间基准出发。
// 左侧多一个中间产物（插补器 → X̂），误差在此产生并被带进下游；
// 右侧没有中间产物，模型直接吃不完整输入。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BORDER = '#d7deea';
const ORANGE = '#f07e47';

const PHASE_MS = 700;

type Focus = 'impute' | 'task';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  sub: string,
  active: boolean,
  accent: string
): void {
  ctx.fillStyle = active ? accent : '#ffffff';
  roundRect(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.strokeStyle = active ? accent : BORDER;
  ctx.lineWidth = active ? 2 : 1;
  roundRect(ctx, x, y, w, h, 9);
  ctx.stroke();

  ctx.fillStyle = active ? '#ffffff' : '#21324a';
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.fillText(title, x + 12, y + 23);
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillStyle = active ? 'rgba(255,255,255,0.86)' : '#68778f';
  ctx.fillText(sub, x + 12, y + 42);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  color: string,
  on: boolean
): void {
  ctx.strokeStyle = on ? color : BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 7, y);
  ctx.stroke();
  ctx.fillStyle = on ? color : BORDER;
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - 8, y - 4.5);
  ctx.lineTo(x2 - 8, y + 4.5);
  ctx.closePath();
  ctx.fill();
}

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ running: false, phase: 0, start: 0, focus: 'impute' as Focus });
  const rafRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [focus, setFocus] = useState<Focus>('impute');
  const [feedback, setFeedback] = useState({
    text: '同一个不完整输入，两条路径尚未出发。',
    cls: '',
  });

  const start = () => {
    stateRef.current.running = true;
    stateRef.current.phase = 0;
    stateRef.current.start = performance.now();
    setRunning(true);
    setFeedback({ text: '同一个不完整输入，两条路径尚未出发。', cls: '' });
  };

  const setFocusBoth = (f: Focus) => {
    stateRef.current.focus = f;
    setFocus(f);
    if (stateRef.current.phase >= 4) {
      setFeedback(
        f === 'impute'
          ? {
              text: '误差被带进下游：补出来的假数据被当成真数据训练，这就是论文说的 error propagation（误差传播）。此图为机制示意，非论文实验结果。',
              cls: 'bad',
            }
          : {
              text: '右边的模型始终只看到不完整的输入，没有「假装完整」这一步，缺失信息不会被伪造。此图为机制示意，非论文实验结果。',
              cls: 'good',
            }
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let lastPhase = -1;

    /** 一条链：节点 + 连接箭头，按 phase 依次点亮；focusIdx 命中的节点加橙色关注圈。 */
    const chain = (
      ox: number,
      phase: number,
      nodeCount: number,
      titles: string[][],
      accents: string[],
      focusIdx: number
    ) => {
      const NW = 126;
      const NH = 54;
      const GAP = 26;
      const y = 112;
      for (let i = 0; i < nodeCount; i++) {
        const x = ox + i * (NW + GAP);
        const lit = phase >= i + 1;
        drawNode(ctx, x, y, NW, NH, titles[i][0], titles[i][1], lit, accents[i]);
        if (focusIdx === i) {
          ctx.strokeStyle = ORANGE;
          ctx.lineWidth = 3;
          ctx.setLineDash([7, 4]);
          roundRect(ctx, x - 7, y - 7, NW + 14, NH + 14, 13);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (i < nodeCount - 1) {
          drawArrow(ctx, x + NW + 3, y + NH / 2, x + NW + GAP - 1, accents[i + 1], phase >= i + 2);
        }
      }
    };

    const render = (time: number) => {
      const s = stateRef.current;
      if (s.running && s.phase < 4) {
        const elapsed = time - s.start;
        const next = Math.min(4, Math.floor(elapsed / PHASE_MS) + 1);
        if (next !== s.phase) s.phase = next;
        if (next === 4) s.running = false;
      }
      if (s.phase !== lastPhase) {
        lastPhase = s.phase;
        if (s.phase === 4) {
          setRunning(false);
          setFeedback(
            s.focus === 'impute'
              ? {
                  text: '误差被带进下游：补出来的假数据被当成真数据训练，这就是论文说的 error propagation（误差传播）。此图为机制示意，非论文实验结果。',
                  cls: 'bad',
                }
              : {
                  text: '右边的模型始终只看到不完整的输入，没有「假装完整」这一步，缺失信息不会被伪造。此图为机制示意，非论文实验结果。',
                  cls: 'good',
                }
          );
        } else if (s.phase === 1 || s.phase === 2) {
          setFeedback({
            text: '左边多出一条中间产物：补出来的 X̂ 不是真值，误差从这一步就产生了。',
            cls: '',
          });
        } else if (s.phase === 3) {
          setFeedback({
            text: '误差被带进下游：补出来的假数据被当成真数据训练，这就是论文说的 error propagation（误差传播）。',
            cls: 'bad',
          });
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // 进度条
      ctx.fillStyle = BORDER;
      ctx.fillRect(60, 30, 960, 8);
      ctx.fillStyle = BLUE;
      ctx.fillRect(60, 30, (s.phase / 4) * 960, 8);

      // 两个面板（边框固定灰色；「当前关注」由节点上的橙色圈表达）
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 60, 470, 186);
      ctx.strokeRect(560, 60, 470, 186);

      // 「只看插补误差」圈住插补器；「只看任务误差」圈住下游任务模型
      const leftFocusIdx = s.focus === 'impute' ? 1 : 2;

      // 左侧：3 个节点（多一个中间产物）
      chain(
        76,
        s.phase,
        3,
        [
          ['不完整输入 X', '含 NaN'],
          ['插补器', '生成 X̂'],
          ['下游任务模型', '吃的是 X̂'],
        ],
        [BLUE, RED, RED],
        leftFocusIdx
      );

      // 右侧：2 个节点（无中间产物）
      chain(
        586,
        s.phase,
        2,
        [
          ['不完整输入 X', '含 NaN'],
          ['端到端模型', '直接吃 X'],
        ],
        [BLUE, GREEN],
        -1
      );

      // 左侧杯下的误差带：随阶段变宽变红
      if (s.phase >= 3) {
        const bw = 60 + (s.phase - 3) * 46;
        const bx = 50 + 235 - bw / 2;
        ctx.fillStyle = 'rgba(196,63,82,0.35)';
        ctx.fillRect(bx, 204, bw, 18);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, 204, bw, 18);
      }
      // 右侧误差带：始终窄而绿
      if (s.phase >= 3) {
        const bx = 560 + 235 - 30;
        ctx.fillStyle = 'rgba(34,141,92,0.35)';
        ctx.fillRect(bx, 204, 60, 18);
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, 204, 60, 18);
      }

      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('先补再学', 66, 52);
      ctx.fillText('端到端', 576, 52);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" type="button" onClick={start}>
          {running ? '重新对比' : '开始对比'}
        </button>
        <label>
          对照重点 <span className="val">{focus === 'impute' ? '插补误差' : '任务误差'}</span>
        </label>
      </div>
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${focus === 'impute' ? 'selected' : ''}`}
          onClick={() => setFocusBoth('impute')}
        >
          只看插补误差
        </button>
        <button
          type="button"
          className={`chip ${focus === 'task' ? 'selected' : ''}`}
          onClick={() => setFocusBoth('task')}
        >
          只看任务误差
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch3Mod1;
