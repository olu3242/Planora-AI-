import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { mkdir } from "node:fs/promises";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("cfo@planora.local");
  await page.getByLabel("Password").fill("Planora!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/command-center$/);
}

test("unauthenticated users are redirected and can sign in", async ({ page }) => {
  await page.goto("/command-center"); await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("cfo@planora.local"); await page.getByLabel("Password").fill("Planora!2026"); await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/command-center$/); await expect(page.getByRole("heading", { name: "Command Center" })).toBeVisible(); await expect(page.getByText("Northstar Manufacturing", { exact: true })).toBeVisible();
});

test("authenticated Tenant A cannot access Tenant B by direct ID", async ({ page }) => {
  await signIn(page);
  const prisma = new PrismaClient();
  const horizon = await prisma.organization.findUniqueOrThrow({ where: { code: "HORIZON" } });
  await prisma.$disconnect();
  const result = await page.evaluate(async (id) => {
    const response = await fetch(`/api/organizations/${id}`);
    return { status: response.status, body: await response.json() };
  }, horizon.id);
  expect(result.status).toBe(404);
  expect(result.body.error.code).toBe("RESOURCE_NOT_FOUND");
});

test("visual certification has content, key controls, and no browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);
  await expect(page.locator("body")).not.toHaveText("");
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Planora" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  expect(errors).toEqual([]);
  await mkdir("evidence/phase-1", { recursive: true });
  await page.screenshot({ path: "evidence/phase-1/command-center-1440.png", fullPage: true });
});

for (const width of [375, 430, 768, 1024, 1440]) {
  test(`@responsive shell has no horizontal overflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await signIn(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); expect(overflow).toBe(false);
  });
}
