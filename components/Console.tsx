"use client";

import { useId } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v?: string) => void;
  suggestions: string[];
  active: number;
  setActive: (i: number) => void;
  left: number;
  msg: string;
  tone: "info" | "error";
  disabled: boolean;
};

export function Console({
  value, onChange, onSubmit, suggestions, active, setActive, left, msg, tone, disabled,
}: Props) {
  const id = useId();

  return (
    <section className="console">
      <div className="field">
        <label className="sr" htmlFor={`${id}-in`}>
          Guess an architecture
        </label>
        <input
          id={`${id}-in`}
          value={value}
          disabled={disabled}
          placeholder="Guess an architecture"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={suggestions.length > 0}
          aria-controls={id}
          aria-autocomplete="list"
          aria-activedescendant={suggestions.length ? `${id}-${active}` : undefined}
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
        <span className="tally">{left} left</span>
        <button className="go" disabled={disabled || !value.trim()} onClick={() => onSubmit()}>
          Guess
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="suggest" id={id} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              data-active={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSubmit(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <p className="msg" data-tone={tone} role="status">
        {msg}
      </p>
    </section>
  );
}
