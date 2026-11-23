import React, { useState } from 'react';

const STAGES = [
  { key: 'trial', name: '① 首版试印', upd: '更新 CLIP', out: '得到一个适配下游的全模型', note: '只在第 1 个任务微调：SGD、lr=1e-6、bs=64、5 epochs。' },
  { key: 'lock', name: '② 锁机', upd: '全部冻结', out: '编码器参数不再变化', note: '之后所有任务都用冻结编码器提特征，避免继续漂移。' },
  { key: 'record', name: '③ 记落点', upd: '只累积统计', out: 'Σxx、Σyy、Σxy 与运行均值', note: '逐批更新式(9)；不保存图像、不保存样本库。' },
  { key: 'solve', name: '④ 解共享网格', upd: '闭式求解', out: '投影矩阵 A、B', note: '白化 → 交叉协方差 → 特征分解 → 按 η 截断（式 10–16）。' },
  { key: 'infer', name: '⑤ 按网格找字模', upd: '不再更新', out: 'argmax 余弦相似度', note: '两模态投影到同一子空间后比相似度（式 19）。' },
];

/** L05 故事序列：一次印程的五个时刻，看清哪一步更新参数。 */
export function FlowStage({ moduleId }: { moduleId: string }) {
  const [i, setI] = useState(0);
  const s = STAGES[i];

  return (
    <div className="rs">
      <div className="rs-field rs-sheet-lines" style={{ left: 0, top: 0, width: 980, height: 622 }}>
        <svg viewBox="0 0 980 622" width="100%" height="100%" role="img" aria-label="一次印程的五个时刻">
          <rect x="24" y="70" width="932" height="420" rx="12" fill="#fdfdf8" stroke="#d7deea" strokeWidth="2" />
          <path d="M60 280H920" stroke="#e6ebf2" strokeWidth="3" />
          {STAGES.map((st, k) => {
            const cx = 120 + k * 185;
            const on = k === i;
            return (
              <g key={st.key} onClick={() => setI(k)} style={{ cursor: 'pointer' }} role="button" tabIndex={0}
                aria-label={st.name} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setI(k); } }}>
                <circle cx={cx} cy={280} r={on ? 62 : 52} fill={on ? '#27446e' : '#fff'} stroke={on ? '#27446e' : '#b9c4d4'} strokeWidth="3" />
                <text x={cx} y={292} textAnchor="middle" fontSize="34" fontWeight="700" fill={on ? '#fff' : '#68778f'}>{k + 1}</text>
                <text x={cx} y={382} textAnchor="middle" fontSize="28" fontWeight={on ? 700 : 400} fill={on ? '#21324a' : '#68778f'}>
                  {st.name.slice(2)}
                </text>
              </g>
            );
          })}
          <text x="490" y="510" textAnchor="middle" fontSize="26" fill="#68778f">
            点一个时刻，右侧看它更新了什么、留下什么
          </text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 1004, top: 0, width: 468, height: 622 }}>
        <p className="rs-h">{s.name}</p>
        <p className="rs-t muted" style={{ marginTop: 10 }}>参数</p>
        <p className={`rs-num ${s.upd.includes('冻结') ? 'rs-green' : 'rs-orange'}`} style={{ fontSize: 40 }}>{s.upd}</p>
        <p className="rs-t muted" style={{ marginTop: 14 }}>产出</p>
        <p className="rs-t">{s.out}</p>
        <div className="rs-feedback" style={{ marginTop: 16 }}>{s.note}</div>
        <p className="rs-t muted" style={{ marginTop: 14 }}>
          关键分界：第 1 步之后冻结的是 CLIP 参数；协方差与 CCA 投影仍逐任务更新，只是不再微调 CLIP。
        </p>
      </div>
    </div>
  );
}
