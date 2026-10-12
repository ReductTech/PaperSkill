import React, { useCallback, useState } from 'react';
import { C, ViperCanvas, box, clearScene, drawBook, line, label } from './viper-kit';
import { CodePane, LabStyles, PaperPhoto, Stepper, drawPhoto, usePaperImage } from './lab-kit';

const knowledgeLines = [
  'image = ImagePatch(image)',
  'toy = image.simple_query("What is this toy?")',
  'result = llm_query(',
  '    f"The real live version of {toy} does what in the winter?"',
  ')',
  'return result',
];
const knowledgeSteps = ['输入玩具照片', '识别玩具种类', '查询外部知识', '返回答案'];
const knowledgeMessages = [
  '问题问的是玩具对应的真实动物。当前只有像素，还没有物种，也没有冬季行为。',
  'simple_query 返回字符串 bear。这里识别的是熊玩具，不是从照片里直接读出“冬眠”。',
  '把 bear 填进文本问题，再调用 llm_query。知识查询接收文字，不需要重新查看图片。',
  '图5报告的返回值是 hibernate。BLIP-2 的 ski 是对整道问题的最终答案，不能当成物体识别结果。',
];

export const BearKnowledgeLab: React.FC = () => {
  const [step, setStep] = useState(0);
  const bear = usePaperImage('bear');
  const draw = useCallback((ctx:CanvasRenderingContext2D)=>{
    clearScene(ctx,1080,280);drawPhoto(ctx,bear,30,35,235,185);
    line(ctx,285,140,390,140,step>=1?C.blue:C.border,3);
    box(ctx,410,70,240,145,step>=1?'#edf3f8':'#f8f9fb',step>=1?C.blue:C.border,6);
    label(ctx,step>=1?'bear':'等待识别',470,140,step>=1?C.blue:C.muted,30);
    line(ctx,670,140,755,140,step>=2?C.blue:C.border,3);
    box(ctx,775,70,265,145,step>=3?'#edf7f0':'#f8f9fb',step>=3?C.green:C.border,6);
    label(ctx,step>=3?'hibernate':'等待知识回答',800,140,step>=3?C.green:C.muted,26);
  },[bear,step]);
  return <div className="vlab">
    <LabStyles/>
    <p className="lab-question">这个玩具对应的真实动物，冬天会做什么？</p>
    <Stepper compact labels={knowledgeSteps} step={step} onChange={setStep}/>
    <div className="lab-flow"><span>toy · 论文图5裁图</span><b>→ simple_query →</b><span>bear</span><b>→ llm_query →</b><span>hibernate</span></div><ViperCanvas draw={draw} ariaLabel={`图5熊玩具知识推理：${knowledgeSteps[step]}`}/>
    <CodePane lines={knowledgeLines} active={step===0?[0]:step===1?[1]:step===2?[2,3,4]:[5]} title="等价整理代码 · Figure 5 逻辑"/>
    {step===3&&<div className="lab-output" style={{borderColor:C.red}}><b>同一问题的 BLIP-2 最终回答</b><span className="lab-value">"ski"（滑雪）</span>论文图5的单例对照；不是对象识别结果。作者推测 ski 可能来自 winter 与 ski 的常见关联，不能当作确定因果。</div>}
    <p className="feedback" aria-live="polite">{knowledgeMessages[step]}</p>
    <p className="lab-caption">这里逐步重放图5报告的调用与返回值，不在浏览器中运行视觉模型或 GPT-3；这一示例也不表示外部知识总是正确。</p>
    <details><summary>核对图5原文与 BLIP-2 对照</summary><PaperPhoto name="figure-5" alt="原论文图5：熊玩具的视觉识别返回 bear，知识查询返回 hibernate；BLIP-2 最终答案为 ski"/><p className="lab-caption">论文 PDF 第6页，图5与 §4.3。图中对照结果：ViperGPT 为 hibernate；BLIP-2 为 ski。</p></details>
  </div>;
};

const afterLines = [
  'drop_detected = False',
  'for i, frame in enumerate(video_segment.frame_iterator()):',
  '    if frame.exists("boy") and frame.exists("sparkles") and \\',
  '       frame.simple_query("is the boy dropping the sparkles?") == "yes":',
  '        drop_detected = True',
  '        break',
  'if drop_detected:',
  '    index_frame = i + 1',
  'else:',
  '    index_frame = video_segment.num_frames // 2',
  'frame_of_interest = ImagePatch(video_segment, index_frame)',
  'boys = frame_of_interest.find("boy")',
  'if len(boys) == 0: boys = [frame_of_interest]',
  'caption = boys[0].simple_query("What is this?")',
  'info = {"Caption of frame after dropping the sparkles": caption}',
  'return select_answer(info, question, possible_answers)',
];
export const endLines = [
  'last_frame = ImagePatch(video_segment, -1)',
  'last_caption = last_frame.simple_query("What is this?")',
  'dogs = last_frame.find("dog")',
  'if len(dogs) == 0: dogs = [last_frame]',
  'dog_action = dogs[0].simple_query("What is the dog doing?")',
  'info = {"Caption of last frame": last_caption,',
  '        "Dog looks like he is doing": dog_action}',
  'return select_answer(info, question, possible_answers)',
];
const missingLines = [
  '# 教学反例：4帧内没有识别到丢落事件',
  'drop_detected = False',
  'index_frame = video_segment.num_frames // 2',
  '# 4 // 2 = 2，不再执行 + 1',
  'frame_of_interest = ImagePatch(video_segment, index_frame)',
];
type VideoMode = 'after' | 'end' | 'missing';

export const VideoFramesLab: React.FC = () => {
  const [mode, setMode] = useState<VideoMode>('after');
  const [afterFrame, setAfterFrame] = useState(25);
  const [endStep, setEndStep] = useState(0);
  const [scanFrame, setScanFrame] = useState(0);
  const frame25 = usePaperImage('after-25');
  const frame26 = usePaperImage('after-26');
  const boy = usePaperImage('boy-patch');
  const dogFrame = usePaperImage('dog-end');
  const dog = usePaperImage('dog-patch');
  const afterSelected = afterFrame === 26;
  const missingFinished = scanFrame === 3;
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearScene(ctx, 1080, 280);
    if (mode === 'after') {
      drawPhoto(ctx, frame25, 22, 20, 320, 225);
      drawPhoto(ctx, frame26, 388, 20, 320, 225);
      box(ctx, 22, 20, 320, 225, 'transparent', C.orange, 4);
      box(ctx, 388, 20, 320, 225, 'transparent', C.green, 4);
      label(ctx, '25', 164, 265, C.blue, 20);
      label(ctx, '26', 530, 265, C.blue, 20);
      line(ctx, 352, 135, 378, 135, C.green, 4);
      if (afterSelected) { drawPhoto(ctx, boy, 760, 35, 260, 205); box(ctx, 760, 35, 260, 205, 'transparent', C.green, 4); }
    } else if (mode === 'end') {
      drawPhoto(ctx, dogFrame, 28, 20, 610, 235);
      box(ctx, 28, 20, 610, 235, 'transparent', endStep === 0 ? C.orange : C.green, 4);
      label(ctx, '末帧', 43, 265, C.blue, 20);
      if (endStep >= 1) {
        drawPhoto(ctx, dog, 744, 25, 300, 220);
        box(ctx, 744, 25, 300, 220, 'transparent', endStep === 3 ? C.green : endStep === 2 ? C.blue : C.orange, 4);
        label(ctx, '犬区域', 828, 265, C.blue, 20);
        line(ctx, 648, 130, 734, 130, endStep === 3 ? C.green : endStep === 2 ? C.blue : C.orange, 3);
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const x = 25 + i * 270;
        box(ctx, x, 35, 230, 205, '#ffffff', missingFinished && i === 2 ? C.green : i === scanFrame ? C.orange : C.border, 4);
        // These silhouettes are explicitly synthetic frames, never missing source stills.
        const px = x + 72 + i * 22;
        ctx.beginPath();ctx.arc(px, 96, 17, 0, Math.PI * 2);ctx.fillStyle = C.light;ctx.fill();
        line(ctx, px, 116, px, 170, C.dark, 9);
        line(ctx, px, 133, px - 24, 151, C.dark, 7);
        line(ctx, px, 133, px + 24, 146, C.dark, 7);
        line(ctx, px, 170, px - 16, 207, C.dark, 7);
        line(ctx, px, 170, px + 19, 207, C.dark, 7);
        label(ctx, String(i), x + 106, 263, C.blue, 20);
      }
    }
  }, [mode, afterFrame, afterSelected, endStep, scanFrame, missingFinished, frame25, frame26, boy, dogFrame, dog]);
  const question = mode === 'after' ? '男孩把火花丢到地上之后，做了什么？' : mode === 'end' ? '视频最后，黑狗怎样摆放自己的身体？' : '如果整段视频都找不到丢落事件，该选哪一帧？';
  const feedback = mode === 'after'
    ? afterSelected ? '事件在索引25命中；after 取下一帧26。先查询该帧男孩区域的描述，再由 select_answer 结合问题与候选选项返回 pick it up。' : '当前查看的是事件帧25。它回答“何时丢落”，而问题问“之后”；把滑块移到26，查看程序真正选择的证据。'
    : mode === 'end'
      ? ['-1 表示视频最后一帧，论文没有给出它的绝对编号。末帧描述是 a black dog sitting in the grass。', 'find("dog") 返回图中的犬区域。若没有找到犬，原程序会用整帧作为查询对象。', '对犬区域查询动作，返回 sitting。动作描述与整帧描述一起进入 info。', 'select_answer 使用文本信息、原问题与候选选项。图6报告最终答案 Sit on the ground。'][endStep]
      : missingFinished ? '4帧全部检查完毕，drop_detected 仍是 False。直接取 4 // 2 = 2，绿色边框标出索引2；这里没有 i + 1，也没有原论文报告的答案。' : `当前检查教学示意帧${scanFrame}；尚未扫描完全部4帧，不能提前声称事件不存在。继续移动到索引3，观察中间帧回退。`;
  const fullLines = mode==='after'?afterLines:mode==='end'?endLines:missingLines;
  const visibleIndices = mode==='after'?(afterSelected?[7,10,11,12,13,14,15]:[2,3,4,5]):mode==='end'?[[0,1],[2,3],[4,5,6],[7]][endStep]:missingFinished?[2,3,4]:[0,1];
  return <div className="vlab">
    <LabStyles/>
    <div className="lab-stage" role="group" aria-label="选择视频问题">
      {([['after', '事件之后'], ['end', '视频最后'], ['missing', '未发现事件']] as const).map(([key, text]) => <button type="button" key={key} aria-pressed={mode === key} onClick={() => {setMode(key);setAfterFrame(25);setEndStep(0);setScanFrame(0);}}>{text}</button>)}
    </div>
    <p className="lab-question">{question}</p>
    {mode === 'end' ? <Stepper labels={['取最后一帧', '定位犬区域', '查询犬的动作', '选择答案']} step={endStep} onChange={setEndStep}/> : <div className="lab-output">
      <label htmlFor={`viper-frame-${mode}`}>{mode === 'after' ? `查看原文截图索引：${afterFrame}` : `检查教学示意帧索引：${scanFrame} / 3`}</label>
      <input id={`viper-frame-${mode}`} aria-label={mode === 'after' ? '查看图6帧索引25或26' : '逐帧检查4帧教学示意'} type="range" min={mode === 'after' ? 25 : 0} max={mode === 'after' ? 26 : 3} step={1} value={mode === 'after' ? afterFrame : scanFrame} onKeyDown={e => e.stopPropagation()} onChange={e => mode === 'after' ? setAfterFrame(Number(e.target.value)) : setScanFrame(Number(e.target.value))} style={{display:'block',width:'100%',marginTop:12,accentColor:C.blue}}/>
      <p className="lab-caption" style={{marginBottom:0}}>{mode === 'after' ? '仅有论文公开的25、26两张截图；此控件不重建或播放完整原视频。橙色表示当前事件帧，绿色表示所选证据。' : '以下4帧全部为教学示意；轮廓移动只用于显示帧位置，未使用原视频数据。橙色是当前检查帧，绿色是完成扫描后的回退帧。'}</p>
    </div>}
    <div className="timeline" role="img" aria-label={mode==='after'?`事件25，下一帧26，当前查看${afterFrame}`:mode==='end'?'最后一帧使用索引负一':`扫描${scanFrame}，完成后取4整除2`}>
      {mode==='after'?[24,25,26,27].map(i=><span key={i} className={i===25?'event':i===26?'evidence':''}>{i}<small>{i===25?'事件 i':i===26?'证据 i + 1':'位置示意 · 未提供截图'}</small></span>):mode==='end'?<><span>…<small>之前的帧</small></span><span className="evidence">末帧<small>at the end → −1</small></span></>:[0,1,2,3].map(i=><span key={i} className={missingFinished&&i===2?'evidence':i===scanFrame?'event':''}>{i}<small>{missingFinished&&i===2?'fallback → 4 // 2':'教学示意'}</small></span>)}
    </div>
    <ViperCanvas draw={draw} ariaLabel={mode === 'after' ? `论文图6的帧25与26，当前索引${afterFrame}${afterSelected ? '，右侧展示男孩区域' : ''}` : mode === 'end' ? `原论文黑狗末帧，推理步骤${endStep + 1}` : `4张教学示意帧，当前检查索引${scanFrame}${missingFinished ? '，回退索引2高亮' : ''}`}/>
    <div className="lab-columns">
      <CodePane lines={visibleIndices.map(i=>fullLines[i])} lineNumbers={visibleIndices.map(i=>i+1)} active={mode==='after'?(afterSelected?[0]:[0,1]):mode==='missing'?[missingFinished?0:1]:visibleIndices.map((_,i)=>i)} title="当前分支摘录 · 行号对应下方完整程序"/>
      <div>
        <div className={`lab-output ${mode === 'after' && afterSelected || mode === 'missing' && missingFinished || mode === 'end' ? 'is-good' : ''}`}>
          <b>程序选择的证据帧 index_frame</b><span className="lab-value">{mode === 'after' ? afterSelected ? '25 + 1 = 26' : '等待取下一帧26' : mode === 'end' ? '-1（最后一帧）' : missingFinished ? '4 // 2 = 2' : '扫描未完成'}</span>
          <span>{mode === 'after' ? '事件帧 i = 25；证据帧为26。' : mode === 'end' ? '与帧总数无关的末帧索引约定。' : '只有全段未命中，才进入 else 分支。'}</span>
        </div>
        <div className="lab-output"><b>送入 select_answer 的文本证据</b><span className="lab-value" style={{fontSize:18}}>{mode === 'after' ? afterSelected ? 'caption = "a child running with fire in his hands"' : '还未查询证据帧中的男孩区域' : mode === 'end' ? endStep >= 2 ? 'last_caption = "a black dog sitting in the grass"；dog_action = "sitting"' : endStep === 0 ? 'last_caption = "a black dog sitting in the grass"' : '已找到犬区域；动作尚未查询' : '不推断：教学示意没有原始候选答案和模型描述'}</span></div>
        <div className={`lab-output ${(mode === 'after' && afterSelected) || (mode === 'end' && endStep === 3) ? 'is-good' : ''}`}><b>最终答案</b><span className="lab-value">{mode === 'after' ? afterSelected ? '"pick it up"（捡起来）' : '尚未到证据帧' : mode === 'end' ? endStep === 3 ? '"Sit on the ground"（坐在地上）' : '等待 select_answer' : '未提供教学答案'}</span></div>
      </div>
    </div>
    <p className="feedback" aria-live="polite">{feedback}</p>
    <p className="lab-caption">select_answer 是论文补充的 GPT-3 接口：输入场景文本信息、问题与候选选项，选择最匹配的一项。此页只重放报告值；caption 与最终答案并不等同。</p>
    <details><summary>展开完整程序与回退分支</summary><CodePane lines={fullLines} active={visibleIndices} title="图6完整教学摘录 · 未提供原始候选选项列表"/></details>
    <details><summary>核对图6原文及完整调用链</summary><PaperPhoto name="figure-6" alt="原论文图6：男孩事件帧25到下一帧26，以及黑狗末帧动作推理的代码、截图与返回值"/><p className="lab-caption">论文 PDF 第7页，图6与 §4.4。图中只展示部分截图和执行记录；未公开完整视频序列或这一示例的完整候选选项列表。</p></details>
  </div>;
};
