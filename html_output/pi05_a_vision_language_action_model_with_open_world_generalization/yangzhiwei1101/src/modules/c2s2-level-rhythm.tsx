import { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const TOTAL_STEPS = 250; // 5 s at 50 Hz
const CHUNK = 50; // H = 49 → 50-step chunk
const X0 = 64;
const X1 = 1356;

const C = {
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  muted: '#68778f',
  ink: '#21324a',
  line: '#d7deea',
};

const px = (step: number) => X0 + (step / TOTAL_STEPS) * (X1 - X0);

export function LevelRhythm(_: { chapterId: string; moduleId: string }) {
  const [interval, setInterval] = useState(50);

  const hlCount = Math.ceil(TOTAL_STEPS / interval);
  const hlHz = 50 / interval;
  const lag = Math.max(0, interval - CHUNK);
  const tone = interval <= CHUNK ? C.green : interval <= 150 ? C.blue : C.red;
  const feedback =
    interval <= CHUNK
      ? '高层比动作慢，但每一块动作都还在当前子任务的覆盖范围内。'
      : interval <= 150
      ? '子任务开始落到动作块的后半段，拐角处会犹豫。'
      : '一块动作做完了，下一步子任务还没报出来，学徒在原地打转。';

  const bubbles = Array.from({ length: Math.min(hlCount, 26) }, (_, i) => i * interval);

  return (
    <div className="pi-col">
      <svg viewBox="0 0 1472 340" width="100%" height="340" role="img" aria-label="高层更新间隔与动作块的时间轴">
        <rect x="0" y="0" width="1472" height="340" fill="#f7f3ec" />
        <line x1={X0} y1="266" x2={X1} y2="266" stroke={C.line} strokeWidth="2" />
        {[0, 50, 100, 150, 200, 250].map((s) => (
          <g key={s}>
            <line x1={px(s)} y1="266" x2={px(s)} y2="274" stroke={C.line} strokeWidth="2" />
            <text x={px(s)} y="296" fontSize="18" fill={C.muted} textAnchor="middle">
              {s} 步
            </text>
          </g>
        ))}
        <text x={X0} y="30" fontSize="20" fill={C.ink} fontWeight="700">
          高层：师傅报子任务（蓝色气泡）
        </text>
        <text x={X0} y="180" fontSize="20" fill={C.ink} fontWeight="700">
          低层：动作块，每块 50 步（H = 49）
        </text>

        {bubbles.map((s, i) => (
          <g key={`b${i}`}>
            <rect x={px(s) + 2} y="44" width="26" height="26" rx="6" fill="#eef3fb" stroke={C.blue} strokeWidth="2" />
            <text x={px(s) + 15} y="63" fontSize="14" fill={C.blue} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}

        {Array.from({ length: TOTAL_STEPS / CHUNK }, (_, i) => (
          <g key={`c${i}`}>
            <rect
              x={px(i * CHUNK) + 2}
              y="196"
              width={px((i + 1) * CHUNK) - px(i * CHUNK) - 4}
              height="46"
              rx="6"
              fill="#e6f4ec"
              stroke={C.green}
              strokeWidth="2"
            />
            <text x={px(i * CHUNK + CHUNK / 2)} y="226" fontSize="16" fill={C.green} textAnchor="middle">
              块 {i + 1}
            </text>
          </g>
        ))}

        {lag > 0 &&
          Array.from({ length: TOTAL_STEPS / CHUNK }, (_, i) => {
            const start = i * CHUNK + (CHUNK - Math.min(lag, CHUNK));
            if (start >= (i + 1) * CHUNK) return null;
            return (
              <rect
                key={`lag${i}`}
                x={px(start)}
                y="196"
                width={px((i + 1) * CHUNK) - px(start) - 2}
                height="46"
                fill="rgba(196,63,82,0.22)"
                stroke={C.red}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            );
          })}
      </svg>

      <div className="pi-row pi-row-tight">
        <label className="pi-slider">
          <span>高层更新间隔</span>
          <input
            type="range"
            min={5}
            max={250}
            step={5}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
          />
          <b>{interval} 步（{hlHz.toFixed(2)} Hz）</b>
        </label>
        <div className="pi-stats">
          <span>5 秒内高层报 <b>{hlCount}</b> 次</span>
          <span>动作块 <b>5</b> 块</span>
          <span style={{ color: lag > 0 ? C.red : C.green }}>
            子任务滞后 <b>{lag}</b> 步
          </span>
        </div>
      </div>
      <p className="pi-feedback" style={{ color: tone }}>{feedback}</p>
      <p className="pi-body pi-muted">
        同一个模型、两个层级：高层推理以更低频率运行；低层输出动作块{' '}
        <SymbolHint meaning="预测的连续动作块，共 50 步（H = 49），按 50 Hz 下发。">a</SymbolHint>
        <sub>t:t+H</sub>。
      </p>
      <p className="pi-note">
        论文只说高层推理频率低于低层，没有给出具体间隔；这里的「滞后」阈值与后果是教学设定。
      </p>
    </div>
  );
}
