import { describe, expect, it } from "vitest";
import { boardReducer, createInitialBoard, type Column } from "./board";

function fixture(): Column[] {
  return [
    { id: "a", title: "Backlog", cards: [
      { id: "one", title: "First", details: "Keep these details\nintact" },
      { id: "two", title: "Second", details: "" },
      { id: "three", title: "Third", details: "Three" },
    ] },
    { id: "b", title: "To do", cards: [{ id: "four", title: "Fourth", details: "Four" }] },
    { id: "c", title: "In progress", cards: [] },
    { id: "d", title: "In review", cards: [] },
    { id: "e", title: "Done", cards: [] },
  ];
}

describe("initial board", () => {
  it("starts with five populated workflow columns and ten unique cards", () => {
    const board = createInitialBoard();
    expect(board.map((column) => column.title)).toEqual(["Backlog", "To do", "In progress", "In review", "Done"]);
    expect(board.every((column) => column.cards.length > 0)).toBe(true);
    expect(new Set(board.flatMap((column) => column.cards.map((card) => card.id))).size).toBe(10);
  });

  it("creates fresh state so changes do not leak into a new session", () => {
    const first = createInitialBoard();
    first[0].cards.pop();
    first[0].title = "Changed";
    const second = createInitialBoard();
    expect(second[0].title).toBe("Backlog");
    expect(second.flatMap((column) => column.cards)).toHaveLength(10);
  });
});

describe("board reducer", () => {
  it("restores the snapshot after a canceled drag", () => {
    const snapshot = fixture();
    const moved = boardReducer(snapshot, { type: "move", cardId: "one", columnId: "b", index: 0 });
    expect(boardReducer(moved, { type: "restore", columns: snapshot })).toEqual(snapshot);
  });
  it("appends a new card to only its chosen column without changing input state", () => {
    const before = fixture();
    const snapshot = structuredClone(before);
    const next = boardReducer(before, { type: "add", columnId: "b", card: { id: "new", title: "New", details: "" } });
    expect(next[1].cards.map((card) => card.id)).toEqual(["four", "new"]);
    expect(next[0]).toBe(before[0]);
    expect(before).toEqual(snapshot);
  });

  it("deletes only the chosen card", () => {
    const before = fixture();
    const next = boardReducer(before, { type: "delete", cardId: "two" });
    expect(next[0].cards.map((card) => card.id)).toEqual(["one", "three"]);
    expect(next[1].cards.map((card) => card.id)).toEqual(["four"]);
    expect(before[0].cards).toHaveLength(3);
  });

  it("renames a column while preserving its id, cards, and position", () => {
    const before = fixture();
    const next = boardReducer(before, { type: "rename", columnId: "a", title: "Ideas" });
    expect(next[0]).toEqual({ ...before[0], title: "Ideas" });
    expect(next[0].cards).toBe(before[0].cards);
    expect(next.map((column) => column.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(before[0].title).toBe("Backlog");
  });

  it("moves a card between columns at the chosen index, preserving all content", () => {
    const before = fixture();
    const next = boardReducer(before, { type: "move", cardId: "one", columnId: "b", index: 0 });
    expect(next[0].cards.map((card) => card.id)).toEqual(["two", "three"]);
    expect(next[1].cards.map((card) => card.id)).toEqual(["one", "four"]);
    expect(next[1].cards[0]).toBe(before[0].cards[0]);
    expect(before[0].cards).toHaveLength(3);
  });

  it.each([{ index: 2, want: ["two", "three", "one"] }, { index: 0, want: ["one", "two", "three"] }])(
    "reorders a card inside its column to index $index", ({ index, want }) => {
      const next = boardReducer(fixture(), { type: "move", cardId: "one", columnId: "a", index });
      expect(next[0].cards.map((card) => card.id)).toEqual(want);
      expect(next.flatMap((column) => column.cards)).toHaveLength(4);
    },
  );

  it("moves cards into empty columns and back repeatedly without duplicates", () => {
    let state = fixture();
    for (const columnId of ["c", "d", "e", "a", "b", "c"]) {
      state = boardReducer(state, { type: "move", cardId: "one", columnId, index: 0 });
      expect(state.find((column) => column.id === columnId)?.cards[0].id).toBe("one");
      expect(state.flatMap((column) => column.cards)).toHaveLength(4);
    }
  });
});
