import React, { useEffect, useState } from 'react';

const LOOP_MS = 900;
const LOOP_STEPS = 8;

// GPTQ 逐层量化闭环：FP16 权重 → 校准集 Hessian(Cholesky) → 逐列量化 → 误差补偿
// → 块批量更新 → 低比特权重 → 进入下一层循环。右下角对比 RTN 的失败方式。
// 布局纪律：标题 y=30，caption y=48，节点主体 y=56–144，主流程边 y=100，
// 底部回路 y=170–245，RTN 痛点 y=190–225。节点之间水平留白，互不重叠。
export function HeroGptqLoop() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setPhase((c) => (c + 1) % LOOP_STEPS), LOOP_MS);
    return () => window.clearInterval(timer);
  }, []);

  const active = (from: number, to = from) => phase >= from && phase <= to;

  return (
    <div className="hero-loop-system" data-testid="hero-gptq-loop" data-phase={phase}>
      <svg className="hero-loop-svg" viewBox="0 0 1060 306" role="img" aria-labelledby="gptq-loop-title gptq-loop-desc">
        <title id="gptq-loop-title">GPTQ 逐层量化闭环</title>
        <desc id="gptq-loop-desc">读取 FP16 权重，用校准集算 Hessian 并经 Cholesky 存逆信息；逐列量化后把误差补偿给剩余权重，块结束时批量更新，输出低比特权重，再进入下一层循环。右下角对比 RTN 独立量化导致的误差累积。</desc>
        <defs>
          <marker id="gptqArrowBlue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#27446e" />
          </marker>
          <marker id="gptqArrowOrange" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#d97706" />
          </marker>
          <marker id="gptqArrowGreen" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#16a34a" />
          </marker>
          <marker id="gptqArrowRed" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="#c43f52" />
          </marker>
        </defs>

        {/* 1. FP16 权重（输入） */}
        <g className={`gptq-fp16-node ${active(0) ? 'is-active' : ''}`}>
          <text x="100" y="30" textAnchor="middle" className="loop-node-title">FP16 权重 W</text>
          <text x="100" y="48" textAnchor="middle" className="loop-node-caption">175B · 326GB</text>
          <rect x="30" y="56" width="140" height="88" rx="10" className="gptq-matrix-frame" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect key={`w${r}${c}`} x={44 + c * 30} y={68 + r * 25} width="24" height="18" rx="3" className="gptq-cell-w" />
            ))
          )}
        </g>

        {/* 2. 校准集 → Hessian + Cholesky（中上） */}
        <g className={`gptq-hessian-node ${active(1) ? 'is-active' : ''}`}>
          <text x="280" y="30" textAnchor="middle" className="loop-node-title">校准集 X → Hessian</text>
          <text x="280" y="48" textAnchor="middle" className="loop-node-caption">128 个 C4 片段</text>
          <rect x="210" y="56" width="140" height="70" rx="10" className="gptq-matrix-frame" />
          <text x="280" y="96" textAnchor="middle" className="gptq-hessian-formula">H = 2XXᵀ</text>
        </g>

        {/* Cholesky 下三角（Hessian 右侧） */}
        <g className={`gptq-cholesky-node ${active(1) ? 'is-active' : ''}`}>
          <text x="408" y="48" textAnchor="middle" className="loop-edge-label">Cholesky L</text>
          {[0, 1, 2, 3].map((r) =>
            [0, 1, 2, 3].map((c) =>
              c <= r ? <rect key={`l${r}${c}`} x={370 + c * 20} y={66 + r * 20} width="16" height="16" rx="2" className="gptq-chol-cell" /> : null
            )
          )}
        </g>

        {/* 3. 核心量化循环（中） */}
        <g className={`gptq-core-node ${active(2, 4) ? 'is-active' : ''}`}>
          <text x="650" y="30" textAnchor="middle" className="loop-node-title">逐层量化（GPTQ）</text>
          <text x="650" y="48" textAnchor="middle" className="loop-node-caption">量化一列，补偿剩余未量化权重</text>
          <rect x="490" y="56" width="320" height="88" rx="14" className="gptq-core-frame" />
          <g className={`gptq-step-quant ${active(2) ? 'is-active' : ''}`}>
            <rect x="506" y="74" width="88" height="52" rx="7" className="gptq-step-box" />
            <text x="550" y="104" textAnchor="middle" className="gptq-step-text">逐列量化</text>
          </g>
          <g className={`gptq-step-comp ${active(3) ? 'is-active' : ''}`}>
            <rect x="606" y="74" width="88" height="52" rx="7" className="gptq-step-box" />
            <text x="650" y="104" textAnchor="middle" className="gptq-step-text">误差补偿</text>
          </g>
          <g className={`gptq-step-batch ${active(4) ? 'is-active' : ''}`}>
            <rect x="706" y="74" width="88" height="52" rx="7" className="gptq-step-box" />
            <text x="750" y="104" textAnchor="middle" className="gptq-step-text">块批量更新</text>
          </g>
          <path d="M594 100 L600 100" className="gptq-step-arrow" markerEnd="url(#gptqArrowOrange)" />
          <path d="M694 100 L700 100" className="gptq-step-arrow" markerEnd="url(#gptqArrowOrange)" />
        </g>

        {/* 4. 低比特权重（输出） */}
        <g className={`gptq-q-node ${active(5) ? 'is-active' : ''}`}>
          <text x="920" y="30" textAnchor="middle" className="loop-node-title">低比特权重 Q</text>
          <text x="920" y="48" textAnchor="middle" className="loop-node-caption">3–4bit · 单卡</text>
          <rect x="850" y="56" width="140" height="88" rx="10" className="gptq-q-frame" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect key={`q${r}${c}`} x={864 + c * 30} y={68 + r * 25} width="24" height="18" rx="3" className="gptq-cell-q" />
            ))
          )}
        </g>

        {/* 主流程边（固定 y=100） */}
        <path d="M170 100 L204 100" className={`gptq-edge ${active(0, 1) ? 'is-active' : ''}`} markerEnd="url(#gptqArrowBlue)" />
        <path d="M350 100 L364 100" className={`gptq-edge ${active(1) ? 'is-active' : ''}`} markerEnd="url(#gptqArrowBlue)" />
        <path d="M446 100 L484 100" className={`gptq-edge ${active(1, 2) ? 'is-active' : ''}`} markerEnd="url(#gptqArrowBlue)" />
        <path d="M810 100 L844 100" className={`gptq-edge ${active(5) ? 'is-active' : ''}`} markerEnd="url(#gptqArrowGreen)" />

        {/* 底部回路：Q → 下一层 → FP16 */}
        <path d="M920 144 L920 195 C920 225 700 232 100 232 C100 212 100 175 100 150" className={`gptq-edge gptq-loopback ${active(6) ? 'is-active' : ''}`} markerEnd="url(#gptqArrowBlue)" />
        <text x="510" y="228" textAnchor="middle" className="loop-edge-label">进入下一层循环 ↺</text>

        {/* RTN 痛点（右下，对比失败方式） */}
        <g className={`gptq-rtn-risk ${active(7) ? 'is-active' : ''}`}>
          <circle cx="830" cy="203" r="5" className="gptq-rtn-dot" />
          <text x="1030" y="198" textAnchor="end" className="gptq-rtn-text">RTN：独立量化每个权重</text>
          <text x="1030" y="222" textAnchor="end" className="gptq-rtn-text">层间误差累积 → 精度退化</text>
        </g>
      </svg>

      <p className="hero-loop-insight">
        <strong>真正的难点：</strong>量化误差不能丢弃，必须按敏感度方向补偿给未量化权重。
        <span>机制示意，非论文定量实验数据。</span>
      </p>

      <div className="hero-mechanism-row" aria-label="GPTQ 三大核心机制">
        <button type="button" className={`hero-mechanism action ${active(1) ? 'is-active' : ''}`} onClick={() => setPhase(1)}>
          <strong>Hessian 二阶信息</strong>
          <span>衡量权重对输出的影响</span>
          <small>用于误差补偿</small>
        </button>
        <button type="button" className={`hero-mechanism longforcing ${active(2, 4) ? 'is-active' : ''}`} onClick={() => setPhase(2)}>
          <strong>Layer-wise Lazy Batch</strong>
          <span>懒惰批量更新</span>
          <small>量化一列，补偿剩余未量化权重</small>
        </button>
        <button type="button" className={`hero-mechanism identity ${active(6) ? 'is-active' : ''}`} onClick={() => setPhase(6)}>
          <strong>Cholesky Reformulation</strong>
          <span>Cholesky 重写</span>
          <small>解决大矩阵 Hessian 求逆的数值不稳定</small>
        </button>
        <div className="hero-data-foundation" aria-label="校准数据">
          <span>校准数据</span>
          <strong>128 个随机 C4 片段 · 真 zero-shot</strong>
          <i aria-hidden="true">↓</i>
        </div>
        <div className="hero-convergence" aria-label="三项机制共同作用于 GPTQ">
          <span>三项机制共同作用于</span>
          <strong>GPTQ 逐层量化</strong>
        </div>
      </div>
    </div>
  );
}

export default HeroGptqLoop;
