import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Plus, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

type Props = { columnTitle: string; onAdd: (title: string, details: string) => void };

export function AddCardDialog({ columnTitle, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="add-card"><Plus size={14} aria-hidden="true" />Add card</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-kicker">{columnTitle}</div>
          <Dialog.Title className="dialog-title">Add a card</Dialog.Title>
          <Dialog.Description className="dialog-description">Make room for your next step. The details can come later.</Dialog.Description>
          <Dialog.Close className="icon-button dialog-close" aria-label="Close dialog"><X size={18} /></Dialog.Close>
          <CardForm onAdd={(title, details) => { onAdd(title, details); setOpen(false); }} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CardForm({ onAdd }: Pick<Props, "onAdd">) {
  const id = useId();
  const [error, setError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim();
    if (!title) { setError(true); return; }
    onAdd(title, String(data.get("details")).trim());
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input id={`${id}-title`} name="title" placeholder="What needs to happen?" autoFocus aria-required="true" aria-invalid={error} aria-describedby={error ? `${id}-error` : undefined} onChange={() => setError(false)} />
        {error && <p id={`${id}-error`} className="field-error" role="alert">Give your card a title.</p>}
      </div>
      <div className="field">
        <label htmlFor={`${id}-details`}>Details (optional)</label>
        <textarea id={`${id}-details`} name="details" placeholder="A little context goes a long way…" />
      </div>
      <div className="dialog-actions">
        <Dialog.Close asChild><button type="button" className="button">Cancel</button></Dialog.Close>
        <button type="submit" className="button button-primary">Add card<ArrowUpRight size={15} aria-hidden="true" /></button>
      </div>
    </form>
  );
}
