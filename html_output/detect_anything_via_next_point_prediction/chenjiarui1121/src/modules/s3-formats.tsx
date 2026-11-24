import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { AllBirds, BIRDS, BoxRect, C, LakeScene, SPECIAL, TokenChip, boxTokens, tokX, tokY, type Box, type TokenKind } from './rex-kit';

type Tok = [string, TokenKind];
type TaskId = 'point' | 'box' | 'poly' | 'kpt' | 'visual';
const byKind = (k: string) => BIRDS.filter(b => b.kind === k).map(b => b.box).sort((a, b) => a[0] - b[0]);
const pt = (x: number, y: number): Tok[] => [[`<${tokX(x)}>`, 'coord'], [`<${tokY(y)}>`, 'coord']];
const bx = (b: Box): Tok[] => boxTokens(b).map(k => [`<${k}>`, 'coord'] as Tok);
const wrap = (phrase: string, coords: Tok[]): Tok[] => [[SPECIAL.ps, 'special'], [phrase, 'phrase'], [SPECIAL.pe, 'special'], [SPECIAL.cs, 'special'], ...coords, [SPECIAL.ce, 'special']];
const join = (groups: Tok[][]): Tok[] => groups.flatMap((g, i) => i ? [[',', 'text'] as Tok, ...g] : g);

const gulls = byKind('gull').map(b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] as [number, number]);
const ducks = byKind('duck');
const egrets = byKind('egret');
const ROCK: [number, number][] = [[98, 388], [118, 336], [180, 322], [262, 318], [304, 356], [304, 388]];
const KPT = { head: [826, 231], beak: [868, 228], foot: [833, 360] } as const;
const PROMPT_BOX = egrets[2];

const TASKS: Record<TaskId, { name: string; ask: string; input?: Tok[]; out: Tok[]; coords: number; text: string }> = {
  point: { name: '指点', ask: '指出“海鸥”', out: wrap('海鸥', join(gulls.map(([x, y]) => pt(x, y)))), coords: 4,
    text: '每只海鸥只要 1 个点，也就是 2 个坐标词元。论文里的物体指点、可供性指点和 GUI 点击位置都用这种格式。' },
  box: { name: '检测框', ask: '检测“野鸭, 天鹅”', coords: 12,
    out: join([wrap('野鸭', join(ducks.map(bx))), wrap('天鹅', [['None', 'bad']])]),
    text: '每个框是 [x0, y0, x1, y1] 两个角点、4 个坐标词元，多个框按 x0 从左到右排列。照片里没有天鹅，坐标位置就写 None。' },
  poly: { name: '多边形', ask: '圈出“岩石”轮廓', coords: 12,
    out: wrap('岩石', ROCK.flatMap(([x, y]) => pt(x, y))),
    text: '多边形用 4 个以上的点围出轮廓。论文的 OCR 任务用它圈出弯曲的文字行，坐标仍然是同一套 <0>…<999> 词元。' },
  kpt: { name: '关键点', ask: '白鹭的头、喙、脚', coords: 10,
    out: [['{"白鹭1": {"box":', 'text'], ...bx(egrets[4]), ['"keypoints": {"头":', 'text'], ...pt(...KPT.head), ['"喙":', 'text'], ...pt(...KPT.beak), ['"脚":', 'text'], ...pt(...KPT.foot), ['}}}', 'text']],
    text: '关键点任务输出 JSON：先给整只鸟的框，再给每个部位的点。结构变复杂了，坐标的写法没有变。' },
  visual: { name: '视觉提示', ask: '找出与示例框同类的鸟', coords: 20,
    input: [['示例框：', 'text'], ...bx(PROMPT_BOX), ['请找出所有同类目标', 'text']],
    out: wrap('object1', join(egrets.map(bx))),
    text: '用户画的示例框先被量化成坐标词元写进指令，模型再用同样的格式输出所有同类目标——视觉提示也变成了“读词元、写词元”。' },
};
const ORDER: TaskId[] = ['point', 'box', 'poly', 'kpt', 'visual'];

export function S3Formats(_: WidgetProps) {
  const [task, setTask] = useState<TaskId>('box');
  const t = TASKS[task];
  return <div className="rx-page rx-s3">
    <div className="rx-s3-cards" role="group" aria-label="选择任务">
      {ORDER.map(id => <button key={id} className={`rx-card ${task === id ? 'is-on' : ''}`} aria-pressed={task === id} onClick={() => setTask(id)}>
        <b>{TASKS[id].name}</b><span>{TASKS[id].ask}</span></button>)}
    </div>
    <div className="rx-s3-main">
      <div className="rx-s3-top">
        <svg viewBox="0 0 1000 560" width="640" height="358" role="img" aria-label={`${t.name}任务的几何输出`}>
          <LakeScene><AllBirds /></LakeScene>
          <g key={task} className="rx-fade-in">
            {task === 'point' && gulls.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="13" fill={C.orange} stroke="#fff" strokeWidth="4" />)}
            {task === 'box' && ducks.map((b, i) => <BoxRect key={i} box={b} color={C.green} width={6} />)}
            {task === 'poly' && <polygon points={ROCK.map(p => p.join(',')).join(' ')} fill={C.green} fillOpacity=".15" stroke={C.green} strokeWidth="6" />}
            {task === 'poly' && ROCK.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill={C.green} />)}
            {task === 'kpt' && <><BoxRect box={egrets[4]} color={C.green} width={5} />
              {Object.values(KPT).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" fill={C.orange} stroke="#fff" strokeWidth="3" />)}</>}
            {task === 'visual' && <>{egrets.map((b, i) => <BoxRect key={i} box={b} color={C.green} width={5} />)}
              <BoxRect box={PROMPT_BOX} color={C.orange} width={8} dashed /></>}
          </g>
        </svg>
        <div className="rx-s3-explain">
          <p className="rx-text">{t.text}</p>
          <p className="rx-h rx-blue">{t.coords} 个坐标词元</p>
          <p className="rx-text rx-muted"><TokenChip text="P…P/" kind="special" /> 包住短语，<TokenChip text="C…C/" kind="special" /> 包住坐标</p>
        </div>
      </div>
      <div className="rx-notebook" aria-live="polite">
        {t.input && <div className="rx-tokline"><span className="rx-tokline-tag">输入</span>{t.input.map(([s, k], i) => <TokenChip key={i} text={s} kind={k} />)}</div>}
        <div className="rx-tokline"><span className="rx-tokline-tag">输出</span>{t.out.map(([s, k], i) => <TokenChip key={i} text={s} kind={k} />)}</div>
      </div>
    </div>
  </div>;
}
