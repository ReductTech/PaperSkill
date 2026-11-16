import React, { useState } from 'react';
import { C, Cello, Mic, PageFrame } from './studioKit';
import './studio.css';

/** p6：在视觉空间另建一个分类器——原型初始化 + 少数几轮训练，旧类权重始终冻结。 */
export function MgVisualClf() {
  const [proto, setProto] = useState(0.45);
  const [epochs, setEpochs] = useState(3);

  const growth = 0.35 + 0.65 * Math.min(1, epochs / 3);
  // 原型越往左越贴近旧类边界；越过边界（proto ≳ 0.85）时按“旧类判定可能被改写”提示（推断）
  const newX = 0.78 - 0.36 * proto;
  const newY = 0.8;
  const boundaryX = 0.46 + 0.02 * growth;
  const crossed = newX < boundaryX;
  const tone = crossed ? 'warn' : epochs === 0 ? 'plain' : 'ok';
  const feedback = crossed
    ? '原型已越过旧类边界：按“旧类权重冻结”的设定，旧类的判定可能被改写（这是推断，论文没做这个消融）。'
    : epochs === 0
    ? '还没训练：只能按原型比远近，边界是硬生生的中垂线。'
    : epochs >= 3
    ? '三轮就够（论文默认 3 epoch）：新类被包住，旧类那一侧不动。'
    : '边界开始包住新类；旧类权重一直冻着，所以旧类区域没被改写。';

  const cx = (x: number) => 120 + x * 520;
  const cy = (y: number) => 420 - y * 300;

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`原型位置 ${proto.toFixed(2)}，训练 ${epochs} 轮`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x={110} y={80} width={560} height={380} rx={12} fill="#fbfcf9" stroke={C.line} strokeWidth={2} />

          {/* 旧类三个簇 */}
          {[
            { x: 0.2, y: 0.24, n: 5 },
            { x: 0.3, y: 0.46, n: 6 },
            { x: 0.22, y: 0.68, n: 4 },
          ].map((c, i) => (
            <g key={i}>
              {Array.from({ length: c.n }, (_, j) => (
                <circle
                  key={j}
                  cx={cx(c.x + ((j % 3) - 1) * 0.045)}
                  cy={cy(c.y + (Math.floor(j / 3) - 1) * 0.05)}
                  r={7}
                  fill={C.blue}
                  opacity={0.75}
                />
              ))}
              <text x={cx(c.x)} y={cy(c.y) + 46} textAnchor="middle" fontSize={17} fill={C.muted}>旧类 {i + 1}</text>
            </g>
          ))}

          {/* 新类样本 */}
          {Array.from({ length: 4 }, (_, j) => (
            <circle key={j} cx={cx(newX + ((j % 2) - 0.5) * 0.05)} cy={cy(newY + (Math.floor(j / 2) - 0.5) * 0.06)} r={8} fill={C.green} opacity={0.85} />
          ))}
          <circle cx={cx(newX)} cy={cy(newY)} r={18 + 10 * growth} fill="none" stroke={crossed ? C.red : C.green} strokeWidth={2.5} strokeDasharray="7 5" />
          <text x={cx(newX)} y={cy(newY) - 34} textAnchor="middle" fontSize={18} fill={crossed ? C.red : C.green}>
            新类原型（W_v 初始化）
          </text>

          {/* 决策边界：epochs=0 为硬中垂线，之后向旧类侧收 */}
          <path
            d={`M${cx(0.46 + (epochs === 0 ? 0 : 0.02 * growth))} ${cy(0.05)} Q${cx(0.4 + 0.05 * (1 - growth))} ${cy(0.5)} ${cx(0.47 + 0.02 * growth)} ${cy(0.95)}`}
            fill="none"
            stroke={crossed ? C.red : C.orange}
            strokeWidth={3.5}
          />
          <text x={cx(0.47) + 8} y={cy(0.12)} fontSize={17} fill={crossed ? C.red : C.orange}>视觉分类器边界</text>

          <Cello x={760} y={200} s={0.34} mute={crossed} />
          <Mic x={742} y={150} s={0.34} color={C.green} hang={false} active={epochs > 0} />

          <text x={24} y={40} fontSize={21} fill={C.muted}>摆原型、加训练轮次：边界只在新类这一侧生长</text>
        </svg>
      }
      side={
        <>
          <div className="studio-panel">
            <h4>旧类锁住，只教新类</h4>
            <p style={{ margin: 0 }}>
              微调后的 CLIP 与旧类分类器权重冻结；新类的权重用类原型在视觉空间里初始化，只用图像特征训练。梯度留在输入空间，所以它天然长在视觉子空间里。
            </p>
          </div>
          <div className={`studio-feedback ${tone}`}>{feedback}</div>
          <label className="studio-muted" htmlFor="proto">新类原型位置（越靠左越贴近旧类边界）</label>
          <input id="proto" className="studio-slider" type="range" min={0} max={1} step={0.01} value={proto} onChange={(e) => setProto(Number(e.target.value))} />
          <label className="studio-muted" htmlFor="clf-epoch">视觉分类器训练轮次（默认 3）</label>
          <input id="clf-epoch" className="studio-slider" type="range" min={0} max={3} step={1} value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} />
          <div className="studio-src">
            §4.3：冻结 f_clip 与旧类权重，新类用原型初始化 W_v，仅用图像特征训练；§5.1 给 3 epoch、lr 5e-4。
            二维决策区为教学示意，真实空间是 512 维。
          </div>
        </>
      }
    />
  );
}
