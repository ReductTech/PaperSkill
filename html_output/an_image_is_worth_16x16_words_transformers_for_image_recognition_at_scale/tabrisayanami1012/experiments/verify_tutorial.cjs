/* Tests the real widget calculation exports; no browser, screenshot substitute, or extra package. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const localRequire = createRequire(path.join(root, 'package.json'));
const ts = localRequire('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} };
  cache.set(file, module);
  const { outputText, diagnostics } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, resolveJsonModule: true },
  });
  assert.equal((diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file);
  function resolve(request) {
    if (!request.startsWith('.')) return localRequire(request);
    const base = path.resolve(path.dirname(file), request);
    const match = [base, base + '.ts', base + '.tsx', base + '.json'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    assert.ok(match, `Missing import ${request}`);
    return load(match);
  }
  vm.runInNewContext(outputText, { module, exports: module.exports, require: resolve, console }, { filename: file });
  return module.exports;
}
const widget = n => load(path.join(root, 'src/modules', `vit-module-${n}.tsx`));
const plain = value => JSON.parse(JSON.stringify(value));
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const closeArray = (a, b, tolerance) => { assert.equal(a.length, b.length); a.forEach((v, i) => close(v, b[i], tolerance)); };
const results = load(path.join(__dirname, 'results.json'));
const tests = [];
const test = (name, run) => tests.push({ name, run });

test('10主题 / 19完整小节 / 21交互 / 57原总结 / 所有组件有实现', () => {
  const { tutorial, tutorialSections } = load(path.join(root, 'src/data/tutorial.ts'));
  const { widgetRegistry } = load(path.join(root, 'src/modules/registry.tsx'));
  assert.equal(tutorial.chapters.length, 10);
  assert.equal(tutorialSections.length, 19);
  assert.equal(tutorial.chapters.flatMap(ch => ch.modules).length, 19);
  assert.equal(tutorialSections.flatMap(ch => ch.modules).length, 21);
  assert.equal(tutorialSections.flatMap(ch => ch.takeaways).length, 57);
  assert.equal(tutorialSections.filter(ch => ch.formula).length, 7);
  const sectionIds = tutorial.chapters.flatMap(ch => ch.modules.map(m => m.id));
  assert.equal(new Set(sectionIds).size, 19);
  tutorialSections.forEach(section => {
    assert.ok(sectionIds.includes(section.id));
    assert.equal(section.takeaways.length, 3);
    assert.equal(typeof widgetRegistry[section.analogy.componentId], 'function');
    section.modules.forEach(m => assert.equal(typeof widgetRegistry[m.componentId], 'function'));
  });
  const ids = new Set();
  tutorial.chapters.forEach((ch, i) => {
    assert.equal(ch.id, `chap-${i + 1}`); assert.equal(ch.kind, 'chapter');
    assert.equal(ch.takeaways.length, 3);
    assert.equal(typeof widgetRegistry[ch.analogy.componentId], 'function');
    ch.modules.forEach(m => {
      assert.equal(m.kind, 'module'); assert.ok(!ids.has(m.id)); ids.add(m.id);
      assert.equal(typeof widgetRegistry[m.componentId], 'function');
    });
  });
});

test('4维到2维投影逐列计算，非法形状拒绝', () => {
  const { computePatchProjection, projectRow } = load(path.join(root, 'src/modules/vit-numbers.ts'));
  const actual = computePatchProjection();
  closeArray(actual.output, [1.5, 3.5]);
  closeArray(projectRow([2, 4, 6, 8], actual.rules), [3, 7]);
  assert.throws(() => projectRow([1, 2], [[1, 2]]));
  assert.throws(() => projectRow([1, 2], [[1], [1, 2]]));
  assert.throws(() => projectRow([], []));
});

test('每块均有QKV，三次投影与注意力输入一致', () => {
  const { computeQkv, projectRow, QUERY_RULES, KEY_RULES, VALUE_RULES } = load(path.join(root, 'src/modules/vit-numbers.ts'));
  const { KEYS, VALUES, computeAttentionExample } = widget(4);
  for (let part = 0; part < 3; part++) {
    const row = computeQkv(part);
    closeArray(row.k, KEYS[part]); closeArray(row.v, VALUES[part]);
    closeArray(row.q, projectRow(row.input, QUERY_RULES));
  }
  closeArray(computeQkv(0).q, computeAttentionExample(1).query);
  closeArray(projectRow([2, -1, 0.5], KEY_RULES), [1.5, -1]);
  closeArray(projectRow([2, -1, 0.5], VALUE_RULES), [2.5, -0.5]);
  assert.notDeepEqual(plain(computeQkv(2).k), plain(computeQkv(2).v));
  assert.throws(() => computeQkv(3)); assert.throws(() => computeQkv(-1));
});

test('零基础叙述包含目的、QKV来源与贯穿案例，原表仍有出处', () => {
  const { tutorial, tutorialSections } = load(path.join(root, 'src/data/tutorial.ts'));
  for (const chapter of tutorialSections) {
    const text = chapter.bridge + chapter.modules.map(m => m.desc).join('');
    assert.match(text, /房屋|房子|屋顶/);
    assert.ok(chapter.modules.every(m => m.desc.includes('<br/><br/>')), chapter.id);
  }
  const modules = tutorialSections.flatMap(ch => ch.modules);
  const qkv = modules.find(m => m.componentId === 'vit-module-4b').desc;
  for (const word of ['Query', 'Key', 'Value', '每一块', 'W_Q', 'W_K', 'W_V', '同一行']) assert.ok(qkv.includes(word));
  const resultsText = modules.filter(m => ['vit-module-10', 'vit-module-10b'].includes(m.componentId)).map(m => m.desc).join('');
  for (const word of ['表2', '表5', '表8', '61.382', '64.206', '76.28', '76.29']) assert.ok(resultsText.includes(word));
});

test('贯穿算例：同输入分别投影，注意力输出直接交给分类头', () => {
  const { recognition } = load(path.join(root, 'src/modules/vit-recognition-math.ts'));
  for (const a of [-20, -2, 0, 2, 20]) for (const context of [-1, 0, 1]) {
    const r = recognition(a, context);
    closeArray(r.q, r.inputs.map(x => x[0]));
    closeArray(r.k, r.inputs.map(x => a * x[0]));
    closeArray(r.v, r.inputs.map(x => x[1]));
    close(r.weights.reduce((s, w) => s + w, 0), 1);
    close(r.output, r.weights.reduce((s, w, i) => s + w * r.v[i], 0));
    closeArray(r.logits, [2 * r.output, -2 * r.output]);
    close(r.houseProbability, Math.exp(r.logits[0]) / r.logits.reduce((s, x) => s + Math.exp(x), 0));
    assert.ok(Number.isFinite(r.loss));
  }
  close(recognition(2, 1).houseProbability, 0.04537416300152879);
  assert.equal(recognition(2, 1).prediction, 'boat');
  assert.throws(() => recognition(Infinity, 1));
  assert.throws(() => recognition(0, 2));
});

test('同份额、不同V可以改变类别；上下文数值干预不偷改参数', () => {
  const { recognition, recognitionHistory } = load(path.join(root, 'src/modules/vit-recognition-math.ts'));
  const a = recognitionHistory()[8].a;
  const house = recognition(a, 1), missing = recognition(a, 0), boat = recognition(a, -1);
  closeArray(house.weights, boat.weights); closeArray(house.weights, missing.weights);
  assert.equal(house.prediction, 'house'); assert.equal(missing.prediction, 'boat');
  close(boat.output, -1); close(missing.houseProbability, 0.3430718880580835);
});

test('真实解析梯度对齐独立有限差分，8次SGD从错到对', () => {
  const { recognition, recognitionHistory } = load(path.join(root, 'src/modules/vit-recognition-math.ts'));
  const eps = 1e-5;
  for (const a of [-3, -1, 0, 1, 2, 3]) for (const context of [-1, -0.5, 0, 0.5, 1]) {
    const numerical = (recognition(a + eps, context).loss - recognition(a - eps, context).loss) / (2 * eps);
    close(recognition(a, context).gradient, numerical, 1e-8);
  }
  const history = recognitionHistory();
  assert.equal(history.length, 9);
  history.forEach((r, i) => {
    if (i) { close(r.a, history[i-1].a - history[i-1].gradient); assert.ok(r.loss < history[i-1].loss); }
  });
  close(history[1].a, 1.1981632852376563);
  assert.equal(history[0].prediction, 'boat'); assert.equal(history[1].prediction, 'boat');
  assert.equal(history[2].prediction, 'house'); close(history[2].houseProbability, 0.5384949618089521);
  close(history[8].houseProbability, 0.9370697550779865);
});

test('像素差异测量与物体识别的边界、连续案例边界写清楚', () => {
  const { edgeResponse } = load(path.join(root, 'src/modules/vit-recognition-math.ts'));
  close(edgeResponse('horizontal').response, 1);
  close(edgeResponse('vertical').response, 0); close(edgeResponse('flat').response, 0);
  const { tutorial, tutorialSections } = load(path.join(root, 'src/data/tutorial.ts'));
  const modules = tutorialSections.flatMap(ch => ch.modules);
  const mix = modules.find(m => m.componentId === 'vit-recognition-mix').desc;
  assert.match(mix, /不是程序从照片提取出来的/);
  assert.match(mix, /省略了位置、CLS、多头、残差和MLP/);
  const learn = modules.find(m => m.componentId === 'vit-recognition-learn').desc;
  for (const word of ['只改a', '不参与本次更新', '不是', '测试成绩']) assert.ok(learn.includes(word));
});

test('图块计数、边界与非法输入', () => {
  const { getPatchDimensions: dims } = widget(2);
  for (const [p, n, flat] of [[14, 256, 588], [16, 196, 768], [32, 49, 3072]]) {
    const d = dims(p, n - 1);
    assert.equal(d.count, n); assert.equal(d.sequence, n + 1); assert.equal(d.flatDim, flat);
    assert.equal(d.x1, 223); assert.equal(d.y1, 223);
  }
  assert.throws(() => dims(15)); assert.throws(() => dims(16, 196)); assert.throws(() => dims(16, -1));
});

test('无位置时交换只排列权重，不改变汇总', () => {
  const compute = widget(3).computePositionExample;
  const a = compute(false, false), b = compute(true, false);
  closeArray(a.output, b.output);
  closeArray(a.weights, [...b.weights].reverse());
  closeArray(a.output, [0.6697615493266569, 0.3302384506733431]);
});

test('固定位置时数值按真实二维softmax重算', () => {
  const compute = widget(3).computePositionExample;
  const a = compute(false, true), b = compute(true, true);
  closeArray(a.output, [1.114225027191552, 0.385774972808448], 1e-8);
  closeArray(b.output, [0.793739500419804, 0.706260499580196], 1e-8);
  assert.ok(Math.abs(a.output[0] - b.output[0]) > 0.3);
});

test('注意力滑条全41状态保持归一化并正确汇总V', () => {
  const { computeAttentionExample, VALUES } = widget(4);
  for (let i = -20; i <= 20; i++) {
    const row = computeAttentionExample(i / 10);
    close(row.weightSum, 1);
    assert.ok(row.weights.every(x => x > 0 && Number.isFinite(x)));
    for (let j = 0; j < 2; j++) close(row.output[j], row.weights.reduce((s, w, k) => s + w * VALUES[k][j], 0));
  }
});

test('网页注意力初值与独立Python记录一致', () => {
  const actual = widget(4).computeAttentionExample(1);
  closeArray(actual.weights, results.attention_example.weights);
  closeArray(actual.output, results.attention_example.output);
});

test('LayerNorm、两段残差与固定教学增量', () => {
  const { encoderExample, layerNorm } = widget(5);
  const ex = encoderExample();
  closeArray(ex.afterAttention, [1.2, 1.9, 3.3, 4]);
  closeArray(ex.afterMlp, [1.1, 2.1, 3.4, 3.8]);
  close(ex.firstNorm.mean, 2.5); close(ex.firstNorm.variance, 1.25);
  close(ex.firstNorm.values.reduce((s, x) => s + x, 0), 0);
  closeArray(layerNorm([7, 7, 7, 7]).values, [0, 0, 0, 0]);
});

test('分类头矩阵乘法、类别概率与数值稳定性', () => {
  const { computeClassifierExample, classSoftmax } = widget(6);
  const c = computeClassifierExample();
  closeArray(c.logits, [1, -1, -1]); closeArray(c.probabilities, [0.7869860421615984, 0.10650697891920076, 0.10650697891920076]);
  closeArray(classSoftmax([1001, 999, 999]), c.probabilities);
});

test('五步SGD逐行对齐独立Python记录', () => {
  const rows = widget(7).calculateHistory();
  assert.equal(rows.length, 6);
  rows.forEach((row, i) => {
    for (const key of ['weight', 'probability', 'loss']) close(row[key], results.sgd_example[i][key]);
    if (i) assert.ok(row.loss < rows[i - 1].loss);
  });
});

test('模型规格与高分辨率整数账单', () => {
  const { specs } = widget(8);
  assert.deepEqual(plain([specs.B16.depth, specs.B16.width, specs.B16.heads, specs.B16.mlp]), [12, 768, 12, 3072]);
  assert.deepEqual(plain([specs.L16.depth, specs.L16.width, specs.L16.heads, specs.L16.mlp]), [24, 1024, 16, 4096]);
  assert.deepEqual(plain([specs.H14.depth, specs.H14.width, specs.H14.heads, specs.H14.mlp]), [32, 1280, 16, 5120]);
  results.resolution_checks.forEach(r => {
    assert.equal(r.resolution % r.patch, 0);
    assert.equal(r.patches, (r.resolution / r.patch) ** 2);
    assert.equal(r.tokens, r.patches + 1); assert.equal(r.per_head_attention_elements, r.tokens ** 2);
  });
  assert.notEqual(384 % specs.H14.patch, 0); assert.notEqual(518 % specs.B16.patch, 0);
});

test('论文Table2数据与单位不混淆，L的VTAB不虚增', () => {
  const { vitPaperResults: r } = widget(10);
  assert.deepEqual(plain(r.ImageNet.values), [88.55, 87.76, 87.54]);
  assert.deepEqual(plain(r.CIFAR100.values), [94.55, 93.9, 93.51]);
  assert.deepEqual(plain(r.VTAB.values), [77.63, 76.28, 76.29]);
  assert.deepEqual(plain(r.coreDays.values), [2500, 680, 9900]);
  assert.ok(r.VTAB.values[1] < r.VTAB.values[2]);
  assert.equal(r.coreDays.deviations.length, 0);
});

test('实验脚本SHA与五种子统计一致', () => {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'verify_vit.py'))).digest('hex');
  assert.equal(hash, results.script_sha256);
  for (const position of [false, true]) {
    const values = results.experiment.trials.filter(t => t.position === position).map(t => t.test_accuracy);
    assert.equal(values.length, 5);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1));
    const saved = results.experiment.summary.find(s => s.position === position);
    close(mean, saved.mean_test_accuracy); close(std, saved.sample_std_test_accuracy);
  }
});


test('19节逐字段内容快照一致（仅变更编号和导航措辞）', () => {
  const { tutorialSections } = load(path.join(root, 'src/data/tutorial.ts'));
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'regroup-baseline.json'), 'utf8'));
  for (const item of baseline.sections) {
    const section = tutorialSections.find(s => s.sourceChapter === item.sourceChapter);
    assert.ok(section, item.title);
    assert.equal(section.title, item.title);
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(section)).digest('hex'), item.sha256, item.title);
  }
});

if (process.argv[2]) test('本次独立复跑与原始记录一致（不比较耗时）', () => {
  const rerun = load(path.resolve(process.argv[2]));
  const saved = plain(results);
  delete rerun.elapsed_seconds; delete saved.elapsed_seconds;
  assert.deepEqual(rerun, saved);
});

let failed = 0;
for (const { name, run } of tests) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`\n${tests.length - failed}/${tests.length} checks passed.`);
process.exitCode = failed ? 1 : 0;
