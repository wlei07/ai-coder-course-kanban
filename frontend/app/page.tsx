"use client";

import {
  closestCorners,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";

type Card = {
  id: string;
  title: string;
  details: string;
};

type Column = {
  id: string;
  title: string;
  cards: Card[];
};

const initialColumns: Column[] = [
  {
    id: "backlog",
    title: "Backlog",
    cards: [
      { id: "card-1", title: "Research", details: "Review the latest requirements and prep the project scope." },
      { id: "card-2", title: "Ideas", details: "List the biggest opportunities for this sprint." },
    ],
  },
  {
    id: "design",
    title: "Design",
    cards: [{ id: "card-3", title: "Moodboard", details: "Create a strong visual direction for the board experience." }],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [
      { id: "card-4", title: "Flow audit", details: "Validate the onboarding flow and capture friction points." },
    ],
  },
  {
    id: "review",
    title: "Review",
    cards: [{ id: "card-5", title: "QA notes", details: "Summarize open issues and blockers before sign-off." }],
  },
  {
    id: "done",
    title: "Done",
    cards: [{ id: "card-6", title: "Kickoff", details: "Project brief approved and ready to execute." }],
  },
];

const columnOrder = ["backlog", "design", "in-progress", "review", "done"];

function createCard(title: string, details: string): Card {
  return {
    id: `card-${crypto.randomUUID()}`,
    title,
    details,
  };
}

function SortableCard({ card, onDelete }: { card: Card; onDelete: (cardId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all ${
        isDragging ? "scale-[1.01] opacity-80 shadow-md" : "hover:border-[#209dd7]/50"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#032147]">{card.title}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-600">{card.details}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(card.id);
          }}
          className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 transition hover:border-red-200 hover:text-red-500"
          aria-label={`Delete ${card.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [drafts, setDrafts] = useState<Record<string, { title: string; details: string }>>({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const visibleColumns = useMemo(
    () => columnOrder.map((columnId) => columns.find((column) => column.id === columnId) ?? null).filter(Boolean) as Column[],
    [columns],
  );

  const updateColumnTitle = (columnId: string, value: string) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId
          ? { ...column, title: value || "Untitled column" }
          : column,
      ),
    );
  };

  const updateDraft = (columnId: string, field: "title" | "details", value: string) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: {
        title: currentDrafts[columnId]?.title ?? "",
        details: currentDrafts[columnId]?.details ?? "",
        [field]: value,
      },
    }));
  };

  const addCardToColumn = (columnId: string) => {
    const draft = drafts[columnId] ?? { title: "", details: "" };
    const trimmedTitle = draft.title.trim();
    const trimmedDetails = draft.details.trim();

    if (!trimmedTitle || !trimmedDetails) {
      return;
    }

    const newCard = createCard(trimmedTitle, trimmedDetails);

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, cards: [...column.cards, newCard] } : column,
      ),
    );

    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [columnId]: { title: "", details: "" },
    }));
  };

  const deleteCard = (columnId: string, cardId: string) => {
    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === columnId ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) } : column,
      ),
    );
  };

  const moveCard = (activeId: string, overId: string) => {
    setColumns((currentColumns) => {
      const sourceColumn = currentColumns.find((column) => column.cards.some((card) => card.id === activeId));
      const targetColumn = currentColumns.find((column) => column.id === overId)
        ?? currentColumns.find((column) => column.cards.some((card) => card.id === overId));

      if (!sourceColumn || !targetColumn) {
        return currentColumns;
      }

      const sourceIndex = sourceColumn.cards.findIndex((card) => card.id === activeId);
      const movingCard = sourceColumn.cards[sourceIndex];

      if (!movingCard) {
        return currentColumns;
      }

      const newColumns = currentColumns.map((column) => ({ ...column, cards: [...column.cards] }));
      const sourceColumnIndex = newColumns.findIndex((column) => column.id === sourceColumn.id);
      const targetColumnIndex = newColumns.findIndex((column) => column.id === targetColumn.id);

      newColumns[sourceColumnIndex].cards.splice(sourceIndex, 1);

      const targetCards = newColumns[targetColumnIndex].cards;
      const targetCardIndex = targetCards.findIndex((card) => card.id === overId);
      const insertAt = targetCardIndex === -1 ? targetCards.length : targetCardIndex;

      if (sourceColumnIndex === targetColumnIndex) {
        const adjustedTargetIndex = sourceIndex < insertAt ? insertAt - 1 : insertAt;
        const reorderedCards = arrayMove(targetCards, sourceIndex, adjustedTargetIndex);
        newColumns[targetColumnIndex].cards = reorderedCards;
        return newColumns;
      }

      targetCards.splice(insertAt, 0, movingCard);
      return newColumns;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) {
      return;
    }

    moveCard(activeId, overId);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f6f1df_0%,_#f4efe8_20%,_#eef4fb_50%,_#edf3f8_100%)] px-5 py-8 text-slate-800 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[28px] border border-[#ecad0a]/30 bg-[#032147] px-6 py-6 text-white shadow-[0_18px_45px_rgba(3,33,71,0.18)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ecad0a]">Project board</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Kanban MVP</h1>
          </div>
          <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
            5 columns • live board updates
          </div>
        </header>

        <DndContext
          id="kanban-dnd-context"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <div className="grid gap-5 xl:grid-cols-5">
            {visibleColumns.map((column) => (
              <div
                key={column.id}
                className="flex min-h-[660px] flex-col rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <input
                    value={column.title}
                    onChange={(event) => updateColumnTitle(column.id, event.target.value)}
                    className="w-full border-none bg-transparent text-base font-semibold text-[#032147] outline-none"
                    aria-label={`Column title for ${column.title}`}
                  />
                  <span className="inline-flex min-w-8 justify-center rounded-full bg-[#209dd7]/10 px-2 py-1 text-xs font-bold text-[#209dd7]">
                    {column.cards.length}
                  </span>
                </div>

                <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {column.cards.map((card) => (
                      <SortableCard key={card.id} card={card} onDelete={() => deleteCard(column.id, card.id)} />
                    ))}
                  </div>
                </SortableContext>

                <div className="mt-auto pt-4">
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                    <div className="space-y-2">
                      <input
                        value={drafts[column.id]?.title ?? ""}
                        onChange={(event) => updateDraft(column.id, "title", event.target.value)}
                        placeholder="Card title"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#209dd7]"
                        aria-label={`${column.title} card title`}
                      />
                      <textarea
                        value={drafts[column.id]?.details ?? ""}
                        onChange={(event) => updateDraft(column.id, "details", event.target.value)}
                        placeholder="Card details"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#209dd7]"
                        aria-label={`${column.title} card details`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => addCardToColumn(column.id)}
                      className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#753991] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5d2f74]"
                    >
                      Add card
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
