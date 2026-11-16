import React, { useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const widths = [100, 200, 400, 800, 1250, 2500, 5000, 10000, 15000] as const;
const accuracies = [71.6, 80.3, 83.9, 86.2, 86.8, 87.7, 88.4, 88.8, 89.0] as const;
const xMin = 54;
const xMax = 592;
const yMin = 26;
const yMax = 214;
const accuracyMin = 68;
const accuracyMax = 91;

function widthX(index: number) {
  const low = Math.log10(widths[0]);
  const high = Math.log10(widths[widths.length - 1]);
  return xMin + ((Math.log10(widths[index]) - low) / (high - low)) * (xMax - xMin);
}

function accuracyY(value: number) {
  return yMax - ((value - accuracyMin) / (accuracyMax - accuracyMin)) * (yMax - yMin);
}

export function RpCh9WidthGauge() {
  const [mIndex, setMIndex] = useState(7);
  const [protocol, setProtocol] = useState<'cil' | 'agnostic'>('cil');
  const [dragging, setDragging] = useState(false);
  const chartRef = useRef<SVGSVGElement>(null);
  const value = accuracies[mIndex];
  const width = widths[mIndex];
  const strokeCount = 6 + mIndex * 2;
  const feedback = protocol === 'agnostic'
    ? '换成 200 个微任务后，无任务边界和 λ 优化并未抹去 RP 的最终增益。'
    : dragging
      ? '宽度正在跨过受控消融的转折区。'
      : mIndex <= 4
        ? '受控消融中，M≤1250 仍低于无 RP；共享纹理没有被充分展开。'
        : 'M>1250 后超过 no-RP；更大宽度继续小幅提升。';
  const feedbackTone = protocol === 'agnostic'
    ? 'is-blue'
    : dragging
      ? 'is-orange'
      : mIndex <= 4
        ? 'is-red'
        : 'is-green';

  const points = useMemo(
    () => accuracies.map((accuracy, index) => `${widthX(index)},${accuracyY(accuracy)}`).join(' '),
    [],
  );

  const scrub = (clientX: number) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((clientX - rect.left) / rect.width) * 620;
    const low = Math.log10(widths[0]);
    const high = Math.log10(widths[widths.length - 1]);
    const ratio = Math.max(0, Math.min(1, (svgX - xMin) / (xMax - xMin)));
    const logWidth = low + ratio * (high - low);
    let nearest = 0;
    for (let index = 1; index < widths.length; index += 1) {
      if (Math.abs(Math.log10(widths[index]) - logWidth) < Math.abs(Math.log10(widths[nearest]) - logWidth)) {
        nearest = index;
      }
    }
    setMIndex(nearest);
  };

  const moveIndex = (delta: number) => {
    setMIndex((current) => Math.max(0, Math.min(widths.length - 1, current + delta)));
  };

  return (
    <div className="rp-widget rp-width-gauge-widget">
      <div className="rp-width-gauge-layout">
        <section className="rp-panel rp-width-chart-panel">
          <div className="rp-panel-heading">
            <span>Table A5 · 仅绘制报告 RP 准确率</span>
            <strong>{`M=${width.toLocaleString('zh-CN')} · ${value.toFixed(1)}%`}</strong>
          </div>
          <svg
            ref={chartRef}
            className="rp-width-chart"
            viewBox="0 0 620 250"
            role="slider"
            tabIndex={0}
            aria-label="投影宽度与 Table A5 RP 准确率"
            aria-valuemin={0}
            aria-valuemax={widths.length - 1}
            aria-valuenow={mIndex}
            aria-valuetext={`M=${width}，RP 准确率 ${value}%`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              scrub(event.clientX);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) scrub(event.clientX);
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              setDragging(false);
            }}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                event.preventDefault();
                moveIndex(-1);
              }
              if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveIndex(1);
              }
            }}
          >
            <rect x="12" y="10" width="596" height="228" rx="14" className="rp-chart-field" />
            {[68, 72, 76, 80, 84, 88].map((tick) => (
              <g key={tick}>
                <line x1={xMin} y1={accuracyY(tick)} x2={xMax} y2={accuracyY(tick)} className="rp-width-grid" />
                <text x="47" y={accuracyY(tick) + 6} textAnchor="end" className="rp-width-axis-text">{tick}</text>
              </g>
            ))}
            <line x1={xMin} y1={yMax} x2={xMax} y2={yMax} className="rp-chart-axis" />
            <line x1={xMin} y1={yMin} x2={xMin} y2={yMax} className="rp-chart-axis" />
            <line x1={widthX(4)} y1={yMin} x2={widthX(4)} y2={yMax} className="rp-threshold-line" />

            <polyline className="rp-width-curve" points={points} />
            {accuracies.map((accuracy, index) => (
              <circle
                key={widths[index]}
                cx={widthX(index)}
                cy={accuracyY(accuracy)}
                r={index === mIndex ? 8 : 4}
                className={`rp-width-point ${index === mIndex ? 'is-current' : ''}`}
              />
            ))}

            <line x1={widthX(mIndex)} y1={yMin} x2={widthX(mIndex)} y2={yMax} className="rp-width-gauge-line" />
            <rect
              x={widthX(mIndex) - 26}
              y={accuracyY(value) - 12}
              width="52"
              height="24"
              rx="7"
              className="rp-width-gauge-handle"
            />
            <text x={widthX(mIndex)} y={accuracyY(value) + 5} textAnchor="middle" className="rp-width-gauge-text">
              {value.toFixed(1)}
            </text>

            {widths.map((tick, index) => (
              <text
                key={tick}
                x={widthX(index)}
                y={index % 2 === 0 ? 232 : 246}
                textAnchor="middle"
                className={`rp-width-x-label ${index === mIndex ? 'is-current' : ''}`}
              >
                {tick >= 1000 ? `${tick / 1000}K` : tick}
              </text>
            ))}
          </svg>
          <div className="rp-chart-caption">
            <span>受控设置：split CIFAR100 · 无 Phase 1 · λ=100 · T=10</span>
            <span>论文文字门限：M&gt;1250 才超过 no-RP；不绘制未报告数值曲线</span>
          </div>
        </section>

        <section className="rp-panel rp-width-control-panel">
          <div className="rp-width-plate-preview" aria-label="随机板宽度示意，不代表真实矩阵">
            <div className="rp-width-plate">
              {Array.from({ length: 24 }, (_, index) => (
                <i
                  key={index}
                  className={index < strokeCount ? 'is-visible' : ''}
                  style={{
                    left: `${8 + (index % 6) * 16}%`,
                    top: `${10 + Math.floor(index / 6) * 23}%`,
                    transform: `rotate(${-16 + index * 2.7}deg)`,
                  }}
                />
              ))}
            </div>
            <div className="rp-width-veins" aria-hidden="true">
              {Array.from({ length: strokeCount }, (_, index) => (
                <span key={index} style={{ transform: `rotate(${-28 + index * 4.2}deg)` }} />
              ))}
            </div>
          </div>

          <label className="rp-range-label" htmlFor="rp-width-gauge-range">
            <span>投影宽度 <SymbolHint meaning="固定随机投影的列数，决定展开后的特征维数">M</SymbolHint></span>
            <strong>{width.toLocaleString('zh-CN')}</strong>
          </label>
          <input
            id="rp-width-gauge-range"
            type="range"
            min="0"
            max={widths.length - 1}
            step="1"
            value={mIndex}
            aria-valuetext={`投影宽度 ${width}`}
            onChange={(event) => setMIndex(Number(event.target.value))}
          />
          <div className="rp-width-tick-row" aria-hidden="true">
            {widths.map((tick, index) => (
              <span key={tick} className={index === mIndex ? 'is-current' : ''} />
            ))}
          </div>

          <div className="rp-segmented" role="group" aria-label="选择任务组织协议">
            <button
              type="button"
              className={protocol === 'cil' ? 'is-active' : ''}
              aria-pressed={protocol === 'cil'}
              onClick={() => setProtocol('cil')}
            >
              十个任务
            </button>
            <button
              type="button"
              className={protocol === 'agnostic' ? 'is-active' : ''}
              aria-pressed={protocol === 'agnostic'}
              onClick={() => setProtocol('agnostic')}
            >
              200 个微任务
            </button>
          </div>

          <div className="rp-protocol-note">
            {protocol === 'cil'
              ? '当前图表使用 Table A5 的十个任务受控消融；宽度结论不是任务无关协议的第二条曲线。'
              : '图 A6 使用 200 个五批量微任务、无 Phase 1、无最优 λ 选择；这里是定性稳健性证据。'}
          </div>
          <div className={`rp-feedback ${feedbackTone}`}>
            <strong>{protocol === 'agnostic' ? '无任务边界' : `M=${width.toLocaleString('zh-CN')}`}</strong>
            <span>{feedback}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
