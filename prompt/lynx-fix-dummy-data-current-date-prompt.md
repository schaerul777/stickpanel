# Lynx Admin — Fix: Dummy Data Missing for Current Date

## Problem
The mock/dummy dataset uses fixed, hardcoded dates (e.g. "Jul 1, 2026"). As real time passes, "today" no longer matches any seeded date, so anything that defaults to the current date — the QC list's default view, the date filter, the Inventory Trend chart's 30-day window — renders empty whenever the prototype is opened.

## Fix
Generate all dummy data dates **relative to the actual current date at runtime**, not as fixed strings. Every seeded date should be computed as an offset from "today" (e.g. today, today − 1, today − 2 ... today − 29), so the dataset always includes the current date no matter when the prototype is opened.

## Where to apply this

**QC Campaign Report rows**
- Seed inventory/date rows for a trailing window (last 30 days) computed from today, not a fixed calendar range.
- The **today** row(s) should be freshly generated with status `Need Review` and an unassigned reviewer — this simulates a day's data that just arrived and hasn't been worked yet, which is the realistic state and also guarantees "today" is never an empty row.
- Older days in the window should have a realistic mix of statuses (`Investigating`, `Resolved`, `Published`) rather than all identical, so filtering/tabs have something to show across every status.

**Inventory Trend chart (Campaign Details Drawer)**
- The 30-day window plotted should always end on today's date, computed the same way — not a fixed end date that drifts into the past.
- Today's data point for Published Imp will naturally be missing/blank if that item hasn't been published yet (expected — matches the "no data point until published" behavior already specified), but Current/Suggested data should still exist for today.

**Date range presets (Last 7 days / Last 30 days / etc.)**
- Since these presets already compute relative to "now," make sure the underlying dataset actually has entries in whatever range they resolve to — otherwise the preset will correctly compute a valid range but return nothing, which looks like the same bug even though the date logic itself is fine.

## Acceptance
Opening the prototype on any date should show data for that day by default — no empty QC list, no blank chart, regardless of how much time has passed since the mock data was originally written.
