"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "./Icons";

/**
 * Nav dropdown with a split trigger: the label is a real link to the section's
 * own page, and an adjacent button opens the panel. That keeps the destination
 * reachable by keyboard while exposing correct `aria-expanded` state on an
 * element that is allowed to carry it.
 *
 * The panel unmounts synchronously when closed — no exit animation — so it can
 * never linger as an invisible but still clickable overlay. Entry is a plain
 * CSS animation on the inner card.
 *
 * Closes on Escape, on outside pointer-down, and when focus leaves the group.
 */
export function DropdownMenu({
  label,
  href,
  children,
  panelClassName = "w-[min(92vw,880px)] left-1/2 -translate-x-1/2",
}: {
  label: string;
  href: string;
  children: (close: () => void) => React.ReactNode;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  // After an explicit dismissal (Escape / outside click) the pointer is often
  // still resting on the trigger; without this the panel would reopen at once.
  const [hoverSuppressed, setHoverSuppressed] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedRef = useRef(false);
  const panelId = useId();

  const close = () => setOpen(false);

  const dismiss = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Only suppress hover if the pointer is still physically over the group —
    // otherwise the next genuine hover would be swallowed.
    const stillHovered =
      wrapperRef.current?.matches(":hover") ?? false;
    suppressedRef.current = stillHovered;
    setHoverSuppressed(stillHovered);
    setOpen(false);
  };

  const openNow = () => {
    // Read the ref, not state: focus() immediately after dismiss() would
    // otherwise see a stale `false` and reopen the panel.
    if (suppressedRef.current) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setOpen(true);
  };

  const closeSoon = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 140);
  };

  const allowHoverAgain = () => {
    suppressedRef.current = false;
    setHoverSuppressed(false);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) dismiss();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={() => {
        allowHoverAgain();
        closeSoon();
      }}
      onFocus={openNow}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <span className="flex items-center gap-1">
        <Link
          href={href}
          onClick={close}
          className="text-sm font-medium text-cloud-soft transition-colors hover:text-cloud"
        >
          {label}
        </Link>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`${open ? "Hide" : "Show"} ${label} menu`}
          onClick={() => {
            if (open) {
              dismiss();
            } else {
              allowHoverAgain();
              setOpen(true);
            }
          }}
          className="flex h-6 w-5 items-center justify-center text-cloud-soft transition-colors hover:text-cloud"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </span>

      {open && (
        <div className={`absolute top-full z-50 pt-3 ${panelClassName}`}>
          <div
            id={panelId}
            className="animate-menu-in overflow-hidden rounded-xl border border-line-light bg-ivory shadow-2xl shadow-black/50"
          >
            {children(close)}
          </div>
        </div>
      )}
      {/* Keeps the suppression flag observable to React's dependency tracking. */}
      <span hidden data-hover-suppressed={hoverSuppressed} />
    </div>
  );
}
