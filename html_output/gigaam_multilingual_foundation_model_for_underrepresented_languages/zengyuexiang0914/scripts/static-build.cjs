const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const project = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  const resolved = request.startsWith("@/")
    ? path.join(project, "src", request.slice(2))
    : request;
  return originalResolve.call(this, resolved, parent, isMain, options);
};

function compile(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  }).outputText;
  module._compile(output, filename);
}

Module._extensions[".ts"] = compile;
Module._extensions[".tsx"] = compile;
Module._extensions[".css"] = () => {};

const Page = require(path.join(project, "src", "App.tsx")).default;
const markup = renderToStaticMarkup(React.createElement(Page));
const css = fs.readFileSync(path.join(project, "src", "index.css"), "utf8")
  .replace(/^@import.*\r?\n/gm, "");

const interactionScript = String.raw`
(() => {
  const pipeline = [
    { number: "01", title: "发现语言", body: "把音频虚拟切成 1 分钟片段，先用语音活动检测保留说话部分，再逐片段识别语言；整段录音的语言由多数投票决定。", fact: "置信度门槛：多数投票 0.7；选定语言片段的平均置信度 0.7。" },
    { number: "02", title: "形成语言簇", body: "研究者用同一录音中的语言共现关系建图，并按语言总体频次归一化边权。这样既看见亲近语言，也避免头部语言仅凭数据量占据图中心。", fact: "归一化边权：wᵢⱼ = cᵢⱼ / √(nᵢnⱼ)。" },
    { number: "03", title: "自监督预训练", body: "教师模型将声学表示聚成 1000 个离散单元；学生模型看到被遮住 40% 帧的梅尔频谱，并尝试恢复对应单元标签。", fact: "600M 参数 Conformer：24 层、隐藏维 1024、25 Hz 帧率。" },
    { number: "04", title: "面向领域微调", body: "模型在五种语言上共享字符词表，并混合公开、众包、弱监督和合成数据。采样同时平衡语言与数据域，避免海量合成语音淹没真实自发语音。", fact: "最终方案：E2 预训练权重 + domain-aware 微调采样。" }
  ];
  const experiments = [
    { id: "E0", weights: [60,27,8,3,2], wer: [4.6,14.4,9.4,12.3,10.5], note: "自然分布保护头部语言，但中亚语言获得的训练信号不足。" },
    { id: "E1", weights: [60,20,10,5,5], wer: [4.6,14.6,9.1,11.9,10.2], note: "温和重加权带来稳定的小幅改善。" },
    { id: "E2", weights: [50,15,25,5,5], wer: [4.7,15.4,8.5,11.4,9.7], note: "C3 从 8% 提至 25%：三个目标语言显著改善，论文采用此方案。" },
    { id: "E3", weights: [40,25,25,5,5], wer: [4.9,14.6,8.7,11.6,9.8], note: "英语回升到 14.6%，但三个目标语言均比 E2 略差。" }
  ];
  const languageProfiles = {
    "俄语": { hours: "5,822 h", level: "区域头部语言", challenge: "在提升长尾语言时，维持俄语识别稳定", wave: [22,42,68,35,55,84,48,30,72,58,38,76,92,51,27,64,45,80,54,34,70,46,60,28] },
    "哈萨克语": { hours: "9,812 h", level: "合成数据主导", challenge: "7,896 小时合成语音需要分域控制", wave: [34,72,46,88,52,30,62,95,40,68,25,78,56,86,38,64,92,48,74,28,58,82,44,70] },
    "吉尔吉斯语": { hours: "7,279 h", level: "极少公开语料", challenge: "公开语料仅 26 小时，真实语音覆盖稀缺", wave: [18,52,82,40,66,26,94,58,34,76,48,88,22,62,72,38,90,54,30,68,44,84,56,24] },
    "乌兹别克语": { hours: "585 h", level: "低资源语言", challenge: "没有合成或弱监督数据补充", wave: [28,60,38,74,46,84,32,56,90,42,68,24,78,50,36,88,58,30,72,44,82,52,64,26] }
  };
  const benchmarks = {
    Russian: [6.0,14.6,16.1,10.1],
    Kazakh: [15.8,32.2,62.9,65.2],
    Kyrgyz: [9.8,25.0,78.3,102.2],
    Uzbek: [12.7,30.2,40.0,120.6]
  };
  const quiz = [
    { answer: 1, correct: "B．小语种权重难可靠估计，激进上采样易过拟合", explain: "论文认为，极低资源语言的权重估计不稳定；语言簇提供了更稳健的中间粒度。" },
    { answer: 0, correct: "A．合成数据主导训练课程", explain: "哈萨克语和吉尔吉斯语含大量合成语音，分域采样能保护真实、自发语音的代表性。" },
    { answer: 1, correct: "B．长尾语言改善，英语略有回退", explain: "E2 把 C3 权重从 8% 提到 25%，换来吉尔吉斯语、哈萨克语和乌兹别克语的改善，同时英语 WER 上升。" }
  ];
  const answers = {};

  function setActive(list, active) {
    list.forEach((item) => item.classList.toggle("active", item === active));
  }

  const progress = document.querySelector("[data-slot='progress-indicator']");
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const value = max > 0 ? Math.min(100, scrollY / max * 100) : 0;
    if (progress) progress.style.transform = "translateX(-" + (100 - value) + "%)";
    const topbar = document.querySelector(".topbar");
    topbar?.classList.toggle("scrolled", scrollY > 24);
    const sections = ["problem", "method", "data", "experiments", "takeaways", "quiz"];
    let current = "";
    sections.forEach((id) => {
      const section = document.getElementById(id);
      if (section && section.getBoundingClientRect().top <= 180) current = id;
    });
    document.querySelectorAll(".nav-links a").forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + current));
  }
  addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  const languageButtons = [...document.querySelectorAll("[data-language]")];
  languageButtons.forEach((button) => button.addEventListener("click", () => {
    setActive(languageButtons, button);
    const item = languageProfiles[button.dataset.language];
    const body = document.querySelector(".observer-body");
    body.style.animation = "none";
    requestAnimationFrame(() => {
      [...document.querySelectorAll(".waveform span")].forEach((bar, index) => bar.style.height = item.wave[index] + "%");
      const stats = document.querySelectorAll(".observer-stats strong");
      stats[0].textContent = item.hours;
      stats[1].textContent = item.level;
      document.querySelector(".research-challenge").lastChild.textContent = item.challenge;
      body.style.animation = "observer-in .2s ease-out";
    });
  }));

  const stepButtons = [...document.querySelectorAll("[data-step]")];
  stepButtons.forEach((button) => button.addEventListener("click", () => {
    setActive(stepButtons, button);
    stepButtons.forEach((item) => item.setAttribute("aria-selected", String(item === button)));
    const item = pipeline[Number(button.dataset.step)];
    document.querySelector(".step-detail .step-number").textContent = item.number;
    document.querySelector(".step-detail h3").textContent = item.title;
    document.querySelector(".step-detail > p").textContent = item.body;
    document.querySelector(".fact-card span").textContent = item.fact;
  }));

  const tabButtons = [...document.querySelectorAll("[data-language-key]")];
  const tabPanels = [...document.querySelectorAll("[data-language-panel]")];
  function showTab(key) {
    tabButtons.forEach((button) => {
      const active = button.dataset.languageKey === key;
      button.dataset.state = active ? "active" : "inactive";
      button.setAttribute("aria-selected", String(active));
    });
    tabPanels.forEach((panel) => {
      const active = panel.dataset.languagePanel === key;
      panel.hidden = !active;
      panel.dataset.state = active ? "active" : "inactive";
    });
  }
  tabButtons.forEach((button) => button.addEventListener("click", () => showTab(button.dataset.languageKey)));
  showTab("Kazakh");

  const experimentButtons = [...document.querySelectorAll("[data-experiment]")];
  experimentButtons.forEach((button) => button.addEventListener("click", () => {
    setActive(experimentButtons, button);
    const item = experiments[Number(button.dataset.experiment)];
    document.querySelector(".weight-panel .panel-title strong").textContent = item.id;
    [...document.querySelectorAll(".cluster-columns > div")].forEach((column, index) => {
      column.querySelector("i").style.height = (item.weights[index] * 1.55) + "%";
      column.querySelector("strong").textContent = item.weights[index] + "%";
    });
    [...document.querySelectorAll(".wer-grid strong")].forEach((value, index) => value.textContent = item.wer[index] + "%");
    [...document.querySelectorAll(".wer-grid small")].forEach((value, index) => {
      const delta = Math.round((item.wer[index] - experiments[0].wer[index]) * 10) / 10;
      value.className = delta < 0 ? "improved" : delta > 0 ? "regressed" : "neutral";
      value.textContent = delta === 0 ? "E0 基准" : "较 E0 " + (delta < 0 ? "降低 " : "升高 ") + Math.abs(delta).toFixed(1) + " 个百分点";
    });
    document.querySelector(".lab-insight").textContent = item.note;
  }));

  const resultButtons = [...document.querySelectorAll("[data-result-language]")];
  resultButtons.forEach((button) => button.addEventListener("click", () => {
    setActive(resultButtons, button);
    const values = benchmarks[button.dataset.resultLanguage];
    const max = Math.max(...values);
    [...document.querySelectorAll(".model-chart > div:not(.model-chart-head)")].forEach((row, index) => {
      row.querySelector("i").style.width = (values[index] / max * 100) + "%";
      row.querySelector("strong").textContent = values[index].toFixed(1) + "%";
    });
    document.querySelector(".model-chart").setAttribute("aria-label", button.textContent + "内部测试集模型词错误率对比");
  }));

  document.querySelectorAll("[data-question]").forEach((button) => button.addEventListener("click", () => {
    const question = Number(button.dataset.question);
    const option = Number(button.dataset.option);
    answers[question] = option;
    const card = button.closest(".question-card");
    card.querySelectorAll("[data-option]").forEach((choice) => {
      const selected = Number(choice.dataset.option) === option;
      const correct = Number(choice.dataset.option) === quiz[question].answer;
      choice.classList.toggle("chosen", selected);
      choice.classList.toggle("correct", correct);
      choice.classList.toggle("wrong", selected && !correct);
    });
    let explanation = card.querySelector(".explanation");
    if (!explanation) {
      explanation = document.createElement("p");
      explanation.className = "explanation";
      card.appendChild(explanation);
    }
    explanation.innerHTML = "<strong>正确答案：" + quiz[question].correct + "</strong><span>" + quiz[question].explain + "</span>";
    const score = Object.entries(answers).filter(([q, a]) => quiz[Number(q)].answer === a).length;
    document.querySelector(".score-orb strong").textContent = score;
  }));
})();
`;

const html = "<!doctype html><html lang=\"zh-CN\"><head>"
  + "<meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
  + "<meta name=\"description\" content=\"以交互方式理解面向代表性不足语言的语音基础模型。\">"
  + "<title>GigaAM Multilingual · 交互式论文实验室</title>"
  + "<link rel=\"icon\" type=\"image/svg+xml\" href=\"./favicon.svg\">"
  + "<link rel=\"stylesheet\" href=\"./styles.css\"></head><body>"
  + markup + "<script>" + interactionScript + "</script></body></html>";

const dist = path.join(project, "dist");
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, "index.html"), html, "utf8");
fs.writeFileSync(path.join(dist, "styles.css"), css, "utf8");
fs.copyFileSync(path.join(project, "public", "favicon.svg"), path.join(dist, "favicon.svg"));
console.log(JSON.stringify({ output: dist, htmlBytes: Buffer.byteLength(html), cssBytes: Buffer.byteLength(css) }));
