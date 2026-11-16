import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const END = -1;
const OUT_OF_RANGE = 300;
const ACTION_TOKENS = [132, 114, 128, 5, 25, 156, 255];
const SLOT_LABELS = ['Δx', 'Δy', 'Δz', 'Δroll', 'Δpitch', 'Δyaw', '夹爪', '结束'];

const DIMENSIONS = [
  { name: 'Δx', group: '平移', desc: '末端执行器在 x 方向上的位置增量，描述手往这个方向移动多少。' },
  { name: 'Δy', group: '平移', desc: '末端执行器在 y 方向上的位置增量，描述手往这个方向移动多少。' },
  { name: 'Δz', group: '平移', desc: '末端执行器在 z 方向上的位置增量，描述手往这个方向移动多少。' },
  { name: 'Δroll', group: '旋转', desc: '末端执行器的横滚角增量，描述机械臂末端绕轴翻转多少。' },
  { name: 'Δpitch', group: '旋转', desc: '末端执行器的俯仰角增量，描述机械臂末端抬头或低头多少。' },
  { name: 'Δyaw', group: '旋转', desc: '末端执行器的偏航角增量，描述机械臂末端向左或向右转多少。' },
  { name: '夹爪', group: '夹爪', desc: '夹爪伸展或闭合程度。论文中它和其他连续维度一样会被离散化。' },
];

const STEP_LABELS = ['认识连续动作', '理解 256 格尺子', '逐维替换编号', '拼出动作句子'];

export const ActionTokenize: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [selectedDim, setSelectedDim] = useState(0);
  const [position, setPosition] = useState(0.52);
  const [rulerMoved, setRulerMoved] = useState(false);
  const [converted, setConverted] = useState<boolean[]>(Array(7).fill(false));
  const [slots, setSlots] = useState<(number | null)[]>(Array(8).fill(null));
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
  const [message, setMessage] = useState({
    text: '按顺序完成四步：先知道机器人给了什么，再理解为什么要量化，最后亲手拼出 token 句子。',
    cls: '',
  });

  const bin = Math.round(position * 255);
  const allConverted = converted.every(Boolean);
  const done = slots[7] === END;

  const goStep = (next: number) => {
    if (next > step && next >= 2 && !rulerMoved) {
      setMessage({ text: '先拖动一次量化尺子，观察连续位置怎样变成最近 bin。', cls: 'is-warn' });
      return;
    }
    if (next > step && next >= 3 && !allConverted) {
      setMessage({ text: '先把 7 个连续量都量化，才能进入拼句步骤。', cls: 'is-warn' });
      return;
    }
    setStep(next);
  };

  const moveRuler = (value: number) => {
    setPosition(value);
    setRulerMoved(true);
    setMessage({
      text: `连续位置 ${value.toFixed(2)} 被吸到最近的 bin，编号为 ${Math.round(value * 255)}。`,
      cls: '',
    });
  };

  const convertOne = (index: number) => {
    const nextConverted = [...converted];
    const nextSlots = [...slots];
    nextConverted[index] = true;
    nextSlots[index] = ACTION_TOKENS[index];
    setConverted(nextConverted);
    setSlots(nextSlots);
    setMessage({
      text: `${DIMENSIONS[index].name} 这一维的连续量已替换成编号 ${ACTION_TOKENS[index]}。`,
      cls: '',
    });
  };

  const convertAll = () => {
    setConverted(Array(7).fill(true));
    setSlots([...ACTION_TOKENS, null]);
    setMessage({ text: '7 个连续量已经逐个替换为 7 个整数编号，顺序保持不变。', cls: '' });
  };

  const resetConversion = () => {
    setConverted(Array(7).fill(false));
    setSlots(Array(8).fill(null));
    setSelectedEnd(null);
    setMessage({ text: '已清空量化结果，可以重新逐维替换。', cls: '' });
  };

  const resetEnd = () => {
    const nextSlots = [...slots];
    nextSlots[7] = null;
    setSlots(nextSlots);
    setSelectedEnd(null);
    setMessage({ text: '结束位已清空。前 7 个动作编号仍然保留。', cls: '' });
  };

  const clickSlot = (index: number) => {
    if (selectedEnd === OUT_OF_RANGE) {
      setMessage({ text: '300 超出 0–255 的 bin 范围；256 个 bin 只提供编号 0–255。', cls: 'is-bad' });
      return;
    }
    if (selectedEnd === END && index < 7) {
      setMessage({
        text: '终止命令不能插在动作中间。论文原始顺序把 terminate 放最前，本页按阅读顺序放在第 8 格。',
        cls: 'is-bad',
      });
      return;
    }
    if (selectedEnd === END && index === 7) {
      const nextSlots = [...slots];
      nextSlots[7] = END;
      setSlots(nextSlots);
      setMessage({
        text: '动作句成立：模型可以像预测一句话一样依次预测这 8 个 token，不需要额外的回归头。',
        cls: 'is-good',
      });
      return;
    }
    if (index === 7) {
      setMessage({ text: '先选择下方的结束标记，再点击第 8 格。', cls: '' });
    }
  };

  const showFullExample = () => {
    setRulerMoved(true);
    setConverted(Array(7).fill(true));
    setSlots([...ACTION_TOKENS, END]);
    setSelectedEnd(END);
    setStep(3);
    setMessage({ text: '完整示例：132 114 128 5 25 156 255 256。建议再重置一次，按步骤自己完成。', cls: 'is-good' });
  };

  return (
    <div className="atw">
      <div className="atw-hero" aria-label="动作分词总流程">
        <div className="atw-flow-card">
          <span>1</span>
          <b>7 个连续量</b>
          <small>平移、旋转、夹爪</small>
        </div>
        <div className="atw-flow-arrow">→</div>
        <div className="atw-flow-card">
          <span>2</span>
          <b>256 个 bin</b>
          <small>每维编号 0–255</small>
        </div>
        <div className="atw-flow-arrow">→</div>
        <div className="atw-flow-card">
          <span>3</span>
          <b>一句 token</b>
          <small>7 个动作编号 + 终止命令</small>
        </div>
      </div>

      <div className="atw-tabs">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`atw-tab ${step === i ? 'is-active' : ''}`}
            onClick={() => goStep(i)}
          >
            <span>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <section className="atw-panel">
        {step === 0 ? (
          <div>
            <div className="atw-panel-head">
              <h4>机器人给的不是“一个词”，而是 7 个连续量</h4>
              <p>连续控制描述“手移动多少、转多少、夹爪闭合多少”。这些量可以是任意小数，不是固定词表中的某个词。</p>
            </div>
            <div className="atw-dim-grid">
              {DIMENSIONS.map((dim, i) => (
                <button
                  type="button"
                  key={dim.name}
                  className={`atw-dim ${selectedDim === i ? 'is-active' : ''}`}
                  onClick={() => setSelectedDim(i)}
                >
                  <b>{dim.name}</b>
                  <span>{dim.group}</span>
                </button>
              ))}
            </div>
            <div className="atw-explain">
              <b>{DIMENSIONS[selectedDim].name} 表示什么</b>
              <p>{DIMENSIONS[selectedDim].desc}</p>
            </div>
            <div className="atw-problem">
              <b>为什么不能直接送进语言模型？</b>
              <p>连续小数有无穷多个，而语言模型是从有限词表中选择下一个 token。若直接预测任意小数向量，就不能直接复用论文中的 next-token 训练方式。</p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <div className="atw-panel-head">
              <h4>给每一维准备一把 256 格的尺子</h4>
              <p>论文把每个连续维度在训练范围内均匀切成 256 个 bin，编号为 0–255。连续值会被吸到最近的 bin。</p>
            </div>
            <div className="atw-ruler-box">
              <div className="atw-readout">
                <span>归一化连续位置</span>
                <b>{position.toFixed(2)}</b>
              </div>
              <div className="atw-ruler" aria-label="256 格量化尺子">
                <div className="atw-marker" style={{ left: `${position * 100}%` }} />
              </div>
              <div className="atw-readout">
                <span>最近 bin 编号</span>
                <b>{bin}</b>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(position * 100)}
              aria-label="调整连续位置"
              onChange={(e) => moveRuler(Number(e.target.value) / 100)}
            />
            <div className="rt2-controls">
              <button type="button" className="rt2-btn" onClick={() => moveRuler(0)}>左端</button>
              <button type="button" className="rt2-btn" onClick={() => moveRuler(0.52)}>中间附近</button>
              <button type="button" className="rt2-btn" onClick={() => moveRuler(1)}>右端</button>
            </div>
            <p className="atw-formula">教学计算：归一化位置 x → 最近编号 round(x × 255)</p>
            <p className="atw-muted">量化会带来很小的舍入误差，但换来有限、可进入词表、可以逐个预测的符号。</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <div className="atw-panel-head">
              <h4>逐维量化：7 个连续量变成 7 个编号</h4>
              <p>每个维度独立量化，维度顺序保持不变。点击每一行的“量化”按钮，观察连续量被替换成整数。</p>
            </div>
            <div className="atw-rows">
              {DIMENSIONS.map((dim, i) => (
                <div className={`atw-row ${converted[i] ? 'is-done' : ''}`} key={dim.name}>
                  <span className="atw-row-index">{i + 1}</span>
                  <span className="atw-row-name">
                    {dim.name}
                    <small>{dim.group}</small>
                  </span>
                  <span className="atw-row-source">连续量</span>
                  <span className="atw-row-arrow">→</span>
                  <button type="button" className="rt2-btn" disabled={converted[i]} onClick={() => convertOne(i)}>
                    {converted[i] ? ACTION_TOKENS[i] : '量化'}
                  </button>
                </div>
              ))}
            </div>
            <div className="rt2-controls">
              <button type="button" className="rt2-btn" onClick={convertAll}>全部量化</button>
              <button type="button" className="rt2-btn" onClick={resetConversion}>重置本步</button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <div className="atw-panel-head">
              <h4>补上终止命令，得到完整动作句</h4>
              <p>前 7 位是动作 bin，终止命令是离散命令，不是连续量。请把结束标记放到第 8 格。</p>
            </div>
            <div className="atw-token-strip">
              {slots.map((value, i) => (
                <button
                  type="button"
                  key={`${SLOT_LABELS[i]}-${i}`}
                  className={`atw-slot ${value !== null ? 'is-filled' : ''} ${i === 7 && value === END ? 'is-right' : ''}`}
                  onClick={() => clickSlot(i)}
                >
                  <b>{value === null ? '—' : value === END ? '256' : value}</b>
                  <span>{SLOT_LABELS[i]}</span>
                </button>
              ))}
            </div>
            <div className="rt2-controls">
              <button
                type="button"
                className={`rt2-btn ${selectedEnd === END ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedEnd(END);
                  setMessage({ text: '已选择结束标记。请点击第 8 格；也可以试试放到前面，观察为什么会被拒绝。', cls: '' });
                }}
              >
                256 · 结束（教学显示）
              </button>
              <button
                type="button"
                className={`rt2-btn ${selectedEnd === OUT_OF_RANGE ? 'is-active' : ''}`}
                onClick={() => {
                  setSelectedEnd(OUT_OF_RANGE);
                  setMessage({ text: '已选择 300。点击任意槽位，系统会说明它为什么不存在。', cls: '' });
                }}
              >
                300 · 越界
              </button>
              <button type="button" className="rt2-btn" onClick={resetEnd}>重置结束位</button>
            </div>
            {done ? (
              <div className="atw-meaning">
                <b>这一步的意义</b>
                <p>连续动作已经被翻译成模型能读懂的 token 序列。这样 RT-2 可以复用视觉语言模型的 next-token 训练，把图像、语言和动作放进同一套预测流程。</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className="rt2-controls">
        <button type="button" className="rt2-btn" onClick={resetConversion}>清空重来</button>
        <button type="button" className="rt2-btn is-green" onClick={showFullExample}>查看示例答案</button>
      </div>
      <p className={`rt2-note ${message.cls}`}>{message.text}</p>
      <p className="atw-footnote">
        论文原始字符串把 terminate 放在最前：“terminate Δposx Δposy Δposz Δrotx Δroty Δrotz gripper extension”。本页为阅读顺序把终止命令放在最后；界面中的 256 是教学显示，用来与 0–255 的 bin 区分，不是论文原文给出的终止 token 编号。
      </p>
    </div>
  );
};

export default ActionTokenize;
