# Lynx Admin — New Page: Inventory → Display List

## 1. Sidebar — Add "Inventory" > "Display"

Add a new top-level nav group **Inventory** (same pattern as the existing QC group — collapsible with a chevron), containing one child item for now: **Display**. Same active-state, collapse/expand, and icon-only-when-minimized behavior already used for QC.

---

## 2. Page Layout — Mirror QC Campaign Report

Reuse the exact structural and styling patterns already established for QC → Campaign Report — don't design this from scratch:

- Breadcrumb: `Inventory / Display`
- Page title + subtitle placement
- Top-right CTA button placement
- Search + Filters + Columns row
- Filter panel layout (labeled field above each control)
- Active-filter chip treatment
- Tab bar styling (see Section 4 for what goes in the tabs here)
- Footer: result count + page size + pagination

---

## 3. Table Columns (pulled directly from the referenced Figma file)

**Universal columns** (shown regardless of Display Type):
- **Preview** — 64×64 thumbnail. Hovering shows a subtle dark overlay with an eye icon for a quick look, without leaving the row.
- **Name & SKU** — two lines: display name (bold) + SKU code (muted) beneath it, plus a smaller "Last update: [date] [time]" caption below that. This is the flexible column — it absorbs whatever width is freed when Digital-only columns are hidden (Section 5), same principle as the Campaign/Media Plan column fix on the QC table.
- **Type & Category**
- **Price**
- **Action** — see Section 6.

**Digital-only columns** (hidden entirely when the Conventional tab is active, not just blanked):
- **CPM** — label includes a small info/tooltip icon explaining what CPM means.
- **Resolution**
- **Connection** — label includes an info/tooltip icon.
- **Status** — label includes an info/tooltip icon.

**Empty-value pattern:** where a Digital-only field genuinely hasn't been configured yet, show an inline **"+ Add [field]"** button in that cell instead of a flat dash — this matches what's already in the reference file and gives the user a direct path to fill it in rather than just seeing a gap.

---

## 4. Main Filter — Tabs by Display Type

Primary filter is a tab view, same visual treatment as QC's status tabs, but driven by **Display Type**:

`Digital [n]` · `Conventional [n]`

I'd skip an "All" tab here — unlike QC's statuses, Digital and Conventional are mutually exclusive and together already cover 100% of inventory, so "All" would just be redundant with viewing both counts. Add one if you want a combined view anyway; it's a small change.

---

## 5. Conditional Columns by Tab

- **Conventional** active → hide CPM, Resolution, Connection, and Status columns completely. Don't leave their column-width reserved — apply the same flexible-column reflow fix already used on the QC table (Name & SKU grows to fill the freed space; Action stays pinned to the true right edge) so removing four columns doesn't reproduce the whitespace bug we just fixed there.
- **Digital** active → show all columns.

---

## 6. Row Actions — Hover Icon Buttons, No Dropdown

Replace any kebab/dropdown menu with direct icon buttons that appear on hover over the row, Spotify-style:

- **Edit** (pencil icon)
- **Duplicate** (copy icon)
- **Remove** (trash icon)

All three render together on hover and are hidden otherwise — this differs from the reference Figma file's action cell (which shows one default button plus a second hidden-until-hover button); use three hover-revealed icons instead of that two-button pattern.
