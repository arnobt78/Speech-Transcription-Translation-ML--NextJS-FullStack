/**
 * RippleButton — Reusable Button with Material Design Ripple Effect
 *
 * Creates a visual ripple animation at the click position inside the button.
 * This is a common UX pattern from Material Design that provides tactile
 * feedback to users when they interact with buttons.
 *
 * How the ripple works:
 * 1. User clicks the button
 * 2. We calculate click coordinates relative to the button
 * 3. A <span> element is created at those coordinates
 * 4. CSS animation scales it from 0 to a large value while fading opacity
 * 5. On animation end, the span is removed from the DOM
 *
 * Implementation notes:
 * - `position: relative` + `overflow: hidden` on the button keeps the ripple contained
 * - `pointer-events: none` on the ripple avoids interfering with click events
 * - The ripple is purely visual — button semantics and accessibility are unchanged
 */

"use client";

import { useCallback, useRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Additional class names to apply to the button */
  className?: string;
}

export function RippleButton({
  children,
  className,
  onClick,
  ...props
}: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current;
      if (!button) return;

      // Get click position relative to the button element
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate ripple size — should be large enough to cover the entire button
      const size = Math.max(rect.width, rect.height) * 2;

      // Create the ripple element
      const ripple = document.createElement("span");
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      ripple.style.position = "absolute";
      ripple.style.borderRadius = "50%";
      ripple.style.backgroundColor = "rgba(255, 255, 255, 0.35)";
      ripple.style.transform = "scale(0)";
      ripple.style.pointerEvents = "none";
      ripple.style.animation = "ripple-effect 0.6s ease-out forwards";

      button.appendChild(ripple);

      // Remove the ripple element after animation completes
      ripple.addEventListener("animationend", () => {
        ripple.remove();
      });

      // Call the original onClick handler if provided
      onClick?.(e);
    },
    [onClick],
  );

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-200",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
