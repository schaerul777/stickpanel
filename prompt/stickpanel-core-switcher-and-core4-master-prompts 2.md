# StickPanel Prototype: Complete Prompt Pack

Front-end prototype only (mock data, no backend, no auth). Run the parts in order, one prompt at a time, and check the result before moving on.

**Run order**
1. Part A: Core Switcher
2. Part B: Shared base for CORE 4 Master pages
3. Part C: Per-page prompts (C1 to C9)
4. Part D: Client Profile (CORE 4) — D0 to D7

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

**Part D assumptions (edit if wrong)**
- Client Profile is a prototype-only simulation of the CORE4 hybrid data-scope PRD (Sep 11, 2026). Real RBAC, auth, and the Company Account switcher don't exist in this front-end prototype, so they're simulated with a dedicated "Active Company" selector and a dev-only permission-toggle panel, both scoped to the Client Profile pages only.
- Client Profile is added as a new submenu under Master (CORE 4), after Product, alongside two new small lookup pages it depends on: Industry and Bank.
- "Has quotations" (used to block removing a company link) is a mock flag on the company-link record, since Quotation isn't built in this prototype yet.
- Sales / Verified By come from a static mock "Admin Users" list, not a real users page.

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
```

---

# PART D: Client Profile (CORE 4)

Simulates the hybrid global/strict data-scope PRD: lookup data is global, Client Profile and Client Contact are visible only to the companies they're linked to, and Billing/Bank Account/Phone follow their parent client. Run D0 first, then D1–D7 in order (each detail tab depends on the shell built in D2).

## D0. Setup: lookups, Active Company selector, permission simulator

```
Add Client Profile as a new master feature under Master (CORE 4). This models a real multi-company hybrid access rule as a UI simulation (front-end only, no real auth/backend).

1. New submenu items under Master (CORE 4), placed after Product: "Industry" (/core-4/master/industry), "Bank" (/core-4/master/bank), "Client Profile" (/core-4/master/client-profile). Industry and Bank use the same simple list+drawer pattern as City and Brand (single field: Name, required, max 100/150). Mock data — Industry: F&B, Retail, Automotive, FMCG, Property, Technology, Finance, Education. Bank: BCA, Mandiri, BNI, BRI, CIMB Niaga, Permata.

2. Add an "Active Company" selector, separate from the CORE Switcher, visible ONLY inside CORE 4 Master → Client Profile pages (list, detail, and any related forms). Place it as a dropdown in the page header, next to the breadcrumb, labeled "Viewing as: <Company>". Use the same 4 mock companies created in the Company master page. Persist the selection in localStorage. Switching it re-filters the Client Profile list and re-evaluates every "linked to this company" check on the page you're viewing; if the client open in a detail view is not linked to the newly selected company, redirect to the Client Profile list and show a toast: "This client isn't linked to <Company>."

3. Add a small dev-only "Simulate permissions" panel, collapsed by default, reachable from a gear icon near the Active Company selector. It lists toggles for: client-profile:write, client-profile:delete, client-profile:verify, client-profile.company:write, client-contact:write, client-contact:verify, client-billing:write, client-bank-account:write. All on by default. Toggling one off hides or disables the matching button/action anywhere in Client Profile (Create/Edit/Delete buttons, Verify buttons, Add/Edit/Remove company link, etc.) so we can demo the access rules without real accounts. Label it clearly as a prototype-only tool, visually distinct (dashed border, "Prototype only" tag).

4. Add a mock "Admin Users" list used only as the source for Sales and Verified By selects (not a page, just static data): 6 names with role "Sales" or "Finance".
```

## D1. Client Profile list + create/edit

```
Build the "Client Profile" list page (/core-4/master/client-profile), scoped to the Active Company selected in the header (only show clients linked to that company).

Columns: Name, Brand, City, Industry, Sales, Verified (green "Verified" / grey "Not verified" pill), Updated at, Actions.
Search: matches name, email, or tax number.
Filters: Verified (All/Verified/Not verified), City, Industry, Sales.
Primary button: "Add Client".
Row actions: View (opens detail), Edit, Delete (gated by client-profile:delete from the permission panel).
Mock data: 10 clients, spread so at least 3 are linked to more than one company (use this to demo scoping when the Active Company selector changes) and at least 2 are Verified for one company but Not verified for another (since verification is per company).

Create/Edit (full page form, since this has many fields), sections:
1. Company Details: Name (required), Brand — free text (brandText) plus a Brand select from Master Brand, Email (required, valid format), Website, City (select, required), Zip Code, Billing Address (textarea, required), Industry (select, required), Tax Number (required; on blur, check it against existing clients — if a match is found, don't save; instead show a dialog: "Client already exists: <Client Name>. Link to <Active Company>?" with "Link" and "Cancel" buttons; "Link" takes the user to that existing client's Companies tab with the Add Company form pre-filled).
2. Documents: four upload fields — Tax Document, SIUP, TDP, Domisili (accept jpg/png/pdf, max 5MB each, preview/replace/remove).
3. This Company's Link (only shown/editable on create, since edit uses the Companies tab instead): Company (pre-filled with the Active Company, read-only here), Sales (select from the mock Admin Users), Verified By and Verified At (read-only, blank until verified).

Gate the "Add Client" and row-level Edit/Delete buttons behind the client-profile:write / client-profile:delete toggles from the permission panel.
```

## D2. Client detail page shell

```
Build the Client Profile detail page (/core-4/master/client-profile/:id) with a header (client Name, Brand, a Verified/Not Verified pill for the Active Company, back button) and 5 tabs: Profile, Contacts, Billings, Bank Accounts, Companies. If the opened client isn't linked to the Active Company, don't render the page — redirect to the list with the toast described in the setup prompt.

Tab bar matches the existing tab style used on the Redeem Transactions page (underline on active tab, counts in parentheses where relevant, e.g. "Contacts (3)").
```

## D3. Profile tab

```
Build the "Profile" tab of the Client Profile detail page. Show the client's global fields (Name, Brand, Email, Website, City, Zip Code, Billing Address, Industry, Tax Number, the 4 documents as thumbnail previews with a "View" link) as a read-only summary card, with an "Edit" button that opens the same form used in Add Client (gated by client-profile:write).

Below it, a "This Company" card scoped to the Active Company: Sales, Verified status, Verified By, Verified At. Include a "Verify" button (or "Unverify" if already verified) gated by client-profile:verify. Verifying sets Verified By to a mock current admin user and Verified At to now, and flips the header pill to "Verified". Show a helper note: "Only verified clients can be selected in Quotation for this company."
```

## D4. Contacts tab

```
Build the "Contacts" tab of the Client Profile detail page, scoped to the Active Company (only show contacts linked to it).

Table columns: Name, Salutation, Position, Email, Phone (first number, with a "+N more" if there are several), Primary (star icon on the primary contact for this company), Active (pill), Verified (pill), Actions (Edit, Deactivate, Verify/Unverify).
Primary button: "Add Contact".

Add/Edit drawer fields: Salutation (select: Mr, Mrs, Ms), Name (required), Position, Email (required, must be unique across all contacts — show inline error "This email is already used by another contact" if it matches mock data), Office Email, Phone Numbers (repeater: number + type select Mobile/Office, add/remove rows), Active (toggle, default on).
Company link fields shown in the same drawer: Company (pre-filled with Active Company, read-only), Primary Contact for this company (toggle — turning it on automatically turns off the primary toggle on any other contact of this client for this company, with a small inline note explaining that).

Verify Contact action behaves like Verify on the Profile tab (sets Verified By/At for the Active Company), gated by client-contact:verify. Add/Edit gated by client-contact:write.
Mock data: 2-4 contacts per client, with exactly one primary per company.
```

## D5. Billings tab

```
Build the "Billings" tab of the Client Profile detail page. A client can have many billings (not scoped by company — these follow the client).

Table columns: Name, Email, Primary (star icon), Billing Address (truncated), Updated at, Actions (Edit, Delete).
Primary button: "Add Billing".

Add/Edit drawer fields: Name (required), Email (required), Phone Number, Mobile Number, Fax Number, Billing Address (textarea, required), Shipping Address (textarea), Primary (toggle — the first billing created for a client defaults to primary and turning one on turns off any other), NPWP, KTP, NPWP Image and KTP Image (upload, jpg/png/pdf, max 5MB), Extra Notes (textarea).
Gate Add/Edit/Delete behind client-billing:write; hide the whole tab content behind client-billing:read (show "You don't have access to Billings" if off).
Mock data: 1-3 billings per client.
```

## D6. Bank Accounts tab

```
Build the "Bank Accounts" tab of the Client Profile detail page. A client can have many bank accounts (not scoped by company).

Table columns: Bank, Account Holder, Account Number (masked, e.g. "•••• 4821" with a reveal toggle), Branch, Actions (Edit, Delete).
Primary button: "Add Bank Account".
Add/Edit drawer fields: Bank (select from Master Bank, required), Account Holder (required), Account Number (required, numeric only, validated), Branch.
Gate the whole tab behind client-bank-account:read, and Add/Edit/Delete behind client-bank-account:write — per the PRD this needs an extra permission beyond seeing the client itself.
Mock data: 1-2 bank accounts per client.
```

## D7. Companies tab

```
Build the "Companies" tab of the Client Profile detail page. Shows every company this client is linked to (not scoped to the Active Company — this tab is where scoping is managed).

Table columns: Company (logo + name), Sales, NetSuite ID, Jurnal ID, Verified (pill), Actions (Edit, Remove).
Primary button: "Add Company Link" — opens a drawer with Company (select, excluding companies already linked), Sales (select), NetSuite Customer ID, Jurnal ID Customer ID.
Edit opens the same drawer for Sales / NetSuite ID / Jurnal ID Customer ID (Company itself isn't editable once linked).
Remove opens a confirm dialog. If the mock data marks that company link as "has quotations" (a flag you add to the mock company-link records), block removal and show: "Can't remove: this client has quotations under <Company>." Otherwise remove the link (client stays, just unlinked) — if the removed company is the current Active Company, redirect to the Client Profile list after removing.
Gate Add/Edit/Remove behind client-profile.company:write.
Mock data: most clients linked to 1 company, 2-3 clients linked to 2 companies (matching the ones set up in D1), with one of those links flagged as "has quotations" to demo the block.
```

---

# Open Questions

- Should Quantity Unit and Duration Unit follow the category (read-only) instead of being editable per product?
- Should Increment on Company be read-only instead of editable?
- What are real examples of Term Moment and Term Due, so mock data and helper text match the quotations?
- Do CORE 2 and CORE 3 need different default landing pages than Redeem Transactions and Inventory?

**Part D open questions**
- The PRD itself flags an unresolved point: whether Client Portal login should be standardized on CORE2 or CORE3 — out of scope for this front-end prototype, but worth tracking.
- Should the "Active Company" selector be a separate control, or should it reuse/extend the Core Switcher's profile card since CORE4 already has the concept of an active company?
- Is the Client Portal (contacts logging in with email/password) in scope for this prototype at all, or purely a backend concern for later?
