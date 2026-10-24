import type { DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import type { BoardAction, Column } from "./board";

type Drop = Pick<DragEndEvent, "canceled"> & Pick<DragEndEvent["operation"], "source" | "target">;

export function dropAction({ canceled, source, target }: Drop, columns: Column[]): BoardAction | null {
  if (canceled || !target || !isSortable(source) || source.id === target.id) return null;
  const destination = isSortable(target) ? target.group : target.id;
  const index = isSortable(target) ? target.index : columns.find((column) => column.id === destination)!.cards.length;
  return { type: "move", cardId: String(source.id), columnId: String(destination), index };
}
