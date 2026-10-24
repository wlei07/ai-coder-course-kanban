import { useDroppable } from "@dnd-kit/react";
import { Layers2 } from "lucide-react";
import type { Dispatch } from "react";
import type { BoardAction, Column } from "@/lib/board";
import { AddCardDialog } from "./add-card-dialog";
import { ColumnName } from "./column-name";
import { TaskCard } from "./task-card";

export function BoardColumn({ column, dispatch }: { column: Column; dispatch: Dispatch<BoardAction> }) {
  const { ref, isDropTarget } = useDroppable({ id: column.id, accept: "card", collisionPriority: 0 });
  return (
    <section ref={ref} className={`column${isDropTarget ? " is-over" : ""}`} aria-label={`${column.title} column`}>
      <header className="column-header">
        <span className="column-dot" aria-hidden="true" />
        <h2><ColumnName title={column.title} onRename={(title) => dispatch({ type: "rename", columnId: column.id, title })} /></h2>
        <span className="column-count" aria-label={`${column.cards.length} cards`}>{column.cards.length}</span>
      </header>
      <div className="column-cards">
        {column.cards.map((card, index) => <TaskCard key={card.id} card={card} columnId={column.id} index={index} onDelete={() => dispatch({ type: "delete", cardId: card.id })} />)}
        {column.cards.length === 0 && <div className="empty-column"><Layers2 size={23} aria-hidden="true" /><span>Room for what’s next</span></div>}
      </div>
      <AddCardDialog columnTitle={column.title} onAdd={(title, details) => dispatch({ type: "add", columnId: column.id, card: { id: crypto.randomUUID(), title, details } })} />
    </section>
  );
}
