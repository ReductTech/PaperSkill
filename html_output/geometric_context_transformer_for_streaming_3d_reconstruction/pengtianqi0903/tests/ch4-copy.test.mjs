import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseSource(fileName, text, scriptKind = ts.ScriptKind.TS) {
  return {
    fileName,
    text,
    sourceFile: ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind),
  };
}

function readSource(relativePath, scriptKind = ts.ScriptKind.TS) {
  const fileName = resolve(projectRoot, relativePath);
  return parseSource(fileName, readFileSync(fileName, 'utf8'), scriptKind);
}

function propertyName(property) {
  if (!property.name) return undefined;
  return ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
    ? property.name.text
    : undefined;
}

function propertyValue(object, name) {
  const property = object.properties.find(
    (candidate) => ts.isPropertyAssignment(candidate) && propertyName(candidate) === name,
  );
  assert.ok(property, `expected ${name} property`);
  return property.initializer;
}

function asObject(node, label) {
  assert.ok(ts.isObjectLiteralExpression(node), `${label} must be an object literal`);
  return node;
}

function asArray(node, label) {
  assert.ok(ts.isArrayLiteralExpression(node), `${label} must be an array literal`);
  return node;
}

function stringValue(node, label) {
  assert.ok(ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node), `${label} must be a string literal`);
  return node.text;
}

function objectString(object, name) {
  return stringValue(propertyValue(object, name), name);
}

function objectArray(object, name) {
  return asArray(propertyValue(object, name), name);
}

function findTutorialObject(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'tutorial' && declaration.initializer) {
        return asObject(declaration.initializer, 'tutorial');
      }
    }
  }
  assert.fail('tutorial export was not found');
}

function visibleText(node, sourceFile) {
  const strings = [];
  const visit = (current) => {
    if (ts.isTemplateExpression(current)) {
      strings.push(current.head.text);
      for (const span of current.templateSpans) {
        strings.push('template-expression');
        visit(span.expression);
        strings.push(span.literal.text);
      }
      return;
    }
    if (ts.isStringLiteral(current) || ts.isNoSubstitutionTemplateLiteral(current)) {
      strings.push(current.text);
    } else if (ts.isJsxText(current)) {
      strings.push(current.getText(sourceFile));
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return strings.join(' ');
}

function registryEntries(sourceFile) {
  const entries = [];
  const visit = (node) => {
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isElementAccessExpression(node.left) &&
      ts.isIdentifier(node.left.expression) &&
      node.left.expression.text === 'widgetRegistry' &&
      node.left.argumentExpression &&
      ts.isStringLiteral(node.left.argumentExpression)
    ) {
      assert.ok(ts.isIdentifier(node.right), `registry entry ${node.left.argumentExpression.text} must use an imported component`);
      entries.push({ id: node.left.argumentExpression.text, localName: node.right.text });
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return entries;
}

function importBindings(sourceFile) {
  const bindings = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const specifier = stringValue(statement.moduleSpecifier, 'import specifier');
    const clause = statement.importClause;
    if (clause.name) bindings.set(clause.name.text, { specifier, importedName: 'default' });
    if (!clause.namedBindings) continue;
    if (ts.isNamespaceImport(clause.namedBindings)) {
      bindings.set(clause.namedBindings.name.text, { specifier, importedName: '*' });
      continue;
    }
    for (const element of clause.namedBindings.elements) {
      bindings.set(element.name.text, {
        specifier,
        importedName: element.propertyName?.text ?? element.name.text,
      });
    }
  }
  return bindings;
}

function isExported(statement) {
  return Boolean(statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function exportedDeclaration(sourceFile, exportedName) {
  for (const statement of sourceFile.statements) {
    if (ts.isVariableStatement(statement) && isExported(statement)) {
      const declaration = statement.declarationList.declarations.find(
        (candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === exportedName,
      );
      if (declaration) return declaration;
    }
    if (
      isExported(statement) &&
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      statement.name?.text === exportedName
    ) {
      return statement;
    }
  }
  assert.fail(`could not find registered export ${exportedName} in ${sourceFile.fileName}`);
}

function registeredComponentDeclarations(registrySourceFile, resolveImport) {
  const bindings = importBindings(registrySourceFile);
  return registryEntries(registrySourceFile).map(({ id, localName }) => {
    const binding = bindings.get(localName);
    assert.ok(binding && binding.importedName !== '*', `registry component ${id} must resolve through a named or default import`);
    const source = resolveImport(binding.specifier);
    return {
      id,
      sourceFile: source.sourceFile,
      declaration: exportedDeclaration(source.sourceFile, binding.importedName),
    };
  });
}

function resolveRegistryImport(registry, specifier) {
  assert.ok(specifier.startsWith('.'), `registry import ${specifier} must be local`);
  const base = resolve(dirname(registry.fileName), specifier);
  const candidate = [
    `${base}.ts`,
    `${base}.tsx`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx'),
  ].find(existsSync);
  assert.ok(candidate, `could not resolve active registry import ${specifier}`);
  return readSource(candidate, candidate.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}

function sentences(text) {
  return text.split(/[。！？!?\n]+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function affirmativeO1Claims(text) {
  return sentences(text).filter((sentence) => {
    if (!/O\s*\(\s*1\s*\)/i.test(sentence)) return false;
    if (/(?:并非|不是|不(?:是|为|可|应)|非)\s*(?:严格\s*)?O\s*\(\s*1\s*\)/i.test(sentence)) return false;
    if (/(?:不能|无法|不应|不要)[^。！？!?\n]{0,40}O\s*\(\s*1\s*\)/i.test(sentence)) return false;
    return /(?:(?:GCA|缓存|状态|memory|Memory|模型|方法|系统)\s*(?:(?:[:：·•=—–-])\s*)?(?:严格\s*)?O\s*\(\s*1\s*\)|(?:GCA|缓存|状态|memory|Memory|模型|方法|系统).{0,96}(?:是|为|达到|实现|保持|做到).{0,96}O\s*\(\s*1\s*\))/i.test(sentence);
  });
}

function affirmativeVoClaims(text) {
  return sentences(text).filter((sentence) => {
    const target = /(?:完整\s*SLAM|full\s*SLAM|零漂移|无漂移|zero[-\s]?drift)/i;
    if (!/(?:VO|视觉里程计)/i.test(sentence) || !target.test(sentence)) return false;
    if (/(?:并非|不是|不(?:是|为|等于)|不能|没有|并不)\s*(?:一套\s*)?(?:完整\s*SLAM|full\s*SLAM|零漂移|无漂移|zero[-\s]?drift)/i.test(sentence)) return false;
    return /(?:(?:VO|视觉里程计)\s*(?:(?:[:：·•=—–-])\s*)?(?:完整\s*SLAM|full\s*SLAM|零漂移|无漂移|zero[-\s]?drift)|(?:完整\s*SLAM|full\s*SLAM|零漂移|无漂移|zero[-\s]?drift)\s*(?:(?:[:：·•=—–-])\s*)?(?:VO|视觉里程计)|(?:VO|视觉里程计).{0,48}(?:就是|等于|成为|实现|提供|具备|达到).{0,32}(?:完整\s*SLAM|full\s*SLAM|零漂移|无漂移|zero[-\s]?drift)|(?:完整\s*SLAM|full\s*SLAM|零漂移|无漂移|zero[-\s]?drift).{0,48}(?:就是|等于|成为).{0,32}(?:VO|视觉里程计))/i.test(sentence);
  });
}

function fpsSentences(text) {
  return sentences(text).filter((sentence) => /\b20(?:\.\d+)?\s*FPS\b/i.test(sentence));
}

function affirmativeFpsSentences(text) {
  return fpsSentences(text).filter(
    (sentence) => !/(?:并非|不是|不(?:是|能|会|应)|不能|不可|不应|不要|not)[^。！？!?\n]{0,16}\b20(?:\.\d+)?\s*FPS\b/i.test(sentence),
  );
}

function universalFpsClaims(text) {
  return affirmativeFpsSentences(text).filter((sentence) => /(?:任何输入|所有序列|任意规模|始终|无条件|稳定达到)/.test(sentence));
}

function hasLinkedFpsConditions(text) {
  const runtimeConditions = /518\s*[×x]\s*378/.test(text)
    && /(?:≤\s*1,?000|不超过\s*1,?000)/.test(text)
    && /k\s*=\s*64/i.test(text)
    && /bfloat16/i.test(text);
  const evaluationConditions = /Oxford/i.test(text)
    && /(?:Dense|3,?840|stride)/i.test(text)
    && /(?:协议|Table|protocol)/i.test(text);
  return runtimeConditions || evaluationConditions;
}

function assertExactRegistryIds(actualIds, expectedIds) {
  assert.deepEqual([...actualIds].sort(), [...expectedIds].sort(), 'registry IDs must exactly equal tutorial hero/analogy/visible component IDs');
}

function assertNoUniversalFpsClaims(segments) {
  for (const { label, text } of segments) {
    assert.deepEqual(universalFpsClaims(text), [], `${label} must not make a universal ~20 FPS claim`);
  }
}

function assertQualifiedFpsClaims(segments) {
  const claims = segments.flatMap((segment) => affirmativeFpsSentences(segment.text).map((sentence) => ({ ...segment, sentence })));
  assert.ok(claims.length > 0, 'active sources must retain qualified ~20 FPS results');
  for (const { label, text, sentence } of claims) {
    assert.ok(hasLinkedFpsConditions(text), `${label} must qualify its ${sentence} claim with a linked runtime or evaluation condition block`);
  }
  return claims;
}

const tutorial = readSource('src/data/tutorial.ts');
const tutorialObject = findTutorialObject(tutorial.sourceFile);
const chapters = objectArray(tutorialObject, 'chapters').elements.map((chapter, index) =>
  asObject(chapter, `chapters[${index}]`),
);
const registry = readSource('src/modules/registry.tsx', ts.ScriptKind.TSX);
const registeredComponents = registeredComponentDeclarations(
  registry.sourceFile,
  (specifier) => resolveRegistryImport(registry, specifier),
);
const readme = readFileSync(resolve(projectRoot, 'README.md'), 'utf8');

const chapterIds = chapters.map((chapter) => objectString(chapter, 'id'));
const moduleRecords = chapters.flatMap((chapter) =>
  objectArray(chapter, 'modules').elements.map((module, index) => asObject(module, `${objectString(chapter, 'id')}.modules[${index}]`)),
);
const visibleModuleIds = moduleRecords.map((module) => objectString(module, 'id'));
const visibleComponentIds = moduleRecords.map((module) => objectString(module, 'componentId'));
const hero = asObject(propertyValue(tutorialObject, 'hero'), 'hero');
const tutorialComponentIds = [
  objectString(asObject(propertyValue(hero, 'oldMethod'), 'hero.oldMethod'), 'componentId'),
  objectString(asObject(propertyValue(hero, 'newMethod'), 'hero.newMethod'), 'componentId'),
  ...chapters.flatMap((chapter) => {
    const analogy = chapter.properties.find(
      (property) => ts.isPropertyAssignment(property) && propertyName(property) === 'analogy',
    );
    return analogy ? [objectString(asObject(analogy.initializer, 'analogy'), 'componentId')] : [];
  }),
  ...visibleComponentIds,
];
const tutorialText = visibleText(tutorialObject, tutorial.sourceFile);
const moduleTextByComponentId = new Map(moduleRecords.map((module) => [objectString(module, 'componentId'), visibleText(module, tutorial.sourceFile)]));
const activeTextSegments = [
  { label: 'tutorial', text: tutorialText },
  { label: 'README', text: readme },
  ...registeredComponents.map(({ id, declaration, sourceFile }) => ({
    label: `registered component ${id}`,
    text: [visibleText(declaration, sourceFile), moduleTextByComponentId.get(id) ?? ''].join(' '),
  })),
];
const activeText = activeTextSegments.map(({ text }) => text).join('\n');

assert.deepEqual(chapterIds, ['chap-1', 'chap-2', 'chap-3', 'chap-4', 'chap-5', 'chap-6']);
assert.deepEqual(visibleModuleIds, ['1.1', '2.1', '3.1', '4.1', '4.2', '4.3', '4.4', '5.1', '6.1']);
assert.deepEqual(visibleComponentIds, [
  'streaming-tradeoff',
  'gca-timeline',
  'memory-complexity-exact',
  'gct-pipeline',
  'training-support',
  'video-rope-demo',
  'paged-kv-demo',
  'long-sequence-evidence',
  'applicability-boundary',
]);
assert.ok(moduleRecords.every((module) => objectString(module, 'role') === 'primary'), 'all visible modules must remain primary');
assert.ok(!moduleRecords.some((module) => objectString(module, 'role') === 'supplementary'), 'no supplementary module may be active');

const registryEntriesNow = registryEntries(registry.sourceFile);
const registeredIds = new Set(registryEntriesNow.map(({ id }) => id));
assert.equal(registeredIds.size, registryEntriesNow.length, 'registry must not register the same visible ID twice');
assertExactRegistryIds(registeredIds, tutorialComponentIds);
assert.ok(
  ![...registeredIds].some((id) => /(?:^|-)attention(?:-|$)|context-ablation|token-lifecycle/i.test(id)),
  'registry must not expose obsolete attention/context-ablation/token-lifecycle widgets',
);

const chapter4 = chapters[3];
const chapter6 = chapters[5];
assert.deepEqual(
  objectArray(chapter4, 'modules').elements.map((module) => objectString(asObject(module, 'chap-4 module'), 'id')),
  ['4.1', '4.2', '4.3', '4.4'],
);
assert.doesNotMatch(visibleText(chapter4, tutorial.sourceFile), /\b(?:Direct|VO)\b/, 'chapter 4 must not teach Direct/VO');
assert.match(visibleText(chapter6, tutorial.sourceFile), /\bDirect\b/, 'chapter 6 must teach Direct');
assert.match(visibleText(chapter6, tutorial.sourceFile), /\bVO\b/, 'chapter 6 must teach VO');

const relationshipCopy = `${tutorialText}\n${readme}`;
assert.doesNotMatch(relationshipCopy, /不构成[\s\S]{0,80}(?:层级|先后|执行顺序)/, 'active tutorial/README must not teach a relationship disclaimer');
assert.doesNotMatch(relationshipCopy, /运行方式[\s\S]{0,80}(?:留到|放到|第\s*6\s*章)/, 'active tutorial/README must not defer runtime teaching to chapter 6');

assert.deepEqual(affirmativeO1Claims(activeText), [], 'active sources must not claim strict O(1) state');
assert.match(activeText, /(?:并非严格|非)\s*O\s*\(\s*1\s*\)/i, 'active sources must retain the non-O(1) boundary');
assert.deepEqual(affirmativeVoClaims(activeText), [], 'active sources must not equate VO with full SLAM or zero drift');
assert.match(activeText, /(?:不是一套|仍不是一套).{0,24}完整\s*SLAM\s*后端/, 'active sources must retain the SLAM limitation');
assert.match(activeText, /Sim\s*\(\s*3\s*\).{0,40}(?:误差|漂移).{0,16}(?:累积|可能)/, 'active sources must retain the VO drift limitation');

assertNoUniversalFpsClaims(activeTextSegments);
const fpsClaims = assertQualifiedFpsClaims(activeTextSegments);
assert.deepEqual(
  fpsClaims.filter(({ sentence }) => /(?:25\s*,?\s*000|2\.5\s*万|数万|万级|tens?\s+of\s+thousands)/i.test(sentence)),
  [],
  'affirmative ~20 FPS claims must not be tied to 25k/tens-of-thousands sequences',
);

assert.throws(
  () => assertExactRegistryIds([...tutorialComponentIds, 'unexpected-widget'], tutorialComponentIds),
  /registry IDs must exactly equal/,
  'synthetic probe: an arbitrary registry ID must be rejected',
);
assert.deepEqual(affirmativeO1Claims('GCA: O(1)'), ['GCA: O(1)'], 'synthetic probe: compact O(1) labels must be rejected');
for (const o1Label of ['GCA · O(1)', 'GCA O(1)', 'GCA - O(1)', 'GCA=O(1)']) {
  assert.deepEqual(affirmativeO1Claims(o1Label), [o1Label], `synthetic probe: ${o1Label} must be rejected`);
}
assert.deepEqual(affirmativeO1Claims('GCA 非 O(1)'), [], 'synthetic probe: explicit non-O(1) wording must remain allowed');
assert.deepEqual(affirmativeVoClaims('VO: full SLAM'), ['VO: full SLAM'], 'synthetic probe: compact VO/full-SLAM labels must be rejected');
for (const voLabel of ['VO · full SLAM', 'VO full SLAM', 'VO - full SLAM', 'VO=full SLAM']) {
  assert.deepEqual(affirmativeVoClaims(voLabel), [voLabel], `synthetic probe: ${voLabel} must be rejected`);
}
assert.deepEqual(affirmativeVoClaims('VO 不是完整 SLAM'), [], 'synthetic probe: explicit non-SLAM wording must remain allowed');

const templateProbe = parseSource(
  'template-probe.tsx',
  'export const Active = () => `GCA 是 ${mode} O(1)`;',
  ts.ScriptKind.TSX,
);
const templateProbeText = visibleText(exportedDeclaration(templateProbe.sourceFile, 'Active'), templateProbe.sourceFile);
assert.deepEqual(affirmativeO1Claims(templateProbeText), [templateProbeText], 'synthetic probe: template-expression O(1) claims must be rejected');
assert.deepEqual(
  fpsSentences('20 FPS。20.0 FPS。20.29 FPS'),
  ['20 FPS', '20.0 FPS', '20.29 FPS'],
  'synthetic probe: FPS selection must include integer and decimal 20.x values',
);
const universalFpsProbe = '稳定达到 20.29 FPS。条件为 518×378、≤1,000 帧、k=64、bfloat16。';
assert.throws(
  () => assertNoUniversalFpsClaims([{ label: 'synthetic universal FPS', text: universalFpsProbe }]),
  /universal ~20 FPS claim/,
  'synthetic probe: a universal FPS claim must fail despite a later condition block',
);
const qualifiedFpsProbe = '论文实现约 20 FPS。条件为 518×378、≤1,000 帧、k=64、bfloat16。';
assert.doesNotThrow(
  () => {
    assertNoUniversalFpsClaims([{ label: 'synthetic qualified FPS', text: qualifiedFpsProbe }]);
    assertQualifiedFpsClaims([{ label: 'synthetic qualified FPS', text: qualifiedFpsProbe }]);
  },
  'synthetic probe: a two-sentence condition-linked FPS claim may pass',
);

const dormantModule = parseSource(
  'components.tsx',
  "export const Active = () => 'safe copy'; export const Dormant = () => 'GCA: O(1)';",
  ts.ScriptKind.TSX,
);
const dormantRegistry = parseSource(
  'registry.tsx',
  "import { Active } from './components'; const widgetRegistry = {}; widgetRegistry['active'] = Active;",
  ts.ScriptKind.TSX,
);
const selectedSyntheticComponent = registeredComponentDeclarations(
  dormantRegistry.sourceFile,
  (specifier) => {
    assert.equal(specifier, './components');
    return dormantModule;
  },
);
assert.equal(selectedSyntheticComponent.length, 1, 'synthetic probe: only the registered export is selected');
assert.deepEqual(
  affirmativeO1Claims(visibleText(selectedSyntheticComponent[0].declaration, selectedSyntheticComponent[0].sourceFile)),
  [],
  'synthetic probe: dormant unregistered component copy must be ignored',
);

console.log('tutorial structure and copy contract: PASS');
