import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type StageId = 'adapt' | 'memory' | 'distill';

type Stage = {
  id: StageId;
  order: string;
  title: string;
  short: string;
  introduced: string;
  inherited: string;
  ability: string;
};

const stages: Stage[] = [
  {
    id: 'adapt', order: 'A', title: '领域适配', short: '先建立关键帧潜空间与相机控制',
    introduced: 'Keyframe-VAE、Plucker rays 与相机条件适配器',
    inherited: '预训练视频扩散骨干的开放域生成先验',
    ability: '相机能够沿指定轨迹生成清晰关键帧',
  },
  {
    id: 'memory', order: 'B', title: '记忆中训', short: '再让多条轨迹共享同一个世界',
    introduced: 'GGM 全局几何记忆与 SSM++ 局部检索记忆',
    inherited: '关键帧生成与相机控制',
    ability: '回访同一区域时，结构与纹理不再各自漂移',
  },
  {
    id: 'distill', order: 'C', title: 'DMD 后蒸馏', short: '最后把成熟教师压缩成四步学生',
    introduced: '冻结教师、少步学生与分布匹配目标',
    inherited: '相机控制、GGM 与 SSM++ 的完整能力',
    ability: 'WorldStereo 2.0 的扩散采样被压缩为四步',
  },
];

const correctOrder: StageId[] = ['adapt', 'memory', 'distill'];

function diagnose(sequence: StageId[]) {
  if (sequence.length === 0) return { kind: 'idle', title: '等待编排', text: '依次点击三张阶段卡，构造一条训练课程。每个选择都会立即改变能力继承图。' };
  if (sequence[0] === 'distill') return { kind: 'bad', title: '教师尚未成熟', text: '先蒸馏只会压缩一个还不会稳定控制相机、也没有跨轨迹记忆的教师，缺陷会一起被压进四步学生。' };
  if (sequence[0] === 'memory') return { kind: 'bad', title: '参考关系不稳定', text: '记忆模块需要稳定的目标视角与关键帧表示。相机控制尚未建立时，检索帧和目标帧难以形成可靠对应。' };
  if (sequence.length >= 2 && sequence[0] === 'adapt' && sequence[1] === 'distill') return { kind: 'warn', title: '压缩得太早', text: '学生可以继承相机控制，但尚未学到 GGM 与 SSM++，四步生成仍会在多轨迹回访时漂移。' };
  const prefixCorrect = sequence.every((id, index) => id === correctOrder[index]);
  if (prefixCorrect && sequence.length < 3) return { kind: 'good', title: '前置关系正确', text: sequence.length === 1 ? '相机控制已经就位。下一段应加入跨轨迹记忆。' : '控制与记忆已经就位。现在可以压缩成熟教师的采样步数。' };
  if (prefixCorrect) return { kind: 'success', title: '课程闭环完成', text: '控制 -> 记忆 -> 蒸馏：每一段都继承前一段能力，最终得到带完整记忆分支的四步 WorldStereo 2.0。' };
  return { kind: 'bad', title: '能力继承断裂', text: '当前顺序破坏了论文的前置关系。撤回最后一步，先建立控制，再引入记忆，最后做蒸馏。' };
}

export const HyTrainingStages: React.FC<WidgetProps> = () => {
  const [sequence, setSequence] = useState<StageId[]>([]);
  const diagnosis = useMemo(() => diagnose(sequence), [sequence]);
  const remaining = stages.filter((stage) => !sequence.includes(stage.id));
  const addStage = (id: StageId) => setSequence((current) => current.includes(id) ? current : [...current, id]);
  const removeLast = () => setSequence((current) => current.slice(0, -1));
  const completed = sequence.length === stages.length;

  const abilities = {
    control: sequence[0] === 'adapt',
    memory: sequence[0] === 'adapt' && sequence[1] === 'memory',
    speed: sequence.join(',') === correctOrder.join(','),
  };

  return (
    <div className="training-builder">
      <div className="training-builder-head">
        <div><span>训练课程编排器</span><strong>让能力按前置关系逐段继承</strong></div>
        <div><b>{sequence.length}/3</b><small>已放入阶段</small></div>
      </div>

      <div className="training-stage-pool" aria-label="可选训练阶段">
        {stages.map((stage) => {
          const used = sequence.includes(stage.id);
          return <button key={stage.id} type="button" disabled={used} className={used ? 'used' : ''} onClick={() => addStage(stage.id)}>
            <i>{stage.order}</i><span><strong>{stage.title}</strong><small>{stage.short}</small></span><b>{used ? '已编排' : '加入课程'}</b>
          </button>;
        })}
      </div>

      <section className="training-sequence" aria-live="polite">
        <header><span>当前课程</span><div><button type="button" onClick={removeLast} disabled={sequence.length === 0}>撤回一步</button><button type="button" onClick={() => setSequence([])} disabled={sequence.length === 0}>重新编排</button></div></header>
        <div className="training-sequence-track">
          {[0, 1, 2].map((slot) => {
            const stage = stages.find((item) => item.id === sequence[slot]);
            return <React.Fragment key={slot}>
              <article className={stage ? 'filled' : ''}>
                <span>阶段 {slot + 1}</span>
                <strong>{stage?.title ?? '等待选择'}</strong>
                <small>{stage?.ability ?? '从上方加入一个尚未使用的阶段'}</small>
              </article>
              {slot < 2 ? <i aria-hidden="true">-&gt;</i> : null}
            </React.Fragment>;
          })}
        </div>
      </section>

      <div className="training-ability-rail">
        <div className={abilities.control ? 'on' : ''}><i /><span>相机控制</span><small>{abilities.control ? '可继承' : '未建立'}</small></div>
        <div className={abilities.memory ? 'on' : ''}><i /><span>跨轨迹记忆</span><small>{abilities.memory ? '可继承' : '等待控制'}</small></div>
        <div className={abilities.speed ? 'on' : ''}><i /><span>四步采样</span><small>{abilities.speed ? '完整学生' : '等待成熟教师'}</small></div>
      </div>

      <div className={`training-diagnosis ${diagnosis.kind}`}>
        <strong>{diagnosis.title}</strong><p>{diagnosis.text}</p>
      </div>

      {completed ? (
        <div className="training-stage-inspector">
          {sequence.map((id, index) => {
            const stage = stages.find((item) => item.id === id)!;
            return <article key={id}><span>0{index + 1} · {stage.title}</span><p><b>本段引入：</b>{stage.introduced}</p><p><b>继承：</b>{stage.inherited}</p></article>;
          })}
        </div>
      ) : (
        <p className="training-builder-hint">剩余可选：{remaining.map((item) => item.title).join('、') || '无'}。这里没有分数，错误顺序用于暴露能力依赖。</p>
      )}
    </div>
  );
};
