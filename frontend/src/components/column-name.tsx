import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ColumnName({ title, onRename }: { title: string; onRename: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasEdited = useRef(false);

  useEffect(() => {
    if (!editing && wasEdited.current) buttonRef.current?.focus();
  }, [editing]);

  function finish(save: boolean, restoreFocus = true) {
    wasEdited.current = restoreFocus;
    if (save && draft.trim()) onRename(draft.trim());
    setEditing(false);
  }

  return editing ? (
    <input
      className="column-name-input" aria-label="Column name" value={draft} autoFocus
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => finish(true, false)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") {
          event.preventDefault();
          finish(event.key === "Enter");
        }
      }}
    />
  ) : (
    <button ref={buttonRef} className="column-rename" aria-label={`Rename ${title}`} onClick={() => {
      setDraft(title); wasEdited.current = true; setEditing(true);
    }}>
      <span>{title}</span><Pencil size={11} aria-hidden="true" />
    </button>
  );
}
