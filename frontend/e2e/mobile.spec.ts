import { expect, test } from "@playwright/test";

test("phone supports horizontal scrolling and creating a card", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Project board", level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const board = page.getByRole("group", { name: /Board columns/ });
  expect(await board.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("phone-board.png"), fullPage: true });
  const done = page.getByRole("region", { name: "Done column" });
  await done.scrollIntoViewIfNeeded();
  await done.getByRole("button", { name: "Add card", exact: true }).tap();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("Created on a phone");
  await page.screenshot({ path: testInfo.outputPath("phone-dialog.png"), fullPage: true });
  await page.getByRole("dialog").getByRole("button", { name: "Add card", exact: true }).tap();
  await expect(done.getByRole("article", { name: "Created on a phone", exact: true })).toBeVisible();
});

test("touch dragging moves a card to the adjacent column", async ({ page, context }) => {
  await page.goto("/");
  const handle = page.getByRole("button", { name: "Move Map the customer journey", exact: true });
  const from = (await handle.boundingBox())!;
  const x = from.x + from.width / 2;
  const y = from.y + from.height / 2;
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  await expect(page.getByRole("article", { name: "Map the customer journey", exact: true })).toHaveClass(/is-dragging/);
  // Keep touch input on the handle, where browser panning is intentionally disabled.
  for (let step = 1; step <= 24; step++) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + step * 11, y: y - step * 2 }] });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const destination = page.getByRole("region", { name: "To do column" });
  await expect(destination.getByRole("article", { name: "Map the customer journey", exact: true })).toHaveCount(1);
  await expect(destination.getByLabel("3 cards", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("article")).toHaveCount(10);
});

test("tablet keeps the board contained and allows every column to be reached", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const name of ["Backlog", "To do", "In progress", "In review", "Done"]) {
    const column = page.getByRole("region", { name: `${name} column` });
    await column.scrollIntoViewIfNeeded();
    await expect(column.getByRole("button", { name: "Add card", exact: true })).toBeInViewport();
  }
  await page.screenshot({ path: testInfo.outputPath("tablet-board.png"), fullPage: true });
});
