import React, { useState } from 'react';
import { PaperTable } from './hy-paper-evidence';
import type { PaperTableId } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type Verdict = '成立' | '有条件' | '不成立';

type Metric = {
  beforeLabel: string;
  before: string;
  afterLabel: string;
  after: string;
  note: string;
};

type CaseFile = {
  category: string;
  claim: string;
  correct: Verdict;
  source: string;
  sourceUrl: string;
  explanation: string;
  checks: string[];
  metric?: Metric;
  tableId?: PaperTableId;
};

const cases: CaseFile[] = [
  {
    category: '论文结果',
    claim: '在论文表 4 的 I2P 协议下，HY-Pano 2.0 的 CLIP-I 高于 HY-World 1.0。',
    correct: '成立',
    source: '论文表 4',
    sourceUrl: 'https://arxiv.org/abs/2604.14268',
    explanation: '这是同一表格、同一指标下的兼容比较，可以陈述为该协议内提升。',
    checks: ['指标方向：越高越好', '比较范围：I2P 图像到全景', '不能外推为所有全景任务都更优'],
    metric: { beforeLabel: 'HY-World 1.0', before: '0.831', afterLabel: 'HY-Pano 2.0', after: '0.844', note: 'CLIP-I' },
    tableId: 'table-4',
  },
  {
    category: '高分辨率重建',
    claim: '在 7-Scenes 高分辨率设置中，WorldMirror 2.0 的点图误差低于 1.0。',
    correct: '成立',
    source: '论文表 11',
    sourceUrl: 'https://arxiv.org/abs/2604.14268',
    explanation: '表 11 的 Acc. 是误差指标，数值越低越好；2.0 从 0.079 降到 0.037。',
    checks: ['指标方向：越低越好', '分辨率：论文高分辨率设置', '不能把误差下降写成准确率下降'],
    metric: { beforeLabel: 'WorldMirror 1.0', before: '0.079', afterLabel: 'WorldMirror 2.0', after: '0.037', note: 'Acc. ↓' },
    tableId: 'table-11',
  },
  {
    category: '3DGS 取舍',
    claim: '完整配置把高斯数从 6.000M 降到 1.381M，而且画质完全没有变化。',
    correct: '有条件',
    source: '论文表 9',
    sourceUrl: 'https://arxiv.org/abs/2604.14268',
    explanation: '高斯数量约减少 77%，但 PSNR 从 25.176 变为 25.023，不能说“完全没有变化”。',
    checks: ['数量显著下降成立', '画质接近但并非数值相同', '困难轨迹仍可能产生对齐误差'],
    metric: { beforeLabel: '基线', before: '6.000M / 25.176', afterLabel: '完整配置', after: '1.381M / 25.023', note: '高斯数 / PSNR' },
    tableId: 'table-9',
  },
  {
    category: '效率边界',
    claim: '128 视图重建只需 5.60 秒，所以完整世界生成已经可以实时完成。',
    correct: '不成立',
    source: '论文表 14 与效率汇总',
    sourceUrl: 'https://arxiv.org/abs/2604.14268',
    explanation: '5.60 秒是特定 H20 四卡配置下的 128 视图重建步骤；论文给出的完整世界生成总耗时是 712 秒。',
    checks: ['局部步骤不能代表完整管线', '硬件条件：NVIDIA H20', '完整生成仍是分钟级离线流程'],
    metric: { beforeLabel: '128 视图重建', before: '5.60 s', afterLabel: '完整世界生成', after: '712 s', note: '不同任务，不可直接替换' },
    tableId: 'table-14',
  },
  {
    category: '外部比较',
    claim: '论文已经在统一评测协议下定量证明 HY-World 2.0 超过 Marble。',
    correct: '不成立',
    source: '论文比较边界',
    sourceUrl: 'https://arxiv.org/abs/2604.14268',
    explanation: '论文对 Marble 提供的是定性比较，没有兼容协议下的定量表格。',
    checks: ['可以讨论案例观感', '不能伪造统一指标排名', '第三方体验只能作为个人判断'],
  },
  {
    category: '官方开源状态',
    claim: '当前官方仓库提供 WorldMirrorPipeline、单卡/多卡命令和 Gradio 入口。',
    correct: '成立',
    source: '官方 GitHub 与中文文档',
    sourceUrl: 'https://github.com/Tencent-Hunyuan/HY-World-2.0',
    explanation: '仓库文档已经给出类似 Diffusers 的 Pipeline、命令行推理和 Gradio 使用方式。',
    checks: ['首次运行会下载权重', '多 GPU 输入图像数需不少于 GPU 数', '代码和权重版本需要匹配'],
  },
  {
    category: '产品体验',
    claim: '腾讯官方 Scene to 3D 页面无需登录即可直接创建世界。',
    correct: '不成立',
    source: '腾讯混元 3D 当前页面',
    sourceUrl: 'https://3d.hunyuan.tencent.com/sceneTo3D',
    explanation: '当前未登录访问会进入登录页，需要登录后才能创建。',
    checks: ['账号权限可能变化', '排队与参数属于产品状态', '产品体验不等于论文实验'],
  },
  {
    category: '使用许可',
    claim: 'HY-World 2.0 的 Community License 可以直接按 MIT 许可证理解。',
    correct: '不成立',
    source: 'Tencent HY-WORLD 2.0 Community License',
    sourceUrl: 'https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt',
    explanation: '这是自定义社区许可证，包含地域、百万月活、分发通知和模型用途等限制。',
    checks: ['适用地域排除欧盟、英国和韩国', '特定百万月活主体需另行申请许可', '输出权利不等于模型可自由再分发'],
  },
];

const verdicts: Verdict[] = ['成立', '有条件', '不成立'];

export const HyEvidenceCourt: React.FC<WidgetProps> = () => {
  const [caseIndex, setCaseIndex] = useState(0);
  const [selected, setSelected] = useState<Verdict | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const current = cases[caseIndex];
  const answered = selected !== null;
  const correct = selected === current.correct;

  const judge = (verdict: Verdict) => {
    if (answered) return;
    setSelected(verdict);
    if (verdict === current.correct) setScore((value) => value + 1);
  };

  const nextCase = () => {
    if (caseIndex === cases.length - 1) {
      setCompleted(true);
      return;
    }
    setCaseIndex((value) => value + 1);
    setSelected(null);
  };

  const restart = () => {
    setCaseIndex(0);
    setSelected(null);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    const rank = score === cases.length ? '首席证据审判官' : score >= 6 ? '协议边界猎手' : score >= 4 ? '事实侦察员' : '需要回炉的宣传语克星';
    return (
      <div className="evidence-court">
        <div className="court-summary">
          <span>八案审理完成</span>
          <strong>{score} / {cases.length}</strong>
          <h5>{rank}</h5>
          <p>复盘规则：数字必须带协议，效率必须带任务范围，开放状态必须看当前仓库，使用资格必须读许可证。</p>
          <div className="court-summary-links">
            <a href="https://arxiv.org/abs/2604.14268" target="_blank" rel="noreferrer">论文证据 ↗</a>
            <a href="https://github.com/Tencent-Hunyuan/HY-World-2.0" target="_blank" rel="noreferrer">开源状态 ↗</a>
            <a href="https://github.com/Tencent-Hunyuan/HY-World-2.0/blob/main/License.txt" target="_blank" rel="noreferrer">许可证 ↗</a>
          </div>
        </div>
        <div className="court-actions">
          <button className="tiny" onClick={restart}>重新挑战</button>
        </div>
      </div>
    );
  }

  return (
    <div className="evidence-court">
      <div className="court-status">
        <span>案卷 {caseIndex + 1} / {cases.length}</span>
        <strong>已判对 {score} 案</strong>
      </div>

      <article className="court-case" aria-live="polite">
        <div className="court-category">{current.category}</div>
        <h5>{current.claim}</h5>
        <p>请选择最准确的判决。注意：“有条件”表示核心趋势成立，但原说法省略了不可缺少的限制。</p>
      </article>

      <div className="court-verdicts" role="group" aria-label="选择判决">
        {verdicts.map((verdict) => {
          const isSelected = selected === verdict;
          const isAnswer = answered && current.correct === verdict;
          return (
            <button
              key={verdict}
              className={`${isSelected ? 'selected' : ''} ${isAnswer ? 'answer' : ''}`}
              onClick={() => judge(verdict)}
              disabled={answered}
            >
              {verdict}
            </button>
          );
        })}
      </div>

      {answered ? (
        <div className={`court-evidence ${correct ? 'correct' : 'incorrect'}`}>
          <div className="court-ruling">
            <strong>{correct ? '判决命中' : `应判为“${current.correct}”`}</strong>
            <span>{current.explanation}</span>
          </div>

          {current.metric ? (
            <div className="court-metric">
              <div><small>{current.metric.beforeLabel}</small><b>{current.metric.before}</b></div>
              <span aria-hidden="true">→</span>
              <div><small>{current.metric.afterLabel}</small><b>{current.metric.after}</b></div>
              <em>{current.metric.note}</em>
            </div>
          ) : null}

          <ul>
            {current.checks.map((check) => <li key={check}>{check}</li>)}
          </ul>
          <a href={current.sourceUrl} target="_blank" rel="noreferrer">查看证据：{current.source} ↗</a>
          {current.tableId ? <PaperTable tableId={current.tableId} /> : null}
        </div>
      ) : (
        <div className="feedback">先作出判决，证据才会解锁。</div>
      )}

      <div className="court-actions">
        <button className="tiny" onClick={nextCase} disabled={!answered}>{caseIndex === cases.length - 1 ? '完成挑战' : '下一案'}</button>
        <button className="tiny ghost" onClick={restart}>重新审理</button>
      </div>
    </div>
  );
};
