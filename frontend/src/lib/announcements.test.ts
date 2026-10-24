import { describe, expect, it } from "vitest";
import { cardPosition } from "./announcements";
import { boardReducer, type Column } from "./board";

describe("card position announcements", () => {
  const columns: Column[] = [
    { id: "a", title: "Ideas", cards: [{ id: "uuid-1234", title: "A new card", details: "" }] },
    { id: "b", title: "Ready to go", cards: [{ id: "other", title: "Existing", details: "" }] },
  ];

  it("describes a card using its title and the current column name, not internal ids", () => {
    expect(cardPosition(columns, "uuid-1234")).toBe("A new card in Ideas, position 1 of 1");
  });

  it("describes the actual destination and position after a move", () => {
    const moved = boardReducer(columns, { type: "move", cardId: "uuid-1234", columnId: "b", index: 1 });
    expect(cardPosition(moved, "uuid-1234")).toBe("A new card in Ready to go, position 2 of 2");
  });

  it("reflects column renames", () => {
    const renamed = boardReducer(columns, { type: "rename", columnId: "a", title: "Discovery" });
    expect(cardPosition(renamed, "uuid-1234")).toBe("A new card in Discovery, position 1 of 1");
  });
});
