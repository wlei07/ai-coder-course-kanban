"use client";

import { DragDropProvider, type DragStartEvent, type DragOverEvent, type DragEndEvent } from "@dnd-kit/react";
import { Accessibility } from "@dnd-kit/dom";
import { ArrowLeftRight, LayoutGrid, MoveRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { boardReducer, createInitialBoard } from "@/lib/board";
import { dropAction } from "@/lib/drop-action";
import { cardPosition } from "@/lib/announcements";
import { BoardColumn } from "./board-column";

export function KanbanBoard() {
  const [columns, dispatch] = useReducer(boardReducer, undefined, createInitialBoard);
  const snapshot = useRef(columns);
  const currentColumns = useRef(columns);
  useEffect(() => { currentColumns.current = columns; }, [columns]);
  const accessibility = useMemo(() => ({
    plugin: Accessibility,
    options: {
      announcements: {
        dragstart: ({ operation }: DragStartEvent) => `Picked up ${cardPosition(currentColumns.current, String(operation.source!.id))}.`,
        dragover: ({ operation }: DragOverEvent) => {
          const state = currentColumns.current;
          const action = dropAction({ source: operation.source, target: operation.target, canceled: false }, state);
          if (!action) return;
          return `Moving ${cardPosition(boardReducer(state, action), String(operation.source!.id))}.`;
        },
        dragend: ({ operation, canceled }: DragEndEvent) => {
          const restored = canceled || !operation.target;
          return `${restored ? "Move canceled. Returned" : "Dropped"} ${cardPosition(restored ? snapshot.current : currentColumns.current, String(operation.source!.id))}.`;
        },
      },
    },
  }), []);
  const total = columns.reduce((sum, column) => sum + column.cards.length, 0);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span className="brand-name">kanban<span className="brand-dot">.</span></span></div>
        <div className="topbar-note"><Sparkles size={14} aria-hidden="true" />Less noise. More progress.</div>
      </header>
      <main className="workspace">
        <div className="board-intro">
          <div><p className="eyebrow">YOUR PROJECT, IN PERSPECTIVE</p><h1>Project board</h1><p className="board-description">Big ideas, small steps. Bring your next project into focus.</p></div>
          <div className="board-stats" aria-label="Board summary"><div className="stat"><strong>{total}</strong><span>cards</span></div><span className="stat-divider" aria-hidden="true" /><div className="stat"><strong>5</strong><span>stages</span></div></div>
        </div>
        <div className="board-toolbar"><span className="board-label"><LayoutGrid size={15} aria-hidden="true" />The work in motion</span><span className="drag-hint"><ArrowLeftRight size={13} aria-hidden="true" />Drag cards to make progress</span></div>
        <DragDropProvider
          plugins={(defaults) => [...defaults.filter((plugin) => plugin !== Accessibility), accessibility]}
          onDragStart={() => { snapshot.current = columns; }}
          onDragOver={(event) => {
            // React owns the card elements; prevent the sorting plugin from reparenting them.
            event.preventDefault();
            const action = dropAction({ source: event.operation.source, target: event.operation.target, canceled: false }, columns);
            if (action) dispatch(action);
          }}
          onDragEnd={(event) => {
            if (event.canceled || !event.operation.target) dispatch({ type: "restore", columns: snapshot.current });
          }}
        >
          <div className="board-scroll" tabIndex={0} role="group" aria-label="Board columns, scroll horizontally to see all stages">
            <div className="board-grid">{columns.map((column) => <BoardColumn key={column.id} column={column} dispatch={dispatch} />)}</div>
          </div>
        </DragDropProvider>
        <footer className="board-footer"><span className="footer-note"><span className="footer-accent" aria-hidden="true"><i /><i /><i /></span>A little structure. A lot of possibility.</span><span className="footer-note footer-signoff">One step at a time<MoveRight size={12} aria-hidden="true" /></span></footer>
      </main>
    </div>
  );
}
