### Task 3: DataCounterfactual and DdasMicroscope

**Files:**
- Create: `src/experiences/DataCounterfactual.test.tsx`
- Create: `src/experiences/DataCounterfactual.tsx`
- Create: `src/experiences/DdasMicroscope.test.tsx`
- Create: `src/experiences/DdasMicroscope.tsx`
- Create: `src/styles/experience-data.css`

**Interfaces:**
- Consumes: `ChapterExperienceProps`, `PaperMedia`, `MEDIA_ASSETS`.
- Produces: stable states for `architecture-lock`, `data-bias`, `page-ddas`, and `element-ddas`.

- [ ] **Step 1: Write failing Step 1 interaction tests**

Test that the architecture remains locked, the automatic six-second comparison does not call `onComplete`, and a user choosing the tail path does:

```tsx
await user.click(screen.getByRole('button', { name: '琛ラ暱灏鹃〉' }));
expect(screen.getByText('澶嶆潅鍏紡')).toHaveAttribute('data-covered', 'true');
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'data-bias', state: 'tail' });
expect(onComplete).toHaveBeenCalledTimes(1);
expect(screen.getByText('+2.71')).toHaveAccessibleDescription(/瀹屾暣娴佺▼/);
```

- [ ] **Step 2: Run Step 1 tests and confirm failure**

Run: `npm test -- src/experiences/DataCounterfactual.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement `DataCounterfactual`**

Use Figure S7 crops for ordinary/long-tail visual evidence. Keep a visible `鍥哄畾 1.2B` lock, a constant budget meter, and two user choices. The one-time automatic sequence may animate ordinary pages entering and then preview the tail alternative, but only a user action writes hashes or completes the chapter. Report `architecture-lock: locked` and `data-bias: ordinary|tail`.

- [ ] **Step 4: Write failing Step 2 microscope tests**

Test mouse/button and keyboard-equivalent paths:

```tsx
await user.click(screen.getByRole('button', { name: '瑙傚療闀垮熬鐗堝紡绨? }));
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'page-ddas', state: 'ddas' });
await user.click(screen.getByRole('button', { name: '鏀惧ぇ鍏紡鍖哄煙' }));
expect(onStateChange).toHaveBeenCalledWith({ moduleId: 'element-ddas', state: 'formula' });
expect(onComplete).toHaveBeenCalledTimes(1);
```

Verify arrow keys move the lens and Enter opens the focused page. Verify the Figure 3 toggle switches between page-level and element-level crops without adding a second card.

- [ ] **Step 5: Run Step 2 tests and confirm failure**

Run: `npm test -- src/experiences/DdasMicroscope.test.tsx`  
Expected: FAIL because the component does not exist.

- [ ] **Step 6: Implement `DdasMicroscope`**

Render a bounded cluster field using real layout/table thumbnails. Pointer movement sets normalized lens coordinates; arrow keys change them in 5% increments. A page selection transitions the same canvas into text/formula/table crops. Report `page-ddas: random|cluster|ddas` and `element-ddas: text|formula|table`. Include the facts `512缁?ViT-base` and `绾?0M椤靛€欓€塦 once, and state that K and sampling weights are not disclosed.

- [ ] **Step 7: Add distinct data-experience motion and responsive styles**

Step 1 uses a side-by-side counterfactual; Step 2 uses a freeform microscope field. Hidden states must be overlays or conditionally rendered, never opacity-only blocks that reserve empty height. On mobile, provide large focus buttons below the visual rather than requiring precision dragging.

- [ ] **Step 8: Verify Task 3**

Run:

```powershell
npm test -- src/experiences/DataCounterfactual.test.tsx src/experiences/DdasMicroscope.test.tsx
npm run build
```

Expected: tests PASS and build exits 0. Append the Task 3 checkpoint.

---

