import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Compile the same TypeScript module the page imports, without creating build files.
const source = await readFile(new URL('../src/modules/labModel.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(outputText).toString('base64');
const { allocation, received, hidden, PATCHES, position } = await import(moduleUrl);
const patches = Array.from({ length: PATCHES }, (_, i) => i);
const ascending = (a, b) => a - b;

const initial = allocation('CLIP', 9, 3);
const a3 = patches.find(i => position(i) === 'A3');
const b5 = patches.find(i => position(i) === 'B5');
assert.equal(initial.groupOf[a3], 0);
assert.equal(position(initial.groups[0].target), 'A1');
assert.ok(initial.groups[0].donors.includes(a3));
assert.ok(initial.dominant.includes(b5));
assert.equal(initial.ranked[0], b5);
console.log('默认 CLIP 路径通过：A3 贡献给以 A1 为代表的 G1，B5 作为主导 patch 保留。');

let configurations = 0;
let emptyGroups = 0;
for (const encoder of ['CLIP', 'SigLIP']) {
  const cls = encoder === 'CLIP' ? 1 : 0;
  const scores = received[encoder];
  assert.equal(scores.length, PATCHES);
  assert.ok(scores.every(s => Number.isFinite(s) && s >= 0));
  const descendingScore = [...patches].sort((a, b) => scores[b] - scores[a] || a - b);

  // A legal allocation needs at least one contextual slot. Include the edge
  // cases with zero dominant patches, and with all remaining patches as targets.
  for (let budget = cls + 1; budget <= PATCHES + cls; budget++) {
    for (let contextual = 1; contextual <= budget - cls; contextual++) {
      const label = encoder + ' / budget=' + budget + ' / contextual=' + contextual;
      const result = allocation(encoder, budget, contextual);
      const kept = budget - cls - contextual;
      assert.equal(result.clsCount, cls, label);
      assert.equal(result.groups.length, contextual, label);
      assert.deepEqual(result.dominant, descendingScore.slice(0, kept).sort(ascending), label);
      assert.equal(cls + result.dominant.length + result.groups.length, budget, label);

      const assigned = [...result.dominant];
      for (const patch of result.dominant) assert.equal(result.groupOf[patch], -1, label);
      for (const [index, group] of result.groups.entries()) {
        assigned.push(group.target, ...group.donors);
        assert.equal(result.groupOf[group.target], index, label);
        for (const patch of group.donors) assert.equal(result.groupOf[patch], index, label);

        const expected = [...hidden[group.target]];
        if (group.donors.length === 0) {
          emptyGroups++;
        } else {
          for (let d = 0; d < expected.length; d++) {
            const sum = group.donors.reduce((total, p) => total + hidden[p][d], 0);
            expected[d] += sum / group.donors.length;
          }
        }
        assert.deepEqual(group.vector, expected, label);
      }
      assert.deepEqual(assigned.sort(ascending), patches, label);
      configurations++;
    }
  }
}

const receivedMass = received.SigLIP.reduce((sum, score) => sum + score, 0);
assert.ok(Math.abs(receivedMass - 1) < 1e-12, 'SigLIP 接收分的总和应为 1');
console.log('通过：' + configurations + ' 组 CLIP / SigLIP 预算配置，' + PATCHES + ' 个 patch 均恰好归属一次。');
console.log('通过：主导排序、预算守恒、成员归属与隐藏特征聚合，含 ' + emptyGroups + ' 个无组员代表。');
console.log('通过：SigLIP 接收分总和为 1（容差 1e-12）。');
