import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ObjId = 1 | 2;

// 玩具消歧轮次：固定左右线索，不跑真实模型；目标是让学习者体会编号如何锁定同款物体。
const ROUNDS: { target: ObjId; clue: string }[] = [
  { target: 1, clue: '指令：抓住左侧那块方块。' },
  { target: 2, clue: '指令：抓住右侧那块方块。' },
];

/**
 * §5 实体引用：开关控制 obj_j 编号是否出现；点击方块在托盘与计划面板间联动，
 * 并带一轮"按指令选块"的消歧作答闭环。关闭时同名同色物体无法区分（红）；
 * 打开后计划用 obj_j 锁定目标，答对转绿。
 */
export const EntityReferral: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [referralOn, setReferralOn] = useState(false);
  const [selectedObj, setSelectedObj] = useState<ObjId>(1);
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<ObjId | null>(null);

  const current = ROUNDS[round];
  const answered = answer !== null;
  const correct = answered && answer === current.target;

  const pick = (id: ObjId) => {
    setSelectedObj(id);
    if (!referralOn) return;
    setAnswer(id);
  };
  const nextRound = () => {
    setRound((r) => (r + 1) % ROUNDS.length);
    setAnswer(null);
  };
  const reset = () => {
    setReferralOn(false);
    setAnswer(null);
    setRound(0);
    setSelectedObj(1);
  };

  const feedback = !referralOn
    ? { text: '没有编号，计划无法把两块同款方块分开；先打开实体引用再作答。', cls: 'bad' }
    : !answered
      ? { text: '计划用 obj_j 引用；根据指令在托盘里选一块方块。', cls: '' }
      : correct
        ? { text: '编号对上了：低层策略也按同一个 obj_j token 操作对应物体。', cls: 'good' }
        : { text: '认错了同款物体——只靠颜色和位置说不清，编号引用才能锁定正确目标。', cls: 'bad' };

  return (
    <div>
      <div className="dual-panel">
        <div className="panel-box">
          <h5>同款方块托盘</h5>
          <div className="obj-tray">
            {([1, 2] as const).map((id) => {
              const isSel = selectedObj === id;
              const isHit = referralOn && correct && id === current.target;
              return (
                <button
                  key={id}
                  type="button"
                  className={`obj-block ${isSel ? 'sel' : ''} ${isHit ? 'hit' : ''}`}
                  aria-pressed={isSel}
                  onClick={() => pick(id)}
                >
                  {referralOn ? `obj_${id}` : `块${id}`}
                </button>
              );
            })}
          </div>
          <div className="panel-body">两块方块颜色、外形一致；不编号时计划只能写“那块方块”，指向模糊。</div>
        </div>
        <div className="panel-box">
          <h5>计划 / token 面板</h5>
          <div className="panel-body">{current.clue}</div>
          <div className="token-row">
            {referralOn ? (
              <>
                <span className="token-chip">Object {selectedObj} is &lt;obj {selectedObj}&gt;</span>
                <span className="token-chip pred">grasp obj_{selectedObj}</span>
              </>
            ) : (
              <span className="token-chip">that block（指哪一块不明确）</span>
            )}
          </div>
          <div className="panel-body" style={{ marginTop: 10 }}>
            {answered
              ? correct
                ? '作答正确：编号与物体身份一一对应。'
                : '作答有误：再对照指令线索选一次。'
              : '低层策略按同一 obj_j token 操作；前提是槽位 / 掩码已提供物体身份。'}
          </div>
        </div>
      </div>

      <div className="chip-row" role="group" aria-label="实体引用控制">
        <button
          type="button"
          className={`chip ${referralOn ? 'selected' : ''}`}
          aria-pressed={referralOn}
          onClick={() => setReferralOn((v) => !v)}
        >
          {referralOn ? '实体引用：开' : '实体引用：关'}
        </button>
        <button type="button" className="chip" onClick={nextRound} disabled={!referralOn}>
          下一轮指令
        </button>
        <button type="button" className="chip" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default EntityReferral;
