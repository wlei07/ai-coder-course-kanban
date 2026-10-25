import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KanbanBoard } from "./kanban-board";

const column = (name: string) => screen.getByRole("region", { name: `${name} column` });
const setup = () => {
  const user = userEvent.setup();
  render(<KanbanBoard />);
  return user;
};

describe("Kanban board", () => {
  it("shows one board, five columns, ten sample cards, and per-column counts", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "Project board" })).toBeVisible();
    expect(screen.getAllByRole("region", { name: /column$/ })).toHaveLength(5);
    expect(screen.getAllByRole("article")).toHaveLength(10);
    expect(within(column("Backlog")).getByLabelText("3 cards")).toBeVisible();
  });

  it("picks up a card with the keyboard and restores its position on Escape", async () => {
    const user = setup();
    const card = screen.getByRole("article", { name: "Map the customer journey" });
    card.focus();
    await user.keyboard("[Space]");
    await waitFor(() => expect(card).toHaveClass("is-dragging"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(card).not.toHaveClass("is-dragging"));
    expect(within(column("Backlog")).getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent)).toEqual(["Map the customer journey", "Explore onboarding ideas", "Gather visual inspiration"]);
  });

  it("moves a card with the keyboard and announces its destination", async () => {
    // Supply the layout measurements that Happy DOM cannot calculate.
    const measurement = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const region = this.closest("section");
      if (!region) return new DOMRect(0, 0, 1500, 900);
      const columnIndex = Array.from(region.parentElement!.children).indexOf(region);
      const card = this.closest("article");
      if (!card) return new DOMRect(columnIndex * 300, 50, 280, 700);
      const cardIndex = Array.from(region.querySelectorAll("article")).indexOf(card);
      return new DOMRect(columnIndex * 300 + 10, 120 + cardIndex * 150, 260, 140);
    });
    try {
      const user = setup();
      screen.getByRole("article", { name: "Map the customer journey" }).focus();
      await user.keyboard("[Space]");
      await waitFor(() => expect(screen.getByRole("article", { name: "Map the customer journey" })).toHaveClass("is-dragging"));
      await user.keyboard("{ArrowRight}");
      await waitFor(() => expect(within(column("To do")).getByRole("article", { name: "Map the customer journey" })).toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Map the customer journey in To do"));
      await user.keyboard("[Space]");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Dropped Map the customer journey in To do"));
      expect(within(column("To do")).getByLabelText("3 cards")).toBeInTheDocument();
    } finally { measurement.mockRestore(); }
  });

  it("adds a card with multiline details to the chosen column and updates its count", async () => {
    const user = setup();
    await user.click(within(column("To do")).getByRole("button", { name: "Add card" }));
    const dialog = screen.getByRole("dialog", { name: "Add a card" });
    await user.type(within(dialog).getByLabelText("Title"), "  Ship the launch  ");
    await user.type(within(dialog).getByLabelText("Details (optional)"), "First line\nSecond line");
    await user.click(within(dialog).getByRole("button", { name: "Add card" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(column("To do")).getByRole("heading", { name: "Ship the launch" })).toBeVisible();
    expect(within(column("To do")).getByText(/First line/)).toHaveTextContent("First line Second line");
    expect(within(column("To do")).getByLabelText("3 cards")).toBeVisible();
  });

  it("accepts a title without details", async () => {
    const user = setup();
    await user.click(within(column("Backlog")).getByRole("button", { name: "Add card" }));
    await user.type(screen.getByLabelText("Title"), "Just a title");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add card" }));
    expect(within(column("Backlog")).getByRole("heading", { name: "Just a title" })).toBeVisible();
  });

  it("rejects whitespace-only titles and removes the error after correction", async () => {
    const user = setup();
    await user.click(within(column("Done")).getByRole("button", { name: "Add card" }));
    await user.type(screen.getByLabelText("Title"), "   ");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add card" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Give your card a title.");
    expect(screen.getByLabelText("Title")).toHaveAttribute("aria-invalid", "true");
    await user.type(screen.getByLabelText("Title"), "Ready");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add card" }));
    expect(within(column("Done")).getByRole("heading", { name: "Ready" })).toBeVisible();
  });

  it.each(["Cancel", "Close dialog"])("discards an unsaved card using %s", async (name) => {
    const user = setup();
    await user.click(within(column("In review")).getByRole("button", { name: "Add card" }));
    await user.type(screen.getByLabelText("Title"), "Discard me");
    await user.click(screen.getByRole("button", { name }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(10);
    await user.click(within(column("In review")).getByRole("button", { name: "Add card" }));
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("closes the form with Escape and restores focus to its trigger", async () => {
    const user = setup();
    const trigger = within(column("Backlog")).getByRole("button", { name: "Add card" });
    await user.click(trigger);
    expect(screen.getByLabelText("Title")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("deletes a card and keeps an empty column available for new cards", async () => {
    const user = setup();
    const done = column("Done");
    await user.click(within(done).getByRole("button", { name: /^Delete / }));
    expect(within(done).queryByRole("article")).not.toBeInTheDocument();
    expect(within(done).getByText("Room for what’s next")).toBeVisible();
    expect(within(done).getByLabelText("0 cards")).toBeVisible();
    await user.click(within(done).getByRole("button", { name: "Add card" }));
    await user.type(screen.getByLabelText("Title"), "A fresh start");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add card" }));
    expect(within(done).getByRole("heading", { name: "A fresh start" })).toBeVisible();
  });

  it.each(["{Enter}", "{Tab}"])("renames a column using %s and retains its cards", async (key) => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Rename Backlog" }));
    const input = screen.getByLabelText("Column name");
    await user.clear(input);
    await user.type(input, "  Ideas  ");
    await user.keyboard(key);
    expect(column("Ideas")).toBeVisible();
    expect(within(column("Ideas")).getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByRole("textbox", { name: "Column name" })).not.toBeInTheDocument();
  });

  it("allows Tab to advance after renaming instead of moving focus backwards", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Rename Backlog" }));
    await user.clear(screen.getByLabelText("Column name"));
    await user.type(screen.getByLabelText("Column name"), "Ideas");
    await user.tab();
    expect(screen.getByRole("article", { name: "Map the customer journey" })).toHaveFocus();
  });

  it.each(["{Escape}", "{Enter}"])("restores the old column name on cancel or blank input (%s)", async (key) => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Rename Backlog" }));
    await user.clear(screen.getByLabelText("Column name"));
    await user.keyboard(key);
    expect(column("Backlog")).toBeVisible();
    expect(screen.getByRole("button", { name: "Rename Backlog" })).toHaveFocus();
  });
});
