import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'compact' | 'quality' | 'large';
type StepKey = 'pose' | 'linear' | 'encoder' | 'decoder' | 'beam';

const metric = {
  compact: { fps: 12, frames: 128, cost: 25, bleu: 9.53, params: 77, label: '12 fps 轻量' },
  quality: { fps: 24, frames: 256, cost: 100, bleu: 10.06, params: 77, label: 'T5-small' },
  large: { fps: 24, frames: 256, cost: 100, bleu: 11.89, params: 248, label: 'T5-base 参考' },
};

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="slt-panel">{children}</div>;
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="slt-bar-row">
      <span>{label}</span>
      <div className="slt-bar"><i style={{ width: `${Math.max(4, (value / max) * 100)}%`, background: color }} /></div>
      <b>{value}</b>
    </div>
  );
}

function ModeButtons({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="slt-buttons">
      {(['compact', 'quality', 'large'] as Mode[]).map((m) => (
        <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{metric[m].label}</button>
      ))}
    </div>
  );
}

export const SltHeroOld: React.FC<WidgetProps> = () => (
  <Panel>
    <div className="slt-hero-chart old-chart">
      <div className="slt-chart-title">大模型基线：质量更高，但部署更重</div>
      <div className="slt-metric-number danger">248M</div>
      <div className="slt-metric-label">T5-base 级参数量</div>
      <div className="slt-chart-bars">
        <Bar label="参数量" value={248} max={248} color="#c43f52" />
        <Bar label="BLEU-4" value={119} max={119} color="#27446e" />
        <Bar label="注意力成本" value={100} max={100} color="#d97706" />
      </div>
      <div className="slt-chart-note">保留更多视频细节，BLEU-4 参考值 11.89；但长序列 + 大模型让训练和推理成本更高。</div>
    </div>
  </Panel>
);

export const SltHeroNew: React.FC<WidgetProps> = () => (
  <Panel>
    <div className="slt-hero-chart new-chart">
      <div className="slt-chart-title">本文方法：参数大幅减少，性能接近</div>
      <div className="slt-metric-number success">77M</div>
      <div className="slt-metric-label">MMPose + T5-small 总参数量</div>
      <div className="slt-chart-bars">
        <Bar label="参数量" value={77} max={248} color="#228d5c" />
        <Bar label="BLEU-4" value={101} max={119} color="#27446e" />
        <Bar label="12fps 成本" value={25} max={100} color="#228d5c" />
      </div>
      <div className="slt-chart-note">BLEU-4 达到 10.06，接近大模型；12 fps 时自注意力成本约降到 1/4，更适合实时和端侧部署。</div>
    </div>
  </Panel>
);

export const SltModelCompare: React.FC<WidgetProps> = (props) => (
  <div className="slt-model-compare">
    <SltHeroOld {...props} />
    <SltHeroNew {...props} />
  </div>
);

type GestureId = 'hello' | 'thanks' | 'help';

type PosePoint = { x: number; y: number };
type PoseFrame = {
  cue: string;
  pose: Record<string, PosePoint>;
};
type GestureSpec = {
  title: string;
  sentence: string;
  translation: string;
  frames: PoseFrame[];
};

const p = (x: number, y: number): PosePoint => ({ x, y });

const basePose = {
  head: p(306, 84),
  neck: p(306, 124),
  lShoulder: p(256, 146),
  rShoulder: p(360, 146),
  lElbow: p(224, 198),
  rElbow: p(392, 194),
};

const handPose = (side: 'l' | 'r', wrist: PosePoint, palm: PosePoint, spread = 1, curl = 0) => {
  const mirror = side === 'l' ? -1 : 1;

  return {
    [`${side}Wrist`]: wrist,
    [`${side}Palm`]: palm,
    [`${side}Thumb`]: p(palm.x - 18 * mirror * spread, palm.y + 10 - curl * 6),
    [`${side}Index`]: p(palm.x - 4 * mirror * spread, palm.y - 34 - curl * 3),
    [`${side}Middle`]: p(palm.x + 10 * mirror * spread, palm.y - 40 - curl * 2),
    [`${side}Ring`]: p(palm.x + 24 * mirror * spread, palm.y - 32 - curl * 2),
    [`${side}Pinky`]: p(palm.x + 36 * mirror * spread, palm.y - 18 - curl * 3),
  };
};

const buildFrame = (cue: string, left?: Parameters<typeof handPose>, right?: Parameters<typeof handPose>) => ({
  cue,
  pose: {
    ...basePose,
    ...(left ? handPose(...left) : {}),
    ...(right ? handPose(...right) : {}),
  },
});

const gestureLibrary: Record<GestureId, GestureSpec> = {
  hello: {
    title: '你好',
    sentence: '你好',
    translation: 'Hello.',
    frames: [
      buildFrame('抽取 keypoints', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(358, 188), p(346, 166), 1, 0]),
      buildFrame('追踪手腕', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(372, 174), p(360, 154), 1.1, 0.05]),
      buildFrame('编码姿态序列', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(342, 180), p(330, 160), 1.05, 0.1]),
      buildFrame('生成翻译', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(368, 170), p(356, 150), 1.15, 0]),
    ],
  },
  thanks: {
    title: '谢谢',
    sentence: '谢谢',
    translation: 'Thank you.',
    frames: [
      buildFrame('抽取 keypoints', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(326, 150), p(320, 134), 0.92, 0.1]),
      buildFrame('追踪手腕', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(338, 164), p(332, 148), 0.86, 0.22]),
      buildFrame('编码姿态序列', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(352, 178), p(346, 160), 0.8, 0.35]),
      buildFrame('生成翻译', ['l', p(214, 210), p(198, 190), 0.7, 0.15], ['r', p(366, 190), p(360, 172), 0.78, 0.42]),
    ],
  },
  help: {
    title: '我需要帮助',
    sentence: '我需要帮助',
    translation: 'I need help.',
    frames: [
      buildFrame('抽取 keypoints', ['l', p(236, 164), p(228, 144), 1, 0.1], ['r', p(378, 164), p(370, 144), 1, 0.1]),
      buildFrame('追踪手腕', ['l', p(228, 156), p(220, 136), 1, 0.08], ['r', p(386, 156), p(378, 136), 1, 0.08]),
      buildFrame('编码姿态序列', ['l', p(234, 148), p(226, 128), 0.95, 0.06], ['r', p(380, 148), p(372, 128), 0.95, 0.06]),
      buildFrame('生成翻译', ['l', p(242, 154), p(234, 134), 0.96, 0.05], ['r', p(372, 154), p(364, 134), 0.96, 0.05]),
    ],
  },
};

const connections: Array<[string, string]> = [
  ['head', 'neck'],
  ['neck', 'lShoulder'],
  ['neck', 'rShoulder'],
  ['neck', 'chest'],
  ['chest', 'spine'],
  ['spine', 'lHip'],
  ['spine', 'rHip'],
  ['lShoulder', 'rShoulder'],
  ['lShoulder', 'lElbow'],
  ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'],
  ['rElbow', 'rWrist'],
  ['lWrist', 'lPalm'],
  ['rWrist', 'rPalm'],
  ['lPalm', 'lThumb'],
  ['lPalm', 'lIndex'],
  ['lPalm', 'lMiddle'],
  ['lPalm', 'lRing'],
  ['lPalm', 'lPinky'],
  ['rPalm', 'rThumb'],
  ['rPalm', 'rIndex'],
  ['rPalm', 'rMiddle'],
  ['rPalm', 'rRing'],
  ['rPalm', 'rPinky'],
];

const handPoints = new Set([
  'lWrist',
  'rWrist',
  'lPalm',
  'rPalm',
  'lThumb',
  'lIndex',
  'lMiddle',
  'lRing',
  'lPinky',
  'rThumb',
  'rIndex',
  'rMiddle',
  'rRing',
  'rPinky',
]);

export const SltSignIcon: React.FC<WidgetProps> = () => {
  const [gestureId, setGestureId] = useState<GestureId>('hello');
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [feedback, setFeedback] = useState('模型正在读取 keypoints…');

  const gesture = gestureLibrary[gestureId];
  const frames = gesture.frames;
  const currentFrame = useMemo(() => frames[Math.min(frameIndex, frames.length - 1)] ?? frames[0], [frames, frameIndex]);

  useEffect(() => {
    setFrameIndex(0);
    setPlaying(true);
    setFeedback('模型正在读取 keypoints…');
  }, [gestureId]);

  useEffect(() => {
    if (!playing) return;

    if (frameIndex >= frames.length - 1) {
      const doneTimer = window.setTimeout(() => {
        setPlaying(false);
        setFeedback(`模型输出：${gesture.translation}`);
      }, 420);
      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      setFrameIndex((current) => Math.min(current + 1, frames.length - 1));
      if (frameIndex === 0) setFeedback('抽取 keypoints…');
      if (frameIndex === 1) setFeedback('编码姿态序列…');
      if (frameIndex === 2) setFeedback('生成翻译…');
    }, 620);

    return () => window.clearTimeout(timer);
  }, [frameIndex, frames.length, gesture.translation, playing]);

  const replay = () => {
    setFrameIndex(0);
    setPlaying(true);
    setFeedback('模型正在读取 keypoints…');
  };

  const statusStep = Math.min(frameIndex, 2);
  const statusLabels = ['抽取 keypoints', '编码姿态序列', '生成翻译'];

  return (
    <Panel>
      <div className="keypoint-translator">
        <div className="keypoint-toolbar">
          <div className="keypoint-title-block">
            <div className="keypoint-title">二维 keypoints 手语翻译</div>
            <div className="keypoint-subtitle">选择一句手势，模型先读骨架点，再翻译成文本。</div>
          </div>
          <button className="keypoint-replay" onClick={replay}>重播当前手势</button>
        </div>

        <div className="slt-buttons keypoint-options">
          {(Object.entries(gestureLibrary) as Array<[GestureId, GestureSpec]>).map(([id, item]) => (
            <button key={id} className={gestureId === id ? 'active' : ''} onClick={() => setGestureId(id)}>
              {item.sentence}
            </button>
          ))}
        </div>

        <div className="keypoint-stage" onClick={replay} role="button" tabIndex={0} aria-label="点击重播当前手语 keypoints 动画">
          <svg viewBox="0 0 620 360" className="keypoint-svg">
            <defs>
              <linearGradient id="keypoint-bg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f5f8f0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="620" height="360" rx="24" fill="url(#keypoint-bg)" />
            <circle cx="306" cy="84" r="24" fill="#fff7ed" stroke="#d97706" strokeWidth="3" />
            <path d="M306 108 L306 124" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
            <path d="M266 146 L354 146" stroke="#8aa0c2" strokeWidth="6" strokeLinecap="round" />
            <path d="M256 146 L224 198" stroke="#8aa0c2" strokeWidth="6" strokeLinecap="round" />
            <path d="M360 146 L392 194" stroke="#8aa0c2" strokeWidth="6" strokeLinecap="round" />

            {connections.map(([from, to]) => {
              const start = currentFrame.pose[from];
              const end = currentFrame.pose[to];
              if (!start || !end) return null;
              return <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={handPoints.has(from) || handPoints.has(to) ? 'keypoint-link hand' : 'keypoint-link'} />;
            })}

            {Object.entries(currentFrame.pose).map(([name, point]) => (
              <g key={name}>
                <circle cx={point.x} cy={point.y} r={handPoints.has(name) ? 7.5 : 6} className={handPoints.has(name) ? 'keypoint-node hand' : 'keypoint-node'} />
              </g>
            ))}
          </svg>

          <div className="keypoint-overlay">
            <div className="keypoint-step">步骤 {statusStep + 1}/3 · {statusLabels[statusStep]}</div>
            <div className="keypoint-cue">{currentFrame.cue}</div>
            <div className="keypoint-gesture">当前手势：{gesture.title}</div>
          </div>
        </div>

        <div className="keypoint-footer">
          <div className="keypoint-flow">
            {statusLabels.map((label, idx) => (
              <span key={label} className={idx <= statusStep ? 'active' : ''}>{label}</span>
            ))}
          </div>
          <div className={`keypoint-feedback ${feedback.includes('模型输出') ? 'done' : ''}`}>{feedback}</div>
        </div>
      </div>
    </Panel>
  );
};

export const SltHeroIntro: React.FC<WidgetProps> = () => (
  <Panel>
    <svg viewBox="0 0 560 230" className="slt-svg sign-intro-svg">
      <rect x="34" y="38" width="160" height="118" rx="24" fill="#ecfdf3" stroke="#bbf7d0" />
      <path d="M86 126 C92 82 104 60 120 58 C136 56 147 80 150 124" fill="none" stroke="#228d5c" strokeWidth="13" strokeLinecap="round" />
      <path d="M82 132 C116 164 154 164 188 132" fill="none" stroke="#228d5c" strokeWidth="13" strokeLinecap="round" />
      <circle cx="112" cy="102" r="6" fill="#21324a" />
      <circle cx="148" cy="102" r="6" fill="#21324a" />
      <path d="M222 98 H348" stroke="#27446e" strokeWidth="10" strokeLinecap="round" strokeDasharray="18 14" />
      <path d="M330 78 L362 98 L330 118" fill="none" stroke="#27446e" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="386" y="58" width="132" height="98" rx="20" fill="#27446e" />
      <text x="452" y="102" textAnchor="middle" fill="white" fontSize="22" fontWeight="900">Text</text>
      <text x="452" y="130" textAnchor="middle" fill="#dbe7c7" fontSize="15" fontWeight="800">translation</text>
      <text x="36" y="200" fill="#21324a" fontWeight="900">首页先展示“手势 → 翻译反馈”的直观交互，参数与 BLEU 对比放到下一章展开。</text>
    </svg>
  </Panel>
);

export const SltAnalogy: React.FC<WidgetProps> = () => {
  const [fps, setFps] = useState<12 | 24>(24);
  const is24 = fps === 24;
  const frameCount = is24 ? 256 : 128;
  const attentionCost = is24 ? 100 : 25;
  const bleu = is24 ? 10.06 : 9.53;
  const loadBars = is24 ? 12 : 6;

  return (
    <Panel>
      <div className="fps-load-card">
        <div className="fps-load-topbar">
          <div className="slt-buttons fps-load-buttons">
            <button className={fps === 24 ? 'active' : ''} onClick={() => setFps(24)}>24 fps</button>
            <button className={fps === 12 ? 'active' : ''} onClick={() => setFps(12)}>12 fps</button>
          </div>
          <div className="fps-load-badge">{is24 ? '高采样 / 高负载' : '低采样 / 低负载'}</div>
        </div>

        <div className="fps-load-stage">
          <div className="fps-load-visual">
            <div className="fps-load-column">
              <div className="fps-load-label">输入帧数</div>
              <div className="fps-load-big">{frameCount}</div>
              <div className="fps-load-bars">
                {Array.from({ length: loadBars }).map((_, i) => (
                  <i key={i} className={is24 ? 'dense' : 'light'} />
                ))}
              </div>
            </div>

            <div className="fps-load-arrow">→</div>

            <div className="fps-load-column">
              <div className="fps-load-label">模型负载</div>
              <div className="fps-load-meter">
                <div className="fps-load-meter-fill" style={{ width: `${attentionCost}%` }} />
              </div>
              <div className="fps-load-big">{attentionCost}%</div>
              <div className="fps-load-caption">自注意力相对成本</div>
            </div>

            <div className="fps-load-arrow">→</div>

            <div className="fps-load-column">
              <div className="fps-load-label">翻译效果</div>
              <div className="fps-load-big">{bleu}</div>
              <div className="fps-load-caption">BLEU-4</div>
            </div>
          </div>
        </div>

        <div className="fps-load-stats">
          <div>
            <b>{is24 ? '×2' : '×0.5'}</b>
            <span>相对 12 fps 的采样密度</span>
          </div>
          <div>
            <b>{is24 ? '100 → 25 很难' : '100 → 25 已实现'}</b>
            <span>负载变化是否直观可见</span>
          </div>
          <div>
            <b>{is24 ? '+0.53' : '-0.53'}</b>
            <span>相对另一档 fps 的 BLEU-4 差值</span>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export const SltCost: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('compact');
  const m = metric[mode];
  return <Panel><ModeButtons mode={mode} setMode={setMode} /><Bar label="输入帧数" value={m.frames} max={256} color="#27446e" /><Bar label="注意力成本指数" value={m.cost} max={100} color={mode === 'compact' ? '#228d5c' : '#d97706'} /><Bar label="参数量 M" value={m.params} max={248} color={mode === 'large' ? '#c43f52' : '#228d5c'} /><p className={`slt-feedback ${mode === 'compact' ? 'good' : ''}`}>{m.label}：BLEU-4 {m.bleu}，成本与质量的选择开始变得可见。</p></Panel>;
};

export const SltPose: React.FC<WidgetProps> = () => {
  const [part, setPart] = useState<'hands' | 'body' | 'face'>('hands');
  const regions: Record<typeof part, { name: string; points: number; summary: string; ids: string[] }> = {
    hands: { name: '双手关键点', points: 42, summary: '左右手共 42 个关键点，主要提供手势形状与手部运动信息。', ids: ['lWrist', 'rWrist', 'lPalm', 'rPalm', 'lThumb', 'lIndex', 'lMiddle', 'lRing', 'lPinky', 'rThumb', 'rIndex', 'rMiddle', 'rRing', 'rPinky'] },
    body: { name: '上半身关键点', points: 17, summary: '头部、肩部、肘部、腕部与躯干关键点共同描述手势的空间位置和运动轨迹。', ids: ['head', 'neck', 'lShoulder', 'rShoulder', 'chest', 'spine', 'lHip', 'rHip', 'lElbow', 'rElbow', 'lWrist', 'rWrist'] },
    face: { name: '面部关键点', points: 26, summary: '面部关键点补充非手部线索，例如眉部、口型、表情和细粒度语义提示。', ids: ['head', 'faceLeft', 'faceUpperLeft', 'faceTop', 'faceUpperRight', 'faceRight', 'faceLowerRight', 'faceBottom', 'faceLowerLeft', 'faceCenter', 'mouthLeft', 'mouthRight', 'browLeft', 'browRight'] },
  };
  const current = regions[part];
  const activeIds = new Set(current.ids);
  const pose = {
    head: p(306, 72),
    neck: p(306, 118),
    lShoulder: p(246, 142),
    rShoulder: p(366, 142),
    chest: p(306, 156),
    spine: p(306, 194),
    lHip: p(274, 222),
    rHip: p(338, 222),
    lElbow: p(214, 196),
    rElbow: p(398, 192),
    faceLeft: p(284, 70),
    faceUpperLeft: p(294, 60),
    faceTop: p(306, 56),
    faceUpperRight: p(318, 60),
    faceRight: p(328, 70),
    faceLowerRight: p(322, 84),
    faceBottom: p(306, 90),
    faceLowerLeft: p(290, 84),
    faceCenter: p(306, 72),
    mouthLeft: p(296, 80),
    mouthRight: p(316, 80),
    browLeft: p(294, 64),
    browRight: p(318, 64),
    ...handPose('l', p(214, 196), p(194, 168), 1.12, 0.04),
    ...handPose('r', p(398, 192), p(378, 164), 1.12, 0.04),
  };
  const faceLinks: Array<[string, string]> = [
    ['faceLeft', 'faceUpperLeft'],
    ['faceUpperLeft', 'faceTop'],
    ['faceTop', 'faceUpperRight'],
    ['faceUpperRight', 'faceRight'],
    ['faceRight', 'faceLowerRight'],
    ['faceLowerRight', 'faceBottom'],
    ['faceBottom', 'faceLowerLeft'],
    ['faceLowerLeft', 'faceLeft'],
    ['faceLeft', 'faceCenter'],
    ['faceTop', 'faceCenter'],
    ['faceRight', 'faceCenter'],
    ['faceBottom', 'faceCenter'],
    ['mouthLeft', 'mouthRight'],
    ['browLeft', 'browRight'],
  ];

  return (
    <Panel>
      <div className="slt-buttons">
        <button className={part === 'hands' ? 'active' : ''} onClick={() => setPart('hands')}>双手</button>
        <button className={part === 'body' ? 'active' : ''} onClick={() => setPart('body')}>上半身</button>
        <button className={part === 'face' ? 'active' : ''} onClick={() => setPart('face')}>脸部</button>
      </div>

      <div className="pose-keypoint-card">
        <div className="pose-keypoint-stage">
          <svg viewBox="0 0 620 360" className="keypoint-svg">
            <defs>
              <linearGradient id="pose-bg" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f5f8f0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="620" height="360" rx="24" fill="url(#pose-bg)" />
            <circle cx="306" cy="72" r="30" fill="#f1f5f9" stroke={part === 'face' || part === 'body' ? '#22c55e' : '#8aa0c2'} strokeWidth="4" />

            {[...connections, ...faceLinks].map(([from, to]) => {
              const start = pose[from as keyof typeof pose];
              const end = pose[to as keyof typeof pose];
              if (!start || !end) return null;
              const active = activeIds.has(from) || activeIds.has(to);
              return (
                <line
                  key={`${from}-${to}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className={active ? 'pose-link active' : 'pose-link'}
                />
              );
            })}

            {Object.entries(pose).map(([name, point]) => {
              const active = activeIds.has(name);
              return <circle key={name} cx={point.x} cy={point.y} r={active ? 8 : 6} className={active ? 'pose-node active' : 'pose-node'} />;
            })}
          </svg>

          <div className="pose-keypoint-overlay">
            <div className="pose-chip">当前高亮：{current.name}</div>
            <div className="pose-chip light">{current.points} 个关键点</div>
          </div>
        </div>

        <div className="pose-keypoint-meta">
          <div className="pose-keypoint-title">{current.name}</div>
          <div className="pose-keypoint-desc">{current.summary}</div>
          <div className="pose-keypoint-note">规范表示：每一帧共提取 85 个关键点，每个关键点包含 x、y、z 三个坐标，因此输入维度为 85 × 3 = 255。</div>
        </div>
      </div>

      <p className="slt-feedback good">整帧姿态 ———— 一个 255 维向量</p>
    </Panel>
  );
};

export const SltProjection: React.FC<WidgetProps> = () => {
  const leftYs = useMemo(() => Array.from({ length: 5 }, (_, i) => 44 + i * 34), []);
  const rightYs = useMemo(() => Array.from({ length: 10 }, (_, i) => 24 + i * 18), []);

  return (
    <Panel>
      <svg viewBox="0 0 620 220" className="slt-svg projection-svg" aria-label="全连接层示意图">
        {leftYs.map((y, idx) => (
          <circle key={`l-${idx}`} cx="136" cy={y} r="11" fill="#27446e" />
        ))}

        {rightYs.map((y, idx) => (
          <circle key={`r-${idx}`} cx="484" cy={y} r="10" fill="#228d5c" />
        ))}

        {leftYs.map((ly) =>
          rightYs.map((ry, idx) => (
            <line
              key={`${ly}-${idx}`}
              x1="147"
              y1={ly}
              x2="474"
              y2={ry}
              stroke="#8aa0c2"
              strokeWidth="1.4"
              strokeOpacity="0.28"
            />
          )),
        )}
      </svg>
    </Panel>
  );
};

export const SltAttention: React.FC<WidgetProps> = () => {
  const [fps, setFps] = useState<12 | 24>(12);
  const n = fps === 12 ? 128 : 256;
  const cells = fps === 12 ? 16 : 64;
  return <Panel><div className="slt-buttons"><button className={fps === 12 ? 'active' : ''} onClick={() => setFps(12)}>12 fps</button><button className={fps === 24 ? 'active' : ''} onClick={() => setFps(24)}>24 fps</button></div><div className="slt-grid" style={{ gridTemplateColumns: `repeat(${Math.sqrt(cells)}, 1fr)` }}>{Array.from({ length: cells }).map((_, i) => <i key={i} />)}</div><p className={`slt-feedback ${fps === 12 ? 'good' : ''}`}>当前约 {n} 个输入 token；注意力交互按 n² 增长。12 fps 的网格面积约为 24 fps 的四分之一。</p></Panel>;
};

export const SltSize: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('quality');
  const m = metric[mode];
  return <Panel><ModeButtons mode={mode} setMode={setMode} /><Bar label="参数量 M" value={m.params} max={248} color={m.params > 100 ? '#c43f52' : '#228d5c'} /><Bar label="BLEU-4 ×10" value={Math.round(m.bleu * 10)} max={119} color="#27446e" /><p className="slt-feedback">77M 系统换来小体积；T5-base 参考分更高，但参数规模约为 3.2 倍。</p></Panel>;
};

export const SltPipeline: React.FC<WidgetProps> = () => {
  const steps: StepKey[] = ['pose', 'linear', 'encoder', 'decoder', 'beam'];
  const labels: Record<StepKey, string> = { pose: 'MMPose', linear: '线性投影', encoder: 'T5 编码器', decoder: 'T5 解码器', beam: 'Beam search' };
  const stepNodes = [
    { key: 'video', title: '手语视频', sub: '≤256 frames', x: 56, w: 96 },
    { key: 'pose', title: 'MMPose', sub: '每帧 255 维姿态', x: 170, w: 112 },
    { key: 'linear', title: '线性投影', sub: '255 → 512', x: 300, w: 112 },
    { key: 'encoder', title: 'T5 编码器', sub: '6 Transformer 层', x: 430, w: 118 },
    { key: 'decoder', title: 'T5 解码器', sub: '6 层自回归生成', x: 566, w: 124 },
    { key: 'beam', title: 'Beam search', sub: 'beam=5，≤128 tokens', x: 708, w: 136 },
  ] as const;
  const [active, setActive] = useState<StepKey>('pose');
  const activeIndex = steps.indexOf(active);
  const isLit = (key: string) => key === 'video' || steps.indexOf(key as StepKey) <= activeIndex;

  return (
    <Panel>
      <svg viewBox="0 0 900 230" className="slt-svg pipeline-svg" aria-label="端到端手语翻译流程图">
        {stepNodes.slice(0, -1).map((node, idx) => {
          const next = stepNodes[idx + 1];
          const lit = isLit(next.key);
          return (
            <g key={`${node.key}-${next.key}`}>
              <line
                x1={node.x + node.w}
                y1="108"
                x2={next.x}
                y2="108"
                stroke={lit ? '#228d5c' : '#b8c4d6'}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d={`M ${next.x - 10} 100 L ${next.x} 108 L ${next.x - 10} 116`}
                fill="none"
                stroke={lit ? '#228d5c' : '#b8c4d6'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          );
        })}

        {stepNodes.map((node) => {
          const lit = isLit(node.key);
          return (
            <g key={node.key}>
              <rect
                x={node.x}
                y="66"
                width={node.w}
                height="84"
                rx="18"
                fill={lit ? '#ecfdf3' : '#ffffff'}
                stroke={lit ? '#228d5c' : '#d7deea'}
                strokeWidth="2"
              />
              <text x={node.x + node.w / 2} y="101" textAnchor="middle" fill={lit ? '#166534' : '#27446e'} fontSize="16" fontWeight="800">
                {node.title}
              </text>
              <text x={node.x + node.w / 2} y="126" textAnchor="middle" fill="#68778f" fontSize="12" fontWeight="700">
                {node.sub}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="slt-pipeline">
        {steps.map((s) => (
          <button key={s} className={active === s ? 'active' : ''} onClick={() => setActive(s)}>{labels[s]}</button>
        ))}
      </div>
    </Panel>
  );
};

export const SltTraining: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'greedy' | 'beam'>('beam');
  const nodes = [
    { id: 'start', token: '<s>', phrase: '', score: 1.00, x: 44, y: 220 },
    { id: 'i', token: 'I', phrase: 'I', score: .42, x: 162, y: 66 },
    { id: 'please', token: 'Please', phrase: 'Please', score: .30, x: 162, y: 168 },
    { id: 'we', token: 'We', phrase: 'We', score: .18, x: 162, y: 270 },
    { id: 'you', token: 'You', phrase: 'You', score: .10, x: 162, y: 350 },
    { id: 'in', token: 'need', phrase: 'I need', score: .50, x: 306, y: 42 },
    { id: 'iw', token: 'want', phrase: 'I want', score: .28, x: 306, y: 118 },
    { id: 'ph', token: 'help', phrase: 'Please help', score: .46, x: 306, y: 194 },
    { id: 'pc', token: 'come', phrase: 'Please come', score: .34, x: 306, y: 270 },
    { id: 'wn', token: 'need', phrase: 'We need', score: .55, x: 306, y: 346 },
    { id: 'inh', token: 'help', phrase: 'I need help', score: .64, x: 470, y: 42 },
    { id: 'inm', token: 'more', phrase: 'I need more', score: .22, x: 470, y: 118 },
    { id: 'phm', token: 'me', phrase: 'Please help me', score: .58, x: 470, y: 194 },
    { id: 'pht', token: 'today', phrase: 'Please help today', score: .24, x: 470, y: 270 },
    { id: 'wnh', token: 'help', phrase: 'We need help', score: .52, x: 470, y: 346 },
  ];
  const edges = [
    ['start', 'i'], ['start', 'please'], ['start', 'we'], ['start', 'you'],
    ['i', 'in'], ['i', 'iw'], ['please', 'ph'], ['please', 'pc'], ['we', 'wn'],
    ['in', 'inh'], ['in', 'inm'], ['ph', 'phm'], ['ph', 'pht'], ['wn', 'wnh'],
  ];
  const greedyPath = new Set(['start', 'i', 'in', 'inh']);
  const beamPath = new Set(['start', 'i', 'please', 'we', 'in', 'iw', 'ph', 'pc', 'wn', 'inh', 'inm', 'phm', 'pht', 'wnh']);
  const activePath = mode === 'greedy' ? greedyPath : beamPath;
  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));

  return (
    <Panel>
      <div className="slt-buttons beam-toggle">
        <button className={mode === 'greedy' ? 'active' : ''} onClick={() => setMode('greedy')}>Greedy 高亮</button>
        <button className={mode === 'beam' ? 'active' : ''} onClick={() => setMode('beam')}>Beam search 高亮</button>
      </div>

      <svg viewBox="0 0 560 400" className="beam-svg beam-tree-svg" aria-label="beam search 分支概率示意图">
        {edges.map(([from, to]) => {
          const source = nodeById[from];
          const target = nodeById[to];
          const active = activePath.has(from) && activePath.has(to);
          return (
            <line
              key={`${from}-${to}`}
              x1={source.x + 30}
              y1={source.y}
              x2={target.x - 30}
              y2={target.y}
              stroke={active ? (mode === 'greedy' ? '#d97706' : '#228d5c') : '#c8d2e2'}
              strokeWidth={active ? 4 : 2}
              strokeOpacity={active ? 1 : .55}
              strokeLinecap="round"
            />
          );
        })}

        {nodes.map((node) => {
          const active = activePath.has(node.id);
          const fill = active ? (mode === 'greedy' ? '#fff7ed' : '#ecfdf3') : '#ffffff';
          const stroke = active ? (mode === 'greedy' ? '#d97706' : '#228d5c') : '#d7deea';
          return (
            <g key={node.id}>
              <rect x={node.x - 31} y={node.y - 20} width="62" height="40" rx="12" fill={fill} stroke={stroke} strokeWidth={active ? 3 : 1.5} />
              <text x={node.x} y={node.y - 1} textAnchor="middle" fill="#27446e" fontSize="14" fontWeight="900">{node.token}</text>
              <text x={node.x} y={node.y + 14} textAnchor="middle" fill="#68778f" fontSize="9">p={node.score}</text>
              {node.phrase ? <text x={node.x} y={node.y + 34} textAnchor="middle" fill={active ? '#166534' : '#68778f'} fontSize="10" fontWeight="800">{node.phrase}</text> : null}
            </g>
          );
        })}
      </svg>

      <div className="beam-caption">
        {mode === 'greedy'
          ? 'Greedy 每一步只沿着当前概率最高的一个分支走下去，例如 I → I need → I need help。'
          : 'Beam search 会保留多个高分前缀继续扩展，例如 I、Please、We、I need、Please help 同时参与后续比较。'}
      </div>
    </Panel>
  );
};

export const SltArchitecture: React.FC<WidgetProps> = () => {
  const [smooth, setSmooth] = useState(0.1);
  const words = ['help', 'come', 'today', 'need', 'me'];
  const correct = 0;
  const target = words.map((_, idx) => idx === correct ? 1 - smooth : smooth / (words.length - 1));
  const model = [0.62, 0.12, 0.08, 0.10, 0.08];
  const loss = target.reduce((sum, q, idx) => sum - q * Math.log(model[idx]), 0);

  return (
    <Panel>
      <div className="loss-card">
        <div className="loss-endpoints">
          <div className="loss-endpoint onehot">
            <span>one-hot 目标</span>
            <strong>help = 1.00</strong>
          </div>
          <div className="loss-endpoint smooth">
            <span>平滑目标</span>
            <strong>help = {target[correct].toFixed(2)}</strong>
          </div>
        </div>

        <div className="loss-morph">
          <span>只押正确词</span>
          <input aria-label="label smoothing" type="range" min="0" max="0.4" step="0.05" value={smooth} onChange={(event) => setSmooth(Number(event.target.value))} />
          <span>给候选词余量</span>
        </div>

        <div className="loss-bars">
          {words.map((word, idx) => (
            <div className="loss-row" key={word}>
              <span className={idx === correct ? 'correct' : ''}>{word}</span>
              <div className="loss-track">
                <div className="loss-fill target" style={{ width: `${target[idx] * 100}%` }} />
              </div>
              <b>{target[idx].toFixed(2)}</b>
            </div>
          ))}
        </div>

        <div className="loss-summary">
          <div>
            <span>label smoothing</span>
            <strong>{smooth.toFixed(2)}</strong>
          </div>
          <div className="loss-score">CE ≈ {loss.toFixed(2)}</div>
        </div>
      </div>
      <p className="slt-feedback good">拖动中间滑条：目标分布会从 one-hot 慢慢变软；论文最终使用 0.1，让正确词仍最高，但不把其它候选压成绝对 0。</p>
    </Panel>
  );
};

export const SltEncoder: React.FC<WidgetProps> = () => {
  const [heavy, setHeavy] = useState(false);
  return <Panel><div className="slt-buttons"><button className={!heavy ? 'active' : ''} onClick={() => setHeavy(false)}>本文轻路径</button><button className={heavy ? 'active' : ''} onClick={() => setHeavy(true)}>重视频编码器</button></div><Bar label="结构复杂度" value={heavy ? 90 : 35} max={100} color={heavy ? '#c43f52' : '#228d5c'} /><Bar label="可部署性" value={heavy ? 45 : 80} max={100} color={heavy ? '#d97706' : '#228d5c'} /><p className="slt-feedback">{heavy ? '更强的视觉编码可能提升表达，但论文关注的是避免这部分成本。' : '轻路径保留骨架运动信息，把生成能力交给 T5-small。'}</p></Panel>;
};

export const SltData: React.FC<WidgetProps> = () => {
  const groups = useMemo(() => [
    {
      title: 'T5-base 参考（248M，12–30 fps）',
      load: 100,
      rows: [
        { data: 'H2S', scores: [14.96, 5.11, 2.26, 1.22] },
        { data: 'YT-ASL', scores: [20.93, 10.35, 6.14, 3.95] },
        { data: 'YT-ASL + H2S', scores: [36.35, 23.00, 16.13, 11.89] },
      ],
    },
    {
      title: '本文 T5-small（77M，24 fps）',
      load: 100,
      rows: [
        { data: 'H2S', scores: [12.98, 4.22, 1.82, 1.07] },
        { data: 'YT-ASL', scores: [18.05, 8.69, 5.41, 3.62] },
        { data: 'YT-ASL + H2S', scores: [34.29, 20.83, 14.06, 10.06] },
      ],
    },
    {
      title: '本文 T5-small（77M，12 fps）',
      load: 25,
      rows: [
        { data: 'H2S', scores: [12.23, 3.67, 1.56, 0.82] },
        { data: 'YT-ASL', scores: [17.30, 7.82, 5.28, 3.34] },
        { data: 'YT-ASL + H2S', scores: [33.21, 20.01, 13.43, 9.53] },
      ],
    },
  ], []);
  const metrics = ['BLEU-1', 'BLEU-2', 'BLEU-3', 'BLEU-4'];
  const maxBleu4 = 11.89;

  return (
    <Panel>
      <div className="result-static-grid">
        {groups.map((group) => {
          const best = group.rows[group.rows.length - 1].scores[3];
          return (
            <section className="result-static-card" key={group.title}>
              <div className="result-title"><strong>{group.title}</strong><span>最佳 BLEU-4 {best.toFixed(2)}</span></div>
              <div className="result-load-row">
                <span>相对注意力负载</span>
                <div className="result-load-track"><div style={{ width: `${group.load}%` }} /></div>
                <b>{group.load}%</b>
              </div>
              <table className="result-table compact">
                <thead><tr><th>训练数据</th>{metrics.map(metric => <th key={metric}>{metric}</th>)}</tr></thead>
                <tbody>
                  {group.rows.map(row => <tr key={row.data}><td>{row.data}</td>{row.scores.map((value, scoreIdx) => <td key={`${row.data}-${scoreIdx}`}>{value.toFixed(2)}</td>)}</tr>)}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
      <p className="slt-feedback good">原文 Table II 全量对照：T5-base 参考结果最高，但参数约 248M；本文 T5-small 为 77M，24 fps 性能更好，12 fps 以较小 BLEU-4 下降换取约 75% 注意力复杂度节省。</p>
    </Panel>
  );
};

export const SltDecision: React.FC<WidgetProps> = () => {
  const [need, setNeed] = useState<'edge' | 'balanced' | 'quality'>('balanced');
  const msg = need === 'edge' ? '选择 12 fps：BLEU-4 9.53，换取约 75% 注意力成本节省。' : need === 'quality' ? '选择 24 fps：BLEU-4 10.06，适合质量优先。' : '平衡建议：先用 12 fps 做实时基线，再在算力允许时切到 24 fps。';
  return <Panel><div className="slt-buttons"><button className={need === 'edge' ? 'active' : ''} onClick={() => setNeed('edge')}>端侧实时</button><button className={need === 'balanced' ? 'active' : ''} onClick={() => setNeed('balanced')}>平衡</button><button className={need === 'quality' ? 'active' : ''} onClick={() => setNeed('quality')}>最高质量</button></div><p className="slt-feedback good">{msg}</p></Panel>;
};
