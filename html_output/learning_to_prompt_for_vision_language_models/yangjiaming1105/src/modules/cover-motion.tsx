import { memo, useLayoutEffect, useRef } from 'react';
import { useLessonTimeline } from './lesson-timeline';
import './cover-motion.css';

const STEPS = [
  { name: '写下提示', caption: '人可以在提示里添一个词。CoOp 把能调整的部分写成一组向量。', note: '初始化可学习的上下文' },
  { name: '学习上下文', caption: '少量标注图片提供反馈，上下文向量随之调整，CLIP 的权重保持固定。', note: '用标注图片调整上下文' },
  { name: '固定后使用', caption: '训练结束。识别新图片时，模型直接读取这组学好的提示。', note: '用学好的上下文识别新图片' },
];
const HEIGHTS = [[36, 75, 52], [68, 37, 59], [42, 64, 30], [70, 48, 62]];
const LEARNED = [[70, 45, 64], [48, 78, 53], [64, 38, 74], [42, 68, 82]];

function easeWindow(progress: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function Lock({ size = 22 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" /><rect x="4" y="9" width="16" height="13" rx="4" fill="currentColor" /><path d="M12 14v3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>;
}

const CatArtwork = memo(function CatArtwork({ id = 'main' }: { id?: string }) {
  const field = `ce-print-field-${id}`;
  const hatching = `ce-print-hatch-${id}`;
  const light = `ce-print-light-${id}`;
  const edge = `ce-print-edge-${id}`;
  return <svg className="ce-cat-art" viewBox="0 0 250 285" role="img" aria-label="晨光里，一只橘猫坐着，向右望去">
    <defs>
      <linearGradient id={field} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#e2ddec" /><stop offset="1" stopColor="#b6b3d4" />
      </linearGradient>
      <linearGradient id={light} x1="0" y1="0" x2=".85" y2="1">
        <stop stopColor="#ffcb8c" /><stop offset=".58" stopColor="#efac6b" /><stop offset="1" stopColor="#cd7951" />
      </linearGradient>
      <pattern id={hatching} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <path d="M0 0V5" stroke="#514969" strokeWidth=".7" />
      </pattern>
      <clipPath id={edge}><rect width="250" height="285" rx="3" /></clipPath>
    </defs>
    <g clipPath={`url(#${edge})`}>
      <rect width="250" height="285" fill={`url(#${field})`} />
      <circle cx="183" cy="72" r="45" fill="#f9e2ab" />
      <circle cx="183" cy="72" r="48.5" fill="none" stroke="#f7efce" strokeWidth=".8" />
      <path d="M-18 178q60-48 120-32t158-30v104H-18Z" fill="#a49fbf" />
      <path d="M-18 178q60-48 120-32t158-30" fill="none" stroke="#e6dfea" strokeWidth="1.5" />
      <path d="M-8 209q71-44 151-31t119-7v73H-8Z" fill="#88869e" />
      <path d="M-8 210q71-44 151-31t119-7v73H-8Z" fill={`url(#${hatching})`} opacity=".28" />
      <path d="M0 235q84-21 250-9v59H0Z" fill="#4e6064"/>
      <path d="M0 244q94-26 250-9M0 252q118-28 250-7" fill="none" stroke="#adc0ae" strokeWidth=".85" opacity=".65" />
      <ellipse cx="129" cy="252" rx="77" ry="8" fill="#2f3f44" opacity=".65" />
      <g fill="none" stroke="#626480" strokeWidth="1.05" strokeLinecap="round" opacity=".75">
        <path d="M28 66q7-3 12 4 4-8 12-7m-9-13q5-2 9 3 3-6 9-5" />
      </g>
      <path d="M97 241c-26 13-66 8-71-11-3-11 7-16 16-11 9 7 26 17 46 2" fill="#c98155" stroke="#633f3e" strokeWidth="2.3" />
      <path d="M31 220c1 5 6 10 10 12m2-8c2 4 7 9 12 11m1-8 9 8" fill="none" stroke="#805449" strokeWidth="4" />
      <path d="M68 235c-8-24-1-49 14-69 14-18 29-27 35-66l41 13c21 29 19 66 14 88l2 41 10 3q6 7-2 9h-20l-5-41-9 35q-3 6-11 6H84q-13 0-16-19Z" fill={`url(#${light})`} stroke="#634644" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M151 121q26 15 24 49c-1 20-4 24-2 38-4-4-7-5-10 2l-6 27-5-22-8 12c1-21 7-35 4-53-2-18-4-34 3-53Z" fill="#f9dfad" />
      <path d="M81 175q16 3 24 13-15-6-28-5m-2 8q18 2 28 13-17-7-31-5m0 8q16 3 23 12-12-5-23-5" fill="#a76b4e" />
      <path d="M100 238q-7-20 5-31t26-3m-33 38q13-6 27-4l11 6q4 4 0 8" fill="none" stroke="#8b5a48" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M139 172q3 33 1 65l-5 12q0 4 6 4h13q4 0 3-4l-5-7 9-48" fill="#e6a46a" stroke="#825346" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m137 245 10-2 6 2 3 6-17 1q-7 0-2-7m33 1 8-2 5 3 1 4-12 1Z" fill="#f9dfad"/>
      <path d="m144 248-1 4m6-4v4m28-4v4" fill="none" stroke="#996e56" strokeWidth="1.2" />
      <path d="M110 107c-9-15-12-29-11-48 12 6 23 16 29 25 9-5 19-7 29-5 8-10 17-15 30-19l-7 32q9 9 13 22l10 8-8 8q-1 17-14 22-19 12-42 0-24-8-29-27l-7 1 4-10-7-3Z" fill={`url(#${light})`} stroke="#634644" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="m145 144 12 10 1-7 8 5 2-7q16 2 22-10c-5-13-14-16-25-10Z" fill="#fbe4bb" />
      <path d="m104 71 8 28 9-11Zm76-2-8 21-9-7Z" fill="#b57464" />
      <path d="M135 86l6 16-11-12m16-8 4 16-9-14m16-3 1 13-6-11m-39 31 18 5-17 1m0 4 15 4-13 2" fill="#985a45" />
      <path d="M135 111q9-8 19-2-9 9-18 4m35-6q8-6 14-1-5 6-13 4" fill="#f2e9ba" stroke="#514647" strokeWidth="1.9" strokeLinejoin="round" />
      <path d="m146 108 1 7 3-7m28-3 1 6 2-5" fill="#33464d"/>
      <path d="m175 119 9-1-4 6Z" fill="#825755" />
      <path d="m180 124 1 5q-5 5-11 2m11-2q4 2 7-1" fill="none" stroke="#76524b" strokeWidth="1.45" strokeLinecap="round" />
      <g fill="none" stroke="#635752" strokeWidth="1.05" strokeLinecap="round">
        <path d="m159 126-25-7m26 10-29-1m29 4-25 5m52-14 21-6m-19 9 25-2m-25 5 21 4" />
      </g>
    </g>
  </svg>;
});

const Pencil = memo(function Pencil() {
  return <g transform="scale(.47) translate(-29 -140)"><path d="M18 22h22v91l-11 27-11-27Z" fill="#e8b25b" /><path d="M18 22h7v91h-7Z" fill="#d49142" /><path d="M33 22h7v91h-7Z" fill="#f4ce83" /><rect x="18" y="4" width="22" height="19" rx="5" fill="#eb9479" /><path d="M18 22h22v10H18Z" fill="#bdc9ca" /><path d="M18 113h22l-11 27Z" fill="#f0d5ac" /><path d="m24 128 5 12 5-12Z" fill="#152d48" /></g>;
});

function WrittenWord({ progress }: { progress: number }) {
  const stroke = useRef<SVGPathElement>(null);
  const pencil = useRef<SVGGElement>(null);
  const length = useRef(0);
  const ink = easeWindow(progress, .055, .165);
  const underline = easeWindow(progress, .195, .285);
  const putDown = easeWindow(progress, .005, .055);
  const moveUnder = easeWindow(progress, .165, .195);
  const lift = easeWindow(progress, .285, .39);
  const turnPage = easeWindow(progress, .945, .99);
  const inkOpacity = 1 - turnPage;

  useLayoutEffect(() => {
    length.current = stroke.current!.getTotalLength();
  }, []);

  useLayoutEffect(() => {
    const path = stroke.current;
    if (!path || !pencil.current) return;
    // The pencil tip follows exactly the part of the glyph that already has ink.
    const point = path.getPointAtLength(ink * length.current);
    const start = path.getPointAtLength(0);
    const x = point.x + (3 + 21 * underline - point.x) * moveUnder;
    const y = point.y + (31 - point.y) * moveUnder - 5 * Math.sin(Math.PI * moveUnder);
    const parkedX = start.x + 9, parkedY = start.y - 13;
    const tipX = x + 9 * (1 - putDown) + 12 * lift;
    const tipY = y - 13 * (1 - putDown) - 24 * lift;
    const angle = 32 - 13 * putDown + 17 * lift;
    pencil.current.setAttribute('transform',
      `translate(${tipX + (parkedX - tipX) * turnPage} ${tipY + (parkedY - tipY) * turnPage}) rotate(${angle + (32 - angle) * turnPage})`);
  }, [ink, underline, putDown, moveUnder, lift, turnPage]);

  return <svg className="ce-written-word" viewBox="0 0 30 38" aria-hidden="true">
    <g opacity={inkOpacity} fill="none" stroke="#a24e2c" strokeLinecap="round" strokeLinejoin="round">
      <path ref={stroke} d="M22 13C18 8 12 11 8.6 17.2S7.2 28 11.3 26.2C16.8 24 21.2 15.7 22 12.1L18.4 23.1Q16.7 29.8 24.6 24.4" strokeWidth="2.25" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ink} opacity={ink > 0 ? 1 : 0} />
      <path d="M3 31h21" strokeWidth="1.65" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - underline} opacity={underline > 0 ? 1 : 0} />
    </g>
    <g ref={pencil} opacity={1 - .5 * lift * (1 - turnPage)}><Pencil /></g>
  </svg>;
}

function StageCopy({ stage, field }: { stage: number; field: 'caption' | 'note' }) {
  return <span className="ce-copy-stack">
    {STEPS.map((step, index) =>
      <span key={step.name} aria-hidden={stage !== index}>{step[field]}</span>
    )}
  </span>;
}

export function CoverExperience() {
  const { root, progress, stage, running, requested, play, seek } = useLessonTimeline();
  const readout = easeWindow(progress, .62, .80);
  const close = easeWindow(progress, .945, .99);
  const open = easeWindow(progress, 0, .035);
  const barOpacity = requested ? Math.min(open, 1 - close) : 1;
  return <div ref={root} className="cover-experience" data-phase={stage} data-playing={running}>
    <div className="ce-director">
      <div className="ce-mobile-photo"><CatArtwork id="compact" /></div>
      <div className="ce-director-copy">
        <h2>同一张图片，两种提示。</h2>
        <p className="ce-stage-description"><StageCopy field="caption" stage={stage} /></p>
      </div>
      {!requested && <button className="ce-playback" type="button" onClick={play} aria-label="播放封面动画">
        <svg width="19" height="19" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m5 2 13 8-13 8Z" /></svg>播放演示
      </button>}
    </div>
    <div className="ce-scene">
      <div className="ce-photo-space"><div className="ce-photo-back" /><div className="ce-photo"><CatArtwork /><div className="ce-photo-caption"><span>一张图片</span><strong>cat · 猫</strong></div></div><span className="ce-photo-note">比较的是提示，图片保持相同</span></div>
      <div className="ce-prompts">
        <div className="ce-prompt ce-manual">
          <div className="ce-prompt-heading"><strong>人工提示</strong><span>人来选择词语</span></div>
          <div className="ce-manual-line" role="img" aria-label={progress >= .165 && progress < .97 ? 'a photo of a cat' : 'a photo of cat'}>
            <span className="ce-phrase" aria-hidden="true">a photo of</span><span className="ce-word-slot"><WrittenWord progress={progress} /></span><span className="ce-class" aria-hidden="true">cat<Lock size={16} /></span>
          </div>
        </div>
        <div className="ce-prompt ce-learned">
          <div className="ce-prompt-heading"><strong>CoOp</strong><span>可学习的上下文</span></div>
          <div className="ce-learned-line">
            <div className="ce-vector-ribbon">{HEIGHTS.map((bars, index) =>
              index === 2 ? <span className="ce-vector-ellipsis" key={index} aria-label="更多上下文向量">…</span> :
              <div className="ce-vector" key={index}><b>V<sub>{index === 3 ? 'M' : index + 1}</sub></b>
                <div aria-hidden="true" style={{ opacity: barOpacity }}>{bars.map((initial, i) => {
                  const delay = (index + i) * .009;
                  const learning = easeWindow(progress, .27 + delay, .59 + delay);
                  const height = initial + (LEARNED[index][i] - initial) * learning;
                  return <i key={i} style={{ transform: `scaleY(${height / 100})` }} />;
                })}</div>
              </div>
            )}</div>
            <span className="ce-class">cat<Lock size={16} /></span>
            <span className="ce-read-pass" aria-hidden="true">
              <i style={{ left: `${readout * 100}%`, opacity: Math.sin(Math.PI * readout) }} />
            </span>
          </div>
          <div className="ce-learning-note"><span className="ce-learning-dot" aria-hidden="true" /><StageCopy field="note" stage={stage} /></div>
        </div>
      </div>
      <div className="ce-fixed-model"><span><Lock size={25} /><strong>CLIP 编码器</strong></span><b>权重始终固定</b><span className="ce-fixed-tail">学习的只有上下文</span></div>
    </div>
    <div className="ce-bottom">
      <div className="ce-steps" role="group" aria-label="封面演示阶段">
        <div className="ce-timeline" aria-hidden="true"><i className="ce-timeline-fill" style={{ transform: `scaleX(${progress})`, opacity: 1 - close }} /></div>
        {STEPS.map((item, index) => <button type="button" key={item.name} className={stage === index ? 'ce-current' : ''} aria-pressed={index === stage} onClick={() => seek(index)}>
          <span>{String(index + 1).padStart(2, '0')}</span>{item.name}
        </button>)}
      </div>
      <span className="ce-mechanism-note">教学示意，非真实数值</span>
    </div>
  </div>;
}
// Retain registry compatibility; the cover now composes one complete scene.
export function CoverMotion({ mode: _mode }: { mode: 'manual' | 'learned' }) { return <CoverExperience />; }
