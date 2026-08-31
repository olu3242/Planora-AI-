import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("cfo@planora.local");
  await page.getByLabel("Password").fill("Planora!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/command-center$/);
}

test("login to actuals exposes exact EBITDA and source evidence", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  await page.getByRole("link", { name: "Actuals" }).click();
  await expect(page).toHaveURL(/\/actuals$/);
  await expect(page.getByRole("heading", { name: "Actuals" })).toBeVisible();
  await expect(page.getByText("$87M", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "$87,000,000.00" })).toBeVisible();
  await page.getByText("Explain EBITDA", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Calculation inputs" })).toBeVisible();
  await expect(page.getByText("GROSS_PROFIT - OPERATING_EXPENSE", { exact: true })).toBeVisible();
  await expect(page.getByText("SEED · PHASE2-FIXTURE").first()).toBeVisible();
  await expect(page.getByText("North America · Industrial").first()).toBeVisible();
  await mkdir("evidence/phase-2", { recursive: true });
  await page.screenshot({ path: "evidence/phase-2/actuals-1440.png" });
});

for (const width of [375, 430, 768, 1024, 1440]) {
  test(`@responsive actuals remains usable without overflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await signIn(page); await page.goto("/actuals");
    await expect(page.getByText("$87M", { exact: true })).toBeVisible();
    await page.getByText("Explain EBITDA", { exact: true }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
}
