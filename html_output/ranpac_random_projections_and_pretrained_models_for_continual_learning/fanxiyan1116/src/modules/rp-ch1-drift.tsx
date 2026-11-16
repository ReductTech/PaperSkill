import React, { useRef, useState } from 'react';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function RpCh1Drift() {
  const [pressure, setPressure] = useState(48);
  const padRef = useRef<HTMLDivElement>(null);
  const clarity = 0.18 + pressure / 95 * 0.82;
  const retention = 1 - clamp((pressure - 42) / 53, 0, 1) * 0.88;
  const balance = clamp((retention - (1 - clarity)) * 50 + 50, 0, 100);
  const state = balance > 64 ? 'green' : balance < 42 ? 'red' : 'blue';
  const feedback = state === 'green'
    ? '压力处于教学兼顾区：新页纹理清楚，旧页标签仍能保留大部分痕迹。'
    : state === 'red'
      ? '压力过高：当前页更清楚，但同一共享分类器的更新正在覆盖旧页标签。'
      : '压力偏低：旧页保留较多，但新页纹理还没有充分显影。';

  const scrub = (clientX: number) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fraction = clamp((clientX - rect.left) / rect.width, 0, 1);
    setPressure(Math.round(20 + fraction * 75));
  };

  return (
    <div className="rp-widget rp-two-col rp-drift-widget">
      <section className="rp-panel rp-canvas-panel">
        <div className="rp-context-block">
          <h3>持续学习的核心困境</h3>
          <p>
            持续学习（Continual Learning, CL）要求模型在数据分布随时间变化时，仍能保持对先前任务的性能。
            传统训练方法在顺序学习场景中表现不佳，因为参数更新会偏向新样本，覆盖之前学到的知识——这种现象被称为"灾难性遗忘"（catastrophic forgetting）。
          </p>
          <p>
            论文第1页指出：传统训练方法无法处理CL的原因有二：
            (1) 参数更新偏向新样本，覆盖旧知识；
            (2) 顺序学习的数据不重叠，模型没有机会学习不同阶段样本之间的差异。
          </p>
          <p>
            <strong>稳定性-可塑性困境（Stability-Plasticity Dilemma）</strong>：
            模型必须在保持旧知识（稳定性）和学习新知识（可塑性）之间找到平衡。
            下方的交互演示了当同一个共享分类器被不断更新时，这种平衡为何难以维持。
          </p>
        </div>
        <div className="rp-panel-heading">
          <span>同一本拓印手账</span>
          <strong>{`书写压力 ${pressure}`}</strong>
        </div>
        <div
          ref={padRef}
          className="rp-drift-pad"
          role="slider"
          tabIndex={0}
          aria-label="左右拖动拓印垫调节书写压力"
          aria-valuemin={20}
          aria-valuemax={95}
          aria-valuenow={pressure}
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
              setPressure((value) => clamp(value + (event.key === 'ArrowRight' ? 1 : -1), 20, 95));
            }
          }}
        >
          <div className="rp-journal-sheet">
            <div className="rp-drift-page is-task-one" style={{ opacity: 0.2 + retention * 0.8 }}>
              <span>旧任务 1</span>
              <i />
              <b style={{ opacity: retention }}>旧类标签 · 叶形</b>
            </div>
            <div className="rp-drift-page is-task-two" style={{ opacity: 0.18 + clarity * 0.82 }}>
              <span>任务 2</span>
              <i />
              <b style={{ opacity: clarity }}>新类标签 · 叶脉</b>
            </div>
            <div className="rp-drift-page is-task-three" style={{ opacity: 0.08 + clarity * 0.55 }}>
              <span>任务 3</span>
              <i />
            </div>
          </div>
          <div className="rp-drift-rub" style={{ left: `${(pressure - 20) / 75 * 70 + 13}%` }} aria-hidden="true">
            <span />
          </div>
        </div>
        <div className="rp-balance-meter" aria-label="新旧任务平衡">
          <span>旧标签保留</span>
          <div><i style={{ width: `${balance}%` }} /></div>
          <span>新页清晰</span>
        </div>
      </section>

      <section className="rp-panel rp-controls-panel">
        <label className="rp-range-label" htmlFor="rp-drift-range">
          <span>书写压力</span>
          <strong>{pressure}</strong>
        </label>
        <input
          id="rp-drift-range"
          type="range"
          min="20"
          max="95"
          value={pressure}
          onChange={(event) => setPressure(Number(event.target.value))}
        />
        <div className="rp-metric-stack">
          <div>
            <span>当前页清晰度</span>
            <i style={{ width: `${clarity * 100}%` }} />
            <strong>{Math.round(clarity * 100)}%</strong>
          </div>
          <div>
            <span>旧页保留率</span>
            <i className="is-old" style={{ width: `${retention * 100}%` }} />
            <strong>{Math.round(retention * 100)}%</strong>
          </div>
        </div>
        <div className="rp-teaching-note">
          <strong>教学比喻说明：</strong>
          压力模拟参数更新的强度。三页纸共享同一个分类器（拓板），无法同时优化所有任务。
          压力越大，新任务学得越好，但旧任务的标签被覆盖得越多。
          这个比喻不是梯度幅度的精确测量，而是用来展示稳定性-可塑性冲突的教学构造。
        </div>
        <div className={`rp-feedback is-${state}`}>
          <strong>{state === 'green' ? '新旧兼顾' : state === 'red' ? '旧标签漂移' : '新证据偏弱'}</strong>
          <span>{feedback} 页面不回放旧样本，也不建立基准准确率。</span>
        </div>
        <div className="rp-context-block">
          <p>
            <strong>为什么会发生遗忘？</strong>
            当模型参数在新任务上更新时，之前为旧任务优化的权重被覆盖。
            如果不回放旧样本（rehearsal buffer），模型只能依靠之前留下的"痕迹"维持旧任务性能，
            而这些痕迹在新任务的梯度压力下逐渐消失。
          </p>
          <p>
            <strong>RanPAC 的解决思路：</strong>
            既然遗忘发生在参数更新过程中，那么避免更新参数就能避免遗忘。
            RanPAC 冻结预训练模型和随机投影层，只累积统计量（类原型和 Gram 矩阵），
            用闭式解（closed-form solution）计算分类器权重，完全绕过 SGD 更新。
          </p>
        </div>
      </section>
    </div>
  );
}
