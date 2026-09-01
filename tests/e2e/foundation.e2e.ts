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

test("landing navigation, calls to action, footer links, and keyboard focus work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Turn fragmented financial data into decisions you can stand behind." })).toBeVisible();
  await page.getByRole("link", { name: "Product" }).click();
  await expect(page).toHaveURL(/#capabilities$/);
  await expect(page.locator("#capabilities")).toBeInViewport();
  await page.getByRole("link", { name: "Planora" }).focus();
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    const style = getComputedStyle(element);
    return { tag: element.tagName, outline: style.outlineStyle, width: style.outlineWidth };
  });
  expect(["A", "BUTTON"]).toContain(focus.tag);
  expect(focus.outline).not.toBe("none");
  expect(focus.width).not.toBe("0px");
  const deadLinks = await page.locator("a").evaluateAll((links) => links.filter((link) => link.getAttribute("href") === "#").length);
  expect(deadLinks).toBe(0);
  await expect(page.locator("footer").getByRole("link", { name: "Documentation" })).toHaveAttribute("href", "#capabilities");
  await page.getByRole("link", { name: "Get started" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
});

for (const width of [375, 430, 768, 1024, 1440]) {
  test(`@responsive landing has usable navigation and no overflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await expect(page.getByRole("link", { name: "Get started" }).first()).toBeVisible();
    if (width <= 700) {
      const menu = page.locator("details.mobile-menu");
      await menu.locator("summary").click();
      await expect(menu.getByRole("link", { name: "Product" })).toBeVisible();
      await menu.locator("summary").click();
      await expect(menu).not.toHaveAttribute("open", "");
    } else {
      await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    }
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(page.locator("footer").getByRole("link", { name: "FAQ" })).toBeVisible();
  });
}

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
