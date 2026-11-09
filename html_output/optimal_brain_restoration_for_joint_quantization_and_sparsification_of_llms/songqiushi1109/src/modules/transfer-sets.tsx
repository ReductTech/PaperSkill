import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { SegButton, Feedback, Slider, clamp } from './obrKit';
import { SymbolHint } from '../components/SymbolHint';

// ch4（核心方法）：R 集合与 E 集合的信息转移。
// 权重行按重要性排序，alpha 决定保留比例 R；剪掉的 E 集合信息被闭式补偿加到 R 上。
const W = [0.92, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42, 0.34, 0.26, 0.2, 0.14, 0.08];
const N = W.length;

export function TransferSets(_props: WidgetProps) {
  const [alpha, setAlpha] = useState(0.5);
  const [comp, setComp] = useState(true);
  const keep = clamp(Math.round(alpha * N), 1, N - 1);
  const evicted = N - keep;
  const evictMass = W.slice(keep).reduce((s, v) => s + v, 0);
  const delta = comp ? evictMass / keep : 0;
  const err = comp ? Math.round(evictMass * 100 * 0.18) : Math.round(evictMass * 100);

  const cell = 64, gap = 16, x0 = 50, y0 = 300, maxH = 170;
  const Rcx = x0 + (keep / 2) * (cell + gap);
  return (
    <div className="obr-layout obr-two">
      <div className="obr-panel">
        <div className="obr-heading">把 E 的信息“搬”到 R</div>
        <svg viewBox="0 0 1040 460" width="1040" height="460" role="img" aria-label="一行权重分成 R 与 E 两个集合，补偿时 E 的信息转移到 R">
          <text x={x0} y={42} fontSize={21} fill="#68778f">左侧 R（保留，不敏感）　右侧 E（剪除，敏感）</text>
          {comp && (
            <text x={Rcx} y={78} textAnchor="middle" fontSize={20} fill="#228d5c" fontWeight={700}>
              ΔW 补偿：E 的信息 → 加到 R
            </text>
          )}
          {W.map((v, i) => {
            const isR = i < keep;
            const pruned = !isR;
            const cx = x0 + i * (cell + gap);
            const shown = pruned && comp ? 0 : v + (isR && comp ? delta : 0);
            const fill = pruned ? '#c43f52' : comp ? '#228d5c' : '#27446e';
            const opacity = pruned && comp ? 0.35 : 1;
            const h = Math.max(18, Math.min(1.15, shown) * maxH);
            return (
              <g key={i}>
                {comp && pruned && keep > 0 && (
                  <path d={`M${cx + cell / 2} ${y0 - 26} C ${cx + cell / 2} 96, ${Rcx} 96, ${Rcx} ${y0 - 128}`}
                    fill="none" stroke="#228d5c" strokeWidth={2.5} strokeDasharray="5 4" opacity={0.8} />
                )}
                <rect x={cx} y={y0 - h} width={cell} height={h} rx={9} fill={fill} opacity={opacity} />
                <text x={cx + cell / 2} y={y0 + 26} textAnchor="middle" fontSize={19} fill="#68778f" fontWeight={700}
                  fontFamily="Cascadia Code, Consolas, monospace">
                  {Number(shown.toFixed(2)).toString()}
                </text>
                <text x={cx + cell / 2} y={y0 + 58} textAnchor="middle" fontSize={18}
                  fill={pruned ? '#c43f52' : '#27446e'} fontWeight={700}>{pruned ? 'E' : 'R'}</text>
              </g>
            );
          })}
          <line x1={x0} y1={y0 + 4} x2={x0 + N * (cell + gap) - gap} y2={y0 + 4} stroke="#c3ccd9" strokeWidth={3} />
        </svg>
        <div className="obr-note">权重与补偿为示意估算；真实 Δw*_R 由闭式解逐行计算（论文 §4）。</div>
      </div>
      <div className="obr-panel">
        <div className="obr-heading">分组与补偿</div>
        <Slider label="分组比例 α（R 占比）" value={alpha} min={0.1} max={0.9} step={0.1}
          onChange={setAlpha} format={(v) => v.toFixed(1)} />
        <div className="obr-controls">
          <SegButton active={comp} onClick={() => setComp(true)}>OBR 补偿</SegButton>
          <SegButton active={!comp} onClick={() => setComp(false)}>无补偿</SegButton>
        </div>
        <div className="obr-stat-row">
          <div className="obr-stat"><b className="stat-r">{keep}</b><span>R 集合（保留）</span></div>
          <div className="obr-stat"><b className="stat-e">{evicted}</b><span>E 集合（剪除）</span></div>
          <div className="obr-stat"><b className={comp ? 'stat-good' : 'stat-bad'}>{err}</b><span>扰动 ΔL（示意）</span></div>
        </div>
        <Feedback tone={comp ? 'green' : 'red'}>
          {comp
            ? '补偿把 E 的信息转移到 R，扰动 ΔL 大幅下降——这正是 OBR 的“修复”。'
            : '不补偿时，剪掉 E 会直接留下扰动，精度损失明显。'}
        </Feedback>
        <p className="obr-body muted">
          <SymbolHint meaning="α：R / E 分组比例，源码参数 obr_alpha 默认 0.5。">α</SymbolHint>
          {' 决定分组；闭式解把 '}
          <SymbolHint meaning="E 集合：对压缩敏感、被剪除的元素。">E</SymbolHint>
          {' 的信息转移到 '}
          <SymbolHint meaning="R 集合：对压缩不敏感、被保留的元素。">R</SymbolHint>
          。
        </p>
      </div>
    </div>
  );
}
