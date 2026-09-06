import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', contour: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea', paper: '#ffffff',
};

type DisclosureStatus = 'protocol' | 'noDisclosedOverlap' | 'overlap' | 'na';
type NaJudgment = null | 'clean' | 'unknown';
type AuditState = { disclosureStatus: DisclosureStatus; judgment: NaJudgment };
type Tone = 'blue' | 'green' | 'red' | 'orange';

const PROFILES = {
  noDisclosedOverlap: {
    model: 'LCO-Embedding-Omni-7B', zeroShot: '100%', overlap: '0',
    video: 'fps=2，最多 64 帧', audio: '由模型处理器决定截断',
  },
  overlap: {
    model: 'ebind-full', zeroShot: '83%', overlap: '4 项',
    video: '固定 8 帧', audio: '由模型处理器决定截断',
  },
  na: {
    model: 'Qwen3-VL-Embedding-8B', zeroShot: 'NA', overlap: 'NA',
    video: 'fps=2，最多 64 帧', audio: '无音频接口',
  },
} as const;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y); ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y); ctx.closePath();
}

function clearGallery(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.light; ctx.fillRect(0, h - 22, w, 22);
}

function drawVisitor(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  rounded(ctx, x - 14, y + 10, 28, 28, 10); ctx.fill();
}

function drawExhibit(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = C.paper; rounded(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = C.wood; ctx.lineWidth = 2; rounded(ctx, x, y, w, h, 7); ctx.stroke();
}

function drawGuidePath(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawVerificationSeal(ctx: CanvasRenderingContext2D, x: number, y: number, label = '通过', color = C.green) {
  ctx.fillStyle = C.paper; ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.font = 'bold 9px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y);
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text) {
  ctx.fillStyle = color; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: Array<[string, string]>, x: number, y: number) {
  let dx = x; ctx.font = '10px "Segoe UI", sans-serif';
  items.forEach(([label, color]) => { ctx.fillStyle = color; ctx.fillRect(dx, y - 7, 8, 8); ctx.fillStyle = C.muted; ctx.fillText(label, dx + 11, y); dx += 52; });
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 2 && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value}…`;
}

function setupResponsiveCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  const ctx = setupCanvas(canvas, w, h);
  canvas.style.width = '100%'; canvas.style.maxWidth = `${w}px`; canvas.style.height = 'auto';
  return ctx;
}

function logicalPoint(event: React.PointerEvent<HTMLCanvasElement>, w: number, h: number) {
  const canvas = event.currentTarget; const rect = canvas.getBoundingClientRect();
  const px = (event.clientX - rect.left) * canvas.width / rect.width;
  const py = (event.clientY - rect.top) * canvas.height / rect.height;
  return { x: px / (canvas.width / w), y: py / (canvas.height / h) };
}

const STATUS_IDS = [
  'zero-shot-audit-status-protocol', 'zero-shot-audit-status-clear',
  'zero-shot-audit-status-overlap', 'zero-shot-audit-status-na',
];

function rove(event: React.KeyboardEvent<HTMLButtonElement>, ids: string[]) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault(); const index = ids.indexOf(event.currentTarget.id);
  const delta = event.key === 'ArrowRight' ? 1 : -1;
  document.getElementById(ids[(index + delta + ids.length) % ids.length])?.focus();
}

function AuditAnalogy() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupResponsiveCanvas(canvas, 244, 130); let raf: number | null = null; let origin = 0;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const draw = (now: number) => {
      if (!origin) origin = now; const cycle = reduced ? 1 : ((now - origin) % 2600) / 2600;
      const press = reduced ? 1 : easeInOutQuad(clamp(cycle / 0.42, 0, 1));
      clearGallery(ctx, 244, 130); drawExhibit(ctx, 112, 20, 92, 74); drawVisitor(ctx, 43, 49);
      drawSceneLabel(ctx, '披露', 124, 42); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(126, 51, 52, 15);
      const stampY = 24 + press * 24; ctx.fillStyle = C.wood; ctx.fillRect(181, stampY, 8, 22); ctx.fillRect(174, stampY + 18, 22, 7);
      drawGuidePath(ctx, 185, 28, 185, 48, C.blue);
      if (press > 0.85) { drawVerificationSeal(ctx, 187, 72, '核验'); drawSceneLabel(ctx, '可核验', 154, 102, C.green); }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(draw); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, []);
  return <canvas ref={ref} width={244} height={130} aria-label="一名检查员把印章盖到展签的披露区域，只有可核验证据才出现绿色印记。" />;
}

function AuditModule({ chapterId, moduleId }: WidgetProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<AuditState>({ disclosureStatus: 'protocol', judgment: null });
  const profile = state.disclosureStatus === 'protocol' ? null : PROFILES[state.disclosureStatus];

  const feedback: { tone: Tone; text: string } = (() => {
    if (state.judgment === 'clean') return { tone: 'red', text: '判断错误：没有披露不等于没有重叠；NA 必须保留为未知。' };
    if (state.judgment === 'unknown') return { tone: 'green', text: '判断正确：保留 NA，并在比较时显式提示披露缺口。' };
    if (state.disclosureStatus === 'noDisclosedOverlap') return { tone: 'green', text: '在已披露的数据集清单中未见 MVEB 重叠；这支持披露范围内的核验，但不是对所有未公开训练数据的绝对证明。' };
    if (state.disclosureStatus === 'overlap') return { tone: 'orange', text: '披露发现训练—评测重叠：分数仍可报告，但相关任务不能认证为无污染零样本。' };
    if (state.disclosureStatus === 'na') return { tone: 'red', text: '无法认证：NA 表示缺少数据集级训练数据披露，不是“100% 零样本”。' };
    return { tone: 'blue', text: '执行层零样本：使用默认冻结嵌入，不做单任务微调；是否可认证“无污染”还要另查训练数据披露。' };
  })();

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const ctx = setupResponsiveCanvas(canvas, 560, 240);
    const draw = () => {
      clearGallery(ctx, 560, 240);
      [[16,24,154,156],[184,24,226,156],[424,24,120,156]].forEach(([x,y,w,h]) => { ctx.fillStyle=C.paper; rounded(ctx,x,y,w,h); ctx.fill(); ctx.strokeStyle=C.border; ctx.lineWidth=1; rounded(ctx,x,y,w,h); ctx.stroke(); });
      drawSceneLabel(ctx, '执行协议', 28, 43, C.blue);
      ['默认输出','冻结嵌入','任务指标'].forEach((label, i) => { const y=58+i*39; ctx.fillStyle=state.disclosureStatus==='protocol'?C.blue:C.bg; rounded(ctx,32,y,120,26,6); ctx.fill(); ctx.strokeStyle=C.blue; ctx.stroke(); ctx.fillStyle=state.disclosureStatus==='protocol'?C.paper:C.text; ctx.font='12px "Segoe UI",sans-serif'; ctx.textAlign='center'; ctx.fillText(label,92,y+17); if(i<2) drawGuidePath(ctx,92,y+27,92,y+38,C.blue); });
      ctx.textAlign='left'; drawSceneLabel(ctx, '模型披露卡', 198, 43, C.text);
      if (profile) {
        ctx.font='bold 12px "Segoe UI",sans-serif'; ctx.fillStyle=C.blue; ctx.fillText(fit(ctx, profile.model, 192),198,64);
        ctx.font='11px "Segoe UI",sans-serif'; ctx.fillStyle=C.text;
        [`披露零样本：${profile.zeroShot}`,`披露重叠：${profile.overlap}`,`视频：${profile.video}`,`音频：${profile.audio}`].forEach((line,i)=>ctx.fillText(fit(ctx,line,196),198,88+i*20));
        if (state.disclosureStatus==='noDisclosedOverlap') drawVerificationSeal(ctx,382,61,'可核验');
        else { const color=state.disclosureStatus==='overlap'?C.orange:C.red; drawVerificationSeal(ctx,382,61,state.disclosureStatus==='na'?'NA':'重叠',color); }
      } else {
        ctx.fillStyle=C.muted; ctx.font='12px "Segoe UI",sans-serif'; ctx.fillText('选择披露组，读取代表模型配置',198,78);
        ctx.strokeStyle=C.border; ctx.setLineDash([4,4]); rounded(ctx,198,91,190,60); ctx.stroke(); ctx.setLineDash([]);
      }
      drawSceneLabel(ctx, '33 个模型', 438, 43, C.text);
      const segments: Array<[DisclosureStatus,string,number,string]> = [
        ['noDisclosedOverlap','11 未见',52,C.green],['overlap','15 重叠',71,C.orange],['na','7 未知',33,C.red],
      ];
      let y=50; segments.forEach(([key,label,height,color])=>{ ctx.fillStyle=state.disclosureStatus===key?color:C.bg; ctx.strokeStyle=color; ctx.lineWidth=state.disclosureStatus===key?3:1; ctx.fillRect(439,y,90,height); ctx.strokeRect(439,y,90,height); ctx.fillStyle=state.disclosureStatus===key?C.paper:C.text; ctx.font='11px "Segoe UI",sans-serif'; ctx.textAlign='center'; ctx.fillText(label,484,y+height/2+4); y+=height; });
      ctx.fillStyle=C.paper; rounded(ctx,16,192,528,32,6); ctx.fill(); ctx.strokeStyle=C.border; ctx.lineWidth=1; rounded(ctx,16,192,528,32,6); ctx.stroke();
      ctx.fillStyle=C.text; ctx.font='11px "Segoe UI",sans-serif'; ctx.textAlign='left'; ctx.fillText('33 个模型：11 / 15 / 7；配置按模型声明，不强行统一预算',28,212);
      drawLegend(ctx, [['当前',C.blue],['可核验',C.green],['未知',C.red]], 354, 212);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); return disconnect;
  }, [state]);

  const choose = (status: DisclosureStatus) => setState({ disclosureStatus: status, judgment: null });
  const onCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const p = logicalPoint(event, 560, 240);
    if (p.x >= 16 && p.x <= 170 && p.y >= 24 && p.y <= 180) choose('protocol');
    if (p.x >= 424 && p.x <= 544 && p.y >= 50 && p.y < 102) choose('noDisclosedOverlap');
    if (p.x >= 424 && p.x <= 544 && p.y >= 102 && p.y < 173) choose('overlap');
    if (p.x >= 424 && p.x <= 544 && p.y >= 173 && p.y <= 206) choose('na');
  };
  const button = (id: string, label: string, status: DisclosureStatus) => (
    <button id={id} className={`chip ${state.disclosureStatus===status?'selected':''}`} aria-pressed={state.disclosureStatus===status} onClick={()=>choose(status)} onKeyDown={(e)=>rove(e,STATUS_IDS)}>{label}</button>
  );
  const detailStyle: React.CSSProperties = { margin:'8px 0', padding:'9px 12px', border:'1px solid #d7deea', borderRadius:8, color:C.text, background:C.bg, fontSize:14 };
  return <div>
    <div className="ctrl" role="group" aria-label="选择审计视图">
      {button(STATUS_IDS[0], '执行协议', 'protocol')}
      {button(STATUS_IDS[1], '披露清单中未见重叠 · 11', 'noDisclosedOverlap')}
      {button(STATUS_IDS[2], '已披露重叠 · 15', 'overlap')}
      {button(STATUS_IDS[3], '数据集级披露不足 · 7', 'na')}
    </div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={560} height={240} onPointerDown={onCanvasPointer} aria-label={`零样本审计图。当前视图：${state.disclosureStatus}。${feedback.text}`} />
    {profile && <div style={detailStyle}><strong>{profile.model}</strong>｜披露零样本 {profile.zeroShot}｜披露重叠 {profile.overlap}｜视频 {profile.video}｜音频 {profile.audio}</div>}
    <div className="ctrl" role="group" aria-label="判断 NA 的含义">
      <span id="zero-shot-audit-answer-help">判断：NA 能否当作没有重叠？</span>
      <button id="zero-shot-audit-answer-clean" className="tiny ghost" disabled={state.disclosureStatus!=='na'} aria-describedby="zero-shot-audit-answer-help" onClick={()=>setState(s=>({...s,judgment:'clean'}))}>NA = 没有重叠</button>
      <button id="zero-shot-audit-answer-unknown" className="tiny ghost" disabled={state.disclosureStatus!=='na'} aria-describedby="zero-shot-audit-answer-help" onClick={()=>setState(s=>({...s,judgment:'unknown'}))}>NA = 无法判断</button>
      {state.disclosureStatus!=='na' && <small>先选择“数据集级披露不足 · 7”再判断。</small>}
    </div>
    <div role="status" aria-live="polite" className={`feedback ${feedback.tone==='green'?'good':feedback.tone==='red'?'bad':''}`} style={feedback.tone==='orange'?{color:C.orange,borderLeftColor:C.orange,background:'#fff7ed'}:undefined}>{feedback.text}</div>
  </div>;
}

export const ZeroShotAudit: React.FC<WidgetProps> = (props) => props.moduleId === 'ana' ? <AuditAnalogy /> : <AuditModule {...props} />;
export default ZeroShotAudit;
