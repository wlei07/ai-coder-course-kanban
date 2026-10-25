import { useSortable } from "@dnd-kit/react/sortable";
import { Trash2 } from "lucide-react";
import type { Card } from "@/lib/board";

export function TaskCard({ card, columnId, index, onDelete }: { card: Card; columnId: string; index: number; onDelete: () => void }) {
  const { ref, isDragSource } = useSortable({ id: card.id, index, group: columnId, type: "card", accept: "card", data: { title: card.title } });
  return (
    <article ref={ref} role="article" tabIndex={0} className={`task-card${isDragSource ? " is-dragging" : ""}`} aria-label={card.title} title="Drag to move · Space to pick up, arrow keys to move, Escape to cancel">
      <h3>{card.title}</h3>
      {card.details && <p>{card.details}</p>}
      <div className="card-actions">
        <button className="icon-button delete-card" onClick={onDelete} aria-label={`Delete ${card.title}`} title="Delete card"><Trash2 size={13} aria-hidden="true" /></button>
      </div>
    </article>
  );
}
