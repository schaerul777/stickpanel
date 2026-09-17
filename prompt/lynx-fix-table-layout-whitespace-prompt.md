# Lynx Admin — Fix: Table Layout After Removing Empty Column

## Problem
After removing the empty column that used to sit after "Status" in the QC Campaign Report child rows, the table now leaves a large block of dead whitespace after the **Action** column, extending to the right edge of the container. The remaining columns didn't reflow to fill the freed width — it looks like the row is still using a fixed column-width grid sized for the old column count, so removing one column just shrinks the used width instead of redistributing it.

## Fix
Rebuild the row layout (both the child-row grid and the parent-row grid, since both may have the same underlying issue) so columns are **proportional/flexible**, not fixed-width slots left over from the old layout:

- **Campaign / Media Plan** — should be the primary flexible column that absorbs the freed space (it's the most content-heavy column and benefits most from extra room — currently the tightest fit for longer campaign/media plan names).
- **Flag, Severity, Status** — keep compact, content-sized widths (these are short badges/pills, don't need to stretch).
- **Current Imp. / Suggested Imp. / Published Imp.** — keep aligned, consistent numeric-column widths (right- or left-aligned consistently across all three so the numbers scan cleanly).
- **Reviewer** — content-sized, enough room for an avatar + name without wrapping.
- **Action** — fixed, narrow, icon-only width, and should land at the true right edge of the row with no trailing gap after it.

The row should span 100% of the table container's width with no leftover empty space on either end, regardless of column count. Apply the same fix to the parent row (Inventory Name / Organization / Date / Type / Screen Connection / Total Campaign) if it has the same fixed-width leftover issue — the "Total Campaign" status pill shouldn't be followed by unused dead space either.

## Acceptance
Every row (parent and child) fills the full table width edge-to-edge. No visible empty gap after the last column in either row type, at the current column count.
