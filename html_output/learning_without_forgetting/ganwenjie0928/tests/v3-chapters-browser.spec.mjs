import { expect, test } from "@playwright/test";

test("the direct entry opens and navigates all eight 00–07 chapters", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Learning without Forgetting" }).first()).toBeVisible();

  const chapters = [
    ["00", "问题设定"],
    ["01", "模型结构"],
    ["02", "关键做法"],
    ["03", "一次训练"],
    ["04", "机制与边界"],
    ["05", "连续任务"],
    ["06", "论文证据"],
    ["07", "完整回放"],
  ];
  const navigation = page.getByRole("navigation", { name: "8 个章节" });
  for (const [id, title] of chapters) {
    await navigation.getByRole("button", { name: new RegExp(title) }).click();
    await expect(page).toHaveURL(new RegExp(`#chapter-${id}$`));
    await expect(page.locator(`#chapter-${id}`)).toHaveCount(1);
  }
});

test("Reference Hub opens, closes, and restores focus to its opener", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Reference Hub", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "参考资料库" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "关闭参考资料库" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("AlexNet switches between Teacher and Student", async ({ page }) => {
  await page.goto("/");
  const views = page.getByRole("group", { name: "选择模型视图" });
  const teacher = views.getByRole("button", { name: "Teacher" });
  const student = views.getByRole("button", { name: "Student" });
  await teacher.click();
  await expect(teacher).toHaveAttribute("aria-pressed", "true");
  await student.click();
  await expect(student).toHaveAttribute("aria-pressed", "true");
});

test("Chapter 02 and 03 selections stay synchronized with the process view", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chapter-02").scrollIntoViewIfNeeded();
  await page.locator("#key-generate-response").getByRole("button", { name: "生成旧响应" }).click();
  await expect(page.locator("#key-generate-response")).toHaveAttribute("data-active", "true");
  await expect(page.locator(".v3-process-visual-header strong")).toHaveText(["生成旧响应", "生成旧响应"]);

  await page.locator("#cycle-update").getByRole("button", { name: "Optimizer Step" }).click();
  await expect(page.locator("#cycle-update")).toHaveAttribute("data-active", "true");
  await expect(page.locator(".v3-process-visual-header strong")).toHaveText(["Optimizer Step", "Optimizer Step"]);
});

test("Chapter 04 controls update preservation, objective, and coverage views", async ({ page }) => {
  await page.goto("/");
  await page.locator("#chapter-04").scrollIntoViewIfNeeded();

  const preservation = page.getByRole("group", { name: "选择保持对象" });
  await preservation.getByRole("button", { name: "Response view" }).click();
  await expect(preservation.getByRole("button", { name: "Response view" })).toHaveAttribute("aria-pressed", "true");

  const objective = page.getByRole("group", { name: "调整旧响应项的概念权重" });
  await objective.getByRole("button", { name: "λₒ high" }).click();
  await expect(objective.getByRole("button", { name: "λₒ high" })).toHaveAttribute("aria-pressed", "true");

  const coverage = page.getByRole("group", { name: "选择当前任务输入覆盖示意" });
  const finalCoverageOption = coverage.getByRole("button").last();
  await finalCoverageOption.click();
  await expect(finalCoverageOption).toHaveAttribute("aria-pressed", "true");
});

test("Chapter 05 handoff supports previous, next, play, pause, and stops at the end", async ({ page }) => {
  await page.goto("/");
  const handoff = page.locator(".v3-task-handoff");
  const status = handoff.getByRole("status");
  const next = handoff.getByRole("button", { name: "Next →" });
  const previous = handoff.getByRole("button", { name: "← Previous" });

  await expect(previous).toBeDisabled();
  await next.click();
  await expect(status).toHaveText("Manual · step 2 of 8");
  await previous.click();
  await expect(status).toHaveText("Manual · step 1 of 8");

  await handoff.getByRole("group", { name: "播放速度" }).getByRole("button", { name: "1.5×" }).click();
  await handoff.getByRole("button", { name: /Play handoff/ }).click();
  await expect(handoff.getByRole("button", { name: /Pause/ })).toBeVisible();
  await handoff.getByRole("button", { name: /Pause/ }).click();
  await expect(status).toHaveText("Manual · step 1 of 8");

  await handoff.getByRole("button", { name: /Play handoff/ }).click();
  await expect(status).toHaveText("Handoff complete · stopped", { timeout: 20_000 });
  await expect(next).toBeDisabled();
  await expect(handoff.getByRole("button", { name: /Replay handoff/ })).toBeVisible();
});

test("Chapter 06 evidence selection and verdict controls work", async ({ page }) => {
  await page.goto("/");
  const evidence = page.locator(".v3-evidence-explorer");
  const figureTab = evidence.getByRole("tab", { name: /Figure 4/ });
  await figureTab.click();
  await expect(figureTab).toHaveAttribute("aria-selected", "true");
  await expect(evidence.locator(".v3-evidence-detail")).toHaveAttribute("data-evidence-id", "figure_4");

  const verdict = page.getByRole("group", { name: "选择主张判断" });
  const supported = verdict.getByRole("button", { name: "Supported", exact: true });
  await supported.click();
  await expect(supported).toHaveAttribute("aria-pressed", "true");
  const feedback = page.locator(".v3-verdict-explorer .v3-verdict-feedback");
  await expect(feedback).toBeVisible();
  await expect(feedback).toContainText(/判断符合证据|论文证据分类/);
});

test("Chapter 07 GrandTrail supports step controls and step-specific references", async ({ page }) => {
  await page.goto("/");
  const trail = page.locator(".v3-grand-trail");
  const steps = trail.getByRole("navigation", { name: "GrandTrail 检查点" }).getByRole("button");
  await steps.first().click();
  await trail.getByRole("button", { name: "Reference Hub · 当前步骤 ↗" }).click();
  await expect(page.getByRole("dialog", { name: "参考资料库" })).toBeVisible();
  await expect(page.locator(".v2-hub-id")).toHaveText("term:teacher");
  await page.getByRole("button", { name: "关闭参考资料库" }).click();

  const status = trail.getByRole("status");
  const next = trail.getByRole("button", { name: "Next →" });
  const previous = trail.getByRole("button", { name: "← Previous" });
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(status).toHaveText("Manual · checkpoint 2 of 9");
  await previous.click();
  await expect(status).toHaveText("Manual · checkpoint 1 of 9");

  await trail.getByRole("group", { name: "GrandTrail 播放速度" }).getByRole("button", { name: "1.5×" }).click();
  await trail.getByRole("button", { name: "▶ Play" }).click();
  await expect(trail.getByRole("button", { name: /Pause/ })).toBeVisible();
  await trail.getByRole("button", { name: /Pause/ }).click();
  await expect(status).toHaveText("Manual · checkpoint 1 of 9");
});

test("Chapter 07 autoplay stops at Step 9 and Replay from start returns to Step 1", async ({ page }) => {
  await page.goto("/");
  const trail = page.locator(".v3-grand-trail");
  const status = trail.getByRole("status");
  await trail.getByRole("group", { name: "GrandTrail 播放速度" }).getByRole("button", { name: "1.5×" }).click();
  await trail.getByRole("button", { name: "▶ Play" }).click();
  await expect(status).toHaveText("GrandTrail complete · stopped at next Teacher", { timeout: 20_000 });
  await expect(trail).toHaveAttribute("data-trail-step", "next-teacher");
  const replay = trail.getByRole("button", { name: "↺ Replay from start" });
  await replay.click();
  await expect(trail.getByRole("navigation", { name: "GrandTrail 检查点" }).getByRole("button").first()).toHaveAttribute("aria-current", "step");
  await expect(status).toHaveText("Playing · checkpoint 1 of 9");
  await trail.getByRole("button", { name: /Pause/ }).click();
});

test("390px mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#chapter-07")).toBeVisible();
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport);
});

test("reduced motion removes visible animation durations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const durationMs = await page.locator(".v3-grand-trail-node").first().evaluate((element) => {
    const duration = getComputedStyle(element).transitionDuration.split(",")[0].trim();
    const value = Number.parseFloat(duration);
    return duration.endsWith("ms") ? value : value * 1000;
  });
  expect(durationMs).toBeLessThan(0.1);
});
