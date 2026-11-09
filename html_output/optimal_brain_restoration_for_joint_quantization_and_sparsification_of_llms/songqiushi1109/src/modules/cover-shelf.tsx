import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { clamp } from './obrKit';

// 封面：搬家整理书架的生活类比。每本书代表一个权重元素，厚度∝权重幅值。
// 旧方法（纯量化 GPTQ）：直接压缩到少数厚度档位，被下架的书信息丢失 → 精度下降。
// 新方法（OBR）：先剪掉最薄的一批书，把它们的“重点笔记”誊抄到留下的书上，再压缩装箱 → 精度保持。
const weights = [0.92, 0.38, 0.74, 0.16, 0.55, 0.06, 0.82, 0.24, 0.62, 0.44];
const prunedIdx = new Set([3, 5, 7]); // 最薄的 3 本被剪掉
const MAX = 1;
const SLOT = 62;
const BASE = 268;
const MAXH = 190;

function bookHeights(quantized: boolean): number[] {
  return weights.map((w) => {
    const h = (w / MAX) * MAXH;
    if (!quantized) return h;
    // 量化到 4 档：0.25/0.5/0.75/1.0
    const lvl = Math.round(w * 4) / 4;
    return (lvl / MAX) * MAXH;
  });
}

export function CoverShelf({ moduleId }: WidgetProps) {
  const { progress } = useCoverPlayback();
  const isNew = moduleId === 'newMethod';
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = reduced ? 1 : progress;

  // 三阶段：0–0.34 剪枝，0.34–0.66 补偿/信息转移，0.66–1 量化
  const pPrune = clamp((t - 0.02) / 0.32, 0, 1);
  const pComp = clamp((t - 0.36) / 0.3, 0, 1);
  const pQuant = clamp((t - 0.68) / 0.3, 0, 1);

  const finalHeights = bookHeights(pQuant >= 1);
  const result = isNew
    ? (pQuant >= 1 ? '先剪枝 → 誊抄补偿 → 量化装箱' : pComp >= 1 ? '把下架书的笔记誊抄回留下的书' : pPrune >= 1 ? '先剪掉最薄的一批书' : '整理书架，准备搬入更小的家')
    : (pQuant >= 1 ? '直接压缩装箱，下架信息丢失' : pPrune >= 1 ? '下架书的信息已无法找回' : '直接把书压缩到少数厚度档位');

  return (
    <div className="obr-cover">
      <svg viewBox="0 0 660 320" role="img"
        aria-label={isNew ? 'OBR：先剪枝、把下架书笔记誊抄回留下的书、再量化' : '纯量化：直接压缩，下架书信息丢失'}>
        <rect width="660" height="320" fill="#f5f8f0" />
        <rect x="0" y="268" width="660" height="52" fill="#c9d3e0" />
        {weights.map((w, i) => {
          const pruned = prunedIdx.has(i);
          const finalH = finalHeights[i];
          const startH = (w / MAX) * MAXH;
          // 旧方法：不剪枝，只做量化（高度向离散档位收敛）
          // 新方法：先剪（变灰变矮），再量化
          let h: number;
          let fill: string;
          let opacity = 1;
          if (isNew) {
            if (pruned) {
              const shrink = 1 - 0.85 * pPrune;
              h = startH * shrink;
              fill = '#c43f52';
              opacity = 1 - 0.55 * pPrune;
            } else {
              h = startH + (finalH - startH) * pQuant;
              fill = pComp >= 1 ? '#228d5c' : '#27446e';
            }
          } else {
            h = startH + (finalH - startH) * pQuant;
            fill = '#27446e';
            if (prunedIdx.has(i) && pQuant > 0.1) fill = '#c43f52';
          }
          const cx = 30 + i * SLOT + SLOT / 2;
          return (
            <g key={i}>
              <rect x={cx - 20} y={BASE - h} width={40} height={h} rx={5} fill={fill} opacity={opacity} />
              <rect x={cx - 20} y={BASE - h} width={40} height={7} rx={3.5} fill="#ffffff" opacity={0.35} />
              {isNew && !pruned && pComp > 0 && (
                <circle cx={cx} cy={BASE - h - 10} r={3 + 5 * pComp} fill="#228d5c" />
              )}
              {isNew && pruned && pComp > 0 && (
                <path d={`M${cx} ${BASE - 26} q ${(prunedIdx.has(i - 1) ? -1 : 1) * 22} -12 ${(prunedIdx.has(i - 1) ? -1 : 1) * 40} -4`}
                  fill="none" stroke="#228d5c" strokeWidth={2.5} strokeDasharray="4 3" opacity={0.9 * pComp} />
              )}
            </g>
          );
        })}
        <text x="24" y="34" fontSize="20" fontWeight="700" fill="#21324a">
          {isNew ? 'OBR：剪枝 + 誊抄补偿 + 量化' : '纯量化：只压缩，不补偿'}
        </text>
      </svg>
      <div className={`obr-cover-result ${isNew ? 'is-success' : 'is-fail'}`}>{result}</div>
    </div>
  );
}
