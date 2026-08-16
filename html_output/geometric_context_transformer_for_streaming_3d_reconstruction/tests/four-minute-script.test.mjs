import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = resolve(projectRoot, '4min版本讲稿.md');
const evidenceComponentPath = resolve(projectRoot, 'src', 'modules', 'evidence-boundary.tsx');

assert.ok(existsSync(scriptPath), `缺少四分钟讲稿：${scriptPath}`);

const script = readFileSync(scriptPath, 'utf8');
assert.ok(existsSync(evidenceComponentPath), `缺少证据组件：${evidenceComponentPath}`);
const evidenceComponent = readFileSync(evidenceComponentPath, 'utf8');
const findOpeningJsxTagEnd = (markup) => {
  let braceDepth = 0;
  let quote = null;
  for (let index = 0; index < markup.length; index += 1) {
    const character = markup[index];
    if (quote) {
      if (character === '\\') index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
    } else if (character === '{') {
      braceDepth += 1;
    } else if (character === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
    } else if (character === '>' && braceDepth === 0) {
      return index;
    }
  }
  return -1;
};
const extractWindowToggleLabel = (tsx) => {
  const button = Array.from(tsx.matchAll(/<button\b[\s\S]*?<\/button>/gu), (match) => match[0]).find((markup) =>
    /\bonClick\s*=\s*\{[\s\S]*?\bsetView\s*\(\s*['"]window['"]\s*(?:,\s*)?\)[\s\S]*?\}/u.test(markup),
  );
  assert.ok(button, '证据组件必须包含 setView(\'window\') 的切换按钮');
  const openingTagEnd = findOpeningJsxTagEnd(button);
  const closingTagStart = button.lastIndexOf('</button>');
  assert.ok(openingTagEnd >= 0 && closingTagStart > openingTagEnd, 'Window 64 切换按钮必须有可见文本');
  return button.slice(openingTagEnd + 1, closingTagStart)
    .replace(/\{\/\*[\s\S]*?\*\/\}/gu, ' ')
    .replace(/\{\s*(['"`])([\s\S]*?)\1\s*\}/gu, '$2')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
};
assert.equal(
  extractWindowToggleLabel(`<button\n  type="button"\n  onClick={\n    () => setView('window')\n  }\n>\n  Window 64\n  vs Full\n</button>`),
  'Window 64 vs Full',
  '切换标签提取必须容忍普通 JSX 换行与空白格式',
);
const evidenceToggleLabel = extractWindowToggleLabel(evidenceComponent);
assert.equal(evidenceToggleLabel, 'Window 64 vs Full', '证据组件必须暴露 Window 64 vs Full 切换标签');

const expectedTimeRanges = [
  '0:00–0:18',
  '0:18–0:48',
  '0:48–1:42',
  '1:42–2:15',
  '2:15–2:52',
  '2:52–3:28',
  '3:28–4:00',
];

for (const timeRange of expectedTimeRanges) {
  assert.ok(script.includes(timeRange), `四分钟讲稿缺少时间段：${timeRange}`);
}

const parseTimestamp = (timestamp) => {
  const [minutes, seconds] = timestamp.split(':').map(Number);
  return minutes * 60 + seconds;
};

const timestampHeadingPattern = /^#{1,6}[ \t]*(\d+:\d{2})–(\d+:\d{2})[^\r\n]*$/gmu;
const timestampHeadings = Array.from(script.matchAll(timestampHeadingPattern), (match) => ({
  end: parseTimestamp(match[2]),
  index: match.index,
  range: match[1] + '–' + match[2],
  start: parseTimestamp(match[1]),
}));

assert.equal(timestampHeadings.length, expectedTimeRanges.length, '四分钟讲稿必须恰好有7个时间戳标题');
assert.deepEqual(
  timestampHeadings.map(({ range }) => range),
  expectedTimeRanges,
  '时间戳标题必须按指定顺序出现',
);
assert.equal(timestampHeadings[0].start, 0, '第一个时间戳必须从0:00开始');
for (let index = 0; index < timestampHeadings.length; index += 1) {
  const heading = timestampHeadings[index];
  assert.ok(heading.end > heading.start, '时间戳时长必须为正：' + heading.range);
  if (index > 0) {
    assert.equal(heading.start, timestampHeadings[index - 1].end, '时间戳之间必须连续：' + heading.range);
  }
}
assert.equal(timestampHeadings.at(-1).end, 4 * 60, '七段时间戳总时长必须为240秒');

const timestampSections = timestampHeadings.map((heading, index) => {
  const nextHeading = timestampHeadings[index + 1];
  return script.slice(heading.index, nextHeading?.index ?? script.length);
});

const countOccurrences = (text, value) => text.split(value).length - 1;
const extractLabeledBlock = (section, label, nextLabel) => {
  const block = section.match(new RegExp('\\*\\*' + label + '\\*\\*[\\s\\S]*?(?=\\*\\*' + nextLabel + '\\*\\*)'));
  assert.ok(block, '时间戳段缺少可提取的' + label + '块');
  return block[0].slice(('**' + label + '**').length).trimStart().replace(/^[：:]+/u, '').trimStart();
};

const spokenBlocks = [];
const operationCues = [];
for (const [index, section] of timestampSections.entries()) {
  for (const label of ['页面操作', '逐字稿', '超时可删']) {
    assert.equal(countOccurrences(section, '**' + label + '**'), 1, '第' + (index + 1) + '段必须恰好有一个**' + label + '**');
  }
  operationCues.push(extractLabeledBlock(section, '页面操作', '逐字稿'));
  spokenBlocks.push(extractLabeledBlock(section, '逐字稿', '超时可删'));
}

assert.equal(
  countOccurrences(operationCues.join('\n'), '继续学习'),
  5,
  '七段页面操作提示中必须恰好出现5次继续学习',
);

const normalizedSpokenBlocks = spokenBlocks.map((block) => block.replaceAll('`', '').replaceAll('*', ''));
const spokenBlockCodePointCounts = normalizedSpokenBlocks.map((block) =>
  Array.from(block).filter((codePoint) => !/\s/u.test(codePoint)).length,
);
const nonWhitespaceUnicodeCodePoints = spokenBlockCodePointCounts.reduce(
  (total, count) => total + count,
  0,
);
assert.ok(
  nonWhitespaceUnicodeCodePoints >= 1050 && nonWhitespaceUnicodeCodePoints <= 1150,
  '七段逐字稿必须包含1050–1150个非空白 Unicode code points，实际为' + nonWhitespaceUnicodeCodePoints,
);
console.log(
  'spoken block non-whitespace Unicode code points: ' + spokenBlockCodePointCounts.join(', ') + ' = ' + nonWhitespaceUnicodeCodePoints,
);

for (const label of ['页面操作', '逐字稿', '超时可删']) {
  assert.ok(script.includes(label), `四分钟讲稿缺少 recurring label：${label}`);
}

for (const anchor of [
  'M+6',
  'c+a+4r',
  'N_GCA',
  '10,000',
  '非 O(1)',
  '6.42',
  '7.11',
  '20.29 FPS',
  'RPE-rot',
  '1.71',
  '1.93',
  '约 3,000 帧',
  'Sim(3)',
  'loop closure',
  'test-time optimization',
]) {
  assert.ok(script.includes(anchor), `四分钟讲稿缺少事实锚点：${anchor}`);
}

for (const obsoleteReference of ['1.2', '2.2', '3.2']) {
  const escapedReference = obsoleteReference.replace('.', '\\.');
  const contextAwarePageReference = new RegExp(
    `(?:模块|页面|章节|§)\\s*${escapedReference}(?=$|[\\s:：—–-])|(?:^|\\n)[ \\t]*(?:#{1,6}\\s*|[-*+]\\s+|\\d+[.)]\\s+)${escapedReference}(?=$|[\\s:：—–-])`,
    'mu',
  );
  assert.doesNotMatch(script, contextAwarePageReference, `四分钟讲稿不应引用旧页面：${obsoleteReference}`);
}

for (const figureNumber of ['3', '4']) {
  assert.doesNotMatch(
    script,
    new RegExp(`\\bFigure\\s+${figureNumber}(?!\\.\\d)\\b`),
    `四分钟讲稿不应引用旧图：Figure ${figureNumber}`,
  );
}


const preflight = script.slice(0, timestampHeadings[0].index);
for (const [index, codePointCount] of spokenBlockCodePointCounts.entries()) {
  const durationSeconds = timestampHeadings[index].end - timestampHeadings[index].start;
  const spokenDensity = codePointCount / durationSeconds;
  assert.ok(
    spokenDensity <= 5.2,
    '第' + (index + 1) + '段逐字稿密度必须不超过5.2个非空白 Unicode code points/秒，实际为' + spokenDensity.toFixed(2),
  );
}
assert.match(preflight, /(?:第一章|第\s*1\s*章|Chapter\s*1)/iu, '首个时间戳前必须明确指向第一章');
assert.match(preflight, /(?:\bT\b|滑杆|滑块|slider)/iu, '首个时间戳前必须包含T或滑杆操作语境');
assert.match(preflight, /(?:拖|拖动|拖到|点击|操作|回到)/u, '首个时间戳前必须包含可执行操作语境');
assert.match(
  preflight,
  /(?<![\d.])36(?![\d.])[\s\S]*?(?:(?:约|大约|about|around|≈|~)\s*)(?<![\d.])12(?![\d.])[\s\S]*?(?<![\d.])36(?![\d.])/iu,
  '首个时间戳前必须保留有边界的Chapter 1真实端点序列36→约12→36',
);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
const assertSectionMatch = (section, pattern, message) => assert.match(section, pattern, message);
const tartanProtocolBoundaryPattern = /(?:另(?:一个|一套|外(?:的)?|外一套)|另外(?:的)?|独立(?:的)?|单独(?:的)?)\s*TartanGround(?:\s*(?:验证|实验|消融|对照))?\s*(?:协议|设置)/iu;

const assertSectionActions = (operations) => {
  const [hero, chapter1, chapter2, chapter3, chapter4, chapter5, chapter6] = operations;
  const chapterOperations = [chapter1, chapter2, chapter3, chapter4, chapter5];

  assertSectionMatch(
    chapter1,
    /(?<![\d.])36(?![\d.])[\s\S]*?(?:约|大约|about|around|≈|~)\s*(?<![\d.])12(?![\d.])[\s\S]*?(?<![\d.])36(?![\d.])/iu,
    '第 1 章操作必须在本章内保留 36→约12→36 的真实滑杆序列',
  );

  for (const [index, operation] of chapterOperations.entries()) {
    const nextSection = index + 2;
    assert.equal(
      countOccurrences(operation, '继续学习'),
      1,
      `第 ${index + 1} 章操作必须只包含本章的一个继续学习解锁`,
    );
    assertSectionMatch(
      operation,
      new RegExp(`继续学习\\s*§\\s*${nextSection}(?!\\d)`, 'u'),
      `第 ${index + 1} 章操作必须解锁继续学习 §${nextSection}`,
    );
  }
  assert.doesNotMatch(hero, /继续学习/u, 'Hero 操作不得提前放置章节解锁');
  assert.doesNotMatch(chapter6, /继续学习/u, '第 6 章操作不得出现不存在的后续解锁');
};

const assertSectionFacts = (spoken, operations, toggleLabel) => {
  const [, chapter1, chapter2, chapter3, chapter4, chapter5, chapter6] = spoken;

  assertSectionMatch(chapter1, /Full\s*Causal[\s\S]*?(?:全部过去|所有过去)/iu, '第 1 章必须说明 Full Causal 保留全部过去');
  assertSectionMatch(chapter1, /Sliding\s*Window[\s\S]*?最近\s*k\s*帧[\s\S]*?(?:丢|失去)远期参照/iu, '第 1 章必须说明 Sliding Window 只留最近 k 帧并失去远期参照');
  assertSectionMatch(chapter1, /GCA[\s\S]*?Anchor[、,，\s]+Window[\s\S]*?Memory[\s\S]*?分工/iu, '第 1 章必须说明 GCA 的 Anchor、Window、Memory 分工');
  assertSectionMatch(chapter1, /(?:不是|不作|不做)[^。；;]{0,12}精度排名/u, '第 1 章必须明确这不是精度排名');

  assertSectionMatch(chapter2, /一帧[^。；;]{0,24}M\s*\+\s*6/iu, '第 2 章必须把一帧说明为 M+6');
  assertSectionMatch(chapter2, /c\s*\+\s*a\s*\+\s*4r/iu, '第 2 章必须给出 c+a+4r 的组成');
  assertSectionMatch(chapter2, /Anchor[\s\S]{0,32}Window[\s\S]{0,32}(?:完整保留|保留完整)[\s\S]{0,12}M\s*\+\s*6/iu, '第 2 章必须说明 Anchor 和 Window 都完整保留 M+6');
  assertSectionMatch(chapter2, /普通旧非\s*Anchor[\s\S]{0,32}丢\s*M[\s\S]{0,32}(?:只留|保留)[\s\S]{0,24}(?:c\s*\+\s*a\s*\+\s*4r\s*=\s*6|6)[\s\S]{0,24}Memory/iu, '第 2 章必须说明旧非 Anchor 帧丢 M、保留 6 个 token 进 Memory');
  assertSectionMatch(chapter2, /不是[^。；;]{0,24}M[^。；;]{0,24}池化[^。；;]{0,24}六个\s*token/iu, '第 2 章必须否定把 M 池化成六个 token');
  assertSectionMatch(chapter2, /a\s*不是\s*Anchor\s*frames/iu, '第 2 章必须明确 a 不等于 Anchor frames');

  assertSectionMatch(operations[3], /10[，,]?000/u, '第 3 章操作必须将 T 设到 10,000');
  assertSectionMatch(chapter3, /N_GCA\s*=\s*\(\s*n\s*\+\s*k\s*\)\s*M\s*\+\s*6T/iu, '第 3 章必须给出 N_GCA=(n+k)M+6T');
  assertSectionMatch(chapter3, /N_causal\s*=\s*T\s*\(\s*M\s*\+\s*6\s*\)/iu, '第 3 章必须给出 N_causal=T(M+6)');
  assertSectionMatch(chapter3, /n\s*=\s*3[、,，\s]+k\s*=\s*16[、,，\s]+M\s*(?:约|≈|~)\s*五百/iu, '第 3 章必须把 n=3、k=16、M≈500 放在同一例子');
  assertSectionMatch(chapter3, /Full\s*Causal[^。；;]{0,40}5[，,]?060[，,]?000[^。；;]{0,40}GCA[^。；;]{0,40}69[，,]?500/iu, '第 3 章必须按 Full Causal 5,060,000 对 GCA 69,500 的方向陈述总量');
  assertSectionMatch(chapter3, /每帧边际[^。；;]{0,20}506[^。；;]{0,20}(?:对|vs\.?)[^。；;]{0,20}6[^。；;]{0,32}(?:约\s*)?80\s*倍/iu, '第 3 章必须把边际 506 对 6 与约 80 倍关联');
  assertSectionMatch(chapter3, /(?:不是|非)[^。；;]{0,24}(?:总内存|总显存|总.*显存)[^。；;]{0,16}倍数/u, '第 3 章必须明确约 80 倍不是总内存或显存倍数');
  assertSectionMatch(chapter3, /非\s*O\(1\)[\s\S]{0,64}默认推理\s*k\s*=\s*64[\s\S]{0,24}分开/iu, '第 3 章必须把非 O(1) 与默认 k=64 的独立语境分开');

  assertSectionMatch(chapter4, /Paged\s*KV[\s\S]{0,24}FlashInfer/iu, '第 4 章必须把 Paged KV 与 FlashInfer 作为同一动态缓存支路说明');
  assertSectionMatch(chapter4, /Video\s*RoPE[^。；;]{0,40}(?:不做|不是)[^。；;]{0,40}(?:匹配|回环|轨迹优化)/iu, '第 4 章必须界定 Video RoPE 的非匹配、非回环、非轨迹优化边界');
  assertSectionMatch(chapter4, /(?:约\s*)?20\s*FPS[^。；;]{0,100}518\s*[×x]\s*378[^。；;]{0,48}≤\s*1[，,]?000\s*帧[^。；;]{0,48}k\s*=\s*64[^。；;]{0,48}bfloat16/iu, '第 4 章必须将运行时结论绑定到 518×378、≤1,000 帧、k=64、bfloat16');
  assert.doesNotMatch(chapter4, /\b(?:Direct|VO)\b/iu, '第 4 章不得混入第 6 章的 Direct/VO 运行方式');

  assert.equal(toggleLabel, 'Window 64 vs Full', '证据组件当前切换标签必须保持 Window 64 vs Full');
  assertSectionMatch(operations[5], new RegExp(`(?:点击|切换)[^。；;]{0,40}${escapeRegExp(toggleLabel)}`, 'iu'), '第 5 章操作必须使用证据组件当前的 Window 64 vs Full 标签');
  const tartanBoundary = chapter5.match(tartanProtocolBoundaryPattern);
  assert.ok(tartanBoundary?.index > 0, '第 5 章必须以清晰的另一套/独立 TartanGround 协议分隔两套证据');
  const oxfordPart = chapter5.slice(0, tartanBoundary.index);
  const tartanPart = chapter5.slice(tartanBoundary.index);
  assert.doesNotMatch(oxfordPart, /TartanGround|RPE-rot/u, 'Oxford 部分不得混入 TartanGround 的 RPE-rot 协议');
  assertSectionMatch(oxfordPart, /Oxford[\s\S]{0,48}(?:稀疏|sparse)[\s\S]{0,28}(?:每\s*)?12\s*帧[\s\S]{0,28}320\s*帧/iu, '第 5 章 Oxford 部分必须给出 sparse stride 12 / 320 帧');
  assertSectionMatch(oxfordPart, /(?:稠密|dense)[\s\S]{0,32}3[，,]?840\s*帧/iu, '第 5 章 Oxford 部分必须给出 dense 3,840 帧');
  assertSectionMatch(oxfordPart, /ATE[^。；;]{0,28}6\.42[^。；;]{0,28}7\.11/iu, '第 5 章 Oxford 部分必须保持 ATE 6.42→7.11 的方向');
  assertSectionMatch(oxfordPart, /(?:稠密|dense)[\s\S]{0,48}20\.29\s*FPS/iu, '第 5 章 Oxford 部分必须把 20.29 FPS 绑定到 dense 设置');
  assertSectionMatch(oxfordPart, /只有\s*两个点/u, '第 5 章 Oxford 部分必须保留“只有两个点”的证据边界');
  assertSectionMatch(tartanPart, /TartanGround[\s\S]{0,28}320\s*帧[、,，\s]+stride\s*8/iu, '第 5 章 TartanGround 部分必须给出 320 帧、stride 8');
  assertSectionMatch(tartanPart, /Window\s*64[^。；;]{0,28}RPE-rot[^。；;]{0,28}1\.93[^。；;]{0,28}Full[^。；;]{0,28}1\.71[^。；;]{0,28}Full[^。；;]{0,20}(?:旋转)?更好/iu, '第 5 章 TartanGround 部分必须保留 Window RPE-rot 1.93、Full 1.71 且 Full 更好');
  assertSectionMatch(tartanPart, /协议不可混用/u, '第 5 章必须明确两套协议不可混用');

  assertSectionMatch(chapter6, /Direct[^。；;]{0,48}(?:约\s*)?3[，,]?000\s*帧[^。；;]{0,32}(?:非|不是)[^。；;]{0,16}硬阈值/iu, '第 6 章必须把 Direct 的约 3,000 帧表述为非硬阈值经验观察');
  assertSectionMatch(chapter6, /VO[\s\S]{0,140}重叠窗[\s\S]{0,80}reset[\s\S]{0,80}Sim\(3\)[\s\S]{0,80}数万帧[\s\S]{0,80}边界误差[\s\S]{0,40}(?:累积|积累)/iu, '第 6 章必须说明 VO 的重叠窗、reset、Sim(3)、数万帧与边界误差');
  assertSectionMatch(chapter6, /三限[\s\S]{0,80}回环[\s\S]{0,80}固定六\s*token[\s\S]{0,80}测试时优化/iu, '第 6 章必须列出三项局限性');
  assertSectionMatch(chapter6, /(?:非|不是)[^。；;]{0,16}完整\s*SLAM/u, '第 6 章必须明确 GCT/GCA 不是完整 SLAM 后端');
};

const assertScriptRelations = (operations, spoken, toggleLabel) => {
  assertSectionActions(operations);
  assertSectionFacts(spoken, operations, toggleLabel);
};

assertScriptRelations(operationCues, normalizedSpokenBlocks, evidenceToggleLabel);

const assertMutationRejected = (name, mutate, expectedFailure) => {
  const mutatedOperations = [...operationCues];
  const mutatedSpoken = [...normalizedSpokenBlocks];
  mutate(mutatedOperations, mutatedSpoken);
  assert.throws(
    () => assertScriptRelations(mutatedOperations, mutatedSpoken, evidenceToggleLabel),
    expectedFailure,
    `mutation probe must reject ${name}`,
  );
  console.log(`mutation probe rejected: ${name}`);
};

const assertMutationAccepted = (name, mutate) => {
  const mutatedOperations = [...operationCues];
  const mutatedSpoken = [...normalizedSpokenBlocks];
  mutate(mutatedOperations, mutatedSpoken);
  assert.doesNotThrow(
    () => assertScriptRelations(mutatedOperations, mutatedSpoken, evidenceToggleLabel),
    `mutation probe must accept ${name}`,
  );
  console.log(`mutation probe accepted: ${name}`);
};

assertMutationRejected(
  'inverted TartanGround RPE-rot values',
  (_operations, spoken) => {
    spoken[5] = spoken[5].replace(
      'Window 64 的 RPE-rot 为 1.93，Full 为 1.71，Full 旋转更好',
      'Window 64 的 RPE-rot 为 1.71，Full 为 1.93，Full 旋转更好',
    );
  },
  /TartanGround 部分/u,
);
assertMutationRejected(
  'missing bfloat16 runtime condition',
  (_operations, spoken) => {
    spoken[4] = spoken[4].replace('bfloat16', 'half precision');
  },
  /运行时结论/u,
);
assertMutationRejected(
  'Chapter 1 unlock placed in Hero',
  (operations) => {
    operations[0] += '，随后点击“继续学习 §2”。';
    operations[1] = operations[1].replace('继续学习 §2', '开始学习');
  },
  /第 1 章操作/u,
);
assertMutationAccepted(
  'equivalent independent TartanGround protocol boundary',
  (_operations, spoken) => {
    spoken[5] = spoken[5].replace('另一个 TartanGround 协议', '独立的 TartanGround 验证协议');
  },
);
assertMutationRejected(
  'mixed Oxford and TartanGround protocols before the boundary',
  (_operations, spoken) => {
    spoken[5] = spoken[5].replace('Oxford 稀疏设置', 'Oxford / TartanGround 稀疏设置');
  },
  /Oxford 部分不得混入/u,
);

console.log('four-minute script contract: PASS');
