import React, { useState } from 'react';

const CASES = [
  {
    key: 'A',
    title: '拿不到首任务校版',
    verdict: 'Last −2.0、Avg −1.8 点',
    paper: '表 1：CIFAR-100 上 CCA-CL 无 FTT 为 Last 81.0%、Avg 85.4%；完整版为 Last 83.0%、Avg 87.2%。',
    infer: '论文把它作为“训练-free 变体”报告，不是默认设置；作者在结论里也把依赖首任务微调列为局限。',
    status: '可用但有代价',
    tone: 'warn',
  },
  {
    key: 'B',
    title: '关系明显是弯的',
    verdict: 'RFP 可帮助捕捉非线性相关',
    paper: '表 2：CCA 为 76.5%，加 RFP 后 81.0%（CIFAR-100，无 FTT）——增益来自该消融设置。',
    infer: '“弯”是教学说法，论文的说法是线性 CCA 难以建模非线性相关，用随机特征近似 RBF 核。',
    status: '建议加 RFP',
    tone: 'good',
  },
  {
    key: 'C',
    title: '任务和类别都极少',
    verdict: '统计量不够，结论不稳（推断）',
    paper: '论文所有结果都是 4 个数据集各 10 个任务、每任务多类；没有报告 1–2 个任务的设置。',
    infer: '推断：Σ 由少量批次估出，典型方向与 η 截断都会不稳；这属于合理外推，不是论文已验证的结论。',
    status: '论文未覆盖',
    tone: 'bad',
  },
];

/** 适用边界：三种情境，分别看论文证据与推断。 */
export function LimitCases({ moduleId }: { moduleId: string }) {
  const [i, setI] = useState(0);
  const c = CASES[i];

  return (
    <div className="rs">
      <div className="rs-panel" style={{ left: 0, top: 0, width: 900, height: 622, padding: 16 }}>
        {CASES.map((item, k) => {
          const on = k === i;
          return (
            <button key={item.key} onClick={() => setI(k)} aria-pressed={on}
              style={{
                display: 'flex', alignItems: 'center', gap: 18, width: '100%', textAlign: 'left',
                border: `2px solid ${on ? 'var(--blue)' : 'var(--rule)'}`,
                background: on ? 'rgba(39,68,110,0.06)' : '#fff',
                borderRadius: 14, padding: '16px 18px', marginBottom: 14, cursor: 'pointer',
              }}>
              <svg viewBox="0 0 90 90" width="92" height="92" aria-hidden="true">
                <rect x="6" y="6" width="78" height="78" rx="8" fill="#fdfdf8" stroke="#d7deea" strokeWidth="2" />
                <path d="M45 18V72M18 45H72" stroke="#27446e" strokeWidth="2.5" />
                <circle cx="45" cy="45" r="20" fill="none" stroke={item.tone === 'good' ? '#228d5c' : item.tone === 'bad' ? '#c43f52' : '#f07e47'}
                  strokeWidth="2.5" strokeDasharray={item.key === 'C' ? '6 5' : undefined} />
              </svg>
              <span style={{ flex: 1 }}>
                <span className="rs-h" style={{ display: 'block' }}>{item.title}</span>
                <span className="rs-t muted">{item.verdict}</span>
              </span>
              <span className={`rs-t ${item.tone === 'good' ? 'rs-green' : item.tone === 'bad' ? 'rs-red' : 'rs-orange'}`}
                style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{item.status}</span>
            </button>
          );
        })}
      </div>

      <div className="rs-panel" style={{ left: 924, top: 0, width: 548, height: 622 }}>
        <p className="rs-h">{c.title}</p>
        <p className="rs-t muted" style={{ marginTop: 12 }}>论文怎么说</p>
        <p className="rs-t">{c.paper}</p>
        <p className="rs-t muted" style={{ marginTop: 14 }}>
          {c.key === 'C' ? '推断（未经验证）' : '解读'}
        </p>
        <p className="rs-t">{c.infer}</p>
        <div className={`rs-feedback ${c.tone}`} style={{ marginTop: 16 }}>{c.verdict}</div>
        <p className="rs-t muted" style={{ marginTop: 14 }}>
          共同前提：CLIP ViT-B/16、类增量、10 任务、无 replay。
        </p>
      </div>
    </div>
  );
}
