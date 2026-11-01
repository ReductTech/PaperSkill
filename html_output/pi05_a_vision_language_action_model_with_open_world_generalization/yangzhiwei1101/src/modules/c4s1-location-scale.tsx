import { useState } from 'react';

const LOCS = [3, 12, 22, 53, 82, 104];

const TEXT: Record<number, string> = {
  3: '论文图中这一档的平均完成度最低。',
  12: '比三家时明显抬升，但仍低于几十家以上的规模。',
  22: '继续上升，和论文的描述一致：环境越多总体越好。',
  53: '继续往高位走。',
  82: '总体维持在高位；论文图中该点略低于相邻规模。',
  104: '已经接近那个「直接用测试住宅数据训练」的对照模型。',
};

export function LocationScale(_: { chapterId: string; moduleId: string }) {
  const [loc, setLoc] = useState(3);
  const idx = LOCS.indexOf(loc);

  return (
    <div className="pi-split">
      <div className="pi-left">
        <img className="pi-figure" src="./images/fig8.png" alt="论文 Fig.8：不同训练环境数下的平均任务进度" />
        <p className="pi-caption">
          绿虚线 = 见过测试住宅的对照；深绿柱 = 见过测试住宅；浅绿柱 = 见过但没预训练；浅黄柱 = 104 环境但没预训练（p.9 Fig.8）
        </p>
      </div>
      <div className="pi-right">
        <p className="pi-body">
          在移动机械臂数据里，把训练环境数从 <b>3</b> 加到 <b>104</b>，同一套流程下的表现怎么走？
        </p>
        <div className="pi-ladder">
          {LOCS.map((v, i) => {
            const on = v === loc;
            return (
              <button key={v} className={`pi-step${on ? ' is-sel' : ''}`} onClick={() => setLoc(v)} aria-pressed={on}>
                <span className="pi-step-dot" />
                <span className="pi-step-val">{v} 个环境</span>
                <span className="pi-step-kitchens">
                  {Array.from({ length: 6 }, (_, k) => (
                    <span key={k} className={`pi-kitchen${k <= i ? ' is-on' : ''}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <p className="pi-feedback" style={{ color: idx >= 4 ? '#228d5c' : '#27446e' }}>{TEXT[loc]}</p>
        <p className="pi-note">
          协议：四个模拟住宅任务（水槽碗盘 / 抽屉收纳 / 衣物入篮 / 铺床），每策略每任务 10 次试验，
          指标为评分表得分百分比，越高越好。这些实验先在机器人动作数据上预训练、再用不同环境数的数据后训练 40k 步以对齐样本量。
        </p>
      </div>
    </div>
  );
}
