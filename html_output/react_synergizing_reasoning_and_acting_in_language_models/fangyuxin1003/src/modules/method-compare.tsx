import { useEffect, useState } from 'react';
import { C, CanvasScene, Chip, Controls, Feedback, line, label } from './scene-kit';

import { drawTrace } from './original-visuals';

type Mode = 'CoT' | 'Act' | 'ReAct';
const descriptions: Record<Mode, string> = {
  CoT: '脑中的计划尚未执行；写出“放到桌上”并不会改变杯子的位置。',
  Act: '直接执行动作并接收观察，没有独立的显式思考段；这里不预设它一定失败。',
  ReAct: '发现柜子为空后，计划转向台面；实际拿起和放下后，才检查任务是否完成。',
};

export function MethodCompare() {
  const [mode, setMode] = useState<Mode>('ReAct');
  const [startAt, setStartAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (startAt === null) return;
    const timer = window.setTimeout(() => setFinished(true), 18000);
    return () => window.clearTimeout(timer);
  }, [startAt]);
  function reset(next = mode) { setMode(next); setStartAt(null); setFinished(false); }
  function start() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setFinished(reduced); setStartAt(performance.now());
  }
  return <div>
    <CanvasScene clock="wall" label={`左右同步比较。左侧仅推理，右侧${mode}。${startAt === null ? '尚未开始' : finished ? '演示完成' : '正在演示轨迹'}`}
      draw={(ctx, _w, _h, time) => {
        const progress = startAt === null ? 0 : finished ? 1 : Math.max(0, Math.min(1, (time - startAt) / 18000));
        for(let side=0;side<2;side++) {
          label(ctx,side===0?'CoT · 仅推理':mode,side*540+16,30,C.text,22);
          drawTrace(ctx,side*540,48,540,225,progress,side===0?'CoT':mode,startAt===null);
        }
        line(ctx, 540, 32, 540, 248, C.border, 2);
      }} />
    <Controls>
      {(['CoT', 'Act', 'ReAct'] as Mode[]).map(item => <Chip key={item} active={mode === item} onClick={() => reset(item)}>{item === 'CoT' ? 'CoT · 仅推理' : item === 'Act' ? 'Act · 仅行动' : 'ReAct · 推理与行动'}</Chip>)}
      <button type="button" onClick={start} disabled={startAt !== null && !finished}>{startAt === null ? '开始比较' : finished ? '再次比较' : '比较中…'}</button>
      <button type="button" onClick={() => reset()}>重置</button>
    </Controls>
    <div style={{ minHeight: 112 }} aria-live="polite">
      <table className="react-comparison-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <caption style={{ textAlign: 'left', marginBottom: 8 }}>当前模式的轨迹组成</caption>
        <thead><tr><th>比较侧</th><th>显式思考</th><th>环境行动</th><th>环境观察</th></tr></thead>
        <tbody><tr><td>左侧：CoT</td><td>有</td><td>无</td><td>无</td></tr>
          <tr><td>右侧：{mode}</td><td>{mode === 'Act' ? '无' : '有'}</td><td>{mode === 'CoT' ? '无' : '有'}</td><td>{mode === 'CoT' ? '无' : '有'}</td></tr></tbody>
      </table>
    </div>
    <Feedback tone="neutral">{startAt === null ? `已选择 ${mode}，点击“开始比较”让两侧同时出发。` : `${finished ? '示意完成。' : '两侧使用同一计时。'}${descriptions[mode]}`}</Feedback>
  </div>;
}
