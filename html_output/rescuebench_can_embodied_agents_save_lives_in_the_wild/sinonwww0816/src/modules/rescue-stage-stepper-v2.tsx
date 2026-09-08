import { useState } from 'react';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

const stages = [
  {
    code: 'S1',
    name: '探索',
    objective: '根据多模态线索，在未知环境中找到伤员',
    info: '图像线索 + 文字线索 + 第一视角观测',
    ability: '自主探索',
    status: ['伤员：未知', '救护车：已知', '路线：未提供'],
  },
  {
    code: 'S2',
    name: '定位与救援',
    objective: '发现伤员后，接近到可触发救援的位置',
    info: '伤员位置已发现',
    ability: '精确接近',
    status: ['伤员：已发现', '目标：接近伤员', '救援：待触发'],
  },
  {
    code: 'S3',
    name: '返回',
    objective: '救援完成后，返回救护车区域',
    info: 'S1 探索过程中积累的空间信息',
    ability: '空间记忆',
    status: ['救援：已完成', '新路线指令：无', '空间记忆：需要调用'],
  },
  {
    code: 'S4',
    name: '定位与交接',
    objective: '精确找到救护车或担架并完成交接',
    info: '已返回救护车区域',
    ability: '精确定位与接近',
    status: ['救护车区域：已到达', '交接位置：待定位', '完整任务：待完成'],
  },
];

export function RescueStageStepperV2(_: WidgetProps) {
  const [index, setIndex] = useState(0);
  const stage = stages[index];
  const figureSrc = assetPath('/images/rescuebench-figure-2.png');

  return (
    <div className="stage-stepper-v2">
      <div className="stage-tabs" role="tablist" aria-label="四阶段完整救援">
        {stages.map((item, stageIndex) => (
          <button
            type="button"
            role="tab"
            aria-selected={stageIndex === index}
            className={stageIndex === index ? 'selected' : ''}
            key={item.code}
            onClick={() => setIndex(stageIndex)}
          >
            <span>{item.code}</span>
            {item.name}
          </button>
        ))}
      </div>

      <div className={`stage-detail ${stage.code === 'S3' ? 'memory-stage' : ''}`} aria-live="polite">
        <div className="stage-detail-title">
          <span>当前阶段</span>
          <strong>{stage.code}｜{stage.name}</strong>
        </div>
        <dl>
          <div><dt>当前目标</dt><dd>{stage.objective}</dd></div>
          <div><dt>当前信息</dt><dd>{stage.info}</dd></div>
          <div><dt>依赖能力</dt><dd>{stage.ability}</dd></div>
          <div><dt>当前状态</dt><dd>{stage.status.map((item) => <span key={item}>{item}</span>)}</dd></div>
        </dl>
        {stage.code === 'S3' ? (
          <div className="memory-alert"><strong>新路线指令：无</strong><span>需要调用探索阶段形成的空间记忆</span></div>
        ) : null}
      </div>

      <div className="stepper-actions">
        <button type="button" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>上一步</button>
        <span>当前阶段 {index + 1} / 4</span>
        <button type="button" disabled={index === 3} onClick={() => setIndex((value) => Math.min(3, value + 1))}>下一阶段</button>
      </div>

      <p className="pipeline-judgment">
        交互条件：除 ROCKET-2 使用原生交互动作外，多数方法在进入目标或交接区域约 1.5 m 后，由环境辅助触发救援或交接。
      </p>

      <figure className="figure2-evidence">
        <a href={figureSrc} target="_blank" rel="noreferrer">
          <img src={figureSrc} alt="RescueBench Figure 2：多模态线索与完整四阶段救援过程" loading="lazy" />
          <span>查看原图 ↗</span>
        </a>
        <figcaption>来源：论文 Figure 2</figcaption>
      </figure>
    </div>
  );
}
