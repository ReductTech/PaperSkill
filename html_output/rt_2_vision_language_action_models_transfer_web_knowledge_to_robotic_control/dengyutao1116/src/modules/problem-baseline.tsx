import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Arrow, MiniRobot, Chibi, Booklet, Pill } from './kit';

// Two incomplete experts. Clicking either card shows exactly what it drops.
export const ProblemBaseline: React.FC<WidgetProps> = () => {
  const [side, setSide] = useState<'language' | 'action'>('action');
  const language = side === 'language';
  return (
    <div>
      <Svg w={1080} h={240} label="只会说话与只会照抄的两类失败">
        <Card x={18} y={12} w={500} h={204} title="A · 只会读图的实习生" active={language} color={PAL.blue}>
          <rect x={36} y={44} width={104} height={72} rx={8} fill={PAL.soft} stroke={PAL.line} />
          <T x={88} y={74} size={12} anchor="middle" color={PAL.muted}>一张桌面照片</T>
          <rect x={36} y={122} width={104} height={28} rx={6} fill={PAL.paper} stroke={PAL.blue} />
          <T x={88} y={141} size={11} anchor="middle" color={PAL.blue}>“把草莓放进碗”</T>
          <Arrow x1={146} y1={100} x2={196} y2={100} color={PAL.muted} />
          <rect x={202} y={64} width={136} height={72} rx={8} fill={PAL.blueSoft} stroke={PAL.blue} />
          <T x={270} y={92} size={13} anchor="middle" color={PAL.blue} weight={600}>视觉-语言模型</T>
          <T x={270} y={114} size={11} anchor="middle" color={PAL.muted}>只会输出文字</T>
          <Arrow x1={342} y1={100} x2={382} y2={100} color={PAL.muted} />
          <T x={392} y={82} size={12} color={PAL.ink}>“A grey donkey</T>
          <T x={392} y={102} size={12} color={PAL.ink}>walks down the street.”</T>
          <T x={392} y={136} size={12} color={PAL.red} weight={600}>没有 ΔT / ΔR</T>
          <T x={492} y={158} size={20} anchor="middle" color={PAL.red} weight={700}>✕</T>
          <MiniRobot x={120} y={172} s={0.5} arm="idle" />
          <T x={180} y={200} size={11} color={PAL.red}>机械臂不动</T>
        </Card>

        <Card x={538} y={12} w={500} h={204} title="B · 只会抄动作的复读机" active={!language} color={PAL.orange}>
          <rect x={556} y={44} width={136} height={72} rx={8} fill={PAL.orangeSoft} stroke={PAL.orange} />
          <T x={624} y={70} size={11} anchor="middle" color={PAL.orange}>见过的 3 条轨迹</T>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={570} y={78 + i * 12} width={104} height={7} rx={3} fill={PAL.orange} opacity={0.35 + i * 0.15} />
            </g>
          ))}
          <T x={556} y={132} size={10} color={PAL.muted}>3 条轨迹的 token 串：132 114 128…</T>
          <Arrow x1={698} y1={80} x2={744} y2={80} color={PAL.muted} />
          <rect x={750} y={46} width={136} height={70} rx={8} fill={PAL.paper} stroke={PAL.line} />
          <T x={818} y={70} size={12} anchor="middle" color={PAL.ink}>背下的动作片段</T>
          <T x={818} y={92} size={11} anchor="middle" color={PAL.muted}>按相似度硬套</T>
          <Arrow x1={888} y1={80} x2={928} y2={80} color={PAL.muted} />
          <T x={930} y={68} size={11} color={PAL.ink}>新物体：</T>
          <T x={930} y={86} size={11} color={PAL.red}>“7up 罐”</T>
          <T x={930} y={102} size={11} color={PAL.red}>没背过</T>
          <T x={1014} y={132} size={20} color={PAL.red} weight={700}>✕</T>
          <MiniRobot x={640} y={160} s={0.55} arm="reach" />
          <T x={700} y={190} size={11} color={PAL.red}>抓空 / 抓错</T>
        </Card>
        <Pill x={418} y={218} w={244} h={20} label="两种失败：缺“动作接口”或缺“语义”" color={PAL.muted} size={10} />
      </Svg>
      <div className="rt2-controls">
        <button className={`rt2-btn ${language ? 'is-active' : ''}`} onClick={() => setSide('language')}>
          只给语言模型
        </button>
        <button className={`rt2-btn ${!language ? 'is-active' : ''}`} onClick={() => setSide('action')}>
          只给动作演示
        </button>
      </div>
      <p className={`rt2-note ${language ? '' : 'is-warn'}`}>
        {language
          ? '语言模型能看懂“草莓”和“碗”的关系，却没有动作接口：它说不出 7 自由度增量，机械臂只能原地不动。'
          : '行为克隆会背下 132 114 128… 这样的片段，但训练集只有几千条轨迹；指令换个名词、物体换个外观，动作就失配。'}
      </p>
    </div>
  );
};

export default ProblemBaseline;
