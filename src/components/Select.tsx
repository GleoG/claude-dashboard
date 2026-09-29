import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  /** CSS color for a small swatch before the label, e.g. "var(--series-1)". */
  dot?: string;
};

const MARGIN = 8;

type Pos = { top: number; left: number; width?: number; maxHeight: number };

function computePos(trigger: HTMLElement, menu: HTMLElement | null, compact: boolean): Pos {
  const t = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const menuW = menu?.offsetWidth || (compact ? 180 : Math.max(t.width, 240));
  const menuH = menu?.scrollHeight || 260;

  let left = compact ? t.right - menuW : t.left;
  if (left + menuW > vw - MARGIN) left = t.right - menuW;
  if (left < MARGIN) left = MARGIN;
  if (left + menuW > vw - MARGIN) left = Math.max(MARGIN, vw - MARGIN - menuW);

  const spaceBelow = vh - t.bottom - MARGIN;
  const spaceAbove = t.top - MARGIN;
  const below = spaceBelow >= Math.min(menuH, 200) || spaceBelow >= spaceAbove;
  const maxHeight = Math.max(120, Math.min(340, (below ? spaceBelow : spaceAbove) - 6));
  const top = below ? t.bottom + 6 : t.top - 6 - Math.min(menuH, maxHeight);

  return { top, left, width: compact ? undefined : Math.max(t.width, 240), maxHeight };
}

export function Select({
  value,
  options,
  onChange,
  placeholder = "Choose…",
  disabled = false,
  compact = false,
  ariaLabel,
  title,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  ariaLabel?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const recompute = () => {
      if (!triggerRef.current) return;
      setPos(computePos(triggerRef.current, menuRef.current, compact));
    };
    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [open, compact, options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`dd ${compact ? "compact" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`dd-trigger ${compact ? "compact" : ""}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        title={title ?? current?.hint}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.dot && <span className="dd-dot" style={{ background: current.dot }} />}
        <span className="dd-trigger-text">
          <span className="dd-trigger-label">{current?.label ?? placeholder}</span>
          {!compact && current?.hint && <span className="dd-trigger-hint">{current.hint}</span>}
        </span>
        <span className="dd-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="dd-menu"
            role="listbox"
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: pos?.width,
              maxHeight: pos?.maxHeight,
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {options.length === 0 && <div className="dd-empty">Nothing to choose from.</div>}
            {options.map((o) => (
              <button
                type="button"
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                disabled={o.disabled}
                title={o.hint}
                className={`dd-option ${o.value === value ? "on" : ""}`}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.dot && <span className="dd-dot" style={{ background: o.dot }} />}
                <span className="dd-option-text">
                  <span className="dd-option-label">{o.label}</span>
                  {o.hint && <span className="dd-option-hint">{o.hint}</span>}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
