import { useState } from 'react';

type Cmd = { id: string; name: string; sub: string; says: string; verdict: string; tone: string };

const CMDS: Cmd[] = [
  {
    id: 'full',
    name: '完整 π0.5',
    sub: '高层 + 低层同一个模型',
    says: '先把杯子放进水槽',
    verdict: '论文里最好的一档，甚至超过了用人类专家当高层的「神谕」基线。',
    tone: '#228d5c',
  },
  {
    id: 'implicit',
    name: 'implicit HL',
    sub: '推理时不做高层，但训练含子任务数据',
    says: '（不报步骤，直接从总要求出动作）',
    verdict: '第二好。说明显式高层确实有用，但相当一部分收益来自「训练里就有子任务数据」这件事本身。',
    tone: '#27446e',
  },
  {
    id: 'novi',
    name: '去掉口头指令 VI',
    sub: '专家语言示范不参与后训练',
    says: '先把……那个……放回去？',
    verdict: '显著变差。VI 只占高层移动机械臂样本约 11%，却对高层策略很关键。',
    tone: '#c43f52',
  },
  {
    id: 'nowd',
    name: '去掉网络数据 WD',
    sub: '没有图像描述 / 视觉问答 / 定位',
    says: '把那个东西收进那边',
    verdict: '显著变差。网络数据的收益主要落在高层：语义知识不够，报步骤就含糊。',
    tone: '#c43f52',
  },
  {
    id: 'nohl',
    name: '完全没有 HL',
    sub: '训练与推理都没有子任务',
    says: '把这桌收拾干净（照念总要求）',
    verdict: '显著变差。连训练里的子任务标注都没有，长程任务最容易崩。',
    tone: '#c43f52',
  },
  {
    id: 'gpt4',
    name: 'GPT-4 零样本',
    sub: '用通用大模型当高层',
    says: '也许可以先整理一下台面？',
    verdict: '七种里最差 —— 不在机器人数据上适配的高层，跟不上这个场景的时序。',
    tone: '#c43f52',
  },
  {
    id: 'human',
    name: '人类神谕',
    sub: '专家实时给出高层',
    says: '先把抽屉里的勺子拿出来',
    verdict: '很强的上界，但仍然不如完整 π0.5 —— 人在这个粒度上未必给出最优时序。',
    tone: '#f07e47',
  },
];

export function WhoCommands(_: { chapterId: string; moduleId: string }) {
  const [sel, setSel] = useState('full');
  const c = CMDS.find((x) => x.id === sel)!;

  return (
    <div className="pi-split">
      <div className="pi-left">
        <div className="pi-cmd-grid">
          {CMDS.map((x) => (
            <button
              key={x.id}
              className={`pi-card pi-card-sm${x.id === sel ? ' is-sel' : ''}`}
              onClick={() => setSel(x.id)}
              aria-pressed={x.id === sel}
            >
              <span className="pi-card-title">{x.name}</span>
              <span className="pi-card-short">{x.sub}</span>
            </button>
          ))}
        </div>
        <div className="pi-bubble">
          <span className="pi-bubble-who">{c.name}</span>
          <span className="pi-bubble-text">{c.says}</span>
          <span className="pi-bubble-note">气泡为示意</span>
        </div>
        <p className="pi-feedback" style={{ color: c.tone }}>{c.verdict}</p>
      </div>
      <div className="pi-right">
        <img className="pi-figure" src="./images/fig13.png" alt="论文 Fig.13：不同高层推理方案的对比" />
        <p className="pi-caption">
          七种高层方案的模拟住宅任务得分，越高越好（p.11 Fig.13）。所有方案共用同一套低层推理，只替换高层。
        </p>
      </div>
    </div>
  );
}
