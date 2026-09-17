# Lynx Admin — Campaign Details Drawer & QC List: Update Prompt (Round 2)

This is a delta update on top of the existing Campaign Details Drawer and the QC → Campaign Report list. Apply these changes to what's already built — don't rebuild from scratch.

---

## 1. Dataset Table — Add the 3 System Suggestions

The data team now provides three candidate suggestions per metric. Add them to the existing dataset table.

New structure: **Metric | Current | Suggested (1st / 2nd / 3rd, grouped under one "Suggested" header) | Published**
Rows unchanged: Impression, Reach, Frequency.

- Visually distinguish the **1st** suggestion sub-column (subtle background tint or bold text) since it's the default value carried into the editable action fields below — this makes the connection between the table and the action fields obvious without extra copy.
- This makes the table 6 columns wide. Keep the Metric column pinned/sticky on horizontal scroll if the drawer width can't comfortably fit all columns without cramping the numbers.
- Published column keeps its existing behavior: shows `—` until the item is actually published.

---

## 2–3. Action Fields — Rename to "Suggested," Reach Becomes Editable

The editable fields in the action area (previously "Published Imp / Published Reach / Published Freq") are renamed to reflect that they're a staged value under review, not yet committed:

- **Suggested Impression** — editable
- **Suggested Reach** — editable (previously read-only — this is new)
- **Suggested Frequency** — disabled/read-only, auto-calculated by the system from Suggested Impression and Suggested Reach

Default values on drawer open: all three mirror the **1st suggestion** from the dataset table.

These three fields are what gets written into the "Published" column of the dataset table once Confirm & Publish succeeds — they're the actual thing being reviewed, the table's 3 suggestion columns are reference/comparison context alongside them.

---

## 4. Inventory Trend Chart — Representing 3 Suggestions

Do not add 3 separate suggestion lines. Instead:

- Render the 3 suggestions as a **shaded min–max band** per day (fill between the lowest and highest of the three).
- Draw a **dashed line** through the 1st suggestion value (the default staged value) on top of the band.
- Keep **Current** and **Published** as solid lines, as before — Published still only plots from the day publishing actually started.
- Legend: **Current**, **Suggested range**, **Published** — three entries, not five.
- Hovering a day's tooltip shows the exact 1st / 2nd / 3rd suggestion values for that day even though only the band and dashed line are drawn, so the detail is available without permanently cluttering the chart.

---

## 5. Remove Confidence Level Section

Remove the "Confidence level" percentage and its "Baseline: Same weekday last week" label from below the dataset table entirely.

---

## 6. QC List Table — Remove Empty Cell

In the QC Campaign Report table's child rows, remove the empty cell that currently sits after the Status column. Action ("View") shifts left to close the gap.

---

## 7. Critical Severity — Add "Confirm & Publish" Alongside "Escalate to Data Ops"

Critical severity items previously only had **Escalate to Data Ops** available. Now show **both** actions side by side:

- **Confirm & Publish** — same behavior as the Normal/Mild path: publishes the current Suggested Impression/Reach/Frequency values directly, status → `Published`.
- **Escalate to Data Ops** — unchanged: routes to the Investigating flow.

This gives the reviewer discretion on Critical items rather than forcing every one through escalation. Both buttons show together whenever status is `Need Review` and severity is `Critical`; the reviewer picks one.

---

## 8. Tabs — Merge "Resolved" and "Published" for Filtering Only

Collapse the two separate tabs into a single tab: **"Resolved & Published."**

- This is a display/filter change only — clicking this tab filters for status IN (`Resolved`, `Published`).
- The underlying data keeps the two statuses fully distinct — nothing about how items transition between `Resolved` and `Published` changes, only how they're grouped in the tab bar.
- Tab bar becomes: `All` · `Need Review` · `Investigating` · `Resolved & Published` — four tabs instead of five, count badge sums both statuses.

---

## 9. Remove "Reason" Field for Critical Items

For any item where severity is `Critical`, remove the Reason dropdown entirely — from both the Confirm & Publish action and the Escalate to Data Ops action.

Normal/Mild items keep Reason as-is (optional, on their Confirm & Publish action).

---

## 10. Loading States

Add a loading state to all three actions: **Confirm & Publish**, **Escalate to Data Ops**, **Mark as Resolved**.

- On click: button shows a spinner in place of its label/icon, becomes non-interactive, and other actions/fields in the drawer are disabled for the duration of the request.
- On failure (if applicable): revert to the normal enabled state and surface an inline error rather than silently failing.

---

## 11. Success Alert States

After each action completes successfully, show a success alert/toast:

- **Confirm & Publish** → e.g. "Published successfully."
- **Escalate to Data Ops** → e.g. "Escalated to [assigned Data Ops name]."
- **Mark as Resolved** → e.g. "Marked as resolved."

Alert appears immediately after the loading state resolves, auto-dismisses after a few seconds, and the drawer reflects the new status/state (per Section 5 of the prior content-update prompt) once dismissed or in parallel.
