import { expect, test } from "@playwright/test";

test("supplied video plays in view and opens an accessible player", async ({ page }) => {
  await page.goto("/");
  const preview = page.locator(".media-slide video").first();
  await preview.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect.poll(() => preview.evaluate((v: HTMLVideoElement) => !v.paused && v.readyState >= 2 && v.muted)).toBe(true);
  const opener = page.getByRole("button", { name: "Watch Your finance dashboard with audio" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Your finance dashboard" });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.locator("video").evaluate((v: HTMLVideoElement) => v.readyState >= 2 && !v.muted && v.controls && !v.paused)).toBe(true);
  await expect.poll(() => preview.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await page.getByRole("button", { name: "Next walkthrough" }).click();
  await expect.poll(() => preview.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

test("reduced motion prevents preview autoplay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const preview = page.locator(".media-slide video").first();
  await preview.scrollIntoViewIfNeeded();
  await expect.poll(() => preview.evaluate((v: HTMLVideoElement) => v.readyState >= 2)).toBe(true);
  expect(await preview.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`feature clustering supports keyboard, disclosure and carousel (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const tab = page.getByRole("tab", { name: "For Founders" });
    await tab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "For Accountants" })).toBeFocused();
    await expect(page.getByRole("tab", { name: "For Accountants" })).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel.getByRole("heading", { name: "Close with confidence" })).toBeVisible();
    const card = panel.locator("article").first();
    await card.hover();
    await card.getByRole("button", { name: "Explore workflow" }).click();
    await expect(card.getByText("Request independent approval", { exact: false })).toBeVisible();
    await card.getByRole("button", { name: "Close workflow" }).click();
    await expect(card.getByText("Request independent approval", { exact: false })).toHaveCount(0);
    await page.getByRole("button", { name: "Next walkthrough" }).click();
    await expect(page.getByRole("button", { name: "Show A connected workspace" })).toHaveAttribute("aria-current", "true");
    await page.getByRole("button", { name: "Previous walkthrough" }).click();
    await expect(page.getByRole("button", { name: "Previous walkthrough" })).toBeDisabled();
    const slide = page.locator(".media-slide").first();
    await slide.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(slide).toHaveCSS("opacity", "1");
    const box = await slide.boundingBox();
    if (!box) throw new Error("Missing carousel slide");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 130, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole("button", { name: "Show A connected workspace" })).toHaveAttribute("aria-current", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}


