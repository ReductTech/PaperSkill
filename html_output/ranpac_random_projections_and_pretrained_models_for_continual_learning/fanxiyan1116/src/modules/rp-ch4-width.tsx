import React, { useMemo, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const samples = Array.from({ length: 24 }, (_, index) =>
  2 + index * ((Math.log10(15000) - 2) / 23),
);

const randomWeights = Array.from({ length: 24 }, (_, index) => {
  const x = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
});

export function RpCh4Width() {
  const [logWidth, setLogWidth] = useState(4);
  const [activation, setActivation] = useState<'relu' | 'linear'>('relu');
  const padRef = useRef<HTMLDivElement>(null);
  const width = Math.round(10 ** logWidth);
  const sampleIndex = Math.round(((logWidth - 2) / (Math.log10(15000) - 2)) * 23);
  const strokeCount = Math.max(4, Math.min(24, sampleIndex + 4));
  const nonlinearGain = activation === 'relu' ? 1 : 0.45;
  const terms = randomWeights.map((value) => {
    const transformed = activation === 'relu' ? Math.max(0, value) : value;
    return { a: transformed * 0.52 + 0.08, b: transformed * 0.31 - 0.05 };
  });
  const classA = terms.reduce((sum, term) => sum + term.a, 0) * nonlinearGain;
  const classB = terms.reduce((sum, term) => sum + term.b, 0) * nonlinearGain;
  const scoreGap = Math.abs(classA - classB);
  const ratio = width / 768;
  const regime = width <= 768 ? '未进入宽展开区' : width >= 10000 ? '常用宽展开区' : '过渡区';
  const feedback = (
    <>
      <strong>{`M=${width.toLocaleString('zh-CN')}，M/L≈${ratio.toFixed(1)}，${regime}`}</strong>
      <span>
        {activation === 'relu'
          ? '逐元素 ReLU 截去负向贡献，局部纹理对比更清楚。'
          : '恒等映射保留正负贡献，局部纹理彼此抵消得更多。'}
        {' '}这里的叶脉条数和分数差是教学构造，不是测得的准确率。
      </span>
    </>
  );

  const scrub = (clientX: number) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setLogWidth(2 + fraction * (Math.log10(15000) - 2));
  };

  return (
    <div className="rp-widget rp-two-col rp-width-widget">
      <section className="rp-panel rp-canvas-panel" aria-label="固定穿孔板拓印">
        <div className="rp-panel-heading">
          <span>固定穿孔板</span>
          <strong>{`${strokeCount} 条可见叶脉`}</strong>
        </div>
        <div
          ref={padRef}
          className="rp-rubbing-pad"
          role="slider"
          tabIndex={0}
          aria-label="在穿孔板上横向拖动以调节投影宽度"
          aria-valuemin={100}
          aria-valuemax={15000}
          aria-valuenow={width}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            scrub(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) scrub(event.clientX);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              setLogWidth((value) => Math.max(
                2,
                Math.min(Math.log10(15000), value + (event.key === 'ArrowRight' ? 0.08 : -0.08)),
              ));
            }
          }}
        >
          <div className="rp-fixed-plate" aria-hidden="true">
            {randomWeights.map((weight, index) => (
              <span
                key={index}
                className="rp-hole"
                style={{
                  left: `${8 + (index % 6) * 16}%`,
                  top: `${10 + Math.floor(index / 6) * 23}%`,
                  opacity: 0.35 + Math.abs(weight) * 0.65,
                }}
              />
            ))}
          </div>
          <div className="rp-pad-handle" style={{ left: `${sampleIndex / 23 * 84 + 8}%` }} aria-hidden="true">
            <span />
          </div>
          <div className="rp-vein-strokes" aria-hidden="true">
            {terms.slice(0, strokeCount).map((term, index) => (
              <span
                key={index}
                style={{
                  height: `${4 + Math.abs(term.a - term.b) * 9}px`,
                  opacity: 0.35 + nonlinearGain * 0.55,
                  transform: `rotate(${-2 + index * 0.2}deg)`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="rp-score-pair" aria-label="两个教学类别的投影贡献">
          <div>
            <span>类别 A</span>
            <i style={{ width: `${Math.max(4, Math.min(100, 18 + classA * 34))}%` }} />
            <b>{classA.toFixed(2)}</b>
          </div>
          <div>
            <span>类别 B</span>
            <i style={{ width: `${Math.max(4, Math.min(100, 18 + classB * 34))}%` }} />
            <b>{classB.toFixed(2)}</b>
          </div>
          <strong>{`教学分数差 ${scoreGap.toFixed(2)}`}</strong>
        </div>
      </section>

      <section className="rp-panel rp-controls-panel">
        <label className="rp-range-label" htmlFor="rp-width-range">
          <span>投影宽度 <SymbolHint meaning="固定随机投影的列数，决定展开后的特征维数">M</SymbolHint></span>
          <strong>{width.toLocaleString('zh-CN')}</strong>
        </label>
        <input
          id="rp-width-range"
          type="range"
          min="2"
          max={Math.log10(15000)}
          step="0.01"
          value={logWidth}
          aria-valuetext={`投影宽度 ${width}`}
          onChange={(event) => setLogWidth(Number(event.target.value))}
        />
        <div className="rp-scale-axis" aria-label="宽度采样位置">
          {samples.map((sample, index) => (
            <span
              key={index}
              className={index === sampleIndex ? 'is-current' : ''}
              title={`M=${Math.round(10 ** sample).toLocaleString('zh-CN')}`}
            />
          ))}
        </div>
        <div className="rp-reference-marks">
          <span>{`L=768`}</span>
          <span>{`M=10000`}</span>
        </div>
        <div className="rp-segmented" role="group" aria-label="非线性类型">
          <button type="button" className={activation === 'relu' ? 'is-active' : ''} onClick={() => setActivation('relu')}>
            逐元素 ReLU
          </button>
          <button type="button" className={activation === 'linear' ? 'is-active' : ''} onClick={() => setActivation('linear')}>
            恒等映射
          </button>
        </div>
        <div className="rp-formula-strip">
          <SymbolHint meaning="冻结主干输出的原始特征向量">f</SymbolHint>
          {' 经固定 '}
          <SymbolHint meaning="一次采样后冻结的随机投影矩阵">W</SymbolHint>
          {' 得到 '}
          <SymbolHint meaning="逐元素非线性后的投影特征">h=φ(fᵀW)</SymbolHint>
        </div>
        <div className="rp-feedback">{feedback}</div>
      </section>
    </div>
  );
}
