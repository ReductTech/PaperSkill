import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const CHARS = ['我', '要', '攻', '击', '你'];
/** Autoregressive starts with 我要 visible; then left-to-right. */
const AR_START = 2;
/** Diffusion unmask order: ends inward, not left-to-right. */
const DIFF_ORDER = [0, 4, 1, 3, 2];

function Tile({
  ch,
  shown,
  accent,
}: {
  ch: string;
  shown: boolean;
  accent: 'ar' | 'diff';
}) {
  return (
    <div
      style={{
        width: 40,
        height: 44,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 18,
        border: `1.5px solid ${shown ? (accent === 'ar' ? '#27446e' : '#228d5c') : '#d7deea'}`,
        background: shown ? (accent === 'ar' ? '#e8eef6' : '#e7f5ee') : '#f3f4f1',
        color: shown ? '#21324a' : '#b8c0b0',
      }}
    >
      {shown ? ch : '▮'}
    </div>
  );
}

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [arStep, setArStep] = useState(0); // 0..3 extra chars after 我要
  const [diffStep, setDiffStep] = useState(0); // 0..5 unmasked

  const arShown = AR_START + arStep;
  const diffShown = new Set(DIFF_ORDER.slice(0, diffStep));

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="compare-row opt-io">
        <div
          style={{
            background: '#fff',
            border: '1px solid #d7deea',
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 800, color: '#27446e', marginBottom: 6 }}>自回归方法</div>
          <div style={{ color: '#68778f', fontSize: 13, marginBottom: 12 }}>从左到右，一个接一个</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
            {CHARS.map((ch, i) => (
              <Tile key={i} ch={ch} shown={i < arShown} accent="ar" />
            ))}
          </div>
          <div className="ctrl" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setArStep((s) => Math.max(0, s - 1))}
              disabled={arStep === 0}
            >
              回退
            </button>
            <button
              type="button"
              onClick={() => setArStep((s) => Math.min(3, s + 1))}
              disabled={arStep === 3}
            >
              生成下一个
            </button>
          </div>
          <div className="opt-card bad" style={{ marginTop: 10 }}>
            <div className="opt-kicker">缺点（论文）</div>
            <pre className="opt-pre">
              常需手写策略 Prompt，引入偏置与人工（A.1）；也难干净限制在短生成预算（E）。
            </pre>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #d7deea',
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 800, color: '#228d5c', marginBottom: 6 }}>掩码扩散方法</div>
          <div style={{ color: '#68778f', fontSize: 13, marginBottom: 12 }}>双向填空，不必正序</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
            {CHARS.map((ch, i) => (
              <Tile key={i} ch={ch} shown={diffShown.has(i)} accent="diff" />
            ))}
          </div>
          <div className="ctrl" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setDiffStep((s) => Math.max(0, s - 1))}
              disabled={diffStep === 0}
            >
              回退
            </button>
            <button
              type="button"
              onClick={() => setDiffStep((s) => Math.min(5, s + 1))}
              disabled={diffStep === 5}
            >
              揭开一格
            </button>
          </div>
          <div className="opt-card good" style={{ marginTop: 10 }}>
            <div className="opt-kicker">优点（论文）</div>
            <pre className="opt-pre">
              双向填充、直接以行为 b 为条件，无需脚手架（A.1）；固定窗口可控长度，短预算也够强（E、H）。
            </pre>
          </div>
        </div>
      </div>

      <div className={`feedback ${diffStep >= 5 ? 'good' : ''}`} style={{ marginTop: 12 }}>
        {diffStep >= 5
          ? '扩散从两端向中间揭开「我要攻击你」，不必正序；难行为会自动换填充分布。'
          : arStep === 3
            ? '自回归已从「我要」逐字接到「攻击你」。换行为往往还要再写策略 Prompt。'
            : '左边从「我要」往后接字；右边五步揭开同一句，顺序不必从左到右。'}
      </div>
    </div>
  );
};

export default Ch3Mod1;
