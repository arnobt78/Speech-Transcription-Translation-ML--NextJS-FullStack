# Ripple Button Effect

## Spec

- On click, a ripple element is created at the pointer position inside the button.
- The ripple expands (scale animation) and fades out, then is removed from the DOM.
- The ripple must not affect button semantics or accessibility (use `pointer-events: none`).
- Implement in a reusable component so every interactive button in the app uses the same effect.
- To avoid hydration issues, create the ripple only on the client (e.g. in a `useEffect` or inside a client component that renders the ripple on click).

## Behavior

1. User clicks the button.
2. Get click coordinates relative to the button.
3. Create a span (or div) with a class for the ripple, positioned at those coordinates.
4. Animate: scale from 0 to a large value (e.g. 2–4), opacity from ~0.3 to 0.
5. On animation end, remove the ripple element.
6. Button content and behavior unchanged; ripple is purely visual.

## Implementation notes

- Use `position: absolute` on the ripple and `position: relative` on the button wrapper so the ripple stays inside the button.
- Overflow: ensure the button has `overflow-hidden` so the ripple doesn’t spill out.
- Prefer CSS transitions/animations or a small animation library (e.g. framer-motion) for the expand/fade.
- Do not use `any`; type props and event handlers in TypeScript.

---

# CTA Shine / Splashing Button Effect

## Spec

- An auto-playing shine sweep animates across the button surface, creating a "splashing" or glossy highlight effect.
- The effect runs continuously (infinite loop) and does not require user interaction.
- Use for primary CTA buttons (e.g. "Let's Get Started!", "Translate") to draw attention.
- Combines with the Ripple effect: the button uses `RippleButton` and gets both ripple-on-click and auto-shine.

## Behavior

1. Wrap the `RippleButton` in a container with class `cta-shine-wrap`.
2. Add class `cta-shine-button` to the `RippleButton` itself.
3. The wrapper uses `::after` pseudo-element for a feathered white gradient that sweeps left-to-right.
4. Animation: translate the gradient from -100% to 200% with a slight skew, over ~4.5s, infinite.
5. The wrapper must have `overflow: hidden` and matching `border-radius` (e.g. `rounded-full` for circular, `rounded-3xl` for pill).

## Usage

```jsx
<div className="cta-shine-wrap rounded-full">
  <RippleButton className="cta-shine-button w-14 h-14 ...">
    <i className="fa-solid fa-language" />
  </RippleButton>
</div>
```

For pill-shaped buttons:

```jsx
<div className="cta-shine-wrap">
  <RippleButton className="cta-shine-button px-8 py-3 rounded-full ...">
    Let&apos;s Get Started!
  </RippleButton>
</div>
```

## CSS (globals.css)

- `.cta-shine-wrap`: `position: relative`, `display: inline-block`, `overflow: hidden`, `border-radius: 9999px`.
- `.cta-shine-wrap::after`: feathered white gradient, `width: 85%`, `animation: cta-shine 4.5s cubic-bezier(0.35, 0, 0.15, 1) infinite`.
- `@keyframes cta-shine`: translate from -100% to 200% with `skewX(-8deg)`.
