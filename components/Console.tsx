"use client";

import { useEffect, useId, useRef } from "react";
import type { Candidate } from "@/lib/shared";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v?: string) => void;
  suggestions: Candidate[];
  active: number;
  setActive: (i: number) => void;
  left: number;
  msg: string;
  /** bumps on every rejected guess, to replay the shake */
  shake: number;
  disabled: boolean;
};

export function Console({
  value, onChange, onSubmit, suggestions, active, setActive, left, msg, shake, disabled,
}: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLDivElement>(null);

  // Typing anywhere on the page goes to the guess box.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, dialog, [contenteditable]")) return;
      input.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!shake || !field.current) return;
    field.current.classList.remove("shake");
    void field.current.offsetWidth; // restart the animation
    field.current.classList.add("shake");
  }, [shake]);

  const open = suggestions.length > 0;

  return (
    <section className="console">
      <div className="combo">
        <div className="field" ref={field}>
          <label className="sr" htmlFor={`${id}-in`}>
            Guess an architecture
          </label>
          <input
            ref={input}
            id={`${id}-in`}
            value={value}
            disabled={disabled}
            placeholder="Name an architecture…"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={open ? `${id}-${active}` : undefined}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(Math.min(active + 1, suggestions.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive(Math.max(active - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              } else if (e.key === "Escape") {
                onChange("");
              }
            }}
          />
          <button className="go" disabled={disabled || !value.trim()} onClick={() => onSubmit()}>
            Guess
          </button>
        </div>

        {open && (
          <ul className="suggest" id={`${id}-list`} role="listbox" aria-label="Matching architectures">
            {suggestions.map((s, i) => (
              <li
                key={s.name}
                id={`${id}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSubmit(s.name);
                }}
              >
                <span className="s-name">{s.name}</span>
                <span className="s-year num">{s.year}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="under">
        <p className="msg" role="status" data-error={Boolean(msg)}>
          {msg || (
            <>
              <span className="num">{left}</span> {left === 1 ? "guess" : "guesses"} left
            </>
          )}
        </p>
      </div>
    </section>
  );
}
