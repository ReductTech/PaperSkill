import React, { useState } from 'react';
import { Canvas, Choices, Feedback, Route, P, field, rect, line, label, arrow, dot, beaker, testTube, alcoholLamp, clamp } from './lab-scenes';
import { Sequence, mix, ease, robot, vesselAtGrip, bench, protocol, protocolSteps, protocolStep, pipette, sampleTube, actionPose, type Frame } from './animation-kit';
type G = CanvasRenderingContext2D;

const placeSteps = ['靠近并抓住烧杯', '抬起烧杯', '移动到平台上方', '放下烧杯并松开', '撤回机械臂，烧杯留在平台'];
export function HeroSolution() {
  return <><div className="lab-cover-route"><span>RoboGenesis</span><span>LabEmbodied-Data</span><span>LabVLA</span></div>
    <Sequence compact steps={placeSteps} durations={[1800, 1500, 1800, 1800, 2400]}>{({ step, part }) =>
      <Canvas w={480} h={280} animated={false} title="机械臂抓起烧杯，放到平台上，松开后撤回" draw={c => {
        field(c, 480, 280);
        rect(c, 315, 214, 130, 22, P.soft, P.green, 5); label(c, '放置平台', 380, 258, P.green, 16);
        const start = { x: 217, y: 213 }, end = { x: 367, y: 191 }, off = 27;
        const p = ease(part); let x = start.x, y = start.y - off, open = 0;
        if (step === 0) { x = mix(176, start.x, ease(part / .65)); y = mix(131, start.y - off, ease(part / .65)); open = 1 - clamp((part - .65) / .35); }
        if (step === 1) y -= p * 73;
        if (step === 2) { x = mix(start.x, end.x, p); y = start.y - off - 73; }
        if (step === 3) { x = end.x; y = mix(start.y - off - 73, end.y - off, ease(part / .65)); open = clamp((part - .65) / .35); }
        if (step === 4) { x = mix(end.x, 224, p); y = mix(end.y - off, 99, p); open = 1; }
        const held = step === 1 || step === 2 || (step === 3 && part < .72);
        if (!held) beaker(c, step >= 3 ? end.x : start.x, step >= 3 ? end.y : start.y, .5, .52, P.green);
        const wrist = robot(c, 95, 229, x, y, { scale: 1.17, gripScale: .6, open });
        if (held) vesselAtGrip(c, wrist.x, wrist.y, .52, 0, .5, .6);
        label(c, step === 4 ? '放置完成' : '从指令到实际放置', 272, 29, step === 4 ? P.green : P.blue, 18);
      }} />
    }</Sequence><div className="lab-cover-caption">通用先验与实验室示范 · 两阶段策略训练</div></>;
}

function dualRobot(c: G, p: number) {
  // Two mirrored shoulders attached to one torso; neither arm originates from the other.
  rect(c, 447, 219, 110, 61, '#dfe7ed', P.blue, 12);
  rect(c, 433, 282, 138, 17, '#bccbd6', P.blue, 4);
  rect(c, 458, 184, 88, 27, '#edf2f6', P.blue, 6);
  line(c, 445, 224, 559, 224, P.blue, 12);
  const y = 173 - Math.sin(p * Math.PI * 2) * 13;
  const left = robot(c, 447, 224, 382, y, { scale: .61, bend: 1, shoulder: true, base: false, gripScale: .5 });
  const right = robot(c, 557, 224, 622, y, { scale: .61, bend: -1, shoulder: true, base: false, color: P.green, gripScale: .5 });
  vesselAtGrip(c, left.x, left.y, .5, 0, .4, .5);
  vesselAtGrip(c, right.x, right.y, .3, 0, .4, .5);
  label(c, '左肩', 443, 252, P.muted, 15); label(c, '右肩', 560, 252, P.muted, 15);
}

export function Problems() {
  const [mode, set] = useState(0);
  return <><Choices items={['领域数据与采集', '机器人形态差异', '从流程到连续控制']} value={mode} set={set} />
    {mode === 2 ? <Sequence key="protocol" steps={protocolSteps} durations={[2600, 4300, 7000, 2800]}>{f =>
      <Canvas h={430} animated={false} title="机械臂依次抓取、倒液、放上加热台、按下加热键，书面步骤同步高亮" draw={c => {
        field(c, 1000, 430); const progress = (f.step + f.part) / 4;
        c.save(); c.translate(0, 45); protocol(c, progress); c.restore();
        label(c, '连续操作与物理状态变化', 315, 28, P.blue, 21);
        label(c, '书面实验流程', 802, 28, P.blue, 21);
        protocolSteps.forEach((v, i) => {
          rect(c, 664, 75 + i * 73, 302, 54, i === f.step ? '#e9f3e7' : '#fff', i === f.step ? P.green : P.line);
          label(c, `${i + 1}  ${v}`, 815, 102 + i * 73, i === f.step ? P.green : P.blue, 20);
        });
        arrow(c, 643, 103 + f.step * 73, 622, 103 + f.step * 73, P.green);
      }} />
    }</Sequence> : <Sequence key={mode} steps={mode ? ['不同形态，共享任务目标', '两臂分别连接左右肩部', '机器人配置适配执行方式'] : ['通用示范覆盖不足', '实验室采集依赖专业条件']}>
      {f => <Canvas h={370} animated={false} title={mode ? '单臂、带共同躯干的双臂、移动操作机器人' : '通用示范与实验室操作的差距'} draw={c => {
        field(c, 1000, 370);
        if (mode === 0) {
          rect(c, 35, 70, 290, 210, '#fff', P.line); beaker(c, 128, 210, .7); rect(c, 211, 174, 65, 60, P.soft, P.blue);
          label(c, '通用桌面示范', 180, 41); arrow(c, 351, 170, 415, 170, P.red); line(c, 387, 142, 387, 198, P.red, 4);
          bench(c, 442, 290, 510); beaker(c, 510, 259, .67); testTube(c, 610, 253, .65); alcoholLamp(c, 710, 262, .68);
          robot(c, 888, 278, 801, 161 - Math.sin(f.progress * Math.PI * 2) * 15, { scale: .55, gripScale: .5 });
          label(c, '仪器、透明液体与实验流程', 701, 40, P.blue, 21);
          label(c, '设备 · 标定 · 专业监督 · 安全成本', 701, 344, P.muted, 18);
        } else {
          label(c, '单臂', 161, 44); label(c, '双臂：共用躯干、独立关节链', 505, 44, P.blue, 20); label(c, '移动操作', 858, 44);
          bench(c, 30, 307, 258); const a = robot(c, 93, 291, 207, 185 + Math.sin(f.progress * 6) * 12, { scale: .68, gripScale: .55 });
          vesselAtGrip(c, a.x, a.y, .5, 0, .45, .55); dualRobot(c, f.progress);
          rect(c, 778, 280, 154, 36, '#d8e2e9', P.blue); dot(c, 800, 323, 13); dot(c, 907, 323, 13);
          const b = robot(c, 808, 277, 900, 167, { scale: .63, gripScale: .5 }); vesselAtGrip(c, b.x, b.y, .5, 0, .4, .5);
          label(c, '相机、夹爪、可达范围与动作格式分别适配', 500, 351, P.muted, 19);
        }
      }} />}
    </Sequence>}
    <Feedback>{[
      '通用桌面数据很少覆盖实验仪器、透明液体和完整流程；真实采集又依赖专业设备、标定、监督与安全流程。',
      '双臂机器人的两条关节链分别连接左右肩部，共用躯干和底座。图中展示结构差异；实际适配还需要各自的相机、末端与控制配置。',
      '同一句实验要求要展开为连续动作：先抓取，再转移液体，将接收烧杯放到加热台，最后按键。每一步都改变下一步面对的物理状态。'
    ][mode]}</Feedback></>;
}

const workflowLabels = ['自然语言指令', '原子技能与任务模板', '候选工作流', '离线校验与人工审阅'];
const annotationLabels = ['子任务与时间段', '对象状态与语义', '相机与空间信息', '动作与成功判定'];

function sceneAssets(c: G, frame: Frame) {
  const { step, part } = frame;
  const assetXs = [82, 184, 286];
  assetXs.forEach((x, i) => {
    rect(c, x - 44, 112, 88, 152, '#fff', step === 0 && Math.floor(part * 3) === i ? P.green : P.line);
    c.save(); c.globalAlpha = step === 0 ? .25 + .75 * clamp(part * 3 - i + .5) : 1;
    if (i === 0) beaker(c, x, 183, .61); if (i === 1) testTube(c, x, 178, .6); if (i === 2) alcoholLamp(c, x, 190, .6);
    c.restore(); label(c, ['烧杯', '试管', '酒精灯'][i], x, 240, P.blue, 18);
  });
  label(c, '器具资产库', 184, 57); arrow(c, 346, 191, 385, 191);
  // The right side is a furnished scene, with each selected asset occupying a real place.
  rect(c, 405, 90, 550, 234, '#fafcf7', P.line);
  rect(c, 763, 115, 153, 12, '#d8e2d1', P.line, 2);
  rect(c, 783, 77, 22, 37, '#e9efdf', P.line, 2); rect(c, 828, 87, 37, 27, '#f3e8d8', P.line, 2);
  bench(c, 408, 337, 552);
  const arrangement = step === 0 ? 0 : step === 1 ? ease(part) : 1;
  c.save(); c.globalAlpha = step === 0 ? .12 : 1;
  const vesselX = mix(717, 700, arrangement), tubeX = mix(746, 809, arrangement), lampX = mix(753, 913, arrangement);
  rect(c, 781, 294, 58, 41, '#dce4e9', P.blue, 3);
  testTube(c, tubeX, 297, .66); alcoholLamp(c, lampX, 301, .7);
  if (step === 2) {
    c.setLineDash([6, 5]); c.strokeStyle = P.green; c.beginPath(); c.ellipse(579, 253, 160, 79, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    [700, 810, 913].forEach(x => { line(c, x - 8, 351, x - 2, 357, P.green, 3); line(c, x - 2, 357, x + 11, 344, P.green, 3); });
  }
  let wx = 631, wy = 207, held = false, open = 1;
  if (step === 3) {
    const p = part, reach = ease(p / .3), lift = ease((p - .4) / .25), lower = ease((p - .72) / .2);
    wx = mix(631, 700, reach); wy = mix(207, 307 - 36, reach) - 70 * lift * (1 - lower);
    held = p > .4 && p < .93; open = p < .4 ? 1 - clamp((p - .3) / .1) : clamp((p - .93) / .07);
  }
  if (!held) beaker(c, vesselX, 307, .66);
  const wrist = robot(c, 495, 326, wx, wy, { scale: .94, open });
  if (held) vesselAtGrip(c, wrist.x, wrist.y, .5, 0, .66);
  c.restore();
  label(c, ['等待器具资产', '分配台面位置与器具角色', '可达、无碰撞、稳定接触', '在场景中试运行抓取'][step], 684, 55, step >= 2 ? P.green : P.blue, 20);
  label(c, '实验台、试管架与器具共同组成可执行场景', 683, 393, P.muted, 17);
}

export function Genesis() {
  const [stage, set] = useState(0);
  return <><Route items={['环境构建', '工作流生成', '结构化导出']} active={stage} />
    <Choices items={['环境构建', '工作流生成', '示范与标注']} value={stage} set={set} />
    {stage === 0 ? <Sequence key="environment" steps={['生成器具资产', '布置实验台', '检查布局与物理约束', '试运行抓取']} durations={[2700, 3300, 2800, 4400]}>{f =>
      <Canvas h={430} animated={false} title="生成烧杯、试管和酒精灯，布置实验台、检查位置并试运行抓取" draw={c => { field(c, 1000, 430); sceneAssets(c, f); }} />
    }</Sequence> : stage === 1 ? <Sequence key="workflow" steps={['读取实验指令', '选择技能与模板', '生成候选流程', '校验并交由人工审阅', '执行已审阅流程']} durations={[2200, 2400, 2400, 2800, 14000]}>{f =>
      <Canvas h={430} animated={false} title="从指令选择技能、形成候选流程、检查与审阅，再执行抓取倒液放置按键" draw={c => {
        field(c, 1000, 430);
        workflowLabels.forEach((v, i) => {
          rect(c, 20, 64 + i * 82, 294, 63, '#fff', Math.min(f.step, 3) === i ? P.green : P.line);
          label(c, v, 167, 86 + i * 82, P.blue, 18);
          label(c, ['转移液体并加热', '抓取 / 倒液 / 放置 / 按键', '排列目标对象与步骤', f.step >= 4 ? '审阅完成，开始试运行' : '检查可达与放置冲突'][i], 167, 110 + i * 82, P.muted, 15);
        });
        label(c, f.step >= 4 ? '已审阅流程的执行' : '流程生成与检查', 669, 30, P.blue, 21);
        if (f.step < 2) {
          rect(c, 370, 79, 579, 259, '#fff', P.line);
          label(c, '把源烧杯中的液体转移到接收烧杯，再加热', 660, 123, P.blue, 20);
          beaker(c, 480, 255, .86, .7); beaker(c, 654, 255, .86, .15, P.green);
          arrow(c, 522, 229, 604, 229, P.green); rect(c, 798, 268, 103, 23, '#d1dbe0', P.blue);
          label(c, f.step ? '选择与任务对应的原子技能' : '识别任务对象、操作与顺序', 660, 367, P.muted, 19);
        } else if (f.step < 4) {
          protocolSteps.forEach((v, i) => {
            const show = f.step > 2 || f.part * 4 >= i;
            c.save(); c.globalAlpha = show ? 1 : .18;
            rect(c, 382, 70 + i * 71, 544, 53, '#fff', f.step === 3 ? P.green : P.blue);
            label(c, `${i + 1}  ${v}`, 654, 96 + i * 71, P.blue, 21); c.restore();
          });
          label(c, f.step === 3 ? '检查通过后仍需人工审阅' : '明确源容器、接收容器与加热设备', 654, 388, f.step === 3 ? P.green : P.muted, 18);
        } else {
          c.save(); c.translate(340, 32); protocol(c, f.part); c.restore();
          label(c, protocolSteps[protocolStep(f.part)], 650, 76, P.green, 21);
        }
      }} />
    }</Sequence> : <Sequence key="annotations" steps={protocolSteps} durations={[3000, 4500, 7200, 3000]}>{f =>
      <Canvas h={460} animated={false} title="执行过程中跟踪容器位置、状态和当前子任务，同步生成标注记录" draw={c => {
        field(c, 1000, 460);
        c.save(); c.translate(0, 50); c.scale(.91, .91); const state = protocol(c, (f.step + f.part) / 4, true); c.restore();
        label(c, '示范回放与对象跟踪', 286, 30, P.blue, 21);
        label(c, '与当前画面同步的标注', 779, 30, P.green, 21);
        const values = [
          `${protocolSteps[f.step]} · 当前片段`,
          state.held === 'target' ? '接收容器被夹持 · 移向加热台' : state.poured > .8 ? '源容器减少 · 接收容器增加' : state.held ? '源容器被夹持 · 位置变化' : '器具角色与当前位置',
          `前视相机 · ${state.held ? '容器包围框随对象移动' : '台面对象位置已记录'}`,
          f.step === 3 && f.part > .75 ? '按键完成 · 流程成功后导出' : `夹爪${state.held ? '闭合' : '状态'} · 操作进行中`
        ];
        annotationLabels.forEach((v, i) => {
          rect(c, 584, 67 + i * 88, 394, 72, '#fff', i === f.step ? P.green : P.line);
          label(c, v, 781, 88 + i * 88, P.blue, 19);
          label(c, values[i], 781, 115 + i * 88, P.green, 16);
        });
        label(c, '完成后只导出成功且无禁碰的轨迹', 297, 426, P.green, 18);
      }} />
    }</Sequence>}
    <Feedback>{[
      '先生成不同类别的器具资产，再把它们放进有实验台、器具架和机器人的场景。检查通过后试运行，确认“看起来完整”的场景也能用于操作。',
      '先生成和检查流程，再执行经过人工审阅的步骤。执行动画与左侧流程内容对应；机器人配置和受约束随机化用于适配、丰富这些已验证流程。',
      '标注随示范的每一帧更新：当前做哪一步、操作哪个容器、对象在哪里、夹爪处于什么状态。最后通过成功与禁碰检查，才形成可导出的训练示范。'
    ][stage]}</Feedback></>;
}

function trainingAnimation(c: G, stage: number, frame: Frame) {
  field(c, 1000, 390); const { step, part } = frame;
  if (stage === 0) {
    label(c, '带动作记录的示范片段', 213, 30, P.blue, 20);
    rect(c, 24, 62, 352, 235, '#fff', P.line);
    c.save(); c.translate(22, 87); c.scale(.55, .55); protocol(c, .02 + .2 * ((step + part) / 4)); c.restore();
    label(c, '指令：拿起源烧杯', 205, 323, P.muted, 19);
    arrow(c, 401, 165, 468, 165);
    rect(c, 490, 65, 476, 234, '#fff', step === 3 ? P.green : P.blue);
    label(c, 'Qwen3-VL 学习画面、指令与动作的联系', 728, 96, P.blue, 20);
    label(c, step === 0 ? '读入示范，而不是控制真机' : 'FAST 动作编码序列', 728, 138, P.muted, 18);
    for (let i = 0; i < 5; i++) {
      const known = i < 4, revealed = step >= 1 && (known || step === 3);
      rect(c, 526 + i * 82, 165, 66, 56, revealed ? '#e8f1e2' : '#f3f6fa', !known && step === 2 ? P.orange : P.line, 6);
      label(c, revealed ? '编码' : !known && step === 2 ? '预测' : '待读', 559 + i * 82, 193, revealed ? P.green : P.muted, 17);
    }
    label(c, ['视觉与指令作为学习条件', '连续示范被编码成离散序列', '遮住后续编码，让模型预测', '用真实后续编码提供学习反馈'][step], 728, 264, step === 3 ? P.green : P.blue, 19);
    if (step === 3) { arrow(c, 897, 344, 897, 309, P.green); label(c, '更新视觉语言模型', 732, 351, P.green, 18); }
  } else {
    label(c, '当前画面与指令', 178, 31, P.blue, 20);
    rect(c, 26, 65, 306, 229, '#fff', P.line);
    bench(c, 43, 285, 272); robot(c, 88, 274, 230, 170, { scale: .68, gripScale: .5 }); beaker(c, 278, 263, .5);
    label(c, '视觉语言条件保持可读', 178, 325, P.muted, 17);
    arrow(c, 349, 173, 414, 173);
    rect(c, 435, 65, 536, 230, '#fff', P.green);
    label(c, 'DiT 动作专家', 704, 95, P.blue, 23);
    const error = (1 - (step + part) / 4) * 1.5;
    actionPose(c, 547, 178, error, P.orange, .85);
    actionPose(c, 718, 178, error * .6, P.blue, .85);
    actionPose(c, 890, 178, 0, P.green, .85);
    arrow(c, 592, 177, 661, 177, P.blue); arrow(c, 763, 177, 836, 177, P.green);
    label(c, '带噪动作', 547, 248, P.muted, 18); label(c, '预测修正', 718, 248, P.blue, 18); label(c, '已知示范', 891, 248, P.green, 18);
    label(c, ['接入独立动作专家', '用示范构造动作学习样本', '对照正确更新方向学习', '动作反馈只更新投影层与 DiT'][step], 704, 343, P.green, 19);
    if (step >= 2) { arrow(c, 890, 278, 735, 278, P.green); line(c, 407, 314, 407, 355, P.red, 4); }
  }
}

export function Recipe() {
  const [stage, set] = useState(0);
  return <><Route items={['FAST 动作语义预训练', '流匹配与知识隔离后训练']} active={stage} />
    <Choices items={['预训练：视觉语言骨干', '后训练：接入动作专家']} value={stage} set={set} />
    <div className="lab-training-diagram"><div className="lab-data-input"><strong>训练数据</strong>{stage === 0 ? <><span>Robointer-VQA</span><span>AgiBot World Beta</span><span>OXE-AugE · Droid</span></> : <><span>OXE-AugE</span><span>RoboGenesis 生成</span><span>LabEmbodied-Data</span></>}</div>
      <span className="lab-connector">→</span><div className="lab-model-block"><strong>Qwen3-VL</strong><span>视觉 · 指令 · 机器人状态</span><div className="lab-token-strip">{stage === 0 ? '问答 / 标注 / FAST 动作 token' : '前缀条件 · 保留 token 监督'}</div></div>
      <span className="lab-connector">→</span><div className={'lab-model-block ' + (stage ? 'active' : 'muted')}><strong>{stage ? 'DiT 动作专家' : '动作语义对齐'}</strong><span>{stage ? '流匹配学习连续动作' : '此阶段不实例化 DiT'}</span>{stage ? <div className="lab-token-strip">知识隔离约束动作梯度</div> : null}</div>
    </div>
    <Sequence key={stage} steps={stage === 0 ? ['读入画面与指令', '编码示范动作', '预测后续编码', '用正确编码学习'] : ['加入动作专家', '构造动作样本', '学习修正方向', '限制动作反馈范围']}>
      {f => <Canvas h={390} animated={false} title={stage === 0 ? '从记录的动作示范到 FAST 编码预测与视觉语言模型学习' : '在视觉语言条件下以示范动作训练 DiT，动作反馈在 VLM 前停止'} draw={c => trainingAnimation(c, stage, f)} />}
    </Sequence>
    <Feedback>{stage === 0 ? '预训练先让模型理解画面、指令和动作编码之间的联系。画面里的操作来自训练示范；离散编码并不是“一枚编码对应一个完整动作”，此时也还没有 DiT 连续动作专家。' : '后训练加入 DiT，在视觉语言条件下学习连续动作。动作目标的反馈只更新投影层和动作专家；FAST 与标注任务仍可继续训练 VLM。'}</Feedback>
  </>;
}

export function Flow() {
  const [mode, set] = useState(0);
  const trainSteps = ['已知示范与随机噪声', '构造带噪动作样本', '预测更新方向', '对照目标方向并学习'];
  const inferSteps = ['随机动作起点', ...Array.from({ length: 9 }, (_, i) => `动作更新 ${i + 1}`), '动作片段生成完成'];
  return <><Choices items={['训练：从已知示范学习', '推理：没有示范答案时生成']} value={mode} set={set} />
    <Sequence key={mode} steps={mode ? inferSteps : trainSteps} durations={mode ? [1800, ...Array(9).fill(750), 2500] : [3000, 3000, 3000, 3800]}>{f =>
      <Canvas h={440} animated={false} title={mode ? '当前观测固定，无示范答案，DiT 逐次更新动作候选直到输出' : '已知示范和噪声构造训练样本，预测方向与监督目标比较后更新参数'} draw={c => {
        field(c, 1000, 440);
        if (!mode) {
          label(c, '训练时已经有正确示范', 260, 29, P.green, 22);
          rect(c, 25, 62, 220, 139, '#fff', P.green); actionPose(c, 134, 119, 0, P.green, .9); label(c, '示范动作', 135, 177, P.green, 19);
          rect(c, 280, 62, 220, 139, '#fff', P.orange); actionPose(c, 388, 119, 1.5, P.orange, .9); label(c, '随机噪声动作', 390, 177, P.orange, 18);
          arrow(c, 140, 214, 252, 257, P.green); arrow(c, 390, 214, 285, 257, P.orange);
          rect(c, 142, 278, 270, 112, '#fff', f.step >= 1 ? P.blue : P.line);
          actionPose(c, 216, 325, .95, P.blue, .7); label(c, '带噪样本', 331, 327, P.blue, 19);
          arrow(c, 431, 331, 531, 331);
          rect(c, 554, 67, 418, 323, '#fff', P.blue); label(c, 'DiT 学习预测更新方向', 763, 102, P.blue, 21);
          actionPose(c, 765, 187, .95, P.muted, .95);
          if (f.step >= 2) {
            const correction = f.step === 3 ? ease(f.part) : 0;
            arrow(c, 765, 238, mix(830, 704, correction), 285, P.blue);
            label(c, '模型预测', 840, 267, P.blue, 18);
          }
          if (f.step === 3) {
            arrow(c, 765, 238, 704, 285, P.green); label(c, '已知目标方向', 672, 310, P.green, 18);
            label(c, '比较两者，让下一次预测更准确', 764, 360, P.green, 19);
          } else label(c, ['准备学习材料', '在随机阶段抽取一个训练样本', '根据条件和样本预测怎样更新'][f.step], 764, 358, P.muted, 18);
          label(c, '示范用于构造样本与监督，不是推理时的答案提示', 492, 416, P.muted, 18);
        } else {
          // This entire observation panel is independent of the animation clock.
          rect(c, 20, 65, 295, 306, '#fff', P.line); label(c, '当前观测保持固定', 167, 32, P.blue, 21);
          bench(c, 39, 353, 259); robot(c, 93, 342, 224, 220, { scale: .7, gripScale: .5 }); beaker(c, 262, 330, .5);
          label(c, '画面 · 指令 · 机器人状态', 167, 397, P.muted, 17);
          arrow(c, 331, 192, 378, 192); label(c, '提供条件', 355, 244, P.muted, 15);
          label(c, '从随机动作出发，反复调用 DiT', 677, 32, P.blue, 21);
          const done = f.step === 10, amount = done ? 1 : (f.step + f.part) / 10;
          [474, 671, 868].forEach((x, i) => {
            rect(c, x - 81, 111, 164, 222, '#fff', done ? P.green : P.line);
            const error = (1 - amount) * [1.55, -1.6, 1.25][i];
            actionPose(c, x, 213, error, done ? P.green : P.blue, 1.25);
            label(c, ['起始动作', '中间动作', '后续动作'][i], x, 300, P.muted, 18);
          });
          label(c, done ? '输出待执行片段 · 随后才进入物理执行' : '动作候选持续变化 · 这里没有正确示范', 678, 379, done ? P.green : P.blue, 19);
          if (!done) { arrow(c, 797, 80, 541, 80, P.blue); label(c, '继续更新动作', 670, 80, P.blue, 17); }
        }
      }} />
    }</Sequence>
    <Feedback>{mode ? '推理时没有示范答案。模型读取当前观测，从随机动作起点反复更新动作候选，最后输出一段待执行动作。生成期间，左侧的真实场景保持不变。' : '训练时有已知示范。先把示范与噪声混合成一个训练样本，再让 DiT 预测更新方向，并与已知目标比较。这里展示一次学习过程，和推理时连续生成动作是两件事。'}</Feedback>
  </>;
}

const roleNames = ['Level 1 · 学徒', 'Level 2 · 技术员', 'Level 3 · 专家', 'Level 4 · 科学家'];
const roleInfo = [
  '学徒关注单步对象操作，例如抓取一个烧杯。',
  '技术员遵循固定多步流程。LabVLA 定位于这一层；动画展示步骤关系，并不代表所有任务都已被解决。',
  '专家在更长流程中使用精密仪器，并记录测量、遵守安全约束。这里以对准、吸液、分液和记录说明能力要求，论文未展示 LabVLA 具备这一层能力。',
  '科学家根据观察或测量改变流程，或判断何时停止。这里以浓度反馈展示两种不同选择，属于能力定义示意，论文未展示 LabVLA 具备这种科学判断。'
];

function specialistScene(c: G, f: Frame) {
  const { step, part } = f, p = ease(part);
  bench(c, 42, 340, 541);
  const aspirated = step === 0 ? clamp((part - .45) / .55) : 1;
  const dispensed = step < 2 ? 0 : step === 2 ? p : 1;
  sampleTube(c, 230, 300, .72 - aspirated * .25); sampleTube(c, 452, 275, .1 + dispensed * .25);
  rect(c, 208, 325, 45, 13, '#c8d6df', P.blue, 2);
  rect(c, 411, 322, 83, 17, '#d2dde4', P.blue, 3); rect(c, 419, 316, 67, 6, '#edf2f6', P.blue, 2);
  rect(c, 430, 304, 45, 11, '#c8d6df', P.blue, 2);
  label(c, step === 3 ? part > .5 ? '已记录' : '称量中' : '待称量', 452, 331, step === 3 ? P.green : P.muted, 11);
  let x = 230, y = 163, fill = 0;
  if (step === 0) { y = mix(123, 163, ease(part / .45)); fill = clamp((part - .45) / .55); }
  if (step === 1) { x = mix(230, 452, p); y = mix(163, 138, p) - Math.sin(p * Math.PI) * 85; fill = 1; }
  if (step === 2) { x = 452; y = 138; fill = 1 - p; }
  if (step === 3) { x = mix(452, 357, p); y = mix(138, 88, p); }
  // Pipette tip enters the tube while the gripper holds the barrel, not the tube itself.
  robot(c, 110, 328, x, y - 34, { scale: 1.21, reach: 1.75, bend: -1, gripScale: .55, open: .05 });
  pipette(c, x, y, fill);
  if (step === 2 && part < .85) { dot(c, x, 251 + part * 17 % 13, 3, P.green); line(c, x, 249, x, 272, P.green + '66', 3); }
  label(c, '源样品', 230, 369, P.muted, 18); label(c, '目标试管与称量记录', 452, 369, P.muted, 17);
  label(c, '移液器对准管口，保持器具间安全距离', 304, 407, P.muted, 18);
  rect(c, 627, 76, 339, 306, '#fff', P.line);
  label(c, '操作与测量记录', 797, 107, P.blue, 22);
  ['对准源样品并吸液', '抬起后移动到目标', '控制分液', '写入操作与测量记录'].forEach((v, i) => {
    rect(c, 652, 142 + i * 55, 291, 42, step >= i ? '#edf5e9' : '#f5f7fa', step === i ? P.green : P.line, 5);
    label(c, i === 3 && step === 3 ? part > .5 ? '称量结果已写入记录' : '读取称量结果' : v, 797, 164 + i * 55, step >= i ? P.green : P.muted, 18);
  });
}

function scientistScene(c: G, f: Frame, result: number) {
  const { step, part } = f;
  bench(c, 33, 341, 555);
  const added = result === 0 ? step === 2 ? clamp((part - .5) / .5) : step === 3 ? 1 : 0 : 0;
  beaker(c, 426, 311, .66, .45 + added * .13, P.green);
  rect(c, 59, 183, 147, 139, '#e6edf0', P.blue);
  rect(c, 73, 205, 119, 66, '#fff', step >= 1 ? P.green : P.line);
  label(c, step === 0 ? '测量中' : result === 0 ? '浓度偏高' : '达到目标', 132, 238, P.blue, 20);
  label(c, '外部测量反馈', 132, 296, P.muted, 16);
  let x = 323, y = 95;
  if (step === 2 && result === 0) { x = mix(323, 426, ease(part / .5)); y = mix(95, 166, ease(part / .5)); }
  if (step === 3 && result === 0) { x = mix(426, 323, ease(part)); y = mix(166, 95, ease(part)); }
  if (step === 2 && result === 1) { x = mix(323, 330, ease(part)); y = mix(95, 72, ease(part)); }
  if (step === 3 && result === 1) { x = 330; y = 72; }
  robot(c, 292, 329, x, y - 34, { scale: 1.15, gripScale: .55 }); pipette(c, x, y, .75 - added * .25);
  if (step === 2 && result === 0 && part > .5) { dot(c, 426, 283 + part * 150 % 13, 3, P.green); }
  label(c, step === 3 ? result === 0 ? '调整后重新测量，再作判断' : '停止加液，记录实验终点' : '动作随测量结果改变', 302, 406, P.green, 19);
  rect(c, 630, 70, 341, 318, '#fff', P.line);
  const rows = ['读取观察或测量', result === 0 ? '判断：还需调整浓度' : '判断：科学目标已满足', result === 0 ? '修改流程：补充溶剂' : '修改流程：停止操作', result === 0 ? '复测后再次判断' : '记录终点与结果'];
  rows.forEach((v, i) => {
    rect(c, 650, 88 + i * 71, 302, 50, step === i ? '#e7f2e3' : '#f7f9fb', step === i ? P.green : P.line);
    label(c, v, 801, 113 + i * 71, step === i ? P.green : P.blue, 18);
    if (i < 3) arrow(c, 801, 141 + i * 71, 801, 154 + i * 71, P.muted);
  });
}

export function Positioning() {
  const [level, set] = useState(1), [result, setResult] = useState(0);
  const steps = level === 0 ? ['靠近器具', '闭合夹爪', '提起烧杯'] : level === 1 ? protocolSteps : level === 2 ? ['对准样品并吸液', '移动到目标试管', '定点分液', '记录操作与测量'] : ['读取测量', '判断是否达到目标', '改变后续操作', '记录或重新测量'];
  return <><Choices items={roleNames} value={level} set={set} />
    {level >= 2 && <div className="lab-boundary">能力定义示意 · LabVLA 尚未展示这一层能力</div>}
    {level === 3 && <Choices items={['测量反馈：浓度偏高', '测量反馈：已达到目标']} value={result} set={setResult} />}
    <Sequence key={`${level}-${result}`} steps={steps} durations={level === 1 ? [2800, 4400, 7000, 3000] : undefined}>{f =>
      <Canvas h={450} animated={false} title={['单步抓起烧杯', '按固定步骤抓取倒液放置和按键', '机械臂操作移液器，在试管之间移液并记录', '根据测量反馈选择调整浓度或停止操作'][level]} draw={c => {
        field(c, 1000, 450);
        label(c, ['学徒：完成单个对象交互', '技术员：执行既定流程', '专家：精密仪器操作与记录', '科学家：根据测量改变流程'][level], 500, 27, level === 1 ? P.green : P.blue, 23);
        if (level === 2) specialistScene(c, f);
        else if (level === 3) scientistScene(c, f, result);
        else {
          c.save(); c.translate(355, 50);
          protocol(c, level === 1 ? (f.step + f.part) / 4 : (f.step + f.part) / 12); c.restore();
          rect(c, 32, 101, 291, 227, '#fff', level === 1 ? P.green : P.line);
          label(c, level === 1 ? 'LabVLA 当前定位' : '单步操作', 177, 143, level === 1 ? P.green : P.blue, 23);
          label(c, steps[f.step], 177, 199, P.blue, 20);
          label(c, level === 1 ? '沿已写好的流程往下执行' : '以成功抓起器具为目标', 177, 266, P.muted, 18);
        }
      }} />
    }</Sequence><Feedback tone={level === 1 ? 'green' : 'blue'}>{roleInfo[level]}</Feedback></>;
}
