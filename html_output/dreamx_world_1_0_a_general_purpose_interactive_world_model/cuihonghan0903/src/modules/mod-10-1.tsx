import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §10 评测结果：一张总表印证下方「结论 / 边界」要点（Tables 3–5 实测数值）。
// 指标名可点击查看含义（与公式块的符号交互一致）；每列第一加粗 ★；
// 全部数值转录自论文 Tables 3–5，无空缺单元格。

const MODELS = ['LingBot-World', 'HY-WorldPlay 1.5', 'DreamX-World-1.0-5B'];

type Cell = number | null;

const COLS: { key: string; label: string }[] = [
  { key: 'total5', label: '5 秒总分' },
  { key: 'total30', label: '30 秒总分' },
  { key: 'cam30', label: '30 秒相机控制' },
  { key: 'dPSNR', label: 'ΔPSNR' },
  { key: 'dSSIM', label: 'ΔSSIM' },
  { key: 'dLPIPS', label: 'ΔLPIPS' },
  { key: 'dDINO', label: 'ΔDINO-Sim' },
  { key: 'dVPR', label: 'ΔVPR-Sim' },
  { key: 'dSP', label: 'ΔSP-Match' },
  { key: 'clipv', label: 'CLIP-V' },
];

// 行序与 MODELS 一致；列序与 COLS 一致
const DATA: Cell[][] = [
  [80.45, 67.43, 63.76, 0.61, 0.019, 0.039, 0.090, 0.100, 0.088, 0.987],
  [80.79, 68.85, 65.86, 3.19, 0.079, 0.202, 0.200, 0.110, 0.251, 0.992],
  [84.76, 70.41, 62.03, 3.92, 0.098, 0.232, 0.246, 0.142, 0.216, 0.991],
];

// 指标含义（依据论文 §5.1 Metrics 段与各表表注）
const EXPLAIN: Record<string, string> = {
  total5: '5 秒基础评测总分：各维度归一化到 [0,100] 后的综合分，越高越好（Table 3）。',
  total30: '30 秒长时程评测总分：长视频下的综合分；三家在伪影维度都明显下滑——长时程依然困难（Table 4）。',
  cam30: '30 秒档相机控制分：由 e_camera = √(e_θ · e_t) 逐帧计算后归一化（定义见下方公式块），越高越好；此项 DreamX 在三家中最低（62.03 < 63.76 < 65.86）。',
  dPSNR: '像素级保真：重访帧与参考帧的信噪比增益，对任何场景内容漂移都敏感。',
  dSSIM: '像素级保真：局部结构相似性增益。',
  dLPIPS: '感知一致性：深度特征空间的感知距离增益（论文对 LPIPS 反向计增益，正值 = 记忆更好）。',
  dDINO: '语义一致性：两帧冻结 DINOv2 特征的余弦相似度增益；下降意味着重访后语义内容被改变。',
  dVPR: '地点识别：MutualVPR 全局描述子，跨视角变化找回同一地点，减少相机控制误差的干扰。',
  dSP: '几何结构：SuperPoint 关键点（每帧至多 1024 个）经 LightGlue 匹配的匹配率 r = N_match / min(N_i, N_j)。',
  clipv: '时序平滑度：相邻帧之间的平均 CLIP 相似度，以绝对值报告（非增益）。',
};

export const Mod101: React.FC<WidgetProps> = () => {
  const [active, setActive] = useState<string | null>(null);
  const toggle = (k: string) => setActive((p) => (p === k ? null : k));

  const metricBtn = (key: string, label: string) => (
    <button className={`sym ${active === key ? 'active' : ''}`} onClick={() => toggle(key)}>
      {label}
    </button>
  );

  const colBest = (c: number) => {
    let bi = -1;
    DATA.forEach((r, i) => {
      const v = r[c];
      if (v !== null && (bi === -1 || v > (DATA[bi][c] as number))) bi = i;
    });
    return bi;
  };

  return (
    <div>
      <p style={{ margin: '2px 0 4px', color: '#68778f', fontSize: 13 }}>点击表头中的指标名查看含义</p>
      <table className="paper">
        <thead>
          <tr>
            <th rowSpan={2}>Model</th>
            <th colSpan={3}>基础与长时程（Tables 3-4）</th>
            <th colSpan={7}>10 秒重访记忆（Table 5）</th>
          </tr>
          <tr>
            {COLS.map((c) => (
              <th key={c.key}>{metricBtn(c.key, c.label)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DATA.map((row, ri) => (
            <tr key={MODELS[ri]}>
              <td>{ri === 2 ? <strong>{MODELS[ri]}</strong> : MODELS[ri]}</td>
              {row.map((v, c) => (
                <td key={COLS[c].key}>
                  {v === null ? '—' : colBest(c) === ri ? <strong>{`${v} ★`}</strong> : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {active ? (
        <div className="fe-explain" key={active}>
          <span className="fe-explain-sym">{COLS.find((c) => c.key === active)?.label ?? ''}</span>
          <span className="fe-explain-desc">{EXPLAIN[active]}</span>
        </div>
      ) : null}

      <div className="feedback">
        {'每列第一加粗 ★。Δ 指标为相对非重访基线的增益（LPIPS 反向计增益），CLIP-V 为绝对值；全部数值转录自论文 Tables 3–5。'}
      </div>
    </div>
  );
};

export default Mod101;
