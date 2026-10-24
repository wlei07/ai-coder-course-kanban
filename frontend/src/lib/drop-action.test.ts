import { afterEach, describe, expect, it } from "vitest";
import { Draggable, Droppable } from "@dnd-kit/dom";
import { Sortable } from "@dnd-kit/dom/sortable";
import { dropAction } from "./drop-action";
import { boardReducer, type Column } from "./board";

const disposables: { destroy: () => void }[] = [];
afterEach(() => disposables.splice(0).forEach((item) => item.destroy()));

function source() {
  const item = new Sortable({ id: "one", index: 0, group: "a" }, undefined);
  disposables.push(item);
  return item;
}

function target() {
  const item = new Sortable({ id: "two", index: 0, group: "b" }, undefined);
  disposables.push(item);
  return item.droppable;
}

const board: Column[] = [
  { id: "a", title: "Backlog", cards: [{ id: "one", title: "First", details: "Intact" }] },
  { id: "b", title: "To do", cards: [{ id: "two", title: "Second", details: "" }] },
  { id: "c", title: "Done", cards: [] },
];

describe("converting a completed drag into a board move", () => {
  it("moves to the target group and index while React controls sorting", () => {
    const item = source();
    const destination = new Sortable({ id: "two", index: 1, group: "b" }, undefined);
    disposables.push(destination);
    const action = dropAction({ canceled: false, source: item.draggable, target: destination.droppable }, board)!;
    expect(action).not.toBeNull();
    expect(boardReducer(board, action)[1].cards.map((card) => card.id)).toEqual(["two", "one"]);
  });

  it("ignores the active card itself as a drop target", () => {
    const item = source();
    expect(dropAction({ canceled: false, source: item.draggable, target: item.droppable }, board)).toBeNull();
  });

  it("appends to an empty column’s drop target", () => {
    const destination = new Droppable({ id: "c" }, undefined);
    disposables.push(destination);
    const action = dropAction({ canceled: false, source: source().draggable, target: destination }, board)!;
    expect(action).not.toBeNull();
    expect(boardReducer(board, action)[2].cards).toEqual([{ id: "one", title: "First", details: "Intact" }]);
  });

  it("appends after existing cards when dropped on a column’s background", () => {
    const destination = new Droppable({ id: "b" }, undefined);
    disposables.push(destination);
    const action = dropAction({ canceled: false, source: source().draggable, target: destination }, board)!;
    expect(action).not.toBeNull();
    expect(boardReducer(board, action)[1].cards.map((card) => card.id)).toEqual(["two", "one"]);
  });

  it("does not move a canceled drag", () => {
    expect(dropAction({ canceled: true, source: source().draggable, target: target() }, board)).toBeNull();
  });

  it("does not move a card dropped outside valid targets", () => {
    expect(dropAction({ canceled: false, source: source().draggable, target: null }, board)).toBeNull();
  });

  it("ignores a drag without a sortable card source", () => {
    expect(dropAction({ canceled: false, source: null, target: target() }, board)).toBeNull();
    const item = new Draggable({ id: "not-a-card" }, undefined);
    disposables.push(item);
    expect(dropAction({ canceled: false, source: item, target: target() }, board)).toBeNull();
  });
});
