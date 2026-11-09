import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 静态对照：generalist 单 checkpoint 成绩（Tab 5）。任务专用行单列，不计入通用检查点。
const ROWS = [
  { model: 'PaLM-E-12B', vqav2: 76.2, okvqa: 55.5, coco: 135.0, note: '12B 通用检查点，跨任务评测；不与逐任务微调模型混记。' },
  { model: 'PaLM-E-562B', vqav2: 80.0, okvqa: 66.1, coco: 138.7, note: '562B 在 OK-VQA 验证集达到当时报告最高分，三项均高于 12B。' },
  { model: '冻结 LLM · PaLM-E-12B', vqav2: 70.3, okvqa: 51.5, coco: 128.0, note: '冻结语言模型、只训编码器路线；VQAv2 上优于此前 Frozen 方法。' },
];

const TASKS = [
  { key: 'vqav2', label: 'VQAv2', max: 100 },
  { key: 'okvqa', label: 'OK-VQA', max: 100 },
  { key: 'coco', label: 'COCO', max: 150 },
] as const;

/**
 * §7 静态证据（Tab 5）：通用模型同一检查点跨任务评测；点击一行查看口径要点。
 * 右侧用小横条呈现三项成绩，任务专用微调模型单列、不计入通用检查点。
 */
export const GeneralistEvidence: React.FC<WidgetProps> = (_props) => {
  const [active, setActive] = useState<number | null>(null);
  const current = active !== null ? ROWS[active] : null;

  return (
    <div className="generalist-table">
      <table>
        <thead>
          <tr>
            <th>通用模型（单 checkpoint）</th>
            <th>VQAv2</th>
            <th>OK-VQA val</th>
            <th>COCO Karpathy test</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => (
            <tr
              key={r.model}
              className={active === i ? 'selected' : ''}
              onClick={() => setActive(active === i ? null : i)}
              role="button"
              aria-pressed={active === i}
              style={{ cursor: 'pointer' }}
            >
              <td>{r.model}</td>
              <td>{r.vqav2.toFixed(1)}</td>
              <td>{r.okvqa.toFixed(1)}</td>
              <td>{r.coco.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {current && (
        <div className="bar-chart" style={{ marginTop: 12 }}>
          {TASKS.map((t) => (
            <div className="bar-row" key={t.key}>
              <span className="bar-label">{t.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(current[t.key] / t.max) * 100}%`, background: '#27446e' }} />
              </div>
              <span className="bar-value">{current[t.key].toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`feedback ${current ? '' : ''}`} style={{ marginTop: 8 }}>
        {current ? current.note : '点击一行，查看该检查点的口径与要点。'}
      </div>
      <p className="module-desc" style={{ marginTop: 8 }}>
        通用模型为同一检查点跨任务评测；任务专用微调模型各自使用单独微调检查点，两类成绩不混记。562B 在 OK-VQA 验证集达到当时报告最高分；冻结路线在 VQAv2 上优于此前 Frozen 方法。
      </p>
    </div>
  );
};

export default GeneralistEvidence;
