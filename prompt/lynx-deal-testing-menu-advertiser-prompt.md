# Lynx Admin — New Feature: Deal Testing (Menu Structure + Advertiser Page)

## Scope

This pass builds the navigation scaffolding for the new **Deal Testing** section, plus full content for the **Advertiser** page only. **Deal** and **Creatives** get empty-state shells for now — their real content comes in a later pass.

---

## 1. Sidebar Navigation

New top-level group: **Deal Testing** (collapsible, chevron — same pattern as the existing QC and Inventory groups), containing:

- **Deal** — leaf item, own page
- **DSP** — nested group (chevron, no page of its own — purely a folder), containing:
  - **Advertiser** — leaf item, own page
- **Creatives** — leaf item, own page

Note: this is the first **3-level-deep** nav grouping in this sidebar (Deal Testing → DSP → Advertiser), one level past the existing QC → Campaign Report / Inventory → Display pattern. Indent Advertiser one level further than Deal/Creatives to reflect the extra nesting, and make sure the collapsed (icon-only) sidebar's flyout behavior for a group-within-a-group still works — hovering DSP while collapsed should reveal Advertiser as its flyout child.

---

## 2. Deal (empty state for now)

- Breadcrumb: `Deal Testing / Deal`
- Title: "Deal"
- Empty state block, matching the existing Dashboard pattern (icon + heading + one-line supporting text) — e.g. "Nothing here yet" / "Deals will appear here once available."
- Note for later (not building now): this page is eventually a list + detail page, likely following the same list-plus-drawer/detail pattern already used for QC Campaign Report and Inventory Display — just scaffolding the page shell in this pass.

---

## 3. Creatives (empty state for now)

- Breadcrumb: `Deal Testing / Creatives`
- Title: "Creatives"
- Same empty-state treatment as Deal above.

---

## 4. DSP → Advertiser (full content)

### Styling note
The reference screenshot is for **content, layout, and data structure only**. Apply this platform's existing design system throughout — Geist, `#002933` / `#70E8E8`, existing kit components — rather than the screenshot's own purple accent. Also use the established **hover-revealed icon button row actions** (no dropdown) already used on Inventory Display, rather than replicating the screenshot's "..." kebab menu.

### List page
- Breadcrumb: `DSP / Advertiser`
- Title: "Advertisers"
- Subtitle: "Reusable advertiser and buyer library across deals."
- Tabs: `All [7]` · `DSP #A [4]` · `DSP #B [3]` — same tab-with-count-badge pattern used elsewhere, filtering the table by which DSP an advertiser belongs to.
- Search + CTA row: search input ("Search by name or domain...") + primary **+ New advertiser** button, top right.
- Table columns: **Advertiser Name**, **Domain**, **DSP** (tag/pill, distinct tint per DSP), **Action** (hover-revealed icon buttons — reuse whichever specific actions make sense here, at minimum Edit and Remove).
- Empty state for a fresh account or a search/tab combination that yields nothing.

### Create Advertiser (modal)
- Eyebrow label "DSP · ADVERTISER" above the modal title "New advertiser," close (X) icon top-right.
- **Advertiser name** — required, text input, placeholder "e.g. Nestlé Indonesia."
- **Domain** — optional, text input, placeholder "e.g. example.co.id," helper text below: "Used to match advertiser with buyer seat in OpenRTB."
- **DSP** — required, single-select radio cards: "LYNX Dummy DSP #A" / "LYNX Dummy DSP #B."
- Footer: Cancel (secondary) + "Create advertiser" (primary).

### Seed data
Populate with the same 7 advertisers from the reference so the tabs/counts/table all have realistic content:
- DSP #A: ExxonMobil Lubricants (exxonmobil.co.id), Unilever Indonesia (unilever.co.id), Nestlé Indonesia (nestle.co.id), Wardah Beauty (wardahbeauty.com)
- DSP #B: inDrive Indonesia (indrive.com), Tokopedia (tokopedia.com), Sinar Mas Land (sinarmasland.com)
