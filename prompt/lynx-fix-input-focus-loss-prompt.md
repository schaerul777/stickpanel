# Lynx Admin — Fix: Input Loses Focus After Every Keystroke

## Problem
When editing Suggested Impression or Suggested Reach in the Campaign Details Drawer, the field loses focus after each character typed. The user has to click back into the field before typing the next character — every single character.

## Most likely root cause
This is a classic React symptom: the input's component is being **re-created**, not just re-rendered, on every keystroke. That unmounts the old DOM node and mounts a brand new one, so the browser genuinely has no focused element for a moment — hence needing to reclick each time.

The #1 cause, by far: a field/row/cell component is **defined inside the render body of its parent** (e.g. a `SuggestedField` component declared inside the drawer's render function instead of at the top of the file). Every time the parent re-renders — which happens on every keystroke, since typing updates state — React sees what looks like a brand-new component type and force-remounts it instead of updating it in place.

## Fix — check in this order

1. **Find any component defined inside another component's function body**, specifically around the Suggested Impression/Reach fields and their parent row/drawer. Something shaped like:
   ```
   function CampaignDrawer() {
     function SuggestedField(props) { ... }   // <- recreated on every render
     return ... <SuggestedField ... />
   }
   ```
   Move that component out to the top level of the file, above and outside the parent. This is very likely the actual fix.

2. **Check for an unstable `key` prop** on the input or any ancestor element — e.g. a key built from `Date.now()`, `Math.random()`, or anything that changes on every render. An unstable key alone forces a remount, independent of #1. Keys should be stable — tied to the row's campaign/inventory ID, not regenerated per render.

3. **Check whether editing Impression or Reach triggers a recalculation that touches the whole row's state** (since Suggested Frequency auto-calculates from them). If that recalculation rebuilds part of the component tree rather than just updating a value, it compounds with #1/#2. The calculation should update state values only, never redefine or restructure a component.

4. **If the field goes through a debounce/throttle**, confirm it's wrapping the side effect (saving/syncing the draft value) and not the input's actual `value`/`onChange` wiring — debouncing the controlled value directly can desync the input from what's actually been typed.

## Acceptance
Typing multiple characters in a row into Suggested Impression or Suggested Reach works continuously — cursor and focus stay in the field the whole time, no reclicking between characters.
