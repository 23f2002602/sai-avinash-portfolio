"use client";

import { useState } from "react";
import { fieldNotes } from "@/lib/content";

export function FieldNotes() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="notes-grid">
      {fieldNotes.map((note, index) => {
        const expanded = open === index;
        return (
          <button
            type="button"
            className={`note-card${expanded ? " is-open" : ""}`}
            aria-expanded={expanded}
            onClick={() => setOpen(expanded ? null : index)}
            key={note.title}
          >
            <span className="note-top">
              <span className="micro">{String(index + 1).padStart(2, "0")} / {note.title}</span>
              <span className="note-plus" aria-hidden="true">{expanded ? "−" : "+"}</span>
            </span>
            <span className="note-short">{note.short}</span>
            <span className="note-detail">{note.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
