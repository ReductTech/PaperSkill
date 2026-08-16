import React, { useState } from 'react';
import { PaperTable } from './hy-paper-evidence';
import type { PaperTableId } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

type EvidenceLevel = 'paper' | 'official' | 'thirdparty' | 'unreported';

type BoundaryCard = {
  id: string;
  title: string;
  claim: string;
  verdict: string;
  level: EvidenceLevel;
  source: string;
  explanation: string;
  conditions: string[];
  tableId?: PaperTableId;
};

const levelMeta: Record<EvidenceLevel, { label: string; desc: string }> = {
  paper: { label: '论文报告', desc: '公式、表格、消融或正文直接支持' },
  official: { label: '官方展示', desc: '项目页、GitHub、产品页或官方 GIF' },
  thirdparty: { label: '第三方解读', desc: '帮助建立直觉，但不是论文证据' },
  unreported: { label: '未报告', desc: '现有资料不能支持该结论' },
};

const cards: BoundaryCard[] = [
  {
    id: 'metric', title: '协议内性能', level: 'paper',
    claim: 'HY-Pano 2.0 在表 4 的 I2P CLIP-I 上高于 CubeDiff 与 GenEx。',
    verdict: '可陈述，但只能限定在表 4 的 I2P 子协议。',
    source: '论文 Table 4',
    explanation: '0.844 高于 0.828 与 0.831；它衡量图像到全景的兼容指标，不是完整世界系统总排名。',
    conditions: ['同一 I2P 子协议', 'CLIP-I 越高越好', '不能外推到三维几何与运行时'],
    tableId: 'table-4',
  },
  {
    id: 'runtime', title: '局部效率', level: 'paper',
    claim: 'WorldMirror 2.0 在 H20 四卡、128 视图设置下报告 5.60 秒。',
    verdict: '可陈述，但不能改写为完整世界实时生成。',
    source: '论文 Table 14 与系统耗时汇总',
    explanation: '5.60 秒对应重建子步骤；论文完整生成链路仍约 712 秒，二者任务范围不同。',
    conditions: ['H20 四卡', 'SP + BF16 + FSDP', '128 视图、518x378'],
    tableId: 'table-14',
  },
  {
    id: 'marble', title: 'Marble 比较', level: 'unreported',
    claim: 'HY-World 2.0 已在统一定量协议下超过 Marble。',
    verdict: '不能陈述。',
    source: '论文只提供定性案例比较',
    explanation: '可以讨论同输入案例的纹理、忠实度与几何观感，但没有可合并的统一定量表格。',
    conditions: ['不虚构分数', '不生成胜率', '第三方体验只标个人判断'],
  },
  {
    id: 'interaction', title: '运行时交互', level: 'official',
    claim: '生成后的资产可接入 IBL、碰撞代理和角色漫游。',
    verdict: '官方资料支持能力存在，但没有统一帧率或物理准确率基准。',
    source: '官方项目页、GitHub 与演示 GIF',
    explanation: 'WorldLens 处理生成完成后的资产运行时；这不代表世界生成本身实时，也不证明碰撞完全物理正确。',
    conditions: ['资产已生成完成', 'GIF 是演示而非指标', '运行时和生成阶段分开'],
  },
  {
    id: 'zhihu', title: '工程直觉', level: 'thirdparty',
    claim: '视频扩散负责补未观测区域，前馈 3DGS 负责把多视图拉回显式几何。',
    verdict: '可作为教学概括，关键机制仍需回到论文核对。',
    source: '知乎文章《生成辅助重建的完整开源》',
    explanation: '该表述很好地解释两类技术为何互补，但作者的 Marble 观感和工程评价不能升级为论文结论。',
    conditions: ['术语回到论文', '体验判断明确署名', '数字不用第三方文章替代'],
  },
  {
    id: 'license', title: '开源与许可', level: 'official',
    claim: '仓库公开不等于可以按 MIT 许可证任意部署和再分发。',
    verdict: '应阅读 Tencent HY-WORLD 2.0 Community License。',
    source: '官方 GitHub 与 License.txt',
    explanation: '当前许可证包含地域、百万月活、分发通知与用途限制；教程只作风险提示，不构成法律意见。',
    conditions: ['核对当前版本', '部署前阅读全文', '输出权利不等于模型再分发权'],
  },
];

export const HyEvidenceCourt: React.FC<WidgetProps> = () => {
  const [level, setLevel] = useState<EvidenceLevel>('paper');
  const visible = cards.filter((card) => card.level === level);
  const [selectedId, setSelectedId] = useState(cards[0].id);
  const selected = cards.find((card) => card.id === selectedId && card.level === level) ?? visible[0];

  const chooseLevel = (next: EvidenceLevel) => {
    setLevel(next);
    const first = cards.find((card) => card.level === next);
    if (first) setSelectedId(first.id);
  };

  return (
    <div className="evidence-dashboard">
      <div className="evidence-level-tabs" role="tablist" aria-label="选择证据层级">
        {(Object.keys(levelMeta) as EvidenceLevel[]).map((key) => {
          const count = cards.filter((card) => card.level === key).length;
          return <button key={key} type="button" role="tab" aria-selected={level === key} className={level === key ? 'selected' : ''} onClick={() => chooseLevel(key)}>
            <strong>{levelMeta[key].label}</strong><span>{levelMeta[key].desc}</span><b>{count}</b>
          </button>;
        })}
      </div>

      <div className="evidence-dashboard-body">
        <nav aria-label="当前证据层级的结论切片">
          {visible.map((card) => <button key={card.id} type="button" className={selected.id === card.id ? 'selected' : ''} onClick={() => setSelectedId(card.id)}>
            <span>{card.title}</span><strong>{card.claim}</strong>
          </button>)}
        </nav>

        <section aria-live="polite">
          <header><span>{levelMeta[selected.level].label}</span><h5>{selected.title}</h5><b>{selected.source}</b></header>
          <blockquote>{selected.claim}</blockquote>
          <div className="evidence-verdict"><strong>边界结论</strong><p>{selected.verdict}</p></div>
          <p>{selected.explanation}</p>
          <div className="evidence-condition-list">{selected.conditions.map((item) => <span key={item}>{item}</span>)}</div>
        </section>
      </div>

      {selected.tableId ? <PaperTable tableId={selected.tableId} /> : null}
      <p className="evidence-dashboard-hint">灰色提示：这里不再连续答题。先选择证据层级，再检查一条结论能说到哪里、必须携带哪些条件。</p>
    </div>
  );
};
