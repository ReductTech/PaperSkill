import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modelPath = resolve(projectRoot, 'src/modules/gct-system-model.ts');
const systemPath = resolve(projectRoot, 'src/modules/gct-system.tsx');
const kitPath = resolve(projectRoot, 'src/modules/gct-kit.ts');
const viewportPath = resolve(projectRoot, 'src/components/CanvasViewport.tsx');
const componentsCssPath = resolve(projectRoot, 'src/styles/components.css');

assert.ok(existsSync(modelPath), '缺少可测试的第4章交互状态模型 gct-system-model.ts');

const modelSource = readFileSync(modelPath, 'utf8');
const modelJs = ts.transpileModule(modelSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
  },
}).outputText;
const model = await import(`data:text/javascript;base64,${Buffer.from(modelJs).toString('base64')}`);

const kitSource = readFileSync(kitPath, 'utf8');
const kitSourceFile = ts.createSourceFile(kitPath, kitSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
let exportedWidth;
let roundedRectStrokeWidth;
for (const statement of kitSourceFile.statements) {
  if (ts.isVariableStatement(statement) && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'WIDTH' && declaration.initializer && ts.isNumericLiteral(declaration.initializer)) {
        exportedWidth = Number(declaration.initializer.text);
      }
    }
  }
  if (ts.isFunctionDeclaration(statement) && statement.name?.text === 'roundedRect') {
    const visit = (node) => {
      if (
        ts.isBinaryExpression(node)
        && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
        && ts.isPropertyAccessExpression(node.left)
        && node.left.expression.getText(kitSourceFile) === 'ctx'
        && node.left.name.text === 'lineWidth'
        && ts.isNumericLiteral(node.right)
      ) roundedRectStrokeWidth = Number(node.right.text);
      ts.forEachChild(node, visit);
    };
    visit(statement);
  }
}
assert.equal(exportedWidth, 640, 'gct-kit exports the real 640px canvas extent');

const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const isInside = (inner, outer) => (
  inner.left >= outer.left
  && inner.right <= outer.right
  && inner.top >= outer.top
  && inner.bottom <= outer.bottom
);
const roundedBounds = (bounds) => Object.fromEntries(
  Object.entries(bounds).map(([key, value]) => [key, Number(value.toFixed(3))]),
);

assert.equal(model.TRAINING_CANVAS_HEIGHT, 400, '4.2 canvas height is part of the pointer-coordinate contract');
assert.equal(model.ROPE_CANVAS_HEIGHT, 350, '4.3 canvas height is part of the pointer-coordinate contract');
assert.equal(model.ROUNDED_RECT_STROKE_WIDTH, 1.5, 'collision bounds use the roundedRect helper stroke width');
assert.equal(model.ROUNDED_RECT_STROKE_WIDTH, roundedRectStrokeWidth, 'pure collision geometry matches the production roundedRect stroke');
assert.equal(model.TRAINING_LAYOUT.canvas.right, exportedWidth, 'training reference extent matches the production canvas width');
assert.equal(model.ROPE_LAYOUT.canvas.right, exportedWidth, 'RoPE reference extent matches the production canvas width');

for (const [progress, views] of [[0, 24], [25, 98], [50, 172], [75, 246], [100, 320]]) {
  assert.equal(model.trainingViewsFromProgress(progress), views, `${progress}% should map to ${views} training views`);
}

assert.deepEqual(model.TRAINING_PROGRESS_TRACK, { left: 170, right: 586 });
assert.equal(model.trainingProgressAtX(169), 0, 'training hit map clamps before the track');
assert.equal(model.trainingProgressAtX(170), 0);
assert.equal(model.trainingProgressAtX(172.079), 0, 'the first integer step stays below its exact midpoint');
assert.equal(model.trainingProgressAtX(172.08), 1, 'the first integer step changes at its exact midpoint');
assert.equal(model.trainingProgressAtX(378), 50, 'the training track midpoint maps to 50%');
assert.equal(model.trainingProgressAtX(583.919), 99);
assert.equal(model.trainingProgressAtX(583.92), 100, 'the last integer step changes at its exact midpoint');
assert.equal(model.trainingProgressAtX(586), 100);
assert.equal(model.trainingProgressAtX(587), 100, 'training hit map clamps after the track');

assert.deepEqual(model.TRAINING_DRAG_TARGET, { left: 42, top: 119, right: 604, bottom: 221 });
for (const [x, y] of [[42, 119], [604, 119], [42, 221], [604, 221], [323, 170]]) {
  assert.equal(model.isTrainingDragTarget(x, y), true, `training drag target should include (${x}, ${y})`);
}
for (const [x, y] of [[41.999, 170], [604.001, 170], [323, 118.999], [323, 221.001]]) {
  assert.equal(model.isTrainingDragTarget(x, y), false, `training drag target should exclude (${x}, ${y})`);
}

assert.deepEqual(model.trainingTrajectoryPoint(0), [170, 199]);
assert.deepEqual(model.trainingTrajectoryPoint(50), [378, 159]);
assert.deepEqual(model.trainingTrajectoryPoint(100), [586, 199]);
for (const progress of [0, 25, 50, 75, 100]) {
  const geometry = model.trainingWindowLayoutAt(progress);
  assert.ok(geometry.window.left >= 42 && geometry.window.right <= 600, `${progress}% window stays within x=42..600`);
  assert.equal(geometry.window.top, 119);
  assert.equal(geometry.window.bottom, 221);
  assert.equal(geometry.cameraBounds.length, 4);
  for (const camera of geometry.cameraBounds) {
    assert.ok(camera.top > model.TRAINING_LAYOUT.windowDividerY, `${progress}% camera renders below divider y=140`);
    assert.ok(isInside(camera, geometry.window), `${progress}% camera renders inside the recent-frame window`);
    assert.ok(isInside(camera, model.TRAINING_LAYOUT.trajectoryCard), `${progress}% camera renders inside the trajectory card`);
  }
  assert.equal(overlaps(geometry.currentLabel, model.TRAINING_LAYOUT.fixedNote), false, `${progress}% current label does not collide with the fixed note`);
}
for (const [a, b] of [
  [model.TRAINING_LAYOUT.supervisionRegion, model.TRAINING_LAYOUT.matrixRegion],
  [model.TRAINING_LAYOUT.supervisionRegion, model.TRAINING_LAYOUT.footerRegion],
  [model.TRAINING_LAYOUT.matrixRegion, model.TRAINING_LAYOUT.footerRegion],
]) {
  assert.equal(overlaps(a, b), false, 'training supervision, matrix, and footer regions remain disjoint');
  assert.ok(isInside(a, model.TRAINING_LAYOUT.canvas), 'assigned training regions stay inside the canvas');
  assert.ok(isInside(b, model.TRAINING_LAYOUT.canvas), 'assigned training regions stay inside the canvas');
}

assert.equal(model.trainingViewsFromProgress(-10), 24, '训练进度下界应钳制为24 views');
assert.equal(model.trainingViewsFromProgress(0), 24);
assert.equal(model.trainingViewsFromProgress(50), 172);
assert.equal(model.trainingViewsFromProgress(100), 320);
assert.equal(model.trainingViewsFromProgress(150), 320, '训练进度上界应钳制为320 views');

assert.deepEqual(model.ROPE_TIMES, ['t−4', 't−3', 't−2', 't−1', 't']);
assert.equal(model.clampRopeTimeIndex(-1), 0);
assert.equal(model.clampRopeTimeIndex(7), 4);
assert.equal(model.ropeTimeAt(0), 't−4');
assert.equal(model.ropeTimeAt(4), 't');
assert.equal(model.ropeOffsetFromCurrent(0), 4);
assert.equal(model.ropeOffsetFromCurrent(4), 0);

assert.deepEqual(model.ROPE_TIME_CENTERS, [150, 245, 340, 435, 530]);
for (const [x, expected] of [
  [0, 0], [150, 0], [197.499, 0], [197.5, 1], [292.499, 1], [292.5, 2],
  [387.499, 2], [387.5, 3], [482.499, 3], [482.5, 4], [530, 4], [640, 4],
]) {
  assert.equal(model.ropeIndexAtX(x), expected, `RoPE x=${x} should hit state ${expected}`);
}
assert.deepEqual(model.ROPE_DRAG_TARGET, { left: 120, top: 42, right: 555, bottom: 96 });
assert.deepEqual(model.ropeLayoutAt(0).selectedToken, {
  drawRect: { left: 140, top: 65, right: 160, bottom: 85 },
  renderedBounds: { left: 139.25, top: 64.25, right: 160.75, bottom: 85.75 },
}, 'selected token exposes its exact draw rect and 1.5px rendered stroke bounds');
assert.deepEqual(model.ropeLayoutAt(4).selectedToken, {
  drawRect: { left: 520, top: 65, right: 540, bottom: 85 },
  renderedBounds: { left: 519.25, top: 64.25, right: 540.75, bottom: 85.75 },
});
assert.deepEqual(model.ROPE_LAYOUT.fixedQueryBadgeRendered, { left: 364.25, top: 45.25, right: 495.75, bottom: 62.75 });
assert.deepEqual(model.ROPE_LAYOUT.fixedQueryArrowRendered, { left: 496, top: 68.5, right: 516, bottom: 77.5 });
assert.deepEqual(model.ROPE_LAYOUT.readoutRendered, { left: 499.25, top: 189.25, right: 600.75, bottom: 266.75 });
assert.deepEqual(model.ROPE_LEFT_VECTOR, {
  originX: 158,
  originY: 246,
  endX: 236,
  endY: 210,
  markerRadius: 6,
  labelX: 248,
  labelBaseline: 207,
});
assert.deepEqual(model.ROPE_DIAGRAM, {
  centerX: 414,
  centerY: 253,
  vectorRadius: 58,
  firstAngle: -1.2,
  angleStep: 0.6,
  axes: { left: 345, top: 198, right: 485, bottom: 291, lineWidth: 1.5 },
  arcRadius: 33,
  arcEndAngle: 1.2,
  arcLineWidth: 2,
});
const expectedVectorEndpoints = [
  [435.017, 198.942],
  [461.869, 220.251],
  [472, 253],
  [461.869, 285.749],
  [435.017, 307.058],
];
const expectedGhostVectorBounds = [
  { left: 413.068, top: 195.942, right: 438.017, bottom: 253.362 },
  { left: 413.435, top: 217.251, right: 464.869, bottom: 253.825 },
  { left: 414, top: 250, right: 475, bottom: 256 },
  { left: 413.435, top: 252.175, right: 464.869, bottom: 288.749 },
  { left: 413.068, top: 252.638, right: 438.017, bottom: 310.058 },
];
const expectedSelectedVectorBounds = [
  { left: 412.369, top: 193.942, right: 440.017, bottom: 253.634 },
  { left: 413.012, top: 215.251, right: 466.869, bottom: 254.444 },
  { left: 414, top: 248, right: 477, bottom: 258 },
  { left: 413.012, top: 251.556, right: 466.869, bottom: 290.749 },
  { left: 412.369, top: 252.366, right: 440.017, bottom: 312.058 },
];
for (const [x, y] of [[120, 42], [555, 42], [120, 96], [555, 96], [340, 79]]) {
  assert.equal(model.isRopeDragTarget(x, y), true, `RoPE drag target should include (${x}, ${y})`);
}
for (const [x, y] of [[119.999, 79], [555.001, 79], [340, 41.999], [340, 96.001]]) {
  assert.equal(model.isRopeDragTarget(x, y), false, `RoPE drag target should exclude (${x}, ${y})`);
}
for (let index = 0; index < model.ROPE_TIMES.length; index += 1) {
  const geometry = model.ropeLayoutAt(index);
  const diagram = model.ropeDiagramLayoutAt(index);
  assert.equal(overlaps(geometry.selectedToken.renderedBounds, model.ROPE_LAYOUT.fixedQueryBadgeRendered), false, `RoPE state ${index} token clears fixed-query badge stroke`);
  assert.equal(overlaps(geometry.selectedToken.renderedBounds, model.ROPE_LAYOUT.fixedQueryArrowRendered), false, `RoPE state ${index} token clears fixed-query arrow stroke`);
  assert.ok(isInside(geometry.selectedToken.renderedBounds, model.ROPE_LAYOUT.canvas), `RoPE state ${index} token stays inside 640x350`);
  assert.deepEqual(diagram.center, { x: 414, y: 253 });
  assert.equal(diagram.vectors.length, 5);
  diagram.vectors.forEach((vector, vectorIndex) => {
    assert.deepEqual(
      [Number(vector.endX.toFixed(3)), Number(vector.endY.toFixed(3))],
      expectedVectorEndpoints[vectorIndex],
      `RoPE state ${index} vector ${vectorIndex} endpoint remains exact`,
    );
    assert.deepEqual(
      roundedBounds(vector.renderedBounds),
      vectorIndex === index ? expectedSelectedVectorBounds[vectorIndex] : expectedGhostVectorBounds[vectorIndex],
      `RoPE state ${index} vector ${vectorIndex} rendered bounds remain exact`,
    );
    assert.ok(isInside(vector.renderedBounds, model.ROPE_LAYOUT.canvas), `RoPE state ${index} vector ${vectorIndex} stays inside 640x350`);
  });
  assert.ok(model.ROPE_LAYOUT.readoutRendered.left - diagram.renderedBounds.right >= 12, `RoPE state ${index} diagram clears the readout`);
  assert.ok(isInside(diagram.renderedBounds, model.ROPE_LAYOUT.canvas), `RoPE state ${index} diagram stays inside 640x350`);
}
assert.ok(model.ROPE_LAYOUT.leftMarkerLabel.left - model.ROPE_LAYOUT.leftMarker.right >= 6, 'left marker-to-label gap is at least 6px');
for (const bounds of Object.values(model.ROPE_LAYOUT)) {
  if (typeof bounds === 'object') assert.ok(isInside(bounds, model.ROPE_LAYOUT.canvas), 'RoPE layout bounds stay inside 640x350');
}

const systemSource = readFileSync(systemPath, 'utf8');
const viewportSource = readFileSync(viewportPath, 'utf8');
const componentsCssSource = readFileSync(componentsCssPath, 'utf8');
const trainingStart = systemSource.indexOf('export const TrainingSupport');
const ropeStart = systemSource.indexOf('export const VideoRopeDemo');
const pagedStart = systemSource.indexOf('const PHYSICAL_ORDER');
assert.ok(trainingStart >= 0 && ropeStart > trainingStart && pagedStart > ropeStart, '第4章模块边界缺失');

const trainingSource = systemSource.slice(trainingStart, ropeStart);
assert.doesNotMatch(systemSource, /LegacyTrainingSupport|LegacyVideoRopeDemo/, '旧版 4.2/4.3 交互必须删除，而不是改名留作死代码');
assert.deepEqual(model.trainingWindowProgresses(0), [-18, -12, -6, 0], '0% 时也必须显示四个互不重合的代表帧');
assert.deepEqual(model.trainingWindowProgresses(100), [82, 88, 94, 100]);
assert.match(trainingSource, /onPointerDown=/, '4.2 应支持直接拖动当前相机');
assert.match(trainingSource, /onPointerMove=/);
assert.match(trainingSource, /onKeyDown=/, '4.2 Canvas 应支持键盘方向键');
assert.match(trainingSource, /type="range"/, '4.2 应保留同步的无障碍精调控件');
assert.match(trainingSource, /trainingViewsFromProgress/);
assert.match(trainingSource, /touchAction:\s*'pan-y'/, '4.2 横向拖动不能被触屏滚动手势吞掉');
assert.match(trainingSource, /role="slider"/, '可键盘拖动的 4.2 Canvas 应暴露 slider 语义');
assert.match(trainingSource, /isTrainingDragTarget/, '4.2 只能从相机轨迹区域开始拖动');
assert.match(trainingSource, /ArrowUp/, '4.2 slider 语义必须支持上方向键');
assert.match(trainingSource, /ArrowDown/, '4.2 slider 语义必须支持下方向键');
assert.match(trainingSource, /建立几何基础/, '4.2 应说明 Base 2–24 views 的教学作用');

const ropeSource = systemSource.slice(ropeStart, pagedStart);
assert.match(systemSource, /function drawPairMatrix\(/, '4.2 应使用关系矩阵表达全部 i≠j');
assert.match(systemSource, /相对位姿监督 · 代表帧对/, '4.2 应有独立代表帧对区域');
assert.match(systemSource, /全部 i≠j 有向帧对/, '4.2 应有独立关系矩阵区域');
assert.doesNotMatch(systemSource, /for \(let first = 0; first < windowPoints\.length/, '轨迹区不应继续绘制完全图');
assert.match(systemSource, /固定查询帧/, '4.3 应使用独立 query 徽标');
assert.match(systemSource, /相对时间读数/, '4.3 应使用独立读数卡');
assert.match(ropeSource, /onPointerDown=/, '4.3 应支持直接拖动同一个 token');
assert.match(ropeSource, /onPointerMove=/);
assert.match(ropeSource, /onKeyDown=/, '4.3 Canvas 应支持键盘方向键');
assert.match(ropeSource, /type="range"/, '4.3 应保留同步的无障碍精调控件');
assert.doesNotMatch(ropeSource, /<button/, '4.3 不应继续使用三个纯高亮时间按钮');
assert.match(ropeSource, /二维.*示意|二维投影/, '4.3 应显式声明二维旋转只是机制示意');
assert.match(ropeSource, /touchAction:\s*'pan-y'/, '4.3 横向拖动不能被触屏滚动手势吞掉');
assert.match(ropeSource, /role="slider"/, '可键盘拖动的 4.3 Canvas 应暴露 slider 语义');
assert.match(ropeSource, /isRopeDragTarget/, '4.3 只能从 token 时间轴区域开始拖动');
assert.match(ropeSource, /ArrowUp/, '4.3 slider 语义必须支持上方向键');
assert.match(ropeSource, /ArrowDown/, '4.3 slider 语义必须支持下方向键');

const sourceFile = ts.createSourceFile(systemPath, systemSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function componentNode(name) {
  let match;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) match = node;
    if (!match) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  assert.ok(match, `missing ${name} component AST node`);
  return match;
}
function functionNode(name) {
  let match;
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) match = node;
    if (!match) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  assert.ok(match, `missing ${name} function AST node`);
  return match;
}
function jsxElements(root, tagName) {
  const matches = [];
  const visit = (node) => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(sourceFile) === tagName) matches.push(node);
    ts.forEachChild(node, visit);
  };
  visit(root);
  return matches;
}
function attributeText(element, name) {
  const attribute = element.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.text === name);
  assert.ok(attribute?.initializer, `missing ${name} on ${element.tagName.getText(sourceFile)}`);
  return attribute.initializer.getText(sourceFile);
}
for (const contract of [
  { name: 'TrainingSupport', height: 'TRAINING_CANVAS_HEIGHT', state: 'trainingProgress', setter: 'setTrainingProgress' },
  { name: 'VideoRopeDemo', height: 'ROPE_CANVAS_HEIGHT', state: 'timeIndex', setter: 'setTimeIndex' },
]) {
  const component = componentNode(contract.name);
  const componentText = component.getText(sourceFile);
  const canvas = jsxElements(component, 'canvas')[0];
  const viewport = jsxElements(component, 'CanvasViewport')[0];
  const range = jsxElements(component, 'input').find((element) => attributeText(element, 'type') === '"range"');
  assert.ok(canvas && viewport && range, `${contract.name} keeps viewport, canvas, and fallback range controls`);
  assert.equal(attributeText(viewport, 'mobileMinWidth'), '{640}', `${contract.name} keeps a readable 640px local mobile canvas`);
  assert.equal(attributeText(canvas, 'width'), '{WIDTH}', `${contract.name} canvas consumes the exported kit width`);
  assert.equal(attributeText(canvas, 'height'), `{${contract.height}}`, `${contract.name} canvas uses its exact model height`);
  assert.equal(attributeText(canvas, 'aria-valuenow'), `{${contract.state}}`);
  assert.match(attributeText(canvas, 'aria-valuetext'), new RegExp(contract.state));
  assert.equal(attributeText(canvas, 'aria-controls'), '{sliderId}');
  assert.equal(attributeText(canvas, 'aria-describedby'), '{feedbackId}');
  assert.equal(attributeText(range, 'value'), `{${contract.state}}`, `${contract.name} fallback range reads the same state`);
  assert.match(attributeText(range, 'onInput'), new RegExp(contract.setter), `${contract.name} fallback range writes the same state`);
  assert.match(componentText, new RegExp(`useStaticCanvas\\(draw, ${contract.height}\\)`), `${contract.name} draw setup uses the exact height`);
  assert.match(componentText, new RegExp(`eventCanvasY\\(event, ${contract.height}\\)`), `${contract.name} pointer y conversion uses the exact height`);
  for (const lifecycleMember of ['setPointerCapture', 'hasPointerCapture', 'releasePointerCapture', 'onPointerCancel']) {
    assert.match(componentText, new RegExp(lifecycleMember), `${contract.name} preserves ${lifecycleMember} lifecycle handling`);
  }
  assert.match(componentText, /closest\(['"]\.canvas-viewport['"]\)/, `${contract.name} resolves its local CanvasViewport`);
  assert.match(componentText, /viewport\.scrollLeft\s*=/, `${contract.name} pans only the local mobile viewport`);
}

const trainingDrawSource = functionNode('drawTrainingCanvas').getText(sourceFile);
for (const region of ['trajectoryCard', 'fixedNote', 'supervisionRegion', 'matrixRegion', 'footerRegion']) {
  assert.match(trainingDrawSource, new RegExp(`TRAINING_LAYOUT\\.${region}`), `training renderer consumes ${region} geometry`);
}
assert.match(trainingDrawSource, /roundedRect\(ctx, trajectoryCard\.left, trajectoryCard\.top, trajectoryCard\.right - trajectoryCard\.left, trajectoryCard\.bottom - trajectoryCard\.top/, 'trajectory card draw call consumes its tested bounds');
assert.match(trainingDrawSource, /label\(ctx, '窗口外轨迹淡化；未来路径为中性虚线', fixedNote\.left, fixedNote\.bottom - 2/, 'fixed-note draw call consumes its tested region');
assert.match(trainingDrawSource, /drawSmallCamera\(ctx, supervisionRegion\.left \+ 53, supervisionRegion\.top \+ 49/, 'supervision camera draw call consumes its assigned region');
assert.match(trainingDrawSource, /drawPairMatrix\(ctx, matrixRegion\.left, matrixRegion\.top \+ 21\)/, 'pair-matrix draw call consumes its assigned region');
assert.match(trainingDrawSource, /label\(ctx, '拖动橙色相机[^']+', footerRegion\.left, footerRegion\.top \+ 12/, 'footer draw call consumes its assigned region');
assert.match(trainingDrawSource, /windowGeometry\.currentLabel/, 'training renderer consumes the tested current-label geometry');

const ropeDrawSource = functionNode('drawRopeCanvas').getText(sourceFile);
for (const geometryContract of ['ROPE_LEFT_VECTOR', 'ROPE_QUERY', 'ROPE_READOUT', 'ropeDiagramLayoutAt']) {
  assert.match(ropeDrawSource, new RegExp(geometryContract), `RoPE renderer consumes ${geometryContract}`);
}
assert.match(functionNode('drawContentVector').getText(sourceFile), /lineTo\(ROPE_LEFT_VECTOR\.endX, ROPE_LEFT_VECTOR\.endY\)/, 'left vector line consumes its tested endpoint');
assert.match(ropeDrawSource, /drawDot\(ctx, ROPE_LEFT_VECTOR\.endX, ROPE_LEFT_VECTOR\.endY, ROPE_LEFT_VECTOR\.markerRadius/, 'left marker consumes its tested center and radius');
assert.match(ropeDrawSource, /label\(ctx, 'x', ROPE_LEFT_VECTOR\.labelX, ROPE_LEFT_VECTOR\.labelBaseline/, 'left marker label consumes its tested anchor');
assert.match(ropeDrawSource, /roundedRect\(ctx, query\.badge\.left, query\.badge\.top/, 'fixed-query badge consumes shared query geometry');
assert.match(ropeDrawSource, /roundedRect\(ctx, selectedToken\.drawRect\.left, selectedToken\.drawRect\.top, selectedToken\.drawRect\.right - selectedToken\.drawRect\.left, selectedToken\.drawRect\.bottom - selectedToken\.drawRect\.top/, 'selected token draw call consumes the exact model draw rect');
assert.match(ropeDrawSource, /arrow\(ctx, query\.arrow\.startX, query\.arrow\.y, query\.arrow\.endX, query\.arrow\.y/, 'fixed-query arrow consumes shared query geometry');
assert.match(ropeDrawSource, /ctx\.moveTo\(diagram\.axes\.left, diagram\.center\.y\)/, 'RoPE axes consume shared diagram geometry');
assert.match(ropeDrawSource, /ctx\.lineTo\(vector\.endX, vector\.endY\)/, 'RoPE vectors consume pure endpoint geometry');
assert.match(ropeDrawSource, /ctx\.arc\(diagram\.center\.x, diagram\.center\.y, diagram\.arc\.radius, diagram\.arc\.startAngle, diagram\.arc\.endAngle\)/, 'RoPE arc consumes shared center/radius/angles');
assert.match(ropeDrawSource, /roundedRect\(ctx, readout\.card\.left, readout\.card\.top/, 'readout card consumes shared readout geometry');

const viewportSourceFile = ts.createSourceFile(viewportPath, viewportSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let viewportRegion;
const visitViewport = (node) => {
  if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(viewportSourceFile) === 'div') {
    const classAttribute = node.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.text === 'className');
    if (classAttribute?.initializer?.getText(viewportSourceFile) === '"canvas-viewport"') viewportRegion = node;
  }
  ts.forEachChild(node, visitViewport);
};
visitViewport(viewportSourceFile);
assert.ok(viewportRegion, 'CanvasViewport renders a local div region');
const viewportAttributeText = (name) => {
  const attribute = viewportRegion.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.text === name);
  assert.ok(attribute?.initializer, `CanvasViewport region is missing ${name}`);
  return attribute.initializer.getText(viewportSourceFile);
};
assert.equal(viewportAttributeText('role'), '"region"');
assert.equal(viewportAttributeText('aria-label'), '{label}');
assert.equal(viewportAttributeText('tabIndex'), '{0}', 'local overflow region remains keyboard focusable');
assert.equal(viewportAttributeText('style'), '{style}');
assert.match(viewportSource, /['"]--canvas-mobile-min['"]\s*:\s*`\$\{mobileMinWidth\}px`/, 'CanvasViewport wires mobileMinWidth into its CSS variable');

const viewportRule = componentsCssSource.match(/\.canvas-viewport\s*\{([^}]*)\}/)?.[1] ?? '';
assert.match(viewportRule, /overflow-x\s*:\s*auto\s*;/, 'CanvasViewport owns local horizontal overflow');
const narrowCanvasRule = componentsCssSource.match(/@media\s*\(max-width:\s*720px\)[\s\S]*?\.canvas-viewport\s+canvas\s*\{([^}]*)\}/)?.[1] ?? '';
assert.match(narrowCanvasRule, /width\s*:\s*var\(--canvas-mobile-min\)\s*!important\s*;/, 'narrow canvas width uses the local CSS variable');
assert.match(narrowCanvasRule, /min-width\s*:\s*var\(--canvas-mobile-min\)\s*;/, 'narrow canvas min-width preserves readable geometry');
assert.match(narrowCanvasRule, /max-width\s*:\s*none\s*!important\s*;/, 'narrow canvas overrides the desktop max-width cap');
const ghostSkip = systemSource.indexOf('if (index === selected) return;');
const selectedVector = systemSource.indexOf('drawContentVector(ctx, overlapX, overlapY, COLORS.orange, 1)');
assert.ok(ghostSkip >= 0 && selectedVector > ghostSkip, '4.3 应先画幽灵向量，再把当前选中向量画在最上层');

const pagedHash = createHash('sha256').update(systemSource.slice(pagedStart)).digest('hex').toUpperCase();
assert.equal(pagedHash, 'D8A1DFFD7A8E08DFA85C8DCEF0433ADDDD44498E25F966B6608476F0C7A3DBF5', '4.4 Paged KV 实现不得改变');

console.log('ch4 interaction contract: PASS');
