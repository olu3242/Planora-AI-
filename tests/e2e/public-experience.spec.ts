import { test, expect } from "@playwright/test";

test.describe("Public product experience", () => {
  test("renders safe illustrative dashboards and navigable product carousel", async ({ page }) => {
    await page.goto("/experience");
    await expect(page.getByRole("heading", { name: /Your finance operations/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("tabpanel", { name: /Command Center/i })).toBeVisible();
    await page.getByRole("tab", { name: /Tax & Compliance/ }).click();
    await expect(page.getByRole("tabpanel", { name: /Tax & Compliance/i })).toBeVisible();
    await expect(page.getByText(/Sample values and scenarios only/)).toBeVisible();
    await page.getByRole("button", { name: "Next solution" }).click();
    await expect(page.getByText("Month-end close", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Previous solution" }).click();
    await expect(page.getByText("Bank reconciliation", { exact: true })).toBeVisible();
  });

  test("does not present invented customers, testimonials or unavailable media", async ({ page }) => {
    const failedMedia: string[] = [];
    page.on("response", response => {
      if (response.url().includes("/media/") && response.status() >= 400) failedMedia.push(response.url());
    });
    await page.goto("/experience");
    await expect(page.getByText(/not a list of verified customers/i)).toBeVisible();
    await expect(page.getByText(/Illustrative product footage/)).toBeVisible();
    const video = page.locator(".video-preview-wrap video");
    await video.scrollIntoViewIfNeeded();
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState >= 2)).toBe(true);
    expect(failedMedia).toEqual([]);
    await expect(page.locator("video source")).toHaveCount(0);
  });

  test("avoids common public sensitive-data exposure patterns", async ({ page }) => {
    await page.goto("/experience");
    const body = await page.locator("body").innerText();
    const patterns = [
      /(?:api[_-]?key|client[_-]?secret|private[_-]?key)\s*[:=]\s*\S+/i,
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      /\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b/
    ];
    for (const pattern of patterns) expect(body).not.toMatch(pattern);
  });

  test("links to the product experience from the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Open the interactive experience/i }).first()).toHaveAttribute("href", "/experience");
  });
});
