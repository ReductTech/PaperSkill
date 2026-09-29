import React from 'react';

export function VictorianCover() {
  return (
    <section className="victorian-cover" aria-labelledby="cover-title">
      <div className="cover-ceiling-pipe pipe-left"><i /><i /><i /></div>
      <div className="cover-ceiling-pipe pipe-right"><i /><i /></div>
      <div className="cover-ambient-gear gear-one"><i /></div>
      <div className="cover-ambient-gear gear-two"><i /></div>

      <header className="cover-lab-header">
        <div><small>THE GRAND MODEL ADAPTATION LABORATORY</small><span>ENGINEERING DOSSIER · № 2106.09685</span></div>
        <div className="cover-era-seal"><b>2021</b><span>RESEARCH<br />EDITION</span></div>
      </header>

      <main className="cover-blueprint">
        <div className="cover-title-block">
          <small>LOW-RANK ADAPTATION OF LARGE LANGUAGE MODELS</small>
          <h1 id="cover-title">LoRA</h1>
          <h2>大语言模型的低秩适配</h2>
          <p>Edward Hu 等 · Microsoft Research / Carnegie Mellon University</p>
        </div>

        <div className="cover-engine-stage" aria-label="从全量微调危机到低秩适配的机械示意">
          <div className="cover-crisis-gauge">
            <small>FULL FINE-TUNING</small>
            <div className="cover-dial"><i /><b>175B</b><span>TRAINABLE</span></div>
            <strong>COST: CRITICAL</strong>
          </div>

          <div className="cover-main-engine">
            <div className="cover-stack"><i /><i /><i /></div>
            <div className="cover-engine-window"><i /><i /><i /><b>W₀</b><span>PRETRAINED ENGINE</span></div>
            <div className="cover-engine-base">BASE MODEL · FROZEN</div>
          </div>

          <div className="cover-lora-assembly">
            <small>COMPACT UPDATE</small>
            <div className="cover-ba"><span>B</span><i>×</i><span>A</span></div>
            <strong>ΔW = BA</strong>
          </div>

          <div className="cover-flow-line"><i /><i /><i /><span>ADAPT THE CHANGE, NOT THE WHOLE ENGINE</span></div>
        </div>

        <section className="cover-briefing" aria-label="论文导读">
          <div className="briefing-row">
            <small>01 · 论文背景</small>
            <p>预训练模型越做越大，全量微调却要求为每个下游任务更新并保存整套权重；训练显存、优化器状态与任务检查点成本随之迅速膨胀。</p>
          </div>
          <div className="briefing-row">
            <small>02 · 核心内容</small>
            <p>论文假设任务适配产生的权重更新 <b>ΔW</b> 具有较低的 intrinsic rank。冻结预训练权重 <b>W₀</b>，只学习两个小矩阵 <b>A、B</b>，以 <b>ΔW = BA</b> 表示任务更新。</p>
          </div>
          <div className="briefing-row">
            <small>03 · 论文意义</small>
            <p>在论文测试的模型、任务与设置中，LoRA 用极少的可训练参数获得竞争性表现；权重可在部署前合并，因此无需额外推理层，并能更轻量地保存和切换任务能力。</p>
          </div>
        </section>

        <footer className="cover-keywords">
          <small>PAPER KEYWORDS</small>
          <div><span>PARAMETER-EFFICIENT FINE-TUNING</span><span>LOW-RANK UPDATE</span><span>TRANSFORMER</span><span>ΔW = BA</span><span>WEIGHT MERGING</span></div>
        </footer>
      </main>

      <div className="cover-entry-mark"><i /><span>从一次失控的全量微调实验开始</span><i /></div>
    </section>
  );
}
