import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback, Btn } from './kit';

// Lab 2.1 — Perception Error Grasp Lab。
// 用户拖动「感知到的杯子位置」制造感知误差；控制器忠实跟踪指令位——
// 哪怕那里是空气。返回码 0 与语义判定 failure 在同一个画面里分道扬镳。

const MUTED = '#68778f';
const BORDER = '#d7deea';
const BLUE = '#27446e';
const GOOD = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';

const REAL_X = 470; // 真实杯子位置（固定）
const START_X = 112; // 夹爪起始位置
const PX2CM = 0.08; // 场景像素 → 厘米
const GRASP_TOL_CM = 2.5; // 夹爪开口容差
const MIN_X = 120;
const MAX_X = 680;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function Cup({ x, solid = true }: { x: number; solid?: boolean }) {
  const stroke = solid ? '#92400e' : '#b09a82';
  return (
    <g opacity={solid ? 1 : 0.65}>
      <rect
        x={x - 15}
        y={216}
        width={30}
        height={42}
        rx={5}
        fill={solid ? '#fdf6ea' : 'none'}
        stroke={stroke}
        strokeWidth={2.4}
        strokeDasharray={solid ? undefined : '5 4'}
      />
      <ellipse cx={x} cy={216} rx={15} ry={4.5} fill={solid ? '#eaddc4' : 'none'} stroke={stroke} strokeWidth={2} strokeDasharray={solid ? undefined : '5 4'} />
      <path d={`M ${x + 15} 226 q 13 2 0 20`} fill="none" stroke={stroke} strokeWidth={2.6} strokeDasharray={solid ? undefined : '5 4'} />
    </g>
  );
}

function Gripper({ x, closed, color }: { x: number; closed: boolean; color: string }) {
  const closeOffset = closed ? 7 : 0;
  return (
    <g>
      <rect x={x - 5} y={38} width={10} height={46} rx={3} fill={color} />
      <rect x={x - 21} y={84} width={42} height={11} rx={4} fill={color} />
      <g style={{ transition: 'transform 380ms cubic-bezier(.34,1.4,.64,1)' }}>
        <rect x={x - 19} y={95} width={8} height={30} rx={3.5} fill={color} transform={`translate(${closeOffset} 0)`} />
        <rect x={x + 11} y={95} width={8} height={30} rx={3.5} fill={color} transform={`translate(${-closeOffset} 0)`} />
      </g>
    </g>
  );
}

type Phase = 'plan' | 'running' | 'done' | 'evidence';

export const ReturnCodeLab: React.FC<WidgetProps> = () => {
  const [percX, setPercX] = useState(340);
  const [phase, setPhase] = useState<Phase>('plan');
  const [progress, setProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef(false);
  const grabOffsetRef = useRef(0);
  const rafRef = useRef(0);
  const timerRef = useRef<number>(0);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(timerRef.current);
    },
    []
  );

  const errorCm = Math.abs(percX - REAL_X) * PX2CM;
  const willSucceed = errorCm <= GRASP_TOL_CM;
  const gx = START_X + (percX - START_X) * progress;
  const closed = phase === 'done' || phase === 'evidence';
  const succeeded = willSucceed;
  // JSX 分支内 TS 会按 showStage 收窄 phase；用宽化别名避免误报。
  const ph = phase as Phase;

  const clientToSvgX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return percX;
    return ((clientX - rect.left) / rect.width) * 720;
  };

  const startRun = () => {
    setPhase('running');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) {
      setProgress(1);
      setPhase('done');
      return;
    }
    const t0 = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        timerRef.current = window.setTimeout(() => setPhase('done'), 260);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    setPhase('plan');
    setProgress(0);
  };

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg =
    '拖动场景里的「感知位置」手柄（或用下方微调滑杆），制造感知误差，然后执行抓取。控制器会忠实跟踪——哪怕指令位上是空气。';
  if (phase === 'running') {
    tone = '';
    msg = '执行中：控制器正在跟踪指令位。注意轨迹偏差永远达标——它衡量的是「跟得稳不稳」，不是「抓没抓到」。';
  } else if (phase === 'done' || phase === 'evidence') {
    if (succeeded) {
      tone = 'good';
      msg = '误差小于夹爪容差：杯子真的被握住了。返回码 0 与语义判定 success 一致——这才是正常情况。';
    } else {
      tone = 'bad';
      msg = '轨迹偏差 0.3cm < 容差 1cm，返回码 0；但真实杯子位置未变 → 语义判定 failure。执行成功 ≠ 任务成功。';
    }
  }

  const showStage = phase !== 'evidence';

  return (
    <div className="lab rc-lab">
      {showStage ? (
        <div className="lab-stage">
          <svg
            ref={svgRef}
            viewBox="0 0 720 300"
            role="img"
            aria-label="拖动感知位置，观察感知误差如何导致闭空"
            onPointerMove={(e) => {
              // 保持抓取时的偏移量：手柄跟随相对移动，不会瞬移到指针位置
              if (dragRef.current && ph === 'plan') {
                setPercX(clamp(clientToSvgX(e.clientX) + grabOffsetRef.current, MIN_X, MAX_X));
              }
            }}
            onPointerUp={() => {
              dragRef.current = false;
            }}
          >
            {/* 导轨 */}
            <rect x={40} y={28} width={640} height={8} rx={4} fill={BORDER} />
            <rect x={40} y={28} width={Math.max(0, gx - 40)} height={8} rx={4} fill={closed && !succeeded && ph !== 'plan' ? RED : BLUE} opacity={0.3} />

            {/* 桌面 */}
            <g>
              <rect x={24} y={258} width={672} height={13} rx={6} fill="#b8c9a7" />
              <rect x={24} y={258} width={672} height={4} rx={2} fill="#76906a" opacity={0.45} />
            </g>

            {/* 真实杯子 */}
            <Cup x={REAL_X} />
            <text x={REAL_X} y={285} textAnchor="middle" fontSize={11.5} fill={MUTED}>
              真实位置（固定）
            </text>

            {/* 感知位置：可拖拽 */}
            <g
              className="rc-drag-handle"
              style={{ touchAction: 'none', cursor: ph === 'plan' ? 'grab' : 'not-allowed' }}
              onPointerDown={(e) => {
                if (ph !== 'plan') return;
                e.preventDefault();
                dragRef.current = true;
                // 记录指针与手柄中心的偏移，拖拽期间保持相对位置（防瞬移）
                grabOffsetRef.current = percX - clientToSvgX(e.clientX);
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
              }}
              tabIndex={0}
              role="slider"
              aria-label="感知到的杯子位置"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(((percX - MIN_X) / (MAX_X - MIN_X)) * 100)}
              onKeyDown={(e) => {
                if (ph !== 'plan') return;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  e.stopPropagation();
                  setPercX((v) => clamp(v + (e.key === 'ArrowLeft' ? -12 : 12), MIN_X, MAX_X));
                }
              }}
            >
              <line x1={percX} y1={40} x2={percX} y2={256} stroke={ORANGE} strokeWidth={1.6} strokeDasharray="5 5" opacity={0.8} />
              <Cup x={percX} solid={false} />
              <text x={percX} y={206} textAnchor="middle" fontSize={11.5} fill={ORANGE} fontWeight={600}>
                感知位置
              </text>
              {ph === 'plan' ? (
                <g>
                  <rect x={percX - 26} y={150} width={52} height={22} rx={11} fill={ORANGE} opacity={0.92} />
                  <text x={percX} y={165} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={700}>
                    ↔ 拖我
                  </text>
                </g>
              ) : null}
            </g>

            {/* 误差标注 */}
            {ph === 'plan' && Math.abs(percX - REAL_X) > 24 ? (
              <g>
                <line x1={percX} y1={272} x2={REAL_X} y2={272} stroke={RED} strokeWidth={1.8} />
                <line x1={percX} y1={266} x2={percX} y2={278} stroke={RED} strokeWidth={1.8} />
                <line x1={REAL_X} y1={266} x2={REAL_X} y2={278} stroke={RED} strokeWidth={1.8} />
                <text x={(percX + REAL_X) / 2} y={296} textAnchor="middle" fontSize={11.5} fill={RED} fontWeight={600}>
                  感知误差 {errorCm.toFixed(1)} cm
                </text>
              </g>
            ) : null}

            {/* 夹爪 */}
            <Gripper x={gx} closed={closed} color={ph === 'plan' ? BLUE : closed && !succeeded ? RED : succeeded ? GOOD : BLUE} />

            {/* 结果标注 */}
            {(ph === 'done' || ph === 'evidence') && !succeeded ? (
              <text x={gx} y={30} textAnchor="middle" fontSize={12} fill={RED} fontWeight={700}>
                闭空：指令位上没有杯子
              </text>
            ) : null}
            {(ph === 'done' || ph === 'evidence') && succeeded ? (
              <text x={gx} y={30} textAnchor="middle" fontSize={12} fill={GOOD} fontWeight={700}>
                杯子被握住 ✓
              </text>
            ) : null}
          </svg>
        </div>
      ) : (
        <div className="lab-stage">
          <div className="lab-evidence-row">
            <div className="lab-evidence-card">
              <div className="lab-evidence-head tone-info">S₀ · 初始状态</div>
              <ul className="lab-evidence-list">
                <li>真实杯子位于桌面 (470, table)</li>
                <li>夹爪张开，位于起始位</li>
                <li>感知偏移 <b>{errorCm.toFixed(1)} cm</b> 在执行前就已存在</li>
              </ul>
            </div>
            <div className="lab-evidence-card">
              <div className="lab-evidence-head tone-bad">S_T · 终止状态</div>
              <ul className="lab-evidence-list">
                {succeeded ? (
                  <>
                    <li>杯子被夹爪握住 ✓</li>
                    <li>杯子位置：桌面 → 夹爪（状态变化成立）</li>
                  </>
                ) : (
                  <>
                    <li>夹爪在感知位置闭空，<b>真实杯子位置未变</b></li>
                    <li>任务相关状态变化：不存在</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="lab-evidence-row">
            <div className="lab-evidence-card">
              <div className="lab-evidence-head tone-info">τ · 执行轨迹</div>
              <ul className="lab-evidence-list">
                <li>move_to(perceived_target) → close_gripper()</li>
                <li>controller tracking error 0.3cm（&lt; 容差 1cm）</li>
              </ul>
            </div>
            <div className="lab-evidence-card">
              <div className="lab-evidence-head tone-info">接受标准</div>
              <ul className="lab-evidence-list">
                <li>目标 G：杯子被夹爪握住</li>
                <li>判定需要对比 S₀ 与 S_T 的状态变化</li>
              </ul>
            </div>
          </div>
          <div className="lab-verdict-row">
            <span className="lab-pill tone-good">返回码 0 · 轨迹完成</span>
            <span className="lab-verdict-vs">但</span>
            <span className={`lab-pill ${succeeded ? 'tone-good' : 'tone-bad'}`}>
              语义判定 {succeeded ? 'success · 目标达成' : 'failure · 目标未达成'}
            </span>
          </div>
        </div>
      )}

      {/* Runtime console 读数 */}
      <div className="runtime-console" aria-label="执行读数">
        <div className="rc-line">
          <span className="rc-key">perception_error</span>
          <span className={`rc-val ${errorCm > GRASP_TOL_CM ? 'is-warn' : 'is-ok'}`}>{errorCm.toFixed(1)} cm</span>
        </div>
        <div className="rc-line">
          <span className="rc-key">policy_target / gripper_planned</span>
          <span className="rc-val">{percX === REAL_X ? '≈ 真实位置' : `${((percX - 24) * PX2CM).toFixed(1)} cm（偏移）`}</span>
        </div>
        <div className="rc-line">
          <span className="rc-key">controller_tracking_error</span>
          <span className="rc-val is-ok">0.3 cm &lt; 容差 1cm ✓</span>
        </div>
        <div className="rc-line">
          <span className="rc-key">return_code</span>
          <span className={`rc-val ${phase === 'plan' || phase === 'running' ? '' : 'is-ok'}`}>
            {phase === 'plan' ? '—' : phase === 'running' ? 'running…' : '0 · 轨迹完成'}
          </span>
        </div>
        <div className="rc-line">
          <span className="rc-key">semantic_verdict</span>
          <span className={`rc-val ${phase === 'done' || phase === 'evidence' ? (succeeded ? 'is-ok' : 'is-bad') : ''}`}>
            {phase === 'plan' || phase === 'running' ? 'pending…' : succeeded ? 'success' : 'failure'}
          </span>
        </div>
      </div>

      <div className="lab-controls">
        {phase === 'plan' ? (
          <>
            <label className="lab-slider">
              <span className="lab-slider-label">
                感知位置微调
                <b className="lab-slider-val">误差 {errorCm.toFixed(1)} cm</b>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(((percX - MIN_X) / (MAX_X - MIN_X)) * 100)}
                onChange={(e) => setPercX(MIN_X + (Number(e.target.value) / 100) * (MAX_X - MIN_X))}
                aria-label="感知到的杯子位置"
              />
            </label>
            <Btn onClick={startRun}>执行抓取</Btn>
          </>
        ) : null}
        {phase === 'done' ? (
          <>
            <Btn onClick={() => setPhase('evidence')}>查看证据包</Btn>
            <Btn variant="ghost" onClick={reset}>
              重置
            </Btn>
          </>
        ) : null}
        {phase === 'evidence' ? (
          <Btn variant="ghost" onClick={reset}>
            重置
          </Btn>
        ) : null}
      </div>
      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default ReturnCodeLab;
