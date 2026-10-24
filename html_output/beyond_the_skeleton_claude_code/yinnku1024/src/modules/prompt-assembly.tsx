import React, { useState } from 'react';
import { Dept, HW } from './kit';

const PARTS = [
  { id: 'safety', name: '安全指令', body: '网络攻击场景的 allow / deny 规则。', quote: '由 Safeguards 团队维护。', why: '把最不能出错的判断，交给专门的团队维护。' },
  { id: 'rules', name: '系统规则', body: '工具偏好、标签过滤、prompt injection 防御。', quote: 'Use Read instead of cat, Edit instead of sed.', why: '不是限制能力，而是把最稳的路径变成默认路径。' },
  { id: 'discipline', name: '任务纪律', body: '不加需求之外的功能，不做过早抽象。', quote: 'Three similar lines of code is better than a premature abstraction.', why: '对抗模型“顺手优化”的天性。' },
  { id: 'risk', name: '风险评估', body: '可逆与不可逆操作的决策框架。', quote: '先问这一步能不能撤销。', why: '把“该不该问人”变成一条可执行的判断。' },
  { id: 'tools', name: '工具偏好', body: '按当前可用工具动态注入会话指导。', quote: 'If you can say it in one sentence, don’t use three.', why: '提示词也怕啰嗦：话越少，指令越容易被遵守。' },
  { id: 'brevity', name: '简洁原则', body: '先给答案或动作，不要复述用户的话。', quote: 'Lead with the answer or action, not the reasoning.', why: '用户要的是结果，不是过程直播。' },
  { id: 'session', name: '会话指导', body: '根据当前会话状态补充上下文。', quote: 'Do not restate what the user said — just do it.', why: '把“理解”省下来的 token 花在“执行”上。' },
];

/* 处方科：系统提示词不是一个字符串，是十几个函数拼出来的处方。 */
export function PromptAssembly() {
  const [active, setActive] = useState('discipline');
  const part = PARTS.find(item => item.id === active)!;

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.08fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 8 }}>
        <div className="hw-spread">
          <p className="hw-h">处方：七个函数</p>
          <Dept>处方科</Dept>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PARTS.map(item => (
            <button key={item.id} type="button" className="hw-btn"
              aria-pressed={active === item.id} onClick={() => setActive(item.id)}
              style={{ padding: '8px 12px', justifyContent: 'flex-start' }}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="hw-slot" style={{ marginTop: 'auto' }}>
          <p className="hw-t hw-t--tight">
            原文还有一条内部规则：<span className="hw-code">USER_TYPE === &apos;ant&apos;</span> 时默认不写注释，
            而且报告完成前必须亲自跑一遍。
          </p>
        </div>
      </div>

      <div className="hw-col">
        <div className="hw-card" style={{ borderTop: `4px solid ${HW.blue}`, flex: '1 1 auto' }}>
          <p className="hw-t hw-muted">{part.name}</p>
          <p className="hw-h" style={{ margin: '6px 0', lineHeight: 1.3 }}>“{part.quote}”</p>
          <p className="hw-t">{part.body}</p>
          <hr style={{ height: 1, background: HW.line, border: 0, margin: '10px 0' }} />
          <p className="hw-t hw-t--tight hw-muted">{part.why}</p>
        </div>
        <div className="hw-band" data-tone="paper">
          <span>这些提示词不是在教模型<strong>怎么写代码</strong>，是在教它<strong>克制</strong>。</span>
        </div>
      </div>
    </div>
  );
}
