import React from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Arrow, Chibi } from './kit';

type IconName =
  | 'question' | 'book' | 'tag' | 'bowl' | 'database' | 'cloud' | 'clipboard'
  | 'map' | 'bulb' | 'shield' | 'check' | 'cross' | 'robot' | 'clock'
  | 'layers' | 'grip' | 'stop' | 'flag' | 'plus' | 'speech' | 'play' | 'compass';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  question: <><circle cx="12" cy="12" r="8" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" /><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none" /></>,
  book: <><path d="M5 4.5h9a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z" /><path d="M16 6.5h2.5v13H16" /><path d="M8.5 8h5M8.5 11h5" /></>,
  tag: <><path d="M4 5h6l8 8-6 6-8-8z" /><circle cx="8.5" cy="9.5" r="1.2" /></>,
  bowl: <><path d="M4 11h16a8 8 0 0 1-16 0z" /><path d="M8 8c.8-.8 1.6-.8 2.4 0M12 7c.8-.8 1.6-.8 2.4 0" /></>,
  database: <><ellipse cx="12" cy="6" rx="7" ry="2.5" /><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" /><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
  cloud: <path d="M8 17h9a4 4 0 0 0 .7-7.9 5.5 5.5 0 0 0-10.5 1.4A3.2 3.2 0 0 0 8 17z" />,
  clipboard: <><rect x="5" y="5" width="14" height="15" rx="2" /><path d="M9 5a3 3 0 0 1 6 0" /><path d="M8.5 10h7M8.5 14h5" /></>,
  map: <><path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z" /><path d="M9 4v14M15 6v14" /></>,
  bulb: <><path d="M9 18h6M10 21h4" /><path d="M8 14a5 5 0 1 1 8 0c-.8 1-1 1.7-1 3H9c0-1.3-.2-2-1-3z" /></>,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  check: <path d="M5 12.5l4 4L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6L6 18" />,
  robot: <><rect x="6" y="8" width="12" height="10" rx="2" /><path d="M12 5v3M9 12h.01M15 12h.01M4 12h2M18 12h2" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  layers: <><path d="M12 4l8 4-8 4-8 4z" /><path d="M5 12l7 3.5 7-3.5M5 16l7 3.5 7-3.5" /></>,
  grip: <><path d="M7 12V7a2 2 0 0 1 4 0v5" /><path d="M11 12V6a2 2 0 0 1 4 0v6" /><path d="M15 12V8a2 2 0 0 1 4 0v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5" /></>,
  stop: <><circle cx="12" cy="12" r="8" /><path d="M9 12h6" /></>,
  flag: <><path d="M6 21V4" /><path d="M6 5h11l-2 4 2 4H6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  speech: <><path d="M4 5h16v11H9l-4 4v-4H4z" /><path d="M8 9h8M8 12h5" /></>,
  play: <path d="M8 5l11 7-11 7z" />,
  compass: <><circle cx="12" cy="12" r="8" /><path d="M15 9l-2 5-4 1 2-5z" /></>,
};

function FlowIcon({ name, x, y, size = 15, color }: { name: IconName; x: number; y: number; size?: number; color: string }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

function SoftNode({
  x, y, w, h, color, icon, title, sub, fill = PAL.paper, textSize = 11,
}: {
  x: number; y: number; w: number; h: number; color: string; icon?: IconName; title: string; sub?: string; fill?: string; textSize?: number;
}) {
  const iconSize = Math.min(16, h - 14);
  const textX = icon ? x + 31 : x + 10;
  return (
    <g filter="url(#rt2-card-shadow)">
      <rect x={x} y={y} width={w} height={h} rx={12} fill={fill} stroke={color} strokeWidth={1.35} strokeLinejoin="round" />
      <rect x={x + 8} y={y + 3.5} width={w - 16} height={1.8} rx={0.9} fill="#ffffff" opacity={0.62} />
      {icon ? <FlowIcon name={icon} x={x + 9} y={y + (h - iconSize) / 2 - 1} size={iconSize} color={color} /> : null}
      <T x={textX} y={sub ? y + h / 2 - 2 : y + h / 2 + 4} size={textSize} color={PAL.ink} weight={600}>{title}</T>
      {sub ? <T x={textX} y={y + h / 2 + 13} size={9} color={PAL.muted}>{sub}</T> : null}
    </g>
  );
}

function SoftPill({
  x, y, w, h = 22, color, fill, icon, title, size = 10,
}: {
  x: number; y: number; w: number; h?: number; color: string; fill: string; icon?: IconName; title: string; size?: number;
}) {
  const iconSize = h - 10;
  const textX = icon ? x + 25 : x + 10;
  return (
    <g filter="url(#rt2-card-shadow)">
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      <rect x={x + 7} y={y + 2.2} width={w - 14} height={1.6} rx={0.8} fill="#ffffff" opacity={0.55} />
      {icon ? <FlowIcon name={icon} x={x + 8} y={y + (h - iconSize) / 2} size={iconSize} color={color} /> : null}
      <T x={textX} y={y + h / 2 + size * 0.36} size={size} color={color} weight={600}>{title}</T>
    </g>
  );
}

function CurvedArrow({ d, endX, endY, angle, color }: { d: string; endX: number; endY: number; angle: number; color: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 0 L-7 -3.4 L-5 0 L-7 3.4 Z" transform={`translate(${endX} ${endY}) rotate(${angle})`} fill={color} />
    </g>
  );
}

function RoundMark({ x, y, color, icon }: { x: number; y: number; color: string; icon: IconName }) {
  return (
    <g filter="url(#rt2-card-shadow)">
      <circle cx={x} cy={y} r={13} fill={PAL.paper} stroke={color} strokeWidth={1.5} />
      <FlowIcon name={icon} x={x - 8} y={y - 8} size={16} color={color} />
    </g>
  );
}

// Ten distinct chapter characters interpret the same RT-2 vocabulary in
// different situations. All flow nodes use one soft, grid-aligned visual kit.
export const InterpreterStrip: React.FC<WidgetProps> = ({ chapterId }) => {
  const body = () => {
    switch (chapterId) {
      case 'chap-1':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="sad" arm="point" chapter={1} />
            <SoftNode x={142} y={42} w={108} h={52} color={PAL.red} icon="question" title="陌生考题" sub="换个说法" />
            <SoftNode x={294} y={36} w={94} h={30} color={PAL.blue} icon="book" title="只背词义" />
            <SoftNode x={294} y={78} w={94} h={30} color={PAL.orange} icon="book" title="只背句型" />
            <SoftNode x={426} y={48} w={92} h={46} color={PAL.red} icon="cross" title="就卡住" sub="无法闭环" />
            <Arrow x1={250} y1={58} x2={292} y2={53} color={PAL.muted} width={1.5} />
            <Arrow x1={388} y1={51} x2={424} y2={60} color={PAL.muted} width={1.5} />
            <Arrow x1={388} y1={93} x2={424} y2={82} color={PAL.muted} width={1.5} />
          </>
        );
      case 'chap-2':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="think" arm="point" chapter={2} />
            <SoftNode x={140} y={36} w={88} h={34} color={PAL.blue} icon="book" title="网页图文" />
            <SoftNode x={140} y={84} w={88} h={34} color={PAL.orange} icon="tag" title="机器人动作" />
            <SoftNode x={260} y={54} w={100} h={50} color={PAL.blue} icon="layers" title="同一个词表" sub="一本合订册" />
            <Arrow x1={228} y1={53} x2={258} y2={66} color={PAL.muted} width={1.5} />
            <Arrow x1={228} y1={101} x2={258} y2={92} color={PAL.muted} width={1.5} />
            <Arrow x1={360} y1={79} x2={388} y2={79} color={PAL.blue} width={1.5} />
            <SoftPill x={390} y={30} w={128} color={PAL.purple} fill={PAL.purpleSoft} icon="tag" title="132 114 128" />
            <SoftPill x={390} y={58} w={128} color={PAL.purple} fill={PAL.purpleSoft} icon="tag" title="5 25 156" />
            <SoftPill x={390} y={86} w={128} color={PAL.blue} fill={PAL.blueSoft} icon="grip" title="255 · 夹爪" />
            <SoftPill x={390} y={114} w={128} color={PAL.green} fill={PAL.greenSoft} icon="stop" title="结束 · 教学显示" size={9} />
          </>
        );
      case 'chap-3':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="calm" arm="point" chapter={3} />
            <T x={136} y={34} size={11} color={PAL.muted}>一个动作 = 八格行李</T>
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} filter="url(#rt2-card-shadow)">
                <rect x={136 + i * 42} y={44} width={36} height={30} rx={8} fill={i < 7 ? PAL.purpleSoft : PAL.soft} stroke={i < 7 ? PAL.purple : PAL.line} strokeWidth={1.2} />
                <T x={154 + i * 42} y={64} size={11} anchor="middle" color={i < 7 ? PAL.purple : PAL.muted} weight={600}>
                  {['132', '114', '128', '5', '25', '156', '255', '256'][i]}
                </T>
              </g>
            ))}
            <T x={136} y={96} size={10.5} color={PAL.muted}>前 7 格取 0–255；第 8 格写结束位</T>
            <SoftPill x={174} y={108} w={140} color={PAL.green} fill={PAL.greenSoft} icon="flag" title="结束位（教学显示）" />
            <FlowIcon name="plus" x={466} y={52} size={16} color={PAL.muted} />
            <T x={488} y={62} size={11} color={PAL.muted}>格子不够</T>
            <T x={488} y={80} size={11} color={PAL.muted}>就多写一句</T>
          </>
        );
      case 'chap-4':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="happy" arm="point" chapter={4} />
            <SoftNode x={140} y={38} w={86} h={34} color={PAL.blue} icon="book" title="网页 VQA" />
            <SoftNode x={140} y={86} w={86} h={34} color={PAL.orange} icon="tag" title="机器人轨迹" />
            <SoftNode x={252} y={56} w={104} h={52} color={PAL.green} icon="bowl" title="共同微调" sub="同一锅" />
            <Arrow x1={226} y1={55} x2={250} y2={68} color={PAL.muted} width={1.5} />
            <Arrow x1={226} y1={103} x2={250} y2={94} color={PAL.muted} width={1.5} />
            <Arrow x1={356} y1={82} x2={384} y2={82} color={PAL.green} width={1.5} />
            <SoftPill x={386} y={50} w={126} color={PAL.green} fill={PAL.greenSoft} icon="check" title="语义不丢" />
            <SoftPill x={386} y={84} w={126} color={PAL.blue} fill={PAL.blueSoft} icon="check" title="动作学会" />
          </>
        );
      case 'chap-5':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="calm" arm="point" chapter={5} />
            <SoftNode x={136} y={34} w={112} h={34} color={PAL.blue} icon="book" title="网页语料" />
            <SoftNode x={136} y={86} w={112} h={34} color={PAL.orange} icon="robot" title="机器人厨房" />
            <SoftNode x={278} y={56} w={94} h={50} color={PAL.purple} icon="layers" title="同一套权重" sub="语义 + 动作" />
            <Arrow x1={248} y1={51} x2={276} y2={68} color={PAL.muted} width={1.5} />
            <Arrow x1={248} y1={103} x2={276} y2={94} color={PAL.muted} width={1.5} />
            <Arrow x1={372} y1={81} x2={400} y2={81} color={PAL.blue} width={1.5} />
            <SoftPill x={402} y={28} w={120} color={PAL.blue} fill={PAL.blueSoft} icon="database" title="VQA / 图文" size={9} />
            <SoftPill x={402} y={58} w={120} color={PAL.orange} fill={PAL.orangeSoft} icon="robot" title="13 台机器人" size={9} />
            <SoftPill x={402} y={88} w={120} color={PAL.green} fill={PAL.greenSoft} icon="clock" title="17 个月轨迹" size={9} />
          </>
        );
      case 'chap-6':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="calm" arm="point" chapter={6} />
            <SoftNode x={132} y={58} w={106} h={46} color={PAL.blue} icon="robot" title="机器人现场" sub="小算力" />
            <SoftNode x={264} y={42} w={112} h={52} color={PAL.blue} icon="cloud" title="多 TPU 云服务" sub="55B 在这里算" />
            <CurvedArrow d="M238 58 C248 43 254 47 264 51" endX={264} endY={51} angle={10} color={PAL.blue} />
            <CurvedArrow d="M320 94 C290 111 260 106 238 92" endX={238} endY={92} angle={160} color={PAL.green} />
            <T x={248} y={38} size={9} color={PAL.blue} weight={600}>请求</T>
            <T x={256} y={116} size={9} color={PAL.green} weight={600}>动作 token 返回</T>
            <SoftPill x={396} y={36} w={112} color={PAL.orange} fill={PAL.orangeSoft} icon="clock" title="1–3 Hz" />
            <SoftPill x={396} y={70} w={112} color={PAL.green} fill={PAL.greenSoft} icon="check" title="5 Hz · 小模型" />
          </>
        );
      case 'chap-7':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="think" arm="point" chapter={7} />
            <SoftPill x={146} y={24} w={330} h={30} color={PAL.blue} fill={PAL.blueSoft} icon="clock" title="同一时段 · 同批场景 · 四款模型" size={10} />
            <SoftPill x={486} y={26} w={42} h={26} color={PAL.blue} fill={PAL.paper} title="6k" size={11} />
            {[
              ['RT-1', PAL.orange, PAL.orangeSoft],
              ['VC-1', PAL.blue, PAL.blueSoft],
              ['PaLI-X', PAL.purple, PAL.purpleSoft],
              ['PaLM-E', PAL.green, PAL.greenSoft],
            ].map(([name, color, fill], i) => (
              <SoftNode key={name} x={146 + i * 86} y={72} w={76} h={38} color={color as string} fill={fill as string} icon="tag" title={name as string} textSize={10} />
            ))}
            {[0, 1, 2].map((i) => (
              <Arrow key={i} x1={222 + i * 86} y1={91} x2={232 + i * 86} y2={91} color={PAL.green} width={1.5} />
            ))}
            <T x={230} y={132} size={10} color={PAL.muted}>同一条件、轮流测，分数才可比</T>
          </>
        );
      case 'chap-8':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="think" arm="point" chapter={8} />
            <SoftNode x={138} y={38} w={104} h={82} color={PAL.blue} icon="map" title="同一句指令" sub="没见过数字" />
            <SoftNode x={270} y={48} w={92} h={64} color={PAL.orange} icon="compass" title="换厨房" sub="换背景" />
            <Arrow x1={242} y1={79} x2={268} y2={79} color={PAL.muted} width={1.5} />
            <Arrow x1={362} y1={80} x2={390} y2={80} color={PAL.muted} width={1.5} />
            <SoftPill x={392} y={34} w={118} color={PAL.green} fill={PAL.greenSoft} icon="check" title="新物体" />
            <SoftPill x={392} y={66} w={118} color={PAL.green} fill={PAL.greenSoft} icon="check" title="新背景" />
            <SoftPill x={392} y={98} w={118} color={PAL.green} fill={PAL.greenSoft} icon="check" title="新环境" />
          </>
        );
      case 'chap-9':
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="happy" arm="point" chapter={9} />
            <SoftNode x={136} y={34} w={126} h={44} color={PAL.purple} icon="speech" title="我需要锤子" sub="哪样能凑合？" />
            <SoftNode x={136} y={92} w={126} h={34} color={PAL.orange} icon="bulb" title="Plan：pick rocks" />
            <Arrow x1={200} y1={78} x2={200} y2={90} color={PAL.muted} width={1.5} />
            <Arrow x1={262} y1={109} x2={288} y2={109} color={PAL.purple} width={1.5} />
            <SoftPill x={290} y={96} w={50} h={28} color={PAL.purple} fill={PAL.purpleSoft} title="1" />
            <SoftPill x={350} y={96} w={56} h={28} color={PAL.purple} fill={PAL.purpleSoft} title="129" />
            <SoftPill x={416} y={96} w={56} h={28} color={PAL.purple} fill={PAL.purpleSoft} title="138" />
            <SoftPill x={482} y={96} w={48} h={28} color={PAL.green} fill={PAL.greenSoft} icon="play" title="执行" size={9} />
            <T x={286} y={134} size={10} color={PAL.muted}>先写计划，再写动作 token</T>
          </>
        );
      default:
        return (
          <>
            <Chibi x={84} y={58} s={0.72} mood="calm" arm="point" chapter={10} />
            <SoftNode x={146} y={40} w={118} h={34} color={PAL.red} icon="cross" title="动作技能" />
            <SoftNode x={146} y={88} w={118} h={34} color={PAL.green} icon="check" title="语义概念" />
            <RoundMark x={294} y={57} color={PAL.red} icon="cross" />
            <RoundMark x={294} y={105} color={PAL.green} icon="check" />
            <SoftPill x={330} y={42} w={180} color={PAL.red} fill={PAL.redSoft} icon="shield" title="上限：动作数据" />
            <SoftPill x={330} y={90} w={180} color={PAL.green} fill={PAL.greenSoft} icon="bulb" title="下限：语义预训练" />
            <T x={330} y={130} size={10} color={PAL.muted}>带走理解，带不走新动作</T>
          </>
        );
    }
  };

  const route = ((chapterId || '').match(/\d+/)?.[0] || '01').padStart(2, '0');

  return (
    <Svg w={560} h={208} label="同声传译员的类比">
      <rect x={4} y={4} width={552} height={198} rx={16} fill="#fffdf8" stroke="#e6dac8" strokeWidth={1.1} />
      <rect x={10} y={10} width={540} height={186} rx={12} fill="none" stroke="#f2e9dc" strokeWidth={0.8} />
      <line x1={20} y1={30} x2={540} y2={30} stroke="#e7dccd" strokeWidth={0.9} strokeDasharray="3 5" />
      <rect x={16} y={36} width={528} height={148} rx={10} fill="#ffffff" stroke="#eee3d4" strokeWidth={0.8} filter="url(#rt2-card-shadow)" />
      <T x={22} y={21} size={8.5} color={PAL.muted} weight={600} opacity={0.82}>类比路线 · {route}</T>
      <rect x={380} y={11.5} width={42} height={15} rx={7.5} fill={PAL.blueSoft} stroke={PAL.blue} strokeOpacity={0.34} strokeWidth={0.8} />
      <T x={401} y={22} size={7.2} anchor="middle" color={PAL.blue} weight={600}>① 输入</T>
      <T x={424} y={22} size={7.2} color={PAL.muted} opacity={0.55}>→</T>
      <rect x={430} y={11.5} width={42} height={15} rx={7.5} fill={PAL.purpleSoft} stroke={PAL.purple} strokeOpacity={0.34} strokeWidth={0.8} />
      <T x={451} y={22} size={7.2} anchor="middle" color={PAL.purple} weight={600}>② 变换</T>
      <T x={474} y={22} size={7.2} color={PAL.muted} opacity={0.55}>→</T>
      <rect x={480} y={11.5} width={42} height={15} rx={7.5} fill={PAL.greenSoft} stroke={PAL.green} strokeOpacity={0.34} strokeWidth={0.8} />
      <T x={501} y={22} size={7.2} anchor="middle" color={PAL.green} weight={600}>③ 输出</T>
      <g transform="translate(0 26)">{body()}</g>
      <line x1={20} y1={190} x2={540} y2={190} stroke="#e7dccd" strokeWidth={0.8} strokeDasharray="3 5" />
      <T x={22} y={199} size={7.8} color={PAL.muted} opacity={0.7}>结构类比 · 不替代论文证据</T>
      <T x={538} y={199} size={7.8} anchor="end" color={PAL.muted} opacity={0.62}>RT-2 · 小剧场</T>
    </Svg>
  );
};

export default InterpreterStrip;
