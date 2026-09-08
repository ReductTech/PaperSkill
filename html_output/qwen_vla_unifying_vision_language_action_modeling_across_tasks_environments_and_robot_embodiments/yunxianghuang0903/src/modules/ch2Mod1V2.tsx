import React, { useEffect, useRef, useState } from 'react';
import { PsButton, PsSegmented } from '../components/ps-controls';
import { TensorGrid } from './tensorGrid';
import type { WidgetProps } from './registry';

type Task = 'manip' | 'nav' | 'ego';

const TASKS: Record<
  Task,
  { label: string; tokens: string[]; c: number; hint: string }
> = {
  manip: {
    label: '操纵',
    tokens: ['ΔEEF', 'gripper', 'joint', 'a₄', 'a₅'],
    c: 5,
    hint: 'c = 当前本体有效通道数（示意）',
  },
  nav: {
    label: '导航',
    tokens: ['Δx', 'Δy', 'Δθ'],
    c: 3,
    hint: '论文：Δx / Δy / Δθ → 前 3 通道',
  },
  ego: {
    label: '人体/手部轨迹',
    tokens: ['body', 'hand', 'traj', '…'],
    c: 4,
    hint: 'trajectory channels → 有效区',
  },
};

const H = 8;
const K = 10;

interface Flight {
  id: number;
  token: string;
  col: number;
  style: React.CSSProperties;
}

export const Ch2Mod1V2: React.FC<WidgetProps> = () => {
  const layoutRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const flightIdRef = useRef(0);
  const [task, setTask] = useState<Task>('nav');
  const [activeC, setActiveC] = useState(3);
  const [pulseCol, setPulseCol] = useState<number | null>(null);
  const [showMask, setShowMask] = useState(false);
  const [showGrad, setShowGrad] = useState(false);
  const [hover, setHover] = useState<{ t: number; k: number } | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [status, setStatus] = useState('有效通道已装入 H×K 张量');

  const t = TASKS[task];

  useEffect(() => {
    setActiveC(0);
    setFlights([]);
    setStatus(`正在 PACK：${t.label}…`);
    tokenRefs.current = [];
    const timers: number[] = [];
    const spawnFlights = () => {
      const layout = layoutRef.current;
      const grid = gridRef.current;
      if (!layout || !grid) return;
      const layoutBox = layout.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      const cellW = gridBox.width / K;

      t.tokens.slice(0, t.c).forEach((tok, i) => {
        const el = tokenRefs.current[i];
        if (!el) return;
        const from = el.getBoundingClientRect();
        const toX = gridBox.left + cellW * i + cellW * 0.5 - layoutBox.left;
        const toY = gridBox.top + gridBox.height * 0.15 - layoutBox.top;
        const fromX = from.left + from.width * 0.5 - layoutBox.left;
        const fromY = from.top + from.height * 0.5 - layoutBox.top;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const id = ++flightIdRef.current;
        timers.push(
          window.setTimeout(() => {
            setFlights((prev) => [
              ...prev,
              {
                id,
                token: tok,
                col: i,
                style: {
                  left: fromX,
                  top: fromY,
                  ['--fx' as string]: `${dx}px`,
                  ['--fy' as string]: `${dy}px`,
                },
              },
            ]);
          }, i * 110 + 60)
        );
        timers.push(
          window.setTimeout(() => {
            setActiveC(i + 1);
            setPulseCol(i);
            window.setTimeout(() => setPulseCol(null), 280);
          }, i * 110 + 620)
        );
        timers.push(window.setTimeout(() => setFlights((prev) => prev.filter((f) => f.id !== id)), i * 110 + 700));
      });
    };

    timers.push(window.setTimeout(spawnFlights, 80));
    timers.push(
      window.setTimeout(() => {
        setActiveC(t.c);
        setStatus(`${t.label}：${t.c} 通道有效 · ${H * K - t.c * H} 格 padding`);
      }, t.c * 110 + 750)
    );
    return () => timers.forEach(clearTimeout);
  }, [task]);

  return (
    <div className="ch2-pack-lab">
      <div className="ch2-pack-layout" ref={layoutRef}>
        <div className="ch2-pack-left">
          <PsSegmented
            value={task}
            onChange={setTask}
            ariaLabel="任务类型"
            options={[
              { value: 'manip', label: '操纵' },
              { value: 'nav', label: '导航' },
              { value: 'ego', label: '人体/手部轨迹' },
            ]}
          />
          <div className="ch2-native-tokens">
            <div className="ch2-native-title">原生动作语义</div>
            <div className="ch2-token-row">
              {t.tokens.map((tok, i) => (
                <span
                  key={`${task}-${tok}`}
                  ref={(el) => {
                    tokenRefs.current[i] = el;
                  }}
                  className="ch2-fly-token"
                >
                  {tok}
                </span>
              ))}
            </div>
            <p className="ch2-native-note">{t.hint}</p>
          </div>
        </div>
        <div className="ch2-pack-right" ref={gridRef}>
          <div className={`ch2-grid-wrap${pulseCol !== null ? ' is-pulse' : ''}`} data-pulse-col={pulseCol ?? ''}>
            <span className="ch2-axis ch2-axis-y">time ↓</span>
            <span className="ch2-axis ch2-axis-x">channel →</span>
            <TensorGrid
              rows={H}
              cols={K}
              activeC={activeC}
              activeH={H}
              showMask={showMask}
              showGradient={showGrad}
              hoverCell={hover}
              onHover={(ti, ki) => setHover({ t: ti, k: ki })}
              onLeave={() => setHover(null)}
            />
          </div>
          {hover ? (
            <div className="ch2-cell-tip">
              {hover.k < activeC && hover.t < H
                ? `未来第 ${hover.t + 1} 步 · 有效通道 · 参与 loss`
                : 'Padding · M=0 · 不参与梯度'}
            </div>
          ) : null}
        </div>
        <div className="pack-flight-layer" aria-hidden="true">
          {flights.map((f) => (
            <span key={f.id} className="pack-flight-token" style={f.style}>
              {f.token}
            </span>
          ))}
        </div>
      </div>
      <p className="ch2-pack-status">{status}</p>
      <div className="ps-controls-row">
        <PsButton variant="ghost" active={showMask} onClick={() => setShowMask((v) => !v)}>
          显示掩码 M
        </PsButton>
        <PsButton variant="ghost" active={showGrad} onClick={() => setShowGrad((v) => !v)}>
          显示梯度
        </PsButton>
      </div>
      {showGrad ? <p className="ch2-grad-caption">Mask 让无效 padding 不参与训练梯度。</p> : null}
    </div>
  );
};
export default Ch2Mod1V2;
