import { useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, MatrixTable, SpectrumView, Detail, WidgetFrame, fmt, palette, drawPhotoCue } from './shared';
import { X0, LINEAR_W, LINEAR_B, affine, center, readM02, saveM02 } from './math';

export function ValueLineExplorer() {
  const [values, setValues] = useState<number[]>(() => readM02() ?? [...X0]);
  const [mode, setMode] = useState('affine');
  const [text, setText] = useState(() => String((readM02() ?? X0)[4]));
  const [notice, setNotice] = useState('');
  const dragging = useRef(false);
  const matrix = useMemo(() => mode === 'centered' ? center(affine(values)) : affine(values, mode !== 'linear'), [values, mode]);
  const update = (next: number[]) => { setValues(next); saveM02(next); };
  const setLast = (raw: number, rounded = false) => {
    const clamped = Math.max(-3, Math.min(3, raw));
    const nextValue = rounded ? Math.round(clamped * 10) / 10 : clamped;
    const next = [...values]; next[4] = nextValue;
    update(next); setText(String(nextValue));
    setNotice(raw !== clamped ? '有效范围为 −3～3，已限制到最近边界。' : '');
  };
  const pointerValue = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    setLast((fraction - 0.065) / 0.50 * 6 - 3, true);
  };
  const reset = () => { update([...X0]); setText('2'); setMode('affine'); setNotice(''); };
  const stage = mode === 'linear' ? '线性（无偏置），LN 前' : mode === 'affine' ? '仿射（有偏置），未中心化，LN 前' : '仿射后按样本中心化，LN 前';
  return <WidgetFrame id="M02-value-line">
    <Source kind="I + T" loc="p3 命题3.1；pp12–13 附录B.2">共享标量映射的机制算例；矩阵与谱由公式实算。</Source>
    <p><strong>拖动左侧橙色标记</strong>，或编辑“第5个数值”。右侧只画前两坐标；秩由下方完整 5×4 矩阵计算。</p>
    <Chips label="观察模式" value={mode} onChange={setMode} options={[{ value:'linear', label:'线性（无偏置）' },{ value:'affine', label:'仿射（有偏置）' },{ value:'centered', label:'仿射后中心化' }]} />
    <Canvas label="输入数值滑轨与表示的二维投影，橙色点可拖动；下方数字框提供键盘等价操作" height={230} style={{ touchAction:'none', cursor:'ew-resize' }}
      onPointerDown={event => { const rect=event.currentTarget.getBoundingClientRect(); if ((event.clientX-rect.left)/rect.width > .60) return; dragging.current=true; event.currentTarget.setPointerCapture(event.pointerId); pointerValue(event); }}
      onPointerMove={event => { if (dragging.current) pointerValue(event); }}
      onPointerUp={event => { dragging.current=false; if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { dragging.current=false; }}
      draw={(ctx,w,h) => {
        const left=w*.065, right=w*.565, y=h*.58;
        ctx.strokeStyle=palette.line; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(left,y); ctx.lineTo(right,y); ctx.stroke();
        ctx.fillStyle=palette.ink; ctx.font='14px sans-serif'; ctx.fillText('二维投影',w*.69,25);
        for(let i=-3;i<=3;i++){ const x=left+(i+3)/6*(right-left); ctx.beginPath(); ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();ctx.fillStyle=palette.muted;ctx.fillText(String(i),x-4,y+25); }
        values.forEach((value,i)=>{ const x=left+(value+3)/6*(right-left); ctx.beginPath(); ctx.arc(x,y,i===4?9:5,0,2*Math.PI); ctx.fillStyle=i===4?palette.orange:palette.blue;ctx.fill();if(i===4){ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle=palette.line;} });
        drawPhotoCue(ctx, left+(values[4]+3)/6*(right-left), h*.83, Math.min(44,w*.075),.5);
        const ox=w*.77, oy=h*.62, sx=w*.034, sy=h*.043;
        ctx.strokeStyle=palette.line;ctx.beginPath();ctx.moveTo(w*.63,oy);ctx.lineTo(w*.97,oy);ctx.moveTo(ox,h*.18);ctx.lineTo(ox,h*.9);ctx.stroke();
        const ordered=[...matrix].sort((a,b)=>a[0]-b[0]); ctx.strokeStyle=palette.blue;ctx.lineWidth=1.5;ctx.beginPath();ordered.forEach((row,i)=>{const px=ox+row[0]*sx, py=oy-row[1]*sy;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();
        matrix.forEach((row,i)=>{ctx.beginPath();ctx.arc(ox+row[0]*sx,oy-row[1]*sy,i===4?7:4,0,2*Math.PI);ctx.fillStyle=i===4?palette.orange:palette.blue;ctx.fill();if(i===4){ctx.strokeStyle=palette.ink;ctx.stroke();}});
      }} />
    <Controls><label>第5个数值 <input aria-label="第5个数值" type="number" min={-3} max={3} step={0.1} value={text} style={{width:100}} onChange={event=>{const raw=event.target.value;setText(raw);if(raw.trim()===''||!Number.isFinite(Number(raw))){setNotice('请输入有限数字；图形保留上次有效值。');return;}setLast(Number(raw));}} /></label><Button onClick={()=>{update([1,1,1,1,1]);setText('1');setNotice('已切换为常数列；选择“仿射后中心化”查看零矩阵。');}}>常数列</Button><Button onClick={reset}>重置本模块</Button></Controls>
    <p aria-live="polite">当前输入：[{values.map(v=>fmt(v,2)).join(', ')}]　·　<strong>{stage}</strong></p>
    {notice && <Feedback>{notice}</Feedback>}
    <p><code>{mode==='centered'?'Zc = (x − mean(x)) wᵀ':mode==='linear'?'Z = xwᵀ':'Z = xwᵀ + 1bᵀ'}</code></p>
    <MatrixTable matrix={matrix} label="完整表示矩阵（5个样本 × 4个通道）" headers={['通道1','通道2','通道3','通道4']} />
    <SpectrumView matrix={matrix} label="完整矩阵的奇异值与数值秩" />
    <Feedback>{mode==='centered' ? (values.every(v=>v===values[0])?'常数列按样本中心化后为零矩阵，数值秩为 0；“至多1”包含退化情形。':'现在是同一列、共享仿射映射、LN 之前；按样本中心化后只剩沿 w 的变化，秩至多 1。') : mode==='linear'?'无偏置时，每行都是同一个 w 的倍数；4 个通道不等于 4 个独立方向。':'未中心化的共享仿射矩阵秩至多 2。默认例子是 2，因此不能说所有嵌入始终秩为 1。'}</Feedback>
    <Detail title="参数、条件与投影的限制"><p>w = [{LINEAR_W.join(', ')}]，b = [{LINEAR_B.join(', ')}]；仅改变输入值，不训练参数。按样本中心化是对每个通道减去5行均值。</p><p>左侧相机只是单一位置变量的教学类比。右侧二维投影可能隐藏其他方向，因此不能靠这张散点图判断完整矩阵秩。</p><p>本例没有 LayerNorm、多头注意力、残差或 FFN。固定列的位置向量在同列中心化时抵消；结论不能无条件延伸到这些后续层。最新有效输入会保存在本标签页，后续模块需明确选择才会沿用。</p></Detail>
  </WidgetFrame>;
}

