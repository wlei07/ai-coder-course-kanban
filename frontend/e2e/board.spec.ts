import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const names = ["Backlog", "To do", "In progress", "In review", "Done"];
const column = (page: Page, name: string) => page.getByRole("region", { name: `${name} column` });
const browserErrors = new WeakMap<Page, string[]>();

async function drag(page: Page, title: string, target: Locator, position = .5, source = page.getByRole("article", { name: title, exact: true }), sourcePosition?: { x: number; y: number }) {
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  const destination = await target.evaluate((element) => {
    const region = element.closest("section");
    const card = element.closest("article");
    return { name: region?.getAttribute("aria-label"), index: region && card ? Array.from(region.querySelectorAll("article")).indexOf(card) : -1 };
  });
  const origin = await source.evaluate((element) => element.closest("section")!.getAttribute("aria-label"));
  const x = from.x + (sourcePosition?.x ?? from.width / 2);
  const y = from.y + (sourcePosition?.y ?? from.height / 2);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 12, y, { steps: 4 });
  await expect(page.getByRole("article", { name: title, exact: true })).toHaveClass(/is-dragging/);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * position, { steps: 25 });
  if (destination.name) {
    const region = page.getByRole("region", { name: destination.name, exact: true });
    await expect(region.getByRole("article", { name: title, exact: true })).toBeVisible();
    if (destination.name === origin && destination.index >= 0) {
      await expect(region.getByRole("article").nth(destination.index)).toHaveAttribute("aria-label", title);
    }
  }
  // Collision detection and rendering run on animation frames in WebKit.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.mouse.up();
  await expect(page.getByRole("article", { name: title, exact: true })).not.toHaveClass(/is-dragging/);
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Project board" })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});

test("loads a single board with five columns and ten cards without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(10);
  await expect(page.getByRole("region", { name: /column$/ })).toHaveCount(5);
  for (const name of names) await expect(column(page, name)).toBeVisible();
  expect(errors).toEqual([]);
});

test("adds a card to each selected column with optional and multiline details", async ({ page }) => {
  for (const [index, name] of names.entries()) {
    const region = column(page, name);
    const before = await region.getByRole("article").count();
    await region.getByRole("button", { name: "Add card", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Add a card" })).toBeVisible();
    await expect(page.getByLabel("Title", { exact: true })).toBeFocused();
    await page.getByLabel("Title", { exact: true }).fill(`  Card for ${name}  `);
    if (index % 2 === 0) await page.getByLabel("Details (optional)").fill("First line\nSecond line");
    await page.getByRole("dialog").getByRole("button", { name: "Add card", exact: true }).click();
    await expect(region.getByRole("article", { name: `Card for ${name}`, exact: true })).toBeVisible();
    await expect(region.getByLabel(`${before + 1} cards`, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("article")).toHaveCount(15);
});

test("rejects blank titles and discards a canceled draft", async ({ page }) => {
  const trigger = column(page, "Backlog").getByRole("button", { name: "Add card", exact: true });
  await trigger.click();
  await page.getByLabel("Title", { exact: true }).fill("   ");
  await page.getByRole("dialog").getByRole("button", { name: "Add card", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Give your card a title.");
  await page.getByLabel("Title", { exact: true }).fill("Discard this draft");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(10);
});

test("renames columns with Enter and blur and cancels with Escape or blank names", async ({ page }) => {
  await page.getByRole("button", { name: "Rename Backlog", exact: true }).click();
  await page.getByRole("textbox", { name: "Column name" }).fill("  Ideas  ");
  await page.keyboard.press("Enter");
  await expect(column(page, "Ideas").getByRole("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Rename Ideas", exact: true }).click();
  await page.getByRole("textbox", { name: "Column name" }).fill("Discarded");
  await page.keyboard.press("Escape");
  await expect(column(page, "Ideas")).toBeVisible();
  await page.getByRole("button", { name: "Rename Ideas", exact: true }).click();
  await page.getByRole("textbox", { name: "Column name" }).fill("   ");
  await page.keyboard.press("Enter");
  await expect(column(page, "Ideas")).toBeVisible();
  await page.getByRole("button", { name: "Rename Ideas", exact: true }).click();
  await page.getByRole("textbox", { name: "Column name" }).fill("Discovery");
  await page.getByRole("heading", { level: 1 }).click();
  await expect(column(page, "Discovery")).toBeVisible();
});

test("moves a card between populated columns while preserving its details", async ({ page }) => {
  const title = "Map the customer journey";
  const details = await page.getByRole("article", { name: title, exact: true }).locator("p").textContent();
  await drag(page, title, column(page, "To do").getByRole("article").first());
  await expect(column(page, "To do").getByRole("article", { name: title, exact: true })).toBeVisible();
  await expect(column(page, "To do").getByLabel("3 cards", { exact: true })).toBeVisible();
  await expect(column(page, "Backlog").getByLabel("2 cards", { exact: true })).toBeVisible();
  await expect(column(page, "To do").getByRole("article", { name: title, exact: true }).locator("p")).toHaveText(details!);
  await expect(page.getByRole("article")).toHaveCount(10);
});

for (const area of ["title", "details", "padding", "footer"]) {
  test(`drags a card from its ${area}`, async ({ page }) => {
    const title = "Map the customer journey";
    const card = page.getByRole("article", { name: title, exact: true });
    const source = area === "title" ? card.locator("h3") : area === "details" ? card.locator("p") : area === "footer" ? card.locator(".card-actions") : card;
    await drag(page, title, column(page, "To do").getByRole("article").first(), .5, source, area === "padding" ? { x: 5, y: 5 } : undefined);
    await expect(column(page, "To do").getByRole("article", { name: title, exact: true })).toBeVisible();
    await expect(column(page, "Backlog").getByRole("article", { name: title, exact: true })).toHaveCount(0);
    await expect(page.getByRole("article")).toHaveCount(10);
  });
}

test("deletes a card with the keyboard without starting a drag", async ({ page }) => {
  const title = "Map the customer journey";
  await page.getByRole("button", { name: `Delete ${title}`, exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("article", { name: title, exact: true })).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(9);
  await expect(page.locator(".is-dragging")).toHaveCount(0);
});

test("reorders cards within a column", async ({ page }) => {
  await drag(page, "Map the customer journey", column(page, "Backlog").getByRole("article").last(), .85);
  await expect(column(page, "Backlog").getByRole("heading", { level: 3 })).toHaveText(["Explore onboarding ideas", "Gather visual inspiration", "Map the customer journey"]);
});

test("deletes the last card, then drops a card into the empty column", async ({ page }) => {
  await column(page, "Done").getByRole("button", { name: "Delete Kick things off", exact: true }).click({ force: true });
  await expect(column(page, "Done").getByText("Room for what’s next")).toBeVisible();
  await drag(page, "Map the customer journey", column(page, "Done").getByText("Room for what’s next"));
  await expect(column(page, "Done").getByRole("article", { name: "Map the customer journey", exact: true })).toBeVisible();
  await expect(column(page, "Done").getByLabel("1 cards", { exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(9);
});

test("cancels a drag with Escape without changing the board", async ({ page }) => {
  const card = page.getByRole("article", { name: "Map the customer journey", exact: true });
  await card.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("article", { name: "Map the customer journey", exact: true })).toHaveClass(/is-dragging/);
  await page.keyboard.press("ArrowRight");
  await expect(column(page, "To do").getByRole("article", { name: "Map the customer journey", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(column(page, "Backlog").getByRole("heading", { level: 3 })).toHaveText(["Map the customer journey", "Explore onboarding ideas", "Gather visual inspiration"]);
  await expect(column(page, "To do").getByLabel("2 cards", { exact: true })).toBeVisible();
});

test("moves a card with the keyboard", async ({ page }) => {
  await page.getByRole("article", { name: "Map the customer journey", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("article", { name: "Map the customer journey", exact: true })).toHaveClass(/is-dragging/);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(column(page, "To do").getByRole("article", { name: "Map the customer journey", exact: true })).toBeVisible();
  await expect(column(page, "To do").getByLabel("3 cards", { exact: true })).toBeVisible();
});

test("announces a new card’s title and its renamed destination to screen readers", async ({ page }) => {
  await page.getByRole("button", { name: "Rename To do", exact: true }).click();
  await page.getByRole("textbox", { name: "Column name" }).fill("Ready to go");
  await page.keyboard.press("Enter");
  await column(page, "Backlog").getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("My accessible card");
  await page.getByRole("dialog").getByRole("button", { name: "Add card", exact: true }).click();
  await page.getByRole("article", { name: "My accessible card", exact: true }).focus();
  await page.keyboard.press("Space");
  const announcement = page.getByRole("status");
  await expect(announcement).toContainText("Picked up My accessible card in Backlog");
  await page.keyboard.press("ArrowRight");
  await expect(column(page, "Ready to go").getByRole("article", { name: "My accessible card", exact: true })).toBeVisible();
  await expect(announcement).toContainText("My accessible card in Ready to go");
  await page.keyboard.press("Space");
  await expect(announcement).toContainText("Dropped My accessible card in Ready to go");
});

test("dropping outside the board restores the original position", async ({ page }) => {
  await drag(page, "Map the customer journey", page.getByRole("heading", { level: 1 }));
  await expect(column(page, "Backlog").getByRole("heading", { level: 3 })).toHaveText(["Map the customer journey", "Explore onboarding ideas", "Gather visual inspiration"]);
});

test("leaving the board after previewing a transfer restores both columns", async ({ page }) => {
  const from = (await page.getByRole("article", { name: "Map the customer journey", exact: true }).boundingBox())!;
  const to = (await column(page, "To do").getByRole("article").first().boundingBox())!;
  await page.mouse.move(from.x + 12, from.y + 12);
  await page.mouse.down();
  await page.mouse.move(from.x + 24, from.y + 12, { steps: 4 });
  await expect(page.getByRole("article", { name: "Map the customer journey", exact: true })).toHaveClass(/is-dragging/);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 25 });
  await expect(column(page, "To do").getByLabel("3 cards", { exact: true })).toBeVisible();
  await page.mouse.move(700, 160, { steps: 20 });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await page.mouse.up();
  await expect(column(page, "Backlog").getByRole("heading", { level: 3 })).toHaveText(["Map the customer journey", "Explore onboarding ideas", "Gather visual inspiration"]);
  await expect(column(page, "To do").getByLabel("2 cards", { exact: true })).toBeVisible();
});

test("moves a card into an empty column using the keyboard", async ({ page }) => {
  const done = column(page, "Done");
  await done.getByRole("button", { name: "Delete Kick things off", exact: true }).click({ force: true });
  await page.getByRole("article", { name: "Review the prototype", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("article", { name: "Review the prototype", exact: true })).toHaveClass(/is-dragging/);
  await page.keyboard.press("ArrowRight");
  await expect(done.getByRole("article", { name: "Review the prototype", exact: true })).toBeVisible();
  await page.keyboard.press("Space");
  await expect(done.getByLabel("1 cards", { exact: true })).toBeVisible();
});

test("repeated moves do not lose or duplicate a card", async ({ page }) => {
  for (const destination of ["To do", "In progress", "In review", "Done", "Backlog"]) {
    await drag(page, "Map the customer journey", column(page, destination).getByRole("article").first());
    await expect(column(page, destination).getByRole("article", { name: "Map the customer journey", exact: true })).toHaveCount(1);
    await expect(page.getByRole("article")).toHaveCount(10);
  }
});

test("reload resets changed names and cards to the sample board", async ({ page }) => {
  await page.getByRole("button", { name: "Rename Backlog", exact: true }).click();
  await page.getByRole("textbox", { name: "Column name" }).fill("Ideas");
  await page.keyboard.press("Enter");
  await column(page, "Done").getByRole("button", { name: "Delete Kick things off", exact: true }).click({ force: true });
  await page.reload();
  await expect(column(page, "Backlog")).toBeVisible();
  await expect(column(page, "Done").getByRole("article", { name: "Kick things off", exact: true })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(10);
});

test("wraps long content and has no accessibility violations on the board or dialog", async ({ page }, testInfo) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await column(page, "Backlog").getByRole("button", { name: "Add card", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Title", { exact: true }).fill("A".repeat(180));
  await page.getByLabel("Details (optional)").fill("A long line that should wrap naturally. ".repeat(15));
  await page.getByRole("dialog").getByRole("button", { name: "Add card", exact: true }).click();
  const card = column(page, "Backlog").getByRole("article").last();
  expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("desktop-board.png"), fullPage: true });
});
