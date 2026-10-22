import { expect, test } from "@playwright/test";

test("supplied video plays in view and opens an accessible player", async ({ page }) => {
  await page.goto("/");
  const preview = page.locator(".video-preview-wrap video");
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
  await page.getByRole("button", { name: "02 A connected workspace" }).click();
  await expect(preview).toHaveAttribute("src", "/media/planora/walkthrough-2.mp4");
});

test("reduced motion prevents preview autoplay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const preview = page.locator(".video-preview-wrap video");
  await preview.scrollIntoViewIfNeeded();
  await expect.poll(() => preview.evaluate((v: HTMLVideoElement) => v.readyState >= 2)).toBe(true);
  expect(await preview.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
});

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`showcases support keyboard, disclosure and carousel (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    await page.getByRole("tab", { name: /^Command Center/ }).focus();
    await page.keyboard.press("ArrowDown");
    const accounting = page.getByRole("tab", { name: /^Accounting/ });
    await expect(accounting).toBeFocused();
    await expect(accounting).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel").getByRole("heading", { name: "Accounting workspace" })).toBeVisible();
    const card = page.getByRole("button", { name: "Explore Bank reconciliation" });
    await card.click();
    const dialog = page.getByRole("dialog", { name: "Bank reconciliation" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".workflow-steps li")).toHaveCount(3);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
    const carousel = page.getByRole("region", { name: "Planora solutions" });
    await carousel.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => carousel.evaluate(el => el.scrollLeft)).toBeGreaterThan(50);
    await page.getByRole("button", { name: "Previous solution" }).click();
    await expect(page.getByRole("button", { name: "Previous solution" })).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
