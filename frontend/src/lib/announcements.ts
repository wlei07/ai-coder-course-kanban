import type { Column } from "./board";

export function cardPosition(columns: Column[], cardId: string): string {
  const column = columns.find((item) => item.cards.some((card) => card.id === cardId))!;
  const index = column.cards.findIndex((card) => card.id === cardId);
  return `${column.cards[index].title} in ${column.title}, position ${index + 1} of ${column.cards.length}`;
}
