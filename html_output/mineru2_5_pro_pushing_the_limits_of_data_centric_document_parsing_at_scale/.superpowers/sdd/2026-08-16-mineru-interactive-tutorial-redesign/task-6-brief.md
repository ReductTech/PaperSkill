### Task 6: Experience Registry, App Integration, Hashes, and Progressive Unlock

**Files:**
- Create: `src/experiences/registry.tsx`
- Create: `src/components/ChapterExperience.test.tsx`
- Create: `src/components/ChapterExperience.tsx`
- Create: `src/components/ChapterEvidence.tsx`
- Create: `src/components/ProgressiveChapter.test.tsx`
- Create: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/DocumentPrimer.tsx`
- Modify: `src/components/ProgressiveChapter.tsx`
- Modify: `src/components/EvidencePanel.tsx`
- Modify: `src/styles/paper.css`

**Interfaces:**
- Consumes: all six experiences, `ChapterExperienceProps`, current tutorial data and glossary.
- Produces: `chapterExperienceRegistry`, `ChapterExperience`, meaningful-action chapter completion, restored deep links.

- [ ] **Step 1: Write failing registry and adapter tests**

Assert exact mappings:

```ts
expect(Object.keys(chapterExperienceRegistry)).toEqual([
  'step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6',
]);
```

Render Step 2 with a restored `{ moduleId: 'element-ddas', state: 'formula' }`; expect the microscope to open the formula view. Assert state callbacks preserve the component ID, not the display module ID.

- [ ] **Step 2: Run adapter tests and confirm failure**

Run: `npm test -- src/components/ChapterExperience.test.tsx`  
Expected: FAIL because the registry and adapter do not exist.

- [ ] **Step 3: Implement the registry and thin adapter**

`src/experiences/registry.tsx` maps six step IDs to the six components using this exact contract:

```ts
export type ChapterStepId = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5' | 'step-6';
export const chapterExperienceRegistry: Record<
  ChapterStepId,
  React.ComponentType<ChapterExperienceProps>
>;
```

`ChapterExperience` validates `stepId` against this registry and passes through the approved `ChapterExperienceProps`; it must not add a repeated title, term strip, control bar, or conclusion card. `ChapterEvidence` accepts `{ items: readonly EvidenceRef[]; title?: string }` and renders one closed disclosure.

- [ ] **Step 4: Write failing progressive-unlock tests**

Create `src/components/ProgressiveChapter.test.tsx` with a `ChapterUnlockProvider` wrapper containing `step-1` and `step-2`. Add `completed?: boolean` to the expected component API. Assert the next button is disabled and explains `瀹屾垚鏈珷涓绘搷浣滃悗缁х画` until completion; when the next chapter was already unlocked from saved progress, allow continuing after reload even if the local completion flag is absent.

- [ ] **Step 5: Run unlock tests and confirm failure**

Run: `npm test -- src/components/ProgressiveChapter.test.tsx`  
Expected: FAIL because `ProgressiveChapter` does not yet accept or enforce the completion flag.

- [ ] **Step 6: Implement meaningful completion and hash restoration in `App.tsx`**

Use progress tokens `chapter:<stepId>` alongside component IDs. For each chapter:

```ts
const restoredStateForModules = (
  modules: readonly ModuleDef[],
): ExperienceStateChange | undefined => {
  if (!hashState?.state) return undefined;
  const module = modules.find((item) => item.componentId === hashState.moduleId);
  return module ? { moduleId: module.componentId, state: hashState.state } : undefined;
};
```

Render:

```tsx
<ChapterExperience
  stepId={step.id}
  modules={step.modules}
  restoredModuleState={restoredStateForModules(step.modules)}
  onInteract={markInteraction}
  onStateChange={({ moduleId, state }) => writeStateHash(step.id, moduleId, state)}
  onComplete={() => markInteraction(`chapter:${step.id}`)}
/>
```

Pass `completed={completed.has(`chapter:${step.id}`)}` to `ProgressiveChapter`. Preserve locked-hash behavior. Change the header count from eleven card experiments to six completed chapter experiences while keeping module IDs in stored state.

- [ ] **Step 7: Integrate entry media and one evidence disclosure**

Place the `omni-output/originalPdf` and output crops inside `DocumentPrimer`. Replace `EvidencePanel + CheckpointCard` with `ChapterEvidence`; it renders one closed disclosure with sources, numbers, and limits. Keep glossary terms inline at first occurrence.

- [ ] **Step 8: Write and run the App regression test**

The test must assert:

```tsx
expect(screen.getAllByTestId('chapter-experience')).toHaveLength(1); // first unlocked chapter only
expect(screen.queryByText(/瀹為獙 1\.1/)).not.toBeInTheDocument();
expect(screen.queryByText(/涓€鍒嗛挓鑷/)).not.toBeInTheDocument();
expect(screen.getByRole('button', { name: /琛ラ暱灏鹃〉/ })).toBeVisible();
```

Run:

```powershell
npm test -- src/components/ChapterExperience.test.tsx src/components/ProgressiveChapter.test.tsx src/App.test.tsx
npm run build
node ..\PaperSkill\paper-skill\scripts\validate-output.js .
```

Expected: all tests PASS, build exits 0, validator reports six chapters, eleven active modules, and all component IDs registered. Append the Task 6 checkpoint.

---

