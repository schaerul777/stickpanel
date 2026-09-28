# StickPanel Prototype: Complete Prompt Pack

Front-end prototype only (mock data, no backend, no auth). Run the parts in order, one prompt at a time, and check the result before moving on.

**Run order**
1. Part A: Core Switcher
2. Part B: Shared base for CORE 4 Master pages
3. Part C: Per-page prompts (C1 to C9)

**Assumptions (edit if wrong)**
- All ERD master data pages live under **Master (CORE 4)**.
- `masProductPrice` has no standalone CRUD page. Prices are edited inside the Product form. An optional Price Matrix page is included (C9).
- Simple entities use a right-side drawer. Company and Product use a full-page form.
- Currency is IDR, formatted like `Rp 1.500.000`.
- Delete is a soft delete (`deleted_at`) and is blocked if the record is still referenced.
- `masCompany.increment` is the quotation numbering counter and is editable.
- Quantity Unit and Duration Unit on Product are auto-filled from the category but editable.
- `masBrand.text` is the brand name, labelled "Name" in the UI.
- Term Moment and Term Due are quotation payment-term options. Their mock data is a guess.

---

# PART A: Core Switcher

```
Add a "Core Switcher" to the existing StickPanel admin panel so the sidebar menu and pages are filtered by the active core. This is a prototype, so keep it front-end only (no backend, no auth).

## 1. Core definitions

Create a single config (e.g. `coreConfig`) that is the source of truth for the menu of each core:

- CORE 2 → Operations, Sales, Master, Account
- CORE 3 → Master, Inventory, QC, Deal Testing, Account
- CORE 4 → Master, Account

Rules:
- Operations and Sales belong ONLY to CORE 2.
- Inventory, QC, and Deal Testing belong ONLY to CORE 3.
- The existing Master submenus and pages belong ONLY to CORE 3.
- Master and Account exist in every core, but each core has its own separate version.
- CORE 2 Master and every core's Account page are simple placeholder pages: page title, breadcrumb, and an empty state saying "<Page> for CORE X will be available here". Do not reuse CORE 3's Master submenus in other cores.
- CORE 4 Master is a real feature with these submenus, in this order: Company, Product Category, Product, Price, Brand, City, Quotation Term Moment, Quotation Term Due (plus Price Matrix if it is built). The pages are built in Part C. Until then, each submenu item opens a placeholder page.
- Keep the existing menu order, icons, expand/collapse behavior, and active-state styling exactly as they are now. Only filter which items are shown.
- Keep the config easy to extend when new features are added to a core later.

## 2. Switcher UI (bottom of sidebar)

- Use the existing profile card at the bottom of the sidebar ("Ops Team / Online") as the trigger.
- Show the active core as a small badge or subtitle inside the card, e.g. "Ops Team · CORE 3".
- Add a small chevron-up-down icon on the right side of the card. Clicking anywhere on the card opens a popover that opens upward.
- Popover content:
  - Header label: "Switch Core"
  - A list of 3 options: CORE 2, CORE 3, CORE 4. Each has a short name/description line (leave the description as an easy-to-edit placeholder), and a check icon on the active one.
  - A divider, then the existing profile actions (e.g. Account settings and Log out) if present.
- Style: match the current purple sidebar theme. The popover is a white card with rounded corners, a soft shadow, and a hover state on each row. Close on outside click and on Esc.
- Keyboard accessible (arrow keys to move, Enter to select). Use aria-labels.

## 3. Switching behavior

- Selecting a core immediately:
  1. Updates the sidebar to show only that core's menu items.
  2. Navigates to that core's default landing page:
     - CORE 2 → Operations > Redeem Transactions
     - CORE 3 → Inventory landing page
     - CORE 4 → Master > Company (/core-4/master/company)
  3. Collapses all expanded menu groups except the one containing the landing page.
- If the user is on a page that doesn't exist in the newly selected core, redirect to that core's default landing page instead of showing a broken or blank view.
- If the user opens a /core-4/... (or /core-2/..., /core-3/...) route while another core is active, switch to the matching core automatically.
- Persist the selected core in localStorage and restore it on reload (default: CORE 2 on first load).
- Add a short (150-200ms) fade transition on the menu list when switching so it doesn't feel jarring.
- Use the core in the URL structure, e.g. /core-2/operations/redeem-transactions, so page reloads land on the right core.

## 4. Extra details

- Show a tiny badge next to the "StickPanel" logo in the sidebar header with the active core name (e.g. "CORE 2"), so the context is always visible.
- Breadcrumbs include the core as the first level: "CORE 2 / Operations / Redeem Transactions", "CORE 4 / Master / Company".
- Update the browser tab title to include the active core.
- If the sidebar is collapsed, the profile card shows only the avatar, and the popover still works.
- Don't change any existing page content, table, tabs, or actions. This task only adds the switcher and the menu filtering.

## Acceptance checklist
- [ ] CORE 2 shows: Operations, Sales, Master (placeholder), Account
- [ ] CORE 3 shows: Master (existing submenus), Inventory, QC, Deal Testing, Account
- [ ] CORE 4 shows: Master (8 submenus), Account
- [ ] Selected core survives a page reload
- [ ] Opening a /core-X/... URL switches to that core
- [ ] No leftover menu items or active states from the previous core
```

---

# PART B: Shared Base for CORE 4 Master Pages

Run once, before any per-page prompt.

```
Create a set of Master Data pages for StickPanel under the sidebar menu Master, visible ONLY when the active core is CORE 4. Follow the existing design system and the layout pattern of the Redeem Transactions page: breadcrumb, page title + subtitle, primary action button top-right, a white card containing search + filters, a table, and "Showing x-y of n items" with pagination. Front-end only, with mock data (8-12 realistic rows per page, Indonesian context). Keep the existing sidebar, colors, and typography.

Rules for ALL master pages:
- Hide id and uuid from forms. Show "Updated at" in tables (format: Feb 17, 2025). Never show deleted_at as a column.
- Every list page has: search, sortable columns, pagination, an "Add <Entity>" primary button, and row actions (Edit, Delete) in an actions column.
- Delete = confirmation dialog, then soft delete. Add a "Show deleted" toggle above the table; deleted rows appear greyed with a Restore action.
- If a record is referenced by another (e.g. a company that has products), block deletion and show: "Can't delete: used by N products."
- Forms: inline validation, required-field asterisks, "Save" / "Cancel" buttons, success toast after save, loading skeleton on the table, and a friendly empty state with an Add button.
- Unique name validation (case-insensitive) on all name/text fields.
- Image upload fields: preview thumbnail, replace/remove, accept png/jpg, max 2MB.
- Each page is its own route under /core-4/master/<slug>, added as a submenu item under Master (CORE 4). Breadcrumb: CORE 4 / Master / <Page>.

Submenu order: Company, Product Category, Product, Price, Brand, City, Quotation Term Moment, Quotation Term Due.
Build the shared components once (PageHeader, DataTable, FormDrawer, ConfirmDialog, ImageUpload, StatusPill) and reuse them in every page below.
```

---

# PART C: Per-Page Prompts

Run one at a time. Simple pages first (C1 to C5) so shared components get proven before the complex ones.

## C1. City

```
Build the "City" master page (/core-4/master/city). Table columns: Name, Updated at, Actions. Add/Edit in a right-side drawer with one field: Name (required, max 100). Subtitle: "Manage cities used across the platform". Mock data: Jakarta, Surabaya, Bandung, Medan, Semarang, Makassar, Denpasar, Yogyakarta.
```

## C2. Brand

```
Build the "Brand" master page (/core-4/master/brand). Table columns: Name, Updated at, Actions. Drawer form with one field: Name (required, max 150). Subtitle: "Manage advertiser brands". Mock data: 10 fictional Indonesian-style brands.
```

## C3. Quotation Term Moment

```
Build the "Quotation Term Moment" master page (/core-4/master/quotation-term-moment). Table columns: Text, Updated at, Actions. Drawer form with one field: Text (required, max 200). Subtitle: "Options for when payment is due, shown in quotations". Mock data: Before broadcast, After broadcast, Upon signing, End of month.
```

## C4. Quotation Term Due

```
Build the "Quotation Term Due" master page (/core-4/master/quotation-term-due) using the exact same layout as Quotation Term Moment. Field: Text (required, max 200). Subtitle: "Payment due periods shown in quotations". Mock data: 7 days, 14 days, 30 days, 45 days, 60 days.
```

## C5. Price (price tiers)

```
Build the "Price" master page (/core-4/master/price). This defines price tiers/lists (e.g. Standard, Agency, Corporate). Table columns: Name, Products using it (count), Updated at, Actions. Drawer form with one field: Name (required, max 100). Deleting a price tier that is used by products is blocked. Subtitle: "Price tiers applied to products". Mock data: Standard, Agency, Corporate, Government, Promo.
```

## C6. Product Category

```
Build the "Product Category" master page (/core-4/master/product-category). Table columns: Image (40px thumbnail), Name, Quantity Unit, Duration Unit, Campaignable (green "Yes" / grey "No" pill), Products (count), Updated at, Actions. Drawer form fields: Name (required), Image (upload), Quantity Unit (required, text with suggestions: Screen, Slot, Spot), Duration Unit (required, text with suggestions: Day, Week, Month), Is Campaignable (switch, default off, helper text: "Products in this category can be used in campaigns"). Filters: Campaignable (All / Yes / No). Mock data: 6 categories, e.g. Digital Screen, Taxi Top, Billboard, In-Car Display.
```

## C7. Company

```
Build the "Company" master page (/core-4/master/company). List table columns: Logo, Name, Abbr, Phone, URL, Products (count), Updated at, Actions. Add/Edit opens a FULL PAGE form (not a drawer) with a sticky header (Save / Cancel) and 3 card sections:
1. General: Name (required), Abbr (required, max 10, auto-uppercase), Increment (number, min 0, helper: "Running counter used for quotation numbering"), Logo image (upload), Address (textarea), URL, Phone.
2. Quotation PDF Content: four textareas with a character counter: Notes, Customer Data, Cancellation Policy, Terms and Condition.
3. Payment: Payment To (textarea, helper: "Bank/account details printed on the quotation").
Include a small side preview card showing how the Logo + Name + Abbr will appear on the quotation header. Mock data: 4 companies.
```

## C8. Product

Run after Company, Product Category, and Price exist, since it references all three.

```
Build the "Product" master page (/core-4/master/product). List table columns: Image, Name, Company, Category, Quantity Unit, Duration Unit, Prices (e.g. "3 tiers · Rp 500.000 – Rp 1.200.000"), Active (switch that toggles inline with a toast), Updated at, Actions. Filters: Company, Category, Active (All/Active/Inactive). Search by product name.
Add/Edit opens a FULL PAGE form with sections:
1. General: Company (select, required), Product Category (select, required), Name (required), Image (upload), Quantity Unit and Duration Unit (auto-filled from the selected category but editable), Active (switch, default on).
2. Pricing: an editable table where each row = Price tier (select from the Price master, no duplicates per product) + Price (currency input, IDR, min 0, 2 decimals). Buttons: "Add price tier" and a remove icon per row. Empty state: "No prices yet. Add at least one price tier."
Mock data: 10 products spread across the companies, categories, and price tiers.
```

## C9. Price Matrix (optional, for masProductPrice)

```
Build an optional page "Price Matrix" (/core-4/master/price-matrix) under Master (CORE 4), placed after Price in the submenu. A spreadsheet-style grid: rows = products (with company + category as small subtext), columns = price tiers from the Price master, cells = editable IDR price (blank = not priced). Filters: Company, Category. Edits are highlighted as unsaved; a sticky bar shows "N changes" with Save / Discard. Bulk action: select cells then "Apply % increase/decrease". This page edits the same data as the Pricing section in the Product form.
``

---

# Open Questions

- Should Quantity Unit and Duration Unit follow the category (read-only) instead of being editable per product?
- Should Increment on Company be read-only instead of editable?
- What are real examples of Term Moment and Term Due, so mock data and helper text match the quotations?
- Do CORE 2 and CORE 3 need different default landing pages than Redeem Transactions and Inventory?
